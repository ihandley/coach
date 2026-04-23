#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Iterable

if TYPE_CHECKING:
    from supabase import Client

VALID_JOB_STATUSES = {
    "saved",
    "researching",
    "applying",
    "applied",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn",
    "archived",
}


@dataclass
class ImportConfig:
    opencode_repo_root: Path
    dry_run: bool
    resume_profile_name: str
    resume_source_label: str


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        raw = handle.read()

    if not raw.strip():
        return None

    return json.loads(raw)


def load_jobs(path: Path) -> list[dict[str, Any]]:
    payload = read_json(path)

    if isinstance(payload, dict) and isinstance(payload.get("jobs"), list):
        return payload["jobs"]

    if isinstance(payload, list):
        return payload

    if payload in (None, "", {}):
        return []

    raise ValueError(f"Unsupported jobs payload shape in {path}")


def load_resume(path: Path) -> dict[str, Any]:
    payload = read_json(path)

    if not isinstance(payload, dict):
        raise ValueError(f"Unsupported resume payload shape in {path}")

    return payload


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def create_supabase() -> "Client":
    from supabase import create_client

    url = require_env("SUPABASE_URL")
    key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def map_legacy_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()

    mapping = {
        "saved": "saved",
        "researching": "researching",
        "applying": "applying",
        "applied": "applied",
        "under_review": "applied",
        "awaiting_opportunity": "researching",
        "interviewing": "interviewing",
        "offer": "offer",
        "rejected": "rejected",
        "withdrawn": "withdrawn",
        "archived": "archived",
    }

    mapped = mapping.get(normalized, "saved")
    if mapped not in VALID_JOB_STATUSES:
        raise ValueError(f"Mapped invalid job status: {mapped}")

    return mapped


def derive_headline(summary: str) -> str:
    trimmed = summary.strip()

    if not trimmed:
        return "Professional"

    marker = trimmed.find(" with ")
    if marker > 0:
        return trimmed[:marker].strip()

    marker = trimmed.find(".")
    if marker > 0:
        return trimmed[:marker].strip()

    return trimmed


def map_resume_to_normalized_resume(legacy_resume: dict[str, Any]) -> dict[str, Any]:
    return {
        "basics": {
            "fullName": legacy_resume.get("name", "").strip(),
            "headline": derive_headline(legacy_resume.get("summary", "")),
            "summary": legacy_resume.get("summary", "").strip(),
        },
        "skills": [
            skill.strip()
            for skill in legacy_resume.get("skills", [])
            if isinstance(skill, str) and skill.strip()
        ],
        "experience": [
            {
                "company": item.get("company", "").strip(),
                "title": item.get("title", "").strip(),
                "highlights": [
                    bullet.strip()
                    for bullet in item.get("bullets", [])
                    if isinstance(bullet, str) and bullet.strip()
                ],
            }
            for item in legacy_resume.get("work_experience", [])
            if isinstance(item, dict)
        ],
        "education": legacy_resume.get("education", []),
    }


def create_legacy_source_url(job: dict[str, Any]) -> str:
    url = (job.get("url") or "").strip()
    if url:
        return url
    return f"legacy://job-coach/jobs/{job.get('id', 'unknown')}"


def build_source_text(job: dict[str, Any]) -> str:
    sections: list[str] = []

    summary_lines = [
        f"{(job.get('company') or '').strip()} — {(job.get('title') or '').strip()}",
    ]

    if job.get("location"):
        summary_lines.append(f"Location: {job['location']}")
    if job.get("salary"):
        summary_lines.append(f"Salary: {job['salary']}")
    if job.get("description"):
        summary_lines.append(str(job["description"]).strip())

    sections.append("\n".join(summary_lines))

    for title, key in [
        ("Requirements", "requirements"),
        ("Nice to have", "nice_to_have"),
        ("Benefits", "benefits"),
        ("Tech stack", "tech_stack"),
    ]:
        items = job.get(key) or []
        cleaned = [str(item).strip() for item in items if str(item).strip()]
        if cleaned:
            sections.append(f"{title}:\n" + "\n".join(f"- {item}" for item in cleaned))

    return "\n\n".join(section for section in sections if section.strip())


