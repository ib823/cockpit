"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

const TOKENS = {
  colors: {
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    border: '#E5E7EB',
  },
  spacing: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  radius: {
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    fontSize: {
      sm: '13px',
      md: '15px',
      lg: '17px',
      xl: '20px',
      xxl: '28px',
      xxxl: '36px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  transitions: {
    fast: '0.15s ease',
  },
};

interface DesignOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  preview: string;
  features: string[];
  bestFor: string;
  href: string;
  available?: boolean;
  unavailableReason?: string;
}

const options: DesignOption[] = [
  {
    id: 'integrated',
    name: 'Gantt-Integrated Planner',
    tagline: 'Timeline from your Gantt projects',
    description: 'Automatically pulls timeline, phases, and dates from your existing Gantt projects. No manual setup - just pick a project and start allocating.',
    preview: '/capacity-preview-integrated.svg',
    features: [
      'Auto-sync with Gantt tool projects',
      'Phases & dates from Gantt timeline',
      'Excel-like inline editing',
      'No manual date entry needed',
      'Single source of truth',
    ],
    bestFor: 'Teams using Gantt tool, automatic timeline sync, zero-setup resource planning',
    href: '/team-capacity/integrated',
  },
  {
    id: 'excel',
    name: 'Phase-Based Excel',
    tagline: 'Like Excel, but better',
    description: 'Familiar spreadsheet layout with project phases, inline editing, and collaboration. Handles 52 weeks × 100+ resources easily.',
    preview: '/capacity-preview-excel.svg',
    features: [
      'Excel-like grid with inline editing',
      'Project phases with color coding',
      'Filter by phase to focus work',
      '52 weeks (full year) timeline',
      'Export back to Excel',
    ],
    bestFor: 'Real work (10+ resources, year-long projects), Excel power users, collaboration',
    href: '/team-capacity/excel',
  },
  {
    id: 'heatmap',
    name: 'Heatmap Vision',
    tagline: 'See capacity at a glance',
    description: 'Glassmorphic design with gradient heatmap visualization. Capacity density shown through color intensity and blur effects.',
    preview: '/capacity-preview-heatmap.svg',
    features: [
      'Continuous gradient heatmap (0-100%)',
      'Glassmorphic cards with backdrop blur',
      'Smart zoom levels (day/week/month)',
      'Floating tooltips on hover',
      'Dark mode optimized',
    ],
    bestFor: 'High-level capacity overview, executive dashboards, trend spotting',
    href: '/team-capacity/heatmap',
  },
  {
    id: 'cards',
    name: 'Timeline Cards',
    tagline: 'Story-driven planning',
    description: 'Card-based interface where each week is a draggable card. Allocate resources by dragging member cards into week slots.',
    preview: '/capacity-preview-cards.svg',
    features: [
      'Drag & drop member cards',
      'Week-by-week swim lanes',
      'Visual capacity bars per card',
      'Inline comments and notes',
      'Auto-balance suggestions',
    ],
    bestFor: 'Sprint planning, agile teams, visual thinkers, collaborative sessions',
    href: '/team-capacity/cards',
  },
  {
    id: 'kanban',
    name: 'Capacity Board',
    tagline: 'Kanban meets resource planning',
    description: 'Kanban-style board with columns for availability levels. Move members between "Available", "Partial", "Full" columns.',
    preview: '/capacity-preview-kanban.svg',
    features: [
      'Kanban-style columns',
      'Member avatar cards',
      'Drag between capacity levels',
      'Real-time team view',
      'Conflict detection',
    ],
    bestFor: 'Daily standups, real-time allocation, team leads, quick adjustments',
    href: '/team-capacity/kanban',
  },
  {
    id: 'timeline',
    name: 'Gantt Timeline',
    tagline: 'Precision planning',
    description: 'Traditional timeline view with modern twist. Continuous bars show allocation periods with smooth drag & resize.',
    preview: '/capacity-preview-timeline.svg',
    features: [
      'Continuous allocation bars',
      'Drag to extend/shrink periods',
      'Snap to week boundaries',
      'Overlap detection',
      'Export to MS Project',
    ],
    bestFor: 'Project managers, Gantt users, waterfall projects, detailed planning',
    href: '/team-capacity/timeline',
  },
  {
    id: 'smart',
    name: 'AI-Powered Smart View',
    tagline: 'Let AI optimize your team',
    description: 'AI suggests optimal allocation based on skills, availability, and project requirements. One-click auto-balance.',
    preview: '/capacity-preview-smart.svg',
    features: [
      'AI-powered suggestions',
      'Skill-based matching',
      'One-click auto-balance',
      'Conflict resolution AI',
      'What-if scenarios',
    ],
    bestFor: 'Large teams (50+), complex projects, optimization nerds, data-driven PMs',
    href: '/team-capacity/smart',
  },
  {
    id: 'minimal',
    name: 'Ultra Minimal',
    tagline: 'Pure focus, zero distraction',
    description: 'Brutalist design. Just names, numbers, and weeks. No colors, no charts, no fluff. Maximum information density.',
    preview: '/capacity-preview-minimal.svg',
    features: [
      'Text-only interface',
      'Monospace font',
      'Keyboard-first',
      'CSV-like layout',
      'Instant editing',
    ],
    bestFor: 'Keyboard warriors, minimalists, CLI lovers, focus mode',
    href: '/team-capacity/minimal',
  },
];

