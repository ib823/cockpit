"use client";

import { Card, Alert, Tabs } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  performSensitivity,
  generateSensitivityInsights,
  getCriticalVariables,
} from "@/lib/estimator/sensitivity-analysis";
import { useEstimatorStore } from "@/stores/estimator-store";
import type { EstimatorInputs } from "@/lib/estimator/types";

export function TornadoChart() {
  const store = useEstimatorStore();

  if (!store.results) {
    return (
      <Card title=" Sensitivity Analysis">
        <p className="text-gray-500">Configure inputs to see sensitivity analysis</p>
      </Card>
    );
  }

  const inputs: EstimatorInputs = store.inputs;

  const durationSensitivity = performSensitivity(inputs, "duration");
  const effortSensitivity = performSensitivity(inputs, "effort");
  const insights = generateSensitivityInsights(durationSensitivity);
  const criticalVars = getCriticalVariables(durationSensitivity);

  return (
    <Card title=" Sensitivity Analysis: What Moves the Estimate?" className="shadow-sm">
      <Tabs
        items={[
          {
            key: "duration",
            label: "Duration Impact",
            children: <TornadoChartView data={durationSensitivity} metric="months" />,
          },
          {
            key: "effort",
            label: "Effort Impact",
            children: <TornadoChartView data={effortSensitivity} metric="MD" />,
          },
        ]}
      />

      <div className="mt-4 space-y-2">
        {insights.map((insight, i) => (
          <Alert
            key={i}
            message={insight}
            type={i === 0 ? "warning" : "info"}
            showIcon
            className="text-sm"
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-sm font-medium mb-2"> Key Findings</div>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <strong>Focus areas:</strong> {criticalVars.join(", ")} have the highest impact
          </li>
          <li>
            <strong>Recommendation:</strong> Validate assumptions for top 3 variables carefully
          </li>
          <li>
            <strong>Risk mitigation:</strong> Add buffer for high-impact variables
          </li>
        </ul>
      </div>
    </Card>
  );
}

interface TornadoChartViewProps {
  data: ReturnType<typeof performSensitivity>;
  metric: string;
}

function TornadoChartView({ data, metric }: TornadoChartViewProps) {
  // Transform data for tornado chart
  const chartData = data.map((item) => ({
    variable: item.variable,
    low: item.lowImpact - item.baseline,
    high: item.highImpact - item.baseline,
    range: item.range,
    rangePercent: item.rangePercent,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = data.find((d) => d.variable === payload[0].payload.variable);
    if (!dataPoint) return null;

    return (
      <div className="bg-white p-3 border rounded shadow-lg text-sm">
        <div className="font-semibold mb-2">{dataPoint.variable}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Range:</span>
            <span className="font-medium">
              {dataPoint.lowValue.toFixed(1)} → {dataPoint.highValue.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Low Impact:</span>
            <span className="text-red-600">
              {dataPoint.lowImpact.toFixed(1)} {metric}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">High Impact:</span>
            <span className="text-green-600">
              {dataPoint.highImpact.toFixed(1)} {metric}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Variation:</span>
            <span className="font-bold">{dataPoint.rangePercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 120, right: 20, top: 10, bottom: 10 }}
        >
          <XAxis
            type="number"
            axisLine={{ stroke: "#d9d9d9" }}
            tickLine={{ stroke: "#d9d9d9" }}
            label={{ value: `Impact on ${metric}`, position: "insideBottom", offset: -5 }}
          />
          <YAxis
            type="category"
            dataKey="variable"
            width={100}
            axisLine={{ stroke: "#d9d9d9" }}
            tickLine={{ stroke: "#d9d9d9" }}
          />
          <ReferenceLine x={0} stroke="#666" strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="low" fill="#ff4d4f" stackId="a" />
          <Bar dataKey="high" fill="#52c41a" stackId="a" />
        </BarChart>
      </ResponsiveContainer>

      {/* Impact Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Variable</th>
              <th className="px-3 py-2 text-right">Impact Range</th>
              <th className="px-3 py-2 text-right">% Variation</th>
              <th className="px-3 py-2 text-center">Priority</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item, idx) => (
              <tr key={item.variable} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="px-3 py-2 font-medium">{item.variable}</td>
                <td className="px-3 py-2 text-right">
                  ±{item.range.toFixed(1)} {metric}
                </td>
                <td className="px-3 py-2 text-right">{item.rangePercent.toFixed(1)}%</td>
                <td className="px-3 py-2 text-center">
                  {item.rangePercent > 15 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">High</span>
                  ) : item.rangePercent > 10 ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                      Med
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Low
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
