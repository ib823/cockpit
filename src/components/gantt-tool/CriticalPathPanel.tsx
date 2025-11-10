/**
 * Critical Path Analysis Panel
 *
 * Displays critical path analysis with visualizations and insights
 */

"use client";

import { useMemo, useState } from "react";
import { Modal, Tabs, Progress, Alert, Empty } from "antd";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ArrowRight,
  Info,
  ChevronRight,
} from "lucide-react";
import type { GanttProject } from "@/types/gantt-tool";
import {
  calculateCriticalPath,
  getTaskDelayImpact,
  getScheduleCompressionSuggestions,
  type CriticalPathTask,
} from "@/lib/project-analytics/critical-path";
import { colorValues, getElevationShadow, withOpacity, spacing } from "@/lib/design-system";

interface CriticalPathPanelProps {
  open: boolean;
  onClose: () => void;
  project: GanttProject | null;
  onHighlightTask?: (taskId: string) => void;
}

export function CriticalPathPanel({
  open,
  onClose,
  project,
  onHighlightTask,
}: CriticalPathPanelProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedTaskForImpact, setSelectedTaskForImpact] = useState<string | null>(null);

  // Calculate critical path analysis
  const analysis = useMemo(() => {
    if (!project) return null;
    return calculateCriticalPath(project);
  }, [project]);

  // Calculate compression suggestions
  const compressionSuggestions = useMemo(() => {
    if (!project) return null;
    return getScheduleCompressionSuggestions(project);
  }, [project]);

  // Calculate impact for selected task
  const taskImpact = useMemo(() => {
    if (!project || !selectedTaskForImpact) return null;
    return getTaskDelayImpact(project, selectedTaskForImpact, 5); // Assume 5-day delay
  }, [project, selectedTaskForImpact]);

  if (!project || !analysis) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        title="Critical Path Analysis"
      >
        <Empty description="No project loaded" />
      </Modal>
    );
  }

  const criticalPathPercentage = (analysis.criticalPath.length / analysis.allTasks.length) * 100;
  const avgSlack =
    analysis.allTasks.filter((t) => !t.isCritical).reduce((sum, t) => sum + t.slack, 0) /
    Math.max(analysis.allTasks.filter((t) => !t.isCritical).length, 1);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      title={
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: colorValues.primary[600] }} />
          <span>Critical Path Analysis</span>
        </div>
      }
      styles={{
        body: { maxHeight: "75vh", overflowY: "auto" },
      }}
    >
      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
        items={[
          {
            key: "overview",
            label: (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Overview</span>
              </div>
            ),
            children: <OverviewTab analysis={analysis} />,
          },
          {
            key: "critical-tasks",
            label: (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Tasks ({analysis.criticalPath.length})</span>
              </div>
            ),
            children: (
              <CriticalTasksTab
                tasks={analysis.criticalPath}
                longestChain={analysis.longestChain}
                onHighlightTask={onHighlightTask}
              />
            ),
          },
          {
            key: "all-tasks",
            label: (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All Tasks</span>
              </div>
            ),
            children: (
              <AllTasksTab
                tasks={analysis.allTasks}
                onSelectTask={setSelectedTaskForImpact}
                selectedTask={selectedTaskForImpact}
                onHighlightTask={onHighlightTask}
              />
            ),
          },
          {
            key: "optimization",
            label: (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Optimization</span>
              </div>
            ),
            children: <OptimizationTab suggestions={compressionSuggestions} />,
          },
        ]}
      />
    </Modal>
  );
}

