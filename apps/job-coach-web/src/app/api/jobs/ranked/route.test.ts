import { describe, expect, it } from "vitest";

import { normalizeRankedScore } from "./route";

describe("normalizeRankedScore", () => {
  it("normalizes persisted percentage scores for ranked jobs", () => {
    expect(normalizeRankedScore(86)).toBe(0.86);
    expect(normalizeRankedScore(17)).toBe(0.17);
    expect(normalizeRankedScore(1)).toBe(0.01);
  });

  it("clamps invalid or out-of-range scores", () => {
    expect(normalizeRankedScore(null)).toBe(0);
    expect(normalizeRankedScore(Number.NaN)).toBe(0);
    expect(normalizeRankedScore(1700)).toBe(1);
    expect(normalizeRankedScore(-25)).toBe(0);
  });
});
