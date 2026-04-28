create table if not exists public.job_matches (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  resume_profile_id uuid references public.resume_profiles(id) on delete set null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
