import { describe, expect, it } from "vitest";

import { createDbUpsertIntegrationAccount } from "./create-db-upsert-integration-account";

describe("createDbUpsertIntegrationAccount", () => {
  it("upserts the integration account", async () => {
    const upsertIntegrationAccount = createDbUpsertIntegrationAccount({
      db: {
        integrationAccount: {
          upsert: async ({
            where,
            update,
            create,
          }: {
            where: { provider: "gmail" };
            update: { isConnected: boolean };
            create: { provider: "gmail"; isConnected: boolean };
          }) => ({
            id: "int-1",
            provider: where.provider,
            isConnected: update.isConnected ?? create.isConnected,
            createdAt: "2026-04-23T10:00:00.000Z",
            updatedAt: "2026-04-23T10:00:00.000Z",
          }),
        },
      } as never,
    });

    const result = await upsertIntegrationAccount({
      provider: "gmail",
      isConnected: true,
    });

    expect(result).toMatchObject({
      provider: "gmail",
      isConnected: true,
    });
  });
});
