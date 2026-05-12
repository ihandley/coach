export type FitResult = {
  score: number;
  reasons: string[];
  matchDetails: {
    strengths: string[];
    gaps: string[];
    reasons: string[];
    recommendation: string;
  };
};

type Job = {
  title?: string;
  company?: string;
  sourceText?: string;
  structuredSummary?: unknown;
};

type Resume = {
  rawText?: string;
};

function tokenize(text: string): string[] {
  return (text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function overlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  let hits = 0;

  for (const t of a) {
    if (setB.has(t)) hits++;
  }

  return a.length ? hits / a.length : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

const STOP_WORDS = new Set([
  "about",
  "ability",
  "and",
  "are",
  "assume",
  "build",
  "collaborate",
  "communication",
  "company",
  "culture",
  "dynamic",
  "engineer",
  "engineering",
  "excellent",
  "fast",
  "for",
  "from",
  "have",
  "job",
  "join",
  "mission",
  "obsessed",
  "opportunity",
  "our",
  "partner",
  "passionate",
  "responsible",
  "responsibilities",
  "role",
  "that",
  "the",
  "this",
  "team",
  "teams",
  "use",
  "work",
  "working",
  "with",
  "world",
  "you",
  "your",
]);

const SIGNAL_PHRASES = [
  "agent tooling",
  "architecture decisions",
  "distributed systems",
  "elasticsearch",
  "gcp",
  "machine learning",
  "mcp",
  "mentoring",
  "payments",
  "physical-world systems",
  "platform reliability",
  "postgres",
  "predictive analytics",
  "product engineering",
  "typeScript",
  "healthcare",
  "analytics",
  "fintech",
  "platform",
  "react",
  "apis",
  "data",
  "ml",
  "ai",
];

const TERM_LABELS: Record<string, string> = {
  ai: "AI",
  apis: "APIs",
  architecture: "architecture",
  data: "data",
  distributed: "distributed systems",
  elasticsearch: "Elasticsearch",
  fintech: "fintech",
  gcp: "GCP",
  healthcare: "healthcare",
  leadership: "technical leadership",
  mcp: "MCP",
  mentoring: "mentoring",
  ml: "ML",
  payments: "payments",
  platform: "platform",
  postgres: "Postgres",
  react: "React",
  reliability: "platform reliability",
  security: "security",
  typescript: "TypeScript",
};

const ROLE_SIGNAL_TOKENS = new Set([
  ...Object.keys(TERM_LABELS),
  "agent",
  "agents",
  "architecture",
  "backend",
  "cloud",
  "frontend",
  "implementation",
  "mentor",
  "mentored",
  "principal",
  "senior",
  "staff",
  "systems",
  "technical",
  "tooling",
]);

const ROLE_FAMILIES = [
  {
    name: "software",
    patterns: [
      /\bsoftware\b/,
      /\bengineer(?:ing)?\b/,
      /\bfrontend\b/,
      /\bbackend\b/,
      /\bfull[-\s]?stack\b/,
      /\breact\b/,
      /\btypescript\b/,
      /\bplatform\b/,
      /\bapi(?:s)?\b/,
      /\bdistributed systems\b/,
    ],
  },
  {
    name: "data",
    patterns: [
      /\banalytics?\b/,
      /\bdata\b/,
      /\bmachine learning\b/,
      /\bml\b/,
      /\bai\b/,
      /\bpredictive\b/,
    ],
  },
  {
    name: "product",
    patterns: [/\bproduct\b/, /\broadmap\b/, /\bworkflow(?:s)?\b/],
  },
  {
    name: "design",
    patterns: [/\bdesign(?:er)?\b/, /\bfigma\b/, /\bbrand\b/, /\billustration\b/],
  },
  {
    name: "sales",
    patterns: [/\bsales\b/, /\baccount executive\b/, /\bquota\b/, /\bpipeline\b/],
  },
  {
    name: "marketing",
    patterns: [/\bmarketing\b/, /\bdemand generation\b/, /\bcampaigns?\b/, /\bseo\b/],
  },
  {
    name: "support",
    patterns: [/\bsupport\b/, /\bcustomer success\b/, /\bimplementation\b/],
  },
];

const LEADERSHIP_PATTERN =
  /\b(lead|led|leader|leadership|mentor|mentored|mentoring|manager|managed|staff|principal)\b/i;

function uniqueMeaningfulTokens(tokens: string[], ignoredTokens: Set<string> = new Set()) {
  return Array.from(
    new Set(
      tokens.filter(
        (token) =>
          token.length > 2 &&
          !STOP_WORDS.has(token) &&
          !ignoredTokens.has(token) &&
          !/^\d+$/.test(token),
      ),
    ),
  );
}

function formatTerm(term: string) {
  return TERM_LABELS[term] ?? term.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTerms(terms: string[], fallback: string) {
  const formatted = terms.slice(0, 5).map(formatTerm).filter(Boolean);

  if (formatted.length === 0) {
    return fallback;
  }

  if (formatted.length === 1) {
    return formatted[0];
  }

  return `${formatted.slice(0, -1).join(", ")} and ${formatted[formatted.length - 1]}`;
}

function getSignalPhrases(text: string) {
  const lower = text.toLowerCase();

  return SIGNAL_PHRASES.filter((phrase) => {
    const normalizedPhrase = phrase.toLowerCase();
    const pattern = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

    return new RegExp(`\\b${pattern}\\b`, "i").test(lower);
  }).map((phrase) => phrase.toLowerCase());
}

function getIgnoredTokens(job: Job) {
  return new Set(tokenize([job.title, job.company].filter(Boolean).join(" ")));
}

function getRoleSignals(job: Job) {
  const jobText = [job.sourceText, JSON.stringify(job.structuredSummary ?? "")]
    .filter(Boolean)
    .join(" ");
  const ignoredTokens = getIgnoredTokens(job);
  const phraseSignals = getSignalPhrases(jobText);
  const tokenSignals = uniqueMeaningfulTokens(tokenize(jobText), ignoredTokens).filter(
    (token) =>
      ROLE_SIGNAL_TOKENS.has(token) &&
      !phraseSignals.some((phrase) => phrase.split(/\s+/).includes(token)),
  );

  return Array.from(new Set([...phraseSignals, ...tokenSignals])).slice(0, 8);
}

function getSenioritySignal(text: string) {
  const lower = text.toLowerCase();

  if (/\b(staff|principal|lead|senior|sr)\b/.test(lower)) return "senior";
  if (/\b(junior|jr|entry)\b/.test(lower)) return "junior";

  return null;
}

function matchesSignal(term: string, resumeText: string, resumeTokens: Set<string>) {
  if (term.includes(" ")) {
    const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

    return new RegExp(`\\b${pattern}\\b`, "i").test(resumeText);
  }

  return resumeTokens.has(term);
}

function getSignalWeight(term: string) {
  if (term.includes(" ")) return 2.2;
  if (TERM_LABELS[term]) return 1.5;
  if (LEADERSHIP_PATTERN.test(term)) return 1.3;

  return 1;
}

function getRoleFamilies(text: string) {
  const lower = text.toLowerCase();

  return ROLE_FAMILIES.filter((family) =>
    family.patterns.some((pattern) => pattern.test(lower)),
  ).map((family) => family.name);
}

function getTitleAlignment(job: Job, resumeText: string) {
  const title = job.title ?? "";
  const resumeTokens = uniqueMeaningfulTokens(tokenize(resumeText));
  const titleTokens = uniqueMeaningfulTokens(tokenize(title));
  const titleOverlap = overlap(titleTokens, resumeTokens);
  const titleFamilies = getRoleFamilies(title);
  const resumeFamilies = getRoleFamilies(resumeText);
  const familyAligned =
    titleFamilies.length > 0 && titleFamilies.some((family) => resumeFamilies.includes(family));

  return Math.max(titleOverlap, familyAligned ? 1 : 0);
}

function calculateNumericScore(job: Job, resumeText: string) {
  const jobRoleText = [job.title, job.sourceText, JSON.stringify(job.structuredSummary ?? "")]
    .filter(Boolean)
    .join(" ");
  const roleSignals = getRoleSignals(job);
  const resumeSignalText = resumeText.toLowerCase();
  const resumeTokens = new Set(uniqueMeaningfulTokens(tokenize(resumeText)));
  const signalWeights = roleSignals.map((term) => ({
    matched: matchesSignal(term, resumeSignalText, resumeTokens),
    weight: getSignalWeight(term),
  }));
  const totalSignalWeight = signalWeights.reduce((sum, signal) => sum + signal.weight, 0);
  const matchedSignalWeight = signalWeights
    .filter((signal) => signal.matched)
    .reduce((sum, signal) => sum + signal.weight, 0);
  const signalScore = totalSignalWeight > 0 ? (matchedSignalWeight / totalSignalWeight) * 58 : 0;
  const titleScore = getTitleAlignment(job, resumeText) * 16;
  const jobSeniority = getSenioritySignal([job.title, job.sourceText].filter(Boolean).join(" "));
  const resumeSeniority = getSenioritySignal(resumeText);
  const seniorityScore = jobSeniority && resumeSeniority === jobSeniority ? 10 : 0;
  const leadershipScore =
    LEADERSHIP_PATTERN.test(jobRoleText) && LEADERSHIP_PATTERN.test(resumeText) ? 8 : 0;
  const meaningfulOverlap = overlap(
    uniqueMeaningfulTokens(tokenize([job.title, job.sourceText].filter(Boolean).join(" "))),
    uniqueMeaningfulTokens(tokenize(resumeText)),
  );
  const jobFamilies = getRoleFamilies(jobRoleText);
  const resumeFamilies = getRoleFamilies(resumeText);
  const hasFamilyMismatch =
    jobFamilies.length > 0 &&
    resumeFamilies.length > 0 &&
    !jobFamilies.some((family) => resumeFamilies.includes(family));
  let penalty = 0;

  if (hasFamilyMismatch) penalty += 20;
  if (jobSeniority && resumeSeniority && jobSeniority !== resumeSeniority) penalty += 14;
  if (LEADERSHIP_PATTERN.test(jobRoleText) && !LEADERSHIP_PATTERN.test(resumeText)) penalty += 5;

  return clampScore(
    signalScore + titleScore + seniorityScore + leadershipScore + meaningfulOverlap * 8 - penalty,
  );
}

function createMatchDetails(job: Job, resumeText: string, score: number) {
  const title = job.title?.trim() || "this role";
  const roleSignals = getRoleSignals(job);
  const resumeSignalText = resumeText.toLowerCase();
  const resumeTokens = new Set(uniqueMeaningfulTokens(tokenize(resumeText)));
  const matchedTerms = roleSignals.filter((term) =>
    matchesSignal(term, resumeSignalText, resumeTokens),
  );
  const missingTerms = roleSignals.filter((term) => !matchedTerms.includes(term));
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (matchedTerms.length > 0) {
    strengths.push(
      `Your background lines up with ${title}'s core needs: ${formatTerms(
        matchedTerms,
        "the role",
      )}. This gives the application a concrete hiring story instead of a generic fit claim.`,
    );
  }

  const seniority = getSenioritySignal([job.title, job.sourceText].filter(Boolean).join(" "));
  if (seniority && getSenioritySignal(resumeText) === seniority) {
    strengths.push(
      `The seniority signal is credible because the resume shows ${seniority}-level ownership rather than only task execution.`,
    );
  } else if (seniority) {
    gaps.push(
      `Seniority may be a hiring risk; add scope markers such as architecture decisions, mentoring, ownership area, or cross-team impact for this ${seniority}-level role.`,
    );
  }

  if (missingTerms.length > 0) {
    const missingText = formatTerms(missingTerms, "the core role requirements");
    const missingAiMcp = missingTerms.some((term) =>
      ["ai", "ml", "mcp", "agent tooling"].includes(term),
    );

    gaps.push(
      missingAiMcp
        ? `The role emphasizes AI/MCP work; make AI systems, model/tool integrations, agent tooling, or MCP ownership explicit if that experience is real.`
        : `The main application risk is missing proof of ${missingText}. Add specific resume bullets that show scope, outcomes, and the environment where that work happened.`,
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      `The current resume text has limited direct evidence for ${title}, so the fit story would need stronger role-specific examples.`,
    );
  }

  if (gaps.length === 0 && score > 0) {
    gaps.push(
      "The main role signals are represented; refinement should focus on sharper examples, metrics, and interview-ready stories rather than filling a major gap.",
    );
  }

  const reasons = [...strengths, ...gaps];
  const recommendationFocus = formatTerms(
    [...matchedTerms, ...missingTerms],
    "the strongest role signals",
  );
  const recommendation =
    score >= 76
      ? `Strong fit. Prioritize ${title}; before applying or interviewing, emphasize ${recommendationFocus} with concrete ownership, scale, and outcomes.`
      : score >= 51
        ? `Good fit with some tailoring needed. Focus the resume on ${recommendationFocus} and make the strongest examples easy for a hiring team to spot.`
        : score >= 26
          ? `Moderate fit. Consider applying if the role is attractive, but first tailor the resume toward ${recommendationFocus} and close the most visible evidence gaps.`
          : `Lower-priority fit. Pursue ${title} only if you can add credible evidence for ${recommendationFocus} or have context not captured in the resume.`;

  return { strengths, gaps, reasons, recommendation };
}

export function calculateFit(job: Job, resume: Resume): FitResult {
  const resumeText = resume.rawText ?? "";
  const score = calculateNumericScore(job, resumeText);
  const matchDetails = createMatchDetails(job, resumeText, score);

  return {
    score,
    reasons: matchDetails.reasons,
    matchDetails,
  };
}
