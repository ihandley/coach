import { createDbGetIntegrationAccount } from "@coach/db";

const getIntegrationAccount = createDbGetIntegrationAccount({
    db: {} as never,
});

function isSupportedProvider(value: string): value is "gmail" {
    return value === "gmail";
}

export async function GET(
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

    return Response.json(integrationAccount);
}
