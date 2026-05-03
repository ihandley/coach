import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME, isAuthenticated } from "./auth";

describe("auth helpers", () => {
  it("uses the job coach auth cookie name", () => {
    expect(AUTH_COOKIE_NAME).toBe("job-coach-auth");
  });

  it("treats cookie value 1 as authenticated", () => {
    expect(isAuthenticated("1")).toBe(true);
  });

  it("treats missing or different cookie values as unauthenticated", () => {
    expect(isAuthenticated(undefined)).toBe(false);
    expect(isAuthenticated("0")).toBe(false);
    expect(isAuthenticated("true")).toBe(false);
  });
});
