import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertIntegrationAccount = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbUpsertIntegrationAccount: () => upsertIntegrationAccount,
    };
});

beforeEach(() => {
    upsertIntegrationAccount.mockReset();
    vi.resetModules();
});

describe("POST /api/integrations/[provider]/connect", () => {
    it("marks the supported integration as connected", async () => {
        upsertIntegrationAccount.mockResolvedValue({
            id: "int-1",
            provider: "gmail",
            isConnected: true,
            createdAt: "2026-04-23T10:00:00.000Z",
            updatedAt: "2026-04-23T10:00:00.000Z",
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/integrations/gmail/connect", {
                method: "POST",
            }),
            { params: { provider: "gmail" } },
        );

        expect(upsertIntegrationAccount).toHaveBeenCalledWith({
            provider: "gmail",
            isConnected: true,
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            provider: "gmail",
            isConnected: true,
        });
    });

    it("returns 400 for unsupported providers", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/integrations/not-real/connect", {
                method: "POST",
            }),
            { params: { provider: "not-real" } },
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({
            error: "UNSUPPORTED_INTEGRATION_PROVIDER",
        });
    });
});
