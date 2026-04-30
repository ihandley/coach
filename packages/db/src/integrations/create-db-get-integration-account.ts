import type { IntegrationAccount, IntegrationProvider } from "./integration-types.ts";

export function createDbGetIntegrationAccount({
    db,
}: {
    db: {
        integrationAccount: {
            findFirst: (args: {
                where: { provider: IntegrationProvider };
            }) => Promise<IntegrationAccount | null>;
        };
    };
}) {
    return async function getIntegrationAccount(
        provider: IntegrationProvider,
    ): Promise<IntegrationAccount | null> {
        return db.integrationAccount.findFirst({
            where: { provider },
        });
    };
}
