import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createCoverLetterDraftMock,
    getResumeProfileByIdMock,
    getResumeVersionByIdMock,
    getJobByIdMock,
} = vi.hoisted(() => {
    return {
        createCoverLetterDraftMock: vi.fn(),
        getResumeProfileByIdMock: vi.fn(),
        getResumeVersionByIdMock: vi.fn(),
        getJobByIdMock: vi.fn(),
    };
});

vi.mock("@coach/core", async () => {
    const actual = await vi.importActual<typeof import("@coach/core")>(
        "@coach/core",
    );

    return {
        ...actual,
        createCoverLetterDraft: createCoverLetterDraftMock,
    };
});

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

    return {
        ...actual,
        createDbGetResumeProfile: () => getResumeProfileByIdMock,
        createDbResumeVersionRepository: () => ({
            getResumeVersionById: getResumeVersionByIdMock,
        }),
        DbJobRepository: vi.fn().mockImplementation(function DbJobRepository() {
            return {
                getJobById: getJobByIdMock,
            };
        }),
    };
});

describe(
    "POST /api/resume-profiles/[resumeProfileId]/cover-letter-drafts/from-job",
    () => {
        beforeEach(() => {
            createCoverLetterDraftMock.mockReset();
            getResumeProfileByIdMock.mockReset();
            getResumeVersionByIdMock.mockReset();
            getJobByIdMock.mockReset();
        });

        it("creates a cover letter draft from stored job and resume data", async () => {
            getResumeProfileByIdMock.mockResolvedValue({
                profile: {
                    id: "resume-profile-123",
                    name: "Primary Resume",
                    currentVersionId: "resume-version-123",
                },
                currentVersion: {
                    id: "resume-version-123",
                    profileId: "resume-profile-123",
                    versionNumber: 1,
                    kind: "baseline",
                    source: {
                        kind: "manual",
                        label: "Baseline Resume",
                    },
                    normalizedResume: {
                        basics: {
                            fullName: "Ian Handley",
                            headline: "Senior Software Engineer",
                            summary:
                                "Software engineer with experience building web applications, APIs, and internal tools.",
                        },
                        skills: ["TypeScript", "React", "Node.js"],
                        experience: [
                            {
                                company: "Acme Corp",
                                title: "Software Engineer",
                                highlights: [
                                    "Built internal tools",
                                    "Improved developer workflows",
                                ],
                            },
                        ],
                        education: [],
                    },
                },
            });

            getResumeVersionByIdMock.mockResolvedValue({
                id: "resume-version-123",
                profileId: "resume-profile-123",
                versionNumber: 1,
                kind: "baseline",
                source: {
                    kind: "manual",
                    label: "Baseline Resume",
                },
                normalizedResume: {
                    basics: {
                        fullName: "Ian Handley",
                        headline: "Senior Software Engineer",
                        summary:
                            "Software engineer with experience building web applications, APIs, and internal tools.",
                    },
                    skills: ["TypeScript", "React", "Node.js"],
                    experience: [
                        {
                            company: "Acme Corp",
                            title: "Software Engineer",
                            highlights: [
                                "Built internal tools",
                                "Improved developer workflows",
                            ],
                        },
                    ],
                    education: [],
                },
            });

            getJobByIdMock.mockResolvedValue({
                id: "job-123",
                title: "Senior Software Engineer",
                company: "Acme",
                summary:
                    "Build product features, collaborate across teams, and improve developer experience.",
            });

            createCoverLetterDraftMock.mockResolvedValue({
                id: "cover-letter-draft-123",
                resumeProfileId: "resume-profile-123",
                jobId: "job-123",
                content: "Draft content",
                createdAt: new Date("2026-04-22T12:00:00.000Z"),
            });

            const { POST } = await import("./route");

            const request = new Request(
                "http://localhost/api/resume-profiles/resume-profile-123/cover-letter-drafts/from-job",
                {
                    method: "POST",
                    body: JSON.stringify({
                        jobId: "job-123",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const response = await POST(request, {
                params: Promise.resolve({
                    resumeProfileId: "resume-profile-123",
                }),
            });

            expect(response.status).toBe(201);

            expect(createCoverLetterDraftMock).toHaveBeenCalledWith(
                expect.anything(),
                {
                    resumeProfileId: "resume-profile-123",
                    jobId: "job-123",
                    candidateName: "Ian Handley",
                    companyName: "Acme",
                    jobTitle: "Senior Software Engineer",
                    jobSummary:
                        "Build product features, collaborate across teams, and improve developer experience.",
                    resumeSummary:
                        "Software engineer with experience building web applications, APIs, and internal tools.",
                },
            );

            expect(await response.json()).toEqual({
                id: "cover-letter-draft-123",
                resumeProfileId: "resume-profile-123",
                jobId: "job-123",
                content: "Draft content",
                createdAt: "2026-04-22T12:00:00.000Z",
            });
        });

        it("returns 400 for invalid input", async () => {
            const { POST } = await import("./route");

            const request = new Request(
                "http://localhost/api/resume-profiles/resume-profile-123/cover-letter-drafts/from-job",
                {
                    method: "POST",
                    body: JSON.stringify({
                        jobId: 123,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const response = await POST(request, {
                params: Promise.resolve({
                    resumeProfileId: "resume-profile-123",
                }),
            });

            expect(response.status).toBe(400);
        });
    },
);