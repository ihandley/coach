import { ApplyUpdatesButton } from "./apply-updates-button";

async function getEmails() {
  const res = await fetch("http://localhost:3000/api/integrations/email", {
    cache: "no-store",
  });

  if (!res.ok) return { emails: [], query: null };

  return res.json();
}

export default async function IntegrationsPage() {
  const data = await getEmails();
  const emails = data?.emails || [];
  const query = data?.query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">Email Integration (MVP)</h1>
  <ApplyUpdatesButton />
</div>

      {query ? (
        <div className="text-xs bg-gray-100 p-2 rounded">
          <strong>Query:</strong> {query}
        </div>
      ) : null}

      {emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <div className="space-y-4">
          {emails.map((email: any) => (
            <div key={email.id} className="border p-4 rounded">
              <div className="font-semibold">{email.subject}</div>
              <div className="text-sm text-gray-500">{email.from}</div>
              <div className="text-sm mt-2">{email.snippet}</div>
              <div className="text-xs mt-2 text-blue-600">
                Detected: {email.detectedStatus || "none"}

              {email.matchedJobId ? (
                <div className="mt-2 text-sm">
                  <div className="text-gray-500">
                    {email.matchedJobCompany} — {email.matchedJobTitle}
                  </div>

                  {email.detectedStatus && email.currentStatus !== email.detectedStatus ? (
                    <div className="text-orange-600">
                      {email.currentStatus} → {email.detectedStatus}
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      no change
                    </div>
                  )}
                </div>
              ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
