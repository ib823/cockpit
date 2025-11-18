"use client";

import { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addDays, startOfWeek, endOfWeek } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { isHoliday, getHolidayName, getNextWorkingDay } from "@/data/holidays";

interface HolidayAwareDatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  region?: "ABMY" | "ABSG" | "ABVN";
  minDate?: string; // ISO format
  maxDate?: string; // ISO format
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  showWorkingDaysOnly?: boolean; // Prevent selection of weekends/holidays
  className?: string;
}

export function HolidayAwareDatePicker({
  value,
  onChange,
  label,
  region = "ABMY",
  minDate,
  maxDate,
  disabled = false,
  required = false,
  error,
  placeholder = "Select date",
  size = "medium",
  showWorkingDaysOnly = false,
  className = "",
}: HolidayAwareDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;
  const minDateObj = minDate ? new Date(minDate) : null;
  const maxDateObj = maxDate ? new Date(maxDate) : null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Check if date is disabled
  const isDisabledDate = (date: Date): boolean => {
    if (minDateObj && date < minDateObj) return true;
    if (maxDateObj && date > maxDateObj) return true;
    if (showWorkingDaysOnly) {
      if (isWeekend(date)) return true;
      if (isHoliday(date, region)) return true;
    }
    return false;
  };

  // Get validation status for selected date
  const getValidationStatus = () => {
    if (!selectedDate) return null;

    const weekend = isWeekend(selectedDate);
    const holiday = isHoliday(selectedDate, region);
    const holidayName = holiday ? getHolidayName(selectedDate, region) : null;

    return {
      isValid: !weekend && !holiday,
      isWeekend: weekend,
      isHoliday: holiday,
      holidayName,
    };
  };

  const validation = getValidationStatus();

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDisabledDate(date)) return;

    const isoDate = format(date, "yyyy-MM-dd");
    onChange(isoDate);

    // Auto-close if working day, or stay open if weekend/holiday to show warning
    if (!isWeekend(date) && !isHoliday(date, region)) {
      setIsOpen(false);
    }
  };

  // Navigate to next/previous month
  const handlePreviousMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
  };

  // Jump to today
  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!isDisabledDate(today)) {
      handleDateSelect(today);
    }
  };

  // Use next working day suggestion
  const handleUseNextWorkingDay = () => {
    if (!selectedDate) return;
    const nextWorkingDay = getNextWorkingDay(selectedDate, region);
    handleDateSelect(nextWorkingDay);
    setIsOpen(false);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const calendarDays = generateCalendarDays();

  // Size classes
  const sizeClasses = {
    small: "text-sm py-1.5 px-3",
    medium: "text-base py-2 px-4",
    large: "text-lg py-3 px-5",
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-2
            bg-white border rounded-lg transition-all
            ${sizeClasses[size]}
            ${error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}
            ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}
            ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "hover:border-gray-400 cursor-pointer"}
          `}
        >
          <div className="flex items-center gap-2 flex-1 text-left">
            <Calendar className={`flex-shrink-0 text-gray-400 ${size === "small" ? "w-4 h-4" : size === "large" ? "w-6 h-6" : "w-5 h-5"}`} />
            {selectedDate ? (
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {format(selectedDate, "MMM dd, yyyy")}
                </span>
                {validation && !validation.isValid && (
                  <span className="text-xs text-amber-600 font-medium">
                    {validation.isWeekend && "Weekend"}
                    {validation.isHoliday && validation.holidayName}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          {/* Spacer for clear button */}
          {selectedDate && !disabled && <div className="w-8" />}
        </button>

        {/* Clear button - positioned absolutely to avoid nesting */}
        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[320px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {format(viewDate, "MMMM yyyy")}
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleToday}
              className="w-full py-1.5 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, viewDate);
                const isTodayDate = isToday(date);
                const weekend = isWeekend(date);
                const holiday = isHoliday(date, region);
                const holidayName = holiday ? getHolidayName(date, region) : null;
                const disabled = isDisabledDate(date);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={disabled}
                    title={holidayName || undefined}
                    className={`
                      relative aspect-square flex items-center justify-center text-sm rounded-lg font-medium
                      transition-all
                      ${!isCurrentMonth ? "text-gray-300" : "text-gray-900"}
                      ${isSelected ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2" : ""}
                      ${!isSelected && isTodayDate ? "bg-blue-50 text-blue-600 font-bold" : ""}
                      ${!isSelected && !isTodayDate && !disabled ? "hover:bg-gray-100" : ""}
                      ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
                      ${holiday && !isSelected ? "bg-red-50 text-red-700" : ""}
                      ${weekend && !holiday && !isSelected && isCurrentMonth ? "bg-amber-50 text-amber-700" : ""}
                    `}
                  >
                    {format(date, "d")}
                    {/* Holiday Indicator */}
                    {holiday && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Warning */}
          {validation && !validation.isValid && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {validation.isWeekend && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-amber-900">Weekend Selected</div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        {selectedDate && format(selectedDate, "EEEE")} is not a working day
                      </div>
                    </div>
                  </div>
                )}

                {validation.isHoliday && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-red-900">Public Holiday</div>
                      <div className="text-xs text-red-700 mt-0.5">
                        {validation.holidayName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestion Button */}
                <button
                  type="button"
                  onClick={handleUseNextWorkingDay}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Use Next Working Day → {selectedDate && format(getNextWorkingDay(selectedDate, region), "MMM dd")}
                </button>
              </div>
            </div>
          )}

          {/* Region Indicator */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {region === "ABMY" ? "🇲🇾 Malaysia" : region === "ABSG" ? "🇸🇬 Singapore" : "🇻🇳 Vietnam"}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600">Holiday</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-600">Weekend</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
