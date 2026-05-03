create table if not exists public.exported_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_type text not null,
  source_entity_type text not null,
  source_entity_id text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  checksum_sha256 text not null,
  byte_size integer not null check (byte_size >= 0),
  created_at timestamptz not null default now()
);

create index if not exists exported_artifacts_source_idx
  on public.exported_artifacts (source_entity_type, source_entity_id, created_at desc);
