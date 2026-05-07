import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("HomePage", () => {
  it("redirects to the jobs workspace", async () => {
    const { default: HomePage } = await import("./page");

    HomePage();

    expect(redirect).toHaveBeenCalledWith("/jobs");
  });
});
