import { RefreshButton } from "./apply-updates-button";

async function getEmails() {
  const res = await fetch("http://localhost:3000/api/integrations/email", {
    cache: "no-store",
  });

  if (!res.ok) return { emails: [], query: null, totalScanned: 0, totalMatched: 0 };

  return res.json();
}

function gmailMessageUrl(id: string) {
  return `https://mail.google.com/mail/u/0/#all/${id}`;
}

export default async function IntegrationsPage() {
  const data = await getEmails();
  const emails = data?.emails || [];
  const query = data?.query;
  const totalScanned = data?.totalScanned ?? 0;
  const totalMatched = data?.totalMatched ?? emails.length;
  const sortedEmails = [...emails].sort((a: any, b: any) => {
    const aHasUpdate =
      a.detectedStatus && a.currentStatus && a.currentStatus !== a.detectedStatus;
    const bHasUpdate =
      b.detectedStatus && b.currentStatus && b.currentStatus !== b.detectedStatus;

    if (aHasUpdate && !bHasUpdate) return -1;
    if (!aHasUpdate && bHasUpdate) return 1;

    return 0;
  });

  const updatesFound = sortedEmails.filter(
    (email: any) =>
      email.detectedStatus &&
      email.currentStatus &&
      email.currentStatus !== email.detectedStatus
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Email Integration</h1>
        <RefreshButton />
      </div>

      {query ? (
        <div className="space-y-2 rounded bg-gray-100 p-2 text-xs">
          <div><strong>Scanned:</strong> {totalScanned}</div>
          <div><strong>Matched:</strong> {totalMatched}</div>
          <div><strong>New updates:</strong> {updatesFound}</div>
        </div>
      ) : null}

      {emails.length === 0 ? (
        <p>No matching job emails found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">From</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Matched Job</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Detected</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmails.map((email: any) => {
                const hasChange =
                  email.detectedStatus &&
                  email.currentStatus &&
                  email.currentStatus !== email.detectedStatus;

                return (
                  <tr
                    key={email.id}
                    className={`border-t align-top ${
                      hasChange ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="space-y-1">
                        <a
                          href={email.appleMailUrl || gmailMessageUrl(email.id)}
                          className="font-medium text-blue-600 underline"
                        >
                          {email.subject || "(No subject)"}
                        </a>
                        <div className="text-xs">
                          <a
                            href={gmailMessageUrl(email.id)}
                            target="_blank"
                            className="text-gray-500 underline"
                          >
                            Open in Gmail
                          </a>
                        </div>
                      </div>
                      <div className="mt-1 max-w-xl text-xs text-gray-500">
                        {email.snippet}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{email.from}</td>
                    <td className="px-4 py-2">
                      {email.matchedJobId ? (
                        <div>
                          <div>{email.matchedJobCompany}</div>
                          <div className="text-xs text-gray-500">
                            {email.matchedJobTitle}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {email.detectedStatus || "none"}
                      {email.confidence ? (
                        <span className="ml-2 text-xs text-gray-500">
                          {Math.round(email.confidence * 100)}%
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">
                      {hasChange ? (
                        <span className="text-orange-600">
                          {email.currentStatus} → {email.detectedStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">no change</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
