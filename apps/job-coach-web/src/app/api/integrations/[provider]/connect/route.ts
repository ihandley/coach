import { createDbUpsertIntegrationAccount } from "@coach/db";

import { dbAdapter } from "../../../../../server/db-adapter";
import { handleConnectIntegration } from "./route-impl";

const upsertIntegrationAccount = createDbUpsertIntegrationAccount({
  db: dbAdapter,
});

export async function POST(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;

  return handleConnectIntegration(provider, async (resolvedProvider) => {
    await upsertIntegrationAccount({
      provider: resolvedProvider,
      isConnected: true,
    });
  });
}
