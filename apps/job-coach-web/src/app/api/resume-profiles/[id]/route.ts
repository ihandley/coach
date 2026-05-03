import { NextResponse } from "next/server";
import { createServerClient } from "@coach/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = createServerClient();

  const { data: profile, error: profileError } = await db
    .from("resume_profiles")
    .select("id, name, created_at, current_version_id, source")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Resume profile not found" }, { status: 404 });
  }

  const versionQuery = db.from("resume_versions").select("*").eq("resume_profile_id", id);

  const { data: currentVersion, error: versionError } = profile.current_version_id
    ? await versionQuery.eq("id", profile.current_version_id).maybeSingle()
    : await versionQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 500 });
  }

  if (!currentVersion) {
    return NextResponse.json({ error: "No resume version found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      created_at: profile.created_at,
      current_version_id: profile.current_version_id,
      source: profile.source,
    },
    version: {
      ...currentVersion,
      normalized_resume:
        typeof currentVersion.normalized_resume === "string"
          ? JSON.parse(currentVersion.normalized_resume)
          : currentVersion.normalized_resume,
    },
  });
}
