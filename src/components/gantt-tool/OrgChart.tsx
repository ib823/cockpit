/**
 * Organization Chart Component
 * Shows the saved organization chart if available, otherwise automatically allocates resources
 */

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileImage, FileText } from 'lucide-react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import type { Resource, ResourceCategory, ResourceDesignation } from '@/types/gantt-tool';
import { RESOURCE_CATEGORIES } from '@/types/gantt-tool';
import { exportOrgChartToPNG, exportOrgChartToPDF } from '@/lib/gantt-tool/export-utils';

interface OrgChartProps {
  className?: string;
}

export function OrgChart({ className = '' }: OrgChartProps) {
  const router = useRouter();
  const currentProject = useGanttToolStoreV2((state) => state.currentProject);

  // Check if saved org chart exists
  // @ts-expect-error - orgChart field may not exist in schema yet
  const hasSavedOrgChart = Boolean(currentProject?.orgChart);

  // Filter resources by level and category
  const organizedResources = useMemo(() => {
    if (!currentProject?.resources) {
      return {
        executive: [],
        management: [],
        functional: [],
        technical: [],
        infra: [],
      };
    }

    const executive: Resource[] = [];
    const management: Resource[] = [];
    const functional: Resource[] = [];
    const technical: Resource[] = [];
    const infra: Resource[] = [];

    currentProject.resources.forEach((resource: Resource) => {
      // Executive Level: Leadership category OR Principal, Director, and Senior Manager designations
      if (
        resource.category === 'leadership' ||
        resource.designation === 'principal' ||
        resource.designation === 'director' ||
        resource.designation === 'senior_manager'
      ) {
        executive.push(resource);
      }
      // Management Level: PM and Change Management resources
      else if (
        resource.category === 'pm' ||
        resource.category === 'change'
      ) {
        management.push(resource);
      }
      // Team Level - Functional
      else if (resource.category === 'functional') {
        functional.push(resource);
      }
      // Team Level - Technical (includes QA)
      else if (
        resource.category === 'technical' ||
        resource.category === 'qa'
      ) {
        technical.push(resource);
      }
      // Team Level - Infra (Basis + Security)
      else if (
        resource.category === 'basis' ||
        resource.category === 'security'
      ) {
        infra.push(resource);
      }
      // Other resources go to technical by default
      else {
        technical.push(resource);
      }
    });

    return { executive, management, functional, technical, infra };
  }, [currentProject?.resources]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No project loaded
      </div>
    );
  }

  // If saved org chart exists, show message and link to full editor
  if (hasSavedOrgChart) {
    return (
      <div className={`w-full h-full overflow-auto bg-gray-50 p-8 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Custom Organization Chart Available
            </h2>
            <p className="text-gray-600 mb-6">
              You have a customized organization chart for this project.
            </p>
            <button
              onClick={() => router.push('/organization-chart')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              View Full Organization Chart →
            </button>
            <p className="text-xs text-gray-500 mt-4">
              The full editor allows you to view, edit, and export your organization chart
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show auto-generated chart
  return (
    <div className={`w-full h-full overflow-auto bg-gray-50 p-8 ${className}`}>
      <div className="max-w-7xl mx-auto" id="org-chart-container">
        {/* Organization Chart Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Auto-Generated Organization Chart
          </h2>
          <p className="text-sm text-gray-500 mb-4">{currentProject.name}</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => router.push('/organization-chart')}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Customize Organization Chart →
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>

              {/* Dropdown Menu */}
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                <button
                  onClick={() => exportOrgChartToPNG(currentProject.name)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 first:rounded-t-lg"
                >
                  <FileImage className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={() => exportOrgChartToPDF(currentProject.name)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 last:rounded-b-lg border-t border-gray-100"
                >
                  <FileText className="w-4 h-4" />
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchical Structure */}
        <div className="flex flex-col items-center gap-8">
          {/* Executive Level */}
          <div className="w-full">
            <OrgLevel
              title="Executive Level"
              subtitle="Leadership, Principal, Director & Senior Manager"
              resources={organizedResources.executive}
              color="#4F46E5"
              icon="👔"
            />
          </div>

          {/* Connector Line */}
          {organizedResources.executive.length > 0 &&
            organizedResources.management.length > 0 && (
              <div className="w-1 h-12 bg-gray-300"></div>
            )}

          {/* Management Level */}
          <div className="w-full">
            <OrgLevel
              title="Management Level"
              subtitle="Project Management & Change Management"
              resources={organizedResources.management}
              color="#F59E0B"
              icon="📊"
            />
          </div>

          {/* Connector Line */}
          {organizedResources.management.length > 0 &&
            (organizedResources.functional.length > 0 ||
              organizedResources.technical.length > 0 ||
              organizedResources.infra.length > 0) && (
              <div className="w-1 h-12 bg-gray-300"></div>
            )}

          {/* Team Level - 3 Boxes */}
          <div className="w-full">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700">Team Level</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Functional Box */}
              <TeamBox
                title="Functional"
                resources={organizedResources.functional}
                color="#3B82F6"
                icon="📘"
              />

              {/* Technical Box */}
              <TeamBox
                title="Technical"
                subtitle="Includes QA"
                resources={organizedResources.technical}
                color="#8B5CF6"
                icon="🔧"
              />

              {/* Infra Box */}
              <TeamBox
                title="Infrastructure"
                subtitle="Basis + Security"
                resources={organizedResources.infra}
                color="#10B981"
                icon="🏗️"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Organization Level Component (Executive, Management)
interface OrgLevelProps {
  title: string;
  subtitle: string;
  resources: Resource[];
  color: string;
  icon: string;
}

function OrgLevel({ title, subtitle, resources, color, icon }: OrgLevelProps) {
  if (resources.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-400 mb-1">{title}</h3>
          <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
          <p className="text-sm text-gray-400">No resources allocated</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border-2 rounded-lg p-6 shadow-md"
      style={{ borderColor: color }}
    >
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">{icon}</div>
        <h3
          className="text-lg font-semibold mb-1"
          style={{ color }}
        >
          {title}
        </h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}

// Team Box Component (Functional, Technical, Infra)
interface TeamBoxProps {
  title: string;
  subtitle?: string;
  resources: Resource[];
  color: string;
  icon: string;
}

function TeamBox({ title, subtitle, resources, color, icon }: TeamBoxProps) {
  return (
    <div
      className="bg-white border-2 rounded-lg p-6 shadow-md min-h-[300px]"
      style={{ borderColor: color }}
    >
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">{icon}</div>
        <h4
          className="text-base font-semibold mb-1"
          style={{ color }}
        >
          {title}
        </h4>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      {/* Resource Cards */}
      {resources.length === 0 ? (
        <div className="text-center text-sm text-gray-400 mt-8">
          No resources allocated
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// Resource Card Component
interface ResourceCardProps {
  resource: Resource;
  compact?: boolean;
}

function ResourceCard({ resource, compact = false }: ResourceCardProps) {
  const categoryInfo = RESOURCE_CATEGORIES[resource.category];
  const designationLabel = resource.designation
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (compact) {
    return (
      <div
        className="p-3 rounded-md border border-gray-200 hover:shadow-md transition-shadow"
        style={{
          backgroundColor: `${categoryInfo.color}08`,
          borderLeftWidth: '3px',
          borderLeftColor: categoryInfo.color,
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-base">{categoryInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold text-gray-900 truncate">
              {resource.name}
            </h5>
            <p className="text-xs text-gray-500">{designationLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-md border border-gray-200 hover:shadow-lg transition-shadow"
      style={{
        backgroundColor: `${categoryInfo.color}08`,
        borderLeftWidth: '4px',
        borderLeftColor: categoryInfo.color,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{categoryInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold text-gray-900 mb-1">
            {resource.name}
          </h5>
          <p className="text-xs text-gray-600 mb-1">{designationLabel}</p>
          {resource.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {resource.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
