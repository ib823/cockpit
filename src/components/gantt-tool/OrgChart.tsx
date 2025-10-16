/**
 * Organization Chart Component
 * Automatically allocates resources from the project into a hierarchical structure
 */

'use client';

import React, { useMemo } from 'react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import type { Resource, ResourceCategory, ResourceDesignation } from '@/types/gantt-tool';
import { RESOURCE_CATEGORIES } from '@/types/gantt-tool';

interface OrgChartProps {
  className?: string;
}

export function OrgChart({ className = '' }: OrgChartProps) {
  const currentProject = useGanttToolStoreV2((state) => state.currentProject);

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

  return (
    <div className={`w-full h-full overflow-auto bg-gray-50 p-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Organization Chart Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Project Organization Chart
          </h2>
          <p className="text-sm text-gray-500">{currentProject.name}</p>
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
