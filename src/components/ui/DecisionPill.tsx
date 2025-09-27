"use client";

import { useState } from "react";

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  impact?: {
    cost: number;
    duration: number;
    risk: number;
  };
}

interface DecisionPillProps {
  label: string;
  value?: string;
  options: DecisionOption[];
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function DecisionPill({
  label,
  value,
  options,
  onChange,
  disabled = false
}: DecisionPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === value);

  const handleOptionClick = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
          ${selectedOption 
            ? 'bg-blue-100 border-blue-300 text-blue-800' 
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-200' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{label}:</span>
          <span>{selectedOption?.label || 'Select...'}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">{label}</div>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={`
                  w-full text-left p-3 rounded-md transition-colors mb-1
                  ${value === option.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-medium text-sm text-gray-900">
                  {option.label}
                  {value === option.id && (
                    <span className="ml-2 text-xs text-blue-600">✓ Selected</span>
                  )}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-600 mt-1">
                    {option.description}
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