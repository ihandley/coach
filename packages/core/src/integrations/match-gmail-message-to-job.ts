import type { JobRecord } from "../jobs/types";
import type { GmailMessage } from "./gmail-message-types";

export function matchGmailMessageToJob({
    message,
    jobs,
}: {
    message: GmailMessage;
    jobs: JobRecord[];
}): { jobId: string } | null {
    const normalizedSubject = message.subject.toLowerCase();

    const matchedJob = jobs.find((job) =>
        normalizedSubject.includes(job.company.toLowerCase()),
    );

    if (!matchedJob) {
        return null;
    }

    return {
        jobId: matchedJob.id,
    };
}
