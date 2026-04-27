import { extractDomain } from "./extract-domain";

const ATS_DOMAINS = [
  "ashbyhq.com",
  "greenhouse.io",
  "lever.co",
  "workday.com",
];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchEmailToJob(
  email: { subject: string; snippet: string; from: string },
  jobs: { id: string; company: string; title: string; status?: string }[]
) {
  const text = `${email.subject} ${email.snippet}`.toLowerCase();
  const domain = extractDomain(email.from);

  for (const job of jobs) {
    const company = job.company || "";
    const normCompany = normalize(company);

    if (!company || company === "unknown") continue;

    // 1. direct company match
    if (text.includes(company.toLowerCase())) {
      return job;
    }

    // 2. normalized match
    if (normalize(text).includes(normCompany)) {
      return job;
    }

    // 3. domain match
    if (domain && domain.includes(normCompany)) {
      return job;
    }

    // 4. ATS domains (fallback signal)
    if (domain && ATS_DOMAINS.some((d) => domain.includes(d))) {
      if (text.includes(company.toLowerCase())) {
        return job;
      }
    }
  }

  return null;
}
