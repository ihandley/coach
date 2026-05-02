import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApplicationAnswerMock } = vi.hoisted(() => {
    return {
        createApplicationAnswerMock: vi.fn(),
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

describe("POST /api/resume-profiles/[id]/application-answers", () => {
    beforeEach(() => {
        createApplicationAnswerMock.mockReset();
    });

    it("creates an application answer from direct input", async () => {
        createApplicationAnswerMock.mockResolvedValue({
            answer:
                "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
        });

        const { POST } = await import("./route");

        const request = new Request(
            "http://localhost/api/resume-profiles/resume-profile-123/application-answers",
            {
                method: "POST",
                body: JSON.stringify({
                    question: "Why are you interested in this role?",
                    candidateName: "Ian Handley",
                    companyName: "Acme",
                    jobTitle: "Senior Software Engineer",
                    jobSummary: "Build product features.",
                    resumeSummary: "Built web apps and APIs.",
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
            jobSummary: "Build product features.",
            resumeSummary: "Built web apps and APIs.",
        });

        expect(await response.json()).toEqual({
            answer:
                "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
        });
    });

    it("returns 400 for invalid input", async () => {
        const { POST } = await import("./route");

        const request = new Request(
            "http://localhost/api/resume-profiles/resume-profile-123/application-answers",
            {
                method: "POST",
                body: JSON.stringify({
                    question: 123,
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
        expect(await response.json()).toEqual({
            error: "Invalid request body",
        });
    });

    it("returns 400 for malformed json", async () => {
        const { POST } = await import("./route");

        const request = new Request(
            "http://localhost/api/resume-profiles/resume-profile-123/application-answers",
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
});