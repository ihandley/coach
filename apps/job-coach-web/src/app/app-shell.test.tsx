import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

vi.mock("./logout-button", () => ({
  LogoutButton: () => <button type="button">Log out</button>,
}));

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("links the app title to jobs and omits standalone home navigation", () => {
    render(
      <AppShell>
        <div>Workspace</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Job Coach" })).toHaveAttribute("href", "/jobs");
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/jobs");
  });
});
