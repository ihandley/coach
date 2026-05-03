"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import { JobStatusSelect } from "./[jobId]/job-status-select";

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
  score: number;
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

export function JobsPageClient() {
  const [visibleStatuses, setVisibleStatuses] = React.useState(
    new Set(["saved", "applied", "interviewing", "offer", "rejected"]),
  );

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch("/api/jobs/ranked");

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message =
        body && typeof body.error === "string" ? body.error : "Unable to load ranked jobs.";

      setError(message);
      return;
    }

    setJobs(await res.json());
    setError(null);
  }

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

  useEffect(() => {
    load();
  }, []);

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
        cell: (info) => {
          const value = Math.round(info.getValue<number>() * 100);
          return (
            <div className="flex items-center justify-end gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${
                    value >= 75 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-gray-400"
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900 w-10 text-right">{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.title}</span>,
      },
      {
        accessorKey: "company",
        header: "Company",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <JobStatusSelect
            jobId={row.original.id}
            initialStatus={row.original.status}
            variant="popover"
          />
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
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
    [selectedJobIds],
  );

  const filteredJobs = React.useMemo(() => {
    return jobs.filter((j) => visibleStatuses.has(j.status?.toLowerCase()));
  }, [jobs, visibleStatuses]);

  const table = useReactTable({
    data: filteredJobs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: {
      sorting: [
        {
          id: "createdAt",
          desc: true,
        },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ranked Jobs</h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm text-slate-600">Show:</span>
          {["saved", "applied", "interviewing", "offer", "rejected", "archived"].map((status) => {
            const active = visibleStatuses.has(status);

            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const next = new Set(visibleStatuses);
                  if (next.has(status)) next.delete(status);
                  else next.add(status);
                  setVisibleStatuses(next);
                }}
                className={`rounded-full border px-3 py-1 text-sm capitalize transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No jobs yet. Import one to get started.</p>
        </div>
      ) : (
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
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="rejected">Rejected</option>
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
      )}
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

function JobDescription({ structuredSummary }: { structuredSummary?: any }) {
  const summary = structuredSummary;

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
        {summary.location && <div>📍 {summary.location}</div>}
        <div>💰 {summary.salaryRange ?? "Salary range not listed"}</div>
      </div>

      {summary.companyInfo?.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Company</h4>
          <ul className="ml-5 list-disc">
            {summary.companyInfo.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.jobDescription?.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Description</h4>
          <ul className="ml-5 list-disc">
            {summary.jobDescription.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.requirements?.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Requirements</h4>
          <ul className="ml-5 list-disc">
            {summary.requirements.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.benefits?.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Benefits</h4>
          <ul className="ml-5 list-disc">
            {summary.benefits.map((item: string, i: number) => (
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
