"use client";

/**
 * Team Capacity Tab - Integrated Resource Effort Planning
 *
 * Design Philosophy (Jobs/Ive):
 * - "Simplicity is the ultimate sophistication"
 * - Direct manipulation - click to edit, no modals for common actions
 * - Visual feedback - instant response to every action
 * - Progressive disclosure - show complexity only when needed
 *
 * This component integrates with the Gantt Tool to provide
 * weekly effort allocation for project resources.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight, AlertCircle, Users, TrendingUp, Calendar, Info, Loader2, Check, CloudOff } from "lucide-react";
import type { GanttProject, Resource, ResourceCategory, ResourceWeeklyAllocation } from "@/types/gantt-tool";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { differenceInWeeks, addWeeks, startOfWeek, format, parseISO } from "date-fns";

// Design tokens - Apple HIG compliant
const TOKENS = {
  colors: {
    capacity: {
      0: '#F9FAFB',   // Empty - lightest gray
      1: '#DBEAFE',   // 1 day - very light blue
      2: '#BFDBFE',   // 2 days - light blue
      3: '#93C5FD',   // 3 days - medium blue
      4: '#60A5FA',   // 4 days - blue
      5: '#3B82F6',   // 5 days (full) - strong blue
    } as Record<number, string>,
    text: {
      primary: '#1D1D1F',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      onBlue: '#FFFFFF',
    },
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    blue: '#007AFF',
    purple: '#AF52DE',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
  typography: {
    fontFamily: 'var(--font-text), -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '15px',
      lg: '17px',
      xl: '20px',
      xxl: '28px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

// Category display names and colors
const CATEGORY_CONFIG: Record<ResourceCategory, { label: string; color: string }> = {
  leadership: { label: 'Leadership', color: '#7C3AED' },
  functional: { label: 'Functional Consultants', color: '#2563EB' },
  technical: { label: 'Technical Team', color: '#059669' },
  basis: { label: 'Basis & Infrastructure', color: '#0891B2' },
  security: { label: 'Security', color: '#DC2626' },
  pm: { label: 'Project Management', color: '#7C3AED' },
  change: { label: 'Change Management', color: '#D97706' },
  qa: { label: 'Quality Assurance', color: '#6B7280' },
  other: { label: 'Other Resources', color: '#9CA3AF' },
};

// Designation display names
const DESIGNATION_LABELS: Record<string, string> = {
  principal: 'Principal',
  director: 'Director',
  senior_manager: 'Senior Manager',
  manager: 'Manager',
  senior_consultant: 'Senior Consultant',
  consultant: 'Consultant',
  analyst: 'Analyst',
  subcontractor: 'Subcontractor',
};

interface TeamCapacityTabProps {
  project: GanttProject;
}

interface WeekData {
  weekId: string;
  weekNumber: number;
  startDate: Date;
  label: string;
  monthLabel: string;
}

interface LocalAllocation {
  resourceId: string;
  weekId: string;
  mandays: number;
}

export function TeamCapacityTab({ project }: TeamCapacityTabProps) {
  // Local state for allocations (will sync with API)
  const [allocations, setAllocations] = useState<LocalAllocation[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ resourceId: string; weekId: string } | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ResourceCategory>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAllocationsRef = useRef<LocalAllocation[]>([]);

  // Get resources from project
  const resources = project.resources || [];

  // Load allocations from API on mount
  useEffect(() => {
    const loadAllocations = async () => {
      if (!project.id) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/gantt-tool/team-capacity/allocations?projectId=${project.id}`);
        if (response.ok) {
          const data = await response.json();
          // Convert API allocations to local format
          const localAllocations: LocalAllocation[] = (data.allocations || []).map((a: any) => ({
            resourceId: a.resourceId,
            weekId: `W${Math.ceil((new Date(a.weekStartDate).getTime() - timeline.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`,
            mandays: a.mandays || (a.allocationPercent * 5 / 100),
          }));
          setAllocations(localAllocations);
        }
      } catch (error) {
        console.error('[TeamCapacity] Failed to load allocations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllocations();
  }, [project.id]);

  // Save allocations to API (debounced)
  const saveAllocations = useCallback(async (allocsToSave: LocalAllocation[]) => {
    if (!project.id || allocsToSave.length === 0) return;

    setSaveStatus('saving');
    setIsSaving(true);

    try {
      // Convert local allocations to API format
      const apiAllocations = allocsToSave.map(a => {
        const weekNum = parseInt(a.weekId.replace('W', ''));
        const weekStart = addWeeks(timeline.startDate, weekNum - 1);
        return {
          resourceId: a.resourceId,
          weekStartDate: format(weekStart, 'yyyy-MM-dd'),
          mandays: a.mandays,
        };
      });

      const response = await fetch('/api/gantt-tool/team-capacity/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          allocations: apiAllocations,
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        console.error('[TeamCapacity] Failed to save allocations:', await response.text());
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('[TeamCapacity] Failed to save allocations:', error);
    } finally {
      setIsSaving(false);
    }
  }, [project.id]);

  // Debounced save trigger
  const triggerSave = useCallback((newAllocations: LocalAllocation[]) => {
    pendingAllocationsRef.current = newAllocations;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveAllocations(pendingAllocationsRef.current);
    }, 1000); // Save 1 second after last change
  }, [saveAllocations]);

  // Calculate timeline based on project phases
  const timeline = useMemo(() => {
    if (!project.phases || project.phases.length === 0) {
      // Default: 12 weeks from today
      const today = new Date();
      return {
        startDate: startOfWeek(today, { weekStartsOn: 1 }),
        weeks: 12,
      };
    }

    // Find earliest phase start and latest phase end
    let earliestStart = new Date(project.phases[0].startDate);
    let latestEnd = new Date(project.phases[0].endDate);

    project.phases.forEach(phase => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      if (phaseStart < earliestStart) earliestStart = phaseStart;
      if (phaseEnd > latestEnd) latestEnd = phaseEnd;

      // Check tasks too
      phase.tasks?.forEach(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        if (taskStart < earliestStart) earliestStart = taskStart;
        if (taskEnd > latestEnd) latestEnd = taskEnd;
      });
    });

    // Round to week boundaries
    const weekStart = startOfWeek(earliestStart, { weekStartsOn: 1 });
    const totalWeeks = Math.max(12, differenceInWeeks(latestEnd, weekStart) + 2);

    return {
      startDate: weekStart,
      weeks: Math.min(totalWeeks, 52), // Cap at 52 weeks
    };
  }, [project.phases]);

  // Generate week data
  const weeks: WeekData[] = useMemo(() => {
    const result: WeekData[] = [];
    for (let i = 0; i < timeline.weeks; i++) {
      const weekStart = addWeeks(timeline.startDate, i);
      result.push({
        weekId: `W${i + 1}`,
        weekNumber: i + 1,
        startDate: weekStart,
        label: `W${i + 1}`,
        monthLabel: format(weekStart, 'MMM'),
      });
    }
    return result;
  }, [timeline]);

  // Group resources by category
  const resourcesByCategory = useMemo(() => {
    const grouped = new Map<ResourceCategory, Resource[]>();

    // Initialize all categories
    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      grouped.set(cat as ResourceCategory, []);
    });

    // Group resources
    resources.forEach(resource => {
      const category = resource.category || 'other';
      const existing = grouped.get(category) || [];
      grouped.set(category, [...existing, resource]);
    });

    // Filter out empty categories
    const result: Array<{ category: ResourceCategory; resources: Resource[] }> = [];
    grouped.forEach((resources, category) => {
      if (resources.length > 0) {
        result.push({ category, resources });
      }
    });

    return result;
  }, [resources]);

  // Get allocation for a cell
  const getAllocation = useCallback((resourceId: string, weekId: string): number => {
    const allocation = allocations.find(a => a.resourceId === resourceId && a.weekId === weekId);
    return allocation?.mandays || 0;
  }, [allocations]);

  // Update allocation
  const updateAllocation = useCallback((resourceId: string, weekId: string, mandays: number) => {
    setAllocations(prev => {
      let newAllocations: LocalAllocation[];
      const existingIndex = prev.findIndex(a => a.resourceId === resourceId && a.weekId === weekId);
      if (existingIndex >= 0) {
        if (mandays === 0) {
          newAllocations = prev.filter((_, i) => i !== existingIndex);
        } else {
          newAllocations = [...prev];
          newAllocations[existingIndex] = { ...newAllocations[existingIndex], mandays };
        }
      } else if (mandays > 0) {
        newAllocations = [...prev, { resourceId, weekId, mandays }];
      } else {
        newAllocations = prev;
      }

      // Trigger debounced save
      triggerSave(newAllocations);
      return newAllocations;
    });
  }, [triggerSave]);

  // Toggle category collapse
  const toggleCategory = useCallback((category: ResourceCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const allResources = resourcesByCategory.flatMap(g => g.resources);
      const currentResourceIndex = allResources.findIndex(r => r.id === selectedCell.resourceId);
      const currentWeekIndex = weeks.findIndex(w => w.weekId === selectedCell.weekId);

      // Arrow navigation
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();

        if (e.key === 'ArrowRight' && currentWeekIndex < weeks.length - 1) {
          setSelectedCell({ ...selectedCell, weekId: weeks[currentWeekIndex + 1].weekId });
        } else if (e.key === 'ArrowLeft' && currentWeekIndex > 0) {
          setSelectedCell({ ...selectedCell, weekId: weeks[currentWeekIndex - 1].weekId });
        } else if (e.key === 'ArrowDown' && currentResourceIndex < allResources.length - 1) {
          setSelectedCell({ resourceId: allResources[currentResourceIndex + 1].id, weekId: selectedCell.weekId });
        } else if (e.key === 'ArrowUp' && currentResourceIndex > 0) {
          setSelectedCell({ resourceId: allResources[currentResourceIndex - 1].id, weekId: selectedCell.weekId });
        }
      }

      // Number input (0-5)
      if (['0', '1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        updateAllocation(selectedCell.resourceId, selectedCell.weekId, parseInt(e.key));
      }

      // Delete/Backspace to clear
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        updateAllocation(selectedCell.resourceId, selectedCell.weekId, 0);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedCell(null);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedCell, weeks, resourcesByCategory, updateAllocation]);

  // Calculate insights
  const insights = useMemo(() => {
    const totalCapacity = resources.length * timeline.weeks * 5;
    const allocatedMandays = allocations.reduce((sum, a) => sum + a.mandays, 0);
    const utilization = totalCapacity > 0 ? (allocatedMandays / totalCapacity) * 100 : 0;

    // Find over-allocated resources
    const overAllocations: Array<{ resource: Resource; week: string; mandays: number }> = [];
    resources.forEach(resource => {
      weeks.forEach(week => {
        const mandays = getAllocation(resource.id, week.weekId);
        if (mandays > 5) {
          overAllocations.push({ resource, week: week.weekId, mandays });
        }
      });
    });

    // Calculate per-resource totals
    const resourceTotals = resources.map(resource => {
      const total = allocations
        .filter(a => a.resourceId === resource.id)
        .reduce((sum, a) => sum + a.mandays, 0);
      return { resource, total, avgPerWeek: total / timeline.weeks };
    });

    return {
      totalCapacity,
      allocatedMandays,
      utilization: Math.round(utilization),
      overAllocations,
      resourceTotals,
      resourceCount: resources.length,
      weekCount: timeline.weeks,
    };
  }, [resources, timeline, allocations, weeks, getAllocation]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        padding: TOKENS.spacing.xxl,
        textAlign: 'center',
      }}>
        <Loader2 size={32} style={{ color: TOKENS.colors.blue, animation: 'spin 1s linear infinite', marginBottom: TOKENS.spacing.lg }} />
        <p style={{
          fontSize: TOKENS.typography.fontSize.md,
          color: TOKENS.colors.text.secondary,
        }}>
          Loading capacity data...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        padding: TOKENS.spacing.xxl,
        textAlign: 'center',
      }}>
        <Users size={48} style={{ color: TOKENS.colors.text.tertiary, marginBottom: TOKENS.spacing.lg }} />
        <h2 style={{
          fontSize: TOKENS.typography.fontSize.xl,
          fontWeight: TOKENS.typography.fontWeight.semibold,
          color: TOKENS.colors.text.primary,
          marginBottom: TOKENS.spacing.sm,
        }}>
          No Resources Yet
        </h2>
        <p style={{
          fontSize: TOKENS.typography.fontSize.md,
          color: TOKENS.colors.text.secondary,
          maxWidth: '400px',
          lineHeight: 1.5,
        }}>
          Add team members to your project using the Resource Panel (click the Users button in the toolbar) to start planning capacity.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#FFFFFF',
      fontFamily: TOKENS.typography.fontFamily,
    }}>
      {/* Header with Summary Stats */}
      <div style={{
        padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.xl}`,
        borderBottom: `1px solid ${TOKENS.colors.border}`,
        backgroundColor: '#FFFFFF',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: TOKENS.spacing.md,
        }}>
          {/* Title */}
          <div>
            <h2 style={{
              fontSize: TOKENS.typography.fontSize.xl,
              fontWeight: TOKENS.typography.fontWeight.bold,
              color: TOKENS.colors.text.primary,
              margin: 0,
              marginBottom: TOKENS.spacing.xs,
            }}>
              Team Capacity
            </h2>
            <p style={{
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.secondary,
              margin: 0,
            }}>
              {insights.resourceCount} resources across {timeline.weeks} weeks
            </p>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: TOKENS.spacing.lg, alignItems: 'center' }}>
            {/* Save Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing.xs,
              padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
              borderRadius: TOKENS.radius.sm,
              backgroundColor: saveStatus === 'error' ? '#FEF2F2' : 'transparent',
              transition: 'all 0.2s ease',
            }}>
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={14} style={{ color: TOKENS.colors.blue, animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: TOKENS.typography.fontSize.xs, color: TOKENS.colors.text.secondary }}>
                    Saving...
                  </span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={14} style={{ color: TOKENS.colors.success }} />
                  <span style={{ fontSize: TOKENS.typography.fontSize.xs, color: TOKENS.colors.success }}>
                    Saved
                  </span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <CloudOff size={14} style={{ color: TOKENS.colors.danger }} />
                  <span style={{ fontSize: TOKENS.typography.fontSize.xs, color: TOKENS.colors.danger }}>
                    Save failed
                  </span>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing.sm,
              padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
              backgroundColor: TOKENS.colors.borderLight,
              borderRadius: TOKENS.radius.md,
            }}>
              <TrendingUp size={16} style={{ color: TOKENS.colors.blue }} />
              <span style={{
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                color: TOKENS.colors.text.primary,
              }}>
                {insights.utilization}% Utilized
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing.sm,
              padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
              backgroundColor: TOKENS.colors.borderLight,
              borderRadius: TOKENS.radius.md,
            }}>
              <Calendar size={16} style={{ color: TOKENS.colors.purple }} />
              <span style={{
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                color: TOKENS.colors.text.primary,
              }}>
                {insights.allocatedMandays} Mandays
              </span>
            </div>

            {insights.overAllocations.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
                padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
                backgroundColor: '#FEF2F2',
                borderRadius: TOKENS.radius.md,
              }}>
                <AlertCircle size={16} style={{ color: TOKENS.colors.danger }} />
                <span style={{
                  fontSize: TOKENS.typography.fontSize.sm,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  color: TOKENS.colors.danger,
                }}>
                  {insights.overAllocations.length} Over-allocated
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div style={{
        padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xl}`,
        borderBottom: `1px solid ${TOKENS.colors.borderLight}`,
        backgroundColor: '#FAFAFA',
        display: 'flex',
        gap: TOKENS.spacing.lg,
        alignItems: 'center',
        fontSize: TOKENS.typography.fontSize.xs,
        color: TOKENS.colors.text.tertiary,
      }}>
        <span><Info size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Click cell to select</span>
        <span>Press 0-5 to set mandays</span>
        <span>Arrow keys to navigate</span>
        <span>Delete to clear</span>
      </div>

      {/* Main Grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: TOKENS.spacing.xl,
      }}>
        <div style={{
          border: `1px solid ${TOKENS.colors.border}`,
          borderRadius: TOKENS.radius.lg,
          overflow: 'hidden',
          minWidth: 'max-content',
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `260px repeat(${weeks.length}, 48px) 80px`,
            borderBottom: `1px solid ${TOKENS.colors.border}`,
            backgroundColor: '#FAFAFA',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            {/* Resource column header */}
            <div style={{
              padding: `${TOKENS.spacing.md} ${TOKENS.spacing.lg}`,
              fontWeight: TOKENS.typography.fontWeight.semibold,
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.primary,
              borderRight: `1px solid ${TOKENS.colors.border}`,
              display: 'flex',
              alignItems: 'center',
            }}>
              Team Member
            </div>

            {/* Week headers */}
            {weeks.map((week, idx) => {
              const showMonth = idx === 0 || weeks[idx - 1]?.monthLabel !== week.monthLabel;
              return (
                <div
                  key={week.weekId}
                  style={{
                    padding: TOKENS.spacing.xs,
                    textAlign: 'center',
                    fontSize: TOKENS.typography.fontSize.xs,
                    color: TOKENS.colors.text.secondary,
                    borderRight: `1px solid ${TOKENS.colors.borderLight}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '48px',
                  }}
                >
                  {showMonth && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: TOKENS.typography.fontWeight.semibold,
                      color: TOKENS.colors.blue,
                      textTransform: 'uppercase',
                    }}>
                      {week.monthLabel}
                    </span>
                  )}
                  <span style={{ fontWeight: TOKENS.typography.fontWeight.medium }}>
                    {week.weekNumber}
                  </span>
                </div>
              );
            })}

            {/* Total column header */}
            <div style={{
              padding: TOKENS.spacing.sm,
              textAlign: 'center',
              fontWeight: TOKENS.typography.fontWeight.semibold,
              fontSize: TOKENS.typography.fontSize.xs,
              color: TOKENS.colors.text.primary,
            }}>
              Total
            </div>
          </div>

          {/* Resource Rows by Category */}
          {resourcesByCategory.map(({ category, resources: categoryResources }) => {
            const isCollapsed = collapsedCategories.has(category);
            const config = CATEGORY_CONFIG[category];
            const categoryTotal = categoryResources.reduce((sum, r) => {
              return sum + allocations
                .filter(a => a.resourceId === r.id)
                .reduce((s, a) => s + a.mandays, 0);
            }, 0);

            return (
              <div key={category}>
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(category)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `260px repeat(${weeks.length}, 48px) 80px`,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    backgroundColor: '#F9FAFB',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: TOKENS.spacing.sm,
                    borderRight: `1px solid ${TOKENS.colors.border}`,
                  }}>
                    {isCollapsed ? (
                      <ChevronRight size={16} style={{ color: TOKENS.colors.text.secondary }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: TOKENS.colors.text.secondary }} />
                    )}
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: config.color,
                    }} />
                    <span style={{
                      fontSize: TOKENS.typography.fontSize.sm,
                      fontWeight: TOKENS.typography.fontWeight.semibold,
                      color: TOKENS.colors.text.primary,
                    }}>
                      {config.label}
                    </span>
                    <span style={{
                      fontSize: TOKENS.typography.fontSize.xs,
                      color: TOKENS.colors.text.tertiary,
                    }}>
                      ({categoryResources.length})
                    </span>
                  </div>

                  {/* Empty week cells for header */}
                  {weeks.map(week => (
                    <div
                      key={week.weekId}
                      style={{
                        borderRight: `1px solid ${TOKENS.colors.borderLight}`,
                      }}
                    />
                  ))}

                  {/* Category total */}
                  <div style={{
                    padding: TOKENS.spacing.sm,
                    textAlign: 'center',
                    fontSize: TOKENS.typography.fontSize.sm,
                    fontWeight: TOKENS.typography.fontWeight.semibold,
                    color: TOKENS.colors.text.primary,
                  }}>
                    {categoryTotal}
                  </div>
                </div>

                {/* Resource Rows */}
                {!isCollapsed && categoryResources.map(resource => {
                  const resourceTotal = allocations
                    .filter(a => a.resourceId === resource.id)
                    .reduce((sum, a) => sum + a.mandays, 0);

                  return (
                    <div
                      key={resource.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `260px repeat(${weeks.length}, 48px) 80px`,
                        borderBottom: `1px solid ${TOKENS.colors.borderLight}`,
                      }}
                    >
                      {/* Resource info */}
                      <div style={{
                        padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                        paddingLeft: TOKENS.spacing.xxl,
                        borderRight: `1px solid ${TOKENS.colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '2px',
                      }}>
                        <span style={{
                          fontSize: TOKENS.typography.fontSize.sm,
                          fontWeight: TOKENS.typography.fontWeight.medium,
                          color: TOKENS.colors.text.primary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {resource.name}
                        </span>
                        <span style={{
                          fontSize: TOKENS.typography.fontSize.xs,
                          color: TOKENS.colors.text.tertiary,
                        }}>
                          {DESIGNATION_LABELS[resource.designation] || resource.designation}
                        </span>
                      </div>

                      {/* Week cells */}
                      {weeks.map(week => {
                        const mandays = getAllocation(resource.id, week.weekId);
                        const isSelected = selectedCell?.resourceId === resource.id && selectedCell?.weekId === week.weekId;
                        const bgColor = TOKENS.colors.capacity[mandays] || TOKENS.colors.capacity[0];
                        const textColor = mandays >= 4 ? TOKENS.colors.text.onBlue : TOKENS.colors.text.primary;

                        return (
                          <div
                            key={week.weekId}
                            onClick={() => setSelectedCell({ resourceId: resource.id, weekId: week.weekId })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: bgColor,
                              borderRight: `1px solid ${TOKENS.colors.borderLight}`,
                              cursor: 'pointer',
                              outline: isSelected ? `2px solid ${TOKENS.colors.blue}` : 'none',
                              outlineOffset: '-2px',
                              transition: 'all 0.1s ease',
                              minHeight: '40px',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.outline = `1px solid ${TOKENS.colors.blue}`;
                                e.currentTarget.style.outlineOffset = '-1px';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.outline = 'none';
                              }
                            }}
                          >
                            {mandays > 0 && (
                              <span style={{
                                fontSize: TOKENS.typography.fontSize.sm,
                                fontWeight: TOKENS.typography.fontWeight.semibold,
                                color: textColor,
                              }}>
                                {mandays}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Resource total */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: resourceTotal > 0 ? '#EEF2FF' : 'transparent',
                      }}>
                        <span style={{
                          fontSize: TOKENS.typography.fontSize.sm,
                          fontWeight: TOKENS.typography.fontWeight.semibold,
                          color: resourceTotal > 0 ? TOKENS.colors.blue : TOKENS.colors.text.tertiary,
                        }}>
                          {resourceTotal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer - Weekly Totals */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `260px repeat(${weeks.length}, 48px) 80px`,
            backgroundColor: '#F9FAFB',
            borderTop: `2px solid ${TOKENS.colors.border}`,
          }}>
            <div style={{
              padding: `${TOKENS.spacing.md} ${TOKENS.spacing.lg}`,
              fontWeight: TOKENS.typography.fontWeight.semibold,
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.primary,
              borderRight: `1px solid ${TOKENS.colors.border}`,
            }}>
              Weekly Total
            </div>

            {weeks.map(week => {
              const weekTotal = resources.reduce((sum, r) => sum + getAllocation(r.id, week.weekId), 0);
              const maxCapacity = resources.length * 5;
              const utilization = maxCapacity > 0 ? (weekTotal / maxCapacity) * 100 : 0;
              const isOverCapacity = utilization > 100;

              return (
                <div
                  key={week.weekId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: `1px solid ${TOKENS.colors.borderLight}`,
                    backgroundColor: isOverCapacity ? '#FEF2F2' : (utilization > 80 ? '#FEF3C7' : 'transparent'),
                  }}
                >
                  <span style={{
                    fontSize: TOKENS.typography.fontSize.xs,
                    fontWeight: TOKENS.typography.fontWeight.semibold,
                    color: isOverCapacity ? TOKENS.colors.danger : (utilization > 80 ? TOKENS.colors.warning : TOKENS.colors.text.secondary),
                  }}>
                    {weekTotal}
                  </span>
                </div>
              );
            })}

            {/* Grand total */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EEF2FF',
            }}>
              <span style={{
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.bold,
                color: TOKENS.colors.blue,
              }}>
                {insights.allocatedMandays}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
