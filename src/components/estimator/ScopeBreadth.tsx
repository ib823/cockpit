/**
 * Scope Breadth Component
 *
 * Controls for selecting L3 items and integrations.
 * Calculates and displays the Scope Breadth coefficient (Sb).
 */

"use client";

import { useState } from "react";
import { Card, Button, Slider, Space, Typography, Statistic } from "antd";
import { AppstoreAddOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEstimatorStore } from "@/stores/estimator-store";
import { L3CatalogModal } from "./L3CatalogModal";

const { Text, Title } = Typography;

export function ScopeBreadth() {
  const [modalOpen, setModalOpen] = useState(false);

  const { inputs, setSelectedL3Items, setIntegrations, results } = useEstimatorStore();

  const selectedCount = inputs.selectedL3Items.length;
  const scopeBreadth = results?.coefficients?.Sb || 0;

  // Calculate impact (rough estimate: coefficient × baseFT)
  const impact = scopeBreadth > 0 ? Math.round(inputs.profile.baseFT * scopeBreadth) : 0;

  return (
    <>
      <Card
        title={
          <Space>
            <AppstoreAddOutlined />
            <span>Scope Breadth (Sb)</span>
          </Space>
        }
        size="small"
        extra={
          <Text type="secondary" className="text-xs">
            <InfoCircleOutlined /> L3 items + integrations
          </Text>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* L3 Items Selection */}
          <div>
            <Text strong>L3 Scope Items</Text>
            <div className="mt-2">
              <Button
                type="dashed"
                block
                icon={<AppstoreAddOutlined />}
                onClick={() => setModalOpen(true)}
              >
                {selectedCount > 0 ? `${selectedCount} items selected` : "Select from Catalog..."}
              </Button>
            </div>
          </div>

          {/* Integrations Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <Text strong>System Integrations</Text>
              <Text type="secondary">{inputs.integrations}</Text>
            </div>
            <Slider
              min={0}
              max={10}
              value={inputs.integrations}
              onChange={setIntegrations}
              marks={{
                0: "0",
                5: "5",
                10: "10",
              }}
              tooltip={{ formatter: (val) => `${val} systems` }}
            />
          </div>

          {/* Current Coefficient Display */}
          <div className="p-3 bg-gray-50 rounded">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="flex justify-between">
                <Text type="secondary">Current Sb:</Text>
                <Text
                  strong
                  className="text-base"
                  style={{ color: scopeBreadth > 0.2 ? "#ff4d4f" : "#1890ff" }}
                >
                  {scopeBreadth.toFixed(3)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Impact:</Text>
                <Text type={impact > 100 ? "danger" : "secondary"}>+{impact} MD</Text>
              </div>
            </Space>
          </div>

          {/* Warning for high complexity */}
          {scopeBreadth > 0.3 && (
            <Text type="warning" className="text-xs">
              ⚠️ High scope breadth. Consider phased rollout.
            </Text>
          )}
        </Space>
      </Card>

      {/* L3 Catalog Modal */}
      <L3CatalogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedItems={inputs.selectedL3Items}
        onApply={setSelectedL3Items}
      />
    </>
  );
}
