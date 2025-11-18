/**
 * Transformation Roadmap
 * Visual timeline of implementation phases
 *
 * Shows:
 * - Implementation phases (sequential or parallel)
 * - Timeline with dates
 * - Key milestones
 * - Dependencies
 * - All in a beautiful, simple Gantt-like view
 */

"use client";

import { useState } from "react";
import { Plus, Calendar, Flag, ArrowRight, CheckCircle2 } from "lucide-react";

interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  milestones: Milestone[];
  status: "not-started" | "in-progress" | "completed";
}

interface Milestone {
  id: string;
  name: string;
  date: string;
}

export function TransformationRoadmap() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projectStart, setProjectStart] = useState("");
  const [projectEnd, setProjectEnd] = useState("");

  const addPhase = () => {
    const newPhase: Phase = {
      id: Date.now().toString(),
      name: `Phase ${phases.length + 1}`,
      startDate: "",
      endDate: "",
      description: "",
      milestones: [],
      status: "not-started",
    };
    setPhases([...phases, newPhase]);
  };

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addMilestone = (phaseId: string) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      name: "New Milestone",
      date: "",
    };
    setPhases(
      phases.map((p) =>
        p.id === phaseId ? { ...p, milestones: [...p.milestones, newMilestone] } : p
      )
    );
  };

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "48px 32px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "48px", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
            marginBottom: "12px",
          }}
        >
          Transformation Roadmap
        </h2>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            color: "var(--color-gray-1)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Plan your implementation in clear phases with milestones
        </p>
      </div>

      {/* Project Timeline */}
      <div
        style={{
          marginBottom: "32px",
          padding: "24px",
          backgroundColor: "var(--color-gray-6)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <Calendar className="w-5 h-5" style={{ color: "var(--color-blue)" }} />
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "18px",
              fontWeight: "var(--weight-semibold)",
              color: "#000",
            }}
          >
            Project Timeline
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "var(--color-gray-1)",
                marginBottom: "6px",
              }}
            >
              Project Start Date
            </label>
            <input
              type="date"
              value={projectStart}
              onChange={(e) => setProjectStart(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "var(--color-gray-1)",
                marginBottom: "6px",
              }}
            >
              Project End Date
            </label>
            <input
              type="date"
              value={projectEnd}
              onChange={(e) => setProjectEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "18px",
              fontWeight: "var(--weight-semibold)",
              color: "#000",
            }}
          >
            Implementation Phases
          </h3>
          <button
            onClick={addPhase}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              backgroundColor: "var(--color-blue)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: "var(--weight-semibold)",
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0051D5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-blue)")}
          >
            <Plus className="w-4 h-4" />
            Add Phase
          </button>
        </div>

        {phases.length === 0 ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              backgroundColor: "var(--color-gray-6)",
              borderRadius: "12px",
              border: "2px dashed var(--color-gray-4)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                color: "var(--color-gray-1)",
              }}
            >
              No phases yet. Click "Add Phase" to start planning your implementation.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                phaseNumber={index + 1}
                onUpdate={(updates) => updatePhase(phase.id, updates)}
                onAddMilestone={() => addMilestone(phase.id)}
                showArrow={index < phases.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Visual Timeline (if phases exist) */}
      {phases.length > 0 && projectStart && projectEnd && (
        <div style={{ marginBottom: "32px" }}>
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "18px",
              fontWeight: "var(--weight-semibold)",
              color: "#000",
              marginBottom: "16px",
            }}
          >
            Visual Timeline
          </h3>
          <VisualTimeline phases={phases} projectStart={projectStart} projectEnd={projectEnd} />
        </div>
      )}

      {/* Export Button */}
      <div style={{ marginTop: "48px", textAlign: "center" }}>
        <button
          style={{
            padding: "12px 32px",
            backgroundColor: "var(--color-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "15px",
            fontWeight: "var(--weight-semibold)",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0051D5")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-blue)")}
        >
          Export Roadmap
        </button>
      </div>
    </div>
  );
}

/**
 * Phase Card
 */
interface PhaseCardProps {
  phase: Phase;
  phaseNumber: number;
  onUpdate: (updates: Partial<Phase>) => void;
  onAddMilestone: () => void;
  showArrow: boolean;
}

