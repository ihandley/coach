import { describe, it, expect } from "vitest";
import { isActionableMatch } from "./isActionableMatch";

describe("isActionableMatch", () => {
  it("returns true when all conditions are met", () => {
    expect(isActionableMatch({
      matchScore: 0.8,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    })).toBe(true);
  });

  it("returns false when match score is too low", () => {
    expect(isActionableMatch({
      matchScore: 0.4,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    })).toBe(false);
  });
});
