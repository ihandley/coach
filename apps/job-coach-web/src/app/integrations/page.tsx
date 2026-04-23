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

async function defaultConnectIntegration(provider: "gmail") {
    await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST",
    });
}

export default function IntegrationsPage({
    getIntegrationAccount = defaultGetIntegrationAccount,
    connectIntegration = defaultConnectIntegration,
}: {
    getIntegrationAccount?: () => Promise<IntegrationAccount | null>;
    connectIntegration?: (provider: "gmail") => Promise<void> | void;
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
                {!integrationAccount?.isConnected ? (
                    <button
                        type="button"
                        onClick={() => {
                            void connectIntegration("gmail");
                        }}
                    >
                        Connect Gmail
                    </button>
                ) : null}
            </section>
        </div>
    );
}
