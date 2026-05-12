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
    expect(result.matchDetails.strengths.join(" ")).not.toContain(
      "Resume shows relevant evidence around",
    );
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
    expect(details).not.toMatch(/\b(assume|obsessed|partner|job|predict)\b/i);
    expect(details).not.toContain("Good keyword overlap");
    expect(details).not.toContain("keyword overlap");
    expect(details).not.toContain("Resume evidence is thin for requested areas");
  });

  it("frames missing AI and MCP signals as an actionable gap", () => {
    const result = calculateFit(
      {
        title: "Staff Software Engineer - AI & MCP",
        company: "RevSpring",
        sourceText:
          "Assume ownership of AI systems, MCP integrations, agent tooling, APIs, and platform reliability.",
      },
      {
        rawText:
          "Staff software engineer with APIs, platform reliability, TypeScript, React, and healthcare experience.",
      },
    );
    const details = [
      ...result.matchDetails.strengths,
      ...result.matchDetails.gaps,
      result.matchDetails.recommendation,
    ].join(" ");

    expect(details).toContain("AI/MCP");
    expect(details).toContain("agent tooling");
    expect(details).not.toMatch(/\bAssume\b/);
    expect(details).not.toContain("clearer evidence of");
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
    expect(result.matchDetails.recommendation).toContain("Moderate fit");
    expect(result.matchDetails.recommendation).not.toContain("Apply only if");
  });

  it("scores strong technical and role-family matches above generic overlap", () => {
    const job = {
      title: "Staff Product Engineer",
      company: "Pattern",
      sourceText:
        "Lead TypeScript React product workflows, APIs, platform reliability, and distributed systems.",
    };
    const strong = calculateFit(job, {
      rawText:
        "Staff product engineer who led TypeScript React APIs, platform reliability, and distributed systems.",
    });
    const generic = calculateFit(job, {
      rawText:
        "Experienced professional who works with product teams, company partners, culture, and workflows.",
    });

    expect(strong.score).toBeGreaterThan(generic.score + 25);
    expect(strong.matchDetails).toMatchObject({
      strengths: expect.any(Array),
      gaps: expect.any(Array),
      reasons: expect.any(Array),
      recommendation: expect.any(String),
    });
  });

  it("penalizes obvious role-family and seniority mismatches", () => {
    const seniorEngineeringRole = {
      title: "Principal Backend Engineer",
      company: "Pattern",
      sourceText: "Lead TypeScript APIs, distributed systems, data platform, and mentoring.",
    };
    const aligned = calculateFit(seniorEngineeringRole, {
      rawText:
        "Principal backend engineer who led TypeScript APIs, distributed systems, data platforms, and mentoring.",
    });
    const mismatch = calculateFit(seniorEngineeringRole, {
      rawText:
        "Junior designer focused on Figma, brand illustration, campaigns, and visual systems.",
    });

    expect(aligned.score).toBeGreaterThan(mismatch.score + 40);
    expect(mismatch.score).toBeLessThan(25);
  });
});
