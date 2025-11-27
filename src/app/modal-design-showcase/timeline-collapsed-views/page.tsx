"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Check, Clock, AlertCircle, FileText } from "lucide-react";

// PRESALES/ESTIMATION CONTEXT - Sample data for proposal/bid
const samplePhases = [
  {
    id: "1",
    name: "Requirements & Analysis",
    workPackages: [
      { name: "Stakeholder Interviews", estimatedDays: 5, confidence: "high", status: "reviewed" },
      { name: "Business Requirements Doc", estimatedDays: 8, confidence: "high", status: "reviewed" },
      { name: "Technical Requirements", estimatedDays: 10, confidence: "medium", status: "draft" },
      { name: "Gap Analysis", estimatedDays: 5, confidence: "medium", status: "draft" },
      { name: "Sign-off Meeting", estimatedDays: 2, confidence: "high", status: "draft" },
    ],
    startDate: "Week 1",
    endDate: "Week 6",
    totalEffort: 30,
    confidence: "High",
    color: "#007AFF",
  },
  {
    id: "2",
    name: "Design & Architecture",
    workPackages: [
      { name: "System Architecture Design", estimatedDays: 10, confidence: "high", status: "reviewed" },
      { name: "UI/UX Design & Prototyping", estimatedDays: 15, confidence: "medium", status: "draft" },
      { name: "Database Design", estimatedDays: 8, confidence: "low", status: "draft" },
    ],
    startDate: "Week 7",
    endDate: "Week 12",
    totalEffort: 33,
    confidence: "Medium",
    color: "#34C759",
  },
  {
    id: "3",
    name: "Development & Integration",
    workPackages: [
      { name: "Backend API Development", estimatedDays: 30, confidence: "medium", status: "draft" },
      { name: "Frontend Development", estimatedDays: 25, confidence: "medium", status: "draft" },
      { name: "Database Implementation", estimatedDays: 12, confidence: "low", status: "draft" },
      { name: "Integration Layer", estimatedDays: 15, confidence: "low", status: "draft" },
      { name: "Testing & QA", estimatedDays: 20, confidence: "medium", status: "draft" },
      { name: "Bug Fixes Buffer", estimatedDays: 10, confidence: "high", status: "draft" },
      { name: "Code Review & Refactoring", estimatedDays: 8, confidence: "medium", status: "draft" },
      { name: "Deployment Preparation", estimatedDays: 5, confidence: "high", status: "draft" },
    ],
    startDate: "Week 13",
    endDate: "Week 38",
    totalEffort: 125,
    confidence: "Low",
    color: "#FF9500",
  },
];

