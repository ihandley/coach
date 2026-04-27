"use client";

import { useMemo, useState } from "react";

function gmailMessageUrl(id: string) {
  return `https://mail.google.com/mail/u/0/#all/${id}`;
}

function sortableValue(email: any, key: string) {
  if (key === "date") return email.date ? new Date(email.date).getTime() : 0;
  if (key === "detectedStatus") return email.detectedStatus || "";
  if (key === "matchedJob") return `${email.matchedJobCompany || ""} ${email.matchedJobTitle || ""}`;
  return email[key] || "";
}

export function EmailIntegrationTable({ emails }: { emails: any[] }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detectedFilter, setDetectedFilter] = useState("all");

  const rows = useMemo(() => {
    const filtered =
      detectedFilter === "all"
        ? emails
        : emails.filter((email) => (email.detectedStatus || "none") === detectedFilter);

    return [...filtered].sort((a, b) => {
      const av = sortableValue(a, sortKey);
      const bv = sortableValue(b, sortKey);

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [emails, sortKey, sortDir, detectedFilter]);

  function sortBy(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortLabel(key: string) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <select
          value={detectedFilter}
          onChange={(e) => setDetectedFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All detected statuses</option>
          <option value="none">None</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => sortBy("date")} className="cursor-pointer px-4 py-2 text-left font-medium text-gray-700">
                Date{sortLabel("date")}
              </th>
              <th onClick={() => sortBy("subject")} className="cursor-pointer px-4 py-2 text-left font-medium text-gray-700">
                Email{sortLabel("subject")}
              </th>
              <th onClick={() => sortBy("from")} className="cursor-pointer px-4 py-2 text-left font-medium text-gray-700">
                From{sortLabel("from")}
              </th>
              <th onClick={() => sortBy("matchedJob")} className="cursor-pointer px-4 py-2 text-left font-medium text-gray-700">
                Matched Job{sortLabel("matchedJob")}
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span>Detected</span>
                  <select
                    value={detectedFilter}
                    onChange={(e) => setDetectedFilter(e.target.value)}
                    className="border border-gray-300 rounded text-xs px-1 py-0.5"
                  >
                    <option value="all">All</option>
                    <option value="none">None</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((email: any) => {
              const hasChange =
                email.detectedStatus &&
                email.currentStatus &&
                email.currentStatus !== email.detectedStatus;

              return (
                <tr
                  key={email.id}
                  className={`border-t align-top ${hasChange ? "bg-orange-50" : ""}`}
                >
                  <td className="px-4 py-2 text-gray-600">
                    {email.date ? new Date(email.date).toLocaleDateString() : ""}
                  </td>
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
                    <div>
                      <div>{email.matchedJobCompany}</div>
                      <div className="text-xs text-gray-500">{email.matchedJobTitle}</div>
                    </div>
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
    </div>
  );
}
