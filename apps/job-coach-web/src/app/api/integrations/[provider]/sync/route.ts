import { createDbGetIntegrationAccount } from "@coach/db";

import { dbAdapter } from "../../../../../server/db-adapter";

const getIntegrationAccount = createDbGetIntegrationAccount({
    db: dbAdapter,
});

function isSupportedProvider(value: string): value is "gmail" {
    return value === "gmail";
}

export async function POST(
    _request: Request,
    context: { params: Promise<{ provider: string }> },
) {
    const { provider } = await context.params;

    if (!isSupportedProvider(provider)) {
        return Response.json(
            { error: "UNSUPPORTED_INTEGRATION_PROVIDER" },
            { status: 400 },
        );
    }

    const integrationAccount = await getIntegrationAccount(provider);

    if (!integrationAccount?.isConnected) {
        return Response.json(
            { error: "INTEGRATION_NOT_CONNECTED" },
            { status: 409 },
        );
    }

    return Response.json({
        provider,
        status: "sync_not_implemented",
    });
}
