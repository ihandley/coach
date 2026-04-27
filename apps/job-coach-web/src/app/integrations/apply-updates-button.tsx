"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/integrations/email", {
        method: "GET",
      });

      const data = await res.json();

      const updatesFound = data?.counts?.actionable ?? 0;

      setMessage(
        updatesFound > 0
          ? `${updatesFound} updates found`
          : "No status updates found"
      );

      // 🔑 THIS is what actually updates the UI
      router.refresh();
    } catch (err) {
      setMessage("Failed to refresh");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Scanning..." : "Refresh email scan"}
      </button>

      {message && (
        <div className="text-sm text-gray-600">{message}</div>
      )}
    </div>
  );
}
