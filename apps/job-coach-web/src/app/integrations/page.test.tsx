import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import IntegrationsPage from "./page";

afterEach(() => cleanup());

describe("IntegrationsPage", () => {
    it("shows Gmail as disconnected when no integration exists", async () => {
        render(
            <IntegrationsPage
                getIntegrationAccount={async () => null}
                connectIntegration={vi.fn()}
            />,
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
            <IntegrationsPage
                getIntegrationAccount={async () => ({
                    id: "int-1",
                    provider: "gmail",
                    isConnected: true,
                    createdAt: "2026-04-23T10:00:00.000Z",
                    updatedAt: "2026-04-23T10:00:00.000Z",
                })}
                connectIntegration={vi.fn()}
            />,
        );

        expect(await screen.findByText("Connected")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Connect Gmail" }),
        ).not.toBeInTheDocument();
    });

    it("shows a loading state before integration status resolves", () => {
        render(
            <IntegrationsPage
                getIntegrationAccount={async () => new Promise(() => {})}
                connectIntegration={vi.fn()}
            />,
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("starts the Gmail connect action", async () => {
        const connectIntegration = vi.fn();

        render(
            <IntegrationsPage
                getIntegrationAccount={async () => null}
                connectIntegration={connectIntegration}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Connect Gmail" }),
        );

        expect(connectIntegration).toHaveBeenCalledWith("gmail");
    });
});
