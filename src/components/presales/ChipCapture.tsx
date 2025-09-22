"use client";

import { useState } from "react";
import { usePresalesStore } from "@/stores/presales-store";
import { parseChips } from "@/lib/chip-parser";

export function ChipCapture() {
  const [inputText, setInputText] = useState("");
  const {
    chips,
    addChips,
    removeChip,
    validateChip,
    isAutoTransit,
    toggleAutoTransit,
    recordMetric,
  } = usePresalesStore();

  const handleAddChips = () => {
    if (inputText.trim()) {
      const parsedChips = parseChips(inputText);
      addChips(parsedChips);
      setInputText("");
      recordMetric("click");
    }
  };

  const handlePaste = () => {
    recordMetric("click");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    recordMetric("keystroke");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste or type RFP content
        </label>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          onPaste={handlePaste}
          className="w-full h-32 px-3 py-2 border rounded-md"
          placeholder="Paste RFP text here..."
        />
        <button
          onClick={handleAddChips}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Extract Chips
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Extracted Chips ({chips.length})</h3>
        {chips.map((chip) => (
          <div key={chip.id} className="flex items-center gap-2 p-2 border rounded">
            <span className="text-sm">
              {chip.kind}: {chip.raw}
            </span>
            <button onClick={() => validateChip(chip.id)} className="text-green-600 text-sm">
              ✓
            </button>
            <button onClick={() => removeChip(chip.id)} className="text-red-600 text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={isAutoTransit} onChange={toggleAutoTransit} />
        <label className="text-sm">Auto-transit when ready</label>
      </div>
    </div>
  );
}

export default ChipCapture;
