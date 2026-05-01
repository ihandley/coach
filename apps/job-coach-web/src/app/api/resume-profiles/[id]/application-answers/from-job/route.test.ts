import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    createApplicationAnswerMock,
    getResumeProfileMock,
    getJobByIdMock,
} = vi.hoisted(() => {
    return {
        createApplicationAnswerMock: vi.fn(),
        getResumeProfileMock: vi.fn(),
        getJobByIdMock: vi.fn(),
    };
});

vi.mock("@coach/core", async () => {
    const actual = await vi.importActual<typeof import("@coach/core")>(
        "@coach/core",
    );

    return {
        ...actual,
        createApplicationAnswer: createApplicationAnswerMock,
    };
});

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

    return {
        ...actual,
        createDbGetResumeProfile: () => getResumeProfileMock,
        DbJobRepository: vi.fn().mockImplementation(function DbJobRepository() {
            return {
                getJobById: getJobByIdMock,
            };
        }),
    };
});

describe(
    "POST /api/resume-profiles/[id]/application-answers/from-job",
    () => {
        beforeEach(() => {
            createApplicationAnswerMock.mockReset();
            getResumeProfileMock.mockReset();
            getJobByIdMock.mockReset();
        });

        it("creates an application answer from stored job and resume data", async () => {
            getResumeProfileMock.mockResolvedValue({
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
                        experience: [],
                        education: [],
                    },
                },
            });

            getJobByIdMock.mockResolvedValue({
                id: "job-123",
                title: "Senior Software Engineer",
                company: "Acme",
                sourceText:
                    "Build product features, collaborate across teams, and improve developer experience.",
            });

            createApplicationAnswerMock.mockResolvedValue({
                answer:
                    "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
            });

            const { POST } = await import("./route");

            const request = new Request(
                "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
                {
                    method: "POST",
                    body: JSON.stringify({
                        jobId: "job-123",
                        question: "Why are you interested in this role?",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const response = await POST(request, {
                params: Promise.resolve({
                    id: "resume-profile-123",
                }),
            });

            expect(response.status).toBe(201);

            expect(createApplicationAnswerMock).toHaveBeenCalledWith({
                question: "Why are you interested in this role?",
                candidateName: "Ian Handley",
                companyName: "Acme",
                jobTitle: "Senior Software Engineer",
                jobSummary:
                    "Build product features, collaborate across teams, and improve developer experience.",
                resumeSummary:
                    "Software engineer with experience building web applications, APIs, and internal tools.",
            });

            expect(await response.json()).toEqual({
                answer:
                    "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
            });
        });

        it("returns 400 for invalid input", async () => {
            const { POST } = await import("./route");

            const request = new Request(
                "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
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
                    id: "resume-profile-123",
                }),
            });

            expect(response.status).toBe(400);
        });

        it("returns 400 for malformed json", async () => {
            const { POST } = await import("./route");

            const request = new Request(
                "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
                {
                    method: "POST",
                    body: "{not-valid-json",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const response = await POST(request, {
                params: Promise.resolve({
                    id: "resume-profile-123",
                }),
            });

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: "Invalid request body",
            });
        });
    },
);