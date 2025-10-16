/**
 * ConfidenceRibbon Component
 *
 * Visualizes uncertainty in project estimates using PERT analysis.
 * Shows expected duration with confidence bands (50%, 80%, 90%, 95%).
 */

'use client';

import { Card, Typography } from 'antd';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PERTResults } from '@/lib/decision-support/pert-engine';

const { Text, Title } = Typography;

interface ConfidenceRibbonProps {
  baseline: number;
  pertResults: PERTResults;
  title?: string;
  unit?: string;
}

export function ConfidenceRibbon({
  baseline,
  pertResults,
  title = 'Duration Uncertainty',
  unit = 'months'
}: ConfidenceRibbonProps) {
  // Generate data points for visualization
  const generateDataPoints = () => {
    const points = [];
    const { expected, standardDeviation } = pertResults;
    const min = Math.max(0, expected - 2 * standardDeviation);
    const max = expected + 2 * standardDeviation;
    const step = (max - min) / 100;

    for (let x = min; x <= max; x += step) {
      // Calculate probability density (normal distribution)
      const z = (x - expected) / standardDeviation;
      const density = Math.exp(-0.5 * z * z) / (standardDeviation * Math.sqrt(2 * Math.PI));

      points.push({
        duration: parseFloat(x.toFixed(2)),
        density: density,
        // Confidence bands
        p50Lower: x <= pertResults.confidenceInterval.p50 ? density : 0,
        p50Upper: x >= pertResults.confidenceInterval.p50 ? density : 0,
        p80: x <= pertResults.confidenceInterval.p80 ? density : 0,
        p90: x <= pertResults.confidenceInterval.p90 ? density : 0,
        p95: x <= pertResults.confidenceInterval.p95 ? density : 0,
      });
    }

    return points;
  };

  const data = generateDataPoints();

  return (
    <Card>
      <div className="mb-4">
        <Title level={5}>{title}</Title>
        <Text type="secondary">
          Expected: {pertResults.expected.toFixed(1)} {unit} | Baseline: {baseline.toFixed(1)} {unit}
        </Text>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="duration"
            label={{ value: `Duration (${unit})`, position: 'insideBottom', offset: -5 }}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value: number) => value.toFixed(4)}
            labelFormatter={(label) => `${label} ${unit}`}
          />

          {/* Confidence bands from darkest to lightest */}
          <Area
            type="monotone"
            dataKey="p95"
            stroke="transparent"
            fill="#e6f7ff"
            fillOpacity={0.3}
            name="95% Confidence"
          />
          <Area
            type="monotone"
            dataKey="p90"
            stroke="transparent"
            fill="#91d5ff"
            fillOpacity={0.4}
            name="90% Confidence"
          />
          <Area
            type="monotone"
            dataKey="p80"
            stroke="transparent"
            fill="#40a9ff"
            fillOpacity={0.5}
            name="80% Confidence"
          />
          <Area
            type="monotone"
            dataKey="density"
            stroke="#1890ff"
            strokeWidth={2}
            fill="#1890ff"
            fillOpacity={0.6}
            name="Probability Density"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600 opacity-60 rounded" />
          <Text type="secondary">50% Confidence</Text>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-400 opacity-50 rounded" />
          <Text type="secondary">80% Confidence</Text>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-300 opacity-40 rounded" />
          <Text type="secondary">90% Confidence</Text>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 opacity-30 rounded" />
          <Text type="secondary">95% Confidence</Text>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-4 p-3 bg-gray-50 rounded grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Text type="secondary" className="block text-xs">Expected (P50)</Text>
          <Text strong className="text-base">{pertResults.confidenceInterval.p50.toFixed(1)} {unit}</Text>
        </div>
        <div>
          <Text type="secondary" className="block text-xs">80% Confidence</Text>
          <Text strong className="text-base">{pertResults.confidenceInterval.p80.toFixed(1)} {unit}</Text>
        </div>
        <div>
          <Text type="secondary" className="block text-xs">90% Confidence</Text>
          <Text strong className="text-base">{pertResults.confidenceInterval.p90.toFixed(1)} {unit}</Text>
        </div>
        <div>
          <Text type="secondary" className="block text-xs">Std Deviation</Text>
          <Text strong className="text-base">{pertResults.standardDeviation.toFixed(2)} {unit}</Text>
        </div>
      </div>
    </Card>
  );
}
