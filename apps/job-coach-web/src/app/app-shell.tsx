import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-xl font-bold text-gray-900">
            Job Coach
          </Link>
          <nav className="flex flex-1 gap-6">
            <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Jobs
            </Link>
            <Link href="/resumes" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Resumes
            </Link>
            <Link
              href="/integrations"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Integrations
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 bg-gray-50 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
