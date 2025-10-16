/**
 * Decision Support Page
 *
 * Advanced analysis tools for project estimation:
 * - PERT uncertainty analysis
 * - Monte Carlo simulation
 * - Scenario comparison
 * - What-if analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { Typography, Alert, Tabs, Button, Space } from 'antd';
import { ExperimentOutlined, BarChartOutlined, SwapOutlined, LineChartOutlined } from '@ant-design/icons';
import { useEstimatorStore } from '@/stores/estimator-store';
import { pertEngine, type PERTResults } from '@/lib/decision-support/pert-engine';
import { ConfidenceRibbon } from '@/components/decision-support/ConfidenceRibbon';
import { ScenarioComparison, type Scenario } from '@/components/decision-support/ScenarioComparison';
import { WhatIfControls, type WhatIfParameters } from '@/components/decision-support/WhatIfControls';

const { Title, Text } = Typography;

export default function DecisionSupportPage() {
  const estimatorResults = useEstimatorStore(state => state.results);
  const inputs = useEstimatorStore(state => state.inputs);
  const hasResults = estimatorResults !== null;

  const [pertResults, setPertResults] = useState<PERTResults | null>(null);
  const [whatIfParams, setWhatIfParams] = useState<WhatIfParameters>({
    fteMultiplier: 1.0,
    utilizationMultiplier: 1.0,
    scopeMultiplier: 1.0,
    confidenceLevel: 'medium',
  });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [baselineScenario, setBaselineScenario] = useState<Scenario | undefined>(undefined);

  // Calculate PERT analysis when results change
  useEffect(() => {
    if (estimatorResults) {
      const pert = pertEngine.addUncertainty(
        estimatorResults.durationMonths,
        whatIfParams.confidenceLevel
      );
      setPertResults(pert);

      // Create baseline scenario if not exists
      if (!baselineScenario) {
        const baseline: Scenario = {
          id: 'baseline',
          name: 'Baseline',
          description: 'Current estimator configuration',
          totalMD: estimatorResults.totalMD,
          durationMonths: estimatorResults.durationMonths,
          pmoMD: estimatorResults.pmoMD,
          fte: inputs.fte,
          utilization: inputs.utilization,
          coefficients: estimatorResults.coefficients,
        };
        setBaselineScenario(baseline);
        setScenarios([baseline]);
      }
    }
  }, [estimatorResults, whatIfParams.confidenceLevel]);

  const handleWhatIfChange = (params: WhatIfParameters) => {
    setWhatIfParams(params);

    if (estimatorResults) {
      // Apply multipliers to create what-if scenario
      const whatIfDuration =
        (estimatorResults.durationMonths / params.fteMultiplier) *
        (1 / params.utilizationMultiplier) *
        params.scopeMultiplier;

      const whatIfEffort =
        estimatorResults.totalMD *
        params.scopeMultiplier *
        (1 / params.utilizationMultiplier);

      const whatIfScenario: Scenario = {
        id: `whatif-${Date.now()}`,
        name: 'What-If Analysis',
        description: `Team: ${(params.fteMultiplier * 100).toFixed(0)}%, Productivity: ${(params.utilizationMultiplier * 100).toFixed(0)}%, Scope: ${(params.scopeMultiplier * 100).toFixed(0)}%`,
        totalMD: whatIfEffort,
        durationMonths: whatIfDuration,
        pmoMD: estimatorResults.pmoMD * params.scopeMultiplier,
        fte: inputs.fte * params.fteMultiplier,
        utilization: Math.min(0.95, inputs.utilization * params.utilizationMultiplier),
        coefficients: estimatorResults.coefficients,
      };

      // Replace or add what-if scenario
      setScenarios(prev => {
        const filtered = prev.filter(s => s.id === 'baseline' || !s.name.includes('What-If'));
        return [...filtered, whatIfScenario];
      });
    }
  };

  const handleResetWhatIf = () => {
    setWhatIfParams({
      fteMultiplier: 1.0,
      utilizationMultiplier: 1.0,
      scopeMultiplier: 1.0,
      confidenceLevel: 'medium',
    });

    // Remove what-if scenarios
    setScenarios(prev => prev.filter(s => s.id === 'baseline'));
  };

  const tabItems = [
    {
      key: 'uncertainty',
      label: (
        <span>
          <LineChartOutlined /> Uncertainty Analysis
        </span>
      ),
      children: (
        <div className="space-y-4">
          {pertResults && estimatorResults && (
            <ConfidenceRibbon
              baseline={estimatorResults.durationMonths}
              pertResults={pertResults}
              title="Duration Uncertainty (PERT Analysis)"
              unit="months"
            />
          )}
          <Alert
            message="PERT Analysis"
            description="This analysis shows the probability distribution of project duration based on optimistic, most likely, and pessimistic estimates. The confidence bands indicate the likelihood of completing within different timeframes."
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      key: 'whatif',
      label: (
        <span>
          <ExperimentOutlined /> What-If Analysis
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <WhatIfControls
              onParametersChange={handleWhatIfChange}
              onReset={handleResetWhatIf}
            />
          </div>
          <div className="lg:col-span-2">
            <ScenarioComparison
              scenarios={scenarios}
              baselineScenario={baselineScenario}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'scenarios',
      label: (
        <span>
          <SwapOutlined /> Scenario Comparison
        </span>
      ),
      children: (
        <div className="space-y-4">
          <ScenarioComparison
            scenarios={scenarios}
            baselineScenario={baselineScenario}
          />
          <Alert
            message="Save Scenarios"
            description="Currently showing baseline and what-if scenarios. Future enhancement: Save multiple named scenarios for comparison."
            type="info"
            showIcon
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Title level={2}>Decision Support</Title>
        <Text type="secondary">
          Advanced analytical tools for risk assessment and scenario planning
        </Text>
      </div>

      {/* Alert if no estimator results */}
      {!hasResults && (
        <Alert
          message="No estimator results available"
          description="Please configure and run the estimator first to enable decision support tools."
          type="warning"
          showIcon
          className="mb-4"
          action={
            <Button size="small" type="link" href="/estimator">
              Go to Estimator
            </Button>
          }
        />
      )}

      {/* Tabs */}
      {hasResults && (
        <Tabs
          defaultActiveKey="uncertainty"
          items={tabItems}
          size="large"
          className="bg-white rounded-lg p-4"
        />
      )}
    </div>
  );
}
