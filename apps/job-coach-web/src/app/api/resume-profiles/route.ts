import { NextResponse } from "next/server";
import { createServerClient } from "@coach/db";

export async function GET() {
  const db = createServerClient();

  const { data, error } = await db
    .from("resume_profiles")
    .select("id, name, created_at, current_version_id, source")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const db = createServerClient();
  const input = await req.json();
  const normalizedResume = input.normalizedResume;

  if (!normalizedResume || typeof normalizedResume !== "object") {
    return NextResponse.json(
      { error: "INVALID_RESUME_PROFILE_INPUT" },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await db
    .from("resume_profiles")
    .insert({
      name: input.name || `Resume ${new Date().toISOString().slice(0, 10)}`,
      source: input.source ?? { kind: "import", label: "pdf" },
      normalized_resume: normalizedResume,
    })
    .select("*")
    .single();

  if (profileError) {
    console.error("profile insert failed", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: version, error: versionError } = await db
    .from("resume_versions")
    .insert({
      resume_profile_id: profile.id,
      normalized_resume: normalizedResume,
    })
    .select("*")
    .single();

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
