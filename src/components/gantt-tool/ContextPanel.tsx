/**
 * Context Panel - Revolutionary Right Sidebar
 *
 * Steve Jobs principle: Context is everything. Show relevant information based on what's selected.
 * Tabs: Resources, Cost, Analytics, AI Insights
 */

'use client';

import { useState, useMemo } from 'react';
import { useGanttToolStore } from '@/stores/gantt-tool-store';
import {
  Users,
  DollarSign,
  BarChart3,
  Sparkles,
  X,
  Search,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Tabs, Badge, Input, Button, Tooltip, Progress, Tag } from 'antd';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS, type Resource } from '@/types/gantt-tool';
import { differenceInDays } from 'date-fns';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextPanel({ isOpen, onClose }: ContextPanelProps) {
  const { currentProject, selection, getResourceById } = useGanttToolStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('resources');

  // Calculate project metrics - MUST be before any conditional returns
  const projectMetrics = useMemo(() => {
    if (!currentProject) {
      return {
        totalPhases: 0,
        totalTasks: 0,
        totalResources: 0,
        assignedResources: 0,
        utilizationRate: 0,
        durationDays: 0,
      };
    }
    const phases = currentProject.phases;
    const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);

    // Calculate total project duration in days
    let minDate = new Date();
    let maxDate = new Date();

    if (phases.length > 0) {
      minDate = new Date(Math.min(...phases.map(p => new Date(p.startDate).getTime())));
      maxDate = new Date(Math.max(...phases.map(p => new Date(p.endDate).getTime())));
    }

    const durationDays = differenceInDays(maxDate, minDate);

    // Calculate resource utilization
    const resources = currentProject.resources || [];
    const assignedResources = new Set<string>();

    phases.forEach(phase => {
      // Phase-level assignments
      phase.phaseResourceAssignments?.forEach(a => assignedResources.add(a.resourceId));

      // Task-level assignments
      phase.tasks.forEach(task => {
        task.resourceAssignments?.forEach(a => assignedResources.add(a.resourceId));
      });
    });

    const utilizationRate = resources.length > 0
      ? (assignedResources.size / resources.length) * 100
      : 0;

    return {
      totalPhases: phases.length,
      totalTasks,
      totalResources: resources.length,
      assignedResources: assignedResources.size,
      utilizationRate,
      durationDays,
    };
  }, [currentProject]);

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    if (!currentProject) return [];
    const resources = currentProject.resources || [];
    if (!searchQuery) return resources;

    const query = searchQuery.toLowerCase();
    return resources.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query)
    );
  }, [currentProject, searchQuery]);

  // Calculate cost estimate (placeholder - will be enhanced with real rates)
  const costEstimate = useMemo(() => {
    if (!currentProject) {
      return {
        total: 0,
        byCategory: {
          pm: 0,
          technical: 0,
          functional: 0,
          security: 0,
          change: 0,
        },
      };
    }
    // Placeholder cost calculation
    // In real implementation, this would use resource rates and allocations
    const resources = currentProject.resources || [];
    const baselineCost = resources.length * 50000; // $50K per resource placeholder

    return {
      total: baselineCost,
      byCategory: {
        pm: baselineCost * 0.15,
        technical: baselineCost * 0.40,
        functional: baselineCost * 0.30,
        security: baselineCost * 0.10,
        change: baselineCost * 0.05,
      },
    };
  }, [currentProject]);

  // Resource drag handler
  const handleResourceDragStart = (e: React.DragEvent, resource: Resource) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'resource',
      resourceId: resource.id,
      resourceName: resource.name,
    }));
  };

  // Now safe to do early return after all hooks are called
  if (!isOpen || !currentProject) return null;

  // Safe to access currentProject here after the guard clause
  const safeProject = currentProject;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Project Context
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="flex-1 overflow-hidden"
        items={[
          {
            key: 'resources',
            label: (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Resources
                <Badge count={projectMetrics.totalResources} showZero size="small" />
              </span>
            ),
            children: (
              <div className="h-full overflow-y-auto px-4 py-3">
                {/* Search */}
                <Input
                  placeholder="Search resources..."
                  prefix={<Search className="w-4 h-4 text-gray-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />

                {/* Utilization Summary */}
                <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Team Utilization</span>
                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(projectMetrics.utilizationRate)}%
                    </span>
                  </div>
                  <Progress
                    percent={projectMetrics.utilizationRate}
                    strokeColor={{
                      '0%': '#3b82f6',
                      '100%': '#8b5cf6',
                    }}
                    showInfo={false}
                    size="small"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>{projectMetrics.assignedResources} assigned</span>
                    <span>{projectMetrics.totalResources - projectMetrics.assignedResources} available</span>
                  </div>
                </div>

                {/* Resource List - Draggable */}
                <div className="space-y-2">
                  {filteredResources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No resources found</p>
                    </div>
                  ) : (
                    filteredResources.map((resource) => {
                      const category = RESOURCE_CATEGORIES[resource.category];
                      const designation = RESOURCE_DESIGNATIONS[resource.designation];

                      // Check if resource is assigned
                      const isAssigned = safeProject.phases.some(phase =>
                        phase.phaseResourceAssignments?.some(a => a.resourceId === resource.id) ||
                        phase.tasks.some(task =>
                          task.resourceAssignments?.some(a => a.resourceId === resource.id)
                        )
                      );

                      return (
                        <div
                          key={resource.id}
                          draggable
                          onDragStart={(e) => handleResourceDragStart(e, resource)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-move bg-white"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              {category.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-gray-900 truncate">
                                  {resource.name}
                                </h4>
                                {isAssigned && (
                                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{designation}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Tag
                                  color={category.color}
                                  className="text-[10px] px-1.5 py-0 m-0"
                                >
                                  {category.label}
                                </Tag>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {resource.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Tip */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Pro Tip:</strong> Drag resources directly onto phases or tasks in the timeline to assign them.
                    </span>
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'cost',
            label: (
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost
              </span>
            ),
            children: (
              <div className="h-full overflow-y-auto px-4 py-3">
                {/* Total Cost */}
                <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Estimated Project Cost</div>
                  <div className="text-3xl font-bold text-green-700">
                    ${Math.round(costEstimate.total / 1000)}K
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Based on {projectMetrics.totalResources} resources over {projectMetrics.durationDays} days
                  </div>
                </div>

                {/* Cost Breakdown by Category */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost by Category</h3>
                  <div className="space-y-3">
                    {Object.entries(costEstimate.byCategory).map(([cat, cost]) => {
                      const category = RESOURCE_CATEGORIES[cat as keyof typeof RESOURCE_CATEGORIES];
                      const percentage = (cost / costEstimate.total) * 100;

                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                              <span>{category.icon}</span>
                              {category.label}
                            </span>
                            <span className="text-xs font-bold" style={{ color: category.color }}>
                              ${Math.round(cost / 1000)}K
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

                {/* Cost Insights */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Insights</h3>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-900">Resource Balance</p>
                        <p className="text-xs text-blue-700 mt-1">
                          40% technical resources - Good balance for implementation projects
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-purple-900">Optimization Opportunity</p>
                        <p className="text-xs text-purple-700 mt-1">
                          Consider adding 1 analyst role to reduce senior consultant utilization
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Coming Soon</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Custom resource rates (hourly/daily)</li>
                    <li>• Budget constraints & alerts</li>
                    <li>• What-if cost scenarios</li>
                    <li>• ROI calculator</li>
                  </ul>
                </div>
              </div>
            ),
          },
          {
            key: 'analytics',
            label: (
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </span>
            ),
            children: (
              <div className="h-full overflow-y-auto px-4 py-3">
                {/* Project Health */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Project Health</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{projectMetrics.totalPhases}</div>
                      <div className="text-xs text-gray-600 mt-1">Phases</div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">{projectMetrics.totalTasks}</div>
                      <div className="text-xs text-gray-600 mt-1">Tasks</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{projectMetrics.totalResources}</div>
                      <div className="text-xs text-gray-600 mt-1">Team Members</div>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{projectMetrics.durationDays}</div>
                      <div className="text-xs text-gray-600 mt-1">Days Duration</div>
                    </div>
                  </div>
                </div>

                {/* Resource Utilization */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Resource Allocation</h3>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="text-center mb-3">
                      <div className="text-4xl font-bold text-blue-700">
                        {Math.round(projectMetrics.utilizationRate)}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Team Utilization</div>
                    </div>
                    <Progress
                      percent={projectMetrics.utilizationRate}
                      strokeColor={{
                        '0%': '#3b82f6',
                        '100%': '#8b5cf6',
                      }}
                      size="small"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        <strong className="text-green-600">{projectMetrics.assignedResources}</strong> assigned
                      </span>
                      <span className="text-gray-600">
                        <strong className="text-orange-600">{projectMetrics.totalResources - projectMetrics.assignedResources}</strong> available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h3>

                  {projectMetrics.utilizationRate < 70 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-yellow-900">Low Utilization</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Only {Math.round(projectMetrics.utilizationRate)}% of resources are assigned. Consider reducing team size or expanding scope.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {projectMetrics.totalTasks < projectMetrics.totalPhases * 3 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Task Breakdown</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Consider breaking phases into more granular tasks for better tracking and resource allocation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {projectMetrics.utilizationRate > 90 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-green-900">Excellent Utilization</p>
                          <p className="text-xs text-green-700 mt-1">
                            {Math.round(projectMetrics.utilizationRate)}% utilization - Great balance between capacity and assignments!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'insights',
            label: (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </span>
            ),
            children: (
              <div className="h-full overflow-y-auto px-4 py-3">
                {/* AI Insights Header */}
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">AI Co-Pilot</h3>
                  </div>
                  <p className="text-xs text-gray-600">
                    Smart suggestions to optimize your project timeline, resources, and costs.
                  </p>
                </div>

                {/* Smart Suggestions */}
                <div className="space-y-3">
                  <div className="p-4 bg-white border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Timeline Optimization</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Similar CRM implementation projects typically take 6-8 months. Your timeline of {Math.round(projectMetrics.durationDays / 30)} months is {projectMetrics.durationDays < 180 ? 'aggressive' : 'conservative'}.
                        </p>
                        <Button size="small" type="link" className="px-0 h-auto text-xs">
                          View industry benchmarks →
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-purple-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Resource Suggestion</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Based on your project scope, we recommend adding 1-2 Senior Consultants for phases 3-5 to maintain velocity.
                        </p>
                        <Button size="small" type="link" className="px-0 h-auto text-xs">
                          Auto-add suggested resources →
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Best Practice Detected</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Great job! Your 2-week buffer between phases follows industry best practices for change management.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-2 border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Risk Alert</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Holiday season detected in Q4 phases. Consider adding 15-20% buffer or rescheduling critical tasks.
                        </p>
                        <Button size="small" type="link" className="px-0 h-auto text-xs">
                          Auto-adjust for holidays →
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Coming Soon</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Natural language project generation</li>
                    <li>• Auto-detect project risks & mitigation</li>
                    <li>• Smart resource matching by skills</li>
                    <li>• Predictive timeline adjustments</li>
                  </ul>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
