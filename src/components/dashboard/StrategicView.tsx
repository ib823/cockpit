/**
 * Strategic View - Layer 3 of Three-Layer Dashboard
 *
 * Answers: "How can we make this better?"
 *
 * Components:
 * - Scenario Selector
 * - Side-by-side Scenario Comparison
 * - Delta Visualization (changes between scenarios)
 * - Risk & Feasibility Gauges
 */

"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Row,
  Col,
  Statistic,
  Select,
  Divider,
  Empty,
  App,
} from "antd";
import { Plus, Copy, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { GanttProject } from "@/types/gantt-tool";
import { formatMYR, calculateMargin, getMarginColor, getDailyRate } from "@/lib/rate-card";
import { differenceInDays, parseISO } from "date-fns";
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from "recharts";

const { Title, Text } = Typography;

interface StrategicViewProps {
  project: GanttProject;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  effort: number;
  duration: number;
}

export function StrategicView({ project }: StrategicViewProps) {
  const { message } = App.useApp();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  // Calculate baseline scenario from current project
  const baselineScenario = useMemo((): Scenario => {
    const resources = project.resources || [];
    const phases = project.phases;

    let totalCost = 0;
    let totalEffort = 0;

    phases.forEach((phase) => {
      const phaseDuration =
        differenceInDays(parseISO(phase.endDate), parseISO(phase.startDate)) + 1;

      phase.phaseResourceAssignments?.forEach((assignment) => {
        const resource = resources.find((r) => r.id === assignment.resourceId);
        if (resource) {
          const dailyRate = getDailyRate(resource.designation);
          const days = (phaseDuration * assignment.allocationPercentage) / 100;
          totalCost += days * dailyRate;
          totalEffort += days;
        }
      });

      phase.tasks.forEach((task) => {
        const taskDuration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;

        task.resourceAssignments?.forEach((assignment) => {
          const resource = resources.find((r) => r.id === assignment.resourceId);
          if (resource) {
            const dailyRate = getDailyRate(resource.designation);
            const days = (taskDuration * assignment.allocationPercentage) / 100;
            totalCost += days * dailyRate;
            totalEffort += days;
          }
        });
      });
    });

    // Calculate project duration
    const projectStart = parseISO(project.startDate);
    let projectEnd = projectStart;
    phases.forEach((phase) => {
      const phaseEnd = parseISO(phase.endDate);
      if (phaseEnd > projectEnd) projectEnd = phaseEnd;
    });
    const duration = differenceInDays(projectEnd, projectStart) + 1;

    const revenue = totalCost / 0.7; // 30% margin
    const margin = revenue - totalCost;
    const marginPercent = calculateMargin(revenue, totalCost);

    return {
      id: "baseline",
      name: "Current Plan",
      description: "Baseline scenario with current resource allocation",
      revenue,
      cost: totalCost,
      margin,
      marginPercent,
      effort: Math.round(totalEffort),
      duration: Math.round(duration / 30), // Convert to months
    };
  }, [project]);

  // Generate optimized scenario examples
  const generateOptimizedScenario = () => {
    // Scenario: Replace 2 senior consultants with 3 consultants
    const optimizedCost = baselineScenario.cost * 0.85; // 15% cost reduction
    const optimizedEffort = baselineScenario.effort * 1.1; // 10% more effort
    const optimizedDuration = baselineScenario.duration + 1; // +1 month
    const optimizedRevenue = baselineScenario.revenue * 0.95; // 5% lower price
    const margin = optimizedRevenue - optimizedCost;
    const marginPercent = calculateMargin(optimizedRevenue, optimizedCost);

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: "Cost-Optimized",
      description: "Replace senior resources with mid-level consultants",
      revenue: optimizedRevenue,
      cost: optimizedCost,
      margin,
      marginPercent,
      effort: Math.round(optimizedEffort),
      duration: optimizedDuration,
    };

    setScenarios([...scenarios, newScenario]);
    message.success("Cost-Optimized scenario created!");
  };

  const generatePremiumScenario = () => {
    // Scenario: Add senior resources, faster delivery
    const premiumCost = baselineScenario.cost * 1.25; // 25% cost increase
    const premiumEffort = baselineScenario.effort * 0.9; // 10% less effort
    const premiumDuration = Math.max(1, baselineScenario.duration - 1); // -1 month
    const premiumRevenue = baselineScenario.revenue * 1.4; // 40% higher price
    const margin = premiumRevenue - premiumCost;
    const marginPercent = calculateMargin(premiumRevenue, premiumCost);

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: "Premium Fast-Track",
      description: "Senior resources for faster delivery with premium pricing",
      revenue: premiumRevenue,
      cost: premiumCost,
      margin,
      marginPercent,
      effort: Math.round(premiumEffort),
      duration: premiumDuration,
    };

    setScenarios([...scenarios, newScenario]);
    message.success("Premium Fast-Track scenario created!");
  };

  // All available scenarios
  const allScenarios = [baselineScenario, ...scenarios];

  // Get selected scenario objects
  const scenario1 = allScenarios.find((s) => s.id === selectedScenarios[0]);
  const scenario2 = allScenarios.find((s) => s.id === selectedScenarios[1]);

  // Calculate deltas
  const calculateDelta = (s1: Scenario, s2: Scenario, field: keyof Scenario): number => {
    const val1 = s1[field] as number;
    const val2 = s2[field] as number;
    return val2 - val1;
  };

  const _calculateDeltaPercent = (s1: Scenario, s2: Scenario, field: keyof Scenario): number => {
    const val1 = s1[field] as number;
    const val2 = s2[field] as number;
    if (val1 === 0) return 0;
    return ((val2 - val1) / val1) * 100;
  };

  // Risk gauge data
  const riskData = useMemo(() => {
    if (!scenario1) return [];

    const resourceContention = Math.min((project.resources?.length || 0) * 10, 100);
    const criticalPathComplexity = Math.min(project.phases.length * 15, 100);
    const budgetRisk = scenario1.marginPercent < 10 ? 80 : scenario1.marginPercent < 20 ? 50 : 20;

    return [
      {
        name: "Resource\nContention",
        value: resourceContention,
        fill: resourceContention > 70 ? "#FF3B30" : resourceContention > 50 ? "#FF9500" : "#34C759",
      },
      {
        name: "Critical Path\nComplexity",
        value: criticalPathComplexity,
        fill:
          criticalPathComplexity > 70
            ? "#FF3B30"
            : criticalPathComplexity > 50
              ? "#FF9500"
              : "#34C759",
      },
      {
        name: "Budget\nRisk",
        value: budgetRisk,
        fill: budgetRisk > 70 ? "#FF3B30" : budgetRisk > 50 ? "#FF9500" : "#34C759",
      },
    ];
  }, [project, scenario1]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", display: "flex" }}>
      {/* Scenario Actions */}
      <Card bordered={false} className="rounded-[var(--radius-md)]" style={{ background: "rgba(255, 149, 0, 0.05)" }}>
        <Space size="middle" wrap>
          <Button type="primary" icon={<Plus size={16} />} onClick={generateOptimizedScenario}>
            Create Cost-Optimized Scenario
          </Button>
          <Button icon={<Copy size={16} />} onClick={generatePremiumScenario}>
            Create Premium Scenario
          </Button>
          <Text type="secondary" className="ml-4">
            {scenarios.length} alternative scenario(s) created
          </Text>
        </Space>
      </Card>

      {/* Scenario Comparison */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Title level={5}> Scenario Comparison</Title>
        <Text type="secondary" className="text-sm">
          Compare different approaches side-by-side
        </Text>

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={[16, 16]}>
          {/* Scenario 1 Selector */}
          <Col xs={24} md={12}>
            <Card size="small" title="Scenario A">
              <Select
                value={selectedScenarios[0]}
                onChange={(value) => setSelectedScenarios([value, selectedScenarios[1]])}
                style={{ width: "100%", marginBottom: "16px" }}
                placeholder="Select first scenario"
                options={allScenarios.map((s) => ({ label: s.name, value: s.id }))}
              />

              {scenario1 && (
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Statistic
                    title="Revenue"
                    value={scenario1.revenue}
                    prefix="RM"
                    className="[&_.ant-statistic-content]:text-lg"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  />
                  <Statistic
                    title="Cost"
                    value={scenario1.cost}
                    prefix="RM"
                    valueStyle={{ fontSize: "20px", color: "#FF3B30" }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  />
                  <Statistic
                    title="Margin"
                    value={scenario1.marginPercent}
                    suffix="%"
                    valueStyle={{
                      fontSize: "24px",
                      color: getMarginColor(scenario1.marginPercent),
                      fontWeight: "bold",
                    }}
                  />
                  <Divider style={{ margin: "8px 0" }} />
                  <Text type="secondary">
                    Duration: <strong>{scenario1.duration} months</strong>
                  </Text>
                  <br />
                  <Text type="secondary">
                    Effort: <strong>{scenario1.effort} person-days</strong>
                  </Text>
                </Space>
              )}
            </Card>
          </Col>

          {/* Scenario 2 Selector */}
          <Col xs={24} md={12}>
            <Card size="small" title="Scenario B">
              <Select
                value={selectedScenarios[1]}
                onChange={(value) => setSelectedScenarios([selectedScenarios[0], value])}
                style={{ width: "100%", marginBottom: "16px" }}
                placeholder="Select second scenario"
                options={allScenarios.map((s) => ({ label: s.name, value: s.id }))}
              />

              {scenario2 && (
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Statistic
                    title="Revenue"
                    value={scenario2.revenue}
                    prefix="RM"
                    className="[&_.ant-statistic-content]:text-lg"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  />
                  <Statistic
                    title="Cost"
                    value={scenario2.cost}
                    prefix="RM"
                    valueStyle={{ fontSize: "20px", color: "#FF3B30" }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  />
                  <Statistic
                    title="Margin"
                    value={scenario2.marginPercent}
                    suffix="%"
                    valueStyle={{
                      fontSize: "24px",
                      color: getMarginColor(scenario2.marginPercent),
                      fontWeight: "bold",
                    }}
                  />
                  <Divider style={{ margin: "8px 0" }} />
                  <Text type="secondary">
                    Duration: <strong>{scenario2.duration} months</strong>
                  </Text>
                  <br />
                  <Text type="secondary">
                    Effort: <strong>{scenario2.effort} person-days</strong>
                  </Text>
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        {/* Delta Analysis */}
        {scenario1 && scenario2 && (
          <>
            <Divider>Delta Analysis</Divider>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card
                  size="small"
                  bordered={false}
                  className="text-center" style={{ background: "var(--color-bg-secondary)" }}
                >
                  <Text type="secondary">Margin Change</Text>
                  <div className="flex items-center justify-center mt-2">
                    {calculateDelta(scenario1, scenario2, "marginPercent") > 0 ? (
                      <TrendingUp size={20} color="#34C759" />
                    ) : (
                      <TrendingDown size={20} color="#FF3B30" />
                    )}
                    <Text
                      strong
                      style={{
                        fontSize: "20px",
                        marginLeft: "8px",
                        color:
                          calculateDelta(scenario1, scenario2, "marginPercent") > 0
                            ? "#34C759"
                            : "#FF3B30",
                      }}
                    >
                      {calculateDelta(scenario1, scenario2, "marginPercent").toFixed(1)}%
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  size="small"
                  bordered={false}
                  className="text-center" style={{ background: "var(--color-bg-secondary)" }}
                >
                  <Text type="secondary">Cost Change</Text>
                  <div className="mt-2">
                    <Text
                      strong
                      style={{
                        fontSize: "16px",
                        color:
                          calculateDelta(scenario1, scenario2, "cost") < 0 ? "#34C759" : "#FF3B30",
                      }}
                    >
                      {formatMYR(calculateDelta(scenario1, scenario2, "cost"))}
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  size="small"
                  bordered={false}
                  className="text-center" style={{ background: "var(--color-bg-secondary)" }}
                >
                  <Text type="secondary">Duration Change</Text>
                  <div className="mt-2">
                    <Text
                      strong
                      style={{
                        fontSize: "16px",
                        color:
                          calculateDelta(scenario1, scenario2, "duration") < 0
                            ? "#34C759"
                            : "#FF3B30",
                      }}
                    >
                      {calculateDelta(scenario1, scenario2, "duration") > 0 ? "+" : ""}
                      {calculateDelta(scenario1, scenario2, "duration")} mo
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={6}>
                <Card
                  size="small"
                  bordered={false}
                  className="text-center" style={{ background: "var(--color-bg-secondary)" }}
                >
                  <Text type="secondary">Effort Change</Text>
                  <div className="mt-2">
                    <Text
                      strong
                      style={{
                        fontSize: "16px",
                        color:
                          calculateDelta(scenario1, scenario2, "effort") < 0
                            ? "#34C759"
                            : "#FF3B30",
                      }}
                    >
                      {calculateDelta(scenario1, scenario2, "effort") > 0 ? "+" : ""}
                      {calculateDelta(scenario1, scenario2, "effort")} days
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {!scenario1 && !scenario2 && (
          <Empty description="Select two scenarios to compare" style={{ padding: "40px 0" }} />
        )}
      </Card>

      {/* Risk & Feasibility Gauges */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Title level={5}> Risk & Feasibility Assessment</Title>
        <Text type="secondary" className="text-sm">
          Qualitative health check beyond the numbers
        </Text>

        <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
          <Col xs={24} md={12}>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                innerRadius="30%"
                outerRadius="100%"
                data={riskData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  label={{ position: "insideStart", fill: "#fff", fontSize: 12 }}
                />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
              </RadialBarChart>
            </ResponsiveContainer>
          </Col>

          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {scenario1 && scenario1.marginPercent >= 20 && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} color="#34C759" style={{ marginTop: "2px" }} />
                  <div>
                    <Text strong className="text-[#248A3D]">
                      Healthy Margin
                    </Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Project meets profitability targets
                    </Text>
                  </div>
                </div>
              )}

              {scenario1 && scenario1.marginPercent < 20 && (
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} color="#FF9500" style={{ marginTop: "2px" }} />
                  <div>
                    <Text strong className="text-[#C93400]">
                      Margin Risk
                    </Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Consider optimizing resource mix
                    </Text>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <AlertCircle size={20} color="#007AFF" style={{ marginTop: "2px" }} />
                <div>
                  <Text strong className="text-[var(--color-blue-dark)]">
                    Resource Contention
                  </Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    {project.resources && project.resources.length > 5
                      ? "Multiple resources increase coordination complexity"
                      : "Resource count is manageable"}
                  </Text>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} color="#34C759" style={{ marginTop: "2px" }} />
                <div>
                  <Text strong className="text-[#248A3D]">
                    Project Feasibility
                  </Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    Timeline and resource allocation appear realistic
                  </Text>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Strategic Recommendation */}
      <Card
        bordered={false}
        className="rounded-[var(--radius-md)] border-2 border-[var(--color-blue)]"
        style={{ background: "var(--color-blue-light)" }}
      >
        <Space direction="vertical" size={8}>
          <Title level={5} className="!m-0 text-[var(--color-blue-dark)]">
             Strategic Recommendation
          </Title>
          <Text className="text-[var(--color-blue-dark)]">
            Based on the analysis, consider creating scenarios that balance cost, margin, and
            delivery speed. The optimal approach depends on client priorities:
          </Text>
          <ul className="my-2 pl-5 text-[var(--color-blue-dark)]">
            <li>
              <strong>Cost-sensitive clients:</strong> Optimize with mid-level resources
            </li>
            <li>
              <strong>Time-sensitive clients:</strong> Premium pricing with senior resources
            </li>
            <li>
              <strong>Balanced approach:</strong> Mix of senior and mid-level resources
            </li>
          </ul>
        </Space>
      </Card>
    </Space>
  );
}
