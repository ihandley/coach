"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  getVisibleStatusFilterOptions,
  normalizeJobStatus,
  pruneHiddenStatusFilters,
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
  matchDetails?: {
    strengths?: unknown;
    gaps?: unknown;
    reasons?: unknown;
    summary?: unknown;
    recommendation?: unknown;
  } | null;
};

type JobDetailMode = "structured" | "raw" | "match";

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

  const statusCounts = useMemo(() => countJobsByStatus(jobs), [jobs]);
  const statusFilterOptions = useMemo(
    () => getVisibleStatusFilterOptions(statusCounts),
    [statusCounts],
  );
  const totalJobs = jobs.length;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
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
      setExpandedId((currentId) => (currentId === jobId ? null : currentId));
    } catch (err) {
      console.error(err);
      setError("Unable to delete job.");
    }
  }

  const handleReassessFit = useCallback(
    async (jobId: string) => {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, resumeProfileId: "default" }),
      });

      if (!res.ok) {
        throw new Error("Re-assess fit failed.");
      }

      await load();
    },
    [load],
  );

  const handleUpdateJobDetails = useCallback(
    async (jobId: string, input: { company: string; title: string }) => {
      const company = input.company.trim();
      const title = input.title.trim();

      if (!company || !title) {
        throw new Error("INVALID_JOB_DETAILS");
      }

      setError(null);

      const previousJobs = jobs;

      setJobs((currentJobs) =>
        currentJobs.map((job) => (job.id === jobId ? { ...job, company, title } : job)),
      );

      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company, title }),
        });

        if (!res.ok) {
          throw new Error("Update job details failed.");
        }

        const body = await res.json().catch(() => null);
        const savedCompany =
          body && typeof body.company === "string" && body.company.trim() ? body.company : company;
        const savedTitle =
          body && typeof body.title === "string" && body.title.trim() ? body.title : title;

        setJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === jobId ? { ...job, company: savedCompany, title: savedTitle } : job,
          ),
        );
      } catch (err) {
        console.error(err);
        setJobs(previousJobs);
        setError("Unable to update job details.");
        throw err;
      }
    },
    [jobs],
  );

  const handleUpdateStatus = useCallback((jobId: string, status: JobStatusOption) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setVisibleStatuses((currentStatuses) => {
      const nextStatuses = pruneHiddenStatusFilters(currentStatuses, statusCounts);

      return nextStatuses === currentStatuses ? currentStatuses : new Set(nextStatuses);
    });
  }, [statusCounts]);

  function StatusFilterChips() {
    return (
      <div aria-label="Job status filters" className="mb-4 flex flex-wrap gap-2">
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

        {statusFilterOptions.map((status) => {
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
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => <CompanyCell job={row.original} />,
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
        accessorKey: "score",
        header: "Fit",
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
    ],
    [handleUpdateStatus, lastImportedJobId],
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
      score: "fit",
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Import, review, and manage each opportunity from one workspace.
          </p>
        </div>
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
            autoFocus
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
          <p className="font-medium text-gray-900">No jobs yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Paste a job posting URL above to import your first opportunity.
          </p>
        </div>
      ) : jobs.length > 0 ? (
        <>
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
                          <JobDetailsPanel
                            job={row.original}
                            onDeleteJob={handleDeleteJob}
                            onReassessFit={handleReassessFit}
                            onUpdateJobDetails={handleUpdateJobDetails}
                          />
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

function CompanyCell({ job }: { job: RankedJob }) {
  return <span>{job.company}</span>;
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
            {["Company", "Title", "Fit", "Status", "Updated", "Created"].map((header) => (
              <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className="border-t">
              {[0, 1, 2, 3, 4, 5].map((cell) => (
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
  onReassessFit,
  onUpdateJobDetails,
}: {
  job: RankedJob;
  onDeleteJob: (jobId: string) => void | Promise<void>;
  onReassessFit: (jobId: string) => Promise<void>;
  onUpdateJobDetails: (jobId: string, input: { company: string; title: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<JobDetailMode>("structured");
  const [resumeTailorOpen, setResumeTailorOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [reassessState, setReassessState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const structuredPanelId = `job-${job.id}-structured-view`;
  const rawPanelId = `job-${job.id}-original-posting`;
  const matchPanelId = `job-${job.id}-match-details`;
  const safeText = job.sourceText || "No job description available.";

  const tabClassName = (active: boolean) =>
    `relative -mb-px border px-4 py-3 text-sm transition ${
      active
        ? "border-gray-200 border-b-white bg-white font-semibold text-gray-950"
        : "border-transparent font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`;

  async function handleReassessClick() {
    setActionsOpen(false);
    setReassessState("loading");

    try {
      await onReassessFit(job.id);
      setReassessState("success");
    } catch (error) {
      console.error(error);
      setReassessState("error");
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Job Details</h3>
          {reassessState === "loading" ? (
            <p className="mt-1 text-xs text-gray-600">Re-assessing fit...</p>
          ) : reassessState === "success" ? (
            <p className="mt-1 text-xs text-green-700">Fit re-assessed.</p>
          ) : reassessState === "error" ? (
            <p className="mt-1 text-xs text-red-700">Unable to re-assess fit.</p>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-expanded={actionsOpen}
            aria-haspopup="menu"
            onClick={() => setActionsOpen((value) => !value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Actions
          </button>

          {actionsOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setResumeTailorOpen(true);
                  setActionsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Generate Tailored Resume
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={reassessState === "loading"}
                onClick={() => {
                  void handleReassessClick();
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reassessState === "loading" ? "Re-assessing Fit..." : "Re-assess Fit"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setEditDetailsOpen(true);
                  setActionsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit Details
              </button>
              <div>
                <ReimportJobPanel jobId={job.id} sourceUrl={job.sourceUrl} variant="menu-item" />
              </div>
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  role="menuitem"
                  onClick={() => setActionsOpen(false)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  View Job Posting
                </a>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionsOpen(false);
                  void onDeleteJob(job.id);
                }}
                className="w-full border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete Job
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div data-testid="job-details-tab-row" className="border-b border-gray-200 bg-gray-50 px-4">
        <div role="tablist" aria-label="Job detail views" className="flex flex-wrap items-end">
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
          <button
            id={`${matchPanelId}-tab`}
            type="button"
            role="tab"
            aria-selected={mode === "match"}
            aria-controls={matchPanelId}
            onClick={() => setMode("match")}
            className={tabClassName(mode === "match")}
          >
            Match Details
          </button>
        </div>
      </div>

      {resumeTailorOpen ? (
        <ResumeTailorDialog jobId={job.id} onClose={() => setResumeTailorOpen(false)} />
      ) : null}
      {editDetailsOpen ? (
        <EditJobDetailsDialog
          job={job}
          onClose={() => setEditDetailsOpen(false)}
          onSave={onUpdateJobDetails}
        />
      ) : null}

      <div className="max-h-96 overflow-y-auto px-4 py-4 text-sm">
        {mode === "raw" ? (
          <div id={rawPanelId} role="tabpanel" aria-labelledby={`${rawPanelId}-tab`}>
            {formatRawText(safeText)}
          </div>
        ) : mode === "match" ? (
          <div id={matchPanelId} role="tabpanel" aria-labelledby={`${matchPanelId}-tab`}>
            <JobMatchDetails score={job.score} matchDetails={job.matchDetails} />
          </div>
        ) : (
          <div id={structuredPanelId} role="tabpanel" aria-labelledby={`${structuredPanelId}-tab`}>
            <JobDescription structuredSummary={job.structuredSummary} />
          </div>
        )}
      </div>
    </div>
  );
}

function getMatchDetailItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function getMatchDetailText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getFitLabel(score: number | null) {
  if (score == null) return "Not matched";

  const percentage = Math.round(score * 100);

  if (percentage >= 76) return "Strong Match";
  if (percentage >= 51) return "Good Match";
  if (percentage >= 26) return "Moderate Match";
  return "Weak Match";
}

function getFitRecommendation(score: number | null) {
  if (score == null) return "Not enough information to generate a recommendation.";

  const percentage = Math.round(score * 100);

  if (percentage >= 76) {
    return "Strong overlap detected. Prioritize this role and tailor the resume toward the strongest evidence.";
  }

  if (percentage >= 51) {
    return "Good overlap detected. Tailor the resume toward the strongest role signals before applying.";
  }

  if (percentage >= 26) {
    return "Moderate overlap detected. Tailoring the resume toward the role requirements would strengthen the application.";
  }

  return "Weak overlap detected. Build clearer resume evidence before prioritizing this role.";
}

function MatchDetailList({ items, fallback }: { items: string[]; fallback: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{fallback}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm text-gray-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MatchDetailSection({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">{title}</h4>
      <MatchDetailList items={items} fallback={fallback} />
    </section>
  );
}

function JobMatchDetails({
  score,
  matchDetails,
}: {
  score: number | null;
  matchDetails?: RankedJob["matchDetails"];
}) {
  const strengths = getMatchDetailItems(matchDetails?.strengths);
  const gaps = getMatchDetailItems(matchDetails?.gaps);
  const reasons = getMatchDetailItems(matchDetails?.reasons);
  const summary = getMatchDetailText(matchDetails?.summary);
  const savedRecommendation = getMatchDetailText(matchDetails?.recommendation);
  const fallbackStrengths = strengths.length === 0 && gaps.length === 0 ? reasons : [];
  const fitLabel = getFitLabel(score);
  const fitRecommendation = savedRecommendation ?? getFitRecommendation(score);

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h4 className="text-base font-semibold text-gray-950">
            Fit: {score == null ? "Not matched" : `${Math.round(score * 100)}%`}
          </h4>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
            {fitLabel}
          </span>
        </div>
        {summary ? <p className="mt-2 text-sm text-gray-600">{summary}</p> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MatchDetailSection
          title="Strengths"
          items={strengths.length > 0 ? strengths : fallbackStrengths}
          fallback="No specific strengths were saved for this match yet."
        />
        <MatchDetailSection
          title="Gaps"
          items={gaps}
          fallback="No specific gaps were saved for this match yet."
        />
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Recommendation</h4>
        <p className="text-sm text-gray-700">{fitRecommendation}</p>
      </section>
    </div>
  );
}

function EditJobDetailsDialog({
  job,
  onClose,
  onSave,
}: {
  job: RankedJob;
  onClose: () => void;
  onSave: (jobId: string, input: { company: string; title: string }) => Promise<void>;
}) {
  const [company, setCompany] = useState(job.company);
  const [title, setTitle] = useState(job.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDetails() {
    setSaving(true);
    setError(null);

    try {
      await onSave(job.id, { company, title });
      onClose();
    } catch {
      setError("Unable to save job details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit details modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`edit-job-details-title-${job.id}`}
        className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl"
      >
        <header className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id={`edit-job-details-title-${job.id}`} className="text-lg font-semibold">
              Edit Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="space-y-4 px-5 py-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <label className="block text-sm font-medium text-gray-700">
            Company
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>
        </div>

        <footer className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDetails}
            disabled={saving || !company.trim() || !title.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </footer>
      </section>
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
    return <div className="text-sm text-muted-foreground">Structured data not available</div>;
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
function ResumeTailorDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
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

        const profiles = data.map((r: any) => ({
          id: r.id,
          name: r.name || "Untitled Resume",
          currentVersionId: r.currentVersionId || r.current_version_id || "",
        }));

        setResumes(profiles);
        setSelectedProfile(
          profiles.find((profile: ResumeProfile) => profile.currentVersionId) ??
            profiles[0] ??
            null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close tailored resume modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`generate-tailored-resume-title-${jobId}`}
        className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl"
      >
        <header className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id={`generate-tailored-resume-title-${jobId}`} className="text-lg font-semibold">
              Generate tailored resume
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </header>

        <div className="space-y-4 px-5 py-4">
          <label className="block text-sm font-medium text-gray-700">
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
              <option value="">
                {loadingProfiles ? "Loading resumes..." : "Select resume..."}
              </option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

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

        <footer className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canTailor || loading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Tailored Resume"}
          </button>
        </footer>
      </section>
    </div>
  );
}
