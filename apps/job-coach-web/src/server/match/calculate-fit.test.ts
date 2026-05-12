import { describe, expect, it } from "vitest";

import { calculateFit } from "./calculate-fit";

describe("calculateFit", () => {
  it("returns concise weighted strengths without generic prose", () => {
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
    expect(result.matchDetails.strengths).toEqual(
      expect.arrayContaining(["Strong: TypeScript", "Strong: React", "Strong: platform"]),
    );
    expect(result.matchDetails.strengths.every((strength) => strength.length < 40)).toBe(true);
    expect(result.matchDetails.recommendation).toMatch(/^Strong|^Moderate|^Weak/);
    expect(result.matchDetails.reasons.join(" ")).not.toMatch(
      /Resume shows relevant evidence around|keyword overlap|hiring story|tailor your resume|concrete ownership/i,
    );
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
    expect(details).not.toMatch(
      /\b(assume|obsessed|partner|job|dynamic|communication|passionate|collaborative|excellent|responsibilities)\b/i,
    );
    expect(details).not.toMatch(/Good keyword overlap|keyword overlap|Resume evidence is thin/i);
  });

  it("frames missing AI and MCP signals as prioritized gaps", () => {
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

    expect(result.matchDetails.gaps).toEqual(
      expect.arrayContaining([
        "Major: AI systems experience not found",
        "Major: MCP experience not found",
        "Major: agent tooling experience not found",
      ]),
    );
    expect(result.matchDetails.recommendation).toContain("Moderate fit due to missing");
    expect(details).not.toMatch(/\bAssume\b/);
    expect(details).not.toContain("clearer evidence of");
  });

  it("classifies required, preferred, and nice-to-have gaps by severity", () => {
    const result = calculateFit(
      {
        title: "Senior Backend Engineer",
        company: "Pattern",
        sourceText:
          "Must know Rust. Experience with AI systems preferred. Nice to have Next.js familiarity. Required experience with distributed systems.",
      },
      {
        rawText: "Senior backend engineer with distributed systems and TypeScript experience.",
      },
    );

    expect(result.matchDetails.strengths).toEqual(
      expect.arrayContaining(["Strong: distributed systems"]),
    );
    expect(result.matchDetails.strengths).not.toContain("Strong: Rust");
    expect(result.matchDetails.gaps).toEqual(
      expect.arrayContaining([
        "Critical: Rust experience not found",
        "Major: AI systems experience not found",
        "Minor: Next.js experience not found",
      ]),
    );
    expect(result.matchDetails.gaps[0]).toBe("Critical: Rust experience not found");
    expect(result.matchDetails.recommendation).toContain("critical gap");
  });

  it("does not create strengths without resume evidence", () => {
    const result = calculateFit(
      {
        title: "Backend Engineer",
        company: "Pattern",
        sourceText: "Must know Rust. Required experience with Postgres.",
      },
      {
        rawText: "Backend engineer with TypeScript APIs.",
      },
    );

    expect(result.matchDetails.strengths).toEqual([]);
    expect(result.matchDetails.gaps).toEqual(
      expect.arrayContaining([
        "Critical: Rust experience not found",
        "Critical: Postgres experience not found",
      ]),
    );
    expect(result.matchDetails.recommendation).toBe(
      "Weak fit because several required technical signals are missing.",
    );
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
