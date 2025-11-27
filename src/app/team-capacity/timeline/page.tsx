"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
}

interface Allocation {
  id: string;
  memberId: string;
  startWeek: number;
  endWeek: number;
  project: string;
  color: string;
}

const members: TeamMember[] = [
  { id: 'm1', name: 'Sarah Chen', role: 'Project Director', team: 'Leadership' },
  { id: 'm2', name: 'Michael Ross', role: 'Project Manager', team: 'Leadership' },
  { id: 'm3', name: 'Anna Schmidt', role: 'FI Consultant', team: 'Functional' },
  { id: 'm4', name: 'David Kim', role: 'MM Consultant', team: 'Functional' },
  { id: 'm5', name: 'Elena Popov', role: 'SD Consultant', team: 'Functional' },
  { id: 'm6', name: 'James Lee', role: 'ABAP Developer', team: 'Technical' },
  { id: 'm7', name: 'Maria Garcia', role: 'Basis Admin', team: 'Technical' },
  { id: 'm8', name: 'Tom Wilson', role: 'QA Lead', team: 'QA' },
];

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function TimelineGanttPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { id: 'a1', memberId: 'm1', startWeek: 1, endWeek: 44, project: 'SAP Implementation', color: '#3B82F6' },
    { id: 'a2', memberId: 'm2', startWeek: 1, endWeek: 44, project: 'SAP Implementation', color: '#3B82F6' },
    { id: 'a3', memberId: 'm3', startWeek: 9, endWeek: 36, project: 'FI Module', color: '#10B981' },
    { id: 'a4', memberId: 'm4', startWeek: 9, endWeek: 28, project: 'MM Module', color: '#F59E0B' },
    { id: 'a5', memberId: 'm5', startWeek: 9, endWeek: 28, project: 'SD Module', color: '#EF4444' },
    { id: 'a6', memberId: 'm6', startWeek: 15, endWeek: 40, project: 'Development', color: '#8B5CF6' },
    { id: 'a7', memberId: 'm7', startWeek: 1, endWeek: 44, project: 'Infrastructure', color: '#EC4899' },
    { id: 'a8', memberId: 'm8', startWeek: 25, endWeek: 36, project: 'QA & Testing', color: '#14B8A6' },
  ]);

  const [draggingBar, setDraggingBar] = useState<{ id: string; side: 'start' | 'end' | 'move' } | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const WEEK_WIDTH = 60;
  const TOTAL_WEEKS = 52;

  const handleMouseDown = (e: React.MouseEvent, allocationId: string, side: 'start' | 'end' | 'move') => {
    e.preventDefault();
    setDraggingBar({ id: allocationId, side });
    setDragStartX(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingBar || !timelineRef.current) return;

    const delta = e.clientX - dragStartX;
    const weekDelta = Math.round(delta / WEEK_WIDTH);

    setAllocations(prev => prev.map(alloc => {
      if (alloc.id !== draggingBar.id) return alloc;

      if (draggingBar.side === 'start') {
        const newStart = Math.max(1, Math.min(alloc.endWeek - 1, alloc.startWeek + weekDelta));
        return { ...alloc, startWeek: newStart };
      } else if (draggingBar.side === 'end') {
        const newEnd = Math.max(alloc.startWeek + 1, Math.min(TOTAL_WEEKS, alloc.endWeek + weekDelta));
        return { ...alloc, endWeek: newEnd };
      } else {
        const duration = alloc.endWeek - alloc.startWeek;
        const newStart = Math.max(1, Math.min(TOTAL_WEEKS - duration, alloc.startWeek + weekDelta));
        return { ...alloc, startWeek: newStart, endWeek: newStart + duration };
      }
    }));

    setDragStartX(e.clientX);
  }, [draggingBar, dragStartX]);

  const handleMouseUp = () => {
    setDraggingBar(null);
  };

  const getMemberAllocations = (memberId: string) => {
    return allocations.filter(a => a.memberId === memberId);
  };

  const detectOverlaps = (memberId: string) => {
    const memberAllocs = getMemberAllocations(memberId);
    const overlaps = [];
    for (let i = 0; i < memberAllocs.length; i++) {
      for (let j = i + 1; j < memberAllocs.length; j++) {
        const a1 = memberAllocs[i];
        const a2 = memberAllocs[j];
        if (a1.startWeek <= a2.endWeek && a2.startWeek <= a1.endWeek) {
          overlaps.push([a1.id, a2.id]);
        }
      }
    }
    return overlaps;
  };

  const overlaps = useMemo(() => {
    const allOverlaps: Record<string, string[]> = {};
    members.forEach(m => {
      const memberOverlaps = detectOverlaps(m.id);
      memberOverlaps.forEach(([id1, id2]) => {
        allOverlaps[id1] = allOverlaps[id1] || [];
        allOverlaps[id2] = allOverlaps[id2] || [];
        allOverlaps[id1].push(id2);
        allOverlaps[id2].push(id1);
      });
    });
    return allOverlaps;
  }, [allocations]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
      }}>
        <Link
          href="/team-capacity/options"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            color: '#111827',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '24px',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <ArrowLeft size={16} />
          Back to Options
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
          }}>
            Gantt Timeline View
          </h1>
          <p style={{
            fontSize: '17px',
            color: '#6B7280',
            margin: 0,
          }}>
            Drag to resize allocations • Snap to week boundaries • Overlap detection
          </p>
        </div>

        {Object.keys(overlaps).length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            border: '1px solid #FCD34D',
          }}>
            <AlertCircle size={18} color="#D97706" />
            <span style={{ fontSize: '14px', color: '#92400E', fontWeight: 500 }}>
              {Object.keys(overlaps).length} allocation(s) have overlapping assignments
            </span>
          </div>
        )}

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'auto',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ overflowX: 'auto' }} ref={timelineRef}>
            <div style={{ minWidth: '1400px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <div style={{
                  width: '200px',
                  padding: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  flexShrink: 0,
                  borderRight: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}>
                  Team Member
                </div>
                <div style={{
                  display: 'flex',
                  flex: 1,
                }}>
                  {Array.from({ length: Math.ceil(TOTAL_WEEKS / 4) }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: WEEK_WIDTH * 4,
                        padding: '12px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6B7280',
                        borderRight: '1px solid #E5E7EB',
                        textAlign: 'center',
                        backgroundColor: '#F9FAFB',
                      }}
                    >
                      Q{Math.floor(i / 13) + 1} W{i * 4 + 1}-{Math.min(i * 4 + 4, TOTAL_WEEKS)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid #E5E7EB',
                    minHeight: '80px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: '200px',
                    padding: '16px',
                    flexShrink: 0,
                    borderRight: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '2px',
                    }}>
                      {member.role}
                    </div>
                  </div>

                  <div style={{
                    position: 'relative',
                    width: WEEK_WIDTH * TOTAL_WEEKS,
                    height: '48px',
                    backgroundColor: '#F9FAFB',
                  }}>
                    {/* Grid lines */}
                    {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: i * WEEK_WIDTH,
                          top: 0,
                          width: '1px',
                          height: '100%',
                          backgroundColor: i % 4 === 0 ? '#D1D5DB' : '#F3F4F6',
                        }}
                      />
                    ))}

                    {/* Allocations */}
                    {getMemberAllocations(member.id).map(alloc => (
                      <div
                        key={alloc.id}
                        style={{
                          position: 'absolute',
                          left: (alloc.startWeek - 1) * WEEK_WIDTH + 2,
                          top: '8px',
                          width: Math.max(30, (alloc.endWeek - alloc.startWeek) * WEEK_WIDTH - 4),
                          height: '32px',
                          backgroundColor: alloc.color,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          cursor: 'move',
                          border: overlaps[alloc.id] ? '2px solid #FCD34D' : 'none',
                          opacity: draggingBar?.id === alloc.id ? 0.9 : 1,
                          transition: draggingBar ? 'none' : 'all 0.2s ease',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingX: '8px',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, alloc.id, 'move')}
                        title={`${alloc.project} (W${alloc.startWeek}-W${alloc.endWeek})`}
                      >
                        {alloc.project}
                      </div>
                    ))}

                    {/* Resize handles */}
                    {getMemberAllocations(member.id).map(alloc => (
                      <div key={`handles-${alloc.id}`}>
                        {/* Start handle */}
                        <div
                          style={{
                            position: 'absolute',
                            left: (alloc.startWeek - 1) * WEEK_WIDTH,
                            top: '12px',
                            width: '8px',
                            height: '24px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '2px',
                            cursor: 'col-resize',
                            border: '1px solid ' + alloc.color,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, alloc.id, 'start')}
                        />
                        {/* End handle */}
                        <div
                          style={{
                            position: 'absolute',
                            left: alloc.endWeek * WEEK_WIDTH - 8,
                            top: '12px',
                            width: '8px',
                            height: '24px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '2px',
                            cursor: 'col-resize',
                            border: '1px solid ' + alloc.color,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, alloc.id, 'end')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            marginBottom: '12px',
          }}>
            Instructions
          </h3>
          <ul style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.8',
          }}>
            <li>Click and drag allocation bars to move them</li>
            <li>Use the edge handles to resize allocations</li>
            <li>All periods snap to week boundaries</li>
            <li>Yellow border indicates overlapping assignments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
