"use client";

import { useState } from "react";

const statuses = ["saved", "applied", "interviewing", "rejected", "offer", "archived"];

const statusClasses: Record<string, string> = {
  saved: "border-gray-300 bg-gray-50 text-gray-700",
  applied: "border-blue-300 bg-blue-50 text-blue-700",
  interviewing: "border-purple-300 bg-purple-50 text-purple-700",
  rejected: "border-red-300 bg-red-50 text-red-700",
  offer: "border-green-300 bg-green-50 text-green-700",
  archived: "border-stone-300 bg-stone-50 text-stone-700",
};

export function JobStatusSelect({
  jobId,
  initialStatus,
}: {
  jobId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(nextStatus: string) {
    setStatus(nextStatus);
    setIsSaving(true);

    const res = await fetch(`/api/jobs/${jobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    setIsSaving(false);

    if (!res.ok) {
      setStatus(status);
      alert("Unable to update job status.");
    }
  }

  return (
    <label className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={isSaving}
        className={`rounded-md border px-3 py-2 ${statusClasses[status] ?? "border-gray-300 bg-white text-gray-700"}`}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {isSaving ? <span className="text-sm text-gray-500">Saving…</span> : null}
    </label>
  );
}
