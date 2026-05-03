import { NextResponse } from "next/server";
import { createServerClient } from "@coach/db";

export async function GET() {
  const db = createServerClient();

  const { data: profiles, error } = await db
    .from("resume_profiles")
    .select("id, name, created_at, current_version_id, source")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentVersionIds = Array.from(
    new Set(
      (profiles ?? [])
        .map((profile) => profile.current_version_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const currentVersionsById = new Map<string, unknown>();

  if (currentVersionIds.length > 0) {
    const { data: versions, error: versionsError } = await db
      .from("resume_versions")
      .select(
        "id, resume_profile_id, version_number, kind, source_kind, source_label, created_at",
      )
      .in("id", currentVersionIds);

    if (versionsError) {
      return NextResponse.json({ error: versionsError.message }, { status: 500 });
    }

    for (const version of versions ?? []) {
      currentVersionsById.set(version.id, {
        id: version.id,
        resumeProfileId: version.resume_profile_id,
        versionNumber: version.version_number,
        kind: version.kind,
        source: {
          kind: version.source_kind,
          label: version.source_label,
        },
        created_at: version.created_at,
      });
    }
  }

  return NextResponse.json(
    (profiles ?? []).map((profile) => ({
      ...profile,
      currentVersionId: profile.current_version_id ?? "",
      currentVersion: profile.current_version_id
        ? currentVersionsById.get(profile.current_version_id) ?? null
        : null,
    })),
  );
}

export async function POST(req: Request) {
  const db = createServerClient();
  const input = await req.json();
  const normalizedResume = input.normalizedResume;
  const source = input.source ?? { kind: "manual", label: "Baseline Resume" };

  if (
    !normalizedResume ||
    typeof normalizedResume !== "object" ||
    !source ||
    typeof source !== "object" ||
    typeof source.kind !== "string" ||
    typeof source.label !== "string"
  ) {
    return NextResponse.json(
      { error: "INVALID_RESUME_PROFILE_INPUT" },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await db
    .from("resume_profiles")
    .insert({
      name: input.name || `Resume ${new Date().toISOString().slice(0, 10)}`,
      source,
      normalized_resume: normalizedResume,
    })
    .select("*")
    .single();

  if (profileError) {
    console.error("profile insert failed", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let { data: version, error: versionError } = await db
    .from("resume_versions")
    .insert({
      resume_profile_id: profile.id,
      version_number: 1,
      kind: "baseline",
      source_kind: source.kind,
      source_label: source.label,
      normalized_resume: normalizedResume,
    })
    .select("*")
    .single();

  if (versionError?.code === "PGRST204") {
    const fallback = await db
      .from("resume_versions")
      .insert({
        resume_profile_id: profile.id,
        normalized_resume: normalizedResume,
      })
      .select("*")
      .single();

    version = fallback.data;
    versionError = fallback.error;
  }

  if (versionError) {
    console.error("resume_versions insert failed:", versionError);
    await db.from("resume_profiles").delete().eq("id", profile.id);
    return NextResponse.json({ error: versionError.message }, { status: 500 });
  }

  const { data: updatedProfile, error: updateError } = await db
    .from("resume_profiles")
    .update({ current_version_id: version.id })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (updateError) {
    console.error("resume_profiles current_version_id update failed:", updateError);
    await db.from("resume_profiles").delete().eq("id", profile.id);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: updatedProfile, version }, { status: 201 });
}
