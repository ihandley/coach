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
  score: number;
};

export function JobsPageClient() {
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
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.original.status)}`}>
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

  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((j) => j.status === statusFilter);

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
                      <td colSpan={6} className="bg-gray-50 px-4 py-3 text-sm">
                        <div><strong>Company:</strong> {row.original.company}</div>
                        <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.original.status)}`}>
            {row.original.status}
          </span></div>
                        <div><strong>Score:</strong> {row.original.score}</div>
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
      )}
    </div>
  );
}
