import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import JobsPage from "./page";

afterEach(() => {
    cleanup();
});

describe("JobsPage", () => {
    it("shows a loading state while jobs are being fetched", () => {
        const getJobs = vi.fn(
            () =>
                new Promise<
                    Array<{
                        id: string;
                        company: string;
                        title: string;
                        status: string;
                        updatedAt: string;
                    }>
                >(() => {}),
        );

        render(<JobsPage getJobs={getJobs} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders jobs sorted by most recently updated first", async () => {
        const getJobs = vi.fn().mockResolvedValue([
            {
                id: "job-1",
                company: "OldCo",
                title: "Old Job",
                status: "saved",
                updatedAt: "2026-04-20T10:00:00.000Z",
            },
            {
                id: "job-2",
                company: "NewCo",
                title: "New Job",
                status: "saved",
                updatedAt: "2026-04-23T10:00:00.000Z",
            },
        ]);

        render(<JobsPage getJobs={getJobs} />);

        const items = await screen.findAllByRole("listitem");

        expect(items[0]).toHaveTextContent("NewCo");
        expect(items[1]).toHaveTextContent("OldCo");
    });
});
