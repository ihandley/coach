alter table resume_profiles add column current_version_id uuid references resume_versions(id);
