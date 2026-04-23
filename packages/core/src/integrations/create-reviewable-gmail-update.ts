export function createReviewableGmailUpdate({
    jobId,
    messageId,
    status,
    note,
}: {
    jobId: string;
    messageId: string;
    status: "interviewing" | "rejected";
    note: string;
}): {
    jobId: string;
    messageId: string;
    status: "interviewing" | "rejected";
    note: string;
    decision: "pending";
} {
    return {
        jobId,
        messageId,
        status,
        note,
        decision: "pending",
    };
}
