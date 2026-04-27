import { RefreshButton } from "./apply-updates-button";
import { EmailIntegrationTable } from "./email-integration-table";

async function getEmails() {
  const res = await fetch("http://localhost:3000/api/integrations/email", {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      counts: { scanned: 0, matched: 0, actionable: 0 },
      results: [],
    };
  }

  return res.json();
}

export default async function IntegrationsPage() {
  const data = await getEmails();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Email Integration</h1>
        <RefreshButton />
      </div>

      <EmailIntegrationTable data={data} />
    </div>
  );
}
