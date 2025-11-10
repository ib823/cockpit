/**
 * ClientSafeToggle Component
 * Global switch to hide/show cost elements across the UI
 * Persists to store and syncs with URL param
 */

"use client";

import React from "react";
import { useProjectStore } from "@/lib/unified-project-store";
import { clsx } from "clsx";

export const ClientSafeToggle: React.FC = () => {
  const { clientSafe, setClientSafe } = useProjectStore();

  const handleToggle = () => {
    const newValue = !clientSafe;
    setClientSafe(newValue);

    // Sync with URL
    const url = new URL(window.location.href);
    if (newValue) {
      url.searchParams.set("clientSafe", "1");
    } else {
      url.searchParams.delete("clientSafe");
    }
    window.history.replaceState({}, "", url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={clientSafe}
        onClick={handleToggle}
        className={clsx(
          "relative inline-flex h-6 w-11 items-center rounded-[var(--r-full)]",
          "transition-colors duration-[var(--dur)] ease-[var(--ease)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2",
          clientSafe ? "bg-[var(--accent)]" : "bg-[var(--line)]"
        )}
      >
        <span className="sr-only">Toggle client-safe mode</span>
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm",
            "transition-transform duration-[var(--dur)] ease-[var(--ease)]",
            clientSafe ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      <span className="text-sm text-[var(--ink-muted)]">Client-safe</span>
    </div>
  );
};
