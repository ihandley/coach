"use client";

import { useMemo, useState } from "react";

function gmailMessageUrl(id: string) {
  return `https://mail.google.com/mail/u/0/#all/${id}`;
}

export function EmailIntegrationTable({ data }: { data: any }) {
  const emails = data?.results || [];
  const counts = data?.counts || { scanned: 0, matched: 0, actionable: 0 };

  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    return [...emails].sort((a, b) => {
      const av = a.email?.date ? new Date(a.email.date).getTime() : 0;
      const bv = b.email?.date ? new Date(b.email.date).getTime() : 0;

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [emails, sortDir]);

  function sortByDate() {
    setSortDir(sortDir === "asc" ? "desc" : "asc");
  }

  return (
    <div className="space-y-4">
      {/* Counts */}
      <div className="flex gap-6 text-sm">
        <div>
          <div className="text-gray-500">Scanned</div>
          <div className="text-lg font-semibold">{counts.scanned}</div>
        </div>
        <div>
          <div className="text-gray-500">Matched</div>
          <div className="text-lg font-semibold">{counts.matched}</div>
        </div>
        <div>
          <div className="text-gray-500">Actionable</div>
          <div className="text-lg font-semibold text-orange-600">
            {counts.actionable}
          </div>
        </div>
      </div>

      {counts.actionable === 0 && (
        <div className="text-sm text-gray-500">
          No status updates found
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={sortByDate}
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-700"
              >
                Date
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Email
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                From
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Job
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Confidence
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => {
              const email = row.email;

              return (
                <tr
                  key={email.id}
                  className={`border-t ${
                    row.actionable ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-gray-600">
                    {email.date
                      ? new Date(email.date).toLocaleDateString()
                      : ""}
                  </td>

                  <td className="px-4 py-2">
                    <div className="space-y-1">
                      <a
                        href={gmailMessageUrl(email.id)}
                        target="_blank"
                        className="font-medium text-blue-600 underline"
                      >
                        {email.subject || "(No subject)"}
                      </a>
                      <div className="text-xs text-gray-500">
                        {email.snippet}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-2 text-gray-600">
                    {email.from}
                  </td>

                  <td className="px-4 py-2">
                    {row.job ? (
                      <div>
                        <div>{row.job.company}</div>
                        <div className="text-xs text-gray-500">
                          {row.job.title}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">unmatched</span>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    {row.confidence ? (
                      <span>
                        {Math.round(row.confidence)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    {row.actionable ? (
                      <span className="text-orange-600">
                        Update available
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
