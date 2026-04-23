#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import error, request


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
    coach_repo_root: Path
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

    if payload in ("", None, {}):
        return []

    raise ValueError(f"Unsupported jobs payload shape in {path}")


def load_resume(path: Path) -> dict[str, Any]:
    payload = read_json(path)

    if not isinstance(payload, dict):
        raise ValueError(f"Unsupported resume payload shape in {path}")

    return payload


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
            url_key = create_legacy_source_url(job).lower()
            company = str(job.get("company") or "").strip().lower()
            title = str(job.get("title") or "").strip().lower()
            fallback_key = f"{company}::{title}"

            key = url_key if not url_key.startswith("legacy://") else fallback_key

            if key in seen:
                continue

            seen.add(key)
            merged.append(job)

    return merged


def make_resume_import_payload(
    config: ImportConfig,
    legacy_resume: dict[str, Any],
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


def make_jobs_import_payload(legacy_jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []

    for job in legacy_jobs:
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


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={
            "content-type": "application/json",
            **headers,
        },
        method="POST",
    )

    try:
        with request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} from {url}: {body}") from exc


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def run_import(config: ImportConfig) -> None:
    jobs_path_a = config.opencode_repo_root / "data/job-coach/jobs.json"
    jobs_path_b = config.opencode_repo_root / "data/jobs.json"
    resume_path = config.opencode_repo_root / "data/job-coach/resume.json"

    jobs_a = load_jobs(jobs_path_a)
    jobs_b = load_jobs(jobs_path_b) if jobs_path_b.exists() else []
    resume = load_resume(resume_path)

    deduped_jobs = dedupe_jobs(jobs_a, jobs_b)

    resume_payload = make_resume_import_payload(config, resume)
    jobs_payload = make_jobs_import_payload(deduped_jobs)

    print("Legacy import summary")
    print("---------------------")
    print(f"Resume source: {resume_path}")
    print(f"Jobs source A: {jobs_path_a} ({len(jobs_a)} jobs)")
    print(f"Jobs source B: {jobs_path_b} ({len(jobs_b)} jobs)")
    print(f"Deduped jobs: {len(deduped_jobs)}")
    print(f"Dry run: {config.dry_run}")

    if config.dry_run:
        print("\nResume payload preview:")
        print(json.dumps(resume_payload, indent=2))

        print("\nJobs payload preview:")
        print(json.dumps(jobs_payload[:5], indent=2))
        if len(jobs_payload) > 5:
            print(f"... and {len(jobs_payload) - 5} more jobs")
        return

    api_base_url = require_env("COACH_API_BASE_URL").rstrip("/")
    api_token = os.environ.get("COACH_API_TOKEN", "").strip()

    headers: dict[str, str] = {}
    if api_token:
        headers["authorization"] = f"Bearer {api_token}"

    print("\nImporting baseline resume...")
    resume_response = post_json(
        f"{api_base_url}/api/legacy-import/resume",
        resume_payload,
        headers,
    )
    print(json.dumps(resume_response, indent=2))

    print("\nImporting jobs...")
    jobs_response = post_json(
        f"{api_base_url}/api/legacy-import/jobs",
        {"jobs": jobs_payload},
        headers,
    )
    print(json.dumps(jobs_response, indent=2))


def parse_args() -> ImportConfig:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--opencode-repo-root",
        required=True,
        help="Absolute or relative path to the opencode repo root",
    )
    parser.add_argument(
        "--coach-repo-root",
        default=".",
        help="Absolute or relative path to the coach repo root",
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
        help="Source label to attach to the baseline resume version",
    )

    args = parser.parse_args()

    return ImportConfig(
        coach_repo_root=Path(args.coach_repo_root).resolve(),
        opencode_repo_root=Path(args.opencode_repo_root).resolve(),
        dry_run=bool(args.dry_run),
        resume_profile_name=str(args.resume_profile_name),
        resume_source_label=str(args.resume_source_label),
    )


def main() -> int:
    config = parse_args()
    run_import(config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())