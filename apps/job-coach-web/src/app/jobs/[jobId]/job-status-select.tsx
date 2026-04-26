"use client";

import { useState } from "react";

const statuses = ["saved", "applied", "interviewing", "rejected", "offer", "archived"];

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
      <span className="font-medium">Status:</span>
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={isSaving}
        className="rounded-md border border-gray-300 bg-white px-3 py-2"
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
