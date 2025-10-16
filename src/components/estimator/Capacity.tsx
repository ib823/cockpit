/**
 * Capacity Component
 *
 * Controls for FTE, utilization, and overlap factor.
 * Displays calculated monthly capacity.
 */

'use client';

import { Card, Slider, Space, Typography, Statistic } from 'antd';
import { TeamOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEstimatorStore } from '@/stores/estimator-store';
import { INPUT_CONSTRAINTS, FORMULA_CONSTANTS } from '@/lib/estimator/types';

const { Text } = Typography;

export function Capacity() {
  const {
    inputs,
    setCapacity,
    results,
  } = useEstimatorStore();

  const capacityPerMonth = results?.capacityPerMonth || 0;

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>Team Capacity</span>
        </Space>
      }
      size="small"
      extra={
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <InfoCircleOutlined /> Resources + utilization
        </Text>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* FTE Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Full-Time Equivalents (FTE)</Text>
            <Text type="secondary">{inputs.fte}</Text>
          </div>
          <Slider
            min={INPUT_CONSTRAINTS.fte.min}
            max={20}
            step={0.5}
            value={inputs.fte}
            onChange={(val) => setCapacity({ fte: val })}
            marks={{
              1: '1',
              5: '5',
              10: '10',
              20: '20',
            }}
            tooltip={{ formatter: (val) => `${val} FTE` }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Team size allocated to this project
          </Text>
        </div>

        {/* Utilization Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Utilization Rate</Text>
            <Text type="secondary">{Math.round(inputs.utilization * 100)}%</Text>
          </div>
          <Slider
            min={INPUT_CONSTRAINTS.utilization.min}
            max={INPUT_CONSTRAINTS.utilization.max}
            step={0.05}
            value={inputs.utilization}
            onChange={(val) => setCapacity({ utilization: val })}
            marks={{
              0.5: '50%',
              0.7: '70%',
              0.8: '80%',
              0.95: '95%',
            }}
            tooltip={{ formatter: (val) => `${Math.round((val || 0) * 100)}%` }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Productive time after meetings/admin (70-85% typical)
          </Text>
        </div>

        {/* Overlap Factor Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Phase Overlap</Text>
            <Text type="secondary">{Math.round(inputs.overlapFactor * 100)}%</Text>
          </div>
          <Slider
            min={INPUT_CONSTRAINTS.overlapFactor.min}
            max={INPUT_CONSTRAINTS.overlapFactor.max}
            step={0.05}
            value={inputs.overlapFactor}
            onChange={(val) => setCapacity({ overlapFactor: val })}
            marks={{
              0.5: '50%',
              0.65: '65%',
              0.75: '75%',
              0.85: '85%',
            }}
            tooltip={{ formatter: (val) => `${Math.round((val || 0) * 100)}%` }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Concurrent phase execution (65-75% typical)
          </Text>
        </div>

        {/* Capacity Display */}
        <div className="p-3 bg-blue-50 rounded">
          <Statistic
            title="Monthly Capacity"
            value={capacityPerMonth}
            suffix="MD/month"
            precision={1}
            valueStyle={{ fontSize: '20px', color: '#1890ff' }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            = {inputs.fte} FTE × {FORMULA_CONSTANTS.WORKING_DAYS_PER_MONTH} days × {Math.round(inputs.utilization * 100)}%
          </Text>
        </div>

        {/* Warnings */}
        {inputs.utilization < 0.7 && (
          <Text type="warning" style={{ fontSize: '12px' }}>
            ⚠️ Low utilization may indicate resource availability issues.
          </Text>
        )}
        {inputs.overlapFactor < 0.65 && (
          <Text type="warning" style={{ fontSize: '12px' }}>
            ⚠️ Aggressive overlap increases risk of quality issues.
          </Text>
        )}
        {inputs.fte > 15 && (
          <Text type="warning" style={{ fontSize: '12px' }}>
            ⚠️ Large team size may increase coordination overhead.
          </Text>
        )}
      </Space>
    </Card>
  );
}
