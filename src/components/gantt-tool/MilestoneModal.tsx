/**
 * Milestone Modal
 *
 * Modal for creating and editing milestones
 * Apple HIG specification with clean, focused design
 */

"use client";

import { useState, useEffect } from "react";
import { Flag } from "lucide-react";
import { format } from "date-fns";
import type { GanttMilestone } from "@/types/gantt-tool";
import { Modal } from "@/ui/components/Modal";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

interface MilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<GanttMilestone>) => void;
  milestone?: GanttMilestone | null;
  defaultDate?: string;
}

// Apple-inspired color palette
const MILESTONE_COLORS = [
  { name: 'Red', value: '#FF3B30', label: 'Launches, Deadlines' },
  { name: 'Blue', value: '#007AFF', label: 'Reviews, Checkpoints' },
  { name: 'Green', value: '#34C759', label: 'Approvals, Go-Live' },
  { name: 'Yellow', value: '#FFCC00', label: 'Warnings, Decisions' },
  { name: 'Purple', value: '#AF52DE', label: 'Custom Events' },
  { name: 'Gray', value: '#8E8E93', label: 'Notes, References' },
];

// Common milestone icons
const MILESTONE_ICONS = ['🚀', '🎯', '✅', '⭐', '🏁', '📅', '🔔', '💡', '🎉', ''];

export function MilestoneModal({
  open,
  onOpenChange,
  onSave,
  milestone,
  defaultDate,
}: MilestoneModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [color, setColor] = useState('#FF3B30');
  const [icon, setIcon] = useState('');

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (milestone) {
        // Editing existing milestone
        setName(milestone.name);
        setDescription(milestone.description || '');
        setDate(milestone.date.split('T')[0]); // Extract date part
        setColor(milestone.color || '#FF3B30');
        setIcon(milestone.icon || '');
      } else {
        // Creating new milestone
        setName('');
        setDescription('');
        setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
        setColor('#FF3B30');
        setIcon('');
      }
    }
  }, [open, milestone, defaultDate]);

  const handleSave = () => {
    if (!name.trim() || !date) return;

    const milestoneData: Partial<GanttMilestone> = {
      name: name.trim(),
      description: description.trim() || undefined,
      date: `${date}T00:00:00.000Z`,
      color,
      icon,
    };

    if (milestone) {
      milestoneData.id = milestone.id;
    }

    onSave(milestoneData);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-gray-600" />
          {milestone ? 'Edit Milestone' : 'Add Milestone'}
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !date}>
            {milestone ? 'Save Changes' : 'Add Milestone'}
          </Button>
        </>
      }
      width={500}
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g., Beta Launch, Go-Live, Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Description (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Description <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Add details about this milestone..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="grid grid-cols-3 gap-2">
            {MILESTONE_COLORS.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => setColor(colorOption.value)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border-2 transition-all
                  ${color === colorOption.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colorOption.value }}
                />
                <div className="text-left flex-1">
                  <div className="text-xs font-medium">{colorOption.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {colorOption.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Icon <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MILESTONE_ICONS.map((iconOption, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setIcon(iconOption)}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-lg
                  ${icon === iconOption
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                title={iconOption || 'No icon'}
              >
                {iconOption || '—'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-gray-200">
          <label className="text-sm font-medium mb-2 block">Preview</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path
                d="M8 0 L16 8 L8 16 L0 8 Z"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
              />
              {icon && (
                <text
                  x="8"
                  y="11"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#fff"
                >
                  {icon}
                </text>
              )}
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {name || 'Milestone Name'}
              </div>
              {date && (
                <div className="text-xs text-gray-600">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="text-xs text-gray-400 text-center pt-2">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> to save
        </div>
      </div>
    </Modal>
  );
}
