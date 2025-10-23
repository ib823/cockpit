/**
 * Duplicate Phase Cleanup Modal
 *
 * Detects and removes duplicate phases in the current project
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Checkbox, Alert, List, Typography, Empty, App } from 'antd';
import { AlertTriangle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';

const { Text, Title } = Typography;

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

export function DuplicateCleanupModal({ isOpen, onClose }: DuplicateCleanupModalProps) {
  const { currentProject } = useGanttToolStoreV2();
  const { message, modal } = App.useApp();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  // Detect duplicates when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      detectDuplicates();
    }
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

    for (const [normalizedName, phases] of phasesByName.entries()) {
      if (phases.length > 1) {
        duplicates.push({
          phaseName: phases[0].name, // Use original name
          phases: phases.map(p => ({
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
    duplicates.forEach(group => {
      // Skip the first phase in each group (keep it), select the rest for deletion
      group.phases.slice(1).forEach(phase => {
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

    modal.confirm({
      title: 'Remove Duplicate Phases?',
      content: `This will permanently delete ${selectedPhaseIds.size} duplicate phase(s) and all their tasks. This action cannot be undone.`,
      okText: 'Remove Duplicates',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsRemoving(true);

        try {
          // Filter out selected phases
          const remainingPhases = currentProject.phases.filter(
            phase => !selectedPhaseIds.has(phase.id)
          );

          // Update project via API
          const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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

          message.success(`Successfully removed ${selectedPhaseIds.size} duplicate phase(s)!`);
          onClose();
        } catch (error) {
          console.error('[DuplicateCleanup] Failed to remove duplicates:', error);
          message.error('Failed to remove duplicates. Please try again.');
        } finally {
          setIsRemoving(false);
        }
      },
    });
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.phases.length - 1, 0);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <span>Duplicate Phase Cleanup</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      afterClose={() => {
        // PERMANENT FIX: Force cleanup of modal side effects
        if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
        if (document.body.style.paddingRight) document.body.style.paddingRight = '';
        document.body.style.pointerEvents = '';
      }}
      destroyOnHidden={true}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="remove"
          type="primary"
          danger
          icon={<Trash2 className="w-4 h-4" />}
          onClick={handleRemoveDuplicates}
          disabled={selectedPhaseIds.size === 0 || isRemoving}
          loading={isRemoving}
        >
          Remove {selectedPhaseIds.size > 0 ? `${selectedPhaseIds.size} ` : ''}Selected
        </Button>,
      ]}
      width={700}
    >
      <div className="space-y-4">
        {/* Summary */}
        {duplicateGroups.length > 0 ? (
          <Alert
            message={`Found ${duplicateGroups.length} duplicate phase group(s) with ${totalDuplicates} duplicate(s)`}
            description="Select which phases to remove. By default, the first occurrence of each phase is kept and duplicates are selected for removal."
            type="warning"
            showIcon
            icon={<AlertTriangle className="w-4 h-4" />}
          />
        ) : (
          <Alert
            message="No duplicates found"
            description="Your project has no duplicate phases. Everything looks good!"
            type="success"
            showIcon
            icon={<CheckCircle className="w-4 h-4" />}
          />
        )}

        {/* Duplicate Groups */}
        {duplicateGroups.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {duplicateGroups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">⚠️</span>
                  Duplicate: &quot;{group.phaseName}&quot;
                  <span className="text-xs text-gray-500 font-normal">
                    ({group.phases.length} occurrences)
                  </span>
                </div>

                <List
                  size="small"
                  dataSource={group.phases}
                  renderItem={(phase, index) => (
                    <List.Item
                      className={`${
                        selectedPhaseIds.has(phase.id)
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white'
                      } border rounded mb-2 px-3 transition-colors`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedPhaseIds.has(phase.id)}
                            onChange={() => handleTogglePhase(phase.id)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                                  Original
                                </span>
                              )}
                              {index > 0 && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                                  Duplicate #{index}
                                </span>
                              )}
                              <Text strong>{phase.name}</Text>
                            </div>
                            <Text type="secondary" className="text-xs">
                              {phase.taskCount} task(s) · {phase.startDate} → {phase.endDate}
                            </Text>
                          </div>
                        </div>
                        {selectedPhaseIds.has(phase.id) ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {/* No duplicates state */}
        {duplicateGroups.length === 0 && (
          <Empty
            description="No duplicate phases found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Modal>
  );
}
