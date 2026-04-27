import { listRecentEmails } from "@/server/email/gmail";

export async function GET() {
  try {
    const data = await listRecentEmails();
    return Response.json(data);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "GMAIL_FETCH_FAILED" }, { status: 500 });
  }
}
