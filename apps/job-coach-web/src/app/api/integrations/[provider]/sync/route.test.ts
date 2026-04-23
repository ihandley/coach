import { beforeEach, describe, expect, it, vi } from "vitest";

const getIntegrationAccount = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbGetIntegrationAccount: () => getIntegrationAccount,
    };
});

beforeEach(() => {
    getIntegrationAccount.mockReset();
    vi.resetModules();
});

describe("POST /api/integrations/[provider]/sync", () => {
    it("returns a sync scaffold response for a connected integration", async () => {
        getIntegrationAccount.mockResolvedValue({
            id: "int-1",
            provider: "gmail",
            isConnected: true,
            createdAt: "2026-04-23T10:00:00.000Z",
            updatedAt: "2026-04-23T10:00:00.000Z",
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/integrations/gmail/sync", {
                method: "POST",
            }),
            { params: Promise.resolve({ provider: "gmail" }) },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            provider: "gmail",
            status: "sync_not_implemented",
        });
    });

    it("returns 409 when the integration is not connected", async () => {
        getIntegrationAccount.mockResolvedValue(null);

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/integrations/gmail/sync", {
                method: "POST",
            }),
            { params: Promise.resolve({ provider: "gmail" }) },
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toMatchObject({
            error: "INTEGRATION_NOT_CONNECTED",
        });
    });

    it("returns 400 for unsupported providers", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/integrations/not-real/sync", {
                method: "POST",
            }),
            { params: Promise.resolve({ provider: "not-real" }) },
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({
            error: "UNSUPPORTED_INTEGRATION_PROVIDER",
        });
    });
});
