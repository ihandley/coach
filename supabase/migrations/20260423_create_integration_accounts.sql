create table if not exists public.integration_accounts (
    id uuid primary key default gen_random_uuid(),
    provider text not null unique,
    is_connected boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
