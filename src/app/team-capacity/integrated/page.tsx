"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, Download, Activity, RefreshCw, ChevronDown } from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { format, differenceInWeeks, addWeeks, startOfWeek, parseISO, differenceInDays } from "date-fns";

interface CapacityPhase {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  color: string;
  startDate: Date;
  endDate: Date;
}

interface WeekAllocation {
  memberId: string;
  weekNum: number;
  mandays: number;
}

export default function IntegratedCapacityPage() {
  const { projects, currentProject, fetchProjects, loadProject } = useGanttToolStoreV2();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<WeekAllocation[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ memberId: string; weekNum: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-select current project or first project
  useEffect(() => {
    if (!selectedProjectId) {
      if (currentProject) {
        setSelectedProjectId(currentProject.id);
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, currentProject, selectedProjectId]);

  // Get selected project
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || currentProject;
  }, [projects, selectedProjectId, currentProject]);

  // Calculate timeline from project
  const timeline = useMemo(() => {
    if (!selectedProject || selectedProject.phases.length === 0) {
      return { projectStart: new Date(), totalWeeks: 52, weekStart: new Date() };
    }

    const projectStartDate = parseISO(selectedProject.startDate);
    const weekStart = startOfWeek(projectStartDate, { weekStartsOn: 1 }); // Monday

    // Find last phase end date
    const lastPhaseEndDate = selectedProject.phases.reduce((latest, phase) => {
      const phaseEnd = parseISO(phase.endDate);
      return phaseEnd > latest ? phaseEnd : latest;
    }, parseISO(selectedProject.phases[0].endDate));

    const totalWeeks = Math.ceil(differenceInWeeks(lastPhaseEndDate, weekStart)) + 1;

    return {
      projectStart: projectStartDate,
      weekStart,
      totalWeeks: Math.max(totalWeeks, 52),
    };
  }, [selectedProject]);

  // Convert Gantt phases to capacity phases
  const phases = useMemo((): CapacityPhase[] => {
    if (!selectedProject || selectedProject.phases.length === 0) return [];

    return selectedProject.phases.map((phase, index) => {
      const startDate = parseISO(phase.startDate);
      const endDate = parseISO(phase.endDate);
      const startWeek = Math.ceil(differenceInWeeks(startDate, timeline.weekStart)) + 1;
      const endWeek = Math.ceil(differenceInWeeks(endDate, timeline.weekStart)) + 1;

      // Use phase color or default
      const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
      const color = phase.color || defaultColors[index % defaultColors.length];

      return {
        id: phase.id,
        name: phase.name,
        startWeek: Math.max(1, startWeek),
        endWeek: Math.max(startWeek, endWeek),
        color,
        startDate,
        endDate,
      };
    });
  }, [selectedProject, timeline]);

  // Get team members from project resources
  const teamMembers = useMemo(() => {
    if (!selectedProject || !selectedProject.resources) return [];

    return selectedProject.resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      role: resource.category,
      rank: resource.designation,
    }));
  }, [selectedProject]);

  const getAllocation = useCallback((memberId: string, weekNum: number): number => {
    const allocation = allocations.find(a => a.memberId === memberId && a.weekNum === weekNum);
    return allocation?.mandays || 0;
  }, [allocations]);

  const updateAllocation = useCallback((memberId: string, weekNum: number, mandays: number) => {
    setAllocations(prev => {
      const existingIndex = prev.findIndex(a => a.memberId === memberId && a.weekNum === weekNum);
      if (existingIndex >= 0) {
        if (mandays === 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], mandays };
        return updated;
      } else if (mandays > 0) {
        return [...prev, { memberId, weekNum, mandays }];
      }
      return prev;
    });
  }, []);

  const getPhaseForWeek = useCallback((weekNum: number): CapacityPhase | null => {
    return phases.find(p => weekNum >= p.startWeek && weekNum <= p.endWeek) || null;
  }, [phases]);

  const filteredWeeks = useMemo(() => {
    if (!selectedPhase) return Array.from({ length: timeline.totalWeeks }, (_, i) => i + 1);
    const phase = phases.find(p => p.id === selectedPhase);
    if (!phase) return Array.from({ length: timeline.totalWeeks }, (_, i) => i + 1);
    return Array.from({ length: phase.endWeek - phase.startWeek + 1 }, (_, i) => phase.startWeek + i);
  }, [selectedPhase, timeline.totalWeeks, phases]);

  const getMemberTotal = useCallback((memberId: string): number => {
    const weeks = selectedPhase ? filteredWeeks : Array.from({ length: timeline.totalWeeks }, (_, i) => i + 1);
    return weeks.reduce((sum, week) => sum + getAllocation(memberId, week), 0);
  }, [selectedPhase, filteredWeeks, timeline.totalWeeks, getAllocation]);

  const getWeekTotal = useCallback((weekNum: number): number => {
    return teamMembers.reduce((sum, member) => sum + getAllocation(member.id, weekNum), 0);
  }, [teamMembers, getAllocation]);

  const getWeekLabel = useCallback((weekNum: number): string => {
    const weekDate = addWeeks(timeline.weekStart, weekNum - 1);
    return format(weekDate, 'MMM d');
  }, [timeline]);

  const handleCellClick = (memberId: string, weekNum: number) => {
    const currentValue = getAllocation(memberId, weekNum);
    setEditingCell({ memberId, weekNum });
    setEditValue(currentValue > 0 ? String(currentValue) : '');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = parseFloat(editValue);
      if (!isNaN(value) && value >= 0 && value <= 5) {
        updateAllocation(editingCell.memberId, editingCell.weekNum, value);
      }
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  if (!selectedProject) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '32px' }}>
          <RefreshCw size={48} color="#3B82F6" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>No Project Selected</h2>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            Please create a project in the Gantt Tool first, then return here to plan resources.
          </p>
          <Link
            href="/gantt-tool"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Gantt Tool
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/team-capacity/options"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                color: '#111827',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={16} />
              Options
            </Link>

            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: '#DBEAFE',
                borderRadius: '6px',
                marginBottom: '4px',
              }}>
                <Activity size={12} color="#1E40AF" />
                <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 600 }}>
                  INTEGRATED WITH GANTT
                </span>
              </div>

              {/* Project Selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowProjectSelector(!showProjectSelector)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#111827',
                    cursor: 'pointer',
                  }}
                >
                  {selectedProject.name}
                  <ChevronDown size={16} />
                </button>

                {showProjectSelector && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    minWidth: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1000,
                  }}>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setShowProjectSelector(false);
                          setAllocations([]); // Reset allocations when switching projects
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          border: 'none',
                          backgroundColor: project.id === selectedProjectId ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: project.id === selectedProjectId ? 600 : 400,
                          color: '#111827',
                          borderBottom: '1px solid #F3F4F6',
                        }}
                      >
                        <div>{project.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                          {project.phases.length} phases • {project.resources?.length || 0} resources
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6B7280',
            }}>
              <strong style={{ color: '#111827' }}>{timeline.totalWeeks}</strong> weeks
            </div>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6B7280',
            }}>
              <strong style={{ color: '#111827' }}>{teamMembers.length}</strong> resources
            </div>
            <button style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              color: '#111827',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Phase Filter */}
        {phases.length > 0 && (
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <Filter size={16} color="#6B7280" />
            <button
              onClick={() => setSelectedPhase(null)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: selectedPhase === null ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                backgroundColor: selectedPhase === null ? '#EFF6FF' : '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                color: selectedPhase === null ? '#3B82F6' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              All Phases
            </button>
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(phase.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: selectedPhase === phase.id ? `2px solid ${phase.color}` : '1px solid #E5E7EB',
                  backgroundColor: selectedPhase === phase.id ? `${phase.color}10` : '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: selectedPhase === phase.id ? phase.color : '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: phase.color,
                }} />
                {phase.name}
                <span style={{ opacity: 0.6, fontSize: '11px' }}>
                  W{phase.startWeek}-{phase.endWeek}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#F9FAFB',
          }}>
            <tr>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: 600,
                color: '#6B7280',
                borderBottom: '2px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
                position: 'sticky',
                left: 0,
                backgroundColor: '#F9FAFB',
                zIndex: 11,
                minWidth: '200px',
              }}>
                Resource
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: 600,
                color: '#6B7280',
                borderBottom: '2px solid #E5E7EB',
                borderRight: '2px solid #E5E7EB',
                minWidth: '80px',
              }}>
                Total
              </th>
              {filteredWeeks.map(weekNum => {
                const phase = getPhaseForWeek(weekNum);
                return (
                  <th
                    key={weekNum}
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '11px',
                      color: phase ? phase.color : '#6B7280',
                      borderBottom: `3px solid ${phase?.color || '#E5E7EB'}`,
                      borderRight: '1px solid #E5E7EB',
                      minWidth: '60px',
                      backgroundColor: phase ? `${phase.color}08` : '#F9FAFB',
                    }}
                  >
                    <div>W{weekNum}</div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>
                      {getWeekLabel(weekNum)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {teamMembers.map((member, idx) => (
              <tr key={member.id} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#111827',
                  borderBottom: '1px solid #E5E7EB',
                  borderRight: '1px solid #E5E7EB',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  zIndex: 1,
                }}>
                  <div>{member.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{member.rank}</div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#111827',
                  borderBottom: '1px solid #E5E7EB',
                  borderRight: '2px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}>
                  {getMemberTotal(member.id).toFixed(1)}
                </td>
                {filteredWeeks.map(weekNum => {
                  const mandays = getAllocation(member.id, weekNum);
                  const isEditing = editingCell?.memberId === member.id && editingCell?.weekNum === weekNum;
                  const phase = getPhaseForWeek(weekNum);

                  return (
                    <td
                      key={weekNum}
                      onClick={() => !isEditing && handleCellClick(member.id, weekNum)}
                      style={{
                        padding: 0,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: mandays >= 5 ? '#FFFFFF' : '#111827',
                        borderBottom: '1px solid #E5E7EB',
                        borderRight: '1px solid #E5E7EB',
                        cursor: 'pointer',
                        backgroundColor: mandays === 0
                          ? 'transparent'
                          : mandays === 5
                          ? phase?.color || '#10B981'
                          : `${phase?.color || '#3B82F6'}${Math.round(mandays * 51).toString(16).padStart(2, '0')}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          style={{
                            width: '100%',
                            height: '36px',
                            border: '2px solid #3B82F6',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <div style={{ padding: '10px 8px', minHeight: '36px' }}>
                          {mandays > 0 ? mandays.toFixed(1) : ''}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Totals */}
            <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 700 }}>
              <td style={{
                padding: '12px 16px',
                borderTop: '2px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
                position: 'sticky',
                left: 0,
                backgroundColor: '#F3F4F6',
                zIndex: 1,
              }}>
                Total Mandays
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'center',
                borderTop: '2px solid #E5E7EB',
                borderRight: '2px solid #E5E7EB',
                fontSize: '16px',
              }}>
                {filteredWeeks.reduce((sum, week) => sum + getWeekTotal(week), 0).toFixed(1)}
              </td>
              {filteredWeeks.map(weekNum => (
                <td
                  key={weekNum}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderTop: '2px solid #E5E7EB',
                    borderRight: '1px solid #E5E7EB',
                    color: '#111827',
                  }}
                >
                  {getWeekTotal(weekNum).toFixed(1)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Phase Legend */}
      {phases.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '12px',
          }}>
            Project Phases from Gantt
          </div>
          {phases.map(phase => (
            <div
              key={phase.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: phase.color,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '2px',
                }}>
                  {phase.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                }}>
                  W{phase.startWeek}-{phase.endWeek} ({format(phase.startDate, 'MMM d')} - {format(phase.endDate, 'MMM d')})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
