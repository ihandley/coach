create table if not exists workflow_runs (
    id uuid primary key default gen_random_uuid(),
    workflow_type text not null,
    status text not null,
    current_step_key text,
    input_json jsonb not null,
    error_message text,
    retry_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists workflow_steps (
    id uuid primary key default gen_random_uuid(),
    workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
    step_key text not null,
    status text not null,
    attempt_count integer not null default 0,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz
);

create index if not exists workflow_runs_status_idx
    on workflow_runs(status);

create index if not exists workflow_steps_run_id_idx
    on workflow_steps(workflow_run_id);