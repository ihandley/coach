"use client";

import { useState } from "react";

const statuses = ["saved", "applied", "interviewing", "rejected", "offer", "archived"];

function getStatusColor(status: string) {
  switch (status) {
    case "saved":
      return "bg-gray-100 text-gray-800";
    case "applied":
      return "bg-blue-100 text-blue-800";
    case "interviewing":
      return "bg-yellow-100 text-yellow-800";
    case "offer":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "archived":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function JobStatusSelect({
  jobId,
  initialStatus,
  variant = "inline",
}: {
  jobId: string;
  initialStatus: string;
  variant?: "inline" | "popover";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function updateStatus(nextStatus: string) {
    const previousStatus = status;

    setStatus(nextStatus);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Unable to update job status.");
      }
    } catch (err) {
      console.error("Status update failed", err);
      setStatus(previousStatus);
      alert("Unable to update job status.");
    } finally {
      setIsSaving(false);
      setOpen(false);
    }
  }

  if (variant === "inline") {
    return (
      <select
        aria-label="Job status"
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={isSaving}
        className="rounded-md border border-gray-300 bg-white px-3 py-1"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        data-testid="job-status"
        aria-label="Edit job status"
        aria-expanded={open}
        disabled={isSaving}
        onClick={() => setOpen((value) => !value)}
        className={`cursor-pointer rounded px-2 py-1 text-xs font-medium ${getStatusColor(status)} hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {status}
      </button>

      {open ? (
        <div className="absolute z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(s)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
