import React, { useState } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';

interface HolidayManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HolidayManager: React.FC<HolidayManagerProps> = ({ isOpen, onClose }) => {
  const { holidays, addHoliday, removeHoliday, profile } = useTimelineStore();
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const handleAddHoliday = () => {
    if (newHoliday.date && newHoliday.name.trim()) {
      addHoliday({
        date: newHoliday.date, // Keep original YYYY-MM-DD format
        name: newHoliday.name.trim(),
        country: profile.region?.slice(2) || 'MY'
      });
      setNewHoliday({ date: '', name: '' });
    }
  };

  const formatDateConsistent = (dateString: string): string => {
    try {
      // Parse the date string properly
      const date = new Date(dateString + 'T00:00:00'); // Ensure local time
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dd = String(date.getDate()).padStart(2, '0');
      const mmm = months[date.getMonth()];
      const yy = String(date.getFullYear()).slice(-2);
      const ddd = days[date.getDay()];
      return `${dd}-${mmm}-${yy} (${ddd})`;
    } catch (error) {
      return dateString; // Fallback to original string
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Holidays</h2>
          
          {/* Add Holiday Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Public Holiday"
                maxLength={50}
              />
            </div>
            <button
              onClick={handleAddHoliday}
              disabled={!newHoliday.date || !newHoliday.name.trim()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Holiday
            </button>
          </div>

          {/* Existing Holidays */}
          <div className="max-h-64 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3">Current Holidays ({holidays.length})</h3>
            {holidays.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No holidays configured</p>
            ) : (
              <div className="space-y-2">
                {holidays
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((holiday, idx) => (
                  <div key={`${holiday.date}-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{holiday.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatDateConsistent(holiday.date)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeHoliday(holiday.date)}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayManager;
