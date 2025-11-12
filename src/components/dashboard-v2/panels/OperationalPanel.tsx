/**
 * Operational Panel - Gantt Timeline & Resource Heatmap
 * Shows operational reality: resource allocation, capacity planning, and skill gaps
 */

"use client";

import { useMemo } from "react";
import { Space, Statistic, Row, Col, Alert, Typography, Tag, Divider } from "antd";
import { Users, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { GanttProject } from "@/types/gantt-tool";
import { ResourceHeatmap } from "@/components/dashboard/ResourceHeatmap";
import { ValidationResult } from "@/lib/dashboard/validation-engine";

const { Text } = Typography;

interface OperationalPanelProps {
  project: GanttProject;
  validation: ValidationResult;
}

export function OperationalPanel({ project, validation }: OperationalPanelProps) {
  // Calculate operational metrics
  const metrics = useMemo(() => {
    // Project duration
    const dates = project.phases
      .flatMap((phase) => [new Date(phase.startDate), new Date(phase.endDate)])
      .filter((d) => !isNaN(d.getTime()));

    const startDate =
      dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
    const endDate =
      dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const durationMonths = Math.round(durationDays / 30);

    // Task metrics
    const totalTasks = project.phases.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0);
    const completedTasks = project.phases.reduce(
      (sum, phase) => sum + (phase.tasks?.filter((t) => t.progress === 100).length || 0),
      0
    );
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Resource metrics
    const totalResources = project.resources?.length || 0;
    const assignedResources = new Set();

    project.phases.forEach((phase) => {
      phase.phaseResourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
      phase.tasks?.forEach((task) => {
        task.resourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
      });
    });

    // Detect over-allocation
    const overAllocatedResources = validation.violations
      .filter((v) => v.rule === "resource_allocation")
      .map((v) => v.context?.resourceName)
      .filter(Boolean);

    return {
      startDate,
      endDate,
      durationDays,
      durationMonths,
      totalTasks,
      completedTasks,
      progressPercent,
      totalResources,
      assignedResources: assignedResources.size,
      overAllocatedResources,
    };
  }, [project, validation]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="Project Duration"
            value={metrics.durationMonths}
            suffix="months"
            prefix={<Calendar size={20} style={{ color: "#3B82F6" }} />}
            valueStyle={{ color: "#3B82F6", fontSize: "24px" }}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {metrics.durationDays} business days
          </Text>
        </Col>
        <Col span={12}>
          <Statistic
            title="Resources"
            value={metrics.assignedResources}
            suffix={`/ ${metrics.totalResources}`}
            prefix={<Users size={20} style={{ color: "#10B981" }} />}
            valueStyle={{ color: "#10B981", fontSize: "24px" }}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {metrics.totalResources - metrics.assignedResources} unassigned
          </Text>
        </Col>
        <Col span={12}>
          <Statistic
            title="Tasks"
            value={metrics.completedTasks}
            suffix={`/ ${metrics.totalTasks}`}
            prefix={<CheckCircle size={20} style={{ color: "#8B5CF6" }} />}
            valueStyle={{ color: "#8B5CF6", fontSize: "24px" }}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {metrics.progressPercent}% complete
          </Text>
        </Col>
        <Col span={12}>
          <Statistic
            title="Over-Allocated"
            value={metrics.overAllocatedResources.length}
            prefix={
              <AlertCircle
                size={20}
                style={{ color: metrics.overAllocatedResources.length > 0 ? "#EF4444" : "#10B981" }}
              />
            }
            valueStyle={{
              color: metrics.overAllocatedResources.length > 0 ? "#EF4444" : "#10B981",
              fontSize: "24px",
            }}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            resource conflicts
          </Text>
        </Col>
      </Row>

      {/* Alerts for Over-Allocation */}
      {metrics.overAllocatedResources.length > 0 && (
        <Alert
          message="Resource Conflicts Detected"
          description={
            <Space direction="vertical" size="small">
              <Text>The following resources have overlapping assignments:</Text>
              <Space wrap>
                {metrics.overAllocatedResources.slice(0, 5).map((name, idx) => (
                  <Tag key={idx} color="red">
                    {name}
                  </Tag>
                ))}
                {metrics.overAllocatedResources.length > 5 && (
                  <Text type="secondary">+{metrics.overAllocatedResources.length - 5} more</Text>
                )}
              </Space>
            </Space>
          }
          type="warning"
          showIcon
          closable
          style={{ marginTop: "8px" }}
        />
      )}

      <Divider />

      {/* Resource Heatmap */}
      <div>
        <Text strong style={{ fontSize: "14px", marginBottom: "12px", display: "block" }}>
          Weekly Resource Allocation
        </Text>
        <Text type="secondary" style={{ fontSize: "12px", marginBottom: "16px", display: "block" }}>
          Color coding:  Optimal (0-5 days) |  Full (6 days) |  Over-allocated (7+ days) | 
          Bench (0 days)
        </Text>
        <ResourceHeatmap project={project} />
      </div>

      {/* Timeline Summary */}
      <div style={{ marginTop: "16px" }}>
        <Text strong style={{ fontSize: "14px", marginBottom: "8px", display: "block" }}>
          Timeline Overview
        </Text>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Start Date:</Text>
            <Text>{metrics.startDate.toLocaleDateString()}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">End Date:</Text>
            <Text>{metrics.endDate.toLocaleDateString()}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Phases:</Text>
            <Text>{project.phases.length}</Text>
          </div>
        </Space>
      </div>
    </Space>
  );
}
