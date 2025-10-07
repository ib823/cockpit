"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { isHoliday, getHolidayName, getNextWorkingDay } from "@/data/holidays";

interface ProjectStartDatePickerProps {
  currentStartDate: Date;
  region: 'ABMY' | 'ABSG' | 'ABVN';
  onChange: (newDate: Date) => void;
  disabled?: boolean;
}

export function ProjectStartDatePicker({
  currentStartDate,
  region,
  onChange,
  disabled = false,
}: ProjectStartDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentStartDate);

  // Check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Validate selected date
  const validation = validateStartDate(selectedDate, region);

  const handleConfirm = () => {
    onChange(selectedDate);
    setShowPicker(false);
  };

  const handleSuggestNextWorkingDay = () => {
    const nextWorkingDay = getNextWorkingDay(selectedDate, region);
    setSelectedDate(nextWorkingDay);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <div className="text-left">
          <div className="text-xs text-gray-500">Project Start Date</div>
          <div className="font-semibold text-gray-900">
            {format(currentStartDate, 'MMM dd, yyyy')}
          </div>
        </div>
      </button>

      {/* Date Picker Modal */}
      {showPicker && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[320px]">
          {/* Date Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Start Date
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Validation Messages */}
          <div className="space-y-2 mb-4">
            {validation.isWeekend && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-800">
                    Weekend Selected
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">
                    {format(selectedDate, 'EEEE')} is not a working day
                  </div>
                </div>
              </div>
            )}

            {validation.isHoliday && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">
                    Public Holiday
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    {validation.holidayName} - {region}
                  </div>
                </div>
              </div>
            )}

            {validation.isValid && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800">
                    Valid Working Day
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestion */}
          {!validation.isValid && (
            <button
              onClick={handleSuggestNextWorkingDay}
              className="w-full mb-4 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Use Next Working Day → {format(getNextWorkingDay(selectedDate, region), 'MMM dd')}
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPicker(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!validation.isValid}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>

          {/* Region Indicator */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            Holiday calendar: {region === 'ABMY' ? '🇲🇾 Malaysia' : region === 'ABSG' ? '🇸🇬 Singapore' : '🇻🇳 Vietnam'}
          </div>
        </div>
      )}
    </div>
  );
}

interface DateValidation {
  isValid: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

function validateStartDate(date: Date, region: 'ABMY' | 'ABSG' | 'ABVN'): DateValidation {
  const weekend = isWeekend(date);
  const holiday = isHoliday(date, region);

  return {
    isValid: !weekend && !holiday,
    isWeekend: weekend,
    isHoliday: holiday,
    holidayName: holiday ? getHolidayName(date, region) || undefined : undefined,
  };
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
