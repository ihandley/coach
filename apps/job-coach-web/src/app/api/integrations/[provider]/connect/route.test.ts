import { describe, expect, it, vi } from "vitest";
import { handleConnectIntegration } from "./route-impl";

describe("POST /api/integrations/[provider]/connect", () => {
  it("connects gmail", async () => {
    const connectIntegration = vi.fn(async () => {});

    const response = await handleConnectIntegration(
      "gmail",
      connectIntegration,
    );

    expect(response.status).toBe(204);
    expect(connectIntegration).toHaveBeenCalledWith("gmail");
  });

  it("returns 404 for unsupported providers", async () => {
    const connectIntegration = vi.fn(async () => {});

    const response = await handleConnectIntegration(
      "notion",
      connectIntegration,
    );

    expect(response.status).toBe(404);
    expect(connectIntegration).not.toHaveBeenCalled();
  });
});
