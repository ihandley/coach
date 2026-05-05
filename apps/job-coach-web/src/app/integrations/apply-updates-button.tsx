"use client";

import { useState } from "react";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setIsRefreshing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/integrations/email", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Refresh failed");
      }

      const updatesFound = data.emails.filter(
        (email: any) =>
          email.detectedStatus &&
          email.currentStatus &&
          email.currentStatus !== email.detectedStatus,
      ).length;

      setMessage(
        updatesFound > 0
          ? `Found ${updatesFound} new update${updatesFound === 1 ? "" : "s"}.`
          : "No new updates found.",
      );

      setTimeout(() => location.reload(), 700);
    } catch {
      setMessage("Refresh failed.");
      setIsRefreshing(false);
    }
  }

  async function applyUpdates() {
    setIsRefreshing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/integrations/email/apply", {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      setMessage("Updates applied.");
      setTimeout(() => location.reload(), 700);
    } catch {
      setMessage("Apply failed.");
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={refresh}
        disabled={isRefreshing}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded shadow"
      >
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>

      <button
        onClick={applyUpdates}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
      >
        Apply Updates
      </button>

      {isRefreshing ? (
        <div className="h-1 w-40 overflow-hidden rounded bg-gray-200">
          <div className="h-full w-1/2 animate-pulse bg-blue-600" />
        </div>
      ) : null}

      {message ? <div className="text-xs text-gray-600">{message}</div> : null}
    </div>
  );
}
