"use client";

import { Wrapper, WrapperCalculation } from '@/types/wrappers';
import { useWrappersStore } from '@/stores/wrappers-store';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { Slider, Button, Card, Space, Typography } from 'antd';
import { RedoOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface WrapperSliderProps {
  wrapper: Wrapper;
  calculation?: WrapperCalculation;
}

export function WrapperSlider({ wrapper, calculation }: WrapperSliderProps) {
  const { setWrapperPercentage, resetWrapper } = useWrappersStore();

  const hasChanged = wrapper.currentPercentage !== wrapper.defaultPercentage;

  return (
    <Card hoverable>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: wrapper.color,
              }}
            />
            <div>
              <Title level={5} style={{ margin: 0 }}>{wrapper.name}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>{wrapper.description}</Text>
            </div>
          </Space>

          <Space>
            <div style={{ textAlign: 'right' }}>
              <Title level={4} style={{ margin: 0 }}>
                {wrapper.currentPercentage.toFixed(0)}%
              </Title>
              {calculation && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {calculation.wrapperEffort.toFixed(0)} PD
                </Text>
              )}
            </div>

            {hasChanged && (
              <Button
                type="text"
                icon={<RedoOutlined />}
                size="small"
                onClick={() => resetWrapper(wrapper.id)}
                title="Reset to default"
              />
            )}
          </Space>
        </div>

        {/* Slider */}
        <Slider
          value={wrapper.currentPercentage}
          onChange={(value) => setWrapperPercentage(wrapper.id, value as number)}
          max={50}
          min={0}
          step={1}
          trackStyle={{ backgroundColor: wrapper.color }}
          handleStyle={{ borderColor: wrapper.color }}
          aria-label={`${wrapper.name} percentage`}
        />

        {/* Footer: Effort and Cost */}
        {calculation && (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="large">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Effort: </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {calculation.wrapperEffort.toFixed(1)} PD
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Cost: </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {formatCurrency(calculation.wrapperCost, 'MYR')}
                </Text>
              </div>
            </Space>

            <div
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: `${wrapper.color}20`,
                color: wrapper.color,
              }}
            >
              {wrapper.sapActivatePhase}
            </div>
          </Space>
        )}

        {/* Change indicator */}
        {hasChanged && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Text type="warning" style={{ fontSize: 12 }}>
              Modified from {wrapper.defaultPercentage}% default
            </Text>
          </motion.div>
        )}
      </Space>
    </Card>
  );
}
