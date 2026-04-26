create table if not exists resume_profiles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    source jsonb not null,
    normalized_resume jsonb not null,
    created_at timestamptz not null default now()
);

create table if not exists resume_versions (
    id uuid primary key default gen_random_uuid(),
    resume_profile_id uuid not null references resume_profiles(id) on delete cascade,
    normalized_resume jsonb not null,
    created_at timestamptz not null default now()
);
