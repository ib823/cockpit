"use client";

import { useState } from "react";
import { X, Plus, Trash2, Calendar } from "lucide-react";
import { HOLIDAYS, type Holiday } from "@/data/holidays";
import { format } from "date-fns";

export function HolidayManagerModal({
  region,
  onClose,
}: {
  region: 'ABMY' | 'ABSG' | 'ABVN';
  onClose: () => void;
}) {
  const [holidays, setHolidays] = useState<Holiday[]>(HOLIDAYS[region].holidays);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [filter, setFilter] = useState('');

  const filteredHolidays = holidays.filter(h =>
    h.name.toLowerCase().includes(filter.toLowerCase()) ||
    h.date.includes(filter)
  );

  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    
    const updated = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(updated);
    setNewHoliday({ date: '', name: '' });
  };

  const handleDeleteHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // TODO: Persist to localStorage or backend
    console.log('Saving holidays:', holidays);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Holiday Management
              </h2>
              <p className="text-sm text-gray-600">
                {HOLIDAYS[region].name} - {holidays.length} holidays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Add New Holiday */}
        <div className="p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex gap-3">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              min="2025-01-01"
              max="2030-12-31"
            />
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              placeholder="Holiday name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleAddHoliday}
              disabled={!newHoliday.date || !newHoliday.name}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search holidays..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Holiday List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {filteredHolidays.map((holiday, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(holiday.date), 'EEE, MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {holiday.name}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHoliday(idx)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredHolidays.length} of {holidays.length} holidays shown
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}