/**
 * Operational View - Layer 1 of Three-Layer Dashboard
 *
 * Answers: "Are the activities logically sequenced and are the right resources assigned at the right time?"
 *
 * Components:
 * - Gantt Chart Summary (Timeline visualization)
 * - Resource Allocation Heatmap (Capacity planning)
 * - Key operational metrics
 */

"use client";

import { useMemo } from "react";
import { Row, Col, Statistic, Card, Space, Typography, Divider } from "antd";
import { Calendar, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { GanttProject } from "@/types/gantt-tool";
import { ResourceHeatmap } from "./ResourceHeatmap";
import { differenceInDays, parseISO, format } from "date-fns";

const { Title, Text } = Typography;

interface OperationalViewProps {
  project: GanttProject;
}

export function OperationalView({ project }: OperationalViewProps) {
  const metrics = useMemo(() => {
    const phases = project.phases;
    const resources = project.resources || [];

    // Calculate project duration
    const projectStart = parseISO(project.startDate);
    let projectEnd = projectStart;
    phases.forEach((phase) => {
      const phaseEnd = parseISO(phase.endDate);
      if (phaseEnd > projectEnd) projectEnd = phaseEnd;
    });
    const durationDays = differenceInDays(projectEnd, projectStart) + 1;
    const durationMonths = Math.round(durationDays / 30);

    // Count total tasks
    const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);

    // Count completed tasks (progress = 100)
    const completedTasks = phases.reduce((sum, phase) => {
      return sum + phase.tasks.filter((task) => task.progress === 100).length;
    }, 0);

    // Calculate overall progress
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Check for resource conflicts (over-allocation)
    let overallocatedResources = 0;
    resources.forEach((resource) => {
      let hasOverallocation = false;

      // Simple check: if resource is assigned to multiple overlapping tasks
      const assignments: Array<{ start: Date; end: Date; allocation: number }> = [];

      phases.forEach((phase) => {
        phase.phaseResourceAssignments?.forEach((assignment) => {
          if (assignment.resourceId === resource.id) {
            assignments.push({
              start: parseISO(phase.startDate),
              end: parseISO(phase.endDate),
              allocation: assignment.allocationPercentage,
            });
          }
        });

        phase.tasks.forEach((task) => {
          task.resourceAssignments?.forEach((assignment) => {
            if (assignment.resourceId === resource.id) {
              assignments.push({
                start: parseISO(task.startDate),
                end: parseISO(task.endDate),
                allocation: assignment.allocationPercentage,
              });
            }
          });
        });
      });

      // Check for overlapping assignments that exceed 100%
      for (let i = 0; i < assignments.length; i++) {
        for (let j = i + 1; j < assignments.length; j++) {
          const a1 = assignments[i];
          const a2 = assignments[j];

          // Check if they overlap
          if (a1.start <= a2.end && a2.start <= a1.end) {
            if (a1.allocation + a2.allocation > 100) {
              hasOverallocation = true;
              break;
            }
          }
        }
        if (hasOverallocation) break;
      }

      if (hasOverallocation) overallocatedResources++;
    });

    return {
      projectStart: format(projectStart, "MMM d, yyyy"),
      projectEnd: format(projectEnd, "MMM d, yyyy"),
      durationDays,
      durationMonths,
      totalPhases: phases.length,
      totalTasks,
      completedTasks,
      overallProgress,
      totalResources: resources.length,
      overallocatedResources,
      totalMilestones: project.milestones?.length || 0,
    };
  }, [project]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", display: "flex" }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#EFF6FF", borderRadius: "8px" }}>
            <Statistic
              title="Project Duration"
              value={metrics.durationMonths}
              suffix="months"
              prefix={<Calendar size={20} style={{ color: "#3B82F6" }} />}
              valueStyle={{ color: "#3B82F6" }}
              className="[&_.ant-statistic-content]:text-2xl"
            />
            <Text type="secondary" className="text-xs">
              {metrics.durationDays} working days
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#F0FDF4", borderRadius: "8px" }}>
            <Statistic
              title="Total Resources"
              value={metrics.totalResources}
              prefix={<Users size={20} style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#10B981" }}
              className="[&_.ant-statistic-content]:text-2xl"
            />
            <Text type="secondary" className="text-xs">
              {metrics.totalPhases} phases, {metrics.totalTasks} tasks
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#ECFDF5", borderRadius: "8px" }}>
            <Statistic
              title="Progress"
              value={metrics.overallProgress}
              suffix="%"
              prefix={<CheckCircle size={20} style={{ color: "#10B981" }} />}
              valueStyle={{ color: "#10B981" }}
              className="[&_.ant-statistic-content]:text-2xl"
            />
            <Text type="secondary" className="text-xs">
              {metrics.completedTasks} of {metrics.totalTasks} tasks done
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: metrics.overallocatedResources > 0 ? "#FEF2F2" : "#F0FDF4",
              borderRadius: "8px",
            }}
          >
            <Statistic
              title="Resource Conflicts"
              value={metrics.overallocatedResources}
              prefix={
                metrics.overallocatedResources > 0 ? (
                  <AlertTriangle size={20} style={{ color: "#EF4444" }} />
                ) : (
                  <CheckCircle size={20} style={{ color: "#10B981" }} />
                )
              }
              valueStyle={{
                color: metrics.overallocatedResources > 0 ? "#EF4444" : "#10B981",
              }}
            />
            <Text type="secondary" className="text-xs">
              {metrics.overallocatedResources > 0
                ? "Resources over-allocated"
                : "No conflicts detected"}
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "8px 0" }} />

      {/* Timeline Summary */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Title level={5} style={{ margin: 0 }}>
             Project Timeline
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Start Date:</Text>
              <br />
              <Text strong className="text-base">
                {metrics.projectStart}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">End Date:</Text>
              <br />
              <Text strong className="text-base">
                {metrics.projectEnd}
              </Text>
            </Col>
          </Row>
        </Space>
      </Card>

      <Divider style={{ margin: "8px 0" }} />

      {/* Resource Allocation Heatmap */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>
               Resource Allocation Heatmap
            </Title>
            <Text type="secondary" className="text-sm">
              Weekly capacity planning - Identify bottlenecks and over-allocation
            </Text>
          </div>
          <ResourceHeatmap project={project} />
        </Space>
      </Card>

      {/* Insights */}
      <Card
        bordered={false}
        style={{
          borderRadius: "8px",
          background: metrics.overallocatedResources > 0 ? "#FEF3C7" : "#D1FAE5",
          border: `2px solid ${metrics.overallocatedResources > 0 ? "#F59E0B" : "#10B981"}`,
        }}
      >
        <Space direction="vertical" size={8}>
          <Title
            level={5}
            style={{ margin: 0, color: metrics.overallocatedResources > 0 ? "#92400E" : "#065F46" }}
          >
             Operational Insights
          </Title>
          {metrics.overallocatedResources > 0 ? (
            <>
              <Text style={{ color: "#92400E" }}>
                 <strong>{metrics.overallocatedResources}</strong> resource(s) are over-allocated.
                Consider redistributing work or adding team members.
              </Text>
              <Text style={{ color: "#92400E" }} className="text-sm">
                Tip: Look for red cells in the heatmap above to identify specific weeks with
                conflicts.
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: "#065F46" }}>
                 Resource allocation looks healthy! All team members have manageable workloads.
              </Text>
              <Text style={{ color: "#065F46" }} className="text-sm">
                Tip: Monitor utilization to ensure resources remain productive throughout the
                project.
              </Text>
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
}