def make_import_events(job: dict[str, Any]) -> list[dict[str, str]]:
    events: list[dict[str, str]] = []

    saved_date = (job.get("saved_date") or "").strip()
    if saved_date:
        events.append(
            {
                "type": "note_added",
                "note": f"Legacy saved date: {saved_date}",
            }
        )

    applied_date = (job.get("applied_date") or "").strip()
    if applied_date:
        events.append(
            {
                "type": "status_changed",
                "note": f"Legacy applied date: {applied_date}",
            }
        )

    notes = (job.get("notes") or "").strip()
    if notes:
        events.append(
            {
                "type": "note_added",
                "note": notes,
            }
        )

    last_email_note = (job.get("last_email_note") or "").strip()
    last_email_date = (job.get("last_email_date") or "").strip()
    if last_email_note:
        prefix = (
            f"Legacy email update ({last_email_date}): "
            if last_email_date
            else "Legacy email update: "
        )
        events.append(
            {
                "type": "note_added",
                "note": prefix + last_email_note,
            }
        )

    return events


def dedupe_jobs(*job_lists: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    merged: list[dict[str, Any]] = []

    for jobs in job_lists:
        for job in jobs:
            source_url = create_legacy_source_url(job)
            company = str(job.get("company") or "").strip().lower()
            title = str(job.get("title") or "").strip().lower()
            fallback_key = f"{company}::{title}"

            key = source_url.lower()
            if key.startswith("legacy://"):
                key = fallback_key

            if key in seen:
                continue

            seen.add(key)
            merged.append(job)

    return merged


def find_resume_profile_by_name(
    supabase: Client,
    name: str,
) -> dict[str, Any] | None:
    result = (
        supabase.table("resume_profiles")
        .select("id,name,current_version_id")
        .eq("name", name)
        .limit(1)
        .execute()
    )

    rows = result.data or []
    return rows[0] if rows else None


def find_resume_versions_for_profile(
    supabase: Client,
    profile_id: str,
) -> list[dict[str, Any]]:
    result = (
        supabase.table("resume_versions")
        .select(
            "id,profile_id,version_number,kind,source_kind,source_label,normalized_resume"
        )
        .eq("profile_id", profile_id)
        .order("version_number")
        .execute()
    )

    return result.data or []


def create_resume_profile(
    supabase: Client,
    name: str,
    current_version_id: str | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": name,
        "current_version_id": current_version_id,
    }

    result = (
        supabase.table("resume_profiles")
        .insert(payload, returning="representation")
        .execute()
    )

    rows = result.data or []
    if not rows:
        raise RuntimeError("Failed to create resume profile")

    return rows[0]


def update_resume_profile_current_version(
    supabase: Client,
    profile_id: str,
    current_version_id: str,
) -> dict[str, Any]:
    result = (
        supabase.table("resume_profiles")
        .update(
            {"current_version_id": current_version_id},
            returning="representation",
        )
        .eq("id", profile_id)
        .execute()
    )

    rows = result.data or []
    if not rows:
        raise RuntimeError("Failed to update resume profile current version")

    return rows[0]


def create_resume_version(
    supabase: Client,
    profile_id: str,
    version_number: int,
    source_kind: str,
    source_label: str,
    normalized_resume: dict[str, Any],
) -> dict[str, Any]:
    result = (
        supabase.table("resume_versions")
        .insert(
            {
                "profile_id": profile_id,
                "version_number": version_number,
                "kind": "baseline",
                "source_kind": source_kind,
                "source_label": source_label,
                "normalized_resume": normalized_resume,
                "source_resume_version_id": None,
                "source_job_id": None,
            },
            returning="representation",
        )
        .execute()
    )

    rows = result.data or []
    if not rows:
        raise RuntimeError("Failed to create resume version")

    return rows[0]


def find_job_by_source_url(
    supabase: Client,
    source_url: str,
) -> dict[str, Any] | None:
    result = (
        supabase.table("jobs")
        .select("id,company,title,source_url")
        .eq("source_url", source_url)
        .limit(1)
        .execute()
    )

    rows = result.data or []
    return rows[0] if rows else None


def find_job_by_company_title(
    supabase: Client,
    company: str,
    title: str,
) -> dict[str, Any] | None:
    result = (
        supabase.table("jobs")
        .select("id,company,title,source_url")
        .eq("company", company)
        .eq("title", title)
        .limit(1)
        .execute()
    )

    rows = result.data or []
    return rows[0] if rows else None


def create_job(
    supabase: Client,
    company: str,
    title: str,
    source_url: str,
    source_text: str,
    status: str,
) -> dict[str, Any]:
    result = (
        supabase.table("jobs")
        .insert(
            {
                "company": company,
                "title": title,
                "source_url": source_url,
                "source_text": source_text,
                "status": status,
            },
            returning="representation",
        )
        .execute()
    )

    rows = result.data or []
    if not rows:
        raise RuntimeError("Failed to create job")

    return rows[0]


def create_application_event(
    supabase: Client,
    job_id: str,
    event_type: str,
    note: str,
) -> dict[str, Any]:
    result = (
        supabase.table("application_events")
        .insert(
            {
                "job_id": job_id,
                "type": event_type,
                "note": note,
            },
            returning="representation",
        )
        .execute()
    )

    rows = result.data or []
    if not rows:
        raise RuntimeError("Failed to create application event")

    return rows[0]


def print_json(label: str, value: Any) -> None:
    print(f"\n{label}:")
    print(json.dumps(value, indent=2))


def ensure_baseline_resume(
    supabase: Client,
    legacy_resume: dict[str, Any],
    config: ImportConfig,
) -> dict[str, Any]:
    normalized_resume = map_resume_to_normalized_resume(legacy_resume)
    existing_profile = find_resume_profile_by_name(supabase, config.resume_profile_name)

    if existing_profile:
        versions = find_resume_versions_for_profile(supabase, existing_profile["id"])
        matching_version = next(
            (
                version
                for version in versions
                if version["kind"] == "baseline"
                and version["source_kind"] == "legacy_import"
                and version["source_label"] == config.resume_source_label
            ),
            None,
        )

        if matching_version:
            return {
                "action": "reused",
                "resumeProfileId": existing_profile["id"],
                "resumeVersionId": matching_version["id"],
            }

        next_version_number = max(
            (int(version["version_number"]) for version in versions),
            default=0,
        ) + 1

        created_version = create_resume_version(
            supabase=supabase,
            profile_id=existing_profile["id"],
            version_number=next_version_number,
            source_kind="legacy_import",
            source_label=config.resume_source_label,
            normalized_resume=normalized_resume,
        )

        update_resume_profile_current_version(
            supabase=supabase,
            profile_id=existing_profile["id"],
            current_version_id=created_version["id"],
        )

        return {
            "action": "created_version",
            "resumeProfileId": existing_profile["id"],
            "resumeVersionId": created_version["id"],
        }

    created_profile = create_resume_profile(
        supabase=supabase,
        name=config.resume_profile_name,
        current_version_id=None,
    )

    created_version = create_resume_version(
        supabase=supabase,
        profile_id=created_profile["id"],
        version_number=1,
        source_kind="legacy_import",
        source_label=config.resume_source_label,
        normalized_resume=normalized_resume,
    )

    update_resume_profile_current_version(
        supabase=supabase,
        profile_id=created_profile["id"],
        current_version_id=created_version["id"],
    )

    return {
        "action": "created",
        "resumeProfileId": created_profile["id"],
        "resumeVersionId": created_version["id"],
    }


def preview_baseline_resume(
    legacy_resume: dict[str, Any],
    config: ImportConfig,
) -> dict[str, Any]:
    return {
        "resumeProfile": {
            "name": config.resume_profile_name,
        },
        "resumeVersion": {
            "kind": "baseline",
            "versionNumber": 1,
            "source": {
                "kind": "legacy_import",
                "label": config.resume_source_label,
            },
            "normalizedResume": map_resume_to_normalized_resume(legacy_resume),
        },
    }


def preview_jobs(jobs: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []

    for job in jobs:
        payload.append(
            {
                "legacyId": str(job.get("id") or ""),
                "job": {
                    "company": str(job.get("company") or "").strip(),
                    "title": str(job.get("title") or "").strip(),
                    "sourceUrl": create_legacy_source_url(job),
                    "sourceText": build_source_text(job),
                    "status": map_legacy_status(job.get("status")),
                },
                "events": make_import_events(job),
            }
        )

    return payload


def import_jobs(
    supabase: Client,
    jobs: list[dict[str, Any]],
) -> dict[str, Any]:
    created_job_ids: list[str] = []
    skipped_legacy_ids: list[str] = []

    for job in jobs:
        company = str(job.get("company") or "").strip()
        title = str(job.get("title") or "").strip()
        source_url = create_legacy_source_url(job)

        existing = find_job_by_source_url(supabase, source_url)
        if not existing and source_url.startswith("legacy://"):
            existing = find_job_by_company_title(supabase, company, title)

        if existing:
            skipped_legacy_ids.append(str(job.get("id") or ""))
            continue

        created = create_job(
            supabase=supabase,
            company=company,
            title=title,
            source_url=source_url,
            source_text=build_source_text(job),
            status=map_legacy_status(job.get("status")),
        )
        created_job_ids.append(created["id"])

        for event in make_import_events(job):
            create_application_event(
                supabase=supabase,
                job_id=created["id"],
                event_type=event["type"],
                note=event["note"],
            )

    return {
        "createdJobs": len(created_job_ids),
        "skippedJobs": len(skipped_legacy_ids),
        "createdJobIds": created_job_ids,
        "skippedLegacyIds": skipped_legacy_ids,
    }


def run_import(config: ImportConfig) -> None:
    jobs_path_a = config.opencode_repo_root / "data/job-coach/jobs.json"
    jobs_path_b = config.opencode_repo_root / "data/jobs.json"
    resume_path = config.opencode_repo_root / "data/job-coach/resume.json"

    jobs_a = load_jobs(jobs_path_a)
    jobs_b = load_jobs(jobs_path_b) if jobs_path_b.exists() else []
    legacy_resume = load_resume(resume_path)
    deduped_jobs = dedupe_jobs(jobs_a, jobs_b)

    print("Legacy import summary")
    print("---------------------")
    print(f"Resume source: {resume_path}")
    print(f"Jobs source A: {jobs_path_a} ({len(jobs_a)} jobs)")
    print(f"Jobs source B: {jobs_path_b} ({len(jobs_b)} jobs)")
    print(f"Deduped jobs: {len(deduped_jobs)}")
    print(f"Dry run: {config.dry_run}")

    if config.dry_run:
        print_json("Resume payload preview", preview_baseline_resume(legacy_resume, config))

        jobs_preview = preview_jobs(deduped_jobs)
        print_json("Jobs payload preview", jobs_preview[:5])
        if len(jobs_preview) > 5:
            print(f"... and {len(jobs_preview) - 5} more jobs")
        return

    supabase = create_supabase()

    resume_result = ensure_baseline_resume(
        supabase=supabase,
        legacy_resume=legacy_resume,
        config=config,
    )
    print_json("Resume import result", resume_result)

    jobs_result = import_jobs(
        supabase=supabase,
        jobs=deduped_jobs,
    )
    print_json("Jobs import result", jobs_result)


def parse_args() -> ImportConfig:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--opencode-repo-root",
        required=True,
        help="Absolute or relative path to the opencode repo root",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print mapped payloads without writing anything",
    )
    parser.add_argument(
        "--resume-profile-name",
        default="Ian Handley",
        help="Name to use for the imported resume profile",
    )
    parser.add_argument(
        "--resume-source-label",
        default="Legacy OpenCode resume import",
        help="Source label to attach to the imported baseline resume version",
    )

    args = parser.parse_args()

    return ImportConfig(
        opencode_repo_root=Path(args.opencode_repo_root).resolve(),
        dry_run=bool(args.dry_run),
        resume_profile_name=str(args.resume_profile_name),
        resume_source_label=str(args.resume_source_label),
    )


def main() -> int:
    try:
        config = parse_args()
        run_import(config)
        return 0
    except Exception as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())