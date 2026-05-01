import { NextResponse } from "next/server";
import { createServerClient } from "@coach/db";

type UploadedFile = {
  name?: unknown;
  type?: unknown;
  dataBase64?: unknown;
};

function getUploadedFile(normalizedResume: unknown): UploadedFile | null {
  if (!normalizedResume || typeof normalizedResume !== "object") {
    return null;
  }

  const candidate = (normalizedResume as { originalFile?: unknown }).originalFile;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  return candidate as UploadedFile;
}

function sanitizeFilename(filename: string) {
  return filename.replaceAll('"', "").replaceAll("\n", " ").replaceAll("\r", " ");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const shouldDownload = new URL(req.url).searchParams.get("download") === "1";
  const db = createServerClient();

  const { data, error } = await db
    .from("resume_versions")
    .select("normalized_resume")
    .eq("resume_profile_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uploadedFile = getUploadedFile(data?.normalized_resume);

  if (
    !uploadedFile ||
    typeof uploadedFile.dataBase64 !== "string" ||
    uploadedFile.dataBase64.length === 0
  ) {
    return NextResponse.json(
      { error: "No uploaded PDF found for this resume" },
      { status: 404 },
    );
  }

  const filename =
    typeof uploadedFile.name === "string" && uploadedFile.name.trim()
      ? sanitizeFilename(uploadedFile.name)
      : "resume.pdf";

  return new NextResponse(Buffer.from(uploadedFile.dataBase64, "base64"), {
    headers: {
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Content-Type":
        typeof uploadedFile.type === "string" && uploadedFile.type
          ? uploadedFile.type
          : "application/pdf",
    },
  });
}
