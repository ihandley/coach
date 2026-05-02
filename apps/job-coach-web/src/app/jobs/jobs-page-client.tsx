"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import { JobStatusSelect } from "./[jobId]/job-status-select";
import { useEffect, useMemo, useState } from "react";
function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "applied":
      return "bg-blue-100 text-blue-800";
    case "interview":
      return "bg-purple-100 text-purple-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}


function formatRawText(text: string) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((p, i) => (
    <p key={i} className="mb-3 whitespace-pre-wrap">
      {p}
    </p>
  ));
}

function extractLocation(text: string): string | null {
  const match = text.match(/\b(Remote|Hybrid|On-site|Orem|Provo|Lehi|Salt Lake City|Utah|CA|California|NY|New York|TX|Texas)\b/i);
  return match ? match[0] : null;
}

function extractSalary(text: string): string | null {
  const match = text.match(/\$[0-9,]+\s*(?:-|–|to)\s*\$[0-9,]+(?:\s*(?:per year|\/year|annually|\/hr|per hour))?/i);
  return match ? match[0] : null;
}

function parseStructured(text: string) {
  return [
    {
      title: "Description",
      content: text
        .split("\n")
        .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
        .filter(Boolean),
    },
  ];
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

export function JobsPageClient() {
  const [visibleStatuses, setVisibleStatuses] = React.useState(
    new Set(["saved", "applied", "interviewing", "offer", "rejected"])
  );

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch("/api/jobs/ranked");

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message =
        body && typeof body.error === "string"
          ? body.error
          : "Unable to load ranked jobs.";

      setError(message);
      return;
    }

    setJobs(await res.json());
    setError(null);
  }

  async function handleImport() {
    if (!url) return;

    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl: url }),
    });

    await load();
    setUrl("");
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
                    new Set([...selectedJobIds].filter((id) => !visibleIds.includes(id)))
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
                    value >= 75
                      ? "bg-green-500"
                      : value >= 50
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900 w-10 text-right">
                {value}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            {row.original.title}
          </span>
        ),
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
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const job = row.original;

          async function updateStatus(status: string) {
            const prevJobs = jobs;

            setJobs(
              jobs.map((j) => (j.id === job.id ? { ...j, status } : j))
            );

            try {
              const res = await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
              });

              if (!res.ok) {
                throw new Error("Status update failed");
              }
            } catch (err) {
              console.error("Update failed", err);
              setJobs(prevJobs);
            }
          }

          return (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-green-600 text-xs underline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus("applied");
                }}
              >
                Apply
              </button>

              <button
                type="button"
                className="text-yellow-600 text-xs underline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus("saved");
                }}
              >
                Maybe
              </button>

              <button
                type="button"
                className="text-red-600 text-xs underline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus("archived");
                }}
              >
                Ignore
              </button>
            </div>
          );
        },
      },
      
    ],
    [selectedJobIds, jobs]
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
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste job URL"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleImport}
            disabled={!url}
            className="btn-primary disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No jobs yet. Import one to get started.
          </p>
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
                      ids.includes(job.id)
                        ? { ...job, status: value }
                        : job
                    );

                    setJobs(updatedJobs);

                    try {
                      await fetch('/api/jobs/bulk-update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids, status: value }),
                      });
                    } catch (err) {
                      console.error('Bulk update failed', err);
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
                      setExpandedId(
                        expandedId === row.original.id ? null : row.original.id
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                  {expandedId === row.original.id && (
                    <tr data-testid="job-details">
                      <td colSpan={9} className="bg-gray-50 px-4 py-3 text-sm">
                        <JobDescription text={row.original.sourceText || ""} structuredSummary={row.original.structuredSummary} />

                        <div className="mt-4 border-t pt-4 space-y-3">
                          <ResumeTailor jobId={row.original.id} />
                        </div>

                        {row.original.sourceUrl && (
                          <a
                            href={row.original.sourceUrl}
                            target="_blank"
                            className="text-blue-600 underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            View Job Posting
                          </a>
                        )}
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


function JobDescription({ text, structuredSummary }: { text: string; structuredSummary?: any }) {
  const [mode, setMode] = useState<"structured" | "raw">("structured");
  const safeText = text || "No job description available.";
  const structured = parseStructured(safeText);
  const location = extractLocation(safeText);
  const salary = extractSalary(safeText);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("structured")}
          className={`border px-2 py-1 ${
            mode === "structured" ? "bg-gray-200" : ""
          }`}
        >
          Overview <span className="sr-only">Structured</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("raw")}
          className={`border px-2 py-1 ${mode === "raw" ? "bg-gray-200" : ""}`}
        >
          Original Posting <span className="sr-only">Raw</span>
        </button>
      </div>

      <div className="96 overflow-y-auto text-sm">
        {mode === "raw" && formatRawText(safeText)}

        {mode === "structured" && (() => {
          const summary = structuredSummary;

          if (!summary) {
            return (
              <div className="text-sm text-muted-foreground">
                No structured summary available yet. Use Raw view for the original posting.
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
        })()}      </div>
    </div>
  );
}
function ResumeTailor({ jobId }: { jobId: string }) {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ResumeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<unknown[] | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/resume-profiles')
      .then((res) => res.json())
      .then((data) =>
        setResumes(data.map((r: any) => ({
          id: r.id,
          name: r.name || 'Untitled Resume',
          currentVersionId: r.currentVersionId || r.current_version_id || '',
        })))
      )
      .catch(() => setResumes([]));
  }, []);

  const canTailor = Boolean(selectedProfile?.currentVersionId);

  async function handleGenerate() {
    if (!selectedProfile?.currentVersionId) return;

    setLoading(true);
    setSuggestions(null);
    setTailorError(null);

    try {
      const res = await fetch(`/api/resume-profiles/${selectedProfile.id}/tailored-resumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          sourceResumeVersionId: selectedProfile.currentVersionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to generate tailored resume.');
      }

      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      console.error(err);
      setTailorError('Unable to generate tailored resume.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          aria-label="Resume profile"
          value={selectedProfile?.id ?? ''}
          onChange={(e) => {
            const profile = resumes.find((resume) => resume.id === e.target.value);
            setSelectedProfile(profile ?? null);
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select resume...</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canTailor || loading}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Tailor Resume'}
        </button>
      </div>

      {!canTailor && (
        <p className="text-sm text-gray-600">Import a resume to enable tailoring</p>
      )}

      {tailorError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {tailorError}
        </div>
      )}

      {suggestions && (
        <pre className="rounded border bg-white p-3 whitespace-pre-wrap text-sm">
          {JSON.stringify(suggestions, null, 2)}
        </pre>
      )}
    </div>
  );
}
