export type IntegrationProvider = "gmail";

export type IntegrationAccount = {
    id: string;
    provider: IntegrationProvider;
    isConnected: boolean;
    createdAt: string;
    updatedAt: string;
};
