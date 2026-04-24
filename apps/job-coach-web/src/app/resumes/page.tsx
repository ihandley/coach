import { AppShell } from "../app-shell";
import { ResumesPageClient } from "./resumes-page-client";

export default function Page() {
    return (
        <AppShell>
            <ResumesPageClient />
        </AppShell>
    );
}
