import { expect, test } from "@playwright/test";

const resumeProfileId = "11111111-1111-4111-8111-111111111111";
const resumeVersionId = "22222222-2222-4222-8222-222222222222";
const jobId = "00000000-0000-4000-8000-000000000001";

test("restored resume workflow APIs are available", async ({ request }) => {
  const directAnswer = await request.post(
    `/api/resume-profiles/${resumeProfileId}/application-answers`,
    {
      data: {
        question: "Why are you interested in this role?",
        candidateName: "Jordan Lee",
        companyName: "Pattern",
        jobTitle: "Staff Software Engineer, Predict",
        jobSummary: "Build marketplace integrations and mentor engineers.",
        resumeSummary: "Leads TypeScript, React, Node.js, and PostgreSQL delivery.",
      },
    },
  );
  expect(directAnswer.status()).toBe(201);
  await expect(directAnswer.json()).resolves.toEqual({
    answer: expect.stringContaining("Staff Software Engineer, Predict"),
  });

  const answerFromJob = await request.post(
    `/api/resume-profiles/${resumeProfileId}/application-answers/from-job`,
    {
      data: {
        jobId,
        question: "Why are you interested in this role?",
      },
    },
  );
  expect(answerFromJob.status()).toBe(201);
  await expect(answerFromJob.json()).resolves.toEqual({
    answer: expect.stringContaining("Test Co"),
  });

  const directCoverLetter = await request.post(
    `/api/resume-profiles/${resumeProfileId}/cover-letter-drafts`,
    {
      data: {
        jobId,
        candidateName: "Jordan Lee",
        companyName: "Test Co",
        jobTitle: "Test Job (CHAOS / EASTER EGG)",
        jobSummary: "Build production systems with TypeScript and Postgres.",
        resumeSummary: "Leads TypeScript, React, Node.js, and PostgreSQL delivery.",
      },
    },
  );
  expect(directCoverLetter.status()).toBe(201);
  await expect(directCoverLetter.json()).resolves.toEqual(
    expect.objectContaining({
      resumeProfileId,
      jobId,
      content: expect.stringContaining("Dear Hiring Team at Test Co"),
    }),
  );

  const coverLetterFromJob = await request.post(
    `/api/resume-profiles/${resumeProfileId}/cover-letter-drafts/from-job`,
    {
      data: {
        jobId,
      },
    },
  );
  expect(coverLetterFromJob.status()).toBe(201);
  await expect(coverLetterFromJob.json()).resolves.toEqual(
    expect.objectContaining({
      resumeProfileId,
      jobId,
      content: expect.stringContaining("Dear Hiring Team at Test Co"),
    }),
  );

  const review = await request.get(`/api/resume-profiles/${resumeProfileId}/review`);
  expect(review.status()).toBe(200);
  await expect(review.json()).resolves.toEqual(
    expect.objectContaining({
      resumeProfileId,
      resumeVersionId,
      review: expect.objectContaining({
        coreStrengths: expect.any(Array),
        recommendedImprovements: expect.any(Array),
      }),
    }),
  );

  const suggestions = await request.post(
    `/api/resume-profiles/${resumeProfileId}/tailoring-suggestions`,
    {
      data: {
        jobId,
        sourceResumeVersionId: resumeVersionId,
      },
    },
  );
  expect(suggestions.status()).toBe(200);
  await expect(suggestions.json()).resolves.toEqual(expect.any(Array));

  const tailoredResume = await request.post(
    `/api/resume-profiles/${resumeProfileId}/tailored-resumes`,
    {
      data: {
        jobId,
        sourceResumeVersionId: resumeVersionId,
      },
    },
  );
  expect(tailoredResume.status()).toBe(200);
  const tailoredResumeBody = await tailoredResume.json();
  expect(tailoredResumeBody).toEqual(
    expect.objectContaining({
      version: expect.objectContaining({
        kind: "tailored",
        lineage: {
          sourceResumeVersionId: resumeVersionId,
          sourceJobId: jobId,
        },
      }),
      tailoredResume: expect.objectContaining({
        name: "E2E Resume - Test Co",
      }),
      suggestions: expect.any(Array),
    }),
  );

  const cleanup = await request.delete(
    `/api/resume-profiles/${tailoredResumeBody.tailoredResume.id}/delete`,
  );
  expect(cleanup.status()).toBe(200);
});
