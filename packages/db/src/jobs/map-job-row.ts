import type { JobRecord } from "@coach/core";

type JobRow = {
  id: string;
  company: string;
  title: string;
  source_url: string;
  source_text: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapJobRow(row: JobRow): JobRecord {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    sourceUrl: row.source_url,
    sourceText: row.source_text,
    status: row.status as JobRecord["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}