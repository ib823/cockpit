/**
 * MilestoneModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 * Source Pattern: /app/modal-design-showcase + AddTaskModal.tsx
 *
 * Features:
 * - Declarative form using FormExample
 * - Custom color picker for milestone categorization
 * - In-modal milestone list with edit/delete
 * - Holiday-aware date picker
 */

"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Flag } from "lucide-react";
import { format } from "date-fns";
import type { GanttMilestone } from "@/types/gantt-tool";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample } from "@/lib/design-system/showcase-helpers";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-system/tokens";

interface MilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<GanttMilestone>) => void;
  onDelete?: (id: string) => void;
  milestones: GanttMilestone[];
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form
  useEffect(() => {
    if (open && !editingId) {
      setName('');
      setDescription('');
      setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
      setColor('#FF3B30');
      setValidationErrors({});
    }
  }, [open, defaultDate, editingId]);

  const handleEdit = (milestone: GanttMilestone) => {
    setEditingId(milestone.id);
    setName(milestone.name);
    setDescription(milestone.description || '');
    setDate(milestone.date.split('T')[0]);
    setColor(milestone.color || '#FF3B30');
    setValidationErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Milestone name is required";
    }

    if (!date) {
      errors.date = "Date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

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
      setEditingId(null);
      setName('');
      setDescription('');
      setDate(defaultDate ? defaultDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
      setColor('#FF3B30');
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Failed to save milestone. Please try again.');
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
          setValidationErrors({});
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
    setValidationErrors({});
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={() => {
        handleCancel();
        onOpenChange(false);
      }}
      title="Milestone Manager"
      subtitle={`Manage ${milestones.length} project milestone${milestones.length !== 1 ? 's' : ''}`}
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
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[6] }}>
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
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: "15px",
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING[4],
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
            }}
          >
            {editingId ? (
              <>
                <Edit2 style={{ width: "16px", height: "16px" }} />
                Edit Milestone
              </>
            ) : (
              <>
                <Plus style={{ width: "16px", height: "16px" }} />
                Add New Milestone
              </>
            )}
          </h3>

          <FormExample
            fields={[
              {
                id: "name",
                label: "Name",
                type: "text",
                value: name,
                required: true,
                placeholder: "e.g., Beta Launch, Go-Live, Review",
                error: validationErrors.name,
                helpText: "Clear, descriptive milestone name",
              },
              {
                id: "date",
                label: "Date",
                type: "date",
                value: date,
                required: true,
                error: validationErrors.date,
              },
              {
                id: "description",
                label: "Description",
                type: "textarea",
                value: description,
                placeholder: "Add details about this milestone...",
                helpText: "Optional context for team members",
              },
            ]}
            onChange={(field, value) => {
              if (field === "name") setName(value);
              else if (field === "date") setDate(value);
              else if (field === "description") setDescription(value);
              const newErrors = { ...validationErrors };
              delete newErrors[field];
              setValidationErrors(newErrors);
            }}
            holidays={[]}
          />

          {/* Color Picker - Custom component for milestone categorization */}
          <div style={{ marginTop: SPACING[4] }}>
            <label
              style={{
                display: "block",
                marginBottom: SPACING[2],
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.secondary,
              }}
            >
              Color
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: SPACING[2],
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
                    gap: SPACING[2],
                    padding: "10px 12px",
                    backgroundColor: color === colorOption.value ? "#F0F9FF" : "#FFFFFF",
                    border: `2px solid ${
                      color === colorOption.value ? "#007AFF" : "rgba(0, 0, 0, 0.08)"
                    }`,
                    borderRadius: RADIUS.default,
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
                        fontFamily: TYPOGRAPHY.fontFamily.text,
                        fontSize: TYPOGRAPHY.fontSize.caption,
                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                        color: COLORS.text.primary,
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
          <div style={{ display: "flex", gap: SPACING[3], paddingTop: SPACING[4], marginTop: SPACING[4] }}>
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

        {/* Milestones List */}
        <div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: "15px",
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING[4],
            }}
          >
            Project Milestones ({milestones.length})
          </h3>

          {milestones.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: COLORS.text.tertiary,
              }}
            >
              <Flag
                style={{ width: "48px", height: "48px", margin: "0 auto 12px", opacity: 0.3 }}
              />
              <p
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.body,
                  fontWeight: 500,
                }}
              >
                No milestones yet
              </p>
              <p
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
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
                gap: SPACING[2],
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
                      gap: SPACING[3],
                      padding: SPACING[4],
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
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: milestone.color || "#FF3B30",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: SPACING[2],
                          marginBottom: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.body,
                            fontWeight: TYPOGRAPHY.fontWeight.semibold,
                            color: COLORS.text.primary,
                          }}
                        >
                          {milestone.name}
                        </span>
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.caption,
                            color: COLORS.text.tertiary,
                          }}
                        >
                          {format(new Date(milestone.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      {milestone.description && (
                        <p
                          style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.caption,
                            color: COLORS.text.tertiary,
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
                        <Edit2 style={{ width: "16px", height: "16px" }} />
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
                        <Trash2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
