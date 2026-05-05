"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

type EmailRow = {
  id: string;
  date?: string | null;
  subject?: string | null;
  from?: string | null;
  snippet?: string | null;
  appleMailUrl?: string | null;
  matchedJobCompany?: string | null;
  matchedJobTitle?: string | null;
  detectedStatus?: string | null;
  currentStatus?: string | null;
  confidence?: number | null;
};

function gmailMessageUrl(id: string) {
  return `https://mail.google.com/mail/u/0/#all/${id}`;
}

function statusValue(status?: string | null) {
  return status || "none";
}

function hasStatusChange(email: EmailRow) {
  return Boolean(
    email.detectedStatus && email.currentStatus && email.currentStatus !== email.detectedStatus,
  );
}

export function EmailIntegrationTable({ emails }: { emails: EmailRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [detectedFilter, setDetectedFilter] = useState("all");

  const filteredEmails = useMemo(() => {
    if (detectedFilter === "all") return emails;

    return emails.filter((email) => statusValue(email.detectedStatus) === detectedFilter);
  }, [emails, detectedFilter]);

  const columns = useMemo<ColumnDef<EmailRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        sortingFn: (a, b) => {
          const av = a.original.date ? new Date(a.original.date).getTime() : 0;
          const bv = b.original.date ? new Date(b.original.date).getTime() : 0;
          return av - bv;
        },
        cell: ({ row }) =>
          row.original.date ? new Date(row.original.date).toLocaleDateString() : "",
      },
      {
        accessorKey: "subject",
        header: "Email",
        cell: ({ row }) => {
          const email = row.original;

          return (
            <div>
              <div className="space-y-1">
                <a
                  href={email.appleMailUrl || gmailMessageUrl(email.id)}
                  className="font-medium text-blue-600 underline"
                >
                  {email.subject || "(No subject)"}
                </a>
                <div className="text-xs">
                  <a
                    href={gmailMessageUrl(email.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 underline"
                  >
                    Open in Gmail
                  </a>
                </div>
              </div>
              <div className="mt-1 max-w-xl text-xs text-gray-500">{email.snippet}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "from",
        header: "From",
      },
      {
        id: "matchedJob",
        header: "Matched Job",
        accessorFn: (row) => `${row.matchedJobCompany || ""} ${row.matchedJobTitle || ""}`,
        cell: ({ row }) => (
          <div>
            <div>{row.original.matchedJobCompany}</div>
            <div className="text-xs text-gray-500">{row.original.matchedJobTitle}</div>
          </div>
        ),
      },
      {
        accessorKey: "detectedStatus",
        header: "Detected",
        accessorFn: (row) => statusValue(row.detectedStatus),
        cell: ({ row }) => (
          <>
            {statusValue(row.original.detectedStatus)}
            {row.original.confidence ? (
              <span className="ml-2 text-xs text-gray-500">
                {Math.round(row.original.confidence * 100)}%
              </span>
            ) : null}
          </>
        ),
      },
      {
        id: "change",
        header: "Change",
        accessorFn: (row) =>
          hasStatusChange(row) ? `${row.currentStatus} → ${row.detectedStatus}` : "no change",
        cell: ({ row }) =>
          hasStatusChange(row.original) ? (
            <span className="text-orange-600">
              {row.original.currentStatus} → {row.original.detectedStatus}
            </span>
          ) : (
            <span className="text-gray-400">no change</span>
          ),
      },
    ],
    [],
  );

  // TanStack Table intentionally returns non-memoizable table helpers.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredEmails,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <label className="sr-only" htmlFor="detected-status-filter">
          Filter by detected status
        </label>
        <select
          id="detected-status-filter"
          value={detectedFilter}
          onChange={(event) => setDetectedFilter(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All detected statuses</option>
          <option value="none">None</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`px-4 py-2 text-left font-medium text-gray-700 ${
                        canSort ? "cursor-pointer select-none" : ""
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection === "asc" ? " ↑" : null}
                      {sortDirection === "desc" ? " ↓" : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.original.id}
                data-testid="email-integration-row"
                className={`border-t align-top ${
                  hasStatusChange(row.original) ? "bg-orange-50" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
