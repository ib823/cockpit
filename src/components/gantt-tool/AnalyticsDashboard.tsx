/**
 * Advanced Analytics Dashboard
 *
 * Comprehensive project insights with charts and metrics
 */

'use client';

import { useMemo, useState } from 'react';
import { Modal, Tabs, Progress, Alert, Empty, Card, Statistic } from 'antd';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Activity,
  DollarSign,
  Calendar,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type { GanttProject } from '@/types/gantt-tool';
import { analyzeProject, type ProjectAnalytics } from '@/lib/project-analytics/analytics';
import { colorValues, getElevationShadow, withOpacity, spacing } from '@/lib/design-system';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsDashboardProps {
  open: boolean;
  onClose: () => void;
  project: GanttProject | null;
}

export function AnalyticsDashboard({ open, onClose, project }: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!project) return null;
    return analyzeProject(project);
  }, [project]);

  if (!project || !analytics) {
    return (
      <Modal open={open} onCancel={onClose} footer={null} width={1200} title="Analytics Dashboard">
        <Empty description="No project loaded" />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      title={
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: colorValues.primary[600] }} />
          <span>Analytics Dashboard</span>
          <ProjectHealthBadge health={analytics.overview.projectHealth} />
        </div>
      }
      styles={{
        body: { maxHeight: '80vh', overflowY: 'auto' },
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
            children: <OverviewTab analytics={analytics} />,
          },
          {
            key: 'burndown',
            label: (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Burndown</span>
              </div>
            ),
            children: <BurndownTab analytics={analytics} />,
          },
          {
            key: 'velocity',
            label: (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Velocity</span>
              </div>
            ),
            children: <VelocityTab analytics={analytics} />,
          },
          {
            key: 'resources',
            label: (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Resources</span>
              </div>
            ),
            children: <ResourcesTab analytics={analytics} />,
          },
          {
            key: 'risks',
            label: (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Risks ({analytics.risks.length})</span>
              </div>
            ),
            children: <RisksTab analytics={analytics} />,
          },
        ]}
      />
    </Modal>
  );
}

