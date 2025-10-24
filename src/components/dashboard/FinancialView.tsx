/**
 * Financial View - Layer 2 of Three-Layer Dashboard
 *
 * Answers: "What is the financial outcome of this plan? Is it profitable and competitive?"
 *
 * Components:
 * - Financial KPI Cards (Revenue, Cost, Margin)
 * - Margin Waterfall Chart
 * - Cost & Revenue by Phase
 * - Cost by Resource Category
 */

'use client';

import { useMemo, useState } from 'react';
import { Row, Col, Statistic, Card, Space, Typography, Divider, InputNumber, Button, App } from 'antd';
import { DollarSign, TrendingUp, TrendingDown, Target, Edit2, Save } from 'lucide-react';
import { GanttProject, Resource } from '@/types/gantt-tool';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';
import { getDailyRate, formatMYR, formatMYRShort, calculateMargin, getMarginColor } from '@/lib/rate-card';
import { RESOURCE_CATEGORIES } from '@/types/gantt-tool';

const { Title, Text } = Typography;

interface FinancialViewProps {
  project: GanttProject;
}

export function FinancialView({ project }: FinancialViewProps) {
  const { message } = App.useApp();
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [proposedRevenue, setProposedRevenue] = useState<number>(0);

  const financialData = useMemo(() => {
    const resources = project.resources || [];
    const phases = project.phases;

    // Calculate total cost based on resource assignments
    let totalCost = 0;
    const costByResource: Record<string, number> = {};
    const costByCategory: Record<string, number> = {};
    const costByPhase: Record<string, number> = {};

    // Initialize categories
    Object.keys(RESOURCE_CATEGORIES).forEach(category => {
      costByCategory[category] = 0;
    });

    phases.forEach(phase => {
      costByPhase[phase.id] = 0;

      const phaseDuration = differenceInDays(parseISO(phase.endDate), parseISO(phase.startDate)) + 1;

      // Phase-level resource assignments
      phase.phaseResourceAssignments?.forEach(assignment => {
        const resource = resources.find(r => r.id === assignment.resourceId);
        if (resource) {
          const dailyRate = getDailyRate(resource.designation);
          const assignmentCost = (phaseDuration * assignment.allocationPercentage / 100) * dailyRate;

          totalCost += assignmentCost;
          costByResource[resource.id] = (costByResource[resource.id] || 0) + assignmentCost;
          costByCategory[resource.category] = (costByCategory[resource.category] || 0) + assignmentCost;
          costByPhase[phase.id] += assignmentCost;
        }
      });

      // Task-level resource assignments
      phase.tasks.forEach(task => {
        const taskDuration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;

        task.resourceAssignments?.forEach(assignment => {
          const resource = resources.find(r => r.id === assignment.resourceId);
          if (resource) {
            const dailyRate = getDailyRate(resource.designation);
            const assignmentCost = (taskDuration * assignment.allocationPercentage / 100) * dailyRate;

            totalCost += assignmentCost;
            costByResource[resource.id] = (costByResource[resource.id] || 0) + assignmentCost;
            costByCategory[resource.category] = (costByCategory[resource.category] || 0) + assignmentCost;
            costByPhase[phase.id] += assignmentCost;
          }
        });
      });
    });

    // Calculate suggested revenue (30% margin)
    const suggestedRevenue = totalCost / 0.7; // 30% margin

    // Use proposed revenue if set, otherwise use suggested
    const revenue = proposedRevenue > 0 ? proposedRevenue : suggestedRevenue;
    const margin = revenue - totalCost;
    const marginPercent = calculateMargin(revenue, totalCost);

    // Total effort in person-days
    const totalEffort = resources.reduce((sum, resource) => {
      let resourceDays = 0;

      phases.forEach(phase => {
        const phaseDuration = differenceInDays(parseISO(phase.endDate), parseISO(phase.startDate)) + 1;

        phase.phaseResourceAssignments?.forEach(assignment => {
          if (assignment.resourceId === resource.id) {
            resourceDays += (phaseDuration * assignment.allocationPercentage / 100);
          }
        });

        phase.tasks.forEach(task => {
          const taskDuration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;
          task.resourceAssignments?.forEach(assignment => {
            if (assignment.resourceId === resource.id) {
              resourceDays += (taskDuration * assignment.allocationPercentage / 100);
            }
          });
        });
      });

      return sum + resourceDays;
    }, 0);

    return {
      revenue,
      totalCost,
      margin,
      marginPercent,
      totalEffort: Math.round(totalEffort),
      costByResource,
      costByCategory,
      costByPhase,
      suggestedRevenue,
    };
  }, [project, proposedRevenue]);

  const handleSaveRevenue = () => {
    setEditingRevenue(false);
    message.success('Revenue target updated!');
  };

  // Waterfall chart data
  const waterfallData = useMemo(() => {
    const data = [
      {
        name: 'Revenue',
        value: financialData.revenue,
        fill: '#10B981',
      },
    ];

    // Add cost breakdown by category
    Object.entries(financialData.costByCategory)
      .filter(([_, cost]) => cost > 0)
      .sort(([_, a], [__, b]) => b - a)
      .forEach(([category, cost]) => {
        data.push({
          name: RESOURCE_CATEGORIES[category as keyof typeof RESOURCE_CATEGORIES].label,
          value: -cost,
          fill: RESOURCE_CATEGORIES[category as keyof typeof RESOURCE_CATEGORIES].color,
        });
      });

    data.push({
      name: 'Gross Margin',
      value: financialData.margin,
      fill: getMarginColor(financialData.marginPercent),
    });

    return data;
  }, [financialData]);

  // Cost by phase chart data
  const phaseChartData = useMemo(() => {
    return project.phases.map(phase => ({
      name: phase.name.length > 20 ? phase.name.substring(0, 20) + '...' : phase.name,
      cost: financialData.costByPhase[phase.id] || 0,
      fill: phase.color,
    }));
  }, [project.phases, financialData.costByPhase]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', display: 'flex' }}>
      {/* Financial KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ background: '#EFF6FF', borderRadius: '8px' }}>
            {editingRevenue ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Proposed Price (MYR)</Text>
                <InputNumber
                  value={proposedRevenue || financialData.suggestedRevenue}
                  onChange={(val) => setProposedRevenue(val || 0)}
                  prefix="RM"
                  style={{ width: '100%' }}
                  size="large"
                  step={10000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
                <Button
                  type="primary"
                  icon={<Save size={16} />}
                  onClick={handleSaveRevenue}
                  block
                >
                  Save
                </Button>
              </Space>
            ) : (
              <>
                <Statistic
                  title={
                    <Space>
                      <span>Proposed Price</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit2 size={14} />}
                        onClick={() => setEditingRevenue(true)}
                      />
                    </Space>
                  }
                  value={financialData.revenue}
                  prefix="RM"
                  valueStyle={{ color: '#3B82F6', fontSize: '24px' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {proposedRevenue === 0 && `Suggested: ${formatMYR(financialData.suggestedRevenue)}`}
                </Text>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ background: '#FEF2F2', borderRadius: '8px' }}>
            <Statistic
              title="Total Cost"
              value={financialData.totalCost}
              prefix="RM"
              valueStyle={{ color: '#EF4444', fontSize: '24px' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {financialData.totalEffort} person-days
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            bordered={false}
            style={{
              background:
                financialData.marginPercent >= 20
                  ? '#ECFDF5'
                  : financialData.marginPercent >= 10
                  ? '#FFFBEB'
                  : '#FEF2F2',
              borderRadius: '8px',
              border: `3px solid ${getMarginColor(financialData.marginPercent)}`,
            }}
          >
            <Statistic
              title="Gross Margin"
              value={financialData.marginPercent}
              suffix="%"
              prefix={
                financialData.marginPercent >= 20 ? (
                  <TrendingUp size={20} style={{ color: getMarginColor(financialData.marginPercent) }} />
                ) : (
                  <TrendingDown size={20} style={{ color: getMarginColor(financialData.marginPercent) }} />
                )
              }
              valueStyle={{ color: getMarginColor(financialData.marginPercent), fontSize: '32px', fontWeight: 'bold' }}
            />
            <Text style={{ fontSize: '12px', color: getMarginColor(financialData.marginPercent) }}>
              {formatMYR(financialData.margin)} profit
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      {/* Margin Waterfall Chart */}
      <Card bordered={false} style={{ borderRadius: '8px' }}>
        <Title level={5}>💧 Margin Waterfall Analysis</Title>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          How revenue flows to margin after subtracting costs
        </Text>
        <ResponsiveContainer width="100%" height={400} style={{ marginTop: '20px' }}>
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatMYRShort(Math.abs(value))}
            />
            <Tooltip
              formatter={(value: number) => formatMYR(Math.abs(value))}
              contentStyle={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
            />
            <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Divider style={{ margin: '8px 0' }} />

      {/* Cost by Phase */}
      <Card bordered={false} style={{ borderRadius: '8px' }}>
        <Title level={5}>📊 Cost Breakdown by Phase</Title>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Which phases consume the most resources?
        </Text>
        <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
          <BarChart data={phaseChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatMYRShort(value)}
            />
            <Tooltip
              formatter={(value: number) => formatMYR(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
            />
            <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
              {phaseChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Financial Insights */}
      <Card
        bordered={false}
        style={{
          borderRadius: '8px',
          background:
            financialData.marginPercent >= 20
              ? '#D1FAE5'
              : financialData.marginPercent >= 10
              ? '#FEF3C7'
              : '#FEE2E2',
          border: `2px solid ${getMarginColor(financialData.marginPercent)}`,
        }}
      >
        <Space direction="vertical" size={8}>
          <Title
            level={5}
            style={{
              margin: 0,
              color:
                financialData.marginPercent >= 20
                  ? '#065F46'
                  : financialData.marginPercent >= 10
                  ? '#92400E'
                  : '#7F1D1D',
            }}
          >
            💡 Financial Insights
          </Title>
          {financialData.marginPercent >= 30 ? (
            <Text style={{ color: '#065F46' }}>
              ✅ <strong>Excellent margin!</strong> This proposal offers strong profitability (
              {financialData.marginPercent.toFixed(1)}%).
            </Text>
          ) : financialData.marginPercent >= 20 ? (
            <Text style={{ color: '#065F46' }}>
              ✅ <strong>Healthy margin.</strong> This proposal meets profit targets (
              {financialData.marginPercent.toFixed(1)}%).
            </Text>
          ) : financialData.marginPercent >= 10 ? (
            <Text style={{ color: '#92400E' }}>
              ⚠️ <strong>Marginal profitability.</strong> Consider optimizing resources or increasing price (
              {financialData.marginPercent.toFixed(1)}%).
            </Text>
          ) : (
            <Text style={{ color: '#7F1D1D' }}>
              ⛔ <strong>Low margin alert!</strong> This proposal may not be profitable. Review resource mix or increase
              price ({financialData.marginPercent.toFixed(1)}%).
            </Text>
          )}
          <Text
            type="secondary"
            style={{
              fontSize: '13px',
              color:
                financialData.marginPercent >= 20
                  ? '#065F46'
                  : financialData.marginPercent >= 10
                  ? '#92400E'
                  : '#7F1D1D',
            }}
          >
            Average daily rate across all resources: {formatMYR(financialData.totalCost / financialData.totalEffort)}
          </Text>
        </Space>
      </Card>
    </Space>
  );
}
