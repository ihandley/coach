import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { IntegrationsPageClient } from "./integrations-page-client";

afterEach(() => cleanup());

describe("IntegrationsPage", () => {
    it("shows Gmail as disconnected when no integration exists", async () => {
        render(
            createElement(IntegrationsPageClient, {
                getIntegrationAccount: async () => null,
                connectIntegration: vi.fn(),
            }),
        );

        expect(
            await screen.findByRole("heading", { name: "Integrations" }),
        ).toBeInTheDocument();
        expect(await screen.findByText("Gmail")).toBeInTheDocument();
        expect(await screen.findByText("Disconnected")).toBeInTheDocument();
        expect(
            await screen.findByRole("button", { name: "Connect Gmail" }),
        ).toBeInTheDocument();
    });

    it("shows Gmail as connected when the integration exists", async () => {
        render(
            createElement(IntegrationsPageClient, {
                getIntegrationAccount: async () => ({
                    id: "int-1",
                    provider: "gmail" as const,
                    isConnected: true,
                    createdAt: "2026-04-23T10:00:00.000Z",
                    updatedAt: "2026-04-23T10:00:00.000Z",
                }),
                connectIntegration: vi.fn(),
            }),
        );

        expect(await screen.findByText("Connected")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Connect Gmail" }),
        ).not.toBeInTheDocument();
    });

    it("shows a loading state before integration status resolves", () => {
        render(
            createElement(IntegrationsPageClient, {
                getIntegrationAccount: async () => new Promise<null>(() => {}),
                connectIntegration: vi.fn(),
            }),
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("refreshes integration state after connecting Gmail", async () => {
        let account: {
            id: string;
            provider: "gmail";
            isConnected: boolean;
            createdAt: string;
            updatedAt: string;
        } | null = null;

        const getIntegrationAccount = vi.fn(async () => account);
        const connectIntegration = vi.fn(async () => {
            account = {
                id: "int-1",
                provider: "gmail" as const,
                isConnected: true,
                createdAt: "2026-04-23T10:00:00.000Z",
                updatedAt: "2026-04-23T10:00:00.000Z",
            };
        });

        render(
            createElement(IntegrationsPageClient, {
                getIntegrationAccount,
                connectIntegration,
            }),
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Connect Gmail" }),
        );

        expect(await screen.findByText("Connected")).toBeInTheDocument();
    });
});
