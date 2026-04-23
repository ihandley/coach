create table if not exists exported_artifacts (
    id uuid primary key default gen_random_uuid(),
    artifact_type text not null,
    source_entity_type text not null,
    source_entity_id text not null,
    file_name text not null,
    storage_path text not null,
    mime_type text not null,
    checksum_sha256 text not null,
    byte_size integer not null,
    created_at timestamptz not null default now()
);