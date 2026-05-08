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
    expect(result.matchDetails.recommendation).toContain("Staff Product Engineer");
    expect(result.matchDetails.reasons.join(" ")).not.toContain("Good keyword overlap");
  });
});
