/**
 * ResourceTable Component
 *
 * Resource allocation table for project timeline.
 * Features:
 * - Editable FTE allocation per role
 * - Rate per day display
 * - Phase assignment
 * - Total cost calculation
 * - Summary row with totals
 */

'use client';

import { useState } from 'react';
import { Table, InputNumber, Button, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export interface ResourceAllocation {
  id: string;
  role: string;
  fte: number;
  ratePerDay: number;
  phases: string[];
  totalCost: number;
}

interface ResourceTableProps {
  resources: ResourceAllocation[];
  onResourcesChange: (resources: ResourceAllocation[]) => void;
  phases?: { phaseName: string; durationMonths: number }[];
}

export function ResourceTable({
  resources: initialResources,
  onResourcesChange,
  phases = []
}: ResourceTableProps) {
  const [resources, setResources] = useState<ResourceAllocation[]>(initialResources);

  // Calculate cost based on FTE, rate, and phase durations
  const calculateResourceCost = (resource: ResourceAllocation): number => {
    if (!phases || phases.length === 0) return 0;

    // Calculate total months for phases this resource is assigned to
    const relevantPhases = phases.filter(p => resource.phases.includes(p.phaseName));
    const totalMonths = relevantPhases.reduce((sum, p) => sum + p.durationMonths, 0);

    // Cost = FTE × ratePerDay × 22 working days/month × total months
    return resource.fte * resource.ratePerDay * 22 * totalMonths;
  };

  const handleFTEChange = (id: string, value: number | null) => {
    if (value === null) return;

    const updated = resources.map(r => {
      if (r.id === id) {
        const updatedResource = { ...r, fte: value };
        updatedResource.totalCost = calculateResourceCost(updatedResource);
        return updatedResource;
      }
      return r;
    });

    setResources(updated);
    onResourcesChange(updated);
  };

  const columns: ColumnsType<ResourceAllocation> = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'FTE',
      dataIndex: 'fte',
      key: 'fte',
      width: 120,
      render: (value: number, record: ResourceAllocation) => (
        <InputNumber
          min={0.1}
          max={10}
          step={0.1}
          value={value}
          precision={1}
          onChange={(val) => handleFTEChange(record.id, val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Rate/Day',
      dataIndex: 'ratePerDay',
      key: 'rate',
      width: 120,
      align: 'right',
      render: (value: number) => <Text>${value}</Text>,
    },
    {
      title: 'Phases',
      dataIndex: 'phases',
      key: 'phases',
      render: (phasesArray: string[]) => (
        <div className="flex flex-wrap gap-1">
          {phasesArray.map(phase => (
            <Tag key={phase} color="blue" style={{ fontSize: '11px' }}>
              {phase}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'cost',
      width: 150,
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </Text>
      ),
    },
  ];

  // Calculate summary totals
  const totalFTE = resources.reduce((sum, r) => sum + r.fte, 0);
  const totalCost = resources.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <div>
      <Table
        dataSource={resources}
        columns={columns}
        pagination={false}
        rowKey="id"
        size="small"
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
              <Table.Summary.Cell index={0}>
                <Text strong>Total</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>{totalFTE.toFixed(1)} FTE</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4} align="right">
                <Text strong className="text-sm" style={{ color: '#1890ff'}}>
                  ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Button
        className="mt-4"
        icon={<PlusOutlined />}
        onClick={() => {
          // Placeholder for add resource functionality
          console.log('Add resource clicked - implement modal');
        }}
      >
        Add Resource
      </Button>
    </div>
  );
}

// Default resources configuration
export const DEFAULT_RESOURCES: ResourceAllocation[] = [
  {
    id: 'pm',
    role: 'Project Manager',
    fte: 1.0,
    ratePerDay: 180,
    phases: ['Prepare', 'Explore', 'Realize', 'Deploy', 'Run'],
    totalCost: 0,
  },
  {
    id: 'fc',
    role: 'Functional Consultant',
    fte: 2.5,
    ratePerDay: 150,
    phases: ['Explore', 'Realize', 'Deploy'],
    totalCost: 0,
  },
  {
    id: 'tc',
    role: 'Technical Consultant',
    fte: 1.6,
    ratePerDay: 160,
    phases: ['Realize', 'Deploy'],
    totalCost: 0,
  },
  {
    id: 'basis',
    role: 'Basis Consultant',
    fte: 0.5,
    ratePerDay: 140,
    phases: ['Explore', 'Realize', 'Deploy'],
    totalCost: 0,
  },
  {
    id: 'cm',
    role: 'Change Manager',
    fte: 0.5,
    ratePerDay: 120,
    phases: ['Deploy', 'Run'],
    totalCost: 0,
  },
];
