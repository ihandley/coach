export function classifyEmail(input: {
  subject: string;
  snippet: string;
  from?: string;
}) {
  const text = `${input.subject} ${input.snippet}`.toLowerCase();

  // REJECTED (strong signals)
  if (
    text.includes("regret to inform") ||
    text.includes("not moving forward") ||
    text.includes("move forward with other candidates") ||
    text.includes("we have decided to move forward with other candidates") ||
    text.includes("we will not be moving forward") ||
    text.includes("decided not to proceed") ||
    text.includes("pursue other candidates")
  ) {
    return "rejected";
  }

  // APPLIED / RECEIVED
  if (
    text.includes("thank you for applying") ||
    text.includes("thanks for applying") ||
    text.includes("application received") ||
    text.includes("your application has been received") ||
    text.includes("we received your application")
  ) {
    return "applied";
  }

  // INTERVIEWING (tightened)
  if (
    (
      text.includes("interview") ||
      text.includes("schedule") ||
      text.includes("next steps")
    ) &&
    (
      text.includes("recruiter") ||
      text.includes("hiring") ||
      text.includes("team") ||
      text.includes("candidate") ||
      text.includes("position") ||
      text.includes("role")
    )
  ) {
    return "interviewing";
  }

  return null;
}
