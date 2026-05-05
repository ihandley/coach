import { listRecentEmails } from "@/server/email/gmail";
import { applyStatusUpdates } from "@/server/email/apply-status-updates";

export async function POST() {
  try {
    const data = await listRecentEmails();
    const updates = data.emails;

    const result = await applyStatusUpdates(updates);

    return Response.json({ success: true, result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "APPLY_FAILED" }, { status: 500 });
  }
}
