import { NextResponse } from "next/server";
import { createServerClient } from "@coach/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = createServerClient();

  const { error: unlinkError } = await db
    .from("resume_profiles")
    .update({ current_version_id: null })
    .eq("id", id);

  if (unlinkError) {
    return NextResponse.json({ error: unlinkError.message }, { status: 500 });
  }

  const { error } = await db
    .from("resume_profiles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
