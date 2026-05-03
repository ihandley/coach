export function extractGmailUpdate({
  subject,
  snippet,
}: {
  subject: string;
  snippet: string;
}): { status: "interviewing" | "rejected"; note: string } | null {
  const normalizedText = `${subject} ${snippet}`.toLowerCase();

  if (normalizedText.includes("interview")) {
    return {
      status: "interviewing",
      note: snippet,
    };
  }

  if (
    normalizedText.includes("not to move forward") ||
    normalizedText.includes("rejected") ||
    normalizedText.includes("unfortunately")
  ) {
    return {
      status: "rejected",
      note: snippet,
    };
  }

  return null;
}
