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
  "for",
  "from",
  "have",
  "our",
  "that",
  "the",
  "this",
  "with",
  "you",
  "your",
]);

function uniqueMeaningfulTokens(tokens: string[]) {
  return Array.from(
    new Set(
      tokens.filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !/^\d+$/.test(token)),
    ),
  );
}

function formatTerms(terms: string[]) {
  return terms
    .slice(0, 5)
    .map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(", ");
}

function getSenioritySignal(text: string) {
  const lower = text.toLowerCase();

  if (/\b(staff|principal|lead|senior|sr)\b/.test(lower)) return "senior";
  if (/\b(junior|jr|entry)\b/.test(lower)) return "junior";

  return null;
}

function createMatchDetails(job: Job, resumeText: string, score: number) {
  const title = job.title?.trim() || "this role";
  const jobTokens = uniqueMeaningfulTokens(
    tokenize(
      [job.title, job.company, job.sourceText, JSON.stringify(job.structuredSummary ?? "")]
        .filter(Boolean)
        .join(" "),
    ),
  );
  const resumeTokens = new Set(uniqueMeaningfulTokens(tokenize(resumeText)));
  const matchedTerms = jobTokens.filter((token) => resumeTokens.has(token));
  const missingTerms = jobTokens.filter((token) => !resumeTokens.has(token));
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (matchedTerms.length > 0) {
    strengths.push(`Resume evidence overlaps with ${title}: ${formatTerms(matchedTerms)}.`);
  }

  const seniority = getSenioritySignal([job.title, job.sourceText].filter(Boolean).join(" "));
  if (seniority && getSenioritySignal(resumeText) === seniority) {
    strengths.push(`Seniority signal appears aligned for a ${seniority}-level role.`);
  } else if (seniority) {
    gaps.push(`Seniority alignment is unclear for a ${seniority}-level role.`);
  }

  if (missingTerms.length > 0) {
    gaps.push(`Resume evidence is thin for requested areas: ${formatTerms(missingTerms)}.`);
  }

  if (strengths.length === 0) {
    strengths.push(`No strong resume overlap was found for ${title} in the current resume text.`);
  }

  if (gaps.length === 0 && score > 0) {
    gaps.push("No major keyword gaps were found in the current resume text.");
  }

  const reasons = [...strengths, ...gaps];
  const recommendation =
    score >= 80
      ? `Strong fit for ${title}. Prioritize this role and tailor the resume around the strongest matches.`
      : score >= 60
        ? `Good fit for ${title}. Worth applying with a tailored resume that reinforces the strongest overlaps.`
        : score >= 40
          ? `Moderate fit for ${title}. Consider applying if the role is interesting, but tailor carefully around the gaps.`
          : `Weak fit for ${title}. Apply only if there is strong interest or missing resume context.`;

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
