"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { HOLIDAYS, type Holiday } from "@/data/holidays";
import { format } from "date-fns";
import { Button } from "@/components/common/Button";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

export function HolidayManagerModal({
  region,
  onClose,
}: {
  region: "ABMY" | "ABSG" | "ABVN";
  onClose: () => void;
}) {
  const [holidays, setHolidays] = useState<Holiday[]>(HOLIDAYS[region].holidays);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [filter, setFilter] = useState("");

  const filteredHolidays = holidays.filter(
    (h) => h.name.toLowerCase().includes(filter.toLowerCase()) || h.date.includes(filter)
  );

  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;

    const updated = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(updated);
    setNewHoliday({ date: "", name: "" });
  };

  const handleDeleteHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Note: Future enhancement - persist to localStorage or backend API
    console.log("Saving holidays:", holidays);
    onClose();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Holiday Management"
      subtitle={`${HOLIDAYS[region].name} - ${holidays.length} holidays`}
      icon={<Calendar className="w-6 h-6" />}
      size="large"
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <p style={{ fontFamily: "var(--font-text)", fontSize: "14px", color: "#86868B", margin: 0 }}>
            {filteredHolidays.length} of {holidays.length} holidays shown
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <ModalButton variant="secondary" onClick={onClose}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={handleSave}>
              Save Changes
            </ModalButton>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Add New Holiday */}
        <div
          style={{
            padding: "24px",
            backgroundColor: "rgba(175, 82, 222, 0.05)",
            borderRadius: "8px",
            border: "1px solid rgba(175, 82, 222, 0.1)",
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <HolidayAwareDatePicker
                value={newHoliday.date}
                onChange={(value) => setNewHoliday({ ...newHoliday, date: value })}
                region={region}
                placeholder="Select date"
                size="medium"
                minDate="2025-01-01"
                maxDate="2030-12-31"
              />
            </div>
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              placeholder="Holiday name"
              style={{
                flex: 1,
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                padding: "10px 12px",
                border: "1px solid #D1D1D6",
                borderRadius: "8px",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#AF52DE";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(175, 82, 222, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#D1D1D6";
                e.currentTarget.style.boxShadow = "none";
              }}
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
        <div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search holidays..."
            style={{
              width: "100%",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              padding: "10px 12px",
              border: "1px solid #D1D1D6",
              borderRadius: "8px",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#AF52DE";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(175, 82, 222, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#D1D1D6";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="Search holidays"
          />
        </div>

        {/* Holiday List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
          {filteredHolidays.map((holiday, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                backgroundColor: "#F5F5F7",
                borderRadius: "8px",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E8E8ED")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F5F5F7")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontFamily: "var(--font-text)", fontSize: "14px", fontWeight: 600, color: "#1D1D1F" }}>
                  {format(new Date(holiday.date), "EEE, MMM dd, yyyy")}
                </div>
                <div style={{ fontFamily: "var(--font-text)", fontSize: "14px", color: "#86868B" }}>
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
    </BaseModal>
  );
}
