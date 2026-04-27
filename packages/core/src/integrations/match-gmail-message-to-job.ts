import type { JobRecord } from "../jobs/types";
import type { GmailMessage } from "./gmail-message-types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function getDomain(email?: string): string | null {
  if (!email) return null;
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

export function matchGmailMessageToJob({
  message,
  jobs,
}: {
  message: GmailMessage;
  jobs: JobRecord[];
}): { jobId: string; confidence: number } | null {
  const subject = normalize(message.subject || "");
  const fromDomain = getDomain(message.from);

  let bestMatch: { job: JobRecord; score: number } | null = null;

  for (const job of jobs) {
    if (!job.company || job.company.toLowerCase() === "unknown") continue;

    const company = normalize(job.company);

    let score = 0;

    // Company name match in subject
    if (subject.includes(company)) {
      score += 2;
    }

    // Domain match
    if (fromDomain && company && fromDomain.includes(company)) {
      score += 3;
    }

    // Title overlap (basic token match)
    if (job.title) {
      const titleTokens = normalize(job.title).split(" ");
      const overlap = titleTokens.filter((t) => subject.includes(t)).length;
      score += Math.min(overlap, 2); // cap
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { job, score };
    }
  }

  if (!bestMatch || bestMatch.score < 2) {
    return null;
  }

  const confidence = Math.min(bestMatch.score / 5, 1);

  return {
    jobId: bestMatch.job.id,
    confidence,
  };
}
