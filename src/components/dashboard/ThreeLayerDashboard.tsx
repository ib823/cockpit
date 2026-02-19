/**
 * Three-Layer Cake Dashboard
 *
 * A comprehensive proposal dashboard with three interconnected layers:
 * 1. Operational View: Gantt chart & Resource heatmap (What & Who)
 * 2. Financial View: Cost, Revenue, Margin analysis (So What)
 * 3. Strategic View: Scenario comparison & What-if analysis (What If)
 */

"use client";

import { useState } from "react";
import { Card, Button, Space, Typography, Tag, Segmented } from "antd";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react";
import { OperationalView } from "./OperationalView";
import { FinancialView } from "./FinancialView";
import { StrategicView } from "./StrategicView";
import { RateCardManager } from "./RateCardManager";
import { GanttProject } from "@/types/gantt-tool";

const { Title, Text } = Typography;

interface ThreeLayerDashboardProps {
  project: GanttProject;
  onRefresh?: () => void;
  onExport?: () => void;
}

type DashboardView = "operational" | "financial" | "strategic" | "all";

export function ThreeLayerDashboard({ project, onRefresh, onExport }: ThreeLayerDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>("all");
  const [showRateCard, setShowRateCard] = useState(false);

  return (
    <div className="p-6 bg-[var(--color-bg-secondary)] min-h-screen">
      {/* Header */}
      <Card
        className="mb-6 rounded-xl border-none"
        style={{
          background: "linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)",
        }}
      >
        <div className="flex justify-between items-center">
          <Space direction="vertical" size={4}>
            <Title level={2} style={{ margin: 0, color: "white" }}>
               Proposal Dashboard
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.85)" }} className="text-base">
              {project.name}
            </Text>
          </Space>

          <Space size="middle">
            <Button
              icon={<Settings size={16} />}
              onClick={() => setShowRateCard(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
              }}
            >
              Rate Card
            </Button>
            {onRefresh && (
              <Button
                icon={<RefreshCw size={16} />}
                onClick={onRefresh}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                }}
              >
                Refresh
              </Button>
            )}
            {onExport && (
              <Button
                icon={<Download size={16} />}
                onClick={onExport}
                type="primary"
                style={{
                  background: "white",
                  color: "#007AFF",
                  border: "none",
                }}
              >
                Export Dashboard
              </Button>
            )}
          </Space>
        </div>

        {/* View Selector */}
        <div className="mt-5">
          <Segmented
            value={currentView}
            onChange={(value) => setCurrentView(value as DashboardView)}
            size="large"
            options={[
              {
                label: (
                  <Space>
                    <BarChart3 size={16} />
                    <span>All Views</span>
                  </Space>
                ),
                value: "all",
              },
              {
                label: (
                  <Space>
                    <Users size={16} />
                    <span>Operational</span>
                  </Space>
                ),
                value: "operational",
              },
              {
                label: (
                  <Space>
                    <DollarSign size={16} />
                    <span>Financial</span>
                  </Space>
                ),
                value: "financial",
              },
              {
                label: (
                  <Space>
                    <TrendingUp size={16} />
                    <span>Strategic</span>
                  </Space>
                ),
                value: "strategic",
              },
            ]}
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "4px",
              borderRadius: "8px",
            }}
          />
        </div>
      </Card>

      {/* Dashboard Content */}
      <Space direction="vertical" size="large" style={{ width: "100%", display: "flex" }}>
        {/* Layer 1: Operational View */}
        {(currentView === "all" || currentView === "operational") && (
          <Card
            title={
              <Space>
                <Users size={20} style={{ color: "#007AFF" }} />
                <span>Layer 1: Operational View</span>
                <Tag color="blue">The &quot;What&quot; and &quot;Who&quot;</Tag>
              </Space>
            }
            className="rounded-xl"
            headStyle={{
              background: "rgba(0, 122, 255, 0.08)",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            }}
          >
            <OperationalView project={project} />
          </Card>
        )}

        {/* Layer 2: Financial View */}
        {(currentView === "all" || currentView === "financial") && (
          <Card
            title={
              <Space>
                <DollarSign size={20} style={{ color: "#34C759" }} />
                <span>Layer 2: Financial View</span>
                <Tag color="green">The &quot;So What&quot;</Tag>
              </Space>
            }
            className="rounded-xl"
            headStyle={{
              background: "rgba(52, 199, 89, 0.08)",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            }}
          >
            <FinancialView project={project} />
          </Card>
        )}

        {/* Layer 3: Strategic View */}
        {(currentView === "all" || currentView === "strategic") && (
          <Card
            title={
              <Space>
                <TrendingUp size={20} style={{ color: "#FF9500" }} />
                <span>Layer 3: Strategic View</span>
                <Tag color="orange">The &quot;What If&quot;</Tag>
              </Space>
            }
            className="rounded-xl"
            headStyle={{
              background: "rgba(255, 149, 0, 0.08)",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            }}
          >
            <StrategicView project={project} />
          </Card>
        )}
      </Space>

      {/* Rate Card Manager Modal */}
      <RateCardManager isOpen={showRateCard} onClose={() => setShowRateCard(false)} />
    </div>
  );
}
