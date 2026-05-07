"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import { getMatchScoreState } from "@/lib/jobs-table-signals";

import { JobStatusSelect } from "./[jobId]/job-status-select";
import { ReimportJobPanel } from "./[jobId]/reimport-job-panel";
import {
  areAllJobStatusesVisible,
  countJobsByStatus,
  createVisibleJobStatuses,
  getActiveStatusChipClassName,
  getJobStatusLabel,
  JOB_STATUS_OPTIONS,
  normalizeJobStatus,
  type JobStatusOption,
} from "./job-status-options";

function formatRawText(text: string) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((p, i) => (
    <p key={i} className="mb-3 whitespace-pre-wrap">
      {p}
    </p>
  ));
}

type RankedJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  sourceUrl?: string;
  sourceText?: string | null;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  structuredSummary?: any;
};

type ResumeProfile = {
  id: string;
  name: string;
  currentVersionId: string;
};

type TailoredResumeResult = {
  id: string;
  name: string;
  profileId: string;
  versionId: string;
};

const jobDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatReadableJobDate(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return jobDateFormatter.format(parsed);
}

export function JobsPageClient() {
  const [visibleStatuses, setVisibleStatuses] =
    React.useState<Set<JobStatusOption>>(createVisibleJobStatuses);

  const [jobs, setJobs] = useState<RankedJob[]>([]);

  const statusCounts = countJobsByStatus(jobs);
  const totalJobs = jobs.length;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [lastImportedJobId, setLastImportedJobId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/ranked");

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body.error === "string" ? body.error : "Unable to load ranked jobs.";

        throw new Error(message);
      }

      const body = await res.json();

      if (!Array.isArray(body)) {
        throw new Error("Unable to load ranked jobs.");
      }

      setJobs(body);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message ? err.message : "Unable to load ranked jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function handleImport() {
    if (!url || isImporting) return;

    setIsImporting(true);
    setError(null);
    setImportSuccess(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url }),
      });

      if (!res.ok) {
        throw new Error("Import job failed.");
      }

      const importedJob = await res.json().catch(() => null);
      const importedJobId =
        importedJob && typeof importedJob.id === "string" ? importedJob.id : null;

      setLastImportedJobId(importedJobId);
      await load();
      setUrl("");
      setImportSuccess("Job imported successfully.");
      window.setTimeout(() => setImportSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Unable to import job.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    const confirmed = window.confirm("Delete this job? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete job failed.");
      }

      setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
      setSelectedJobIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(jobId);
        return nextIds;
      });
      setExpandedId((currentId) => (currentId === jobId ? null : currentId));
    } catch (err) {
      console.error(err);
      setError("Unable to delete job.");
    }
  }

  const handleUpdateCompany = useCallback(
    async (jobId: string, company: string, previousCompany: string) => {
      const nextCompany = company.trim();

      if (!nextCompany) {
        return;
      }

      setError(null);
      setJobs((currentJobs) =>
        currentJobs.map((job) => (job.id === jobId ? { ...job, company: nextCompany } : job)),
      );

      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: nextCompany }),
        });

        if (!res.ok) {
          throw new Error("Update company failed.");
        }

        const body = await res.json().catch(() => null);
        const savedCompany =
          body && typeof body.company === "string" && body.company.trim()
            ? body.company
            : nextCompany;

        setJobs((currentJobs) =>
          currentJobs.map((job) => (job.id === jobId ? { ...job, company: savedCompany } : job)),
        );
      } catch (err) {
        console.error(err);
        setJobs((currentJobs) =>
          currentJobs.map((job) => (job.id === jobId ? { ...job, company: previousCompany } : job)),
        );
        setError("Unable to update company.");
        throw err;
      }
    },
    [],
  );

  const handleUpdateStatus = useCallback((jobId: string, status: JobStatusOption) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function StatusFilterChips() {
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setVisibleStatuses(createVisibleJobStatuses())}
          className={`rounded-full border px-3 py-1 text-sm ${
            areAllJobStatusesVisible(visibleStatuses)
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-300 bg-white text-gray-600"
          }`}
        >
          All ({totalJobs})
        </button>

        {JOB_STATUS_OPTIONS.map((status) => {
          const active = visibleStatuses.has(status);
          const count = statusCounts[status] ?? 0;
          const label = getJobStatusLabel(status);

          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                const next = new Set(visibleStatuses);
                if (next.has(status)) next.delete(status);
                else next.add(status);
                setVisibleStatuses(next);
              }}
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? getActiveStatusChipClassName(status)
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>
    );
  }

  const columns = useMemo<ColumnDef<RankedJob>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const visibleIds = table.getRowModel().rows.map((row) => row.original.id);
          const allVisibleSelected =
            visibleIds.length > 0 && visibleIds.every((id) => selectedJobIds.has(id));

          return (
            <input
              aria-label="Select all visible jobs"
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedJobIds(new Set([...selectedJobIds, ...visibleIds]));
                } else {
                  setSelectedJobIds(
                    new Set([...selectedJobIds].filter((id) => !visibleIds.includes(id))),
                  );
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
        cell: ({ row }) => {
          const id = row.original.id;
          const checked = selectedJobIds.has(id);

          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = new Set(selectedJobIds);
                if (e.target.checked) next.add(id);
                else next.delete(id);
                setSelectedJobIds(next);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
      },
      {
        accessorKey: "score",
        header: "Match",
        sortingFn: (first, second) => {
          const firstScore = getMatchScoreState(first.original.score);
          const secondScore = getMatchScoreState(second.original.score);
          const firstValue = firstScore.state === "matched" ? firstScore.score : -1;
          const secondValue = secondScore.state === "matched" ? secondScore.score : -1;

          return firstValue - secondValue;
        },
        cell: (info) => <MatchScoreCell score={info.getValue<number | null>()} />,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-medium text-gray-900">{row.original.title}</span>
            {lastImportedJobId === row.original.id ? (
              <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                NEW
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => <CompanyCell job={row.original} onUpdateCompany={handleUpdateCompany} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusCell job={row.original} onStatusChange={handleUpdateStatus} />,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: (info) => <DateCell value={info.getValue<string | null>()} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => <DateCell value={info.getValue<string | null>()} />,
      },
      {
        accessorKey: "sourceUrl",
        header: "Source",
        cell: (info) => {
          const url = info.getValue<string>();
          if (!url) return null;
          return (
            <a
              href={url}
              target="_blank"
              className="text-blue-600 underline"
              onClick={(e) => e.stopPropagation()}
            >
              Link
            </a>
          );
        },
      },
    ],
    [handleUpdateCompany, handleUpdateStatus, lastImportedJobId, selectedJobIds],
  );

  const filteredJobs = React.useMemo(() => {
    const visibleJobs = jobs.filter((job) => {
      const status = normalizeJobStatus(job.status);

      return status ? visibleStatuses.has(status) : false;
    });

    if (!lastImportedJobId || sorting.length > 0) {
      return visibleJobs;
    }

    return [...visibleJobs].sort((first, second) => {
      if (first.id === lastImportedJobId) return -1;
      if (second.id === lastImportedJobId) return 1;
      return 0;
    });
  }, [jobs, lastImportedJobId, sorting.length, visibleStatuses]);

  const activeSortLabel = React.useMemo(() => {
    const activeSort = sorting[0];

    if (!activeSort) {
      return "Default sort: NEW jobs first, then matched jobs by score.";
    }

    const labels: Record<string, string> = {
      score: "match",
      title: "title",
      company: "company",
      status: "status",
      updatedAt: "updated date",
      createdAt: "created date",
    };

    return `Sorted by ${labels[activeSort.id] ?? activeSort.id} ${
      activeSort.desc ? "descending" : "ascending"
    }.`;
  }, [sorting]);

  // TanStack Table intentionally returns non-memoizable table helpers.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredJobs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ranked Jobs</h1>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void load();
            }}
            disabled={isLoading}
            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <input
            value={url}
            disabled={isImporting}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleImport();
              }
            }}
            placeholder="Paste job URL"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleImport}
            disabled={!url || isImporting}
            className="btn-primary disabled:opacity-50"
          >
            {isImporting ? "Importing…" : "Import"}
          </button>
          {importSuccess ? <p className="text-sm text-green-600">{importSuccess}</p> : null}
        </div>
      </div>

      {isLoading ? (
        <JobsTableSkeleton />
      ) : jobs.length === 0 && !error ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No jobs yet. Import one to get started.</p>
        </div>
      ) : jobs.length > 0 ? (
        <>
          {selectedJobIds.size > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm">
              <span>{selectedJobIds.size} selected</span>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Bulk status update"
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (!value) return;

                    const ids = Array.from(selectedJobIds);

                    const prevJobs = jobs;

                    // optimistic update
                    const updatedJobs = jobs.map((job) =>
                      ids.includes(job.id) ? { ...job, status: value } : job,
                    );

                    setJobs(updatedJobs);

                    try {
                      await fetch("/api/jobs/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids, status: value }),
                      });
                    } catch (err) {
                      console.error("Bulk update failed", err);
                      setJobs(prevJobs); // rollback
                    }

                    setSelectedJobIds(new Set());
                  }}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">Set status...</option>
                  {JOB_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getJobStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setSelectedJobIds(new Set())}
                  className="text-blue-600 underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <StatusFilterChips />

          <p className="mb-3 text-xs text-gray-500">{activeSortLabel}</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      key={row.id}
                      data-testid="job-row"
                      className="cursor-pointer border-t hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(expandedId === row.original.id ? null : row.original.id)
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {expandedId === row.original.id && (
                      <tr data-testid="job-details">
                        <td
                          colSpan={row.getVisibleCells().length}
                          className="bg-gray-50 px-4 py-3 text-sm"
                        >
                          <JobDetailsPanel job={row.original} onDeleteJob={handleDeleteJob} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MatchScoreCell({ score }: { score: number | null }) {
  const scoreState = getMatchScoreState(score);

  if (scoreState.state === "unmatched") {
    return <span className="block text-right text-sm text-gray-500">Not matched</span>;
  }

  const barColor = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-400",
  }[scoreState.tone];

  return (
    <div className="flex items-center justify-end gap-2">
      <div
        role="meter"
        aria-label={`Match score ${scoreState.percentage}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={scoreState.percentage}
        className="h-2 w-20 rounded bg-gray-200"
      >
        <div className={`h-2 rounded ${barColor}`} style={{ width: `${scoreState.percentage}%` }} />
      </div>
      <span className="w-10 text-right font-semibold text-gray-900">{scoreState.percentage}%</span>
    </div>
  );
}

function StatusCell({
  job,
  onStatusChange,
}: {
  job: RankedJob;
  onStatusChange: (jobId: string, status: JobStatusOption) => void;
}) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <JobStatusSelect
        key={`${job.id}-${job.status}`}
        jobId={job.id}
        initialStatus={job.status}
        variant="popover"
        onStatusChange={(status) => onStatusChange(job.id, status)}
      />
    </div>
  );
}

function DateCell({ value }: { value: string | null | undefined }) {
  const formattedDate = formatReadableJobDate(value);

  if (!formattedDate) {
    return <span className="text-gray-500">Not set</span>;
  }

  return <span>{formattedDate}</span>;
}

function CompanyCell({
  job,
  onUpdateCompany,
}: {
  job: RankedJob;
  onUpdateCompany: (jobId: string, company: string, previousCompany: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(job.company);
  const [isSaving, setIsSaving] = useState(false);
  const skipBlurSaveRef = useRef(false);

  async function saveCompany() {
    if (isSaving) {
      return;
    }

    const nextCompany = draft.trim();

    if (!nextCompany || nextCompany === job.company) {
      setDraft(job.company);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await onUpdateCompany(job.id, nextCompany, job.company);
      setDraft(nextCompany);
      setIsEditing(false);
    } catch {
      setDraft(job.company);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() {
    skipBlurSaveRef.current = true;
    setDraft(job.company);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <input
        aria-label={`Company for ${job.title}`}
        autoFocus
        disabled={isSaving}
        value={draft}
        onBlur={() => {
          if (skipBlurSaveRef.current) {
            skipBlurSaveRef.current = false;
            return;
          }

          void saveCompany();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();

          if (event.key === "Enter") {
            event.preventDefault();
            void saveCompany();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
          }
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="w-44 rounded-md border border-blue-300 px-2 py-1 text-sm"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{job.company}</span>
      <button
        type="button"
        aria-label={`Edit company for ${job.title}`}
        onClick={(event) => {
          event.stopPropagation();
          setDraft(job.company);
          setIsEditing(true);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          <path d="m19.5 7.125-2.625-2.625" />
        </svg>
      </button>
    </div>
  );
}

function JobsTableSkeleton() {
  return (
    <div
      aria-label="Loading jobs"
      role="status"
      className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
    >
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["", "Match", "Title", "Company", "Status", "Updated", "Created", "Source"].map(
              (header) => (
                <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className="border-t">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
                <td key={cell} className="px-4 py-3">
                  <div className="h-3 w-full max-w-28 rounded bg-gray-200" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobDetailsPanel({
  job,
  onDeleteJob,
}: {
  job: RankedJob;
  onDeleteJob: (jobId: string) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"structured" | "raw">("structured");
  const [showResumeTailor, setShowResumeTailor] = useState(false);
  const structuredPanelId = `job-${job.id}-structured-view`;
  const rawPanelId = `job-${job.id}-original-posting`;
  const safeText = job.sourceText || "No job description available.";

  const tabClassName = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="mt-4 border-t pt-4">
      <div
        data-testid="job-details-tab-row"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div role="tablist" aria-label="Job detail views" className="flex items-center gap-2">
          <button
            id={`${structuredPanelId}-tab`}
            type="button"
            role="tab"
            aria-selected={mode === "structured"}
            aria-controls={structuredPanelId}
            onClick={() => setMode("structured")}
            className={tabClassName(mode === "structured")}
          >
            Structured View
          </button>
          <button
            id={`${rawPanelId}-tab`}
            type="button"
            role="tab"
            aria-selected={mode === "raw"}
            aria-controls={rawPanelId}
            onClick={() => setMode("raw")}
            className={tabClassName(mode === "raw")}
          >
            Original Posting
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void onDeleteJob(job.id);
            }}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Delete job
          </button>
          <button
            type="button"
            aria-expanded={showResumeTailor}
            aria-controls={`resume-tailor-panel-${job.id}`}
            onClick={() => setShowResumeTailor((value) => !value)}
            className="btn-primary text-sm"
          >
            Tailor Resume
          </button>
        </div>
      </div>

      <div className="mt-4">
        <ReimportJobPanel jobId={job.id} sourceUrl={job.sourceUrl} />
      </div>

      {showResumeTailor && <ResumeTailor jobId={job.id} />}

      <div className="mt-4 max-h-96 overflow-y-auto text-sm">
        {mode === "raw" ? (
          <div id={rawPanelId} role="tabpanel" aria-labelledby={`${rawPanelId}-tab`}>
            {formatRawText(safeText)}
          </div>
        ) : (
          <div id={structuredPanelId} role="tabpanel" aria-labelledby={`${structuredPanelId}-tab`}>
            <JobDescription structuredSummary={job.structuredSummary} />
          </div>
        )}
      </div>

      {job.sourceUrl && (
        <a
          href={job.sourceUrl}
          target="_blank"
          className="mt-4 inline-block text-blue-600 underline"
          onClick={(event) => event.stopPropagation()}
        >
          View Job Posting
        </a>
      )}
    </div>
  );
}

function formatStructuredSummaryValue(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatStructuredSummaryValue(item))
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join(", ") : null;
  }

  if (typeof value === "object") {
    const parts = Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => {
        const formattedNestedValue = formatStructuredSummaryValue(nestedValue);
        return formattedNestedValue ? `${key}: ${formattedNestedValue}` : key;
      })
      .filter((item) => item.trim().length > 0);

    return parts.length > 0 ? parts.join("; ") : null;
  }

  return null;
}

function getStructuredSummaryList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const formattedValue = formatStructuredSummaryValue(value);
    return formattedValue ? [formattedValue] : [];
  }

  return value
    .map((item) => formatStructuredSummaryValue(item))
    .filter((item): item is string => Boolean(item));
}

function JobDescription({ structuredSummary }: { structuredSummary?: any }) {
  const summary = structuredSummary;

  const location = formatStructuredSummaryValue(summary?.location);
  const salaryRange =
    formatStructuredSummaryValue(summary?.salaryRange) ?? "Salary range not listed";
  const companyInfo = getStructuredSummaryList(summary?.companyInfo);
  const jobDescription = getStructuredSummaryList(summary?.jobDescription);
  const requirements = getStructuredSummaryList(summary?.requirements);
  const benefits = getStructuredSummaryList(summary?.benefits);

  if (!summary) {
    return (
      <div className="text-sm text-muted-foreground">
        No structured summary available yet. Use Original Posting view for the original posting.
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex gap-4 border-b pb-2 text-sm text-muted-foreground">
        {location && <div>📍 {location}</div>}
        <div>💰 {salaryRange}</div>
      </div>

      {companyInfo.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Company</h4>
          <ul className="ml-5 list-disc">
            {companyInfo.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {jobDescription.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Description</h4>
          <ul className="ml-5 list-disc">
            {jobDescription.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {requirements.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Requirements</h4>
          <ul className="ml-5 list-disc">
            {requirements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {benefits.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Benefits</h4>
          <ul className="ml-5 list-disc">
            {benefits.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
function ResumeTailor({ jobId }: { jobId: string }) {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ResumeProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdTailoredResume, setCreatedTailoredResume] = useState<TailoredResumeResult | null>(
    null,
  );
  const [tailorError, setTailorError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/resume-profiles")
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Unable to load resume profiles.");
        }

        return data;
      })
      .then((data) => {
        if (!isCurrent) return;

        setResumes(
          data.map((r: any) => ({
            id: r.id,
            name: r.name || "Untitled Resume",
            currentVersionId: r.currentVersionId || r.current_version_id || "",
          })),
        );
      })
      .catch(() => {
        if (!isCurrent) return;

        setResumes([]);
        setTailorError("Unable to load resume profiles.");
      })
      .finally(() => {
        if (!isCurrent) return;

        setLoadingProfiles(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const canTailor = Boolean(selectedProfile?.currentVersionId);

  async function handleGenerate() {
    if (!selectedProfile?.currentVersionId) return;

    setLoading(true);
    setCreatedTailoredResume(null);
    setTailorError(null);

    try {
      const res = await fetch(`/api/resume-profiles/${selectedProfile.id}/tailored-resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          sourceResumeVersionId: selectedProfile.currentVersionId,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Unable to generate tailored resume.");
      }

      const tailoredResume = data?.tailoredResume;

      if (
        !tailoredResume ||
        typeof tailoredResume.id !== "string" ||
        typeof tailoredResume.name !== "string" ||
        typeof tailoredResume.profileId !== "string" ||
        typeof tailoredResume.versionId !== "string"
      ) {
        throw new Error("Tailored resume response was missing resume details.");
      }

      setCreatedTailoredResume(tailoredResume);
    } catch (err) {
      console.error(err);
      setTailorError("Unable to generate tailored resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id={`resume-tailor-panel-${jobId}`}
      className="mt-3 space-y-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-gray-700">
          Resume profile
          <select
            aria-label="Resume profile"
            value={selectedProfile?.id ?? ""}
            onChange={(e) => {
              const profile = resumes.find((resume) => resume.id === e.target.value);
              setSelectedProfile(profile ?? null);
            }}
            disabled={loadingProfiles || resumes.length === 0}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">{loadingProfiles ? "Loading resumes..." : "Select resume..."}</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canTailor || loading}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Tailored Resume"}
        </button>
      </div>

      {!loadingProfiles && resumes.length === 0 && (
        <p className="text-sm text-gray-600">Import a resume to enable tailoring.</p>
      )}

      {selectedProfile && !selectedProfile.currentVersionId && (
        <p className="text-sm text-gray-600">
          Selected resume has no current version. Import a resume version before tailoring.
        </p>
      )}

      {tailorError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {tailorError}
        </div>
      )}

      {createdTailoredResume && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Tailored resume created.{" "}
          <a href="/resumes" className="font-medium underline">
            View resumes
          </a>
        </div>
      )}
    </div>
  );
}
