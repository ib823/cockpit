"use client";

import { format } from "date-fns";
import { Flag, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Heading2, BodySM } from "@/components/common/Typography";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Flag className="w-6 h-6 text-green-600" />
            <div>
              <Heading2>Milestone Manager</Heading2>
              <BodySM className="text-gray-600">{localMilestones.length} milestones</BodySM>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Add New */}
        <div className="p-8 border-b border-gray-200 bg-green-50">
          <div className="space-y-4">
            <input
              type="text"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              placeholder="Milestone name (e.g., UAT Complete)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              aria-label="Milestone name"
            />
            <div className="flex gap-4">
              <input
                type="date"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                aria-label="Milestone date"
              />
              <select
                value={newMilestone.color}
                onChange={(e) => setNewMilestone({ ...newMilestone, color: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-2">
            {localMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 ${milestone.color} rotate-45`} />
                  <div>
                    <div className="font-medium text-gray-900">{milestone.name}</div>
                    <div className="text-sm text-gray-600">
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

        {/* Footer */}
        <div className="flex justify-end gap-4 p-8 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
