create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  source_url text not null,
  source_text text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_status_check check (
    status in (
      'saved',
      'researching',
      'applying',
      'applied',
      'interviewing',
      'offer',
      'rejected',
      'withdrawn',
      'archived'
    )
  )
);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null,
  note text not null,
  created_at timestamptz not null default now(),

  constraint application_events_type_check check (
    type in (
      'status_changed',
      'note_added'
    )
  )
);

create index if not exists jobs_status_idx
  on public.jobs (status);

create index if not exists jobs_updated_at_idx
  on public.jobs (updated_at desc);

create index if not exists jobs_company_idx
  on public.jobs (company);

create index if not exists application_events_job_id_idx
  on public.application_events (job_id);

create index if not exists application_events_created_at_idx
  on public.application_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();