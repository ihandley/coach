import { listRecentEmails } from "@/server/email/gmail";
import { applyStatusUpdates } from "@/server/email/apply-status-updates";

export async function POST() {
  const { emails } = await listRecentEmails();

  await applyStatusUpdates(emails);

  return Response.json({ ok: true });
}
