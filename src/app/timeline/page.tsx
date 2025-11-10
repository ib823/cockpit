/**
 * Timeline Page
 *
 * Main page for project timeline and Gantt chart visualization.
 * Features:
 * - Interactive Gantt chart with vis-timeline
 * - Resource allocation table
 * - Start date picker
 * - Sync controls with estimator
 * - Save and export functionality
 */

"use client";

import { useState, useEffect } from "react";
import { Card, DatePicker, Button, Space, Typography, Alert } from "antd";
import { SaveOutlined, ExportOutlined, CalendarOutlined } from "@ant-design/icons";
import { VisGanttChart } from "@/components/timeline/VisGanttChart";
import {
  ResourceTable,
  DEFAULT_RESOURCES,
  type ResourceAllocation,
} from "@/components/timeline/ResourceTable";
import { SyncControls } from "@/components/timeline/SyncControls";
import { useEstimatorStore } from "@/stores/estimator-store";
import type { PhaseBreakdown } from "@/lib/estimator/types";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

export default function TimelinePage() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [phases, setPhases] = useState<PhaseBreakdown[]>([]);
  const [resources, setResources] = useState<ResourceAllocation[]>(DEFAULT_RESOURCES);
  const [isLocked, setIsLocked] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Get estimator results
  const estimatorResults = useEstimatorStore((state) => state.results);
  const hasEstimatorResults = useEstimatorStore((state) => state.results !== null);

  // Sync phases from estimator when results change (if not locked)
  useEffect(() => {
    if (estimatorResults?.phases && !isLocked) {
      console.warn("[Timeline] Syncing phases from estimator:", estimatorResults.phases.length);
      setPhases(estimatorResults.phases);

      // Recalculate resource costs based on new phases
      const updatedResources = resources.map((r) => ({
        ...r,
        totalCost: calculateResourceCost(r, estimatorResults.phases),
      }));
      setResources(updatedResources);
    }
  }, [estimatorResults, isLocked]);

  // Calculate resource cost based on phase durations
  const calculateResourceCost = (
    resource: ResourceAllocation,
    phaseData: PhaseBreakdown[]
  ): number => {
    const relevantPhases = phaseData.filter((p) => resource.phases.includes(p.phaseName));
    const totalMonths = relevantPhases.reduce((sum, p) => sum + p.durationMonths, 0);
    return resource.fte * resource.ratePerDay * 22 * totalMonths;
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    if (date) {
      setStartDate(date.toDate());
    }
  };

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
  };

  const handleForceSync = () => {
    if (estimatorResults?.phases) {
      setSyncInProgress(true);
      setTimeout(() => {
        setPhases(estimatorResults.phases);
        setSyncInProgress(false);
      }, 500);
    }
  };

  const handlePhaseUpdate = (updatedPhases: PhaseBreakdown[]) => {
    setPhases(updatedPhases);

    // Recalculate resource costs
    const updatedResources = resources.map((r) => ({
      ...r,
      totalCost: calculateResourceCost(r, updatedPhases),
    }));
    setResources(updatedResources);
  };

  const handleResourcesChange = (updatedResources: ResourceAllocation[]) => {
    setResources(updatedResources);
  };

  // Calculate project end date
  const getProjectEndDate = (): string => {
    if (phases.length === 0) return "N/A";

    const totalMonths = phases.reduce((sum, p) => sum + p.durationMonths, 0);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + totalMonths);

    return endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Title level={2}>Project Timeline</Title>
        <Text type="secondary">
          Interactive Gantt chart and resource allocation for SAP S/4HANA implementation
        </Text>
      </div>

      {/* Alert if no estimator results */}
      {!hasEstimatorResults && (
        <Alert
          message="No estimator results available"
          description="Please configure and run the estimator first to generate timeline phases."
          type="warning"
          showIcon
          className="mb-4"
          action={
            <Button size="small" type="link" href="/estimator">
              Go to Estimator
            </Button>
          }
        />
      )}

      {/* Project Schedule Card */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Project Schedule</span>
          </Space>
        }
        className="mb-4"
        extra={<Text type="secondary">End Date: {getProjectEndDate()}</Text>}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <DatePicker
              value={dayjs(startDate)}
              onChange={handleStartDateChange}
              format="YYYY-MM-DD"
              placeholder="Select start date"
            />
            <SyncControls
              isLocked={isLocked}
              onToggleLock={handleToggleLock}
              onForceSync={handleForceSync}
              syncInProgress={syncInProgress}
            />
          </div>

          {/* Gantt Chart */}
          {phases.length > 0 ? (
            <VisGanttChart
              phases={phases}
              startDate={startDate}
              onPhaseUpdate={handlePhaseUpdate}
              editable={!isLocked}
            />
          ) : (
            <div className="text-center py-12 border rounded bg-white">
              <Text type="secondary">
                {hasEstimatorResults
                  ? "No phases available. Please run the estimator calculation."
                  : "Configure the estimator to generate timeline phases."}
              </Text>
            </div>
          )}
        </Space>
      </Card>

      {/* Resource Allocation Card */}
      <Card title="Resource Allocation" className="mb-4">
        <ResourceTable
          resources={resources}
          onResourcesChange={handleResourcesChange}
          phases={phases}
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="primary" size="large" icon={<SaveOutlined />} disabled={phases.length === 0}>
          Save Timeline
        </Button>
        <Button size="large" icon={<ExportOutlined />} disabled={phases.length === 0}>
          Export Schedule
        </Button>
      </div>
    </div>
  );
}
