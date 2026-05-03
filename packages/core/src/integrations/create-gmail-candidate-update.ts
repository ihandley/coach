import type { JobRecord } from "../jobs/types";
import type { GmailMessage } from "./gmail-message-types";
import { extractGmailUpdate } from "./extract-gmail-update";
import { matchGmailMessageToJob } from "./match-gmail-message-to-job";

export function createGmailCandidateUpdate({
  message,
  jobs,
}: {
  message: GmailMessage;
  jobs: JobRecord[];
}): {
  jobId: string;
  messageId: string;
  status: "interviewing" | "rejected";
  note: string;
} | null {
  const matchedJob = matchGmailMessageToJob({
    message,
    jobs,
  });

  if (!matchedJob) {
    return null;
  }

  const extractedUpdate = extractGmailUpdate({
    subject: message.subject,
    snippet: message.snippet,
  });

  if (!extractedUpdate) {
    return null;
  }

  return {
    jobId: matchedJob.jobId,
    messageId: message.id,
    status: extractedUpdate.status,
    note: extractedUpdate.note,
  };
}
