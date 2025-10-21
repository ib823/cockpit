/**
 * Resources Dashboard
 *
 * Analytics dashboard showing resource utilization, skills breakdown, and timeline allocation.
 * Provides Excel export and drill-down capabilities.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { AppShell } from '@/ui/layout/AppShell';
import { getMenuItems, getBreadcrumbItems } from '@/config/menu';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  useResourceMetrics,
  useResourceMetricsWithTimeline,
  useCategoryMetrics,
  useDesignationMetrics,
  useResourceAnalyticsSummary,
} from '@/stores/resource-analytics-selectors';
import { useGanttToolStore } from '@/stores/gantt-tool-store';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';
import { exportResourcesToExcel } from '@/lib/resources/export-excel';

type ViewMode = 'skills' | 'timeline';

export default function ResourcesDashboardPage() {
  const { data: session } = useSession();
  const currentProject = useGanttToolStore(state => state.currentProject);
  const [viewMode, setViewMode] = useState<ViewMode>('skills');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const userRole = session?.user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const menuItems = getMenuItems(userRole);
  const breadcrumbItems = getBreadcrumbItems('/resources-dashboard');

  const user = session?.user
    ? {
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        role: session.user.role || 'USER',
      }
    : undefined;

  const summary = useResourceAnalyticsSummary();
  const metrics = useResourceMetrics();
  const metricsWithTimeline = useResourceMetricsWithTimeline();
  const categoryMetrics = useCategoryMetrics();
  const designationMetrics = useDesignationMetrics();

  const handleExport = async () => {
    if (!currentProject) return;
    await exportResourcesToExcel(
      currentProject,
      metrics,
      categoryMetrics,
      designationMetrics,
      summary
    );
  };

  const toggleResourceExpand = (resourceId: string) => {
    setExpandedResources(prev => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  if (!currentProject) {
    return (
      <AppShell
        user={user}
        menuItems={menuItems}
        breadcrumbItems={breadcrumbItems}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      >
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
            <p className="text-gray-600 mb-4">Open a Gantt project to view resource analytics</p>
            <Link
              href="/gantt-tool"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Gantt Tool
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (summary.activeResources === 0) {
    return (
      <AppShell
        user={user}
        menuItems={menuItems}
        breadcrumbItems={breadcrumbItems}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      >
        {/* Empty State */}
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Resource Assignments Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by adding phases and tasks to your timeline, then assign resources to tasks to see analytics here.
            </p>
            <Link
              href="/gantt-tool"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Timeline
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      menuItems={menuItems}
      breadcrumbItems={breadcrumbItems}
      onLogout={() => signOut({ callbackUrl: '/login' })}
    >
      <div>
        {/* Page Header with Export Button */}
        <div className="flex items-center justify-between mb-6" style={{ marginLeft: '-24px', marginRight: '-24px', marginTop: '-24px', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Analytics</h1>
            <p className="text-sm text-gray-600 mt-0.5">{currentProject.name}</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
        {/* KPI Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Effort */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Effort</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.totalEffortDays.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">person-days</div>
          </div>

          {/* Active Resources */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Resources</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.activeResources}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              of {summary.totalResources} total
            </div>
          </div>

          {/* Average Utilization */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Utilization</span>
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.averageUtilization.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">across all resources</div>
          </div>

          {/* Overallocated */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Overallocated</span>
              <AlertTriangle className={`w-4 h-4 ${summary.overallocatedResources > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className={`text-3xl font-bold ${summary.overallocatedResources > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {summary.overallocatedResources}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.overallocatedResources > 0 ? 'resources need attention' : 'all resources balanced'}
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-1 p-1">
              <button
                onClick={() => setViewMode('skills')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'skills'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Skills Breakdown
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Timeline View
              </button>
            </div>
          </div>

          <div className="p-6">
            {viewMode === 'skills' ? (
              <SkillsBreakdownView
                categoryMetrics={categoryMetrics}
                designationMetrics={designationMetrics}
              />
            ) : (
              <TimelineView metricsWithTimeline={metricsWithTimeline} />
            )}
          </div>
        </div>

        {/* Resource Details List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Resource Details</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {metrics.length} resources with assignments
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {metrics.map(resource => (
              <ResourceDetailRow
                key={resource.resourceId}
                resource={resource}
                isExpanded={expandedResources.has(resource.resourceId)}
                onToggle={() => toggleResourceExpand(resource.resourceId)}
              />
            ))}
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  );
}

// Skills Breakdown View Component
function SkillsBreakdownView({
  categoryMetrics,
  designationMetrics,
}: {
  categoryMetrics: ReturnType<typeof useCategoryMetrics>;
  designationMetrics: ReturnType<typeof useDesignationMetrics>;
}) {
  return (
    <div className="space-y-8">
      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
        <div className="space-y-3">
          {categoryMetrics.map(cat => {
            const categoryInfo = RESOURCE_CATEGORIES[cat.category];
            const maxEffort = Math.max(...categoryMetrics.map(c => c.totalEffortDays));
            const widthPercent = (cat.totalEffortDays / maxEffort) * 100;

            return (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryInfo.icon}</span>
                    <span className="font-medium text-gray-900">{categoryInfo.label}</span>
                    <span className="text-xs text-gray-500">
                      ({cat.resourceCount} {cat.resourceCount === 1 ? 'resource' : 'resources'})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{cat.totalEffortDays.toFixed(1)} days</div>
                    <div className="text-xs text-gray-500">{cat.averageUtilization.toFixed(0)}% avg util</div>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: categoryInfo.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Designation Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Designation</h3>
        <div className="space-y-3">
          {designationMetrics.map(des => {
            const maxEffort = Math.max(...designationMetrics.map(d => d.totalEffortDays));
            const widthPercent = (des.totalEffortDays / maxEffort) * 100;

            return (
              <div key={des.designation} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {RESOURCE_DESIGNATIONS[des.designation]}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({des.resourceCount} {des.resourceCount === 1 ? 'resource' : 'resources'})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{des.totalEffortDays.toFixed(1)} days</div>
                    <div className="text-xs text-gray-500">{des.averageUtilization.toFixed(0)}% avg util</div>
                  </div>
                </div>
                <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({
  metricsWithTimeline,
}: {
  metricsWithTimeline: ReturnType<typeof useResourceMetricsWithTimeline>;
}) {
  if (metricsWithTimeline.length === 0) {
    return <div className="text-center text-gray-500 py-8">No timeline data available</div>;
  }

  // Get all unique weeks
  const weeks = metricsWithTimeline[0]?.timeline || [];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex border-b border-gray-200 mb-4 pb-2">
          <div className="w-64 font-semibold text-gray-900">Resource</div>
          <div className="flex-1 flex">
            {weeks.map((week, idx) => (
              <div
                key={idx}
                className="flex-1 text-center text-xs font-medium text-gray-600"
                style={{ minWidth: '60px' }}
              >
                {week.weekLabel}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Rows */}
        <div className="space-y-2">
          {metricsWithTimeline.map(resource => {
            const categoryInfo = RESOURCE_CATEGORIES[resource.category];
            return (
              <div key={resource.resourceId} className="flex items-center">
                <div className="w-64 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{categoryInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {resource.resourceName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {RESOURCE_DESIGNATIONS[resource.designation]}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex gap-1">
                  {resource.timeline.map((week, idx) => {
                    const allocation = week.allocation;
                    let bgColor = 'bg-gray-50';
                    let textColor = 'text-gray-400';

                    if (allocation > 0) {
                      if (allocation > 100) {
                        bgColor = 'bg-red-500';
                        textColor = 'text-white';
                      } else if (allocation >= 80) {
                        bgColor = 'bg-blue-700';
                        textColor = 'text-white';
                      } else if (allocation >= 60) {
                        bgColor = 'bg-blue-500';
                        textColor = 'text-white';
                      } else if (allocation >= 40) {
                        bgColor = 'bg-blue-300';
                        textColor = 'text-gray-800';
                      } else {
                        bgColor = 'bg-blue-100';
                        textColor = 'text-gray-700';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-12 rounded ${bgColor} flex items-center justify-center text-xs font-medium ${textColor} group relative cursor-pointer transition-all hover:ring-2 hover:ring-blue-400`}
                        style={{ minWidth: '60px' }}
                        title={`${allocation}% allocation`}
                      >
                        {allocation > 0 ? `${allocation}%` : ''}

                        {/* Tooltip */}
                        {week.contributingTasks.length > 0 && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2   transition-opacity  z-50">
                            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-xl whitespace-nowrap max-w-xs">
                              <div className="font-semibold mb-1">{week.weekLabel}: {allocation}%</div>
                              <div className="space-y-0.5 text-[10px]">
                                {week.contributingTasks.map((task, tidx) => (
                                  <div key={tidx} className="text-gray-300">
                                    • {task.taskName} ({Math.round(task.allocation)}%)
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded" />
            <span className="text-gray-600">0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded" />
            <span className="text-gray-600">1-39%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded" />
            <span className="text-gray-600">40-59%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-gray-600">60-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-700 rounded" />
            <span className="text-gray-600">80-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-gray-600">&gt;100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Resource Detail Row Component
function ResourceDetailRow({
  resource,
  isExpanded,
  onToggle,
}: {
  resource: ReturnType<typeof useResourceMetrics>[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const categoryInfo = RESOURCE_CATEGORIES[resource.category];

  return (
    <div className="hover:bg-gray-50 transition-colors">
      <div
        className="px-6 py-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{resource.resourceName}</h3>
                {resource.peakAllocation > 100 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                    Overallocated
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                {RESOURCE_DESIGNATIONS[resource.designation]} · {categoryInfo.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {resource.totalEffortDays.toFixed(1)} days
              </div>
              <div className="text-xs text-gray-500">
                {resource.taskCount} {resource.taskCount === 1 ? 'task' : 'tasks'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {resource.utilizationScore.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">utilization</div>
            </div>

            <div className="text-right">
              <div className={`text-sm font-semibold ${resource.peakAllocation > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {resource.peakAllocation.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">peak</div>
            </div>

            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Assignment Details */}
      {isExpanded && (
        <div className="px-6 pb-4 pl-16">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-3">Assignments:</div>
            {resource.assignments.map((assignment, idx) => (
              <div key={idx} className="bg-white rounded-md p-3 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: assignment.phaseColor }}
                      />
                      <span className="font-medium text-sm text-gray-900">
                        {assignment.taskName}
                      </span>
                      <span className="text-xs text-gray-500">
                        in {assignment.phaseName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {assignment.startDate.toLocaleDateString()} - {assignment.endDate.toLocaleDateString()}
                    </div>
                    {assignment.assignmentNotes && (
                      <div className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded">
                        {assignment.assignmentNotes}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {assignment.allocationPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.effortDays.toFixed(1)} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
