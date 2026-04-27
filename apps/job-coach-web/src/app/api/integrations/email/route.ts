import { listRecentEmails } from "@/server/email/gmail";

export async function GET() {
  try {
    const emailData = await listRecentEmails();

    const emails = emailData.emails || [];

    const scanned = emailData.totalScanned ?? emails.length;
    const matched = emailData.totalMatched ?? emails.length;

    let actionable = 0;

    const results = emails.map((email: any) => {
      const isActionable =
        email.confidence >= 0.7 &&
        email.snippet?.toLowerCase().includes("interview");

      if (isActionable) actionable++;

      return {
        email,
        matched: true,
        job: {
          id: email.matchedJobId,
          title: email.matchedJobTitle,
          company: email.matchedJobCompany,
          status: email.currentStatus,
        },
        confidence: email.confidence,
        actionable: isActionable,
      };
    });

    return Response.json({
      counts: {
        scanned,
        matched,
        actionable,
      },
      results,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "EMAIL_SCAN_FAILED" }, { status: 500 });
  }
}
