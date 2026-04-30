import { describe, it, expect } from "vitest";
import { isActionableMatch } from "./isActionableMatch";

describe("isActionableMatch", () => {
  it("returns true for high match + high confidence + status change", () => {
    const result = isActionableMatch({
      matchScore: 0.8,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    });

    expect(result).toBe(true);
  });

  it("returns false if match score is too low", () => {
    const result = isActionableMatch({
      matchScore: 0.4,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    });

    expect(result).toBe(false);
  });

  it("returns false if classification confidence is too low", () => {
    const result = isActionableMatch({
      matchScore: 0.8,
      classificationConfidence: 0.3,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    });

    expect(result).toBe(false);
  });

  it("returns false if no detected status", () => {
    const result = isActionableMatch({
      matchScore: 0.8,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: undefined,
    });

    expect(result).toBe(false);
  });

  it("returns false if status does not change", () => {
    const result = isActionableMatch({
      matchScore: 0.8,
      classificationConfidence: 0.9,
      currentStatus: "applied",
      detectedStatus: "applied",
    });

    expect(result).toBe(false);
  });

  it("returns true when classification confidence is undefined but match is strong", () => {
    const result = isActionableMatch({
      matchScore: 0.9,
      currentStatus: "applied",
      detectedStatus: "interviewing",
    });

    expect(result).toBe(true);
  });
});
