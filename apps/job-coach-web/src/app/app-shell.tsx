import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
            <header
                style={{
                    borderBottom: "1px solid #e5e5e5",
                    padding: "12px 16px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                }}
            >
                <strong>Job Coach</strong>

                <nav style={{ display: "flex", gap: "12px", flex: 1 }}>
                    <Link href="/">Home</Link>
                    <Link href="/jobs">Jobs</Link>
                    <Link href="/resumes">Resumes</Link>
                    <Link href="/integrations">Integrations</Link>
                </nav>

                <LogoutButton />
            </header>

            <main style={{ padding: "16px", flex: 1 }}>{children}</main>
        </div>
    );
}
