/**
 * ScenarioComparison Component
 *
 * Side-by-side comparison of different estimation scenarios.
 * Allows users to save and compare multiple what-if analyses.
 */

'use client';

import { Card, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  totalMD: number;
  durationMonths: number;
  pmoMD: number;
  fte: number;
  utilization: number;
  coefficients: {
    Sb: number;
    Pc: number;
    Os: number;
  };
  createdAt?: Date;
}

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  baselineScenario?: Scenario;
}

export function ScenarioComparison({ scenarios, baselineScenario }: ScenarioComparisonProps) {
  const columns: ColumnsType<Scenario> = [
    {
      title: 'Scenario',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text: string, record: Scenario) => (
        <div>
          <Text strong>{text}</Text>
          {baselineScenario && record.id === baselineScenario.id && (
            <Tag color="blue" className="ml-2">
              Baseline
            </Tag>
          )}
          {record.description && (
            <div className="text-xs text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Total Effort',
      dataIndex: 'totalMD',
      key: 'totalMD',
      align: 'right',
      width: 120,
      render: (value: number, record: Scenario) => {
        const delta = baselineScenario ? value - baselineScenario.totalMD : 0;
        return (
          <div>
            <Text strong>{value.toFixed(0)} MD</Text>
            {baselineScenario && delta !== 0 && (
              <div className={`text-xs ${delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(0)} MD
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Duration',
      dataIndex: 'durationMonths',
      key: 'duration',
      align: 'right',
      width: 120,
      render: (value: number, record: Scenario) => {
        const delta = baselineScenario ? value - baselineScenario.durationMonths : 0;
        return (
          <div>
            <Text strong>{value.toFixed(1)} mo</Text>
            {baselineScenario && delta !== 0 && (
              <div className={`text-xs ${delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} mo
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'PMO',
      dataIndex: 'pmoMD',
      key: 'pmo',
      align: 'right',
      width: 100,
      render: (value: number) => <Text>{value.toFixed(0)} MD</Text>,
    },
    {
      title: 'FTE',
      dataIndex: 'fte',
      key: 'fte',
      align: 'right',
      width: 80,
      render: (value: number) => <Text>{value.toFixed(1)}</Text>,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'util',
      align: 'right',
      width: 100,
      render: (value: number) => <Text>{(value * 100).toFixed(0)}%</Text>,
    },
    {
      title: 'Sb',
      key: 'sb',
      align: 'right',
      width: 80,
      render: (_, record: Scenario) => (
        <Text type="secondary">{record.coefficients.Sb.toFixed(3)}</Text>
      ),
    },
    {
      title: 'Pc',
      key: 'pc',
      align: 'right',
      width: 80,
      render: (_, record: Scenario) => (
        <Text type="secondary">{record.coefficients.Pc.toFixed(3)}</Text>
      ),
    },
    {
      title: 'Os',
      key: 'os',
      align: 'right',
      width: 80,
      render: (_, record: Scenario) => (
        <Text type="secondary">{record.coefficients.Os.toFixed(3)}</Text>
      ),
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <Title level={5}>Scenario Comparison</Title>
        <Text type="secondary">
          Compare different estimation scenarios side-by-side
          {baselineScenario && ' (deltas shown relative to baseline)'}
        </Text>
      </div>

      <Table
        dataSource={scenarios}
        columns={columns}
        pagination={false}
        rowKey="id"
        size="small"
        scroll={{ x: 1000 }}
        rowClassName={(record) =>
          baselineScenario && record.id === baselineScenario.id
            ? 'bg-blue-50'
            : ''
        }
      />

      {scenarios.length === 0 && (
        <div className="text-center py-8">
          <Text type="secondary">No scenarios to compare. Save your current estimate to create scenarios.</Text>
        </div>
      )}
    </Card>
  );
}