export default function TimelineCollapsedViewsPage() {
  const [selectedOption, setSelectedOption] = useState(5);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const getEstimateStatusCounts = (workPackages: Array<{ status: string }>) => {
    return {
      reviewed: workPackages.filter(wp => wp.status === "reviewed").length,
      draft: workPackages.filter(wp => wp.status === "draft").length,
      total: workPackages.length,
    };
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F5F5F7",
      padding: "20px 12px",
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      boxSizing: "border-box",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>

        {/* Header - Matching BaseModal style */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', sans-serif",
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: 700,
            color: "#1D1D1F",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}>
            Collapsed Phase View Options
          </h1>
          <p style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
            fontSize: "clamp(13px, 3vw, 15px)",
            color: "#86868B",
            lineHeight: "1.5",
          }}>
            For presales estimation & project planning - visualize effort estimates when phases are collapsed
          </p>
        </div>

        {/* Option Selector - Matching modal button style */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
          width: "100%",
        }}>
          {[
            { id: 1, label: "Effort Indicators", emoji: "●" },
            { id: 2, label: "Confidence Badge", emoji: "📊" },
            { id: 3, label: "Estimate Minimap", emoji: "🗺️" },
            { id: 4, label: "Compact Estimate", emoji: "📋" },
            { id: 5, label: "Hybrid ⭐", emoji: "✨" },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              style={{
                padding: "8px 16px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: selectedOption === option.id ? "#007AFF" : "#FFFFFF",
                color: selectedOption === option.id ? "#FFFFFF" : "#1D1D1F",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: selectedOption === option.id
                  ? "0 2px 8px rgba(0, 122, 255, 0.25)"
                  : "0 1px 3px rgba(0, 0, 0, 0.08)",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== option.id) {
                  e.currentTarget.style.backgroundColor = "#F5F5F7";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== option.id) {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }
              }}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>

        {/* Main Content Card - Matching BaseModal */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "clamp(16px, 4vw, 32px)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          width: "100%",
          overflow: "hidden",
        }}>

          <div style={{ marginBottom: "20px" }}>
            <h2 style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', sans-serif",
              fontSize: "clamp(18px, 4vw, 22px)",
              fontWeight: 600,
              color: "#1D1D1F",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}>
              {selectedOption === 1 && "Option 1: Effort Indicators"}
              {selectedOption === 2 && "Option 2: Confidence Badge + Preview"}
              {selectedOption === 3 && "Option 3: Estimate Minimap"}
              {selectedOption === 4 && "Option 4: Compact Estimate View"}
              {selectedOption === 5 && "Option 5: Hybrid Approach ⭐"}
            </h2>
            <p style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
              fontSize: "13px",
              color: "#86868B",
              lineHeight: "1.4",
            }}>
              {selectedOption === 1 && "Dots show confidence level - Green (high), Blue (medium), Gray (low)"}
              {selectedOption === 2 && "Clean view with hover preview showing all work packages"}
              {selectedOption === 3 && "Visual timeline showing effort distribution across phases"}
              {selectedOption === 4 && "Mobile-optimized with all estimation metrics inline"}
              {selectedOption === 5 && "Best of all: dots + metrics + effort totals (RECOMMENDED)"}
            </p>
          </div>

          {/* OPTION 1: Effort Indicators (Dots by Confidence) */}
          {selectedOption === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {samplePhases.map(phase => {
                const counts = getEstimateStatusCounts(phase.workPackages);
                const isExpanded = expandedPhases[phase.id];

                return (
                  <div key={phase.id} style={{
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}>
                    <div
                      onClick={() => togglePhase(phase.id)}
                      style={{
                        padding: "14px 18px",
                        backgroundColor: "#FAFAFA",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: "#86868B" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#86868B" }} />}

                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                        }}>
                          {phase.name}
                        </span>
                      </div>

                      {/* Confidence Dots */}
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {phase.workPackages.map((wp, idx) => (
                          <div
                            key={idx}
                            title={`${wp.name} - ${wp.estimatedDays}d (${wp.confidence} confidence)`}
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor:
                                wp.confidence === "high" ? "#34C759" :
                                wp.confidence === "medium" ? "#007AFF" :
                                "#D1D1D6",
                            }}
                          />
                        ))}
                      </div>

                      <span style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#86868B",
                      }}>
                        {phase.totalEffort} days
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "12px 18px 12px 48px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
                        {phase.workPackages.map((wp, idx) => (
                          <div key={idx} style={{
                            padding: "6px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                            fontSize: "13px",
                            color: "#1D1D1F",
                          }}>
                            <div style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor:
                                wp.confidence === "high" ? "#34C759" :
                                wp.confidence === "medium" ? "#007AFF" :
                                "#D1D1D6",
                            }} />
                            <span style={{ flex: 1 }}>{wp.name}</span>
                            <span style={{ color: "#86868B", fontSize: "12px" }}>{wp.estimatedDays}d</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#F0FFF4", borderRadius: "8px", border: "1px solid rgba(52, 199, 89, 0.2)" }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", fontWeight: 600, color: "#34C759", marginBottom: "8px" }}>
                  ✅ Best For
                </div>
                <ul style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", color: "#1D1D1F", lineHeight: "1.6", margin: 0, paddingLeft: "18px" }}>
                  <li>Quick confidence assessment</li>
                  <li>5-12 work packages per phase</li>
                  <li>Hover reveals estimate details</li>
                </ul>
              </div>
            </div>
          )}

          {/* OPTION 2: Confidence Badge + Preview */}
          {selectedOption === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {samplePhases.map(phase => {
                const isHovered = hoveredPhase === phase.id;

                return (
                  <div key={phase.id} style={{ position: "relative" }}>
                    <div
                      style={{
                        padding: "14px 18px",
                        backgroundColor: "#FAFAFA",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                      onMouseEnter={() => setHoveredPhase(phase.id)}
                      onMouseLeave={() => setHoveredPhase(null)}
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: "#86868B" }} />

                      <span style={{
                        flex: 1,
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {phase.name}
                      </span>

                      <div style={{
                        padding: "4px 10px",
                        backgroundColor: phase.confidence === "High" ? "#34C759" : phase.confidence === "Medium" ? "#007AFF" : "#FF9500",
                        color: "#FFFFFF",
                        borderRadius: "12px",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}>
                        {phase.confidence} Confidence
                      </div>

                      <span style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#86868B",
                      }}>
                        {phase.workPackages.length} packages • {phase.totalEffort}d
                      </span>
                    </div>

                    {/* Preview on Hover */}
                    {isHovered && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        right: "0",
                        marginTop: "4px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "10px",
                        padding: "12px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                        zIndex: 10,
                        minWidth: "280px",
                      }}>
                        <div style={{
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#86868B",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Work Package Estimates
                        </div>
                        {phase.workPackages.map((wp, idx) => (
                          <div key={idx} style={{
                            padding: "4px 0",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                            fontSize: "12px",
                            color: "#1D1D1F",
                            display: "flex",
                            justifyContent: "space-between",
                          }}>
                            <span>{wp.name}</span>
                            <span style={{ color: "#86868B" }}>{wp.estimatedDays}d</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#F0FFF4", borderRadius: "8px", border: "1px solid rgba(52, 199, 89, 0.2)" }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", fontWeight: 600, color: "#34C759", marginBottom: "8px" }}>
                  ✅ Best For
                </div>
                <ul style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", color: "#1D1D1F", lineHeight: "1.6", margin: 0, paddingLeft: "18px" }}>
                  <li>Clean, minimal UI</li>
                  <li>Focus on overall confidence</li>
                  <li>Detail on demand (hover)</li>
                </ul>
              </div>
            </div>
          )}

          {/* OPTION 3: Estimate Minimap */}
          {selectedOption === 3 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {samplePhases.map(phase => (
                  <div key={phase.id} style={{
                    padding: "14px 18px",
                    backgroundColor: "#FAFAFA",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}>
                    <ChevronRight className="w-4 h-4" style={{ color: "#86868B" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {phase.name}
                      </div>
                      <div style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "12px",
                        color: "#86868B",
                        marginTop: "2px",
                      }}>
                        {phase.workPackages.length} packages • {phase.totalEffort} days total
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Minimap */}
              <div style={{
                padding: "16px",
                backgroundColor: "#FAFAFA",
                borderRadius: "10px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}>
                <div style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#86868B",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Effort Distribution
                </div>

                {samplePhases.map((phase, idx) => (
                  <div key={phase.id} style={{ marginBottom: "12px" }}>
                    <div style={{
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                      fontSize: "11px",
                      color: "#86868B",
                      marginBottom: "4px",
                    }}>
                      {phase.name}
                    </div>
                    <div style={{
                      height: "20px",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      {phase.workPackages.map((wp, wpIdx) => (
                        <div
                          key={wpIdx}
                          title={`${wp.name} - ${wp.estimatedDays}d`}
                          style={{
                            position: "absolute",
                            left: `${(phase.workPackages.slice(0, wpIdx).reduce((sum, w) => sum + w.estimatedDays, 0) / phase.totalEffort) * 100}%`,
                            width: `${(wp.estimatedDays / phase.totalEffort) * 100}%`,
                            height: "100%",
                            backgroundColor:
                              wp.confidence === "high" ? "#34C759" :
                              wp.confidence === "medium" ? "#007AFF" :
                              "#FF9500",
                            borderRight: "1px solid #FFFFFF",
                          }}
                        />
                      ))}
                    </div>
                    <div style={{
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                      fontSize: "10px",
                      color: "#86868B",
                      marginTop: "2px",
                      textAlign: "right",
                    }}>
                      {phase.totalEffort} days
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
                  {[
                    { color: "#34C759", label: "High Confidence" },
                    { color: "#007AFF", label: "Medium Confidence" },
                    { color: "#FF9500", label: "Low Confidence" },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                      fontSize: "11px",
                      color: "#1D1D1F",
                    }}>
                      <div style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: item.color,
                        borderRadius: "3px",
                      }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OPTION 4: Compact Estimate View */}
          {selectedOption === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {samplePhases.map(phase => {
                const counts = getEstimateStatusCounts(phase.workPackages);

                return (
                  <div key={phase.id} style={{
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    backgroundColor: "#FAFAFA",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}>
                      <ChevronRight className="w-4 h-4" style={{ color: "#86868B" }} />

                      <span style={{
                        flex: 1,
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {phase.name}
                      </span>

                      <div style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "12px",
                        color: "#86868B",
                      }}>
                        {counts.total} packages
                      </div>

                      <div style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {phase.totalEffort} days
                      </div>
                    </div>

                    <div style={{
                      paddingLeft: "28px",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                      fontSize: "11px",
                      color: "#86868B",
                    }}>
                      {phase.startDate} - {phase.endDate} • {phase.confidence} confidence
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#F0FFF4", borderRadius: "8px", border: "1px solid rgba(52, 199, 89, 0.2)" }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", fontWeight: 600, color: "#34C759", marginBottom: "8px" }}>
                  ✅ Best For
                </div>
                <ul style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif", fontSize: "12px", color: "#1D1D1F", lineHeight: "1.6", margin: 0, paddingLeft: "18px" }}>
                  <li>Mobile-first workflows</li>
                  <li>All metrics visible inline</li>
                  <li>Highly scannable</li>
                </ul>
              </div>
            </div>
          )}

          {/* OPTION 5: Hybrid (RECOMMENDED) */}
          {selectedOption === 5 && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {samplePhases.map(phase => {
                  const counts = getEstimateStatusCounts(phase.workPackages);
                  const isExpanded = expandedPhases[phase.id];

                  return (
                    <div key={phase.id} style={{
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}>
                      <div
                        onClick={() => togglePhase(phase.id)}
                        style={{
                          padding: "14px 18px",
                          backgroundColor: "#FAFAFA",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: "#86868B" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "#86868B" }} />}

                          <span style={{
                            flex: 1,
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}>
                            {phase.name}
                          </span>

                          {/* Confidence Dots */}
                          <div style={{ display: "flex", gap: "4px" }}>
                            {phase.workPackages.map((wp, idx) => (
                              <div
                                key={idx}
                                title={`${wp.name} - ${wp.estimatedDays}d`}
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    wp.confidence === "high" ? "#34C759" :
                                    wp.confidence === "medium" ? "#007AFF" :
                                    "#D1D1D6",
                                }}
                              />
                            ))}
                          </div>

                          {/* Counts */}
                          <div style={{
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                            fontSize: "12px",
                            color: "#86868B",
                          }}>
                            {counts.reviewed}✓ {counts.draft}📝
                          </div>

                          {/* Total Effort */}
                          <div style={{
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                            minWidth: "60px",
                            textAlign: "right",
                          }}>
                            {phase.totalEffort} days
                          </div>
                        </div>

                        <div style={{
                          paddingLeft: "28px",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                          fontSize: "11px",
                          color: "#86868B",
                        }}>
                          {phase.startDate} - {phase.endDate} • {phase.confidence} confidence
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "12px 18px 12px 48px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
                          {phase.workPackages.map((wp, idx) => (
                            <div key={idx} style={{
                              padding: "6px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                              fontSize: "13px",
                              color: "#1D1D1F",
                            }}>
                              <div style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor:
                                  wp.confidence === "high" ? "#34C759" :
                                  wp.confidence === "medium" ? "#007AFF" :
                                  "#D1D1D6",
                              }} />
                              <span style={{ flex: 1 }}>{wp.name}</span>
                              <span style={{ color: "#86868B", fontSize: "12px" }}>{wp.estimatedDays}d</span>
                              {wp.status === "reviewed" && <Check className="w-3 h-3" style={{ color: "#34C759" }} />}
                              {wp.status === "draft" && <FileText className="w-3 h-3" style={{ color: "#86868B" }} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Why Recommended */}
              <div style={{
                marginTop: "24px",
                padding: "20px",
                backgroundColor: "#F0F7FF",
                borderRadius: "10px",
                border: "1px solid rgba(0, 122, 255, 0.2)",
              }}>
                <h3 style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#007AFF",
                  marginBottom: "12px",
                }}>
                  ⭐ Why This is Recommended for Presales
                </h3>
                <ul style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', sans-serif",
                  fontSize: "12px",
                  color: "#1D1D1F",
                  lineHeight: "1.8",
                  margin: 0,
                  paddingLeft: "18px",
                }}>
                  <li><strong>Visual + Numeric</strong>: Dots show confidence, numbers show effort</li>
                  <li><strong>Complete Context</strong>: Reviewed vs draft status at a glance</li>
                  <li><strong>Scalable</strong>: Works for 3-30 work packages per phase</li>
                  <li><strong>Presales-Focused</strong>: Confidence levels, not completion status</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
