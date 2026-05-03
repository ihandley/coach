import type { IntegrationAccount, IntegrationProvider } from "./integration-types";

export function createDbUpsertIntegrationAccount({
  db,
}: {
  db: {
    integrationAccount: {
      upsert: (args: {
        where: { provider: IntegrationProvider };
        update: { isConnected: boolean };
        create: {
          provider: IntegrationProvider;
          isConnected: boolean;
        };
      }) => Promise<IntegrationAccount>;
    };
  };
}) {
  return async function upsertIntegrationAccount({
    provider,
    isConnected,
  }: {
    provider: IntegrationProvider;
    isConnected: boolean;
  }): Promise<IntegrationAccount> {
    return db.integrationAccount.upsert({
      where: { provider },
      update: { isConnected },
      create: { provider, isConnected },
    });
  };
}
