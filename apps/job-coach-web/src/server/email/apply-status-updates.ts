export async function applyStatusUpdates(emails: any[]) {
  const updates = emails.filter(
    (email) =>
      email.detectedStatus &&
      email.matchedJobId &&
      email.currentStatus &&
      email.currentStatus !== email.detectedStatus,
  );

  for (const email of updates) {
    await fetch(`${process.env.JOB_COACH_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/api/jobs/${email.matchedJobId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: email.detectedStatus }),
    });
  }

  return {
    applied: updates.length,
  };
}
