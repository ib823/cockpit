/**
 * Organizational Scale Component
 *
 * Controls for legal entities, countries, and languages.
 * Calculates and displays the Organizational Scale coefficient (Os).
 */

'use client';

import { Card, InputNumber, Space, Typography, Row, Col } from 'antd';
import { GlobalOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEstimatorStore } from '@/stores/estimator-store';
import { INPUT_CONSTRAINTS } from '@/lib/estimator/types';

const { Text } = Typography;

export function OrgScale() {
  const {
    inputs,
    setOrgScale,
    results,
  } = useEstimatorStore();

  const orgScale = results?.coefficients?.Os || 0;
  const impact = orgScale > 0 ? Math.round(inputs.profile.baseFT * orgScale) : 0;

  return (
    <Card
      title={
        <Space>
          <GlobalOutlined />
          <span>Org Scale & Geography (Os)</span>
        </Space>
      }
      size="small"
      extra={
        <Text type="secondary" className="text-xs">
          <InfoCircleOutlined /> Entities + countries + languages
        </Text>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Legal Entities */}
        <div>
          <Text strong className="block mb-2">Legal Entities</Text>
          <InputNumber
            min={INPUT_CONSTRAINTS.legalEntities.min}
            max={INPUT_CONSTRAINTS.legalEntities.max}
            value={inputs.legalEntities}
            onChange={(val) => val !== null && setOrgScale({ legalEntities: val })}
            addonAfter="entities"
            style={{ width: '100%' }}
          />
        </div>

        {/* Countries */}
        <div>
          <Text strong className="block mb-2">Countries</Text>
          <InputNumber
            min={INPUT_CONSTRAINTS.countries.min}
            max={INPUT_CONSTRAINTS.countries.max}
            value={inputs.countries}
            onChange={(val) => val !== null && setOrgScale({ countries: val })}
            addonAfter="countries"
            style={{ width: '100%' }}
          />
        </div>

        {/* Languages */}
        <div>
          <Text strong className="block mb-2">Languages</Text>
          <InputNumber
            min={INPUT_CONSTRAINTS.languages.min}
            max={INPUT_CONSTRAINTS.languages.max}
            value={inputs.languages}
            onChange={(val) => val !== null && setOrgScale({ languages: val })}
            addonAfter="languages"
            style={{ width: '100%' }}
          />
        </div>

        {/* Current Coefficient Display */}
        <div className="p-3 bg-gray-50 rounded">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex justify-between">
              <Text type="secondary">Current Os:</Text>
              <Text strong className="text-base" style={{ color: orgScale > 0.15 ? '#ff4d4f' : '#1890ff' }}>
                {orgScale.toFixed(3)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Impact:</Text>
              <Text type={impact > 75 ? 'danger' : 'secondary'}>
                +{impact} MD
              </Text>
            </div>
          </Space>
        </div>

        {/* Info text */}
        <Text type="secondary" className="text-xs">
          Each additional entity/country/language adds complexity
        </Text>

        {/* Warning for high org scale */}
        {orgScale > 0.2 && (
          <Text type="warning" className="text-xs">
            ⚠️ High organizational complexity. Consider phased deployment by region.
          </Text>
        )}
      </Space>
    </Card>
  );
}
