"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, GripVertical } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
}

interface WeekCard {
  weekId: string;
  weekLabel: string;
  members: { id: string; capacity: number }[];
}

const members: TeamMember[] = [
  { id: 'm1', name: 'Sarah Chen', role: 'Project Director', avatar: 'SC', skills: ['Leadership', 'Strategy'] },
  { id: 'm2', name: 'Michael Ross', role: 'PM', avatar: 'MR', skills: ['Planning', 'Coordination'] },
  { id: 'm3', name: 'Anna Schmidt', role: 'FI Consultant', avatar: 'AS', skills: ['SAP FI', 'Finance'] },
  { id: 'm4', name: 'David Kim', role: 'MM Consultant', avatar: 'DK', skills: ['SAP MM'] },
  { id: 'm5', name: 'Elena Popov', role: 'SD Consultant', avatar: 'EP', skills: ['SAP SD'] },
  { id: 'm6', name: 'James Lee', role: 'ABAP Dev', avatar: 'JL', skills: ['ABAP', 'Dev'] },
];

export default function TimelineCardsPage() {
  const [weeks, setWeeks] = useState<WeekCard[]>([
    { weekId: 'W1', weekLabel: 'Week 1 • Jan 1-7', members: [{ id: 'm2', capacity: 100 }] },
    { weekId: 'W2', weekLabel: 'Week 2 • Jan 8-14', members: [{ id: 'm2', capacity: 100 }, { id: 'm1', capacity: 40 }] },
    { weekId: 'W3', weekLabel: 'Week 3 • Jan 15-21', members: [{ id: 'm1', capacity: 100 }, { id: 'm2', capacity: 100 }, { id: 'm3', capacity: 60 }] },
    { weekId: 'W4', weekLabel: 'Week 4 • Jan 22-28', members: [{ id: 'm1', capacity: 100 }, { id: 'm2', capacity: 100 }, { id: 'm3', capacity: 100 }] },
  ]);

  const [draggedMember, setDraggedMember] = useState<string | null>(null);

  const availableMembers = useMemo(() => {
    const allocatedIds = new Set(weeks.flatMap(w => w.members.map(m => m.id)));
    return members.filter(m => !allocatedIds.has(m.id));
  }, [weeks]);

  const getMember = (id: string) => members.find(m => m.id === id);

  const handleDragStart = (memberId: string) => {
    setDraggedMember(memberId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (weekId: string) => {
    if (!draggedMember) return;

    setWeeks(prev => prev.map(week => {
      if (week.weekId === weekId) {
        if (week.members.some(m => m.id === draggedMember)) return week;
        return {
          ...week,
          members: [...week.members, { id: draggedMember, capacity: 100 }],
        };
      }
      return week;
    }));

    setDraggedMember(null);
  };

  const removeMember = (weekId: string, memberId: string) => {
    setWeeks(prev => prev.map(week => {
      if (week.weekId === weekId) {
        return {
          ...week,
          members: week.members.filter(m => m.id !== memberId),
        };
      }
      return week;
    }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
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
          Choose Different View
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <Calendar size={14} color="#D97706" />
            <span style={{ fontSize: '13px', color: '#92400E', fontWeight: 600 }}>
              TIMELINE CARDS
            </span>
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
          }}>
            Story-Driven Planning
          </h1>
          <p style={{
            fontSize: '17px',
            color: '#6B7280',
            margin: 0,
          }}>
            Drag member cards into week slots • Visual capacity tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            width: '280px',
            flexShrink: 0,
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <Users size={18} color="#6B7280" />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                }}>
                  Available Team
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {availableMembers.map(member => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={() => handleDragStart(member.id)}
                    style={{
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '12px',
                      border: '2px dashed #D1D5DB',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.cursor = 'grabbing';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.cursor = 'grab';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                    }}>
                      <GripVertical size={16} color="#9CA3AF" />
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}>
                        {member.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#111827',
                        }}>
                          {member.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                        }}>
                          {member.role}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      marginLeft: '28px',
                    }}>
                      {member.skills.map(skill => (
                        <span
                          key={skill}
                          style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            backgroundColor: '#DBEAFE',
                            color: '#1E40AF',
                            fontWeight: 500,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {availableMembers.length === 0 && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    fontSize: '14px',
                  }}>
                    All members allocated
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              paddingBottom: '24px',
            }}>
              {weeks.map(week => (
                <div
                  key={week.weekId}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(week.weekId)}
                  style={{
                    width: '320px',
                    flexShrink: 0,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '2px solid #E5E7EB',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #F3F4F6',
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '4px',
                    }}>
                      {week.weekId}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6B7280',
                    }}>
                      {week.weekLabel}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#9CA3AF',
                    }}>
                      {week.members.length} {week.members.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    minHeight: '200px',
                  }}>
                    {week.members.map(allocation => {
                      const member = getMember(allocation.id);
                      if (!member) return null;

                      return (
                        <div
                          key={allocation.id}
                          style={{
                            padding: '16px',
                            backgroundColor: '#F9FAFB',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            position: 'relative',
                          }}
                        >
                          <button
                            onClick={() => removeMember(week.weekId, allocation.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ×
                          </button>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px',
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: '#3B82F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}>
                              {member.avatar}
                            </div>
                            <div style={{ flex: 1, paddingRight: '24px' }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#111827',
                              }}>
                                {member.name}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: '#6B7280',
                              }}>
                                {member.role}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            marginBottom: '8px',
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                              fontSize: '12px',
                            }}>
                              <span style={{ color: '#6B7280' }}>Capacity</span>
                              <span style={{ fontWeight: 600, color: '#111827' }}>{allocation.capacity}%</span>
                            </div>
                            <div style={{
                              height: '6px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${allocation.capacity}%`,
                                backgroundColor: allocation.capacity === 100 ? '#10B981' : allocation.capacity >= 80 ? '#3B82F6' : '#F59E0B',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap',
                          }}>
                            {member.skills.slice(0, 2).map(skill => (
                              <span
                                key={skill}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  borderRadius: '4px',
                                  backgroundColor: '#DBEAFE',
                                  color: '#1E40AF',
                                  fontWeight: 500,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {week.members.length === 0 && (
                      <div style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: '#D1D5DB',
                        fontSize: '14px',
                        border: '2px dashed #E5E7EB',
                        borderRadius: '12px',
                        minHeight: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        Drop members here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
