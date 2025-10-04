"use client";
import { useState } from "react";

interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  impact?: { cost: number; duration: number; risk: number };
}

interface DecisionPillProps {
  label: string;
  value?: string;
  options: DecisionOption[];
  onChange: (value: string) => void;
}

export function DecisionPill({ label, value, options, onChange }: DecisionPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          value
            ? "bg-blue-50 border-blue-200 text-blue-900"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <div className="text-left">
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="truncate">{selectedOption ? selectedOption.label : "Select..."}</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                )}
                {hoveredOption === option.id && option.impact && (
                  <div className="text-xs text-gray-600 mt-1 flex gap-3">
                    <span>Cost: {option.impact.cost}x</span>
                    <span>Duration: {option.impact.duration}x</span>
                    <span>Risk: {option.impact.risk}x</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
