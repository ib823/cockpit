"use client";

import { useState } from "react";
import { X, Plus, Trash2, Calendar } from "lucide-react";
import { HOLIDAYS, type Holiday } from "@/data/holidays";
import { format } from "date-fns";
import { Button } from "@/components/common/Button";
import { Heading2, BodySM } from "@/components/common/Typography";

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
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6 text-purple-600" />
            <div>
              <Heading2>Holiday Management</Heading2>
              <BodySM className="text-gray-600">
                {HOLIDAYS[region].name} - {holidays.length} holidays
              </BodySM>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Add New Holiday */}
        <div className="p-8 border-b border-gray-200 bg-purple-50">
          <div className="flex gap-4">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              min="2025-01-01"
              max="2030-12-31"
              aria-label="Holiday date"
            />
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              placeholder="Holiday name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              aria-label="Holiday name"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleAddHoliday}
              disabled={!newHoliday.date || !newHoliday.name}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search holidays..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            aria-label="Search holidays"
          />
        </div>

        {/* Holiday List */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-2">
            {filteredHolidays.map((holiday, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(holiday.date), 'EEE, MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {holiday.name}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteHoliday(idx)}
                  aria-label={`Delete ${holiday.name}`}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-gray-200 bg-gray-50">
          <BodySM className="text-gray-600">
            {filteredHolidays.length} of {holidays.length} holidays shown
          </BodySM>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}