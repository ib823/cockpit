/**
 * Chart Accessibility Table
 * Provides accessible data table alternatives for chart visualizations
 * WCAG 2.1 Level AA compliant
 */

'use client';

import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartAccessibilityTableProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  columns?: ColumnsType<ChartDataPoint>;
  showVisually?: boolean; // If true, table is visible; if false, screen-reader only
}

/**
 * Accessible table alternative for charts
 * Can be hidden visually but available to screen readers
 */
export function ChartAccessibilityTable({
  data,
  title,
  description,
  valueFormatter = (value) => value.toLocaleString(),
  columns,
  showVisually = false,
}: ChartAccessibilityTableProps) {
  // Default columns if not provided
  const defaultColumns: ColumnsType<ChartDataPoint> = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => valueFormatter(value),
      sorter: (a, b) => a.value - b.value,
    },
  ];

  const tableColumns = columns || defaultColumns;

  const tableStyle: React.CSSProperties = showVisually
    ? {}
    : {
        // Screen reader only styles
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      };

  return (
    <div style={tableStyle} aria-label={`Data table for ${title}`}>
      <div style={{ marginBottom: '12px' }}>
        <Text strong id={`table-title-${title.replace(/\s/g, '-')}`}>
          {title} - Data Table
        </Text>
        {description && (
          <Text type="secondary" style={{ display: 'block' }} className="text-xs">
            {description}
          </Text>
        )}
      </div>
      <Table
        dataSource={data}
        columns={tableColumns}
        pagination={false}
        size="small"
        rowKey={(record) => record.name}
        aria-labelledby={`table-title-${title.replace(/\s/g, '-')}`}
        summary={() => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{valueFormatter(total)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </div>
  );
}

/**
 * Margin Waterfall Table
 * Accessible alternative for margin waterfall charts
 */
export function MarginWaterfallTable({
  revenue,
  cost,
  margin,
  showVisually = false,
}: {
  revenue: number;
  cost: number;
  margin: number;
  showVisually?: boolean;
}) {
  const data = [
    { name: 'Total Revenue', value: revenue, type: 'positive' },
    { name: 'Total Cost', value: -cost, type: 'negative' },
    { name: 'Gross Margin', value: margin, type: margin >= 0 ? 'positive' : 'negative' },
  ];

  const columns: ColumnsType<any> = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount (MYR)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => {
        const formatted = `RM ${Math.abs(value).toLocaleString()}`;
        return value < 0 ? `(${formatted})` : formatted;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (type === 'positive' ? 'Credit' : 'Debit'),
    },
  ];

  return (
    <ChartAccessibilityTable
      data={data}
      title="Margin Waterfall"
      description="Financial breakdown showing revenue, cost, and resulting margin"
      columns={columns}
      showVisually={showVisually}
    />
  );
}

/**
 * Cost by Phase Table
 * Accessible alternative for cost by phase bar charts
 */
export function CostByPhaseTable({
  phaseData,
  showVisually = false,
}: {
  phaseData: Array<{ name: string; cost: number }>;
  showVisually?: boolean;
}) {
  const totalCost = phaseData.reduce((sum, phase) => sum + phase.cost, 0);

  const data = phaseData.map((phase) => ({
    name: phase.name,
    value: phase.cost,
    percentage: ((phase.cost / totalCost) * 100).toFixed(1),
  }));

  const columns: ColumnsType<any> = [
    {
      title: 'Phase',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
    },
    {
      title: 'Cost (MYR)',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `RM ${value.toLocaleString()}`,
      sorter: (a, b) => a.value - b.value,
    },
    {
      title: '% of Total',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (pct: string) => `${pct}%`,
    },
  ];

  return (
    <ChartAccessibilityTable
      data={data}
      title="Cost Breakdown by Phase"
      description="Project cost distribution across implementation phases"
      columns={columns}
      showVisually={showVisually}
    />
  );
}

/**
 * Resource Utilization Table
 * Accessible alternative for utilization charts
 */
export function ResourceUtilizationTable({
  resources,
  showVisually = false,
}: {
  resources: Array<{
    name: string;
    utilization: number;
    allocation: number;
    status: 'optimal' | 'underutilized' | 'overallocated';
  }>;
  showVisually?: boolean;
}) {
  const columns: ColumnsType<any> = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Utilization %',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (value: number) => `${value.toFixed(0)}%`,
      sorter: (a, b) => a.utilization - b.utilization,
    },
    {
      title: 'Allocated Days',
      dataIndex: 'allocation',
      key: 'allocation',
      render: (value: number) => value.toFixed(1),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const labels = {
          optimal: 'Optimal (50-100%)',
          underutilized: 'Under-utilized (<50%)',
          overallocated: 'Over-allocated (>100%)',
        };
        return labels[status as keyof typeof labels] || status;
      },
    },
  ];

  return (
    <ChartAccessibilityTable
      data={resources.map(r => ({ ...r, value: r.utilization }))}
      title="Resource Utilization"
      description="Team member allocation and utilization percentages"
      columns={columns}
      showVisually={showVisually}
    />
  );
}

/**
 * Risk Assessment Table
 * Accessible alternative for risk gauge charts
 */
export function RiskAssessmentTable({
  riskFactors,
  showVisually = false,
}: {
  riskFactors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  showVisually?: boolean;
}) {
  const columns: ColumnsType<any> = [
    {
      title: 'Risk Factor',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: 'Score (0-100)',
      dataIndex: 'score',
      key: 'score',
      render: (value: number) => value.toFixed(0),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (value: number) => `${(value * 100).toFixed(0)}%`,
    },
    {
      title: 'Risk Level',
      key: 'level',
      render: (_: any, record: any) => {
        if (record.score >= 70) return 'Low Risk';
        if (record.score >= 50) return 'Medium Risk';
        return 'High Risk';
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
    },
  ];

  return (
    <div
      style={
        showVisually
          ? {}
          : {
              position: 'absolute',
              left: '-10000px',
              top: 'auto',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }
      }
    >
      <Table
        dataSource={riskFactors}
        columns={columns}
        pagination={false}
        size="small"
        rowKey={(record) => record.name}
        title={() => <Text strong>Risk Assessment Details</Text>}
      />
    </div>
  );
}

/**
 * Recommendations Summary Table
 * Accessible table for AI recommendations
 */
export function RecommendationsTable({
  recommendations,
  showVisually = true,
}: {
  recommendations: Array<{
    title: string;
    type: string;
    confidence: number;
    impact: string;
    priority: string;
  }>;
  showVisually?: boolean;
}) {
  const columns: ColumnsType<any> = [
    {
      title: 'Recommendation',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type.replace(/_/g, ' ').toUpperCase(),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: number) => `${value.toFixed(0)}%`,
      sorter: (a, b) => a.confidence - b.confidence,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => priority.toUpperCase(),
    },
    {
      title: 'Expected Impact',
      dataIndex: 'impact',
      key: 'impact',
      width: '30%',
    },
  ];

  return (
    <div style={showVisually ? {} : { position: 'absolute', left: '-10000px' }}>
      <Table
        dataSource={recommendations}
        columns={columns}
        pagination={false}
        size="small"
        rowKey={(record) => record.title}
        title={() => <Text strong>AI-Generated Recommendations</Text>}
      />
    </div>
  );
}
