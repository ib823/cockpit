"use client";

import { format } from "date-fns";
import { Flag, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface Milestone {
  id: string;
  name: string;
  date: Date;
  color: string;
}

const COLORS = [
  { name: "Green", class: "bg-green-500", value: "green" },
  { name: "Blue", class: "bg-blue-500", value: "blue" },
  { name: "Purple", class: "bg-purple-500", value: "purple" },
  { name: "Orange", class: "bg-orange-500", value: "orange" },
  { name: "Red", class: "bg-red-500", value: "red" },
  { name: "Pink", class: "bg-pink-500", value: "pink" },
];

export function MilestoneManagerModal({
  milestones,
  onUpdate,
  onClose,
}: {
  milestones: Milestone[];
  onUpdate: (milestones: Milestone[]) => void;
  onClose: () => void;
}) {
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
  const [newMilestone, setNewMilestone] = useState({ name: "", date: "", color: "bg-green-500" });

  const handleAdd = () => {
    if (!newMilestone.name || !newMilestone.date) return;

    const milestone: Milestone = {
      id: `ms_${Date.now()}`,
      name: newMilestone.name,
      date: new Date(newMilestone.date),
      color: newMilestone.color,
    };

    setLocalMilestones(
      [...localMilestones, milestone].sort((a, b) => a.date.getTime() - b.date.getTime())
    );
    setNewMilestone({ name: "", date: "", color: "bg-green-500" });
  };

  const handleDelete = (id: string) => {
    setLocalMilestones(localMilestones.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    onUpdate(localMilestones);
    onClose();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Milestone Manager"
      subtitle={`${localMilestones.length} milestones`}
      icon={<Flag className="w-6 h-6" />}
      size="medium"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onClick={handleSave}>
            Save Changes
          </ModalButton>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Add New */}
        <div
          style={{
            padding: "24px",
            backgroundColor: "rgba(52, 199, 89, 0.05)",
            borderRadius: "8px",
            border: "1px solid rgba(52, 199, 89, 0.1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="text"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              placeholder="Milestone name (e.g., UAT Complete)"
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
                e.currentTarget.style.borderColor = "#34C759";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52, 199, 89, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#D1D1D6";
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label="Milestone name"
            />
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <HolidayAwareDatePicker
                  value={newMilestone.date}
                  onChange={(value) => setNewMilestone({ ...newMilestone, date: value })}
                  region="ABMY"
                  placeholder="Select date"
                  size="medium"
                />
              </div>
              <select
                value={newMilestone.color}
                onChange={(e) => setNewMilestone({ ...newMilestone, color: e.target.value })}
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  padding: "10px 12px",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#34C759";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52, 199, 89, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#D1D1D6";
                  e.currentTarget.style.boxShadow = "none";
                }}
                aria-label="Milestone color"
              >
                {COLORS.map((c) => (
                  <option key={c.value} value={c.class}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="md"
                onClick={handleAdd}
                disabled={!newMilestone.name || !newMilestone.date}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Milestone List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
          {localMilestones.map((milestone) => (
            <div
              key={milestone.id}
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
                <div className={`w-3 h-3 ${milestone.color} rotate-45`} />
                <div>
                  <div style={{ fontFamily: "var(--font-text)", fontSize: "14px", fontWeight: 600, color: "#1D1D1F" }}>
                    {milestone.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-text)", fontSize: "13px", color: "#86868B" }}>
                    {format(milestone.date, "EEEE, MMMM dd, yyyy")}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(milestone.id)}
                aria-label={`Delete ${milestone.name}`}
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
