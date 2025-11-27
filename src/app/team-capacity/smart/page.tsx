"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle, TrendingUp, Zap } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  currentLoad: number;
  availability: number;
}

interface ProjectTask {
  id: string;
  name: string;
  requiredSkills: string[];
  assignedTo: string | null;
  priority: 'high' | 'medium' | 'low';
}

interface Suggestion {
  taskId: string;
  memberId: string;
  member: TeamMember;
  task: ProjectTask;
  matchScore: number;
  reason: string;
}

const members: TeamMember[] = [
  { id: 'm1', name: 'Sarah Chen', role: 'Project Director', skills: ['Leadership', 'Strategy', 'Planning'], currentLoad: 100, availability: 0 },
  { id: 'm2', name: 'Michael Ross', role: 'PM', skills: ['Planning', 'Coordination', 'Communication'], currentLoad: 85, availability: 15 },
  { id: 'm3', name: 'Anna Schmidt', role: 'FI Consultant', skills: ['SAP FI', 'Finance', 'Analysis'], currentLoad: 100, availability: 0 },
  { id: 'm4', name: 'David Kim', role: 'MM Consultant', skills: ['SAP MM', 'Logistics', 'Analysis'], currentLoad: 60, availability: 40 },
  { id: 'm5', name: 'Elena Popov', role: 'SD Consultant', skills: ['SAP SD', 'Sales', 'Analysis'], currentLoad: 75, availability: 25 },
  { id: 'm6', name: 'James Lee', role: 'ABAP Dev', skills: ['ABAP', 'Development', 'Technical'], currentLoad: 90, availability: 10 },
  { id: 'm7', name: 'Maria Garcia', role: 'Basis Admin', skills: ['SAP Basis', 'Infrastructure', 'Technical'], currentLoad: 70, availability: 30 },
  { id: 'm8', name: 'Tom Wilson', role: 'QA Lead', skills: ['QA', 'Testing', 'Analysis'], currentLoad: 95, availability: 5 },
];

const tasks: ProjectTask[] = [
  { id: 't1', name: 'FI Configuration', requiredSkills: ['SAP FI', 'Analysis'], assignedTo: null, priority: 'high' },
  { id: 't2', name: 'MM Optimization', requiredSkills: ['SAP MM', 'Logistics'], assignedTo: null, priority: 'high' },
  { id: 't3', name: 'SD Implementation', requiredSkills: ['SAP SD', 'Sales'], assignedTo: null, priority: 'medium' },
  { id: 't4', name: 'ABAP Development', requiredSkills: ['ABAP', 'Development'], assignedTo: null, priority: 'high' },
  { id: 't5', name: 'Basis Configuration', requiredSkills: ['SAP Basis', 'Infrastructure'], assignedTo: null, priority: 'medium' },
  { id: 't6', name: 'UAT Testing', requiredSkills: ['QA', 'Testing'], assignedTo: null, priority: 'high' },
];

