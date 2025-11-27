"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Users, TrendingUp } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
}

interface WeekAllocation {
  memberId: string;
  weekId: string;
  capacity: number;
}

const members: TeamMember[] = [
  { id: 'm1', name: 'Sarah Chen', role: 'Project Director', team: 'Leadership' },
  { id: 'm2', name: 'Michael Ross', role: 'Project Manager', team: 'Leadership' },
  { id: 'm3', name: 'Anna Schmidt', role: 'Senior FI Consultant', team: 'Functional' },
  { id: 'm4', name: 'David Kim', role: 'MM Consultant', team: 'Functional' },
  { id: 'm5', name: 'Elena Popov', role: 'SD Consultant', team: 'Functional' },
  { id: 'm6', name: 'James Lee', role: 'ABAP Developer', team: 'Technical' },
  { id: 'm7', name: 'Maria Garcia', role: 'Basis Admin', team: 'Technical' },
  { id: 'm8', name: 'Tom Wilson', role: 'QA Lead', team: 'QA' },
];

const generateWeekIds = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `W${i + 1}`);
};

const getHeatmapColor = (capacity: number): string => {
  if (capacity === 0) return 'rgba(249, 250, 251, 0.6)';
  const intensity = capacity / 100;
  const hue = 200;
  const lightness = 95 - (intensity * 45);
  const saturation = 70 + (intensity * 20);
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + intensity * 0.6})`;
};

const getTextColor = (capacity: number): string => {
  return capacity > 60 ? '#FFFFFF' : '#111827';
};

export default function HeatmapCapacityPage() {
  const weekIds = useMemo(() => generateWeekIds(24), []);
  const [allocations, setAllocations] = useState<WeekAllocation[]>([
    { memberId: 'm1', weekId: 'W1', capacity: 40 },
    { memberId: 'm1', weekId: 'W2', capacity: 40 },
    { memberId: 'm1', weekId: 'W3', capacity: 40 },
    { memberId: 'm1', weekId: 'W4', capacity: 40 },
    { memberId: 'm1', weekId: 'W5', capacity: 100 },
    { memberId: 'm1', weekId: 'W6', capacity: 100 },
    { memberId: 'm1', weekId: 'W7', capacity: 100 },
    { memberId: 'm1', weekId: 'W8', capacity: 100 },
    { memberId: 'm2', weekId: 'W1', capacity: 100 },
    { memberId: 'm2', weekId: 'W2', capacity: 100 },
    { memberId: 'm2', weekId: 'W3', capacity: 100 },
    { memberId: 'm2', weekId: 'W4', capacity: 100 },
    { memberId: 'm2', weekId: 'W5', capacity: 100 },
    { memberId: 'm2', weekId: 'W6', capacity: 100 },
    { memberId: 'm2', weekId: 'W7', capacity: 100 },
    { memberId: 'm2', weekId: 'W8', capacity: 100 },
    { memberId: 'm3', weekId: 'W3', capacity: 60 },
    { memberId: 'm3', weekId: 'W4', capacity: 60 },
    { memberId: 'm3', weekId: 'W5', capacity: 100 },
    { memberId: 'm3', weekId: 'W6', capacity: 100 },
    { memberId: 'm3', weekId: 'W7', capacity: 100 },
    { memberId: 'm3', weekId: 'W8', capacity: 100 },
  ]);

  const [hoveredCell, setHoveredCell] = useState<{ memberId: string; weekId: string } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ memberId: string; weekId: string } | null>(null);

  const getCapacity = useCallback((memberId: string, weekId: string): number => {
    const allocation = allocations.find(a => a.memberId === memberId && a.weekId === weekId);
    return allocation?.capacity || 0;
  }, [allocations]);

  const updateCapacity = useCallback((memberId: string, weekId: string, capacity: number) => {
    setAllocations(prev => {
      const existingIndex = prev.findIndex(a => a.memberId === memberId && a.weekId === weekId);
      if (existingIndex >= 0) {
        if (capacity === 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], capacity };
        return updated;
      } else if (capacity > 0) {
        return [...prev, { memberId, weekId, capacity }];
      }
      return prev;
    });
  }, []);

  const insights = useMemo(() => {
    const totalCapacity = members.length * weekIds.length * 100;
    const allocated = allocations.reduce((sum, a) => sum + a.capacity, 0);
    const utilization = Math.round((allocated / totalCapacity) * 100);

    const teamCapacity: Record<string, number> = {};
    members.forEach(m => {
      if (!teamCapacity[m.team]) teamCapacity[m.team] = 0;
      const memberAllocs = allocations.filter(a => a.memberId === m.id);
      teamCapacity[m.team] += memberAllocs.reduce((sum, a) => sum + a.capacity, 0);
    });

    return { utilization, teamCapacity, totalAllocated: allocated };
  }, [allocations, weekIds, members]);

  const teams = useMemo(() => {
    return Array.from(new Set(members.map(m => m.team)));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '32px',
        position: 'relative',
        zIndex: 1,
      }}>
        <Link
          href="/team-capacity/options"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '24px',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={16} />
          Choose Different View
        </Link>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          gap: '24px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <Zap size={14} color="#FFD700" />
              <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600 }}>
                HEATMAP VISION
              </span>
            </div>
            <h1 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              marginBottom: '8px',
              letterSpacing: '-0.5px',
            }}>
              Team Capacity
            </h1>
            <p style={{
              fontSize: '17px',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
            }}>
              Continuous gradient visualization
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
          }}>
            <div style={{
              padding: '20px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '160px',
            }}>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
                fontWeight: 500,
              }}>
                Overall Utilization
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}>
                {insights.utilization}%
              </div>
            </div>

            <div style={{
              padding: '20px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '160px',
            }}>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
                fontWeight: 500,
              }}>
                Total Allocated
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}>
                {insights.totalAllocated}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.65)',
              }}>
                capacity units
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '220px repeat(24, 1fr)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{
              padding: '16px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.85)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              Team Member
            </div>
            {weekIds.map(weekId => (
              <div
                key={weekId}
                style={{
                  padding: '16px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.75)',
                  textAlign: 'center',
                  borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {weekId}
              </div>
            ))}
          </div>

          {teams.map(team => (
            <div key={team}>
              <div style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Users size={14} color="rgba(255, 255, 255, 0.75)" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}>
                  {team}
                </span>
              </div>

              {members.filter(m => m.team === team).map(member => (
                <div
                  key={member.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px repeat(24, 1fr)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{
                    padding: '16px 20px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      marginBottom: '2px',
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.65)',
                    }}>
                      {member.role}
                    </div>
                  </div>

                  {weekIds.map(weekId => {
                    const capacity = getCapacity(member.id, weekId);
                    const isHovered = hoveredCell?.memberId === member.id && hoveredCell?.weekId === weekId;
                    const isSelected = selectedCell?.memberId === member.id && selectedCell?.weekId === weekId;

                    return (
                      <div
                        key={weekId}
                        onClick={() => {
                          const newCapacity = prompt(`Set capacity for ${member.name} in ${weekId} (0-100):`, String(capacity));
                          if (newCapacity !== null) {
                            const value = parseInt(newCapacity);
                            if (!isNaN(value) && value >= 0 && value <= 100) {
                              updateCapacity(member.id, weekId, value);
                            }
                          }
                        }}
                        onMouseEnter={() => setHoveredCell({ memberId: member.id, weekId })}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          padding: '16px 8px',
                          backgroundColor: getHeatmapColor(capacity),
                          backdropFilter: capacity > 0 ? 'blur(10px)' : 'none',
                          WebkitBackdropFilter: capacity > 0 ? 'blur(10px)' : 'none',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isHovered ? 'scale(1.08)' : isSelected ? 'scale(1.05)' : 'scale(1)',
                          zIndex: isHovered ? 10 : isSelected ? 5 : 1,
                          position: 'relative',
                          boxShadow: isHovered
                            ? '0 8px 24px rgba(0, 0, 0, 0.25)'
                            : isSelected
                            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                            : 'none',
                        }}
                      >
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: getTextColor(capacity),
                          textAlign: 'center',
                          textShadow: capacity > 60 ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none',
                        }}>
                          {capacity > 0 ? `${capacity}%` : ''}
                        </div>

                        {isHovered && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                            zIndex: 100,
                            pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                          }}>
                            {member.name} • {weekId}
                            <br />
                            <strong>{capacity}%</strong> capacity
                            {capacity > 0 && <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px' }}>Click to edit</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#FFFFFF',
        }}>
          <TrendingUp size={20} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              Gradient Heatmap Legend
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '13px',
              opacity: 0.85,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: getHeatmapColor(0), borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                0% (Empty)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: getHeatmapColor(25), borderRadius: '4px' }} />
                25%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: getHeatmapColor(50), borderRadius: '4px' }} />
                50%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: getHeatmapColor(75), borderRadius: '4px' }} />
                75%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: getHeatmapColor(100), borderRadius: '4px' }} />
                100% (Full)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
