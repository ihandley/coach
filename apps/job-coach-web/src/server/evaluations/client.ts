export const evaluationsClient = {
  async getLatestEvaluation(input: { jobId: string; resumeProfileId: string }) {
    const url = new URL("/api/evaluations/latest", window.location.origin);
    url.searchParams.set("jobId", input.jobId);
    url.searchParams.set("resumeProfileId", input.resumeProfileId);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  async scoreJobFit(input: { jobId: string; resumeProfileId: string }) {
    const response = await fetch("/api/evaluations/score", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Failed to score job fit");
    }

    return response.json();
  },
};
