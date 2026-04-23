import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import JobsPage from "./page";

afterEach(() => {
    cleanup();
});

describe("JobsPage", () => {
    it("shows a loading state while jobs are being fetched", () => {
        const getJobs = vi.fn(() => new Promise(() => {}));

        render(<JobsPage getJobs={getJobs} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders an empty state when there are no jobs", async () => {
        render(<JobsPage getJobs={async () => []} />);

        expect(
            await screen.findByRole("heading", { name: "Jobs" }),
        ).toBeInTheDocument();
        expect(await screen.findByText("No jobs yet.")).toBeInTheDocument();
    });

    it("renders jobs from the data source", async () => {
        const getJobs = vi.fn().mockResolvedValue([
            {
                id: "job-123",
                company: "Acme",
                title: "Senior Software Engineer",
                status: "saved",
                updatedAt: "2026-04-23T10:00:00.000Z",
            },
        ]);

        render(<JobsPage getJobs={getJobs} />);

        expect(await screen.findByText("Acme")).toBeInTheDocument();
        expect(
            await screen.findByText("Senior Software Engineer"),
        ).toBeInTheDocument();

        expect(getJobs).toHaveBeenCalled();
    });
});