const accentColors: Record<string, string> = {
  'integrated': '#0EA5E9',
  'excel': '#10B981',
  'heatmap': '#667eea',
  'cards': '#F59E0B',
  'kanban': '#3B82F6',
  'timeline': '#8B5CF6',
  'smart': '#EC4899',
  'minimal': '#111827',
};

export default function TeamCapacityOptions() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: TOKENS.typography.fontFamily,
    }}>
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '60px 48px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <Link
            href="/team-capacity"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: TOKENS.typography.fontSize.sm,
              color: TOKENS.colors.text.secondary,
              textDecoration: 'none',
              marginBottom: '32px',
              transition: TOKENS.transitions.fast,
              padding: '8px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TOKENS.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TOKENS.colors.text.secondary;
            }}
          >
            <ArrowLeft size={16} />
            Back to current view
          </Link>

          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: TOKENS.colors.text.primary,
            margin: 0,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}>
            Choose Your Experience
          </h1>
          <p style={{
            fontSize: TOKENS.typography.fontSize.lg,
            color: TOKENS.colors.text.secondary,
            margin: 0,
            maxWidth: '580px',
            lineHeight: '1.5',
            fontWeight: 400,
          }}>
            Different teams work differently. Select the interface that best matches your workflow and team dynamics.
          </p>
        </div>

        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '28px',
          marginBottom: '64px',
        }}>
          {options.map(option => {
            const accentColor = accentColors[option.id] || '#6B7280';
            const isSelected = selectedOption === option.id && option.available !== false;
            const isUnavailable = option.available === false;

            return (
              <div
                key={option.id}
                onClick={() => !isUnavailable && setSelectedOption(option.id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  cursor: isUnavailable ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isSelected
                    ? '0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  opacity: isUnavailable ? 0.5 : 1,
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (!isUnavailable && !isSelected) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUnavailable && !isSelected) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }
                }}
              >
                {/* Accent Bar at Top */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: accentColor,
                  opacity: 0.8,
                }} />

                {/* Preview Area - Minimal White */}
                <div style={{
                  width: '100%',
                  height: '140px',
                  backgroundColor: '#F9FAFB',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #E5E7EB',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Subtle accent element in corner */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    opacity: 0.08,
                  }} />

                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: accentColor,
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {option.name}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
                    zIndex: 10,
                  }}>
                    <Check size={16} color="#FFFFFF" />
                  </div>
                )}

                {/* Unavailable Badge */}
                {isUnavailable && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    zIndex: 10,
                  }}>
                    Coming Soon
                  </div>
                )}

                {/* Content Area */}
                <div style={{ padding: '20px 20px 24px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: TOKENS.colors.text.primary,
                    margin: 0,
                    marginBottom: '4px',
                  }}>
                    {option.name}
                  </h3>

                  <p style={{
                    fontSize: '12px',
                    color: accentColor,
                    fontWeight: 500,
                    margin: 0,
                    marginBottom: '12px',
                  }}>
                    {option.tagline}
                  </p>

                  <p style={{
                    fontSize: '13px',
                    color: TOKENS.colors.text.secondary,
                    lineHeight: '1.5',
                    margin: 0,
                    marginBottom: '16px',
                  }}>
                    {option.description}
                  </p>

                  {/* Features */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: TOKENS.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginBottom: '8px',
                    }}>
                      Highlights
                    </div>
                    <ul style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}>
                      {option.features.slice(0, 2).map((feature, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: '12px',
                            color: TOKENS.colors.text.secondary,
                            paddingLeft: '18px',
                            position: 'relative',
                          }}
                        >
                          <span style={{
                            position: 'absolute',
                            left: 0,
                            color: accentColor,
                            fontWeight: 600,
                          }}>
                            •
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FAFBFC',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: TOKENS.colors.text.secondary,
                    lineHeight: '1.5',
                    marginBottom: '16px',
                  }}>
                    <strong style={{ color: TOKENS.colors.text.primary, fontSize: '10px' }}>BEST FOR</strong>
                    <br />
                    <span style={{ fontSize: '12px' }}>{option.bestFor}</span>
                  </div>

                  {/* CTA Button */}
                  {isUnavailable ? (
                    <button
                      disabled
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#F3F4F6',
                        color: TOKENS.colors.text.tertiary,
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: TOKENS.transitions.fast,
                        border: '1px solid #E5E7EB',
                        cursor: 'not-allowed',
                      }}
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <Link
                      href={option.href}
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        backgroundColor: isSelected ? accentColor : '#F3F4F6',
                        color: isSelected ? '#FFFFFF' : TOKENS.colors.text.primary,
                        borderRadius: '8px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: TOKENS.transitions.fast,
                        border: isSelected ? '1px solid ' + accentColor : '1px solid #E5E7EB',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#ECECF1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                    >
                      {isSelected ? 'Launch' : 'Explore'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div style={{
          marginTop: '80px',
          paddingTop: '64px',
          borderTop: '1px solid #E5E7EB',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: TOKENS.colors.text.primary,
            margin: 0,
            marginBottom: '12px',
            letterSpacing: '-0.3px',
          }}>
            Need guidance?
          </h2>
          <p style={{
            fontSize: TOKENS.typography.fontSize.md,
            color: TOKENS.colors.text.secondary,
            margin: 0,
            marginBottom: '32px',
            maxWidth: '520px',
          }}>
            Each experience is optimized for different workflows. Here are common scenarios to help you choose.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {[
              { title: 'Using Gantt Tool?', recommendation: 'Gantt-Integrated', color: accentColors.integrated },
              { title: 'Quick Overview?', recommendation: 'Heatmap Vision', color: accentColors.heatmap },
              { title: 'Agile Team?', recommendation: 'Timeline Cards', color: accentColors.cards },
              { title: 'Daily Updates?', recommendation: 'Capacity Board', color: accentColors.kanban },
              { title: 'Detailed Timeline?', recommendation: 'Gantt Timeline', color: accentColors.timeline },
              { title: 'AI Optimization?', recommendation: 'Smart View', color: accentColors.smart },
              { title: 'Spreadsheet Style?', recommendation: 'Phase-Based Excel', color: accentColors.excel },
              { title: 'Keyboard Focused?', recommendation: 'Ultra Minimal', color: accentColors.minimal },
            ].map((scenario, i) => (
              <div
                key={i}
                style={{
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: TOKENS.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: '8px',
                }}>
                  {scenario.title}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: scenario.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  →
                  <span>{scenario.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