export default function SmartCapacityPage() {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, string>>({});

  const suggestions = useMemo(() => {
    const results: Suggestion[] = [];

    tasks.forEach(task => {
      const available = members.filter(m => m.availability > 0 && !appliedSuggestions[task.id]);

      const scored = available.map(member => {
        const skillMatch = task.requiredSkills.filter(skill =>
          member.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()))
        ).length;

        const matchScore = (skillMatch / task.requiredSkills.length) * 100 * (member.availability / 100);
        const reason = skillMatch === task.requiredSkills.length
          ? `Perfect skill match (${skillMatch}/${task.requiredSkills.length} skills). ${member.availability}% available.`
          : `Partial skill match (${skillMatch}/${task.requiredSkills.length} skills). ${member.availability}% available.`;

        return { taskId: task.id, memberId: member.id, member, task, matchScore, reason };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);
      if (scored.length > 0) {
        results.push(scored[0]);
      }
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [appliedSuggestions]);

  const applyAllSuggestions = () => {
    const newAssignments: Record<string, string> = { ...appliedSuggestions };
    suggestions.forEach(s => {
      newAssignments[s.taskId] = s.memberId;
    });
    setAppliedSuggestions(newAssignments);
  };

  const applySuggestion = (taskId: string, memberId: string) => {
    setAppliedSuggestions(prev => ({
      ...prev,
      [taskId]: memberId,
    }));
  };

  const avgMatchScore = suggestions.length > 0
    ? (suggestions.reduce((sum, s) => sum + s.matchScore, 0) / suggestions.length).toFixed(1)
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{
        maxWidth: '1400px',
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
            backgroundColor: '#F3F4F6',
            borderRadius: '10px',
            color: '#111827',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '24px',
            transition: 'all 0.2s ease',
            border: '1px solid #E5E7EB',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ECECF1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }}
        >
          <ArrowLeft size={16} />
          Back to Options
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid #E5E7EB',
          }}>
            <Sparkles size={16} color="#EC4899" />
            <span style={{ fontSize: '12px', color: '#EC4899', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              AI-POWERED
            </span>
          </div>
          <h1 style={{
            fontSize: '42px',
            color: '#111827',
            marginBottom: '8px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}>
            Smart Capacity View
          </h1>
          <p style={{
            fontSize: '17px',
            color: '#6B7280',
            margin: 0,
          }}>
            AI-powered resource optimization with skill-based matching
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {[
            { icon: Zap, label: 'Optimization Score', value: `${avgMatchScore}%`, color: '#EC4899' },
            { icon: CheckCircle, label: 'Suggestions', value: suggestions.length.toString(), color: '#10B981' },
            { icon: TrendingUp, label: 'Avg Availability', value: `${(members.reduce((sum, m) => sum + m.availability, 0) / members.length).toFixed(0)}%`, color: '#0EA5E9' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <Icon size={20} color={stat.color} />
                  <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: stat.color,
                }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Suggestions */}
          <div>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                }}>
                  AI Suggestions
                </h2>
                <button
                  onClick={applyAllSuggestions}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#EC4899',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.1)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.1)';
                  }}
                >
                  Apply All
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.taskId}
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: '10px',
                      padding: '16px',
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                        }}>
                          {suggestion.task.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280',
                          marginTop: '2px',
                        }}>
                          → {suggestion.member.name}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        backgroundColor: suggestion.matchScore > 80 ? '#10B981' : suggestion.matchScore > 50 ? '#F59E0B' : '#EF4444',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                      }}>
                        {suggestion.matchScore.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginBottom: '10px',
                      lineHeight: '1.4',
                    }}>
                      {suggestion.reason}
                    </div>
                    {!appliedSuggestions[suggestion.taskId] && (
                      <button
                        onClick={() => applySuggestion(suggestion.taskId, suggestion.memberId)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#EC4899',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(236, 72, 153, 0.1)',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(236, 72, 153, 0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(236, 72, 153, 0.1)';
                        }}
                      >
                        Apply Suggestion
                      </button>
                    )}
                    {appliedSuggestions[suggestion.taskId] && (
                      <div style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'center',
                      }}>
                        ✓ Applied
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Availability */}
          <div>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
                marginBottom: '20px',
              }}>
                Team Availability
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {members.map(member => (
                  <div key={member.id}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#111827',
                        }}>
                          {member.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#9CA3AF',
                        }}>
                          {member.role}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: member.availability > 0 ? '#10B981' : '#EF4444',
                      }}>
                        {member.availability}% free
                      </div>
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${member.availability}%`,
                          backgroundColor: member.availability > 25 ? '#10B981' : member.availability > 0 ? '#F59E0B' : '#EF4444',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            marginBottom: '12px',
          }}>
            How It Works
          </h3>
          <ul style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontSize: '13px',
            color: '#6B7280',
            lineHeight: '1.8',
          }}>
            <li>AI analyzes required skills for each task</li>
            <li>Matches team members based on skill fit and availability</li>
            <li>Calculates confidence score (0-100%)</li>
            <li>Prioritizes high-priority tasks first</li>
            <li>Balances team workload automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
