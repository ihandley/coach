export async function applyStatusUpdates(emails: any[]) {
  for (const email of emails) {
    if (!email.detectedStatus || !email.matchedJobId) continue;

    await fetch(`http://localhost:3000/api/jobs/${email.matchedJobId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: email.detectedStatus }),
    });
  }
}
