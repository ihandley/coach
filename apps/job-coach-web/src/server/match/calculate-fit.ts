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

const STOP_WORDS = new Set([
  "about",
  "and",
  "are",
  "company",
  "culture",
  "dynamic",
  "engineer",
  "engineering",
  "fast",
  "for",
  "from",
  "have",
  "job",
  "mission",
  "obsessed",
  "opportunity",
  "our",
  "partner",
  "passionate",
  "that",
  "the",
  "this",
  "team",
  "use",
  "with",
  "world",
  "you",
  "your",
]);

const SIGNAL_PHRASES = [
  "distributed systems",
  "machine learning",
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
  data: "data",
  fintech: "fintech",
  healthcare: "healthcare",
  ml: "ML",
  platform: "platform",
  react: "React",
  typescript: "TypeScript",
};

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
  const formatted = terms
    .slice(0, 5)
    .map(formatTerm)
    .filter(Boolean);

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
    (token) => !phraseSignals.some((phrase) => phrase.split(/\s+/).includes(token)),
  );

  return Array.from(new Set([...phraseSignals, ...tokenSignals])).slice(0, 8);
}

function getSenioritySignal(text: string) {
  const lower = text.toLowerCase();

  if (/\b(staff|principal|lead|senior|sr)\b/.test(lower)) return "senior";
  if (/\b(junior|jr|entry)\b/.test(lower)) return "junior";

  return null;
}

function createMatchDetails(job: Job, resumeText: string, score: number) {
  const title = job.title?.trim() || "this role";
  const roleSignals = getRoleSignals(job);
  const resumeSignalText = resumeText.toLowerCase();
  const resumeTokens = new Set(uniqueMeaningfulTokens(tokenize(resumeText)));
  const matchedTerms = roleSignals.filter(
    (term) => resumeSignalText.includes(term) || term.split(/\s+/).some((token) => resumeTokens.has(token)),
  );
  const missingTerms = roleSignals.filter((term) => !matchedTerms.includes(term));
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (matchedTerms.length > 0) {
    strengths.push(
      `Resume shows relevant evidence around ${formatTerms(matchedTerms, "the role")} for ${title}.`,
    );
  }

  const seniority = getSenioritySignal([job.title, job.sourceText].filter(Boolean).join(" "));
  if (seniority && getSenioritySignal(resumeText) === seniority) {
    strengths.push(`Seniority signal appears aligned for a ${seniority}-level role.`);
  } else if (seniority) {
    gaps.push(`Seniority alignment is unclear for a ${seniority}-level role.`);
  }

  if (missingTerms.length > 0) {
    gaps.push(
      `The application would be stronger with clearer evidence of ${formatTerms(
        missingTerms,
        "the core role requirements",
      )}.`,
    );
  }

  if (strengths.length === 0) {
    strengths.push(`Resume evidence for ${title} is limited in the current resume text.`);
  }

  if (gaps.length === 0 && score > 0) {
    gaps.push("The main role signals are already represented clearly in the resume text.");
  }

  const reasons = [...strengths, ...gaps];
  const recommendationFocus = formatTerms(
    [...matchedTerms, ...missingTerms],
    "the strongest role signals",
  );
  const recommendation =
    score >= 76
      ? `Strong overlap detected. Prioritize ${title} and tailor the resume toward ${recommendationFocus}.`
      : score >= 51
        ? `Good overlap detected. Tailor the resume toward ${recommendationFocus} before applying.`
        : score >= 26
          ? `Moderate overlap detected. Tailoring the resume toward ${recommendationFocus} would strengthen the application.`
          : `Weak overlap detected. Build clearer resume evidence around ${recommendationFocus} before prioritizing this role.`;

  return { strengths, gaps, reasons, recommendation };
}

export function calculateFit(job: Job, resume: Resume): FitResult {
  const jobText = [job.title, job.company, job.sourceText].filter(Boolean).join(" ");

  const resumeText = resume.rawText ?? "";

  const jobTokens = tokenize(jobText);
  const resumeTokens = tokenize(resumeText);

  const score = Math.round(overlap(jobTokens, resumeTokens) * 100);
  const matchDetails = createMatchDetails(job, resumeText, score);

  return {
    score,
    reasons: matchDetails.reasons,
    matchDetails,
  };
}
