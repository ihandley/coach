"use client";

import { useState } from "react";

import {
  getJobStatusBadgeClassName,
  getJobStatusDisplayLabel,
  getJobStatusLabel,
  JOB_STATUS_OPTIONS,
  type JobStatusOption,
} from "../job-status-options";

export function JobStatusSelect({
  jobId,
  initialStatus,
  variant = "inline",
  onStatusChange,
}: {
  jobId: string;
  initialStatus: string;
  variant?: "inline" | "popover";
  onStatusChange?: (status: JobStatusOption) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function updateStatus(nextStatus: JobStatusOption) {
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

      onStatusChange?.(nextStatus);
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
        onChange={(e) => updateStatus(e.target.value as JobStatusOption)}
        disabled={isSaving}
        className="rounded-md border border-gray-300 bg-white px-3 py-1"
      >
        {JOB_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {getJobStatusLabel(s)}
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
        className={`cursor-pointer rounded px-2 py-1 text-xs font-medium ${getJobStatusBadgeClassName(status)} hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {getJobStatusDisplayLabel(status)}
      </button>

      {open ? (
        <div className="absolute z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow">
          {JOB_STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(s)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {getJobStatusLabel(s)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