function PhaseCard({ phase, phaseNumber, onUpdate, onAddMilestone, showArrow }: PhaseCardProps) {
  const statusColors = {
    "not-started": { bg: "#F5F5F7", border: "#8E8E93", text: "#636366", label: "Not Started" },
    "in-progress": { bg: "#EBF5FF", border: "#007AFF", text: "#005BBB", label: "In Progress" },
    completed: { bg: "#EBFFF0", border: "#34C759", text: "#248A3D", label: "Completed" },
  };

  const statusStyle = statusColors[phase.status];

  return (
    <div>
      <div
        style={{
          padding: "24px",
          backgroundColor: "#fff",
          border: `2px solid ${statusStyle.border}`,
          borderRadius: "12px",
          transition: "all 200ms ease",
        }}
      >
        {/* Phase Header */}
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: statusStyle.bg,
                  border: `2px solid ${statusStyle.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: "var(--weight-semibold)",
                  color: statusStyle.text,
                }}
              >
                {phaseNumber}
              </div>
              <input
                type="text"
                value={phase.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  fontFamily: "var(--font-text)",
                  fontSize: "18px",
                  fontWeight: "var(--weight-semibold)",
                  color: "#000",
                  outline: "none",
                  backgroundColor: "transparent",
                }}
                placeholder="Phase name..."
              />
            </div>
            <textarea
              value={phase.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Phase description..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                resize: "vertical",
                minHeight: "60px",
                outline: "none",
              }}
            />
          </div>

          {/* Status Selector */}
          <select
            value={phase.status}
            onChange={(e) => onUpdate({ status: e.target.value as any })}
            style={{
              padding: "8px 12px",
              backgroundColor: statusStyle.bg,
              border: `2px solid ${statusStyle.border}`,
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: "var(--weight-semibold)",
              color: statusStyle.text,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "var(--color-gray-1)",
                marginBottom: "4px",
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={phase.startDate}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "var(--color-gray-1)",
                marginBottom: "4px",
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={phase.endDate}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Flag className="w-4 h-4" style={{ color: "var(--color-orange)" }} />
              <span
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--color-gray-1)",
                }}
              >
                Milestones ({phase.milestones.length})
              </span>
            </div>
            <button
              onClick={onAddMilestone}
              style={{
                padding: "4px 10px",
                backgroundColor: "transparent",
                border: "1px solid var(--color-gray-4)",
                borderRadius: "4px",
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-gray-1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {phase.milestones.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {phase.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#FFF3EB",
                    border: "1px solid var(--color-orange)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-text)",
                    fontSize: "12px",
                    color: "#CC7700",
                  }}
                >
                  {milestone.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Arrow to next phase */}
      {showArrow && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "8px 0",
          }}
        >
          <ArrowRight className="w-6 h-6" style={{ color: "var(--color-gray-3)" }} />
        </div>
      )}
    </div>
  );
}

/**
 * Visual Timeline - Gantt-like bars
 */
interface VisualTimelineProps {
  phases: Phase[];
  projectStart: string;
  projectEnd: string;
}

function VisualTimeline({ phases, projectStart, projectEnd }: VisualTimelineProps) {
  const start = new Date(projectStart);
  const end = new Date(projectEnd);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const getBarStyle = (phaseStart: string, phaseEnd: string) => {
    if (!phaseStart || !phaseEnd) return { left: "0%", width: "0%" };

    const pStart = new Date(phaseStart);
    const pEnd = new Date(phaseEnd);

    const startOffset = Math.max(0, (pStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "var(--color-gray-6)",
        borderRadius: "12px",
      }}
    >
      {phases.map((phase, index) => {
        const barStyle = getBarStyle(phase.startDate, phase.endDate);
        const statusColor =
          phase.status === "completed"
            ? "var(--color-green)"
            : phase.status === "in-progress"
            ? "var(--color-blue)"
            : "var(--color-gray-3)";

        return (
          <div key={phase.id} style={{ marginBottom: index < phases.length - 1 ? "16px" : 0 }}>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: "var(--weight-medium)",
                color: "#000",
                marginBottom: "6px",
              }}
            >
              {phase.name}
            </div>
            <div
              style={{
                position: "relative",
                height: "32px",
                backgroundColor: "#fff",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: barStyle.left,
                  width: barStyle.width,
                  height: "100%",
                  backgroundColor: statusColor,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "12px",
                  color: "#fff",
                  fontFamily: "var(--font-text)",
                  fontSize: "12px",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {phase.startDate && phase.endDate && (
                  <span>
                    {new Date(phase.startDate).toLocaleDateString()} -{" "}
                    {new Date(phase.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
