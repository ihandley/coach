"use client";

export function ApplyUpdatesButton() {
  async function apply() {
    await fetch("/api/integrations/email/apply", {
      method: "POST",
    });

    location.reload();
  }

  return (
    <button
      onClick={apply}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Apply detected updates
    </button>
  );
}
