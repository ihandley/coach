export function createApplicationEventsFromGmailUpdate({
  jobId,
  messageId,
  status,
  note,
}: {
  jobId: string;
  messageId: string;
  status: "interviewing" | "rejected";
  note: string;
}): Array<{
  jobId: string;
  type: "status_changed" | "note_added";
  note: string;
}> {
  return [
    {
      jobId,
      type: "status_changed",
      note: `gmail:${messageId} status -> ${status}`,
    },
    {
      jobId,
      type: "note_added",
      note: `gmail:${messageId} ${note}`,
    },
  ];
}
