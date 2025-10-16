/**
 * Mission Control Modal
 *
 * Steve Jobs: "The people who are crazy enough to think they can change the world are the ones who do."
 * Jony Ive: "Our goal is to try to bring a calm and simplicity to what are incredibly complex problems."
 *
 * Full-screen command center for deep project analysis, strategic decisions,
 * and executive presentations. This is where the real work happens.
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal, Tabs, Card, Row, Col, Statistic, Progress, Tag, Table, Empty } from 'antd';
import {
  BarChart3,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Calendar,
} from 'lucide-react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { calculateProjectCost, checkBudgetAlerts } from '@/lib/gantt-tool/cost-calculator';
import { RESOURCE_CATEGORIES } from '@/types/gantt-tool';
import { differenceInBusinessDays } from 'date-fns';
import { OrgChart } from './OrgChart';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MissionControlModal({ isOpen, onClose }: Props) {
  const { currentProject } = useGanttToolStoreV2();
  const [activeTab, setActiveTab] = useState('overview');

  const projectAnalytics = useMemo(() => {
    if (!currentProject) return null;

    const costData = calculateProjectCost(currentProject);
    const budgetAlerts = currentProject.budget ? checkBudgetAlerts(currentProject, costData) : [];

    // Timeline analytics
    const now = new Date();
    const allDates = [
      ...currentProject.phases.map((p) => new Date(p.startDate)),
      ...currentProject.phases.map((p) => new Date(p.endDate)),
    ];
    const projectStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const projectEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const totalDays = differenceInBusinessDays(projectEnd, projectStart);
    const elapsedDays = differenceInBusinessDays(now, projectStart);
    const timeProgress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));

    // Task completion analytics
    const totalTasks = currentProject.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = currentProject.phases.reduce(
      (sum, p) => sum + p.tasks.filter((t) => t.progress === 100).length,
      0
    );
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Resource analytics
    const assignedResources = new Set<string>();
    currentProject.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        task.resourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
      });
      phase.phaseResourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
    });

    const resourceUtilization = currentProject.resources.length > 0
      ? (assignedResources.size / currentProject.resources.length) * 100
      : 0;

    return {
      costData,
      budgetAlerts,
      timeProgress,
      taskProgress,
      resourceUtilization,
      totalDays,
      elapsedDays,
      totalTasks,
      completedTasks,
      totalResources: currentProject.resources.length,
      assignedResources: assignedResources.size,
    };
  }, [currentProject]);

  if (!currentProject || !projectAnalytics) {
    return null;
  }

  const { costData, budgetAlerts, timeProgress, taskProgress, resourceUtilization } = projectAnalytics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentProject.budget?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Health score calculation (0-100)
  const healthScore = useMemo(() => {
    let score = 100;

    // Budget health (30 points)
    if (currentProject.budget) {
      if (costData.budgetUtilization > 100) score -= 30;
      else if (costData.budgetUtilization > 90) score -= 20;
      else if (costData.budgetUtilization > 75) score -= 10;
    }

    // Schedule health (30 points)
    if (timeProgress > taskProgress + 20) score -= 30; // Significantly behind schedule
    else if (timeProgress > taskProgress + 10) score -= 15;

    // Resource health (20 points)
    if (resourceUtilization < 50) score -= 20; // Under-utilizing resources
    else if (resourceUtilization > 90) score -= 10; // Over-allocation risk

    // Active alerts (20 points)
    const activeAlerts = budgetAlerts.filter((a) => a.triggered).length;
    score -= activeAlerts * 10;

    return Math.max(0, Math.min(100, score));
  }, [currentProject.budget, costData, timeProgress, taskProgress, resourceUtilization, budgetAlerts]);

  const healthColor = healthScore >= 80 ? '#52c41a' : healthScore >= 60 ? '#faad14' : '#ff4d4f';
  const healthStatus = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'At Risk';

  // Phase breakdown for table
  const phaseData = currentProject.phases.map((phase) => {
    const phaseTasks = phase.tasks.length;
    const completedPhaseTasks = phase.tasks.filter((t) => t.progress === 100).length;
    const phaseProgress = phaseTasks > 0 ? (completedPhaseTasks / phaseTasks) * 100 : 0;
    const phaseCost = costData.costByPhase.get(phase.id) || 0;

    return {
      key: phase.id,
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
      tasks: phaseTasks,
      completed: completedPhaseTasks,
      progress: phaseProgress,
      cost: phaseCost,
      color: phase.color,
    };
  });

  const phaseColumns = [
    {
      title: 'Phase',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: record.color }} />
          <span className="font-semibold">{text}</span>
        </div>
      ),
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">
          {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Tasks',
      key: 'tasks',
      render: (_: any, record: any) => (
        <span className="text-sm">
          {record.completed}/{record.tasks}
        </span>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => <span className="font-semibold">{formatCurrency(cost)}</span>,
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20, maxWidth: 1600, maxHeight: '90vh' }}
      styles={{ body: { maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' } }}
      footer={null}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">Mission Control</h2>
              <p className="text-sm text-gray-600 m-0">{currentProject.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Project Health</div>
              <div className="text-2xl font-bold" style={{ color: healthColor }}>
                {healthScore}
                <span className="text-sm font-normal text-gray-500 ml-1">/ 100</span>
              </div>
              <Tag color={healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error'}>
                {healthStatus}
              </Tag>
            </div>
          </div>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Overview
              </span>
            ),
            children: (
              <div className="space-y-6">
                {/* Key Metrics */}
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Card className="shadow-sm">
                      <Statistic
                        title="Budget Utilization"
                        value={costData.budgetUtilization}
                        precision={1}
                        suffix="%"
                        prefix={<DollarSign className="w-5 h-5" />}
                        valueStyle={{
                          color: costData.isOverBudget ? '#cf1322' : costData.budgetUtilization > 90 ? '#faad14' : '#3f8600',
                        }}
                      />
                      <Progress
                        percent={Math.min(costData.budgetUtilization, 100)}
                        status={costData.isOverBudget ? 'exception' : 'normal'}
                        size="small"
                        showInfo={false}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {formatCurrency(costData.totalCost)} of {formatCurrency(currentProject.budget?.totalBudget || 0)}
                      </div>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card className="shadow-sm">
                      <Statistic
                        title="Schedule Progress"
                        value={timeProgress}
                        precision={1}
                        suffix="%"
                        prefix={<Clock className="w-5 h-5" />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Progress percent={timeProgress} size="small" showInfo={false} className="mt-2" />
                      <div className="text-xs text-gray-500 mt-2">
                        {projectAnalytics.elapsedDays} of {projectAnalytics.totalDays} business days
                      </div>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card className="shadow-sm">
                      <Statistic
                        title="Task Completion"
                        value={taskProgress}
                        precision={1}
                        suffix="%"
                        prefix={<CheckCircle className="w-5 h-5" />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Progress percent={taskProgress} size="small" showInfo={false} className="mt-2" status="success" />
                      <div className="text-xs text-gray-500 mt-2">
                        {projectAnalytics.completedTasks} of {projectAnalytics.totalTasks} tasks
                      </div>
                    </Card>
                  </Col>

                  <Col span={6}>
                    <Card className="shadow-sm">
                      <Statistic
                        title="Resource Utilization"
                        value={resourceUtilization}
                        precision={1}
                        suffix="%"
                        prefix={<Users className="w-5 h-5" />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                      <Progress percent={resourceUtilization} size="small" showInfo={false} className="mt-2" strokeColor="#722ed1" />
                      <div className="text-xs text-gray-500 mt-2">
                        {projectAnalytics.assignedResources} of {projectAnalytics.totalResources} resources assigned
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Active Alerts */}
                {budgetAlerts.filter((a) => a.triggered).length > 0 && (
                  <Card title={<span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Active Alerts</span>} className="shadow-sm">
                    <div className="space-y-2">
                      {budgetAlerts
                        .filter((a) => a.triggered)
                        .map((alert) => (
                          <div key={alert.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-semibold text-orange-900">{alert.message}</div>
                                {alert.triggeredAt && (
                                  <div className="text-xs text-orange-700 mt-1">
                                    Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}

                {/* Phase Breakdown Table */}
                <Card title="Phase Analysis" className="shadow-sm">
                  <Table
                    dataSource={phaseData}
                    columns={phaseColumns}
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'cost',
            label: (
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Analytics
              </span>
            ),
            children: (
              <div className="space-y-6">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card title="Cost by Phase" className="shadow-sm">
                      <div className="space-y-3">
                        {Array.from(costData.costByPhase.entries()).map(([phaseId, cost]) => {
                          const phase = currentProject.phases.find((p) => p.id === phaseId);
                          const percentage = (cost / costData.laborCost) * 100;
                          return (
                            <div key={phaseId}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: phase?.color }} />
                                  <span className="text-sm font-medium">{phase?.name}</span>
                                </div>
                                <span className="text-sm font-semibold">{formatCurrency(cost)}</span>
                              </div>
                              <Progress percent={percentage} size="small" showInfo={false} strokeColor={phase?.color} />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card title="Cost by Category" className="shadow-sm">
                      <div className="space-y-3">
                        {Array.from(costData.costByCategory.entries()).map(([category, cost]) => {
                          const percentage = (cost / costData.laborCost) * 100;
                          const categoryInfo = RESOURCE_CATEGORIES[category];
                          return (
                            <div key={category}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span>{categoryInfo.icon}</span>
                                  <span className="text-sm font-medium">{categoryInfo.label}</span>
                                </div>
                                <span className="text-sm font-semibold">{formatCurrency(cost)}</span>
                              </div>
                              <Progress percent={percentage} size="small" showInfo={false} strokeColor={categoryInfo.color} />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card title="Budget Summary" className="shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b">
                          <span className="text-gray-600">Total Budget</span>
                          <span className="font-bold text-lg">{formatCurrency(currentProject.budget?.totalBudget || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Labor Cost</span>
                          <span className="font-semibold">{formatCurrency(costData.laborCost)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Contingency ({currentProject.budget?.contingencyPercentage}%)</span>
                          <span className="font-semibold">{formatCurrency(costData.contingency)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-gray-600">Total Cost</span>
                          <span className="font-bold text-lg">{formatCurrency(costData.totalCost)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3">
                          <span className="text-gray-600">Remaining</span>
                          <span className={`font-bold text-lg ${costData.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(costData.remainingBudget)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'resources',
            label: (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Resources
              </span>
            ),
            children: (
              <div className="space-y-6">
                <Row gutter={[16, 16]}>
                  {/* Resource breakdown by category */}
                  <Col span={12}>
                    <Card title="Resources by Category" className="shadow-sm">
                      <div className="space-y-3">
                        {Object.entries(RESOURCE_CATEGORIES).map(([categoryKey, categoryInfo]) => {
                          const categoryResources = currentProject.resources.filter(r => r.category === categoryKey);
                          const assignedInCategory = new Set<string>();

                          currentProject.phases.forEach((phase) => {
                            phase.tasks.forEach((task) => {
                              task.resourceAssignments?.forEach((a) => {
                                const resource = currentProject.resources.find(r => r.id === a.resourceId);
                                if (resource && resource.category === categoryKey) {
                                  assignedInCategory.add(a.resourceId);
                                }
                              });
                            });
                            phase.phaseResourceAssignments?.forEach((a) => {
                              const resource = currentProject.resources.find(r => r.id === a.resourceId);
                              if (resource && resource.category === categoryKey) {
                                assignedInCategory.add(a.resourceId);
                              }
                            });
                          });

                          const utilization = categoryResources.length > 0
                            ? (assignedInCategory.size / categoryResources.length) * 100
                            : 0;

                          return (
                            <div key={categoryKey}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{categoryInfo.icon}</span>
                                  <span className="text-sm font-medium">{categoryInfo.label}</span>
                                </div>
                                <span className="text-sm font-semibold">
                                  {assignedInCategory.size} / {categoryResources.length}
                                </span>
                              </div>
                              <Progress
                                percent={utilization}
                                size="small"
                                strokeColor={categoryInfo.color}
                                format={(percent) => `${percent?.toFixed(0)}%`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </Col>

                  {/* Overall resource stats */}
                  <Col span={12}>
                    <Card title="Resource Allocation Summary" className="shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b">
                          <span className="text-gray-600">Total Resources</span>
                          <span className="font-bold text-lg">{projectAnalytics.totalResources}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Assigned to Tasks/Phases</span>
                          <span className="font-semibold text-green-600">{projectAnalytics.assignedResources}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Unassigned</span>
                          <span className="font-semibold text-orange-600">
                            {projectAnalytics.totalResources - projectAnalytics.assignedResources}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-gray-600">Overall Utilization</span>
                          <span className="font-bold text-lg text-purple-600">
                            {resourceUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          percent={resourceUtilization}
                          size="default"
                          strokeColor="#722ed1"
                          status={resourceUtilization < 50 ? 'exception' : resourceUtilization > 90 ? 'normal' : 'success'}
                        />
                        {resourceUtilization < 50 && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                            ⚠️ Low resource utilization - consider assigning more resources to tasks
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Detailed resource table */}
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="All Resources" className="shadow-sm">
                      <Table
                        dataSource={currentProject.resources.map(resource => {
                          // Count assignments
                          let assignmentCount = 0;
                          currentProject.phases.forEach((phase) => {
                            phase.tasks.forEach((task) => {
                              if (task.resourceAssignments?.some(a => a.resourceId === resource.id)) {
                                assignmentCount++;
                              }
                            });
                            if (phase.phaseResourceAssignments?.some(a => a.resourceId === resource.id)) {
                              assignmentCount++;
                            }
                          });

                          return {
                            key: resource.id,
                            name: resource.name,
                            category: resource.category,
                            designation: resource.designation,
                            assignments: assignmentCount,
                            isAssigned: assignmentCount > 0,
                          };
                        })}
                        columns={[
                          {
                            title: 'Resource Name',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text: string, record: any) => (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{RESOURCE_CATEGORIES[record.category].icon}</span>
                                <span className="font-medium">{text}</span>
                              </div>
                            ),
                          },
                          {
                            title: 'Category',
                            dataIndex: 'category',
                            key: 'category',
                            render: (category: string) => (
                              <Tag color={RESOURCE_CATEGORIES[category].color}>
                                {RESOURCE_CATEGORIES[category].label}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Designation',
                            dataIndex: 'designation',
                            key: 'designation',
                            render: (designation: string) => (
                              <span className="text-sm text-gray-600 capitalize">
                                {designation.replace(/_/g, ' ')}
                              </span>
                            ),
                          },
                          {
                            title: 'Assignments',
                            dataIndex: 'assignments',
                            key: 'assignments',
                            sorter: (a: any, b: any) => b.assignments - a.assignments,
                            render: (count: number, record: any) => (
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {count}
                                </span>
                                {count === 0 && (
                                  <Tag color="orange">Unassigned</Tag>
                                )}
                              </div>
                            ),
                          },
                          {
                            title: 'Status',
                            key: 'status',
                            render: (_: any, record: any) => (
                              <Tag color={record.isAssigned ? 'success' : 'default'}>
                                {record.isAssigned ? 'Active' : 'Available'}
                              </Tag>
                            ),
                          },
                        ]}
                        pagination={{ pageSize: 10 }}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'organization',
            label: (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Organization Chart
              </span>
            ),
            children: (
              <div className="space-y-6">
                <OrgChart />
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
