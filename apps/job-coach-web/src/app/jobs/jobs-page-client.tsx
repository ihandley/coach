"use client";

import { JobStatusSelect } from "./[jobId]/job-status-select";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

type RankedJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  score: number;
};

export function JobsPageClient() {
  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("all");

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

    setMessageType("info");
    setMessage("⏳ Importing job...");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl: url }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessageType("error");
      setMessage("❌ Import failed");
    } else if (data.duplicate) {
      setMessageType("info");
      setMessage("⚠️ Job already exists");
    } else if (data.created) {
      setMessageType("success");
      setMessage("✅ Job imported successfully");
    } else {
      setMessageType("success");
      setMessage("✅ Import completed");
    }

    await load();
    setUrl("");

    if (data?.job?.id) {
      setMessageType("info");
      setMessage("🔍 Running job match...");
      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: data.job.id, resumeProfileId: "default" }),
      });

      if (matchRes.ok) {
        const result = await matchRes.json();
        console.log("match result", result);
        setMessageType("info");
        setMessage(`🔍 Match calculated: ${Math.round((result?.score ?? 0) * 100)}%. Saving...`);

        const saveRes = await fetch("/api/match/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: data.job.id,
            resumeProfileId: "default",
            result,
          }),
        });

        setMessageType("success");
        setMessage(`✅ Job imported and matched (${Math.round((result?.score ?? 0) * 100)}%)`);

        if (!saveRes.ok) {
          setMessageType("error");
          setMessage("❌ Job imported, but match save failed");
          return;
        }

        await load();
      }
    }
  }

  async function handleDelete(jobId: string) {
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId }),
    });

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  function formatDateTime(value: string) {
    if (!value) return "";
    return new Date(value).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const messageClass =
    messageType === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : messageType === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  const columns = useMemo<ColumnDef<RankedJob>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <button
            onClick={() =>
              setExpandedJobId((prev) => prev === row.original.id ? null : row.original.id)
            }
            className="text-left font-medium text-blue-600 underline"
          >
            {row.original.title}
          </button>
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
          />
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: (info) => formatDateTime(info.getValue<string>()),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => formatDateTime(info.getValue<string>()),
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
            >
              Link
            </a>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((j) => j.status === statusFilter);

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

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
  >
    <option value="all">All</option>
    <option value="saved">Saved</option>
    <option value="applied">Applied</option>
    <option value="interviewing">Interviewing</option>
    <option value="rejected">Rejected</option>
    <option value="offer">Offer</option>
    <option value="archived">Archived</option>
  </select>
</div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleImport();
                }
              }}
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

          {message && (
            <div className={`rounded-md border px-3 py-2 text-sm ${messageClass}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No jobs yet. Import one to get started.
          </p>
        </div>
      ) : (
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
                <Fragment key={row.id}>
                  <tr className="border-t">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>

                  {expandedJobId === row.original.id && (
                    <tr key={`${row.id}-details`} className="border-t bg-gray-50">
                      <td colSpan={row.getVisibleCells().length} className="px-4 py-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <div className="text-lg font-semibold">{row.original.title}</div>
                              <div className="text-sm text-gray-600">{row.original.company}</div>
                            </div>
                            <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                              Match: {Math.round(row.original.score * 100)}%
                            </div>
                          </div>

                          <dl className="grid gap-3 text-sm md:grid-cols-2">
                            <div>
                              <dt className="font-medium text-gray-500">Status</dt>
                              <dd>{row.original.status}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Created</dt>
                              <dd>{formatDateTime(row.original.createdAt)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Updated</dt>
                              <dd>{formatDateTime(row.original.updatedAt)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Source</dt>
                              <dd>
                                {row.original.sourceUrl ? (
                                  <a href={row.original.sourceUrl} target="_blank" className="text-blue-600 underline">
                                    Open posting
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </dd>
                            </div>
                          </dl>

                          <div className="mt-4">
                            <div className="mb-1 font-medium text-gray-500">Description</div>
                            <div className="max-h-72 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                              {(row.original as any).sourceText || (row.original as any).description || (row.original as any).rawDescription || "No description captured."}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