// Overview Tab
function OverviewTab({ analytics }: { analytics: ProjectAnalytics }) {
  const { overview, trends, earnedValue } = analytics;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completion"
          value={`${overview.completionPercentage.toFixed(1)}%`}
          subtitle={`${overview.completedTasks} of ${overview.totalTasks} tasks`}
          color={colorValues.success[600]}
          trend={
            trends.completionTrend.direction === 'up'
              ? { direction: 'up' as const, value: trends.completionTrend.rate.toFixed(1) }
              : undefined
          }
        />
        <MetricCard
          icon={<Calendar className="w-5 h-5" />}
          label="Days Remaining"
          value={overview.daysRemaining.toString()}
          subtitle={`${overview.daysElapsed} days elapsed`}
          color={colorValues.primary[500]}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Burn Rate"
          value={analytics.burndown.currentBurnRate.toFixed(2)}
          subtitle="tasks per day"
          color={colorValues.warning[600]}
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="Velocity"
          value={analytics.velocity.averageVelocity.toFixed(1)}
          subtitle="tasks per week"
          color={colorValues.primary[600]}
          trend={
            trends.velocityTrend.direction === 'up'
              ? { direction: 'up' as const, value: trends.velocityTrend.rate.toFixed(1) }
              : trends.velocityTrend.direction === 'down'
              ? { direction: 'down' as const, value: trends.velocityTrend.rate.toFixed(1) }
              : undefined
          }
        />
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: colorValues.neutral[700] }}>
            Overall Progress
          </span>
          <span className="text-sm font-semibold" style={{ color: colorValues.neutral[900] }}>
            {overview.completionPercentage.toFixed(1)}%
          </span>
        </div>
        <Progress
          percent={overview.completionPercentage}
          strokeColor={{
            '0%': colorValues.primary[500],
            '100%': colorValues.success[600],
          }}
          trailColor={colorValues.neutral[200]}
        />
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="text-center">
            <div style={{ color: colorValues.neutral[500] }}>Completed</div>
            <div className="font-semibold" style={{ color: colorValues.success[600] }}>
              {overview.completedTasks}
            </div>
          </div>
          <div className="text-center">
            <div style={{ color: colorValues.neutral[500] }}>In Progress</div>
            <div className="font-semibold" style={{ color: colorValues.warning[600] }}>
              {overview.inProgressTasks}
            </div>
          </div>
          <div className="text-center">
            <div style={{ color: colorValues.neutral[500] }}>Not Started</div>
            <div className="font-semibold" style={{ color: colorValues.neutral[600] }}>
              {overview.notStartedTasks}
            </div>
          </div>
        </div>
      </div>

      {/* EVM Metrics */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" style={{ color: colorValues.success[600] }} />
          <span style={{ color: colorValues.neutral[900] }}>Earned Value Management</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EVMCard label="SPI" value={earnedValue.schedulePerformanceIndex} isSPI />
          <EVMCard label="CPI" value={earnedValue.costPerformanceIndex} isCPI />
          <EVMCard
            label="Schedule Variance"
            value={earnedValue.scheduleVariance}
            format="currency"
            isVariance
          />
          <EVMCard
            label="Cost Variance"
            value={earnedValue.costVariance}
            format="currency"
            isVariance
          />
        </div>
      </div>

      {/* Forecast */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: withOpacity(colorValues.primary[500], 0.03),
          borderColor: colorValues.primary[200],
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
          <span className="font-semibold" style={{ color: colorValues.neutral[900] }}>
            Completion Forecast
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: withOpacity(colorValues.primary[500], 0.1),
              color: colorValues.primary[700],
            }}
          >
            {trends.predictions.confidence}% confidence
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
              Best Case
            </div>
            <div className="text-sm font-semibold" style={{ color: colorValues.success[600] }}>
              {trends.predictions.bestCaseDate}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
              Likely
            </div>
            <div className="text-sm font-semibold" style={{ color: colorValues.primary[600] }}>
              {trends.predictions.likelyCompletionDate}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
              Worst Case
            </div>
            <div className="text-sm font-semibold" style={{ color: colorValues.error[500] }}>
              {trends.predictions.worstCaseDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Burndown Tab
function BurndownTab({ analytics }: { analytics: ProjectAnalytics }) {
  const { burndown } = analytics;

  const chartData = {
    labels: burndown.dates,
    datasets: [
      {
        label: 'Ideal Remaining',
        data: burndown.idealRemaining,
        borderColor: colorValues.neutral[300],
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Actual Remaining',
        data: burndown.actualRemaining,
        borderColor: colorValues.primary[500],
        backgroundColor: withOpacity(colorValues.primary[500], 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tasks Remaining',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Alert
        type={burndown.isAheadOfSchedule ? 'success' : 'warning'}
        message={
          burndown.isAheadOfSchedule
            ? 'Project is ahead of schedule'
            : 'Project is behind schedule'
        }
        description={`Projected completion: ${burndown.projectedCompletion} (Burn rate: ${burndown.currentBurnRate.toFixed(2)} tasks/day)`}
        showIcon
      />

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Total Work"
            value={burndown.totalWork}
            suffix="tasks"
            valueStyle={{ color: colorValues.neutral[900] }}
          />
        </Card>
        <Card>
          <Statistic
            title="Burn Rate"
            value={burndown.currentBurnRate.toFixed(2)}
            suffix="tasks/day"
            prefix={<Activity className="w-4 h-4" />}
            valueStyle={{ color: colorValues.primary[600] }}
          />
        </Card>
        <Card>
          <Statistic
            title="Remaining"
            value={burndown.actualRemaining[burndown.actualRemaining.length - 1]}
            suffix="tasks"
            valueStyle={{ color: colorValues.warning[600] }}
          />
        </Card>
      </div>
    </div>
  );
}

// Velocity Tab
function VelocityTab({ analytics }: { analytics: ProjectAnalytics }) {
  const { velocity } = analytics;

  const chartData = {
    labels: velocity.weeks,
    datasets: [
      {
        label: 'Tasks Completed',
        data: velocity.velocity,
        backgroundColor: colorValues.primary[500],
        borderColor: colorValues.primary[600],
        borderWidth: 2,
      },
      {
        label: 'Average Velocity',
        data: velocity.weeks.map(() => velocity.averageVelocity),
        borderColor: colorValues.success[600],
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        type: 'line' as const,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tasks Completed',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Week',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Trend Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: colorValues.neutral[700] }}>
            Velocity Trend:
          </span>
          {velocity.trend === 'increasing' && (
            <div className="flex items-center gap-1" style={{ color: colorValues.success[600] }}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Increasing</span>
            </div>
          )}
          {velocity.trend === 'decreasing' && (
            <div className="flex items-center gap-1" style={{ color: colorValues.error[500] }}>
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-semibold">Decreasing</span>
            </div>
          )}
          {velocity.trend === 'stable' && (
            <span className="text-sm font-semibold" style={{ color: colorValues.neutral[600] }}>
              Stable
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Average Velocity"
            value={velocity.averageVelocity.toFixed(1)}
            suffix="tasks/week"
            valueStyle={{ color: colorValues.primary[600] }}
          />
        </Card>
        <Card>
          <Statistic
            title="Next Week Forecast"
            value={velocity.forecast.nextWeek.toFixed(1)}
            suffix="tasks"
            valueStyle={{ color: colorValues.success[600] }}
          />
        </Card>
        <Card>
          <Statistic
            title="2-Week Forecast"
            value={velocity.forecast.nextTwoWeeks.toFixed(1)}
            suffix="tasks"
            valueStyle={{ color: colorValues.warning[600] }}
          />
        </Card>
      </div>
    </div>
  );
}

// Resources Tab
function ResourcesTab({ analytics }: { analytics: ProjectAnalytics }) {
  const { resources } = analytics;

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Avg Allocation"
            value={resources.overall.averageAllocation.toFixed(1)}
            suffix="%"
            valueStyle={{ color: colorValues.primary[600] }}
          />
        </Card>
        <Card>
          <Statistic
            title="Utilization Rate"
            value={resources.overall.utilizationRate.toFixed(1)}
            suffix="%"
            valueStyle={{ color: colorValues.success[600] }}
          />
        </Card>
        <Card>
          <Statistic
            title="Total Resources"
            value={resources.resources.length}
            valueStyle={{ color: colorValues.neutral[900] }}
          />
        </Card>
      </div>

      {/* Individual Resources */}
      <div className="space-y-3">
        {resources.resources.map((resource) => (
          <div
            key={resource.id}
            className="p-4 rounded-xl border"
            style={{
              backgroundColor:
                resource.status === 'optimal'
                  ? withOpacity(colorValues.success[600], 0.03)
                  : resource.status === 'overallocated'
                  ? withOpacity(colorValues.error[500], 0.05)
                  : withOpacity(colorValues.warning[600], 0.03),
              borderColor:
                resource.status === 'optimal'
                  ? colorValues.success[200]
                  : resource.status === 'overallocated'
                  ? colorValues.error[200]
                  : colorValues.warning[200],
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: colorValues.neutral[600] }} />
                <span className="font-semibold" style={{ color: colorValues.neutral[900] }}>
                  {resource.name}
                </span>
                <ResourceStatusBadge status={resource.status} />
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
                  Efficiency
                </div>
                <div className="text-sm font-semibold" style={{ color: colorValues.neutral[900] }}>
                  {resource.efficiency.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                  Tasks Assigned
                </div>
                <div className="text-sm font-semibold" style={{ color: colorValues.neutral[900] }}>
                  {resource.tasksAssigned}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: colorValues.neutral[500] }}>
                  Tasks Completed
                </div>
                <div className="text-sm font-semibold" style={{ color: colorValues.success[600] }}>
                  {resource.tasksCompleted}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs" style={{ color: colorValues.neutral[500] }}>
                  Allocation
                </span>
                <span className="text-xs font-semibold" style={{ color: colorValues.neutral[900] }}>
                  {resource.allocation.toFixed(1)}%
                </span>
              </div>
              <Progress
                percent={resource.allocation}
                strokeColor={
                  resource.status === 'optimal'
                    ? colorValues.success[600]
                    : resource.status === 'overallocated'
                    ? colorValues.error[500]
                    : colorValues.warning[600]
                }
                showInfo={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Risks Tab
function RisksTab({ analytics }: { analytics: ProjectAnalytics }) {
  if (analytics.risks.length === 0) {
    return (
      <Empty
        description="No risks identified"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '60px 0' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {analytics.risks.map((risk, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: withOpacity(
              risk.severity === 'high'
                ? colorValues.error[500]
                : risk.severity === 'medium'
                ? colorValues.warning[600]
                : colorValues.neutral[500],
              0.03
            ),
            borderColor:
              risk.severity === 'high'
                ? colorValues.error[200]
                : risk.severity === 'medium'
                ? colorValues.warning[200]
                : colorValues.neutral[200],
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{
                color:
                  risk.severity === 'high'
                    ? colorValues.error[500]
                    : risk.severity === 'medium'
                    ? colorValues.warning[600]
                    : colorValues.neutral[500],
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: colorValues.neutral[900] }}>
                  {risk.title}
                </span>
                <RiskSeverityBadge severity={risk.severity} />
                <RiskTypeBadge type={risk.type} />
              </div>
              <p className="text-sm mb-2" style={{ color: colorValues.neutral[600] }}>
                {risk.description}
              </p>
              <div className="text-xs mb-2" style={{ color: colorValues.neutral[700] }}>
                <strong>Impact:</strong> {risk.impact}
              </div>
              {risk.mitigation && (
                <div
                  className="text-xs p-2 rounded"
                  style={{
                    backgroundColor: withOpacity(colorValues.primary[500], 0.05),
                    color: colorValues.neutral[700],
                  }}
                >
                  <strong>Mitigation:</strong> {risk.mitigation}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper Components
function MetricCard({ icon, label, value, subtitle, color, trend }: any) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: withOpacity(color, 0.05),
        borderColor: withOpacity(color, 0.2),
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium" style={{ color: colorValues.neutral[600] }}>
          {label}
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold" style={{ color: colorValues.neutral[900] }}>
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-0.5" style={{ color }}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-semibold">{trend.value}</span>
          </div>
        )}
      </div>
      {subtitle && (
        <div className="text-xs" style={{ color: colorValues.neutral[500] }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function EVMCard({ label, value, format, isSPI, isCPI, isVariance }: any) {
  let displayValue = value.toFixed(2);
  let color: string = colorValues.neutral[900];

  if (format === 'currency') {
    displayValue = `$${Math.abs(value).toLocaleString()}`;
    color = value >= 0 ? colorValues.success[600] : colorValues.error[500];
  } else if (isSPI || isCPI) {
    color = value >= 1 ? colorValues.success[600] : colorValues.error[500];
  } else if (isVariance) {
    color = value >= 0 ? colorValues.success[600] : colorValues.error[500];
  }

  return (
    <Card size="small">
      <Statistic
        title={label}
        value={displayValue}
        valueStyle={{ color }}
        className="[&_.ant-statistic-content]:text-xl"
        prefix={
          format === 'currency'
            ? value < 0 && '-'
            : (isSPI || isCPI) && (value >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)
        }
      />
    </Card>
  );
}

function ProjectHealthBadge({ health }: { health: string }) {
  const config = {
    excellent: { label: 'Excellent', color: colorValues.success[600] },
    good: { label: 'Good', color: colorValues.primary[500] },
    'at-risk': { label: 'At Risk', color: colorValues.warning[600] },
    critical: { label: 'Critical', color: colorValues.error[500] },
  };

  const { label, color } = config[health as keyof typeof config] || config.good;

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{
        backgroundColor: withOpacity(color, 0.1),
        color,
      }}
    >
      {label}
    </span>
  );
}

function ResourceStatusBadge({ status }: { status: string }) {
  const config = {
    optimal: { label: 'Optimal', color: colorValues.success[600] },
    underutilized: { label: 'Underutilized', color: colorValues.warning[600] },
    overallocated: { label: 'Overallocated', color: colorValues.error[500] },
  };

  const { label, color } = config[status as keyof typeof config] || config.optimal;

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

function RiskSeverityBadge({ severity }: { severity: string }) {
  const config = {
    high: { color: colorValues.error[600] },
    medium: { color: colorValues.warning[600] },
    low: { color: colorValues.neutral[500] },
  };

  const { color } = config[severity as keyof typeof config] || config.medium;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium uppercase"
      style={{
        backgroundColor: withOpacity(color, 0.1),
        color,
      }}
    >
      {severity}
    </span>
  );
}

function RiskTypeBadge({ type }: { type: string }) {
  const labels = {
    schedule: 'Schedule',
    resource: 'Resource',
    dependency: 'Dependency',
    quality: 'Quality',
  };

  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{
        backgroundColor: withOpacity(colorValues.primary[500], 0.1),
        color: colorValues.primary[700],
      }}
    >
      {labels[type as keyof typeof labels] || type}
    </span>
  );
}
