/**
 * Process Complexity Component
 *
 * Controls for custom forms and fit-to-standard percentage.
 * Calculates and displays the Process Complexity coefficient (Pc).
 */

'use client';

import { Card, InputNumber, Slider, Space, Typography } from 'antd';
import { ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEstimatorStore } from '@/stores/estimator-store';
import { INPUT_CONSTRAINTS } from '@/lib/estimator/types';

const { Text } = Typography;

export function ProcessComplexity() {
  const {
    inputs,
    setCustomForms,
    setFitToStandard,
    results,
  } = useEstimatorStore();

  const processComplexity = results?.coefficients?.Pc || 0;
  const impact = processComplexity > 0 ? Math.round(inputs.profile.baseFT * processComplexity) : 0;

  return (
    <Card
      title={
        <Space>
          <ToolOutlined />
          <span>Process Complexity (Pc)</span>
        </Space>
      }
      size="small"
      extra={
        <Text type="secondary" className="text-xs">
          <InfoCircleOutlined /> Forms + fit-to-standard
        </Text>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Custom Forms */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Custom Forms</Text>
            <Text type="secondary">Baseline: 4</Text>
          </div>
          <InputNumber
            min={INPUT_CONSTRAINTS.customForms.min}
            max={INPUT_CONSTRAINTS.customForms.max}
            value={inputs.customForms}
            onChange={(val) => val !== null && setCustomForms(val)}
            addonAfter="forms"
            style={{ width: '100%' }}
          />
          {inputs.customForms > 4 && (
            <Text type="secondary" className="text-xs">
              +{inputs.customForms - 4} extra forms
            </Text>
          )}
        </div>

        {/* Fit-to-Standard */}
        <div>
          <div className="flex justify-between mb-2">
            <Text strong>Fit-to-Standard</Text>
            <Text type="secondary">{Math.round(inputs.fitToStandard * 100)}%</Text>
          </div>
          <Slider
            min={INPUT_CONSTRAINTS.fitToStandard.min}
            max={INPUT_CONSTRAINTS.fitToStandard.max}
            step={0.05}
            value={inputs.fitToStandard}
            onChange={setFitToStandard}
            marks={{
              0.5: '50%',
              0.75: '75%',
              1.0: '100%',
            }}
            tooltip={{ formatter: (val) => `${Math.round((val || 0) * 100)}%` }}
          />
          <Text type="secondary" className="text-xs">
            Higher fit = less customization needed
          </Text>
        </div>

        {/* Current Coefficient Display */}
        <div className="p-3 bg-gray-50 rounded">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex justify-between">
              <Text type="secondary">Current Pc:</Text>
              <Text strong className="text-base" style={{ color: processComplexity > 0.1 ? '#ff4d4f' : '#1890ff' }}>
                {processComplexity.toFixed(3)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Impact:</Text>
              <Text type={impact > 50 ? 'danger' : 'secondary'}>
                +{impact} MD
              </Text>
            </div>
          </Space>
        </div>

        {/* Warning for low fit-to-standard */}
        {inputs.fitToStandard < 0.7 && (
          <Text type="warning" className="text-xs">
            ⚠️ Low fit-to-standard increases effort significantly.
          </Text>
        )}
      </Space>
    </Card>
  );
}
