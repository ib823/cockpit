"use client";

import { Card, Select, Statistic, Alert, Progress } from "antd";
import { useState } from "react";
import { pertEngine, type UncertaintyLevel } from "@/lib/estimator/pert-engine";
import { useEstimatorStore } from "@/stores/estimator-store";

export function ConfidenceRibbon() {
  const [confidence, setConfidence] = useState<UncertaintyLevel>("medium");
  const results = useEstimatorStore((state) => state.results);

  if (!results) {
    return (
      <Card title=" Uncertainty Analysis">
        <p className="text-gray-500">Configure inputs to see uncertainty analysis</p>
      </Card>
    );
  }

  const pertResults = pertEngine.addUncertainty(results.durationMonths, confidence);
  const riskAssessment = pertEngine.getRiskAssessment(pertResults);

  // Calculate confidence band width
  const range = pertResults.confidenceInterval.p90 - pertResults.confidenceInterval.p10;
  const rangePercent = (range / pertResults.expected) * 100;

  return (
    <Card
      title=" Uncertainty Analysis"
      className="shadow-sm"
      extra={
        <Select
          value={confidence}
          onChange={setConfidence}
          className="w-40"
          options={[
            { value: "low", label: " Low Uncertainty" },
            { value: "medium", label: " Medium Uncertainty" },
            { value: "high", label: " High Uncertainty" },
          ]}
        />
      }
    >
      <div className="space-y-4">
        {/* Key Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Statistic
            title="Best Case (P10)"
            value={pertResults.confidenceInterval.p10}
            suffix="mo"
            precision={1}
            valueStyle={{ color: "#52c41a" }}
          />
          <Statistic
            title="Expected (P50)"
            value={pertResults.expected}
            suffix="mo"
            precision={1}
            valueStyle={{ color: "#1890ff" }}
          />
          <Statistic
            title="Buffer (P90)"
            value={pertResults.confidenceInterval.p90}
            suffix="mo"
            precision={1}
            valueStyle={{ color: "#faad14" }}
          />
        </div>

        {/* Visual Confidence Band */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Confidence Range</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">P10</span>
            <div className="flex-1 relative h-8 bg-gradient-to-r from-green-200 via-blue-200 to-yellow-200 rounded">
              <div
                className="absolute top-0 h-full w-1 bg-blue-600"
                style={{ left: "50%" }}
                title="Expected (P50)"
              />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">P90</span>
          </div>
          <div className="text-xs text-gray-600 text-center">
            Range: {pertResults.confidenceInterval.p10.toFixed(1)} -{" "}
            {pertResults.confidenceInterval.p90.toFixed(1)} months ({rangePercent.toFixed(0)}%
            variation)
          </div>
        </div>

        {/* Additional Percentiles */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="text-sm text-gray-600">P80 (Likely)</div>
            <div className="text-lg font-semibold text-blue-600">
              {pertResults.confidenceInterval.p80.toFixed(1)} mo
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">P95 (Conservative)</div>
            <div className="text-lg font-semibold text-orange-600">
              {pertResults.confidenceInterval.p95.toFixed(1)} mo
            </div>
          </div>
        </div>

        {/* Risk Assessment Alert */}
        <Alert
          message="Risk Assessment"
          description={riskAssessment}
          type={confidence === "low" ? "success" : confidence === "medium" ? "warning" : "error"}
          showIcon
        />

        {/* Interpretation Guide */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <div>
            <strong>P10:</strong> Only 10% chance of completing this fast
          </div>
          <div>
            <strong>P50:</strong> Most likely outcome (50% probability)
          </div>
          <div>
            <strong>P90:</strong> 90% confidence of completing within this time
          </div>
        </div>
      </div>
    </Card>
  );
}
