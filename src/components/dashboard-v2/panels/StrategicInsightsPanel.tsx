/**
 * Strategic Insights Panel - Risk Analysis & AI Recommendations
 * Shows strategic insights: risk scores, AI recommendations, and scenario planning
 */

"use client";

import { Space, Card, Typography, Tag, Progress, List, Badge, Button, Divider, Alert } from "antd";
import { Lightbulb, AlertTriangle, Target, TrendingUp, Zap, CheckCircle } from "lucide-react";
import { GanttProject } from "@/types/gantt-tool";
import { Recommendation } from "@/lib/dashboard/optimization-engine";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

const { Text, Title } = Typography;

interface RiskAssessment {
  confidenceScore: number;
  riskPenalty: number;
  riskAdjustedMargin: number;
  riskFactors: Array<{
    category: string;
    score: number;
    weight: number;
    description: string;
  }>;
}

interface StrategicInsightsPanelProps {
  project: GanttProject;
  riskScore: RiskAssessment;
  recommendations: Recommendation[];
  scenarios: Array<{
    id: string;
    name: string;
    project: GanttProject;
    revenue: number;
  }>;
  onCreateScenario?: (name: string, project: GanttProject) => void;
}

export function StrategicInsightsPanel({
  project,
  riskScore,
  recommendations,
  scenarios,
  onCreateScenario,
}: StrategicInsightsPanelProps) {
  // Risk gauge data
  const riskGaugeData = [
    {
      name: "Confidence",
      value: riskScore.confidenceScore,
      fill:
        riskScore.confidenceScore >= 70
          ? "#10B981"
          : riskScore.confidenceScore >= 50
            ? "#F59E0B"
            : "#EF4444",
    },
  ];

  // Get risk level
  const getRiskLevel = (confidence: number) => {
    if (confidence >= 80) return { text: "Low Risk", color: "success" };
    if (confidence >= 60) return { text: "Medium Risk", color: "warning" };
    return { text: "High Risk", color: "error" };
  };

  const riskLevel = getRiskLevel(riskScore.confidenceScore);

  // Get recommendation priority based on confidence score
  const getPriority = (confidence: number): "high" | "medium" | "low" => {
    if (confidence >= 80) return "high";
    if (confidence >= 60) return "medium";
    return "low";
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "blue";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cost_optimization":
        return "💰";
      case "skill_optimization":
        return "🎯";
      case "risk_mitigation":
        return "🛡️";
      case "timeline_optimization":
        return "⏱️";
      case "resource_balancing":
        return "⚖️";
      default:
        return "💡";
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Risk Score Gauge */}
      <Card size="small" style={{ background: "#F9FAFB" }}>
        <div style={{ textAlign: "center" }}>
          <Title level={5} style={{ marginBottom: "16px" }}>
            Project Confidence Score
          </Title>
          <ResponsiveContainer width="100%" height={150}>
            <RadialBarChart
              innerRadius="60%"
              outerRadius="100%"
              data={riskGaugeData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                label={{ position: "center", fontSize: 24, fontWeight: "bold" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <Space direction="vertical" size="small" style={{ marginTop: "8px" }}>
            <Badge status={riskLevel.color as any} text={riskLevel.text} />
            <Text type="secondary" className="text-xs">
              {riskScore.confidenceScore.toFixed(1)}% delivery confidence
            </Text>
          </Space>
        </div>
      </Card>

      {/* Risk Factors Breakdown */}
      <Card size="small" style={{ background: "#FFFBEB" }}>
        <Title level={5} style={{ marginBottom: "12px" }} className="text-sm">
          <AlertTriangle size={16} style={{ marginRight: "8px" }} />
          Risk Factors
        </Title>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {riskScore.riskFactors.map((factor) => (
            <div key={factor.category}>
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
              >
                <Text className="text-xs">
                  {factor.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
                <Text strong className="text-xs">
                  {factor.score.toFixed(0)}%
                </Text>
              </div>
              <Progress
                percent={factor.score}
                showInfo={false}
                strokeColor={
                  factor.score >= 70 ? "#10B981" : factor.score >= 50 ? "#F59E0B" : "#EF4444"
                }
                size="small"
              />
            </div>
          ))}
        </Space>
      </Card>

      <Divider style={{ margin: "8px 0" }} />

      {/* AI Recommendations */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <Title level={5} style={{ margin: 0 }} className="text-sm">
            <Zap size={16} style={{ marginRight: "8px", color: "#F59E0B" }} />
            AI Recommendations
          </Title>
          <Badge count={recommendations.length} style={{ background: "#52c41a" }} />
        </div>

        {recommendations.length === 0 ? (
          <Alert
            message="All Optimized"
            description="Your project is well-optimized. No immediate recommendations."
            type="success"
            showIcon
            icon={<CheckCircle size={16} />}
          />
        ) : (
          <List
            size="small"
            dataSource={recommendations}
            renderItem={(rec) => (
              <List.Item
                style={{
                  padding: "12px",
                  background: "white",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <Space>
                      <span className="text-base">{getTypeIcon(rec.type)}</span>
                      <Text strong style={{ fontSize: "13px" }}>
                        {rec.title}
                      </Text>
                    </Space>
                    <Tag
                      color={getPriorityColor(getPriority(rec.confidence))}
                      style={{ margin: 0 }}
                    >
                      {getPriority(rec.confidence).toUpperCase()}
                    </Tag>
                  </div>

                  <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                    {rec.description}
                  </Text>

                  {rec.impact && (
                    <div style={{ background: "#F3F4F6", padding: "8px", borderRadius: "4px" }}>
                      <Space direction="vertical" size={2} style={{ width: "100%" }}>
                        {rec.impact.costSaving && (
                          <Text style={{ fontSize: "11px", color: "#10B981" }}>
                            💰 Save: RM {rec.impact.costSaving.toLocaleString()}
                          </Text>
                        )}
                        {rec.impact.timeReduction && (
                          <Text style={{ fontSize: "11px", color: "#3B82F6" }}>
                            ⏱️ Time: -{rec.impact.timeReduction} days
                          </Text>
                        )}
                        {rec.impact.riskReduction && (
                          <Text style={{ fontSize: "11px", color: "#8B5CF6" }}>
                            🛡️ Risk: -{rec.impact.riskReduction}%
                          </Text>
                        )}
                      </Space>
                    </div>
                  )}

                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}
                  >
                    <Space size="small">
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Confidence: {rec.confidence.toFixed(0)}%
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Ease: {rec.easeOfImplementation.toFixed(0)}%
                      </Text>
                    </Space>
                    <Progress
                      type="circle"
                      percent={rec.confidence}
                      width={24}
                      strokeWidth={12}
                      format={() => ""}
                      strokeColor="#52c41a"
                    />
                  </div>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Scenario Management */}
      <Card size="small" style={{ background: "#EFF6FF" }}>
        <Title level={5} style={{ marginBottom: "12px" }} className="text-sm">
          <TrendingUp size={16} style={{ marginRight: "8px" }} />
          What-If Scenarios
        </Title>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Active Scenarios: {scenarios.length}
          </Text>
          {onCreateScenario && (
            <Space wrap>
              <Button
                size="small"
                onClick={() => {
                  // Create cost-optimized scenario
                  const optimized = { ...project };
                  onCreateScenario("Cost-Optimized", optimized);
                }}
              >
                + Cost-Optimized
              </Button>
              <Button
                size="small"
                onClick={() => {
                  // Create fast-track scenario
                  const fastTrack = { ...project };
                  onCreateScenario("Fast-Track", fastTrack);
                }}
              >
                + Fast-Track
              </Button>
            </Space>
          )}
          <Alert
            message="Pro Tip"
            description="Create scenarios to compare different approaches and find the optimal strategy."
            type="info"
            showIcon
            style={{ marginTop: "8px", fontSize: "11px" }}
          />
        </Space>
      </Card>
    </Space>
  );
}
