/**
 * Baseline Comparison Panel
 *
 * Visual comparison of project progress against saved baseline
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal, Tabs, Progress, Alert, Empty, Select, Button } from 'antd';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Save,
  Clock,
} from 'lucide-react';
import type { GanttProject } from '@/types/gantt-tool';
import {
  compareToBaseline,
  createBaseline,
  forecastCompletion,
  type ProjectBaseline,
  type BaselineComparison,
  type TaskVariance,
  type PhaseVariance,
} from '@/lib/project-analytics/baseline';
import { colorValues, getElevationShadow, withOpacity, spacing } from '@/lib/design-system';
import { format, parseISO } from 'date-fns';

interface BaselineComparisonPanelProps {
  open: boolean;
  onClose: () => void;
  project: GanttProject | null;
  baselines?: ProjectBaseline[];
  onSaveBaseline?: (baseline: ProjectBaseline) => void;
  onHighlightTask?: (taskId: string) => void;
}

export function BaselineComparisonPanel({
  open,
  onClose,
  project,
  baselines = [],
  onSaveBaseline,
  onHighlightTask,
}: BaselineComparisonPanelProps) {
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(
    baselines[0]?.id || null
  );
  const [selectedTab, setSelectedTab] = useState('overview');

  // Get selected baseline
  const selectedBaseline = useMemo(
    () => baselines.find((b) => b.id === selectedBaselineId) || null,
    [baselines, selectedBaselineId]
  );

  // Calculate comparison
  const comparison = useMemo(() => {
    if (!project || !selectedBaseline) return null;
    return compareToBaseline(project, selectedBaseline);
  }, [project, selectedBaseline]);

  // Calculate forecast
  const forecast = useMemo(() => {
    if (!project || !comparison) return null;
    return forecastCompletion(project, comparison);
  }, [project, comparison]);

  const handleSaveBaseline = () => {
    if (!project || !onSaveBaseline) return;

    const baseline = createBaseline(
      project,
      `Baseline ${format(new Date(), 'MMM dd, yyyy')}`,
      'Automatically created baseline'
    );

    onSaveBaseline(baseline);
    setSelectedBaselineId(baseline.id);
  };

  if (!project) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={1000} title="Baseline Comparison">
        <Empty description="No project loaded" />
      </Modal>
    );
  }

  if (baselines.length === 0) {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={600}
        title="Baseline Comparison"
      >
        <div className="text-center py-12">
          <Save className="w-16 h-16 mx-auto mb-4" style={{ color: colorValues.neutral[300] }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: colorValues.neutral[900] }}>
            No Baselines Saved
          </h3>
          <p className="text-sm mb-6" style={{ color: colorValues.neutral[600] }}>
            Create your first baseline to start tracking project variance
          </p>
          <Button
            type="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveBaseline}
            size="large"
          >
            Save Current as Baseline
          </Button>
        </div>
      </Modal>
    );
  }

  if (!comparison) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={1000} title="Baseline Comparison">
        <Empty description="Select a baseline to compare" />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: colorValues.primary[600] }} />
            <span>Baseline Comparison</span>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedBaselineId}
              onChange={setSelectedBaselineId}
              style={{ width: 250 }}
              options={baselines.map((b) => ({
                value: b.id,
                label: `${b.name} (${format(parseISO(b.createdAt), 'MMM dd, yyyy')})`,
              }))}
            />
            <Button
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveBaseline}
            >
              Save New Baseline
            </Button>
          </div>
        </div>
      }
      styles={{
        body: { maxHeight: '75vh', overflowY: 'auto' },
      }}
    >
      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
        items={[
          {
            key: 'overview',
            label: (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Overview</span>
              </div>
            ),
            children: <OverviewTab comparison={comparison} forecast={forecast} />,
          },
          {
            key: 'phases',
            label: (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Phases</span>
              </div>
            ),
            children: <PhasesTab phases={comparison.phases} />,
          },
          {
            key: 'tasks',
            label: (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tasks</span>
              </div>
            ),
            children: <TasksTab tasks={comparison.tasks} onHighlightTask={onHighlightTask} />,
          },
          {
            key: 'issues',
            label: (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Issues ({comparison.summary.criticalIssues.length + comparison.summary.warnings.length})</span>
              </div>
            ),
            children: <IssuesTab comparison={comparison} />,
          },
        ]}
      />
    </Modal>
  );
}

// Overview Tab
function OverviewTab({
  comparison,
  forecast,
}: {
  comparison: BaselineComparison;
  forecast: ReturnType<typeof forecastCompletion> | null;
}) {
  const isAhead = comparison.overall.scheduleVarianceDays > 0;
  const isBehind = comparison.overall.scheduleVarianceDays < 0;

  return (
    <div className="space-y-6">
      {/* Schedule Status Banner */}
      <Alert
        type={isAhead ? 'success' : isBehind ? 'error' : 'info'}
        message={
          <div className="flex items-center gap-2">
            {isAhead && <TrendingUp className="w-5 h-5" />}
            {isBehind && <TrendingDown className="w-5 h-5" />}
            {!isAhead && !isBehind && <Minus className="w-5 h-5" />}
            <span className="font-semibold">
              {isAhead && `Project is ${comparison.overall.scheduleVarianceDays} days ahead of baseline`}
              {isBehind && `Project is ${Math.abs(comparison.overall.scheduleVarianceDays)} days behind baseline`}
              {!isAhead && !isBehind && 'Project is on track with baseline'}
            </span>
          </div>
        }
        description={`Schedule Performance Index: ${comparison.overall.schedulePerformanceIndex.toFixed(2)} (${
          comparison.overall.schedulePerformanceIndex >= 1 ? 'Good' : 'Needs Attention'
        })`}
        showIcon={false}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Completion"
          baseline={comparison.overall.completionPercentage.baseline}
          actual={comparison.overall.completionPercentage.actual}
          variance={comparison.overall.completionPercentage.variance}
          format="percentage"
          icon={<Target className="w-5 h-5" />}
        />
        <MetricCard
          label="Duration"
          baseline={comparison.overall.duration.baseline}
          actual={comparison.overall.duration.actual}
          variance={comparison.overall.duration.variance}
          format="days"
          icon={<Clock className="w-5 h-5" />}
          reverseGoodBad
        />
        <MetricCard
          label="Tasks Ahead"
          value={comparison.summary.tasksAhead}
          total={comparison.tasks.length}
          icon={<TrendingUp className="w-5 h-5" />}
          color={colorValues.success[600]}
        />
        <MetricCard
          label="Tasks Behind"
          value={comparison.summary.tasksBehind}
          total={comparison.tasks.length}
          icon={<TrendingDown className="w-5 h-5" />}
          color={colorValues.error[500]}
        />
      </div>

      {/* Progress Overview */}
      <div>
        <h4 className="font-semibold mb-3" style={{ color: colorValues.neutral[900] }}>
          Task Status Distribution
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <StatusBar
            label="Ahead of Schedule"
            count={comparison.summary.tasksAhead}
            total={comparison.tasks.length}
            color={colorValues.success[600]}
          />
          <StatusBar
            label="On Track"
            count={comparison.summary.tasksOnTrack}
            total={comparison.tasks.length}
            color={colorValues.primary[500]}
          />
          <StatusBar
            label="Behind Schedule"
            count={comparison.summary.tasksBehind}
            total={comparison.tasks.length}
            color={colorValues.error[500]}
          />
        </div>
      </div>

      {/* Forecast */}
      {forecast && (
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: withOpacity(colorValues.primary[500], 0.03),
            borderColor: colorValues.primary[200],
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
            <span className="font-semibold text-sm" style={{ color: colorValues.neutral[900] }}>
              Completion Forecast
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  forecast.confidence === 'high'
                    ? withOpacity(colorValues.success[600], 0.1)
                    : forecast.confidence === 'medium'
                    ? withOpacity(colorValues.warning[600], 0.1)
                    : withOpacity(colorValues.error[500], 0.1),
                color:
                  forecast.confidence === 'high'
                    ? colorValues.success[700]
                    : forecast.confidence === 'medium'
                    ? colorValues.warning[700]
                    : colorValues.error[600],
              }}
            >
              {forecast.confidence} confidence
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                Forecast End Date
              </div>
              <div className="text-lg font-bold" style={{ color: colorValues.neutral[900] }}>
                {format(parseISO(forecast.forecastEndDate), 'MMM dd, yyyy')}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                Variance from Baseline
              </div>
              <div
                className="text-lg font-bold"
                style={{
                  color:
                    forecast.varianceFromBaseline < 0
                      ? colorValues.success[600]
                      : forecast.varianceFromBaseline > 0
                      ? colorValues.error[500]
                      : colorValues.neutral[900],
                }}
              >
                {forecast.varianceFromBaseline === 0
                  ? 'On time'
                  : `${Math.abs(forecast.varianceFromBaseline)} days ${
                      forecast.varianceFromBaseline < 0 ? 'early' : 'late'
                    }`}
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1" style={{ color: colorValues.neutral[600] }}>
            <div className="font-semibold mb-1">Assumptions:</div>
            {forecast.assumptions.map((assumption, idx) => (
              <div key={idx}>• {assumption}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Phases Tab
function PhasesTab({ phases }: { phases: PhaseVariance[] }) {
  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <div
          key={phase.phaseId}
          className="p-4 rounded-xl border"
          style={{
            backgroundColor:
              phase.status === 'ahead'
                ? withOpacity(colorValues.success[600], 0.03)
                : phase.status === 'behind'
                ? withOpacity(colorValues.error[500], 0.03)
                : '#fff',
            borderColor:
              phase.status === 'ahead'
                ? colorValues.success[200]
                : phase.status === 'behind'
                ? colorValues.error[200]
                : colorValues.neutral[200],
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold" style={{ color: colorValues.neutral[900] }}>
                  {phase.phaseName}
                </span>
                <StatusBadge status={phase.status} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                End Date Variance
              </div>
              <div
                className="text-sm font-semibold"
                style={{
                  color:
                    phase.variance.endDateDays < 0
                      ? colorValues.success[600]
                      : phase.variance.endDateDays > 0
                      ? colorValues.error[500]
                      : colorValues.neutral[900],
                }}
              >
                {phase.variance.endDateDays === 0
                  ? 'On time'
                  : `${Math.abs(phase.variance.endDateDays)} days ${
                      phase.variance.endDateDays < 0 ? 'early' : 'late'
                    }`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                Baseline Duration
              </div>
              <div style={{ color: colorValues.neutral[900] }}>
                {phase.baseline.duration} days
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                Actual Duration
              </div>
              <div style={{ color: colorValues.neutral[900] }}>
                {phase.actual.duration} days
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                Variance
              </div>
              <div
                style={{
                  color:
                    phase.variance.durationDays > 0
                      ? colorValues.error[500]
                      : phase.variance.durationDays < 0
                      ? colorValues.success[600]
                      : colorValues.neutral[900],
                }}
              >
                {phase.variance.durationDays === 0
                  ? 'No change'
                  : `${phase.variance.durationDays > 0 ? '+' : ''}${phase.variance.durationDays} days`}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tasks Tab
function TasksTab({
  tasks,
  onHighlightTask,
}: {
  tasks: TaskVariance[];
  onHighlightTask?: (taskId: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'ahead' | 'behind' | 'at-risk'>('all');

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 200 }}
          options={[
            { value: 'all', label: `All Tasks (${tasks.length})` },
            {
              value: 'ahead',
              label: `Ahead (${tasks.filter((t) => t.status === 'ahead').length})`,
            },
            {
              value: 'behind',
              label: `Behind (${tasks.filter((t) => t.status === 'behind').length})`,
            },
            {
              value: 'at-risk',
              label: `At Risk (${tasks.filter((t) => t.status === 'at-risk').length})`,
            },
          ]}
        />
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.taskId}
            className="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all duration-200"
            style={{
              backgroundColor:
                task.status === 'ahead'
                  ? withOpacity(colorValues.success[600], 0.03)
                  : task.status === 'at-risk'
                  ? withOpacity(colorValues.error[500], 0.05)
                  : '#fff',
              borderColor:
                task.status === 'ahead'
                  ? colorValues.success[200]
                  : task.status === 'at-risk' || task.status === 'behind'
                  ? colorValues.error[200]
                  : colorValues.neutral[200],
            }}
            onClick={() => onHighlightTask?.(task.taskId)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate" style={{ color: colorValues.neutral[900] }}>
                    {task.taskName}
                  </span>
                  <StatusBadge status={task.status} />
                  {task.isCritical && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: withOpacity(colorValues.error[500], 0.1),
                        color: colorValues.error[600],
                      }}
                    >
                      Critical
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                  {task.phaseName}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                    Progress
                  </div>
                  <div className="text-sm font-semibold" style={{ color: colorValues.neutral[900] }}>
                    {task.actual.progress}%
                    {task.variance.progressPercentage !== 0 && (
                      <span
                        className="text-xs ml-1"
                        style={{
                          color:
                            task.variance.progressPercentage > 0
                              ? colorValues.success[600]
                              : colorValues.error[500],
                        }}
                      >
                        ({task.variance.progressPercentage > 0 ? '+' : ''}
                        {task.variance.progressPercentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Issues Tab
function IssuesTab({ comparison }: { comparison: BaselineComparison }) {
  return (
    <div className="space-y-4">
      {comparison.summary.criticalIssues.length === 0 &&
        comparison.summary.warnings.length === 0 && (
          <Empty description="No issues detected" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}

      {comparison.summary.criticalIssues.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: colorValues.error[500] }} />
            <span style={{ color: colorValues.neutral[900] }}>
              Critical Issues ({comparison.summary.criticalIssues.length})
            </span>
          </h4>
          <div className="space-y-2">
            {comparison.summary.criticalIssues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {comparison.summary.warnings.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: colorValues.warning[600] }} />
            <span style={{ color: colorValues.neutral[900] }}>
              Warnings ({comparison.summary.warnings.length})
            </span>
          </h4>
          <div className="space-y-2">
            {comparison.summary.warnings.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({
  label,
  baseline,
  actual,
  variance,
  format,
  icon,
  value,
  total,
  color,
  reverseGoodBad = false,
}: any) {
  if (value !== undefined) {
    return (
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: withOpacity(color || colorValues.neutral[500], 0.05),
          borderColor: withOpacity(color || colorValues.neutral[500], 0.2),
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium" style={{ color: colorValues.neutral[600] }}>
            {label}
          </div>
          <div style={{ color: color || colorValues.neutral[500] }}>{icon}</div>
        </div>
        <div className="text-2xl font-bold" style={{ color: colorValues.neutral[900] }}>
          {value}
        </div>
        {total && (
          <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
            out of {total}
          </div>
        )}
      </div>
    );
  }

  const isPositive = reverseGoodBad ? variance < 0 : variance > 0;
  const isNegative = reverseGoodBad ? variance > 0 : variance < 0;

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: withOpacity(colorValues.neutral[500], 0.03),
        borderColor: colorValues.neutral[200],
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium" style={{ color: colorValues.neutral[600] }}>
          {label}
        </div>
        <div style={{ color: colorValues.neutral[500] }}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-2xl font-bold" style={{ color: colorValues.neutral[900] }}>
          {format === 'percentage' ? `${actual.toFixed(1)}%` : `${actual} ${format}`}
        </div>
        {variance !== 0 && (
          <div
            className="text-sm font-semibold flex items-center gap-0.5"
            style={{
              color: isPositive
                ? colorValues.success[600]
                : isNegative
                ? colorValues.error[500]
                : colorValues.neutral[600],
            }}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {variance > 0 ? '+' : ''}
            {format === 'percentage' ? `${variance.toFixed(1)}%` : `${variance}`}
          </div>
        )}
      </div>
      <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
        Baseline: {format === 'percentage' ? `${baseline.toFixed(1)}%` : `${baseline} ${format}`}
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: any) {
  const percentage = (count / total) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: colorValues.neutral[600] }}>
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color: colorValues.neutral[900] }}>
          {count}
        </span>
      </div>
      <Progress percent={percentage} strokeColor={color} showInfo={false} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    ahead: { label: 'Ahead', color: colorValues.success[600], bg: colorValues.success[100] },
    'on-track': { label: 'On Track', color: colorValues.primary[600], bg: colorValues.primary[100] },
    behind: { label: 'Behind', color: colorValues.warning[600], bg: colorValues.warning[100] },
    'at-risk': { label: 'At Risk', color: colorValues.error[600], bg: colorValues.error[100] },
  };

  const { label, color, bg } = config[status as keyof typeof config] || config['on-track'];

  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{
        backgroundColor: withOpacity(color, 0.1),
        color,
      }}
    >
      {label}
    </span>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const isCritical = issue.type === 'critical';

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: withOpacity(
          isCritical ? colorValues.error[500] : colorValues.warning[600],
          0.03
        ),
        borderColor: isCritical ? colorValues.error[200] : colorValues.warning[200],
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: isCritical ? colorValues.error[500] : colorValues.warning[600] }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm" style={{ color: colorValues.neutral[900] }}>
              {issue.title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: withOpacity(
                  isCritical ? colorValues.error[500] : colorValues.warning[600],
                  0.1
                ),
                color: isCritical ? colorValues.error[600] : colorValues.warning[700],
              }}
            >
              {issue.impact} impact
            </span>
          </div>
          <p className="text-sm mb-2" style={{ color: colorValues.neutral[600] }}>
            {issue.description}
          </p>
          {issue.recommendation && (
            <div
              className="text-xs p-2 rounded"
              style={{
                backgroundColor: withOpacity(colorValues.primary[500], 0.05),
                color: colorValues.neutral[700],
              }}
            >
              <strong>Recommendation:</strong> {issue.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
