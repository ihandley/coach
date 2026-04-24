import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { JobPageClient } from "./job-page-client";

describe("JobPage", () => {
    it("renders the job heading and evaluation loading state", () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(
                () =>
                    new Promise<Response>(() => {}),
            ),
        );

        render(createElement(JobPageClient, { jobId: "job-123" }));

        expect(screen.getByText("Job job-123")).toBeInTheDocument();
        expect(screen.getByText("Loading evaluation...")).toBeInTheDocument();

        vi.unstubAllGlobals();
    });
});
