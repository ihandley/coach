import { useEffect, useState } from "react";

type IntegrationAccount = {
    id: string;
    provider: "gmail";
    isConnected: boolean;
    createdAt: string;
    updatedAt: string;
};

async function defaultGetIntegrationAccount(): Promise<IntegrationAccount | null> {
    const response = await fetch("/api/integrations/gmail");

    if (!response.ok) {
        return null;
    }

    return response.json();
}

export default function IntegrationsPage({
    getIntegrationAccount = defaultGetIntegrationAccount,
}: {
    getIntegrationAccount?: () => Promise<IntegrationAccount | null>;
}) {
    const [integrationAccount, setIntegrationAccount] =
        useState<IntegrationAccount | null | undefined>(undefined);

    useEffect(() => {
        getIntegrationAccount().then(setIntegrationAccount);
    }, [getIntegrationAccount]);

    if (integrationAccount === undefined) {
        return (
            <div>
                <h1>Integrations</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Integrations</h1>

            <section>
                <h2>Gmail</h2>
                <p>{integrationAccount?.isConnected ? "Connected" : "Disconnected"}</p>
            </section>
        </div>
    );
}
