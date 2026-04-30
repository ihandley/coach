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

type RankedJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  score?: number;
};

export function JobsPageClient({ jobs: initialJobs }: { jobs: RankedJob[] }) {
  const [visibleStatuses, setVisibleStatuses] = React.useState(
    new Set(["saved", "applied", "interviewing", "offer"])
  );

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
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

    const body = await res.json();
    setJobs(Array.isArray(body) ? body : []);
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
        accessorKey: "score",
        header: "Match",
        cell: (info) => {
          const value = Math.round((info.getValue<number>() ?? 0) * 100);
          return (
            <div className="flex items-center justify-end gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${value >= 75
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
          <span
            data-testid="job-status"
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.original.status)}`}
          >
            {row.original.status}
          </span>
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
            >
              Link
            </a>
          );
        },
      },

    ],
    []
  );

  const filteredJobs = React.useMemo(() => {
    return jobs.filter((j) => visibleStatuses.has(String(j.status ?? "").toLowerCase()));
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
                className={`rounded-full border px-3 py-1 text-sm capitalize transition ${active
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
              {table.getRowModel().rows.map((row) => {
                const isExpanded = expandedId === row.original.id;

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      data-testid="job-row"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : row.original.id)
                      }
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>

                    <tr
                      data-testid="job-details"
                      style={{ display: isExpanded ? "table-row" : "none" }}
                    >
                      <td colSpan={row.getVisibleCells().length} className="px-4 py-3 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          <div><strong>Title:</strong> {row.original.title}</div>
                          <div><strong>Company:</strong> {row.original.company}</div>
                          <div><strong>Status:</strong> {row.original.status}</div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
