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

type SignalCategory =
  | "languages/frameworks"
  | "infrastructure/platform"
  | "AI/ML"
  | "databases"
  | "cloud/platform"
  | "domain experience"
  | "leadership/seniority"
  | "architecture/ownership";

type GapSeverity = "critical" | "major" | "minor";

type RoleSignal = {
  term: string;
  label: string;
  category: SignalCategory;
  severity: GapSeverity;
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
  "collaborative",
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
  "ai systems",
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
  "next.js",
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
  "ai systems": "AI systems",
  "agent tooling": "agent tooling",
  apis: "APIs",
  architecture: "architecture",
  "architecture decisions": "architecture decisions",
  data: "data",
  distributed: "distributed systems",
  "distributed systems": "distributed systems",
  elasticsearch: "Elasticsearch",
  fintech: "fintech",
  gcp: "GCP",
  healthcare: "healthcare",
  leadership: "technical leadership",
  mcp: "MCP",
  mentoring: "mentoring",
  ml: "ML",
  "next.js": "Next.js",
  payments: "payments",
  platform: "platform",
  "platform reliability": "platform reliability",
  postgres: "Postgres",
  "predictive analytics": "predictive analytics",
  "product engineering": "product engineering",
  react: "React",
  reliability: "platform reliability",
  rust: "Rust",
  security: "security",
  typescript: "TypeScript",
};

const SIGNAL_CATEGORIES: Record<string, SignalCategory> = {
  ai: "AI/ML",
  "ai systems": "AI/ML",
  "agent tooling": "AI/ML",
  apis: "architecture/ownership",
  architecture: "architecture/ownership",
  "architecture decisions": "architecture/ownership",
  data: "databases",
  distributed: "infrastructure/platform",
  "distributed systems": "infrastructure/platform",
  elasticsearch: "databases",
  fintech: "domain experience",
  gcp: "cloud/platform",
  healthcare: "domain experience",
  leadership: "leadership/seniority",
  mcp: "AI/ML",
  mentoring: "leadership/seniority",
  ml: "AI/ML",
  "next.js": "languages/frameworks",
  payments: "domain experience",
  platform: "infrastructure/platform",
  "platform reliability": "infrastructure/platform",
  postgres: "databases",
  "predictive analytics": "AI/ML",
  "product engineering": "architecture/ownership",
  react: "languages/frameworks",
  reliability: "infrastructure/platform",
  rust: "languages/frameworks",
  security: "domain experience",
  typescript: "languages/frameworks",
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
  "rust",
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

function getSignalPhrases(text: string) {
  const lower = text.toLowerCase();

  const matchedPhrases = SIGNAL_PHRASES.filter((phrase) => {
    const normalizedPhrase = phrase.toLowerCase();
    const pattern = escapeRegex(normalizedPhrase).replace(/\s+/g, "\\s+");

    return new RegExp(`\\b${pattern}\\b`, "i").test(lower);
  }).map((phrase) => phrase.toLowerCase());

  return matchedPhrases.filter(
    (phrase) =>
      !matchedPhrases.some((other) => other !== phrase && other.split(/\s+/).includes(phrase)),
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getIgnoredTokens(job: Job) {
  return new Set(tokenize([job.title, job.company].filter(Boolean).join(" ")));
}

function getRequirementChunks(job: Job) {
  const summary = job.structuredSummary as Record<string, unknown> | null | undefined;
  const requirements = Array.isArray(summary?.requirements)
    ? summary.requirements.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const sourceChunks = (job.sourceText ?? "")
    .split(/\n|;|•|\.(?=\s+[A-Z])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return [...requirements, ...sourceChunks];
}

function chunkHasSignal(chunk: string, term: string) {
  const normalizedTerm = term.toLowerCase();
  const pattern = escapeRegex(normalizedTerm).replace(/\s+/g, "\\s+");

  return new RegExp(`\\b${pattern}\\b`, "i").test(chunk);
}

function getSignalSeverity(job: Job, term: string): GapSeverity {
  const chunks = getRequirementChunks(job).filter((chunk) => chunkHasSignal(chunk, term));

  if (
    chunks.some((chunk) =>
      /\b(required|required experience|must|minimum qualifications?|essential)\b/i.test(chunk),
    )
  ) {
    return "critical";
  }

  if (
    chunks.some((chunk) =>
      /\b(nice\s+to\s+have|nice-to-have|bonus|familiarity with)\b/i.test(chunk),
    )
  ) {
    return "minor";
  }

  return "major";
}

function getRoleSignals(job: Job): RoleSignal[] {
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

  return Array.from(new Set([...phraseSignals, ...tokenSignals]))
    .slice(0, 8)
    .map((term) => ({
      term,
      label: formatTerm(term),
      category: SIGNAL_CATEGORIES[term] ?? "architecture/ownership",
      severity: getSignalSeverity(job, term),
    }));
}

function getSenioritySignal(text: string) {
  const lower = text.toLowerCase();

  if (/\b(staff|principal|lead|senior|sr)\b/.test(lower)) return "senior";
  if (/\b(junior|jr|entry)\b/.test(lower)) return "junior";

  return null;
}

function matchesSignal(term: string, resumeText: string, resumeTokens: Set<string>) {
  if (term.includes(" ")) {
    const pattern = escapeRegex(term).replace(/\s+/g, "\\s+");

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
  const signalWeights = roleSignals.map((signal) => ({
    matched: matchesSignal(signal.term, resumeSignalText, resumeTokens),
    weight: getSignalWeight(signal.term),
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
  const matchedSignals = roleSignals.filter((signal) =>
    matchesSignal(signal.term, resumeSignalText, resumeTokens),
  );
  const missingSignals = roleSignals.filter((signal) => !matchedSignals.includes(signal));
  const severityRank: Record<GapSeverity, number> = { critical: 0, major: 1, minor: 2 };
  const strengths = matchedSignals
    .map((signal) => `${signal.severity === "minor" ? "Moderate" : "Strong"}: ${signal.label}`)
    .slice(0, 6);
  const gaps: string[] = missingSignals
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .map(
      (signal) =>
        `${signal.severity[0].toUpperCase()}${signal.severity.slice(1)}: ${
          signal.label
        } experience not found`,
    )
    .slice(0, 6);

  const seniority = getSenioritySignal([job.title, job.sourceText].filter(Boolean).join(" "));
  if (seniority && getSenioritySignal(resumeText) === seniority) {
    strengths.push(`Strong: ${seniority}-level signal`);
  } else if (seniority) {
    gaps.push(`Critical: ${seniority}-level signal not found`);
  }

  const reasons = [...strengths, ...gaps];
  const criticalGaps = gaps.filter((gap) => gap.startsWith("Critical:")).length;
  const majorGaps = gaps.filter((gap) => gap.startsWith("Major:")).length;
  const firstGap = gaps[0]?.replace(/^(Critical|Major|Minor): /, "").replace(" not found", "");
  const recommendation = criticalGaps
    ? criticalGaps > 1
      ? "Weak fit because several required technical signals are missing."
      : `${score >= 51 ? "Strong" : "Moderate"} fit with one critical gap: ${firstGap}.`
    : majorGaps
      ? `Moderate fit due to missing ${firstGap}.`
      : `Strong fit for ${title}.`;

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
