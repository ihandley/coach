import { describe, it, expect, vi, beforeEach } from "vitest";

let mockCreate: any;

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        chat: {
          completions: {
            create: (...args: any[]) => mockCreate(...args),
          },
        },
      };
    }),
  };
});

import { classifyEmailLLM } from "./classify-email-llm";

describe("classifyEmailLLM", () => {
  beforeEach(() => {
    mockCreate = vi.fn();
  });

  it("returns valid classification", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: "rejected",
              confidence: 0.9,
            }),
          },
        },
      ],
    });

    const result = await classifyEmailLLM({
      subject: "Application Update",
      snippet: "We regret to inform you...",
    });

    expect(result.status).toBe("rejected");
    expect(result.confidence).toBe(0.9);
  });

  it("throws on invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not json" } }],
    });

    await expect(
      classifyEmailLLM({
        subject: "Test",
        snippet: "Test",
      }),
    ).rejects.toThrow();
  });

  it("throws on invalid status", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: "invalid",
              confidence: 0.9,
            }),
          },
        },
      ],
    });

    await expect(
      classifyEmailLLM({
        subject: "Test",
        snippet: "Test",
      }),
    ).rejects.toThrow();
  });
});
