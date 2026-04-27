export function matchEmailToJob(
  email: { subject: string; snippet: string; from: string },
  jobs: { id: string; company: string; title: string; status?: string }[]
) {
  const text = `${email.subject} ${email.snippet} ${email.from}`.toLowerCase();

  for (const job of jobs) {
    const company = (job.company || "").toLowerCase();

    if (!company || company === "unknown") continue;

    if (text.includes(company)) {
      return job;
    }
  }

  return null;
}
