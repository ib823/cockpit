/**
 * Manual Chip Entry Modal
 * 
 * Allows users to manually add missing chips with validation
 * 
 * SECURITY: Input sanitization, rate limiting, XSS prevention
 * ACCESSIBILITY: Keyboard navigation, ARIA labels, focus management
 * UX: Steve Jobs minimalism - simple, clear, beautiful
 */

"use client";

import {
    checkRateLimit,
    CHIP_DEFAULTS,
    CHIP_VALIDATION,
    getInputType,
    sanitizeChipValue,
    validateChipValue,
} from "@/lib/chip-defaults";
import { ChipType } from "@/types/core";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Plus, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ManualChipEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChip: (type: ChipType, value: string) => void;
  missingGaps: string[];
}

export function ManualChipEntry({
  isOpen,
  onClose,
  onAddChip,
  missingGaps,
}: ManualChipEntryProps) {
  const [selectedType, setSelectedType] = useState<ChipType | "">("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedType("");
      setValue("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('select, input') as HTMLElement;
      firstInput?.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTypeChange = (newType: ChipType | "") => {
    setSelectedType(newType);
    setError(null);
    setSuccess(false);
    
    // Auto-fill with default value
    if (newType && CHIP_DEFAULTS[newType as ChipType]) {
      setValue(CHIP_DEFAULTS[newType as ChipType].value);
    } else {
      setValue("");
    }
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError("Please select a chip type");
      return;
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit()) {
      setError("Too many requests. Please wait a moment.");
      return;
    }

    // SECURITY: Sanitize input
    const sanitizedValue = sanitizeChipValue(value);
    
    // Validate
    const validation = validateChipValue(selectedType as ChipType, sanitizedValue);
    
    if (!validation.isValid) {
      setError(validation.error || "Invalid value");
      return;
    }

    // Add chip
    onAddChip(selectedType as ChipType, sanitizedValue);
    
    // Show success
    setSuccess(true);
    
    // Reset form after short delay
    setTimeout(() => {
      setSelectedType("");
      setValue("");
      setSuccess(false);
      
      // Keep modal open for adding more chips
      // User can close manually
    }, 1000);
  };

  const currentDefaults = selectedType ? CHIP_DEFAULTS[selectedType as ChipType] : null;
  const currentValidation = selectedType ? CHIP_VALIDATION[selectedType as ChipType] : null;
  const inputType = selectedType ? getInputType(selectedType as ChipType) : 'text';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-semibold">
                Add Missing Information
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Fill in missing requirements to continue
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Chip Type Selector */}
            <div>
              <label
                htmlFor="chip-type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What information do you want to add?
              </label>
              <select
                id="chip-type"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as ChipType)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-required="true"
              >
                <option value="">-- Select Type --</option>
                {missingGaps.map((gap) => (
                  <option key={gap} value={gap}>
                    {gap.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Input */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label
                  htmlFor="chip-value"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Value
                </label>
                
                {inputType === 'select' && currentValidation?.options ? (
                  <select
                    id="chip-value"
                    ref={inputRef as React.RefObject<HTMLSelectElement>}
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "value-error" : "value-help"}
                  >
                    <option value="">-- Select Value --</option>
                    {currentValidation.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="chip-value"
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type={inputType === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={currentDefaults?.value}
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "value-error" : "value-help"}
                    min={currentValidation?.min}
                    max={currentValidation?.max}
                  />
                )}

                {/* Help Text */}
                {currentDefaults && !error && !success && (
                  <div
                    id="value-help"
                    className="mt-2 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg"
                  >
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    <span>{currentDefaults.note}</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    id="value-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg"
                    role="status"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Added successfully!</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Done
              </button>
              <button
                type="submit"
                disabled={!selectedType || !value.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Chip
              </button>
            </div>
          </form>

          {/* Footer Hint */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              You can add multiple chips. Click &quot;Done&quot; when finished.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}