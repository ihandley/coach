create table if not exists workflow_runs (
    id uuid primary key default gen_random_uuid(),
    workflow_type text not null,
    status text not null,
    input jsonb not null,
    current_step_key text null,
    error_message text null,
    retry_count integer not null default 0,
    started_at timestamptz null,
    completed_at timestamptz null,
    created_at timestamptz not null default now()
);

create table if not exists workflow_steps (
    id uuid primary key default gen_random_uuid(),
    workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
    step_key text not null,
    status text not null,
    attempt_count integer not null default 0,
    error_message text null,
    started_at timestamptz null,
    completed_at timestamptz null,
    created_at timestamptz not null default now()
);

create index if not exists workflow_runs_created_at_idx
    on workflow_runs (created_at);

create index if not exists workflow_steps_workflow_run_id_idx
    on workflow_steps (workflow_run_id, created_at);