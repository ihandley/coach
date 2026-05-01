alter table resume_versions
    add column if not exists version_number integer not null default 1,
    add column if not exists kind text not null default 'baseline',
    add column if not exists source_kind text not null default 'manual',
    add column if not exists source_label text not null default 'Baseline Resume';

