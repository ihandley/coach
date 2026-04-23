create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  version_number integer not null,
  kind text not null check (kind in ('baseline', 'tailored')),
  source_kind text not null,
  source_label text not null,
  normalized_resume jsonb not null,
  source_resume_version_id uuid null,
  source_job_id uuid null references public.jobs(id) on delete set null
);

create table if not exists public.resume_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  current_version_id uuid null references public.resume_versions(id) on delete restrict
);

alter table public.resume_versions
  drop constraint if exists resume_versions_profile_id_fkey;

alter table public.resume_versions
  add constraint resume_versions_profile_id_fkey
  foreign key (profile_id) references public.resume_profiles(id) on delete cascade;

alter table public.resume_versions
  drop constraint if exists resume_versions_source_resume_version_id_fkey;

alter table public.resume_versions
  add constraint resume_versions_source_resume_version_id_fkey
  foreign key (source_resume_version_id) references public.resume_versions(id) on delete set null;

create unique index if not exists resume_versions_profile_version_number_idx
  on public.resume_versions (profile_id, version_number);

create index if not exists resume_versions_profile_id_idx
  on public.resume_versions (profile_id);

create index if not exists resume_profiles_current_version_id_idx
  on public.resume_profiles (current_version_id);

create index if not exists resume_profiles_name_idx
  on public.resume_profiles (name);