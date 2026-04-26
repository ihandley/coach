import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import "../styles/globals.css";

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
