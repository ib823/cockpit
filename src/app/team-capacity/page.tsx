"use client";

/**
 * Team Capacity Planner
 *
 * Design Philosophy (Jobs/Ive):
 * - "Simplicity is the ultimate sophistication"
 * - Remove everything unnecessary until only the essential remains
 * - Make the complex feel effortless
 *
 * UX Principles:
 * 1. Direct manipulation - click to edit, no modals
 * 2. Visual feedback - instant response to every action
 * 3. Smart defaults - anticipate user needs
 * 4. Progressive disclosure - show complexity only when needed
 * 5. Responsive - works beautifully on any device
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Users,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart3,
  Download,
  Share2,
  Sparkles
} from "lucide-react";

// Types
interface TeamMember {
  id: string;
  name: string;
  designation: string;
  skillsets: string[];
  email: string;
  teamId: string;
  color: string; // For visual identity
}

interface Team {
  id: string;
  name: string;
  collapsed: boolean;
}

interface WeekAllocation {
  memberid: string;
  weekId: string;
  mandays: number; // 0-5 (0 = not allocated, 5 = full-time)
  notes?: string;
}

interface ProjectTimeline {
  startDate: Date;
  weeks: number;
}

// Helper: Generate week IDs
const generateWeekIds = (startDate: Date, weeks: number): string[] => {
  const weekIds: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    weekIds.push(`W${i + 1}`);
  }
  return weekIds;
};

// Helper: Format week label
const formatWeekLabel = (weekId: string, startDate: Date): string => {
  const weekNum = parseInt(weekId.slice(1));
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
  const month = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const day = weekStart.getDate();
  return `${weekId}\n${month} ${day}`;
};

// Design tokens
const TOKENS = {
  colors: {
    capacity: {
      0: '#F9FAFB', // Empty
      1: '#E0F2FE', // 20%
      2: '#BAE6FD', // 40%
      3: '#7DD3FC', // 60%
      4: '#38BDF8', // 80%
      5: '#0EA5E9', // 100% (Full-time)
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
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
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default function TeamCapacityPage() {
  // State
  const [teams, setTeams] = useState<Team[]>([
    { id: 't1', name: 'Leadership', collapsed: false },
    { id: 't2', name: 'Functional Consultants', collapsed: false },
    { id: 't3', name: 'Technical Team', collapsed: false },
    { id: 't4', name: 'Quality Assurance', collapsed: true },
  ]);

  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', name: 'Sarah Chen', designation: 'Project Director', skillsets: ['Leadership', 'Strategy'], email: 's.chen@example.com', teamId: 't1', color: '#7E22CE' },
    { id: 'm2', name: 'Michael Ross', designation: 'Project Manager', skillsets: ['Planning', 'Coordination'], email: 'm.ross@example.com', teamId: 't1', color: '#7E22CE' },
    { id: 'm3', name: 'Anna Schmidt', designation: 'Senior FI Consultant', skillsets: ['SAP FI', 'Finance'], email: 'a.schmidt@example.com', teamId: 't2', color: '#2563EB' },
    { id: 'm4', name: 'David Kim', designation: 'MM Consultant', skillsets: ['SAP MM', 'Procurement'], email: 'd.kim@example.com', teamId: 't2', color: '#2563EB' },
    { id: 'm5', name: 'Elena Popov', designation: 'SD Consultant', skillsets: ['SAP SD', 'Sales'], email: 'e.popov@example.com', teamId: 't2', color: '#2563EB' },
    { id: 'm6', name: 'James Lee', designation: 'ABAP Developer', skillsets: ['ABAP', 'Development'], email: 'j.lee@example.com', teamId: 't3', color: '#2563EB' },
    { id: 'm7', name: 'Maria Garcia', designation: 'Basis Administrator', skillsets: ['Basis', 'Infrastructure'], email: 'm.garcia@example.com', teamId: 't3', color: '#2563EB' },
    { id: 'm8', name: 'Tom Wilson', designation: 'QA Lead', skillsets: ['Testing', 'Quality'], email: 't.wilson@example.com', teamId: 't4', color: '#6B7280' },
  ]);

  const [timeline] = useState<ProjectTimeline>({
    startDate: new Date('2025-01-06'), // Week starts Monday
    weeks: 24, // 6 months
  });

  const [allocations, setAllocations] = useState<WeekAllocation[]>([
    // Sample data - Leadership team working full-time for first 12 weeks
    ...Array.from({ length: 12 }, (_, i) => ({
      memberid: 'm1',
      weekId: `W${i + 1}`,
      mandays: i < 4 ? 2 : 5, // Part-time first month, then full-time
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      memberid: 'm2',
      weekId: `W${i + 1}`,
      mandays: 5, // Full-time throughout
    })),
    // Functional consultants ramp up from week 3
    ...Array.from({ length: 16 }, (_, i) => ({
      memberid: 'm3',
      weekId: `W${i + 3}`,
      mandays: i < 2 ? 3 : 5,
    })),
    ...Array.from({ length: 14 }, (_, i) => ({
      memberid: 'm4',
      weekId: `W${i + 5}`,
      mandays: 4,
    })),
  ]);

  const [selectedCell, setSelectedCell] = useState<{ memberId: string; weekId: string } | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'heatmap'>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [editMode, setEditMode] = useState<'single' | 'range'>('single');
  const [rangeStart, setRangeStart] = useState<{ memberId: string; weekId: string } | null>(null);
  const [collaborators] = useState([
    { id: 'u1', name: 'Alex Chen', color: '#10B981', activeCell: { memberId: 'm3', weekId: 'W8' } },
    { id: 'u2', name: 'Sam Taylor', color: '#F59E0B', activeCell: { memberId: 'm5', weekId: 'W12' } },
  ]);

  const weekIds = useMemo(() => generateWeekIds(timeline.startDate, timeline.weeks), [timeline]);

  // Get allocation for specific cell
  const getAllocation = useCallback((memberId: string, weekId: string): number => {
    const allocation = allocations.find(a => a.memberid === memberId && a.weekId === weekId);
    return allocation?.mandays || 0;
  }, [allocations]);

  // Update allocation
  const updateAllocation = useCallback((memberId: string, weekId: string, mandays: number) => {
    setAllocations(prev => {
      const existingIndex = prev.findIndex(a => a.memberid === memberId && a.weekId === weekId);
      if (existingIndex >= 0) {
        if (mandays === 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], mandays };
        return updated;
      } else if (mandays > 0) {
        return [...prev, { memberid: memberId, weekId, mandays }];
      }
      return prev;
    });
  }, []);

  // Smart auto-fill
  const autoFillRange = useCallback((startWeekId: string, endWeekId: string, memberId: string, value: number) => {
    const startIndex = weekIds.indexOf(startWeekId);
    const endIndex = weekIds.indexOf(endWeekId);

    for (let i = startIndex; i <= endIndex; i++) {
      updateAllocation(memberId, weekIds[i], value);
    }
  }, [weekIds, updateAllocation]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      // Arrow navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentWeekIndex = weekIds.indexOf(selectedCell.weekId);
        const currentMember = members.find(m => m.id === selectedCell.memberId);
        if (!currentMember) return;

        if (e.key === 'ArrowRight' && currentWeekIndex < weekIds.length - 1) {
          setSelectedCell({ ...selectedCell, weekId: weekIds[currentWeekIndex + 1] });
        } else if (e.key === 'ArrowLeft' && currentWeekIndex > 0) {
          setSelectedCell({ ...selectedCell, weekId: weekIds[currentWeekIndex - 1] });
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const currentMemberIndex = members.findIndex(m => m.id === selectedCell.memberId);
          if (e.key === 'ArrowDown' && currentMemberIndex < members.length - 1) {
            setSelectedCell({ memberId: members[currentMemberIndex + 1].id, weekId: selectedCell.weekId });
          } else if (e.key === 'ArrowUp' && currentMemberIndex > 0) {
            setSelectedCell({ memberId: members[currentMemberIndex - 1].id, weekId: selectedCell.weekId });
          }
        }
      }

      // Number input (0-5)
      if (['0', '1', '2', '3', '4', '5'].includes(e.key)) {
        const value = parseInt(e.key);
        updateAllocation(selectedCell.memberId, selectedCell.weekId, value);
      }

      // Delete/Backspace to clear
      if (e.key === 'Delete' || e.key === 'Backspace') {
        updateAllocation(selectedCell.memberId, selectedCell.weekId, 0);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedCell(null);
      }

      // Cmd+C to copy
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const mandays = getAllocation(selectedCell.memberId, selectedCell.weekId);
        navigator.clipboard.writeText(String(mandays));
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedCell, weekIds, members, getAllocation, updateAllocation]);

  // Smart Insights
  const insights = useMemo(() => {
    const totalCapacity = members.length * timeline.weeks * 5; // Max possible mandays
    const allocatedMandays = allocations.reduce((sum, a) => sum + a.mandays, 0);
    const utilization = (allocatedMandays / totalCapacity) * 100;

    // Find over-allocated members (>5 mandays in any week)
    const overAllocations: { member: TeamMember; week: string; mandays: number }[] = [];
    members.forEach(member => {
      weekIds.forEach(weekId => {
        const mandays = getAllocation(member.id, weekId);
        if (mandays > 5) {
          overAllocations.push({ member, week: weekId, mandays });
        }
      });
    });

    // Find under-utilized members (<50% average allocation)
    const underUtilized: { member: TeamMember; avgUtilization: number }[] = [];
    members.forEach(member => {
      const memberAllocations = allocations.filter(a => a.memberid === member.id);
      const totalMandays = memberAllocations.reduce((sum, a) => sum + a.mandays, 0);
      const avgUtilization = (totalMandays / (timeline.weeks * 5)) * 100;
      if (avgUtilization < 50 && avgUtilization > 0) {
        underUtilized.push({ member, avgUtilization });
      }
    });

    // Find gaps (weeks with no allocations)
    const gapWeeks = weekIds.filter(weekId => {
      return !allocations.some(a => a.weekId === weekId);
    });

    // Calculate cost (assuming avg daily rate)
    const avgDailyRate = 1000; // EUR
    const totalCost = allocatedMandays * avgDailyRate;

    return {
      totalCapacity,
      allocatedMandays,
      utilization: Math.round(utilization),
      overAllocations,
      underUtilized,
      gapWeeks,
      totalCost,
      teamCount: teams.length,
      memberCount: members.length,
    };
  }, [members, timeline, allocations, weekIds, getAllocation]);

  // Toggle team collapse
  const toggleTeam = (teamId: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, collapsed: !t.collapsed } : t));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: TOKENS.typography.fontFamily,
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${TOKENS.colors.border}`,
        padding: `${TOKENS.spacing.xl} ${TOKENS.spacing.xxl}`,
        backgroundColor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Title */}
          <div>
            <h1 style={{
              fontSize: TOKENS.typography.fontSize.xxl,
              fontWeight: TOKENS.typography.fontWeight.bold,
              color: TOKENS.colors.text.primary,
              margin: 0,
              marginBottom: TOKENS.spacing.xs,
            }}>
              Team Capacity
            </h1>
            <p style={{
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.secondary,
              margin: 0,
            }}>
              {insights.memberCount} members • {timeline.weeks} weeks • {insights.utilization}% utilized
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: TOKENS.spacing.md, alignItems: 'center' }}>
            <a
              href="/team-capacity/options"
              style={{
                padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                borderRadius: TOKENS.radius.md,
                border: `2px solid #7C3AED`,
                backgroundColor: '#FFFFFF',
                color: '#7C3AED',
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
                textDecoration: 'none',
                transition: TOKENS.transitions.fast,
              }}
            >
              <Sparkles size={16} />
              See Better Options
            </a>
            <button
              onClick={() => setShowInsights(!showInsights)}
              style={{
                padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${TOKENS.colors.border}`,
                backgroundColor: showInsights ? '#F3F4F6' : '#FFFFFF',
                color: TOKENS.colors.text.primary,
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
                transition: TOKENS.transitions.fast,
              }}
            >
              Insights
            </button>
            <button
              style={{
                padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${TOKENS.colors.border}`,
                backgroundColor: '#FFFFFF',
                color: TOKENS.colors.text.primary,
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
              }}
            >
              <Download size={16} />
              Export
            </button>
            <button
              style={{
                padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
                borderRadius: TOKENS.radius.md,
                border: 'none',
                backgroundColor: '#0EA5E9',
                color: '#FFFFFF',
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
              }}
            >
              <Plus size={16} />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: TOKENS.spacing.xxl,
        display: 'flex',
        gap: TOKENS.spacing.xl,
      }}>
        {/* Capacity Grid */}
        <div style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${TOKENS.colors.border}`,
          overflow: 'hidden',
        }}>
          {/* Timeline Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '280px repeat(auto-fit, minmax(60px, 1fr))',
            borderBottom: `1px solid ${TOKENS.colors.border}`,
            position: 'sticky',
            top: 0,
            backgroundColor: '#F9FAFB',
            zIndex: 10,
          }}>
            <div style={{
              padding: TOKENS.spacing.lg,
              fontWeight: TOKENS.typography.fontWeight.semibold,
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.secondary,
              borderRight: `1px solid ${TOKENS.colors.border}`,
            }}>
              Team Member
            </div>
            {weekIds.map(weekId => (
              <div
                key={weekId}
                style={{
                  padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xs}`,
                  fontSize: TOKENS.typography.fontSize.xs,
                  fontWeight: TOKENS.typography.fontWeight.medium,
                  color: TOKENS.colors.text.secondary,
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.3',
                  borderRight: `1px solid ${TOKENS.colors.border}`,
                }}
              >
                {formatWeekLabel(weekId, timeline.startDate)}
              </div>
            ))}
          </div>

          {/* Team Rows */}
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {teams.map(team => {
              const teamMembers = members.filter(m => m.teamId === team.id);
              if (teamMembers.length === 0) return null;

              return (
                <div key={team.id}>
                  {/* Team Header */}
                  <div
                    onClick={() => toggleTeam(team.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '280px repeat(auto-fit, minmax(60px, 1fr))',
                      backgroundColor: '#F3F4F6',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${TOKENS.colors.border}`,
                    }}
                  >
                    <div style={{
                      padding: TOKENS.spacing.md,
                      display: 'flex',
                      alignItems: 'center',
                      gap: TOKENS.spacing.sm,
                      fontWeight: TOKENS.typography.fontWeight.semibold,
                      fontSize: TOKENS.typography.fontSize.sm,
                      color: TOKENS.colors.text.primary,
                      borderRight: `1px solid ${TOKENS.colors.border}`,
                    }}>
                      {team.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      <Users size={16} />
                      {team.name}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: TOKENS.typography.fontSize.xs,
                        color: TOKENS.colors.text.tertiary,
                      }}>
                        {teamMembers.length}
                      </span>
                    </div>
                  </div>

                  {/* Team Members */}
                  {!team.collapsed && teamMembers.map(member => (
                    <div
                      key={member.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '280px repeat(auto-fit, minmax(60px, 1fr))',
                        borderBottom: `1px solid ${TOKENS.colors.border}`,
                      }}
                    >
                      {/* Member Info */}
                      <div style={{
                        padding: TOKENS.spacing.lg,
                        borderRight: `1px solid ${TOKENS.colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: TOKENS.spacing.xs,
                      }}>
                        <div style={{
                          fontSize: TOKENS.typography.fontSize.md,
                          fontWeight: TOKENS.typography.fontWeight.medium,
                          color: TOKENS.colors.text.primary,
                        }}>
                          {member.name}
                        </div>
                        <div style={{
                          fontSize: TOKENS.typography.fontSize.xs,
                          color: TOKENS.colors.text.secondary,
                        }}>
                          {member.designation}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          flexWrap: 'wrap',
                          marginTop: '2px',
                        }}>
                          {member.skillsets.slice(0, 2).map(skill => (
                            <span
                              key={skill}
                              style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                backgroundColor: '#E0F2FE',
                                color: '#0369A1',
                                fontWeight: TOKENS.typography.fontWeight.medium,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Allocation Cells */}
                      {weekIds.map(weekId => {
                        const mandays = getAllocation(member.id, weekId);
                        const isSelected = selectedCell?.memberId === member.id && selectedCell?.weekId === weekId;
                        const isRangeStart = rangeStart?.memberId === member.id && rangeStart?.weekId === weekId;

                        // Check if any collaborator is editing this cell
                        const activeCollaborator = collaborators.find(
                          c => c.activeCell.memberId === member.id && c.activeCell.weekId === weekId
                        );

                        return (
                          <div
                            key={weekId}
                            onClick={(e) => {
                              if (e.shiftKey && selectedCell && selectedCell.memberId === member.id) {
                                // Range selection
                                const startIdx = weekIds.indexOf(selectedCell.weekId);
                                const endIdx = weekIds.indexOf(weekId);
                                const value = getAllocation(member.id, selectedCell.weekId);
                                autoFillRange(
                                  weekIds[Math.min(startIdx, endIdx)],
                                  weekIds[Math.max(startIdx, endIdx)],
                                  member.id,
                                  value
                                );
                              } else {
                                setSelectedCell({ memberId: member.id, weekId });
                              }
                            }}
                            onMouseDown={(e) => {
                              if (e.metaKey || e.ctrlKey) {
                                setRangeStart({ memberId: member.id, weekId });
                              }
                            }}
                            style={{
                              padding: TOKENS.spacing.sm,
                              backgroundColor: TOKENS.colors.capacity[mandays as keyof typeof TOKENS.colors.capacity] || TOKENS.colors.capacity[0],
                              borderRight: `1px solid ${TOKENS.colors.border}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: TOKENS.typography.fontSize.md,
                              fontWeight: TOKENS.typography.fontWeight.semibold,
                              color: mandays >= 4 ? '#FFFFFF' : TOKENS.colors.text.primary,
                              transition: TOKENS.transitions.fast,
                              position: 'relative',
                              outline: isSelected ? `2px solid #0EA5E9` : isRangeStart ? `2px dashed #0EA5E9` : 'none',
                              outlineOffset: '-2px',
                              boxShadow: activeCollaborator ? `inset 0 0 0 2px ${activeCollaborator.color}` : 'none',
                            }}
                          >
                            {mandays > 0 ? mandays : ''}

                            {/* Collaborator indicator */}
                            {activeCollaborator && (
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: activeCollaborator.color,
                                boxShadow: '0 0 0 2px white',
                              }} />
                            )}

                            {isSelected && !isMobile && (
                              <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.5"
                                value={mandays}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (!isNaN(value) && value >= 0 && value <= 5) {
                                    updateAllocation(member.id, weekId, value);
                                  }
                                }}
                                onBlur={() => setSelectedCell(null)}
                                autoFocus
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  textAlign: 'center',
                                  fontSize: TOKENS.typography.fontSize.md,
                                  fontWeight: TOKENS.typography.fontWeight.semibold,
                                  color: TOKENS.colors.text.primary,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Quick Edit Panel */}
        {isMobile && selectedCell && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: `1px solid ${TOKENS.colors.border}`,
            padding: TOKENS.spacing.xl,
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            animation: 'slideUp 0.2s ease',
          }}>
            {(() => {
              const member = members.find(m => m.id === selectedCell.memberId);
              const mandays = getAllocation(selectedCell.memberId, selectedCell.weekId);
              if (!member) return null;

              return (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: TOKENS.spacing.lg,
                  }}>
                    <div>
                      <div style={{
                        fontSize: TOKENS.typography.fontSize.md,
                        fontWeight: TOKENS.typography.fontWeight.semibold,
                        color: TOKENS.colors.text.primary,
                      }}>
                        {member.name}
                      </div>
                      <div style={{
                        fontSize: TOKENS.typography.fontSize.xs,
                        color: TOKENS.colors.text.secondary,
                      }}>
                        {selectedCell.weekId}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCell(null)}
                      style={{
                        padding: TOKENS.spacing.sm,
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: TOKENS.typography.fontSize.xl,
                        color: TOKENS.colors.text.tertiary,
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Capacity buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: TOKENS.spacing.sm,
                  }}>
                    {[0, 1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        onClick={() => {
                          updateAllocation(selectedCell.memberId, selectedCell.weekId, value);
                          setSelectedCell(null);
                        }}
                        style={{
                          padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.sm}`,
                          borderRadius: TOKENS.radius.md,
                          border: `2px solid ${mandays === value ? '#0EA5E9' : TOKENS.colors.border}`,
                          backgroundColor: TOKENS.colors.capacity[value as keyof typeof TOKENS.colors.capacity],
                          fontSize: TOKENS.typography.fontSize.lg,
                          fontWeight: TOKENS.typography.fontWeight.bold,
                          color: value >= 4 ? '#FFFFFF' : TOKENS.colors.text.primary,
                          cursor: 'pointer',
                          transition: TOKENS.transitions.fast,
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Insights Panel */}
        {showInsights && !isMobile && (
          <div style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: TOKENS.spacing.lg,
          }}>
            {/* Utilization Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.colors.border}`,
              padding: TOKENS.spacing.xl,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
                marginBottom: TOKENS.spacing.lg,
              }}>
                <TrendingUp size={20} color={TOKENS.colors.success} />
                <h3 style={{
                  fontSize: TOKENS.typography.fontSize.lg,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  color: TOKENS.colors.text.primary,
                  margin: 0,
                }}>
                  Utilization
                </h3>
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: TOKENS.typography.fontWeight.bold,
                color: TOKENS.colors.text.primary,
                marginBottom: TOKENS.spacing.sm,
              }}>
                {insights.utilization}%
              </div>
              <div style={{
                fontSize: TOKENS.typography.fontSize.sm,
                color: TOKENS.colors.text.secondary,
                marginBottom: TOKENS.spacing.lg,
              }}>
                {insights.allocatedMandays.toLocaleString()} of {insights.totalCapacity.toLocaleString()} mandays allocated
              </div>
              {/* Progress Bar */}
              <div style={{
                height: '8px',
                backgroundColor: '#F3F4F6',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(insights.utilization, 100)}%`,
                  height: '100%',
                  backgroundColor: insights.utilization > 80 ? TOKENS.colors.success : insights.utilization > 50 ? TOKENS.colors.warning : TOKENS.colors.danger,
                  transition: TOKENS.transitions.medium,
                }} />
              </div>
            </div>

            {/* Cost Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.colors.border}`,
              padding: TOKENS.spacing.xl,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.sm,
                marginBottom: TOKENS.spacing.lg,
              }}>
                <BarChart3 size={20} color="#0EA5E9" />
                <h3 style={{
                  fontSize: TOKENS.typography.fontSize.lg,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  color: TOKENS.colors.text.primary,
                  margin: 0,
                }}>
                  Estimated Cost
                </h3>
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: TOKENS.typography.fontWeight.bold,
                color: TOKENS.colors.text.primary,
                marginBottom: TOKENS.spacing.xs,
              }}>
                €{(insights.totalCost / 1000).toFixed(0)}k
              </div>
              <div style={{
                fontSize: TOKENS.typography.fontSize.sm,
                color: TOKENS.colors.text.secondary,
              }}>
                Based on {insights.allocatedMandays} mandays @ €1k/day
              </div>
            </div>

            {/* Alerts Card */}
            {(insights.overAllocations.length > 0 || insights.underUtilized.length > 0) && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.colors.border}`,
                padding: TOKENS.spacing.xl,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing.sm,
                  marginBottom: TOKENS.spacing.lg,
                }}>
                  <AlertCircle size={20} color={TOKENS.colors.warning} />
                  <h3 style={{
                    fontSize: TOKENS.typography.fontSize.lg,
                    fontWeight: TOKENS.typography.fontWeight.semibold,
                    color: TOKENS.colors.text.primary,
                    margin: 0,
                  }}>
                    Alerts
                  </h3>
                </div>

                {/* Over-allocations */}
                {insights.overAllocations.length > 0 && (
                  <div style={{ marginBottom: TOKENS.spacing.lg }}>
                    <div style={{
                      fontSize: TOKENS.typography.fontSize.sm,
                      fontWeight: TOKENS.typography.fontWeight.medium,
                      color: TOKENS.colors.danger,
                      marginBottom: TOKENS.spacing.sm,
                    }}>
                      Over-allocated ({insights.overAllocations.length})
                    </div>
                    {insights.overAllocations.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: TOKENS.typography.fontSize.xs,
                          color: TOKENS.colors.text.secondary,
                          marginBottom: '4px',
                        }}
                      >
                        {item.member.name} • {item.week} ({item.mandays}d)
                      </div>
                    ))}
                  </div>
                )}

                {/* Under-utilized */}
                {insights.underUtilized.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: TOKENS.typography.fontSize.sm,
                      fontWeight: TOKENS.typography.fontWeight.medium,
                      color: TOKENS.colors.warning,
                      marginBottom: TOKENS.spacing.sm,
                    }}>
                      Under-utilized ({insights.underUtilized.length})
                    </div>
                    {insights.underUtilized.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: TOKENS.typography.fontSize.xs,
                          color: TOKENS.colors.text.secondary,
                          marginBottom: '4px',
                        }}
                      >
                        {item.member.name} ({Math.round(item.avgUtilization)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.colors.border}`,
              padding: TOKENS.spacing.xl,
            }}>
              <div style={{
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                color: TOKENS.colors.text.primary,
                marginBottom: TOKENS.spacing.md,
              }}>
                Capacity Scale
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.sm }}>
                {[
                  { value: 5, label: 'Full-time (5 days)' },
                  { value: 4, label: '80% (4 days)' },
                  { value: 3, label: '60% (3 days)' },
                  { value: 2, label: '40% (2 days)' },
                  { value: 1, label: '20% (1 day)' },
                  { value: 0, label: 'Not allocated' },
                ].map(({ value, label }) => (
                  <div key={value} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing.sm }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: TOKENS.colors.capacity[value as keyof typeof TOKENS.colors.capacity],
                      border: `1px solid ${TOKENS.colors.border}`,
                    }} />
                    <div style={{
                      fontSize: TOKENS.typography.fontSize.xs,
                      color: TOKENS.colors.text.secondary,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div style={{
        position: 'fixed',
        bottom: TOKENS.spacing.lg,
        left: TOKENS.spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#FFFFFF',
        padding: `${TOKENS.spacing.md} ${TOKENS.spacing.lg}`,
        borderRadius: TOKENS.radius.md,
        fontSize: TOKENS.typography.fontSize.xs,
        backdropFilter: 'blur(10px)',
        opacity: selectedCell ? 1 : 0,
        pointerEvents: 'none',
        transition: TOKENS.transitions.medium,
        maxWidth: '280px',
      }}>
        <div style={{ fontWeight: TOKENS.typography.fontWeight.semibold, marginBottom: TOKENS.spacing.sm }}>
          Keyboard Shortcuts
        </div>
        <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
          <div>← → ↑ ↓ Navigate</div>
          <div>0-5 Set capacity</div>
          <div>⌫ Clear</div>
          <div>Shift+Click Range fill</div>
          <div>Esc Deselect</div>
        </div>
      </div>

      {/* Collaborator Avatars */}
      {collaborators.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: TOKENS.spacing.lg,
          right: TOKENS.spacing.lg,
          display: 'flex',
          gap: TOKENS.spacing.sm,
          alignItems: 'center',
        }}>
          {collaborators.map(collaborator => (
            <div
              key={collaborator.id}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: collaborator.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: TOKENS.typography.fontSize.sm,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                border: '2px solid white',
              }}
              title={collaborator.name}
            >
              {collaborator.name.split(' ').map(n => n[0]).join('')}
            </div>
          ))}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          /* Mobile optimizations */
          .capacity-grid {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Smooth scrolling */
        * {
          scroll-behavior: smooth;
        }

        /* Hide scrollbar but keep functionality */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
}
