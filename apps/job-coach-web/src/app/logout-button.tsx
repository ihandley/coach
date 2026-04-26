"use client";

export function LogoutButton() {
    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    }

    return (
        <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
            Logout
        </button>
    );
}
