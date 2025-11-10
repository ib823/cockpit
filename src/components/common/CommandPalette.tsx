"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  Layout,
  Settings,
  FileDown,
  Users,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Languages,
} from "lucide-react";
import { usePreferencesStore } from "@/stores/preferences-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { theme, setTheme, language, setLanguage, toggleExpertMode } = usePreferencesStore();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg border shadow-2xl bg-white dark:bg-gray-900">
          <div className="flex items-center border-b px-3">
            <svg
              className="mr-2 h-5 w-5 shrink-0 opacity-50"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onValueChange={setSearch}
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group
              heading="Navigation"
              className="text-xs font-medium text-gray-500 px-2 py-1.5"
            >
              <CommandItem
                icon={<Calculator className="w-4 h-4" />}
                label="Go to Estimator"
                shortcut="⌘E"
                onSelect={() => handleSelect(() => router.push("/estimator"))}
              />
              <CommandItem
                icon={<Calendar className="w-4 h-4" />}
                label="Go to Timeline"
                shortcut="⌘T"
                onSelect={() => handleSelect(() => router.push("/timeline"))}
              />
              <CommandItem
                icon={<Layout className="w-4 h-4" />}
                label="Go to Dashboard"
                shortcut="⌘D"
                onSelect={() => handleSelect(() => router.push("/dashboard"))}
              />
              <CommandItem
                icon={<Users className="w-4 h-4" />}
                label="Go to Admin"
                onSelect={() => handleSelect(() => router.push("/admin"))}
              />
            </Command.Group>

            {/* Actions */}
            <Command.Separator className="my-2 h-px bg-gray-200" />
            <Command.Group
              heading="Actions"
              className="text-xs font-medium text-gray-500 px-2 py-1.5"
            >
              <CommandItem
                icon={<FileDown className="w-4 h-4" />}
                label="Export PDF"
                onSelect={() =>
                  handleSelect(() => {
                    // Trigger PDF export
                    console.log("Export PDF");
                  })
                }
              />
              <CommandItem
                icon={<FileDown className="w-4 h-4" />}
                label="Export PowerPoint"
                onSelect={() =>
                  handleSelect(() => {
                    console.log("Export PowerPoint");
                  })
                }
              />
              <CommandItem
                icon={<Settings className="w-4 h-4" />}
                label="Toggle Expert Mode"
                onSelect={() => handleSelect(() => toggleExpertMode())}
              />
            </Command.Group>

            {/* Theme */}
            <Command.Separator className="my-2 h-px bg-gray-200" />
            <Command.Group
              heading="Theme"
              className="text-xs font-medium text-gray-500 px-2 py-1.5"
            >
              <CommandItem
                icon={<Sun className="w-4 h-4" />}
                label="Light Mode"
                selected={theme === "light"}
                onSelect={() => handleSelect(() => setTheme("light"))}
              />
              <CommandItem
                icon={<Moon className="w-4 h-4" />}
                label="Dark Mode"
                selected={theme === "dark"}
                onSelect={() => handleSelect(() => setTheme("dark"))}
              />
              <CommandItem
                icon={<Monitor className="w-4 h-4" />}
                label="System Theme"
                selected={theme === "system"}
                onSelect={() => handleSelect(() => setTheme("system"))}
              />
            </Command.Group>

            {/* Language */}
            <Command.Separator className="my-2 h-px bg-gray-200" />
            <Command.Group
              heading="Language"
              className="text-xs font-medium text-gray-500 px-2 py-1.5"
            >
              <CommandItem
                icon={<Languages className="w-4 h-4" />}
                label="English"
                selected={language === "en"}
                onSelect={() => handleSelect(() => setLanguage("en"))}
              />
              <CommandItem
                icon={<Languages className="w-4 h-4" />}
                label="中文 (Chinese)"
                selected={language === "zh"}
                onSelect={() => handleSelect(() => setLanguage("zh"))}
              />
              <CommandItem
                icon={<Languages className="w-4 h-4" />}
                label="Deutsch (German)"
                selected={language === "de"}
                onSelect={() => handleSelect(() => setLanguage("de"))}
              />
              <CommandItem
                icon={<Languages className="w-4 h-4" />}
                label="Español (Spanish)"
                selected={language === "es"}
                onSelect={() => handleSelect(() => setLanguage("es"))}
              />
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
            <div>
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd> to close
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⌘</kbd>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">K</kbd> to open
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

interface CommandItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  selected?: boolean;
  onSelect: () => void;
}

function CommandItem({ icon, label, shortcut, selected, onSelect }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={`
        flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer
        hover:bg-gray-100 dark:hover:bg-gray-800
        ${selected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
      `}
    >
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
          {shortcut}
        </kbd>
      )}
      {selected && (
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </Command.Item>
  );
}
