import { applyStatusUpdates } from "./apply-status-updates";
import { execFileSync } from "node:child_process";
import { google } from "googleapis";
import { buildGmailQuery } from "./build-query";
import { classifyEmail } from "./classify-email";
import { matchEmailToJob } from "./match-email-to-job";

function readKeychainValue(service: string) {
  return execFileSync("security", ["find-generic-password", "-s", service, "-w"], {
    encoding: "utf8",
  }).trim();
}

export async function listRecentEmails() {
  const resJobs = await fetch("http://localhost:3000/api/jobs");
  const jobs = resJobs.ok ? await resJobs.json() : [];

  const auth = new google.auth.OAuth2(
    readKeychainValue("GOOGLE_CLIENT_ID"),
    readKeychainValue("GOOGLE_CLIENT_SECRET"),
    "http://localhost:3000/api/integrations/email/callback"
  );

  auth.setCredentials({
    refresh_token: readKeychainValue("GOOGLE_REFRESH_TOKEN"),
  });

  const gmail = google.gmail({ version: "v1", auth });
  const query = buildGmailQuery();

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 50,
    q: query,
  });

  const messages = res.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (m) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From"],
      });

      const headers = msg.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const snippet = msg.data.snippet || "";

      const detectedStatus = classifyEmail({ subject, snippet, from });
      const matchedJob = matchEmailToJob({ subject, snippet, from }, jobs);

      return {
        id: m.id,
        subject,
        from,
        snippet,
        detectedStatus,
        matchedJobId: matchedJob?.id || null,
        matchedJobTitle: matchedJob?.title || null,
        matchedJobCompany: matchedJob?.company || null,
      };
    })
  );

  // Do not auto-apply during preview mode.
  // Status updates should be applied explicitly after review.
  return { query, emails };
}
