"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, AlertCircle } from "lucide-react";

type CapacityLevel = 'available' | 'partial' | 'full' | 'overallocated';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  capacity: CapacityLevel;
  percentage: number;
}

const CAPACITY_COLUMNS: Record<CapacityLevel, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Available', color: '#10B981', bgColor: '#D1FAE5' },
  partial: { label: 'Partial (20-80%)', color: '#F59E0B', bgColor: '#FEF3C7' },
  full: { label: 'Full (80-100%)', color: '#3B82F6', bgColor: '#DBEAFE' },
  overallocated: { label: 'Over-allocated', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function KanbanCapacityPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', name: 'Sarah Chen', role: 'Project Director', avatar: 'SC', capacity: 'partial', percentage: 40 },
    { id: 'm2', name: 'Michael Ross', role: 'PM', avatar: 'MR', capacity: 'full', percentage: 100 },
    { id: 'm3', name: 'Anna Schmidt', role: 'FI Consultant', avatar: 'AS', capacity: 'full', percentage: 100 },
    { id: 'm4', name: 'David Kim', role: 'MM Consultant', avatar: 'DK', capacity: 'partial', percentage: 80 },
    { id: 'm5', name: 'Elena Popov', role: 'SD Consultant', avatar: 'EP', capacity: 'available', percentage: 0 },
    { id: 'm6', name: 'James Lee', role: 'ABAP Dev', avatar: 'JL', capacity: 'available', percentage: 0 },
    { id: 'm7', name: 'Maria Garcia', role: 'Basis Admin', avatar: 'MG', capacity: 'overallocated', percentage: 120 },
    { id: 'm8', name: 'Tom Wilson', role: 'QA Lead', avatar: 'TW', capacity: 'partial', percentage: 60 },
  ]);

  const [draggedMember, setDraggedMember] = useState<string | null>(null);

  const getMembersByCapacity = (capacity: CapacityLevel) => {
    return members.filter(m => m.capacity === capacity);
  };

  const handleDragStart = (memberId: string) => {
    setDraggedMember(memberId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCapacity: CapacityLevel) => {
    if (!draggedMember) return;

    setMembers(prev => prev.map(member => {
      if (member.id === draggedMember) {
        let newPercentage = member.percentage;
        if (targetCapacity === 'available') newPercentage = 0;
        else if (targetCapacity === 'partial') newPercentage = 50;
        else if (targetCapacity === 'full') newPercentage = 100;
        else if (targetCapacity === 'overallocated') newPercentage = 120;

        return { ...member, capacity: targetCapacity, percentage: newPercentage };
      }
      return member;
    }));

    setDraggedMember(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{
        maxWidth: '1800px',
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
            backgroundColor: '#E0E7FF',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <Zap size={14} color="#4338CA" />
            <span style={{ fontSize: '13px', color: '#3730A3', fontWeight: 600 }}>
              CAPACITY BOARD
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
            Team Availability
          </h1>
          <p style={{
            fontSize: '17px',
            color: '#6B7280',
            margin: 0,
          }}>
            Drag members between capacity levels • Real-time team view
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {(Object.keys(CAPACITY_COLUMNS) as CapacityLevel[]).map(capacity => {
            const column = CAPACITY_COLUMNS[capacity];
            const columnMembers = getMembersByCapacity(capacity);

            return (
              <div
                key={capacity}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(capacity)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '2px solid #E5E7EB',
                  padding: '20px',
                  minHeight: '600px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `3px solid ${column.color}`,
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: column.bgColor,
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: column.color,
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: column.color,
                    }}>
                      {column.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#111827',
                    marginTop: '8px',
                  }}>
                    {columnMembers.length}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                  }}>
                    {columnMembers.length === 1 ? 'member' : 'members'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {columnMembers.map(member => (
                    <div
                      key={member.id}
                      draggable
                      onDragStart={() => handleDragStart(member.id)}
                      style={{
                        padding: '16px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '2px solid #E5E7EB',
                        cursor: 'grab',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.cursor = 'grabbing';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.cursor = 'grab';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: column.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '16px',
                          fontWeight: 700,
                          boxShadow: `0 2px 8px ${column.color}40`,
                        }}>
                          {member.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '2px',
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
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            fontWeight: 500,
                          }}>
                            Current Load
                          </span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: member.percentage > 100 ? '#EF4444' : '#111827',
                          }}>
                            {member.percentage}%
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          backgroundColor: '#E5E7EB',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(member.percentage, 100)}%`,
                            backgroundColor: column.color,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>

                      {member.percentage > 100 && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 10px',
                          backgroundColor: '#FEE2E2',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <AlertCircle size={14} color="#DC2626" />
                          <span style={{
                            fontSize: '11px',
                            color: '#DC2626',
                            fontWeight: 600,
                          }}>
                            OVER CAPACITY
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {columnMembers.length === 0 && (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#D1D5DB',
                      fontSize: '14px',
                      border: '2px dashed #E5E7EB',
                      borderRadius: '12px',
                    }}>
                      Drop members here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '4px',
            }}>
              Quick Actions
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6B7280',
            }}>
              Drag cards between columns to update capacity status
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <button style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              color: '#111827',
              cursor: 'pointer',
            }}>
              Export View
            </button>
            <button style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3B82F6',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
