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

describe("GET /api/integrations/[provider]", () => {
    it("returns integration account state", async () => {
        getIntegrationAccount.mockResolvedValue({
            id: "int-1",
            provider: "gmail",
            isConnected: true,
            createdAt: "2026-04-23T10:00:00.000Z",
            updatedAt: "2026-04-23T10:00:00.000Z",
        });

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/integrations/gmail"),
            { params: Promise.resolve({ provider: "gmail" }) },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            provider: "gmail",
            isConnected: true,
        });
    });

    it("returns null when not connected", async () => {
        getIntegrationAccount.mockResolvedValue(null);

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/integrations/gmail"),
            { params: Promise.resolve({ provider: "gmail" }) },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toBeNull();
    });

    it("returns 400 for unsupported providers", async () => {
        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/integrations/not-real"),
            { params: Promise.resolve({ provider: "not-real" }) },
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({
            error: "UNSUPPORTED_INTEGRATION_PROVIDER",
        });
    });
});
