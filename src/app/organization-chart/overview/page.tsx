/**
 * Organization Chart - High-Level Overview/Presentation Page
 *
 * Professional org chart view with:
 * - Phase filtering (All, by Phase)
 * - Group hierarchies (Lead + Team members)
 * - Counterpart/Client teams
 * - Export to PNG/PDF for presentations
 */

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { Button, App, Tag, Select, Radio, Badge } from 'antd';
import {
  LeftOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrgPosition {
  id: string;
  resourceId?: string;
}

interface OrgGroup {
  id: string;
  name: string;
  positions: OrgPosition[];
  leadPositionId?: string;
  isCounterpart?: boolean;
  counterpartCount?: number;
  counterpartColor?: string;
}

interface OrgLevel {
  id: string;
  name: string;
  groups: OrgGroup[];
}

interface SimpleOrgChart {
  levels: OrgLevel[];
}

type ViewMode = 'all' | 'by-phase';

export default function OrganizationChartOverviewPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { currentProject } = useGanttToolStoreV2();
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // Load org chart from current project
  const orgChart: SimpleOrgChart = currentProject?.orgChart || { levels: [] };

  // Get resource by ID
  const getResource = useCallback((resourceId: string) => {
    return currentProject?.resources.find(r => r.id === resourceId);
  }, [currentProject]);

  // Check if resource is assigned to selected phase
  const isResourceInPhase = useCallback((resourceId: string, phaseId: string) => {
    if (!currentProject) return false;
    const phase = currentProject.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    // Check phase-level assignments
    if (phase.phaseResourceAssignments?.some(a => a.resourceId === resourceId)) {
      return true;
    }

    // Check task-level assignments
    return phase.tasks.some(task =>
      task.resourceAssignments?.some(a => a.resourceId === resourceId)
    );
  }, [currentProject]);

  // Filter positions based on view mode
  const getFilteredPositions = useCallback((positions: OrgPosition[]) => {
    if (viewMode === 'all' || !selectedPhaseId) {
      return positions;
    }

    return positions.filter(pos => {
      if (!pos.resourceId) return false;
      return isResourceInPhase(pos.resourceId, selectedPhaseId);
    });
  }, [viewMode, selectedPhaseId, isResourceInPhase]);

  // Export functions
  const exportToPNG = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      const fileName = viewMode === 'all'
        ? `${currentProject?.name || 'org-chart'}-overview.png`
        : `${currentProject?.name || 'org-chart'}-${selectedPhaseId}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();

      message.success('Exported to PNG');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, message, viewMode, selectedPhaseId]);

  const exportToPDF = useCallback(async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 10;

      pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, Math.min(imgHeight, pageHeight - 20));

      const fileName = viewMode === 'all'
        ? `${currentProject?.name || 'org-chart'}-overview.pdf`
        : `${currentProject?.name || 'org-chart'}-${selectedPhaseId}.pdf`;
      pdf.save(fileName);

      message.success('Exported to PDF');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, message, viewMode, selectedPhaseId]);

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <TeamOutlined style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-4">Please select or create a project first.</p>
          <Button type="primary" size="large" onClick={() => router.push('/gantt-tool')}>
            Go to Gantt Tool
          </Button>
        </div>
      </div>
    );
  }

  if (!orgChart || orgChart.levels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <TeamOutlined style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Chart</h2>
          <p className="text-gray-600 mb-4">
            Create an organization chart first before viewing the overview.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push('/organization-chart')}
          >
            Create Organization Chart
          </Button>
        </div>
      </div>
    );
  }

  const selectedPhase = selectedPhaseId
    ? currentProject.phases.find(p => p.id === selectedPhaseId)
    : null;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => router.push('/organization-chart')}
              size="large"
            />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Organization Chart - Presentation View
              </h1>
              <p className="text-sm text-gray-600">{currentProject.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Selection */}
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} size="large">
              <Radio.Button value="all">All Resources</Radio.Button>
              <Radio.Button value="by-phase">By Phase</Radio.Button>
            </Radio.Group>

            {/* Phase Selector */}
            {viewMode === 'by-phase' && (
              <Select
                placeholder="Select phase"
                value={selectedPhaseId}
                onChange={setSelectedPhaseId}
                size="large"
                style={{ width: 200 }}
                options={currentProject.phases.map(phase => ({
                  value: phase.id,
                  label: phase.name,
                }))}
              />
            )}

            {/* Export Buttons */}
            <Button
              icon={<FileImageOutlined />}
              onClick={exportToPNG}
              loading={isExporting}
              size="large"
            >
              Export PNG
            </Button>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={exportToPDF}
              loading={isExporting}
              size="large"
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-auto p-12 bg-white">
        <div ref={chartRef} className="max-w-[1600px] mx-auto bg-white p-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {currentProject.name}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Organization Structure
            </h2>
            {viewMode === 'by-phase' && selectedPhase && (
              <div className="mt-3">
                <Tag
                  color={selectedPhase.color || 'blue'}
                  style={{ fontSize: '16px', padding: '8px 16px' }}
                >
                  {selectedPhase.name}
                </Tag>
              </div>
            )}
          </div>

          {/* Levels and Groups - Org Chart Style */}
          <div className="space-y-16">
            {orgChart.levels.map((level, levelIndex) => {
              return (
                <div key={level.id} className="relative">
                  {/* Connecting Line to Previous Level */}
                  {levelIndex > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-200 rounded-full" />
                    </div>
                  )}

                  {/* Level Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-lg">
                      <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-lg">
                        {levelIndex + 1}
                      </div>
                      <h2 className="text-xl font-bold">{level.name}</h2>
                    </div>
                  </div>

                  {/* Groups - Horizontal Layout with Connecting Lines */}
                  <div className="relative">
                    {/* Horizontal Line connecting all groups */}
                    {level.groups.length > 1 && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-blue-300" style={{ top: '-20px' }} />
                    )}

                    {/* Groups Grid - Responsive layout */}
                    <div className="flex flex-wrap justify-center gap-8">
                      {level.groups.map((group) => {
                        // For counterpart groups, use manual count; for internal groups, use actual positions
                        const filteredPositions = getFilteredPositions(group.positions);
                        const displayCount = group.isCounterpart
                          ? (group.counterpartCount || 0)
                          : filteredPositions.length;
                        const leadPosition = group.leadPositionId
                          ? filteredPositions.find(p => p.id === group.leadPositionId)
                          : null;
                        const teamMembers = filteredPositions.filter(p => p.id !== group.leadPositionId);

                        // Skip empty groups in phase view (but always show counterpart groups)
                        if (viewMode === 'by-phase' && !group.isCounterpart && filteredPositions.length === 0) {
                          return null;
                        }

                        // Determine colors for counterpart groups
                        const counterpartColor = group.isCounterpart
                          ? (group.counterpartColor || '#9333ea')
                          : '#3b82f6';

                        const boxStyle = group.isCounterpart
                          ? {
                              borderWidth: '3px',
                              minWidth: '200px',
                              maxWidth: '250px',
                              background: `linear-gradient(to bottom right, ${counterpartColor}20, ${counterpartColor}10)`,
                              borderColor: counterpartColor,
                            }
                          : {
                              borderWidth: '3px',
                              minWidth: '200px',
                              maxWidth: '250px',
                            };

                        return (
                          <div key={group.id} className="flex flex-col items-center">
                            {/* Vertical line to group */}
                            {level.groups.length > 1 && (
                              <div className="w-px h-5 bg-blue-300 mb-3" />
                            )}

                            {/* Group Box - Traditional Org Chart Style */}
                            <div
                              className={`w-full min-h-[140px] rounded-lg border-3 p-4 shadow-md transition-all ${
                                group.isCounterpart
                                  ? ''
                                  : 'bg-white border-blue-500'
                              }`}
                              style={boxStyle}
                            >
                              {/* Group Name */}
                              <div className="text-center mb-3">
                                <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                                  {group.name}
                                </h3>
                                {group.isCounterpart && (
                                  <div
                                    className="text-xs font-semibold mt-1"
                                    style={{ color: counterpartColor }}
                                  >
                                    (Client/Counterpart)
                                  </div>
                                )}
                              </div>

                              {/* Team Count - Clean and Simple */}
                              <div className="text-center py-4 border-t-2 border-gray-200">
                                <div className="flex flex-col items-center gap-1">
                                  <TeamOutlined style={{ fontSize: 24, color: counterpartColor }} />
                                  <div className="text-3xl font-bold" style={{ color: counterpartColor }}>
                                    {displayCount}
                                  </div>
                                  <div className="text-xs text-gray-600 font-medium uppercase">
                                    {displayCount === 1 ? 'Resource' : 'Resources'}
                                  </div>
                                </div>
                              </div>

                              {/* Lead Indicator (just an icon, no name) */}
                              {leadPosition && (
                                <div className="text-center mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-center gap-1">
                                    <CrownOutlined style={{ fontSize: 14, color: '#f59e0b' }} />
                                    <span className="text-xs text-gray-600">Has Lead</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Generated on {new Date().toLocaleDateString()} • {currentProject.name}
              {viewMode === 'by-phase' && selectedPhase && ` • ${selectedPhase.name}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
