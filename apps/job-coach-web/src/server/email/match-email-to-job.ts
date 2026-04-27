import { extractDomain } from "./extract-domain";

const ATS_DOMAINS = [
  "ashbyhq.com",
  "greenhouse.io",
  "lever.co",
  "workday.com",
];

type Email = { subject: string; snippet: string; from: string };
type Job = { id: string; company: string; title: string; status?: string };

type MatchResult = {
  job: Job;
  confidence: number;
  reasons: string[];
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenize(s: string) {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function tokenOverlap(a: string[], b: string[]) {
  const bSet = new Set(b);
  return a.filter((token) => bSet.has(token)).length;
}

export function matchEmailToJob(
  email: Email,
  jobs: Job[]
): MatchResult | null {
  const text = `${email.subject} ${email.snippet}`.toLowerCase();
  const normalizedText = normalize(text);
  const textTokens = tokenize(text);
  const domain = extractDomain(email.from);
  let bestMatch: MatchResult | null = null;

  for (const job of jobs) {
    const company = job.company || "";
    const normCompany = normalize(company);

    if (!company || company.toLowerCase() === "unknown" || !normCompany) continue;

    const titleTokens = tokenize(job.title || "");
    const overlap = tokenOverlap(titleTokens, textTokens);
    const reasons: string[] = [];
    let score = 0;

    if (text.includes(company.toLowerCase())) {
      score += 50;
      reasons.push("company name");
    }

    if (normalizedText.includes(normCompany)) {
      score += 40;
      reasons.push("normalized company name");
    }

    if (domain && domain.includes(normCompany)) {
      score += 35;
      reasons.push("sender domain");
    }

    if (domain && ATS_DOMAINS.some((d) => domain.includes(d))) {
      score += 15;
      reasons.push("known ATS sender");
    }

    if (overlap > 0) {
      score += Math.min(overlap * 15, 30);
      reasons.push("job title overlap");
    }

    if (score <= 0) continue;

    const match = {
      job,
      confidence: Math.min(score, 100),
      reasons,
    };

    if (!bestMatch || match.confidence > bestMatch.confidence) {
      bestMatch = match;
    }
  }

  return bestMatch;
}
