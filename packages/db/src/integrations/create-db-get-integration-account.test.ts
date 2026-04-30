import { describe, expect, it } from "vitest";

import { createDbGetIntegrationAccount } from "./create-db-get-integration-account";

describe("createDbGetIntegrationAccount", () => {
    it("returns null when no integration exists", async () => {
        const getIntegrationAccount = createDbGetIntegrationAccount({
            db: {
                integrationAccount: {
                    findFirst: async () => null,
                },
            } as never,
        });

        const result = await getIntegrationAccount("gmail");

        expect(result).toBeNull();
    });

    it("returns the integration account when it exists", async () => {
        const getIntegrationAccount = createDbGetIntegrationAccount({
            db: {
                integrationAccount: {
                    findFirst: async () => ({
                        id: "int-1",
                        provider: "gmail",
                        isConnected: true,
                        createdAt: "2026-04-23T10:00:00.000Z",
                        updatedAt: "2026-04-23T10:00:00.000Z",
                    }),
                },
            } as never,
        });

        const result = await getIntegrationAccount("gmail");

        expect(result).toMatchObject({
            id: "int-1",
            provider: "gmail",
            isConnected: true,
        });
    });
});
