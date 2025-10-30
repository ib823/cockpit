/**
 * Cost Dashboard Component
 *
 * Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
 *
 * Advanced cost tracking dashboard with:
 * - Real-time budget utilization
 * - Cost breakdown by phase/resource/category
 * - Budget alerts and warnings
 */

'use client';

import { useMemo } from 'react';
import { Card, Progress, Tag, Statistic, Row, Col, Alert, Divider } from 'antd';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { calculateProjectCost, checkBudgetAlerts } from '@/lib/gantt-tool/cost-calculator';
import type { ResourceCategory } from '@/types/gantt-tool';
import { RESOURCE_CATEGORIES } from '@/types/gantt-tool';

export function CostDashboard() {
  const { currentProject } = useGanttToolStoreV2();

  const costData = useMemo(() => {
    if (!currentProject) return null;
    return calculateProjectCost(currentProject);
  }, [currentProject]);

  const budgetAlerts = useMemo(() => {
    if (!currentProject || !costData) return [];
    return checkBudgetAlerts(currentProject, costData);
  }, [currentProject, costData]);

  if (!currentProject) {
    return (
      <Card className="shadow-sm">
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No project loaded</p>
        </div>
      </Card>
    );
  }

  if (!currentProject.budget) {
    return (
      <Card className="shadow-sm">
        <div className="text-center py-8 text-gray-500">
          <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Budget not configured</p>
          <p className="text-sm mt-2">Set up project budget to track costs</p>
        </div>
      </Card>
    );
  }

  if (!costData) return null;

  const { budget } = currentProject;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Prepare data for visualizations
  const phaseBreakdown = Array.from(costData.costByPhase.entries()).map(([phaseId, cost]) => {
    const phase = currentProject.phases.find((p) => p.id === phaseId);
    return {
      phaseId,
      phaseName: phase?.name || 'Unknown',
      cost,
      percentage: (cost / costData.laborCost) * 100,
      color: phase?.color || '#gray-400',
    };
  });

  const categoryBreakdown = Array.from(costData.costByCategory.entries()).map(([category, cost]) => ({
    category,
    categoryLabel: RESOURCE_CATEGORIES[category].label,
    cost,
    percentage: (cost / costData.laborCost) * 100,
    color: RESOURCE_CATEGORIES[category].color,
    icon: RESOURCE_CATEGORIES[category].icon,
  }));

  const topResources = Array.from(costData.costByResource.entries())
    .map(([resourceId, cost]) => {
      const resource = currentProject.resources.find((r) => r.id === resourceId);
      return {
        resourceId,
        resourceName: resource?.name || 'Unknown',
        category: resource?.category,
        cost,
        percentage: (cost / costData.laborCost) * 100,
      };
    })
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Budget Alerts */}
      {budgetAlerts.filter((a) => a.triggered).length > 0 && (
        <div className="space-y-2">
          {budgetAlerts
            .filter((a) => a.triggered)
            .map((alert) => (
              <Alert
                key={alert.id}
                message={alert.message}
                type={alert.type === 'critical' ? 'error' : 'warning'}
                showIcon
                icon={<AlertTriangle className="w-4 h-4" />}
              />
            ))}
        </div>
      )}

      {/* Overview Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Total Budget"
              value={budget.totalBudget}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              Contingency: {budget.contingencyPercentage}% ({formatCurrency(costData.contingency)})
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Total Cost"
              value={costData.totalCost}
              precision={2}
              valueStyle={{ color: costData.isOverBudget ? '#cf1322' : '#3f8600' }}
            />
            <div className="text-xs text-gray-500 mt-2">Labor: {formatCurrency(costData.laborCost)}</div>
          </Card>
        </Col>

        <Col span={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Remaining Budget"
              value={costData.remainingBudget}
              precision={2}
              prefix={costData.variance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              valueStyle={{ color: costData.isOverBudget ? '#cf1322' : '#3f8600' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {costData.isOverBudget ? 'Over Budget' : 'Under Budget'}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Budget Utilization"
              value={costData.budgetUtilization}
              precision={1}
              suffix="%"
              prefix={<PieChart className="w-4 h-4" />}
              valueStyle={{
                color: costData.budgetUtilization > 100 ? '#cf1322' : costData.budgetUtilization > 90 ? '#fa8c16' : '#3f8600',
              }}
            />
            <Progress
              percent={Math.min(costData.budgetUtilization, 100)}
              status={costData.isOverBudget ? 'exception' : costData.budgetUtilization > 90 ? 'normal' : 'success'}
              size="small"
              showInfo={false}
              className="mt-2"
            />
          </Card>
        </Col>
      </Row>

      {/* Cost Breakdown by Phase */}
      <Card title="Cost by Phase" className="shadow-sm" extra={<BarChart3 className="w-4 h-4 text-gray-400" />}>
        <div className="space-y-3">
          {phaseBreakdown.map((phase) => (
            <div key={phase.phaseId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: phase.color }}
                  />
                  <span className="font-medium text-sm">{phase.phaseName}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(phase.cost)}</span>
              </div>
              <Progress
                percent={phase.percentage}
                strokeColor={phase.color}
                showInfo={false}
                size="small"
              />
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={16}>
        {/* Cost by Category */}
        <Col span={12}>
          <Card title="Cost by Category" className="shadow-sm" extra={<PieChart className="w-4 h-4 text-gray-400" />}>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm">{cat.categoryLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color={cat.color}>{cat.percentage.toFixed(1)}%</Tag>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(cat.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top 5 Resources by Cost */}
        <Col span={12}>
          <Card title="Top Resources by Cost" className="shadow-sm">
            <div className="space-y-3">
              {topResources.map((resource, index) => (
                <div key={resource.resourceId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <span className="text-sm">{resource.resourceName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag>{resource.percentage.toFixed(1)}%</Tag>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(resource.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Budget Details */}
      <Card title="Budget Details" className="shadow-sm">
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-sm text-gray-600">Approved By</div>
            <div className="font-semibold">{budget.approvedBy || 'N/A'}</div>
          </Col>
          <Col span={8}>
            <div className="text-sm text-gray-600">Approved Date</div>
            <div className="font-semibold">
              {budget.approvedAt ? new Date(budget.approvedAt).toLocaleDateString() : 'N/A'}
            </div>
          </Col>
          <Col span={8}>
            <div className="text-sm text-gray-600">Baseline Date</div>
            <div className="font-semibold">
              {budget.baselineDate ? new Date(budget.baselineDate).toLocaleDateString() : 'N/A'}
            </div>
          </Col>
        </Row>

        <Divider className="my-3" />

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">
            {budgetAlerts.length} budget alert{budgetAlerts.length !== 1 ? 's' : ''} configured
          </span>
        </div>
      </Card>
    </div>
  );
}
