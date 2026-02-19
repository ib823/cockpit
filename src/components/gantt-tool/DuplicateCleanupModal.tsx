/**
 * Duplicate Phase Cleanup Modal
 *
 * Detects and removes duplicate phases in the current project
 *
 * DESIGN: Pure BaseModal + design tokens - NO Ant Design, NO Tailwind
 */

"use client";

import { useState, useEffect } from "react";
import { Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface DuplicateGroup {
  phaseName: string;
  phases: Array<{
    id: string;
    name: string;
    taskCount: number;
    startDate: string;
    endDate: string;
  }>;
}

interface DuplicateCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Style Objects (Design Tokens Only)
// ============================================================================

const styles = {
  alertBox: (type: 'warning' | 'success') => ({
    padding: SPACING[4],
    backgroundColor: type === 'warning' ? "rgba(255, 149, 0, 0.1)" : "rgba(52, 199, 89, 0.1)",
    border: `1px solid ${type === 'warning' ? "rgba(255, 149, 0, 0.3)" : "rgba(52, 199, 89, 0.3)"}`,
    borderRadius: RADIUS.default,
    marginBottom: SPACING[4],
  }),
  groupCard: {
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.default,
    padding: SPACING[4],
    backgroundColor: COLORS.bg.subtle,
  },
  listItem: (isSelected: boolean) => ({
    padding: SPACING[3],
    border: `1px solid ${isSelected ? COLORS.red : COLORS.border.default}`,
    borderRadius: RADIUS.default,
    backgroundColor: isSelected ? "rgba(255, 59, 48, 0.05)" : COLORS.bg.primary,
    marginBottom: SPACING[2],
    transition: `all ${TRANSITIONS.duration.fast}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: COLORS.blue,
  },
  badge: (type: 'original' | 'duplicate') => ({
    display: 'inline-block',
    padding: `2px ${SPACING[2]}`,
    fontSize: '11px',
    fontFamily: TYPOGRAPHY.fontFamily.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    borderRadius: RADIUS.small,
    backgroundColor: type === 'original' ? "rgba(52, 199, 89, 0.15)" : "rgba(255, 149, 0, 0.15)",
    color: type === 'original' ? COLORS.status.success : COLORS.status.warning,
  }),
};

export function DuplicateCleanupModal({ isOpen, onClose }: DuplicateCleanupModalProps) {
  const { currentProject } = useGanttToolStoreV2();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Detect duplicates when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      detectDuplicates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentProject]);

  const detectDuplicates = () => {
    if (!currentProject) return;

    // Group phases by name (case-insensitive)
    const phasesByName = new Map<string, typeof currentProject.phases>();

    for (const phase of currentProject.phases) {
      const normalizedName = phase.name.toLowerCase().trim();
      const existing = phasesByName.get(normalizedName) || [];
      phasesByName.set(normalizedName, [...existing, phase]);
    }

    // Find groups with duplicates
    const duplicates: DuplicateGroup[] = [];

    for (const [_normalizedName, phases] of phasesByName.entries()) {
      if (phases.length > 1) {
        duplicates.push({
          phaseName: phases[0].name, // Use original name
          phases: phases.map((p) => ({
            id: p.id,
            name: p.name,
            taskCount: p.tasks.length,
            startDate: p.startDate,
            endDate: p.endDate,
          })),
        });
      }
    }

    setDuplicateGroups(duplicates);

    // Auto-select all duplicates except the first one in each group
    const autoSelected = new Set<string>();
    duplicates.forEach((group) => {
      // Skip the first phase in each group (keep it), select the rest for deletion
      group.phases.slice(1).forEach((phase) => {
        autoSelected.add(phase.id);
      });
    });
    setSelectedPhaseIds(autoSelected);
  };

  const handleTogglePhase = (phaseId: string) => {
    const newSelected = new Set(selectedPhaseIds);
    if (newSelected.has(phaseId)) {
      newSelected.delete(phaseId);
    } else {
      newSelected.add(phaseId);
    }
    setSelectedPhaseIds(newSelected);
  };

  const handleRemoveDuplicates = async () => {
    if (!currentProject || selectedPhaseIds.size === 0) return;

    setIsRemoving(true);

    try {
      // Filter out selected phases
      const remainingPhases = currentProject.phases.filter(
        (phase) => !selectedPhaseIds.has(phase.id)
      );

      // Update project via API
      const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phases: remainingPhases,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove duplicates: ${errorText}`);
      }

      // Refresh project from API
      const store = useGanttToolStoreV2.getState();
      await store.fetchProject(currentProject.id);

      // Show success (you may want to add a toast notification here)
      console.warn(`Successfully removed ${selectedPhaseIds.size} duplicate phase(s)!`);
      onClose();
    } catch (error) {
      console.error("[DuplicateCleanup] Failed to remove duplicates:", error);
      // Show error (you may want to add a toast notification here)
      alert("Failed to remove duplicates. Please try again.");
    } finally {
      setIsRemoving(false);
      setShowConfirm(false);
    }
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.phases.length - 1, 0);

  // Confirmation dialog
  if (showConfirm) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={() => setShowConfirm(false)}
        title="Remove Duplicate Phases?"
        size="small"
        footer={
          <>
            <ModalButton onClick={() => setShowConfirm(false)} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton
              onClick={handleRemoveDuplicates}
              variant="destructive"
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Duplicates"}
            </ModalButton>
          </>
        }
      >
        <p style={{
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.body,
          color: COLORS.text.primary,
          margin: 0,
        }}>
          This will permanently delete <strong>{selectedPhaseIds.size}</strong> duplicate phase(s) and all their tasks.
          This action cannot be undone.
        </p>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Cleanup"
      size="large"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Close
          </ModalButton>
          <ModalButton
            onClick={() => setShowConfirm(true)}
            variant="destructive"
            disabled={selectedPhaseIds.size === 0 || isRemoving}
          >
            <Trash2 style={{ width: '16px', height: '16px', marginRight: SPACING[2] }} />
            Remove {selectedPhaseIds.size > 0 ? `${selectedPhaseIds.size} ` : ""}Selected
          </ModalButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[4] }}>
        {/* Summary */}
        {duplicateGroups.length > 0 ? (
          <div style={styles.alertBox('warning')}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: COLORS.status.warning, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.body,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                  marginBottom: SPACING[1],
                }}>
                  Found {duplicateGroups.length} duplicate phase group(s) with {totalDuplicates} duplicate(s)
                </div>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                }}>
                  Select which phases to remove. By default, the first occurrence of each phase is kept and duplicates are selected for removal.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.alertBox('success')}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
              <CheckCircle style={{ width: '20px', height: '20px', color: COLORS.status.success, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.body,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                  marginBottom: SPACING[1],
                }}>
                  No duplicates found
                </div>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                }}>
                  Your project has no duplicate phases. Everything looks good!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Groups */}
        {duplicateGroups.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING[4],
            maxHeight: '384px',
            overflowY: 'auto',
          }}>
            {duplicateGroups.map((group, groupIndex) => (
              <div key={groupIndex} style={styles.groupCard}>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.body,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                  marginBottom: SPACING[3],
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.status.warning }} />
                  Duplicate: "{group.phaseName}"
                  <span style={{
                    fontSize: '11px',
                    color: COLORS.text.tertiary,
                    fontWeight: TYPOGRAPHY.fontWeight.normal,
                  }}>
                    ({group.phases.length} occurrences)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {group.phases.map((phase, index) => (
                    <div key={phase.id} style={styles.listItem(selectedPhaseIds.has(phase.id))}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
                        <input
                          type="checkbox"
                          checked={selectedPhaseIds.has(phase.id)}
                          onChange={() => handleTogglePhase(phase.id)}
                          style={styles.checkbox}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[1] }}>
                            {index === 0 && (
                              <span style={styles.badge('original')}>
                                Original
                              </span>
                            )}
                            {index > 0 && (
                              <span style={styles.badge('duplicate')}>
                                Duplicate #{index}
                              </span>
                            )}
                            <span style={{
                              fontFamily: TYPOGRAPHY.fontFamily.text,
                              fontSize: TYPOGRAPHY.fontSize.caption,
                              fontWeight: TYPOGRAPHY.fontWeight.semibold,
                              color: COLORS.text.primary,
                            }}>
                              {phase.name}
                            </span>
                          </div>
                          <div style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: '11px',
                            color: COLORS.text.tertiary,
                          }}>
                            {phase.taskCount} task(s) · {phase.startDate} → {phase.endDate}
                          </div>
                        </div>
                      </div>
                      {selectedPhaseIds.has(phase.id) ? (
                        <XCircle style={{ width: '20px', height: '20px', color: COLORS.red }} />
                      ) : (
                        <CheckCircle style={{ width: '20px', height: '20px', color: COLORS.status.success }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No duplicates state */}
        {duplicateGroups.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: `${SPACING[8]} 0`,
          }}>
            <CheckCircle style={{
              width: '64px',
              height: '64px',
              color: COLORS.bg.subtle,
              margin: '0 auto',
              marginBottom: SPACING[4],
            }} />
            <p style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
              margin: 0,
            }}>
              No duplicate phases found
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
