/**
 * WhatIfControls Component
 *
 * Interactive controls for what-if analysis.
 * Allows users to adjust key parameters and see impact on estimates.
 */

'use client';

import { useState } from 'react';
import { Card, Slider, InputNumber, Select, Space, Typography, Divider, Button } from 'antd';
import { ExperimentOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ConfidenceLevel } from '@/lib/decision-support/pert-engine';

const { Text, Title } = Typography;

export interface WhatIfParameters {
  fteMultiplier: number;
  utilizationMultiplier: number;
  scopeMultiplier: number;
  confidenceLevel: ConfidenceLevel;
}

interface WhatIfControlsProps {
  onParametersChange: (params: WhatIfParameters) => void;
  onReset: () => void;
}

export function WhatIfControls({ onParametersChange, onReset }: WhatIfControlsProps) {
  const [fteMultiplier, setFteMultiplier] = useState(1.0);
  const [utilizationMultiplier, setUtilizationMultiplier] = useState(1.0);
  const [scopeMultiplier, setScopeMultiplier] = useState(1.0);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('medium');

  const handleChange = (updates: Partial<WhatIfParameters>) => {
    const newParams = {
      fteMultiplier: updates.fteMultiplier ?? fteMultiplier,
      utilizationMultiplier: updates.utilizationMultiplier ?? utilizationMultiplier,
      scopeMultiplier: updates.scopeMultiplier ?? scopeMultiplier,
      confidenceLevel: updates.confidenceLevel ?? confidenceLevel,
    };

    // Update local state
    if (updates.fteMultiplier !== undefined) setFteMultiplier(updates.fteMultiplier);
    if (updates.utilizationMultiplier !== undefined)
      setUtilizationMultiplier(updates.utilizationMultiplier);
    if (updates.scopeMultiplier !== undefined) setScopeMultiplier(updates.scopeMultiplier);
    if (updates.confidenceLevel !== undefined) setConfidenceLevel(updates.confidenceLevel);

    // Notify parent
    onParametersChange(newParams);
  };

  const handleReset = () => {
    setFteMultiplier(1.0);
    setUtilizationMultiplier(1.0);
    setScopeMultiplier(1.0);
    setConfidenceLevel('medium');
    onReset();
  };

  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined />
          <span>What-If Analysis</span>
        </Space>
      }
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* FTE Multiplier */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Team Size Adjustment</Text>
            <InputNumber
              value={fteMultiplier}
              min={0.5}
              max={2.0}
              step={0.1}
              precision={1}
              formatter={(value) => `${value}x`}
              onChange={(value) => value && handleChange({ fteMultiplier: value })}
              size="small"
              style={{ width: 80 }}
            />
          </div>
          <Slider
            value={fteMultiplier}
            min={0.5}
            max={2.0}
            step={0.1}
            marks={{
              0.5: '50%',
              1.0: '100%',
              1.5: '150%',
              2.0: '200%',
            }}
            onChange={(value) => handleChange({ fteMultiplier: value })}
          />
          <Text type="secondary" className="text-xs">
            Adjust team size to see impact on duration
          </Text>
        </div>

        <Divider className="my-2" />

        {/* Utilization Multiplier */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Productivity Adjustment</Text>
            <InputNumber
              value={utilizationMultiplier}
              min={0.7}
              max={1.3}
              step={0.05}
              precision={2}
              formatter={(value) => `${value}x`}
              onChange={(value) => value && handleChange({ utilizationMultiplier: value })}
              size="small"
              style={{ width: 80 }}
            />
          </div>
          <Slider
            value={utilizationMultiplier}
            min={0.7}
            max={1.3}
            step={0.05}
            marks={{
              0.7: '70%',
              1.0: '100%',
              1.3: '130%',
            }}
            onChange={(value) => handleChange({ utilizationMultiplier: value })}
          />
          <Text type="secondary" className="text-xs">
            Adjust team productivity/efficiency
          </Text>
        </div>

        <Divider className="my-2" />

        {/* Scope Multiplier */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Scope Adjustment</Text>
            <InputNumber
              value={scopeMultiplier}
              min={0.5}
              max={1.5}
              step={0.1}
              precision={1}
              formatter={(value) => `${value}x`}
              onChange={(value) => value && handleChange({ scopeMultiplier: value })}
              size="small"
              style={{ width: 80 }}
            />
          </div>
          <Slider
            value={scopeMultiplier}
            min={0.5}
            max={1.5}
            step={0.1}
            marks={{
              0.5: '50%',
              1.0: '100%',
              1.5: '150%',
            }}
            onChange={(value) => handleChange({ scopeMultiplier: value })}
          />
          <Text type="secondary" className="text-xs">
            Simulate scope creep or reduction
          </Text>
        </div>

        <Divider className="my-2" />

        {/* Confidence Level */}
        <div>
          <Text strong className="block mb-2">
            Uncertainty Level
          </Text>
          <Select
            value={confidenceLevel}
            onChange={(value) => handleChange({ confidenceLevel: value })}
            style={{ width: '100%' }}
            options={[
              { value: 'low', label: 'Low Uncertainty (±15%)' },
              { value: 'medium', label: 'Medium Uncertainty (±30%)' },
              { value: 'high', label: 'High Uncertainty (±50%)' },
            ]}
          />
          <Text type="secondary" className="text-xs mt-2 block">
            Select expected range of variation in estimates
          </Text>
        </div>

        {/* Impact Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <Text type="secondary" className="text-xs block mb-1">
            Current Adjustments:
          </Text>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <Text>Team Size:</Text>{' '}
              <Text strong>{(fteMultiplier * 100).toFixed(0)}%</Text>
            </div>
            <div>
              <Text>Productivity:</Text>{' '}
              <Text strong>{(utilizationMultiplier * 100).toFixed(0)}%</Text>
            </div>
            <div>
              <Text>Scope:</Text>{' '}
              <Text strong>{(scopeMultiplier * 100).toFixed(0)}%</Text>
            </div>
            <div>
              <Text>Uncertainty:</Text>{' '}
              <Text strong className="capitalize">{confidenceLevel}</Text>
            </div>
          </div>
        </div>
      </Space>
    </Card>
  );
}
