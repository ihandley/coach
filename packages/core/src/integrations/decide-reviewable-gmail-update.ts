export function decideReviewableGmailUpdate(
  update: {
    jobId: string;
    messageId: string;
    status: "interviewing" | "rejected";
    note: string;
    decision: "pending" | "accepted" | "rejected";
  },
  decision: "accepted" | "rejected",
): {
  jobId: string;
  messageId: string;
  status: "interviewing" | "rejected";
  note: string;
  decision: "accepted" | "rejected";
} {
  return {
    ...update,
    decision,
  };
}