// Overview Tab
function OverviewTab({ analysis }: { analysis: ReturnType<typeof calculateCriticalPath> }) {
  const criticalPercentage = (analysis.criticalPath.length / analysis.allTasks.length) * 100;
  const nonCriticalTasks = analysis.allTasks.filter((t) => !t.isCritical);
  const avgSlack =
    nonCriticalTasks.reduce((sum, t) => sum + t.slack, 0) / Math.max(nonCriticalTasks.length, 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Project Duration"
          value={`${analysis.projectDuration} days`}
          icon={<Clock className="w-5 h-5" />}
          color={colorValues.primary[500]}
        />
        <MetricCard
          label="Critical Tasks"
          value={`${analysis.criticalPath.length}`}
          subtitle={`${criticalPercentage.toFixed(0)}% of total`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={colorValues.error[500]}
        />
        <MetricCard
          label="Total Slack"
          value={`${analysis.totalSlack} days`}
          icon={<TrendingUp className="w-5 h-5" />}
          color={colorValues.success[600]}
        />
        <MetricCard
          label="Avg Slack"
          value={`${avgSlack.toFixed(1)} days`}
          subtitle="Per non-critical task"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color={colorValues.warning[600]}
        />
      </div>

      {/* Project Health */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: "#FAFAFA",
          borderColor: colorValues.neutral[200],
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
          <span className="font-semibold text-sm" style={{ color: colorValues.neutral[900] }}>
            Project Health Assessment
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm" style={{ color: colorValues.neutral[600] }}>
                Schedule Flexibility
              </span>
              <span className="text-sm font-semibold" style={{ color: colorValues.neutral[900] }}>
                {criticalPercentage < 40 ? "High" : criticalPercentage < 60 ? "Medium" : "Low"}
              </span>
            </div>
            <Progress
              percent={100 - criticalPercentage}
              strokeColor={
                criticalPercentage < 40
                  ? colorValues.success[600]
                  : criticalPercentage < 60
                    ? colorValues.warning[600]
                    : colorValues.error[500]
              }
              showInfo={false}
            />
          </div>

          {criticalPercentage > 60 && (
            <Alert
              type="warning"
              message="High Risk Schedule"
              description="Over 60% of tasks are on the critical path. Consider adding buffer time or resources."
              showIcon
            />
          )}
        </div>
      </div>

      {/* Risky Tasks */}
      {analysis.riskyTasks.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: colorValues.neutral[900] }}>
            <AlertTriangle
              className="w-4 h-4 inline mr-2"
              style={{ color: colorValues.warning[600] }}
            />
            Risky Tasks (Low Slack)
          </h4>
          <div className="space-y-2">
            {analysis.riskyTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: withOpacity(colorValues.warning[500], 0.05),
                  borderColor: colorValues.warning[200],
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: colorValues.neutral[900] }}>
                    {task.name}
                  </div>
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    {task.phaseName}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: colorValues.warning[700] }}
                  >
                    {task.slack} day{task.slack !== 1 ? "s" : ""} slack
                  </div>
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    {task.duration} days duration
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Milestones */}
      {analysis.milestones.filter((m) => m.isCritical).length > 0 && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: colorValues.neutral[900] }}>
            <Target className="w-4 h-4 inline mr-2" style={{ color: colorValues.error[500] }} />
            Critical Milestones
          </h4>
          <div className="space-y-2">
            {analysis.milestones
              .filter((m) => m.isCritical)
              .map((milestone, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    backgroundColor: withOpacity(colorValues.error[500], 0.05),
                    borderColor: colorValues.error[200],
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: colorValues.neutral[900] }}>
                    {milestone.name}
                  </span>
                  <span className="text-sm" style={{ color: colorValues.neutral[600] }}>
                    {milestone.date}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Critical Tasks Tab
function CriticalTasksTab({
  tasks,
  longestChain,
  onHighlightTask,
}: {
  tasks: CriticalPathTask[];
  longestChain: string[];
  onHighlightTask?: (taskId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Alert
        type="error"
        message="Critical Path Tasks"
        description="Any delay in these tasks will delay the entire project. Monitor closely and allocate resources accordingly."
        showIcon
      />

      <div className="space-y-2">
        {tasks
          .sort((a, b) => a.earlyStart - b.earlyStart)
          .map((task, idx) => {
            const isInLongestChain = longestChain.includes(task.id);
            return (
              <div
                key={task.id}
                className="p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md"
                style={{
                  backgroundColor: isInLongestChain
                    ? withOpacity(colorValues.error[500], 0.08)
                    : "#fff",
                  borderColor: isInLongestChain ? colorValues.error[300] : colorValues.neutral[200],
                }}
                onClick={() => onHighlightTask?.(task.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isInLongestChain && (
                        <div
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: colorValues.error[500],
                            color: "#fff",
                          }}
                        >
                          Longest Chain
                        </div>
                      )}
                      <span
                        className="text-sm font-semibold"
                        style={{ color: colorValues.neutral[900] }}
                      >
                        {task.name}
                      </span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: colorValues.neutral[500] }}>
                      {task.phaseName}
                    </div>
                    <div
                      className="flex items-center gap-4 text-xs"
                      style={{ color: colorValues.neutral[600] }}
                    >
                      <span>Duration: {task.duration} days</span>
                      <span>•</span>
                      <span>ES: Day {task.earlyStart}</span>
                      <span>•</span>
                      <span>EF: Day {task.earlyFinish}</span>
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: colorValues.neutral[400] }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// All Tasks Tab
function AllTasksTab({
  tasks,
  onSelectTask,
  selectedTask,
  onHighlightTask,
}: {
  tasks: CriticalPathTask[];
  onSelectTask: (taskId: string) => void;
  selectedTask: string | null;
  onHighlightTask?: (taskId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {tasks
        .sort((a, b) => a.earlyStart - b.earlyStart)
        .map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm"
            style={{
              backgroundColor: task.isCritical ? withOpacity(colorValues.error[500], 0.05) : "#fff",
              borderColor: task.isCritical ? colorValues.error[200] : colorValues.neutral[200],
            }}
            onClick={() => {
              onSelectTask(task.id);
              onHighlightTask?.(task.id);
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {task.isCritical && (
                    <AlertTriangle
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: colorValues.error[500] }}
                    />
                  )}
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: colorValues.neutral[900] }}
                  >
                    {task.name}
                  </span>
                </div>
                <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                  {task.phaseName}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    Slack
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{
                      color: task.isCritical
                        ? colorValues.error[600]
                        : task.slack <= 2
                          ? colorValues.warning[600]
                          : colorValues.success[600],
                    }}
                  >
                    {task.slack} days
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    Duration
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: colorValues.neutral[900] }}
                  >
                    {task.duration} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// Optimization Tab
function OptimizationTab({
  suggestions,
}: {
  suggestions: ReturnType<typeof getScheduleCompressionSuggestions> | null;
}) {
  if (!suggestions) return <Empty />;

  return (
    <div className="space-y-6">
      {/* Crashing Opportunities */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
          <span style={{ color: colorValues.neutral[900] }}>Crashing Opportunities</span>
        </h4>
        <p className="text-sm mb-4" style={{ color: colorValues.neutral[600] }}>
          Add more resources to these critical tasks to reduce project duration.
        </p>
        <div className="space-y-2">
          {suggestions.crashingOpportunities.map((opp) => (
            <div
              key={opp.taskId}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: withOpacity(colorValues.primary[500], 0.03),
                borderColor: colorValues.primary[200],
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: colorValues.neutral[900] }}
                  >
                    {opp.taskName}
                  </div>
                  <div className="text-xs mb-2" style={{ color: colorValues.neutral[500] }}>
                    {opp.reason}
                  </div>
                  <div
                    className="text-xs px-2 py-1 rounded inline-block"
                    style={{
                      backgroundColor:
                        opp.effort === "low"
                          ? withOpacity(colorValues.success[600], 0.1)
                          : opp.effort === "medium"
                            ? withOpacity(colorValues.warning[600], 0.1)
                            : withOpacity(colorValues.error[500], 0.1),
                      color:
                        opp.effort === "low"
                          ? colorValues.success[700]
                          : opp.effort === "medium"
                            ? colorValues.warning[700]
                            : colorValues.error[600],
                    }}
                  >
                    {opp.effort} effort
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: colorValues.primary[600] }}>
                    -{opp.potentialSavingsDays} days
                  </div>
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    potential savings
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fast-tracking Opportunities */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: colorValues.success[600] }} />
          <span style={{ color: colorValues.neutral[900] }}>Fast-tracking Opportunities</span>
        </h4>
        <p className="text-sm mb-4" style={{ color: colorValues.neutral[600] }}>
          Run these tasks in parallel to compress the schedule. Higher risk but significant time
          savings.
        </p>
        <div className="space-y-2">
          {suggestions.fastTrackingOpportunities.map((opp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: withOpacity(colorValues.success[600], 0.03),
                borderColor: colorValues.success[200],
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm font-medium" style={{ color: colorValues.neutral[900] }}>
                  {opp.task1Name}
                </div>
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: colorValues.neutral[400] }}
                />
                <div className="text-sm font-medium" style={{ color: colorValues.neutral[900] }}>
                  {opp.task2Name}
                </div>
              </div>
              <div className="text-xs mb-2" style={{ color: colorValues.neutral[500] }}>
                {opp.reason}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor:
                      opp.risk === "low"
                        ? withOpacity(colorValues.success[600], 0.1)
                        : opp.risk === "medium"
                          ? withOpacity(colorValues.warning[600], 0.1)
                          : withOpacity(colorValues.error[500], 0.1),
                    color:
                      opp.risk === "low"
                        ? colorValues.success[700]
                        : opp.risk === "medium"
                          ? colorValues.warning[700]
                          : colorValues.error[600],
                  }}
                >
                  {opp.risk} risk
                </div>
                <div className="text-sm font-semibold" style={{ color: colorValues.success[700] }}>
                  -{opp.potentialSavingsDays} days potential
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: withOpacity(color, 0.05),
        borderColor: withOpacity(color, 0.2),
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-xs font-medium" style={{ color: colorValues.neutral[600] }}>
          {label}
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-xl font-bold mb-0.5" style={{ color: colorValues.neutral[900] }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
