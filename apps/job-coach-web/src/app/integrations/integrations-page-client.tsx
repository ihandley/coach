"use client";

import { createElement, useCallback, useEffect, useState } from "react";

export type IntegrationAccount = {
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

export function IntegrationsPageClient({
  getIntegrationAccount = defaultGetIntegrationAccount,
  connectIntegration = defaultConnectIntegration,
}: {
  getIntegrationAccount?: () => Promise<IntegrationAccount | null>;
  connectIntegration?: (provider: "gmail") => Promise<void> | void;
}) {
  const [integrationAccount, setIntegrationAccount] = useState<
    IntegrationAccount | null | undefined
  >(undefined);

  const refreshIntegrationAccount = useCallback(async () => {
    const nextAccount = await getIntegrationAccount();
    setIntegrationAccount(nextAccount);
  }, [getIntegrationAccount]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshIntegrationAccount();
    });
  }, [refreshIntegrationAccount]);

  if (integrationAccount === undefined) {
    return createElement(
      "div",
      {},
      createElement("h1", {}, "Integrations"),
      createElement("p", {}, "Loading..."),
    );
  }

  return createElement(
    "div",
    {},
    createElement("h1", {}, "Integrations"),
    createElement(
      "section",
      {},
      createElement("h2", {}, "Gmail"),
      createElement("p", {}, integrationAccount?.isConnected ? "Connected" : "Disconnected"),
      !integrationAccount?.isConnected
        ? createElement(
            "button",
            {
              type: "button",
              onClick: async () => {
                await connectIntegration("gmail");
                await refreshIntegrationAccount();
              },
            },
            "Connect Gmail",
          )
        : null,
    ),
  );
}
