'use client';

import { Modal, List, Button, Tag, Alert, Badge, Collapse } from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  ScissorOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { goalSeekOptimizer, type OptimizationSuggestion } from '@/lib/estimator/goal-seek';
import { useEstimatorStore } from '@/stores/estimator-store';
import type { EstimatorInputs } from '@/lib/estimator/types';

interface OptimizationModalProps {
  targetDate: Date;
  open: boolean;
  onClose: () => void;
  onApply?: (suggestion: OptimizationSuggestion) => void;
}

export function OptimizationModal({ targetDate, open, onClose, onApply }: OptimizationModalProps) {
  const store = useEstimatorStore();

  if (!store.results) {
    return (
      <Modal title="⚡ Optimization Suggestions" open={open} onCancel={onClose} footer={null}>
        <p>No estimate available. Please configure inputs first.</p>
      </Modal>
    );
  }

  // Calculate target months from date
  const now = new Date();
  const targetMonths = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

  const inputs: EstimatorInputs = store.inputs;

  const suggestions = goalSeekOptimizer({
    targetMonths,
    currentInputs: inputs,
    constraints: {
      maxFTE: 20,
      minFTE: 2,
      maxUtilization: 0.9,
      minUtilization: 0.7,
      maxScopeReduction: 0.3,
      minOverlap: 0.65,
    }
  });

  const currentDuration = store.results.durationMonths;
  const needsAcceleration = currentDuration > targetMonths;
  const gapMonths = currentDuration - targetMonths;

  const getScenarioIcon = (scenario: string) => {
    if (scenario.includes('Resource')) return <RocketOutlined />;
    if (scenario.includes('Intensify')) return <ThunderboltOutlined />;
    if (scenario.includes('Scope')) return <ScissorOutlined />;
    if (scenario.includes('Parallelization')) return <ClockCircleOutlined />;
    return <CheckCircleOutlined />;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span>⚡ Achieve Target: {targetDate.toLocaleDateString()}</span>
          {needsAcceleration && (
            <Badge count={`${gapMonths.toFixed(1)}mo gap`} style={{ backgroundColor: '#faad14' }} />
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <div className="space-y-4">
        {/* Current vs Target Summary */}
        <Alert
          message={
            needsAcceleration
              ? `Need to accelerate by ${gapMonths.toFixed(1)} months`
              : `On track! Current estimate is ${(-gapMonths).toFixed(1)} months ahead`
          }
          description={
            <div className="text-sm">
              <div>Current estimate: {currentDuration.toFixed(1)} months</div>
              <div>Target: {targetMonths.toFixed(1)} months</div>
            </div>
          }
          type={needsAcceleration ? 'warning' : 'success'}
          showIcon
        />

        {/* Optimization Suggestions */}
        <div className="text-base font-semibold">💡 Optimization Strategies</div>

        <List
          dataSource={suggestions}
          renderItem={(suggestion, idx) => (
            <List.Item
              key={idx}
              className={`border rounded mb-2 p-4 ${
                suggestion.achievesGoal ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="w-full space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getScenarioIcon(suggestion.scenario)}
                    <span className="font-semibold text-base">{suggestion.scenario}</span>
                    {suggestion.achievesGoal && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Achieves Goal
                      </Tag>
                    )}
                    <Tag color={
                      suggestion.feasibility === 'high' ? 'green' :
                      suggestion.feasibility === 'medium' ? 'orange' : 'red'
                    }>
                      {suggestion.feasibility} feasibility
                    </Tag>
                  </div>
                  {onApply && suggestion.achievesGoal && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        onApply(suggestion);
                        onClose();
                      }}
                    >
                      Apply
                    </Button>
                  )}
                </div>

                {/* Description */}
                <div className="text-sm text-gray-600">{suggestion.description}</div>

                {/* Adjustments */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700">Changes:</div>
                  {suggestion.adjustments.map((adj, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <span className="text-gray-600">{adj.label}:</span>
                      <span className="font-mono">{adj.from}</span>
                      <span>→</span>
                      <span className="font-mono font-semibold">{adj.to}</span>
                      <Tag className="ml-1">{adj.change}</Tag>
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
                  <div>
                    <div className="text-gray-600 text-xs">Resulting Duration</div>
                    <div className="font-semibold text-blue-600">
                      {suggestion.resultingDuration.toFixed(1)} months
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs">Cost Impact</div>
                    <div className={`font-semibold ${suggestion.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {suggestion.costImpact > 0 ? '+' : ''}${Math.abs(suggestion.costImpact).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs">Risk Score</div>
                    <div className="flex items-center gap-1">
                      <div className="font-semibold">{suggestion.riskScore}/10</div>
                      {suggestion.riskScore <= 3 && <span className="text-green-600">●</span>}
                      {suggestion.riskScore > 3 && suggestion.riskScore <= 6 && <span className="text-yellow-600">●</span>}
                      {suggestion.riskScore > 6 && <span className="text-red-600">●</span>}
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <Collapse
                  size="small"
                  items={[
                    {
                      key: '1',
                      label: (
                        <span className="text-xs flex items-center gap-1">
                          <WarningOutlined />
                          Risk Factors
                        </span>
                      ),
                      children: (
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          {suggestion.riskFactors.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      )
                    }
                  ]}
                />
              </div>
            </List.Item>
          )}
        />

        {suggestions.length === 0 && (
          <Alert
            message="No optimization strategies found"
            description="The target timeline may not be achievable with current constraints."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}

        {/* Guidance */}
        <Alert
          message="💡 How to Choose"
          description={
            <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
              <li><strong>Low risk (1-3):</strong> Safe changes, minimal coordination needed</li>
              <li><strong>Medium risk (4-6):</strong> Requires careful management and planning</li>
              <li><strong>High risk (7-10):</strong> Significant challenges, consider alternatives</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </div>
    </Modal>
  );
}
