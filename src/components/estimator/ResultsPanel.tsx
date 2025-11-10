/**
 * Results Panel Component
 *
 * Displays calculation results including:
 * - Total effort, duration, PMO
 * - Phase breakdown table
 * - Formula transparency (expandable)
 * - Action buttons (Save, Generate Timeline)
 */

"use client";

import { Card, Statistic, Table, Button, Collapse, Space, Empty, Typography } from "antd";
import { SaveOutlined, ArrowRightOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useEstimatorStore, estimatorSelectors } from "@/stores/estimator-store";
import type { PhaseBreakdown } from "@/lib/estimator/types";

const { Text } = Typography;

export function ResultsPanel() {
  const results = useEstimatorStore((state) => state.results);
  const hasResults = useEstimatorStore(estimatorSelectors.hasResults);
  const warnings = useEstimatorStore((state) => state.warnings);

  if (!hasResults || !results) {
    return (
      <Card>
        <Empty
          description="Configure inputs to see estimate"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Phase breakdown table columns
  const phaseColumns = [
    {
      title: "Phase",
      dataIndex: "phaseName",
      key: "phaseName",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Effort (MD)",
      dataIndex: "effortMD",
      key: "effortMD",
      align: "right" as const,
      render: (value: number) => <Text>{value.toFixed(1)}</Text>,
    },
    {
      title: "Duration (months)",
      dataIndex: "durationMonths",
      key: "duration",
      align: "right" as const,
      render: (value: number) => <Text>{value.toFixed(1)}</Text>,
    },
    {
      title: "% of Total",
      key: "percentage",
      align: "right" as const,
      render: (record: PhaseBreakdown) => {
        const percentage = (record.effortMD / results.totalMD) * 100;
        return <Text type="secondary">{percentage.toFixed(0)}%</Text>;
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {/* Total Summary Card */}
      <Card title="🎯 Estimate Summary">
        <div className="grid grid-cols-3 gap-4">
          <Statistic
            title="Total Effort"
            value={results.totalMD}
            suffix="MD"
            precision={0}
            valueStyle={{ color: "#1890ff" }}
          />
          <Statistic
            title="Duration"
            value={results.durationMonths}
            suffix="months"
            precision={1}
            valueStyle={{ color: "#52c41a" }}
          />
          <Statistic
            title="PMO Effort"
            value={results.pmoMD}
            suffix="MD"
            precision={0}
            valueStyle={{ color: "#fa8c16" }}
          />
        </div>

        {/* Coefficients Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <Text type="secondary" className="block mb-2">
            Complexity Coefficients:
          </Text>
          <Space split={<span className="text-gray-300">|</span>}>
            <Text>
              Sb: <Text strong>{results.coefficients.Sb.toFixed(3)}</Text>
            </Text>
            <Text>
              Pc: <Text strong>{results.coefficients.Pc.toFixed(3)}</Text>
            </Text>
            <Text>
              Os: <Text strong>{results.coefficients.Os.toFixed(3)}</Text>
            </Text>
          </Space>
        </div>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card size="small" style={{ borderColor: "#faad14" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {warnings.map((warning, idx) => (
              <Text key={idx} type="warning" className="text-sm">
                {warning}
              </Text>
            ))}
          </Space>
        </Card>
      )}

      {/* Phase Breakdown */}
      <Card title="📈 SAP Activate Phases">
        <Table
          dataSource={results.phases}
          columns={phaseColumns}
          pagination={false}
          rowKey="phaseName"
          size="small"
          summary={(pageData) => {
            const totalEffort = pageData.reduce((sum, row) => sum + row.effortMD, 0);
            const totalDuration = pageData.reduce((sum, row) => sum + row.durationMonths, 0);
            return (
              <Table.Summary>
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{totalEffort.toFixed(1)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{totalDuration.toFixed(1)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>100%</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Formula Transparency */}
      <Collapse
        items={[
          {
            key: "1",
            label: (
              <Space>
                <CalculatorOutlined />
                <Text strong>🔢 Formula Transparency</Text>
              </Space>
            ),
            children: (
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                {`Formula Components:

E_FT = Base_FT × (1 + Sb) × (1 + Pc) × (1 + Os)
     = ${results.intermediateValues?.E_FT ? `${results.intermediateValues.E_FT.toFixed(1)} MD` : "N/A"}

E_fixed = Basis + Security
        = ${results.intermediateValues?.E_fixed ? `${results.intermediateValues.E_fixed} MD` : "N/A"}

Capacity = FTE × 22 days × Utilization
         = ${results.capacityPerMonth.toFixed(1)} MD/month

D_raw = (E_FT + E_fixed) / Capacity
      = ${results.intermediateValues?.D_raw ? results.intermediateValues.D_raw.toFixed(2) : "N/A"} months

Duration (with overlap) = D_raw × Overlap
                        = ${results.durationMonths.toFixed(2)} months

E_PMO = Duration × 16.25 MD/month
      = ${results.pmoMD.toFixed(1)} MD

E_total = E_FT + E_fixed + E_PMO
        = ${results.totalMD.toFixed(1)} MD

Phase Distribution (SAP Activate):
- Prepare:  10% = ${(results.totalMD * 0.1).toFixed(1)} MD
- Explore:  25% = ${(results.totalMD * 0.25).toFixed(1)} MD
- Realize:  45% = ${(results.totalMD * 0.45).toFixed(1)} MD
- Deploy:   15% = ${(results.totalMD * 0.15).toFixed(1)} MD
- Run:       5% = ${(results.totalMD * 0.05).toFixed(1)} MD`}
              </pre>
            ),
          },
        ]}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="primary" size="large" icon={<SaveOutlined />} block>
          Save Scenario
        </Button>
        <Button size="large" icon={<ArrowRightOutlined />} block>
          Generate Timeline
        </Button>
      </div>
    </Space>
  );
}
