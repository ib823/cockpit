/**
 * Milestone Manager Modal
 *
 * Manage all project milestones in one place
 * Apple HIG specification with clean, focused design
 *
 * Refactored to use AppleMinimalistModal with Apple HIG quality
 */

"use client";

import { useState, useEffect } from "react";
import { Flag, Edit2, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import type { GanttMilestone } from "@/types/gantt-tool";
import { AppleMinimalistModal, ModalButton } from "@/components/ui/AppleMinimalistModal";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";

interface MilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<GanttMilestone>) => void;
  onDelete?: (id: string) => void;
  milestones: GanttMilestone[]; // All project milestones
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

export function MilestoneModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  milestones,
  defaultDate,
}: MilestoneModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [color, setColor] = useState('#FF3B30');

  // Initialize form
  useEffect(() => {
    if (open && !editingId) {
      // Reset for new milestone
      setName('');
      setDescription('');
      setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
      setColor('#FF3B30');
    }
  }, [open, defaultDate, editingId]);

  const handleEdit = (milestone: GanttMilestone) => {
    setEditingId(milestone.id);
    setName(milestone.name);
    setDescription(milestone.description || '');
    setDate(milestone.date.split('T')[0]);
    setColor(milestone.color || '#FF3B30');
  };

  const handleSave = async () => {
    if (!name.trim() || !date) return;

    const milestoneData: Partial<GanttMilestone> = {
      name: name.trim(),
      description: description.trim() || undefined,
      date: `${date}T00:00:00.000Z`,
      color,
    };

    if (editingId) {
      milestoneData.id = editingId;
    }

    try {
      await onSave(milestoneData);
      // Reset form
      setEditingId(null);
      setName('');
      setDescription('');
      setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
      setColor('#FF3B30');
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  };

  const handleDelete = async (id: string, milestoneName: string) => {
    if (confirm(`Delete milestone "${milestoneName}"?`)) {
      try {
        await onDelete?.(id);
        if (editingId === id) {
          setEditingId(null);
          setName('');
          setDescription('');
          setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
          setColor('#FF3B30');
        }
      } catch (error) {
        console.error('Error deleting milestone:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
    setColor('#FF3B30');
  };

  return (
    <AppleMinimalistModal
      isOpen={open}
      onClose={() => {
        handleCancel();
        onOpenChange(false);
      }}
      title="Milestone Manager"
      subtitle={`Manage ${milestones.length} project milestone${milestones.length !== 1 ? 's' : ''}`}
      icon={<Flag className="w-5 h-5" />}
      size="large"
      footer={
        <ModalButton
          onClick={() => {
            handleCancel();
            onOpenChange(false);
          }}
        >
          Close
        </ModalButton>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Form Section */}
        <div
          style={{
            backgroundColor: "#F5F5F7",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {editingId ? (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Milestone
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add New Milestone
              </>
            )}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                }}
              >
                Name <span style={{ color: "#FF3B30" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Beta Launch, Go-Live, Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  color: "#1D1D1F",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#007AFF";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Date */}
            <div>
              <HolidayAwareDatePicker
                label="Date"
                value={date}
                onChange={(value) => setDate(value)}
                region="ABMY"
                required={true}
                size="medium"
              />
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                }}
              >
                Description{" "}
                <span style={{ color: "#86868B", fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                placeholder="Add details about this milestone..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  color: "#1D1D1F",
                  outline: "none",
                  transition: "all 0.15s ease",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#007AFF";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Color */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                }}
              >
                Color
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {MILESTONE_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      backgroundColor: color === colorOption.value ? "#F0F9FF" : "#FFFFFF",
                      border: `2px solid ${
                        color === colorOption.value ? "#007AFF" : "rgba(0, 0, 0, 0.08)"
                      }`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (color !== colorOption.value) {
                        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (color !== colorOption.value) {
                        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: colorOption.value,
                      }}
                    />
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                        }}
                      >
                        {colorOption.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              {editingId && (
                <ModalButton onClick={handleCancel} variant="secondary">
                  Cancel
                </ModalButton>
              )}
              <ModalButton
                onClick={handleSave}
                variant="primary"
                disabled={!name.trim() || !date}
              >
                {editingId ? "Update Milestone" : "Add Milestone"}
              </ModalButton>
            </div>
          </div>
        </div>

        {/* Milestones List */}
        <div>
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              marginBottom: "16px",
            }}
          >
            Project Milestones ({milestones.length})
          </h3>

          {milestones.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "#86868B",
              }}
            >
              <Flag
                className="w-12 h-12"
                style={{ margin: "0 auto 12px", opacity: 0.3 }}
              />
              <p
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                No milestones yet
              </p>
              <p
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                Add your first milestone above
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {[...milestones]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((milestone) => (
                  <div
                    key={milestone.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      backgroundColor:
                        editingId === milestone.id ? "#F0F9FF" : "#FFFFFF",
                      border: `2px solid ${
                        editingId === milestone.id ? "#007AFF" : "rgba(0, 0, 0, 0.08)"
                      }`,
                      borderRadius: "12px",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (editingId !== milestone.id) {
                        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.2)";
                        e.currentTarget.style.backgroundColor = "#F5F5F7";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editingId !== milestone.id) {
                        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                      }
                    }}
                  >
                    {/* Color indicator */}
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: milestone.color || "#FF3B30",
                        flexShrink: 0,
                      }}
                    />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                          marginBottom: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}
                        >
                          {milestone.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "12px",
                            color: "#86868B",
                          }}
                        >
                          {format(new Date(milestone.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      {milestone.description && (
                        <p
                          style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "12px",
                            color: "#86868B",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {milestone.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleEdit(milestone)}
                        title="Edit milestone"
                        style={{
                          padding: "8px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#007AFF",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#E5F1FF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(milestone.id, milestone.name)}
                        title="Delete milestone"
                        style={{
                          padding: "8px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#FF3B30",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FFE5E5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </AppleMinimalistModal>
  );
}
