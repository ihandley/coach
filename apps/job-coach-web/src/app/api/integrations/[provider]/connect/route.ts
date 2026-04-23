import { createDbUpsertIntegrationAccount } from "@coach/db";

const upsertIntegrationAccount = createDbUpsertIntegrationAccount({
    db: {} as never,
});

function isSupportedProvider(value: string): value is "gmail" {
    return value === "gmail";
}

export async function POST(
    _request: Request,
    context: { params: { provider: string } },
) {
    if (!isSupportedProvider(context.params.provider)) {
        return Response.json(
            { error: "UNSUPPORTED_INTEGRATION_PROVIDER" },
            { status: 400 },
        );
    }

    const integrationAccount = await upsertIntegrationAccount({
        provider: context.params.provider,
        isConnected: true,
    });

    return Response.json(integrationAccount);
}
