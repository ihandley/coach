import { RefreshButton } from "./apply-updates-button";
import { EmailIntegrationTable } from "./email-integration-table";

async function getEmails() {
  const res = await fetch("http://localhost:3000/api/integrations/email", {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      emails: [],
      query: null,
      totalScanned: 0,
      totalMatched: 0,
    };
  }

  return res.json();
}

export default async function IntegrationsPage() {
  const data = await getEmails();
  const emails = data?.emails || [];
  const totalScanned = data?.totalScanned ?? 0;
  const totalMatched = data?.totalMatched ?? emails.length;

  const updatesFound = emails.filter(
    (email: any) =>
      email.detectedStatus &&
      email.currentStatus &&
      email.currentStatus !== email.detectedStatus
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Email Integration</h1>
        <RefreshButton />
      </div>

      <div className="space-y-2 rounded bg-gray-100 p-2 text-xs">
        <div><strong>Scanned:</strong> {totalScanned}</div>
        <div><strong>Matched:</strong> {totalMatched}</div>
        <div><strong>New updates:</strong> {updatesFound}</div>
      </div>

      {emails.length === 0 ? (
        <p>No matching job emails found.</p>
      ) : (
        <EmailIntegrationTable emails={emails} />
      )}
    </div>
  );
}
