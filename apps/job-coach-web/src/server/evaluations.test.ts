import { describe, expect, it } from "vitest";

import { InMemoryJobRepository } from "@coach/core";
import { createInMemoryJobEvaluationRepository } from "@coach/core";
import { createInMemoryResumeProfileRepository } from "@coach/core";

import { createEvaluationServer, type EvaluationServer } from "./evaluations";

describe("createEvaluationServer", () => {
  it("scores a job fit and returns the saved evaluation", async () => {
    const jobs = new InMemoryJobRepository();
    const resumeProfiles = createInMemoryResumeProfileRepository();
    const evaluations = createInMemoryJobEvaluationRepository();

    const job = await jobs.createJob({
      company: "Acme",
      title: "Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Build APIs with TypeScript and Postgres",
      status: "saved",
    });

    const resumeProfile = await resumeProfiles.createResumeProfile({
      name: "Baseline Resume",
      currentVersionId: "resume-version-1",
    });

    const server = createEvaluationServer({
      scoreJobFit: async (input) => {
        expect(input).toEqual({
          jobId: job.id,
          resumeProfileId: resumeProfile.id,
        });

        return evaluations.create({
          jobId: job.id,
          resumeProfileId: resumeProfile.id,
          score: 82,
          recommendation: "good-fit",
          reasoning: {
            strengths: ["TypeScript experience aligns well"],
            gaps: ["No explicit Postgres signal"],
            riskFactors: [],
            summary: "Solid match with a small database gap.",
          },
        });
      },
      listEvaluationsByJobAndResumeProfile: evaluations.listByJobAndResumeProfile,
    });

    const evaluation = await server.scoreJobFit({
      jobId: job.id,
      resumeProfileId: resumeProfile.id,
    });

    expect(evaluation).toMatchObject({
      jobId: job.id,
      resumeProfileId: resumeProfile.id,
      score: 82,
      recommendation: "good-fit",
    });
  });

  it("returns the latest evaluation for a job and resume profile pair", async () => {
    const evaluations = createInMemoryJobEvaluationRepository();

    await evaluations.create({
      jobId: "job-123",
      resumeProfileId: "resume-123",
      score: 70,
      recommendation: "stretch",
      reasoning: {
        strengths: ["Relevant backend experience"],
        gaps: ["Limited database depth"],
        riskFactors: [],
        summary: "Decent fit with some gaps.",
      },
    });

    const latest = await evaluations.create({
      jobId: "job-123",
      resumeProfileId: "resume-123",
      score: 82,
      recommendation: "good-fit",
      reasoning: {
        strengths: ["TypeScript experience aligns well"],
        gaps: ["No explicit Postgres signal"],
        riskFactors: [],
        summary: "Solid match with a small database gap.",
      },
    });

    const server = createEvaluationServer({
      scoreJobFit: async () => {
        throw new Error("not used in this test");
      },
      listEvaluationsByJobAndResumeProfile: evaluations.listByJobAndResumeProfile,
    });

    await expect(
      server.getLatestEvaluation({
        jobId: "job-123",
        resumeProfileId: "resume-123",
      }),
    ).resolves.toMatchObject({
      id: latest.id,
      score: 82,
      recommendation: "good-fit",
    });
  });

  it("returns null when there is no evaluation history", async () => {
    const evaluations = createInMemoryJobEvaluationRepository();

    const server = createEvaluationServer({
      scoreJobFit: async () => {
        throw new Error("not used in this test");
      },
      listEvaluationsByJobAndResumeProfile: evaluations.listByJobAndResumeProfile,
    });

    await expect(
      server.getLatestEvaluation({
        jobId: "missing-job",
        resumeProfileId: "missing-resume",
      }),
    ).resolves.toBeNull();
  });
});
