/**
 * Financial Intelligence Panel - Real-time Cost & Margin Analysis
 * Shows financial outcomes: revenue, cost, margin, and profitability metrics
 */

'use client';

import { useState, useMemo } from 'react';
import { Space, Statistic, Row, Col, InputNumber, Button, Typography, Alert, Card } from 'antd';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { GanttProject } from '@/types/gantt-tool';
import { CostBreakdown, MarginAnalysis } from '@/lib/dashboard/calculation-engine';
import { formatMYR, getMarginColor } from '@/lib/rate-card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
} from 'recharts';

const { Text, Title } = Typography;

interface FinancialIntelligencePanelProps {
  project: GanttProject;
  costBreakdown: CostBreakdown;
  margins: MarginAnalysis;
  revenue: number;
  onRevenueChange?: (revenue: number) => void;
}

export function FinancialIntelligencePanel({
  project,
  costBreakdown,
  margins,
  revenue,
  onRevenueChange,
}: FinancialIntelligencePanelProps) {
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [tempRevenue, setTempRevenue] = useState(revenue);

  const marginColor = useMemo(() => getMarginColor(margins.grossMarginPercent), [margins.grossMarginPercent]);

  // Prepare chart data
  const costByPhaseData = useMemo(() => {
    return project.phases.map(phase => {
      const phaseCost = costBreakdown.costByPhase.get(phase.id) || 0;
      return {
        name: phase.name,
        cost: phaseCost,
      };
    });
  }, [project.phases, costBreakdown.costByPhase]);

  const costByCategoryData = useMemo(() => {
    return Array.from(costBreakdown.costByCategory.entries()).map(([category, cost]) => ({
      name: category.replace('_', ' ').toUpperCase(),
      cost,
    }));
  }, [costBreakdown.costByCategory]);

  // Margin waterfall data
  const waterfallData = useMemo(() => {
    const data = [
      { name: 'Revenue', value: revenue, fill: '#10B981' },
      { name: 'Cost', value: -costBreakdown.totalCost, fill: '#EF4444' },
      { name: 'Margin', value: margins.grossMargin, fill: marginColor },
    ];
    return data;
  }, [revenue, costBreakdown.totalCost, margins.grossMargin, marginColor]);

  const handleSaveRevenue = () => {
    onRevenueChange?.(tempRevenue);
    setEditingRevenue(false);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Financial KPIs */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card size="small" style={{ background: '#ECFDF5', border: '1px solid #10B981' }}>
            <Statistic
              title="Total Revenue"
              value={revenue}
              precision={0}
              prefix={<DollarSign size={18} />}
              valueStyle={{ color: '#10B981', fontSize: '20px' }}
              formatter={(value) => formatMYR(Number(value))}
            />
            {editingRevenue ? (
              <Space style={{ marginTop: '8px' }}>
                <InputNumber
                  value={tempRevenue}
                  onChange={(val) => setTempRevenue(val || 0)}
                  style={{ width: '120px' }}
                  size="small"
                />
                <Button size="small" type="primary" onClick={handleSaveRevenue}>
                  Save
                </Button>
                <Button size="small" onClick={() => setEditingRevenue(false)}>
                  Cancel
                </Button>
              </Space>
            ) : (
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setTempRevenue(revenue);
                  setEditingRevenue(true);
                }}
                style={{ padding: 0, marginTop: '4px' }}
              >
                Edit Price
              </Button>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
            <Statistic
              title="Total Cost"
              value={costBreakdown.totalCost}
              precision={0}
              prefix={<TrendingDown size={18} />}
              valueStyle={{ color: '#F59E0B', fontSize: '20px' }}
              formatter={(value) => formatMYR(Number(value))}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              From {costBreakdown.costByResource.size} resource assignments
            </Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              background: margins.grossMarginPercent >= 20 ? '#ECFDF5' : '#FEE2E2',
              border: `1px solid ${marginColor}`,
            }}
          >
            <Statistic
              title="Gross Margin"
              value={margins.grossMarginPercent}
              precision={1}
              suffix="%"
              prefix={margins.grossMarginPercent >= 20 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              valueStyle={{ color: marginColor, fontSize: '20px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {formatMYR(margins.grossMargin)} profit
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Margin Alert */}
      {margins.grossMarginPercent < 15 && (
        <Alert
          message="Low Margin Warning"
          description={`Current margin (${margins.grossMarginPercent.toFixed(1)}%) is below the recommended 15% threshold. Consider increasing revenue or optimizing costs.`}
          type="warning"
          showIcon
          closable
        />
      )}

      {/* Margin Waterfall Chart */}
      <div>
        <Title level={5} style={{ marginBottom: '12px' }}>
          Margin Waterfall
        </Title>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatMYR(Math.abs(value))} />
            <Tooltip formatter={(value) => formatMYR(Math.abs(Number(value)))} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Phase */}
      <div>
        <Title level={5} style={{ marginBottom: '12px' }}>
          Cost by Phase
        </Title>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costByPhaseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => formatMYR(value)} />
            <Tooltip formatter={(value) => formatMYR(Number(value))} />
            <Bar dataKey="cost" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Category */}
      <div>
        <Title level={5} style={{ marginBottom: '12px' }}>
          Cost by Resource Category
        </Title>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costByCategoryData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatMYR(value)} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(value) => formatMYR(Number(value))} />
            <Bar dataKey="cost" fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Insights */}
      <Card size="small" style={{ background: '#F3F4F6', marginTop: '16px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong style={{ fontSize: '13px' }}>
            <Target size={14} style={{ marginRight: '8px' }} />
            Financial Insights
          </Text>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Break-even Revenue:</Text>
            <Text style={{ fontSize: '12px' }}>{formatMYR(margins.breakEvenRevenue)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Contribution Margin:</Text>
            <Text style={{ fontSize: '12px' }}>{formatMYR(margins.contributionMargin)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Suggested 30% Margin Price:</Text>
            <Text strong style={{ fontSize: '12px', color: '#3B82F6' }}>
              {formatMYR(costBreakdown.totalCost / 0.7)}
            </Text>
          </div>
        </Space>
      </Card>
    </Space>
  );
}
