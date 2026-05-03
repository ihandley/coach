import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { EnvBanner } from "../../components/env-banner";
import "../styles/globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnvBanner />
        <div style={{ paddingTop: "28px" }}>
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
