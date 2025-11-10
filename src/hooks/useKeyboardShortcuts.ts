/**
 * Keyboard Shortcuts Hook
 * Global and context-specific keyboard shortcuts
 *
 * Features:
 * - Global shortcuts (Cmd+S, Cmd+K, etc.)
 * - Context-specific shortcuts (Estimator, Gantt, etc.)
 * - Modifier key support (Cmd/Ctrl, Shift, Alt)
 * - Shortcut registration/unregistration
 * - Help modal with all shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key to trigger (e.g., 's', 'k', 'Escape') */
  key: string;
  /** Requires Cmd (Mac) or Ctrl (Windows/Linux) */
  meta?: boolean;
  /** Requires Ctrl key */
  ctrl?: boolean;
  /** Requires Shift key */
  shift?: boolean;
  /** Requires Alt key */
  alt?: boolean;
  /** Description for help modal */
  description: string;
  /** Category for grouping in help */
  category: "navigation" | "actions" | "editing" | "view" | "help";
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Only active in specific contexts */
  context?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

// Global shortcuts registry
const globalShortcuts: Map<string, KeyboardShortcut> = new Map();

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  if (shortcut.meta) parts.push(isMac ? "⌘" : "Ctrl");
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.shift) parts.push("⇧");
  if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt");

  // Format key name
  let keyName = shortcut.key;
  if (keyName === "Escape") keyName = "Esc";
  else if (keyName === " ") keyName = "Space";
  else if (keyName.length === 1) keyName = keyName.toUpperCase();

  parts.push(keyName);

  return parts.join("+");
}

/**
 * Check if shortcut matches event
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const metaPressed = event.metaKey || event.ctrlKey; // Cmd on Mac, Ctrl on Windows
  const ctrlPressed = event.ctrlKey;
  const shiftPressed = event.shiftKey;
  const altPressed = event.altKey;

  if (shortcut.meta && !metaPressed) return false;
  if (!shortcut.meta && metaPressed && shortcut.key !== "k") return false; // Allow Cmd+K for search
  if (shortcut.ctrl && !ctrlPressed) return false;
  if (!shortcut.ctrl && ctrlPressed && !shortcut.meta) return false;
  if (shortcut.shift && !shiftPressed) return false;
  if (!shortcut.shift && shiftPressed && shortcut.key.length > 1) return false; // Allow shifted letters
  if (shortcut.alt && !altPressed) return false;
  if (!shortcut.alt && altPressed) return false;

  return true;
}

/**
 * Register global keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut) {
  const key = `${shortcut.context || "global"}-${shortcut.id}`;
  globalShortcuts.set(key, shortcut);
}

/**
 * Unregister keyboard shortcut
 */
export function unregisterShortcut(id: string, context?: string) {
  const key = `${context || "global"}-${id}`;
  globalShortcuts.delete(key);
}

/**
 * Get all registered shortcuts
 */
export function getAllShortcuts(context?: string): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  globalShortcuts.forEach((shortcut, key) => {
    if (!context || shortcut.context === context || shortcut.context === undefined) {
      shortcuts.push(shortcut);
    }
  });

  return shortcuts;
}

/**
 * Hook to use keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options?: {
    /** Context name (e.g., 'estimator', 'gantt') */
    context?: string;
    /** Enable/disable shortcuts */
    enabled?: boolean;
  }
) {
  const { context, enabled = true } = options || {};
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Register shortcuts
  useEffect(() => {
    if (!enabled) return;

    shortcuts.forEach((shortcut) => {
      registerShortcut({ ...shortcut, context });
    });

    return () => {
      shortcuts.forEach((shortcut) => {
        unregisterShortcut(shortcut.id, context);
      });
    };
  }, [shortcuts, context, enabled]);

  // Global keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = event.target as HTMLElement;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      if (isInput || isContentEditable) {
        // Allow Cmd+K even in inputs for search
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          // Let it through
        } else {
          return;
        }
      }

      // Check shortcuts
      shortcutsRef.current.forEach((shortcut) => {
        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

/**
 * Pre-configured global shortcuts
 */
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "search",
    key: "k",
    meta: true,
    description: "Open command palette",
    category: "navigation",
    handler: () => {
      // Trigger command palette (handled by CommandPalette component)
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);
    },
  },
  {
    id: "help",
    key: "/",
    meta: true,
    description: "Show keyboard shortcuts",
    category: "help",
    handler: () => {
      // Dispatch custom event for help modal
      window.dispatchEvent(new CustomEvent("show-keyboard-help"));
    },
  },
  {
    id: "close",
    key: "Escape",
    description: "Close modal or panel",
    category: "navigation",
    handler: () => {
      // Handled by individual modals/panels
    },
    preventDefault: false,
  },
];

/**
 * Estimator-specific shortcuts
 */
export const ESTIMATOR_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "save",
    key: "s",
    meta: true,
    description: "Save current estimate",
    category: "actions",
    handler: () => {
      window.dispatchEvent(new CustomEvent("estimator-save"));
    },
  },
  {
    id: "generate-timeline",
    key: "g",
    meta: true,
    shift: true,
    description: "Generate project timeline",
    category: "actions",
    handler: () => {
      window.dispatchEvent(new CustomEvent("estimator-generate-timeline"));
    },
  },
  {
    id: "toggle-advanced",
    key: "a",
    meta: true,
    description: "Toggle advanced options",
    category: "view",
    handler: () => {
      window.dispatchEvent(new CustomEvent("estimator-toggle-advanced"));
    },
  },
];

/**
 * Gantt-specific shortcuts
 */
export const GANTT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "save",
    key: "s",
    meta: true,
    description: "Save project",
    category: "actions",
    handler: () => {
      window.dispatchEvent(new CustomEvent("gantt-save"));
    },
  },
  {
    id: "zoom-in",
    key: "=",
    meta: true,
    description: "Zoom in",
    category: "view",
    handler: () => {
      window.dispatchEvent(new CustomEvent("gantt-zoom-in"));
    },
  },
  {
    id: "zoom-out",
    key: "-",
    meta: true,
    description: "Zoom out",
    category: "view",
    handler: () => {
      window.dispatchEvent(new CustomEvent("gantt-zoom-out"));
    },
  },
  {
    id: "toggle-weekends",
    key: "w",
    meta: true,
    description: "Toggle weekends",
    category: "view",
    handler: () => {
      window.dispatchEvent(new CustomEvent("gantt-toggle-weekends"));
    },
  },
];

/**
 * Dashboard-specific shortcuts
 */
export const DASHBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "new-estimate",
    key: "n",
    meta: true,
    description: "New estimate",
    category: "actions",
    handler: () => {
      window.dispatchEvent(new CustomEvent("dashboard-new-estimate"));
    },
  },
  {
    id: "new-project",
    key: "p",
    meta: true,
    description: "New project",
    category: "actions",
    handler: () => {
      window.dispatchEvent(new CustomEvent("dashboard-new-project"));
    },
  },
  {
    id: "toggle-customize",
    key: "e",
    meta: true,
    description: "Toggle customize mode",
    category: "editing",
    handler: () => {
      window.dispatchEvent(new CustomEvent("dashboard-toggle-customize"));
    },
  },
];
