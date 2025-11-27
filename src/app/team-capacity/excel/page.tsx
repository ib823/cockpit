"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, Download, Users, Calendar, Activity } from "lucide-react";

interface ProjectPhase {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  color: string;
  activities: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  rank: string;
}

interface WeekAllocation {
  memberId: string;
  weekNum: number;
  mandays: number;
}

const PHASES: ProjectPhase[] = [
  { id: 'p1', name: 'Discovery & Planning', startWeek: 1, endWeek: 8, color: '#3B82F6', activities: ['Requirements', 'Design', 'Planning'] },
  { id: 'p2', name: 'Build & Configure', startWeek: 9, endWeek: 24, color: '#10B981', activities: ['Development', 'Configuration', 'Integration'] },
  { id: 'p3', name: 'Testing & UAT', startWeek: 25, endWeek: 36, color: '#F59E0B', activities: ['Testing', 'Bug Fixes', 'UAT'] },
  { id: 'p4', name: 'Deployment', startWeek: 37, endWeek: 44, color: '#8B5CF6', activities: ['Data Migration', 'Cutover', 'Go-Live'] },
  { id: 'p5', name: 'Hypercare & Support', startWeek: 45, endWeek: 52, color: '#EF4444', activities: ['Support', 'Stabilization', 'Handover'] },
];

const MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Project Manager', role: 'PM', rank: 'Manager' },
  { id: 'm2', name: 'Lead Consultant', role: 'Functional', rank: 'Senior Consultant' },
  { id: 'm3', name: 'Change Analyst', role: 'Change', rank: 'Senior Consultant' },
  { id: 'm4', name: 'SAP Functional 1', role: 'Functional', rank: 'Senior Consultant' },
  { id: 'm5', name: 'Basis', role: 'Technical', rank: 'Manager' },
  { id: 'm6', name: 'Solution QA (Finance)', role: 'QA', rank: 'Senior Manager' },
  { id: 'm7', name: 'Solution QA (SCM and PM)', role: 'QA', rank: 'Senior Manager' },
  { id: 'm8', name: 'Solution QA (Technical)', role: 'QA', rank: 'Senior Manager' },
  { id: 'm9', name: 'Finance Lead (GL, Banks)', role: 'Functional', rank: 'Manager' },
  { id: 'm10', name: 'SAP Consultant 1 (FI-AP)', role: 'Functional', rank: 'Consultant' },
];

export default function ExcelLikePlannerPage() {
  const TOTAL_WEEKS = 52;
  const [allocations, setAllocations] = useState<WeekAllocation[]>([
    // PM full-time throughout
    ...Array.from({ length: 52 }, (_, i) => ({ memberId: 'm1', weekNum: i + 1, mandays: 5 })),
    // Lead Consultant - ramp up
    ...Array.from({ length: 44 }, (_, i) => ({ memberId: 'm2', weekNum: i + 1, mandays: i < 8 ? 3 : 5 })),
    // Change Analyst - phases 1-3
    ...Array.from({ length: 36 }, (_, i) => ({ memberId: 'm3', weekNum: i + 1, mandays: i < 4 ? 2 : 3 })),
    // SAP Functional - build phase
    ...Array.from({ length: 28 }, (_, i) => ({ memberId: 'm4', weekNum: i + 9, mandays: 5 })),
    // Basis - technical phases
    ...Array.from({ length: 20 }, (_, i) => ({ memberId: 'm5', weekNum: i + 15, mandays: 5 })),
    // QA teams - testing phase
    ...Array.from({ length: 16 }, (_, i) => ({ memberId: 'm6', weekNum: i + 25, mandays: 5 })),
    ...Array.from({ length: 16 }, (_, i) => ({ memberId: 'm7', weekNum: i + 25, mandays: 5 })),
    ...Array.from({ length: 16 }, (_, i) => ({ memberId: 'm8', weekNum: i + 25, mandays: 5 })),
  ]);

  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ memberId: string; weekNum: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  const getPhaseForWeek = (weekNum: number): ProjectPhase | null => {
    return PHASES.find(p => weekNum >= p.startWeek && weekNum <= p.endWeek) || null;
  };

  const filteredWeeks = useMemo(() => {
    if (!selectedPhase) return Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);
    const phase = PHASES.find(p => p.id === selectedPhase);
    if (!phase) return Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);
    return Array.from({ length: phase.endWeek - phase.startWeek + 1 }, (_, i) => phase.startWeek + i);
  }, [selectedPhase]);

  const getMemberTotal = useCallback((memberId: string): number => {
    const weeks = selectedPhase ? filteredWeeks : Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);
    return weeks.reduce((sum, week) => sum + getAllocation(memberId, week), 0);
  }, [selectedPhase, filteredWeeks, getAllocation]);

  const getWeekTotal = useCallback((weekNum: number): number => {
    return MEMBERS.reduce((sum, member) => sum + getAllocation(member.id, weekNum), 0);
  }, [getAllocation]);

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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
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
                  PHASE-BASED PLANNER
                </span>
              </div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
              }}>
                Resource Planning
              </h1>
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
              <strong style={{ color: '#111827' }}>{allocations.length}</strong> allocations
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
              Export to Excel
            </button>
          </div>
        </div>

        {/* Phase Filter */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
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
          {PHASES.map(phase => (
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
              <span style={{ opacity: 0.6, fontSize: '11px' }}>W{phase.startWeek}-{phase.endWeek}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Excel-like Grid */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}>
          {/* Header Row */}
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
                Role
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: 600,
                color: '#6B7280',
                borderBottom: '2px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
                minWidth: '120px',
              }}>
                Rank
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
                      minWidth: '50px',
                      backgroundColor: phase ? `${phase.color}08` : '#F9FAFB',
                    }}
                  >
                    W{weekNum}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {MEMBERS.map((member, memberIndex) => (
              <tr
                key={member.id}
                style={{
                  backgroundColor: memberIndex % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                }}
              >
                <td style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#111827',
                  borderBottom: '1px solid #E5E7EB',
                  borderRight: '1px solid #E5E7EB',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: memberIndex % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  zIndex: 1,
                }}>
                  {member.name}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6B7280',
                  fontSize: '12px',
                  borderBottom: '1px solid #E5E7EB',
                  borderRight: '1px solid #E5E7EB',
                }}>
                  {member.rank}
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
                          : mandays >= 4
                          ? `${phase?.color || '#3B82F6'}CC`
                          : mandays >= 3
                          ? `${phase?.color || '#3B82F6'}99`
                          : mandays >= 2
                          ? `${phase?.color || '#F59E0B'}66`
                          : `${phase?.color || '#F59E0B'}33`,
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
                        <div style={{ padding: '10px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {mandays > 0 ? mandays.toFixed(1) : ''}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Totals Row */}
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
                borderTop: '2px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
              }}>
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
              {filteredWeeks.map(weekNum => {
                const total = getWeekTotal(weekNum);
                return (
                  <td
                    key={weekNum}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      borderTop: '2px solid #E5E7EB',
                      borderRight: '1px solid #E5E7EB',
                      color: total > 40 ? '#10B981' : total > 20 ? '#3B82F6' : '#6B7280',
                    }}
                  >
                    {total.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Phase Legend */}
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
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '12px',
        }}>
          Project Phases
        </div>
        {PHASES.map(phase => (
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
                marginBottom: '4px',
              }}>
                Weeks {phase.startWeek}-{phase.endWeek}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#9CA3AF',
              }}>
                {phase.activities.join(' • ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
