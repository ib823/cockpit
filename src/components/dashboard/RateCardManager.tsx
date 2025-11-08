/**
 * Rate Card Manager Component
 *
 * Manage daily rates for resource designations
 * All rates are in MYR (Malaysian Ringgit)
 */

'use client';

import { useState } from 'react';
import { Modal, Table, InputNumber, Button, Space, Typography, Tag, Divider, App } from 'antd';
import { EditOutlined, SaveOutlined, UndoOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  DEFAULT_RATE_CARD,
  RateCardEntry,
  formatMYR,
  getHourlyRate,
} from '@/lib/rate-card';
import { ResourceDesignation, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';

const { Text, Title } = Typography;

interface RateCardManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (rateCard: Record<ResourceDesignation, number>) => void;
}

export function RateCardManager({ isOpen, onClose, onSave }: RateCardManagerProps) {
  const { message } = App.useApp();
  const [editMode, setEditMode] = useState(false);
  const [rates, setRates] = useState<Record<ResourceDesignation, number>>(
    Object.entries(DEFAULT_RATE_CARD).reduce((acc, [key, value]) => {
      acc[key as ResourceDesignation] = value.dailyRate;
      return acc;
    }, {} as Record<ResourceDesignation, number>)
  );

  const handleRateChange = (designation: ResourceDesignation, value: number | null) => {
    if (value !== null && value > 0) {
      setRates(prev => ({ ...prev, [designation]: value }));
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(rates);
    }
    message.success('Rate card updated successfully!');
    setEditMode(false);
  };

  const handleReset = () => {
    setRates(
      Object.entries(DEFAULT_RATE_CARD).reduce((acc, [key, value]) => {
        acc[key as ResourceDesignation] = value.dailyRate;
        return acc;
      }, {} as Record<ResourceDesignation, number>)
    );
    message.info('Rate card reset to defaults');
  };

  const columns = [
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      render: (designation: ResourceDesignation) => (
        <Space direction="vertical" size={0}>
          <Text strong>{RESOURCE_DESIGNATIONS[designation]}</Text>
          <Text type="secondary" className="text-xs">
            {DEFAULT_RATE_CARD[designation].description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Daily Rate (MYR)',
      dataIndex: 'dailyRate',
      key: 'dailyRate',
      width: 200,
      render: (dailyRate: number, record: RateCardEntry) => {
        if (editMode) {
          return (
            <InputNumber
              value={rates[record.designation]}
              onChange={(value) => handleRateChange(record.designation, value)}
              prefix="RM"
              style={{ width: '100%' }}
              min={0}
              step={100}
            />
          );
        }
        return <Text strong>{formatMYR(rates[record.designation])}</Text>;
      },
    },
    {
      title: 'Hourly Rate',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 150,
      render: (_: any, record: RateCardEntry) => {
        const hourlyRate = rates[record.designation] / 8;
        return (
          <Text type="secondary">
            {formatMYR(hourlyRate)}/hr
          </Text>
        );
      },
    },
    {
      title: 'Monthly (20 days)',
      dataIndex: 'monthly',
      key: 'monthly',
      width: 150,
      render: (_: any, record: RateCardEntry) => {
        const monthly = rates[record.designation] * 20;
        return (
          <Tag color="blue">
            {formatMYR(monthly)}
          </Tag>
        );
      },
    },
  ];

  const dataSource = Object.values(DEFAULT_RATE_CARD);

  // Calculate total for a hypothetical team
  const hypotheticalTeam = [
    { designation: 'director' as ResourceDesignation, count: 1 },
    { designation: 'manager' as ResourceDesignation, count: 2 },
    { designation: 'senior_consultant' as ResourceDesignation, count: 3 },
    { designation: 'consultant' as ResourceDesignation, count: 4 },
  ];

  const hypotheticalMonthlyCost = hypotheticalTeam.reduce((total, member) => {
    return total + (rates[member.designation] * 20 * member.count);
  }, 0);

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <span>Rate Card Management</span>
          <Tag color="blue">MYR</Tag>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleReset}>Reset to Defaults</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose}>Close</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={() => setEditMode(true)}>
                Edit Rates
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Info Banner */}
        <div
          style={{
            background: '#E6F7FF',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #91D5FF',
          }}
        >
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: '#0050B3' }}>
              💡 Rate Card Information
            </Text>
            <Text style={{ color: '#0050B3' }} className="text-sm">
              These daily rates are used to calculate project costs. All rates are in Malaysian Ringgit (MYR).
              Rates are based on typical SAP consulting market rates in Malaysia.
            </Text>
          </Space>
        </div>

        {/* Rate Table */}
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowKey="designation"
          size="middle"
          bordered
        />

        <Divider />

        {/* Example Calculation */}
        <div
          style={{
            background: '#F6FFED',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #B7EB8F',
          }}
        >
          <Title level={5} style={{ marginTop: 0, color: '#389E0D' }}>
            📊 Example Team Calculation (Monthly)
          </Title>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {hypotheticalTeam.map(member => (
              <div key={member.designation} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>
                  {member.count}x {RESOURCE_DESIGNATIONS[member.designation]}
                </Text>
                <Text strong>
                  {formatMYR(rates[member.designation] * 20 * member.count)}
                </Text>
              </div>
            ))}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong className="text-base">Total Monthly Cost:</Text>
              <Text strong style={{ color: '#389E0D' }} className="text-base">
                {formatMYR(hypotheticalMonthlyCost)}
              </Text>
            </div>
            <Text type="secondary" className="text-xs">
              Based on 20 working days per month
            </Text>
          </Space>
        </div>
      </Space>
    </Modal>
  );
}
