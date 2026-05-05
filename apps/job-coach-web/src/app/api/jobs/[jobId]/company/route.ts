import { createServerClient } from "@coach/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const body = await request.json();
  const company = typeof body?.company === "string" ? body.company.trim() : "";

  if (!company) {
    return Response.json({ error: "INVALID_COMPANY" }, { status: 400 });
  }

  const db = createServerClient();

  const { data, error } = await db
    .from("jobs")
    .update({
      company,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select("id, company")
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: "UPDATE_COMPANY_FAILED" }, { status: 500 });
  }

  return Response.json(data);
}
