import { describe, expect, it } from "vitest";

import { calculateFit } from "./calculate-fit";

describe("calculateFit", () => {
  it("returns role-specific match details without generic overlap wording", () => {
    const result = calculateFit(
      {
        title: "Staff Product Engineer",
        company: "Pattern",
        sourceText: "TypeScript React product workflows and platform leadership",
      },
      {
        rawText: "Staff engineer with TypeScript React platform leadership experience.",
      },
    );

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchDetails.strengths.join(" ")).toContain("Staff Product Engineer");
    expect(result.matchDetails.recommendation).toContain("TypeScript");
    expect(result.matchDetails.reasons.join(" ")).not.toContain("Good keyword overlap");
  });

  it("filters noisy business terms and prefers useful coaching signals", () => {
    const result = calculateFit(
      {
        title: "Staff Software Engineer",
        company: "Predict",
        sourceText:
          "Join our job-obsessed partner team. Use predictive analytics, APIs, data, and platform work for product-domain outcomes.",
      },
      {
        rawText: "Staff software engineer with data analytics, APIs, and platform experience.",
      },
    );
    const details = [
      ...result.matchDetails.strengths,
      ...result.matchDetails.gaps,
      result.matchDetails.recommendation,
    ].join(" ");

    expect(details).toContain("data");
    expect(details).toContain("APIs");
    expect(details).toContain("platform");
    expect(details).not.toMatch(/\b(obsessed|partner|job|predict)\b/i);
    expect(details).not.toContain("Good keyword overlap");
    expect(details).not.toContain("Resume evidence is thin for requested areas");
  });

  it("treats mid-thirties scores as moderate coaching opportunities", () => {
    const result = calculateFit(
      {
        title: "Analytics Engineer",
        company: "Pattern",
        sourceText:
          "predictive analytics data platform APIs React TypeScript healthcare fintech distributed systems",
      },
      {
        rawText: "predictive analytics data product",
      },
    );

    expect(result.score).toBeGreaterThanOrEqual(26);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.matchDetails.recommendation).toContain("Moderate overlap detected");
    expect(result.matchDetails.recommendation).not.toContain("Apply only if");
  });
});
