import { isActionableMatch } from "@/lib/email/isActionableMatch";
type Job = {
  id: string;
  company: string;
  title: string;
  applyUrl?: string;
};

type Email = {
  subject: string;
  from: string;
  body: string;
};

export type MatchResult = {
  jobId: string;
  score: number;
  signals: string[];
};

const ATS_DOMAINS = [
  'ashbyhq.com',
  'greenhouse.io',
  'lever.co',
  'workday.com',
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

function tokenOverlap(a: string, b: string) {
  const aTokens = new Set(normalize(a).split(/\s+/));
  const bTokens = new Set(normalize(b).split(/\s+/));

  let overlap = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) overlap++;
  }

  return overlap / Math.max(aTokens.size, 1);
}

function extractDomain(from: string) {
  const match = from.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

export function matchEmailToJob(email: Email, jobs: Job[]): MatchResult | null {
  let best: MatchResult | null = null;

  const content = `${email.subject} ${email.body}`;

  for (const job of jobs) {
    let score = 0;
    const signals: string[] = [];

    const normalizedCompany = normalize(job.company);
    const normalizedContent = normalize(content);

    if (normalizedContent.includes(normalizedCompany)) {
      score += 0.4;
      signals.push('company');
    }

    const domain = extractDomain(email.from);
    if (domain && domain.includes(normalizedCompany)) {
      score += 0.3;
      signals.push('domain');
    }

    if (ATS_DOMAINS.some(d => domain.includes(d))) {
      score += 0.2;
      signals.push('ats');
    }

    const overlap = tokenOverlap(job.title, content);
    if (overlap > 0.3) {
      score += overlap * 0.5;
      signals.push('title');
    }

    if (!best || score > best.score) {
      best = {
        jobId: job.id,
        score,
        signals,
      };
    }
  }

  if (best && best.score >= 0.5) {
    return best;
  }

  return null;
}
