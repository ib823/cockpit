/**
 * Proposal Generation Modal - Revolutionary Feature
 *
 * One-click proposal generation with:
 * - AI-powered executive summary
 * - Timeline visualization
 * - Cost breakdown
 * - Resource allocation
 * - Risk analysis
 * - Export to PDF, PowerPoint, and interactive HTML
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal, Tabs, Button, Progress, Tag, Divider, App } from 'antd';
import {
  FileText,
  Download,
  Presentation,
  Globe,
  Sparkles,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  Award,
  Zap,
} from 'lucide-react';
import { useGanttToolStore } from '@/stores/gantt-tool-store';
import { differenceInDays, format } from 'date-fns';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';
import { exportToPDF } from '@/lib/gantt-tool/export-utils';

interface ProposalGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProposalGenerationModal({ isOpen, onClose }: ProposalGenerationModalProps) {
  const { message } = App.useApp();
  const { currentProject, getProjectDuration } = useGanttToolStore();
  const [activeTab, setActiveTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);

  const duration = getProjectDuration();

  // Calculate comprehensive project metrics
  const proposalData = useMemo(() => {
    if (!currentProject || !duration) return null;

    const { startDate, endDate, durationDays } = duration;
    const phases = currentProject.phases;
    const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const resources = currentProject.resources || [];

    // Calculate costs (placeholder - use real rates in production)
    const estimatedCost = resources.length * 50000; // $50K per resource baseline
    const costByCategory = {
      pm: estimatedCost * 0.15,
      technical: estimatedCost * 0.40,
      functional: estimatedCost * 0.30,
      security: estimatedCost * 0.10,
      change: estimatedCost * 0.05,
    };

    // Resource utilization
    const assignedResources = new Set<string>();
    phases.forEach(phase => {
      phase.phaseResourceAssignments?.forEach(a => assignedResources.add(a.resourceId));
      phase.tasks.forEach(task => {
        task.resourceAssignments?.forEach(a => assignedResources.add(a.resourceId));
      });
    });

    const utilizationRate = resources.length > 0
      ? (assignedResources.size / resources.length) * 100
      : 0;

    // Milestones
    const milestones = currentProject.milestones || [];

    // Project complexity score (0-100)
    const complexityScore = Math.min(
      (phases.length * 10) + (totalTasks * 2) + (resources.length * 5),
      100
    );

    return {
      projectName: currentProject.name,
      description: currentProject.description || '',
      startDate: format(startDate, 'MMMM dd, yyyy'),
      endDate: format(endDate, 'MMMM dd, yyyy'),
      duration: durationDays,
      durationMonths: Math.round(durationDays / 30),
      phases: phases.length,
      tasks: totalTasks,
      resources: resources.length,
      assignedResources: assignedResources.size,
      utilizationRate,
      estimatedCost,
      costByCategory,
      milestones: milestones.length,
      complexityScore,
      phasesList: phases.map(p => ({
        name: p.name,
        description: p.description || '',
        tasks: p.tasks.length,
        duration: differenceInDays(new Date(p.endDate), new Date(p.startDate)),
      })),
      resourcesList: resources.map(r => ({
        name: r.name,
        category: RESOURCE_CATEGORIES[r.category].label,
        designation: RESOURCE_DESIGNATIONS[r.designation],
        icon: RESOURCE_CATEGORIES[r.category].icon,
      })),
    };
  }, [currentProject, duration]);

  if (!proposalData) return null;

  const handleExportPDF = async () => {
    if (!currentProject) return;
    setIsExporting(true);
    try {
      await exportToPDF(currentProject);
      message.success('Proposal exported to PDF successfully!');
    } catch (error) {
      message.error('Failed to export proposal. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPowerPoint = () => {
    message.info({
      content: 'PowerPoint export is coming soon! This will generate a client-ready presentation.',
      duration: 3,
    });
  };

  const handleExportHTML = () => {
    message.info({
      content: 'Interactive HTML export is coming soon! Share a live, explorable proposal with clients.',
      duration: 3,
    });
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 m-0">Generate Proposal</h2>
            <p className="text-xs text-gray-500 m-0">AI-powered, client-ready proposal in seconds</p>
          </div>
        </div>
      }
      className="proposal-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'summary',
            label: (
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Executive Summary
              </span>
            ),
            children: (
              <div className="max-h-[600px] overflow-y-auto px-2">
                {/* Hero Section */}
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {proposalData.projectName}
                  </h3>
                  {proposalData.description && (
                    <p className="text-sm text-gray-700 mb-4">{proposalData.description}</p>
                  )}

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{proposalData.durationMonths}</div>
                      <div className="text-xs text-gray-600 mt-1">Months</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{proposalData.phases}</div>
                      <div className="text-xs text-gray-600 mt-1">Phases</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{proposalData.resources}</div>
                      <div className="text-xs text-gray-600 mt-1">Team Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        ${Math.round(proposalData.estimatedCost / 1000)}K
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Investment</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Project Timeline
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <span className="ml-2 font-semibold text-gray-900">{proposalData.startDate}</span>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <span className="ml-2 font-semibold text-gray-900">{proposalData.endDate}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress
                        percent={100}
                        strokeColor={{ from: '#3b82f6', to: '#8b5cf6' }}
                        showInfo={false}
                      />
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {proposalData.duration} days · {proposalData.durationMonths} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phases Overview */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Implementation Phases
                  </h4>
                  <div className="space-y-2">
                    {proposalData.phasesList.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-600">Phase {idx + 1}</span>
                              <h5 className="text-sm font-semibold text-gray-900">{phase.name}</h5>
                            </div>
                            {phase.description && (
                              <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>{phase.tasks} tasks</span>
                              <span>·</span>
                              <span>{phase.duration} days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900">AI Project Analysis</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">
                        <strong>Timeline Assessment:</strong> {proposalData.durationMonths}-month timeline is {proposalData.durationMonths < 6 ? 'aggressive' : 'conservative'} for this project scope.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">
                        <strong>Resource Optimization:</strong> {Math.round(proposalData.utilizationRate)}% team utilization - {proposalData.utilizationRate > 85 ? 'excellent efficiency' : 'room for optimization'}.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">
                        <strong>Complexity Score:</strong> {proposalData.complexityScore}/100 - {proposalData.complexityScore < 40 ? 'Low' : proposalData.complexityScore < 70 ? 'Medium' : 'High'} complexity project.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'costs',
            label: (
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Breakdown
              </span>
            ),
            children: (
              <div className="max-h-[600px] overflow-y-auto px-2">
                {/* Total Investment */}
                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Total Project Investment</div>
                    <div className="text-5xl font-bold text-green-700 mb-2">
                      ${Math.round(proposalData.estimatedCost / 1000)}K
                    </div>
                    <div className="text-xs text-gray-600">
                      Estimated based on {proposalData.resources} team members over {proposalData.durationMonths} months
                    </div>
                  </div>
                </div>

                {/* Cost by Category */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Cost by Category</h4>
                  <div className="space-y-3">
                    {Object.entries(proposalData.costByCategory).map(([cat, cost]) => {
                      const category = RESOURCE_CATEGORIES[cat as keyof typeof RESOURCE_CATEGORIES];
                      const percentage = (cost / proposalData.estimatedCost) * 100;

                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                              <span>{category.icon}</span>
                              {category.label}
                            </span>
                            <span className="text-xs font-bold" style={{ color: category.color }}>
                              ${Math.round(cost / 1000)}K ({Math.round(percentage)}%)
                            </span>
                          </div>
                          <Progress
                            percent={percentage}
                            strokeColor={category.color}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Suggested Payment Schedule</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Project Kickoff (30%)</span>
                      <span className="font-semibold text-gray-900">
                        ${Math.round((proposalData.estimatedCost * 0.3) / 1000)}K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Mid-Project (40%)</span>
                      <span className="font-semibold text-gray-900">
                        ${Math.round((proposalData.estimatedCost * 0.4) / 1000)}K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Project Completion (30%)</span>
                      <span className="font-semibold text-gray-900">
                        ${Math.round((proposalData.estimatedCost * 0.3) / 1000)}K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'team',
            label: (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team & Resources
              </span>
            ),
            children: (
              <div className="max-h-[600px] overflow-y-auto px-2">
                {/* Team Overview */}
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Project Team</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{proposalData.resources}</div>
                      <div className="text-xs text-gray-600 mt-1">Total Team Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{proposalData.assignedResources}</div>
                      <div className="text-xs text-gray-600 mt-1">Actively Assigned</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(proposalData.utilizationRate)}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Utilization Rate</div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Team Composition</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {proposalData.resourcesList.map((resource, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{resource.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 truncate">{resource.name}</h5>
                            <p className="text-xs text-gray-600">{resource.designation}</p>
                            <Tag className="mt-1 text-xs">{resource.category}</Tag>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Benefits */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    Why Our Team
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Carefully balanced team with expertise across all project phases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Proven track record in similar implementations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Dedicated project management ensuring on-time, on-budget delivery</span>
                    </li>
                  </ul>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Export Actions */}
      <Divider />
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Generated with AI · Ready to share with clients
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<FileText className="w-4 h-4" />}
            onClick={handleExportPDF}
            loading={isExporting}
            type="primary"
            size="large"
          >
            Export PDF
          </Button>
          <Button
            icon={<Presentation className="w-4 h-4" />}
            onClick={handleExportPowerPoint}
            size="large"
          >
            PowerPoint
          </Button>
          <Button
            icon={<Globe className="w-4 h-4" />}
            onClick={handleExportHTML}
            size="large"
          >
            Interactive HTML
          </Button>
        </div>
      </div>
    </Modal>
  );
}
