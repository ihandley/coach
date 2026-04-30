import type { JobRecord } from "../jobs/types.ts";
import type { GmailMessage } from "./gmail-message-types.ts";
import { extractGmailUpdate } from "./extract-gmail-update.ts";
import { matchGmailMessageToJob } from "./match-gmail-message-to-job.ts";

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
