// src/components/project/ChipsSidebar.tsx
"use client";

import { usePresalesStore } from "@/stores/presales-store";
import { Chip } from "@/types/core";

const CHIP_ICONS: Record<string, string> = {
  country: "",
  employees: "",
  revenue: "",
  modules: "",
  timeline: "",
  integration: "",
  compliance: "",
  industry: "",
  banking: "",
  existing_system: "",
  legal_entities: "",
  locations: "",
  data_volume: "",
  users: "",
};

export function ChipsSidebar() {
  const chips = usePresalesStore((state) => state.chips);
  const removeChip = usePresalesStore((state) => state.removeChip);

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Requirements</h2>
        <p className="text-xs text-gray-500 mt-1">{chips.length} items captured</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {chips.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-sm">No requirements yet</div>
          </div>
        ) : (
          chips.map((chip) => (
            <ChipCard
              key={chip.id || `chip-${chip.type}-${chip.value}`}
              chip={chip}
              onRemove={() => removeChip(chip.id!)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ChipCard({ chip, onRemove }: { chip: Chip; onRemove: () => void }) {
  const icon = CHIP_ICONS[chip.type] || "";

  return (
    <div className="chip-card bg-white p-3 hover:border-blue-300 group">
      <div className="flex items-start justify-between">
        <div className="flex gap-2 items-start flex-1">
          <span className="text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {chip.type.replace("_", " ")}
            </div>
            <div className="text-sm font-medium text-gray-900 mt-0.5 break-words">{chip.value}</div>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(chip.confidence * 100)}% confidence
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="  text-gray-400 hover:text-red-600 transition-all">
          ×
        </button>
      </div>
    </div>
  );
}
