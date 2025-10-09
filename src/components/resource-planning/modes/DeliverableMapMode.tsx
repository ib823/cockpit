"use client";

import {
    SAP_DELIVERABLES_CATALOG,
    getTasksForModules,
    type DeliverableTree,
    type SubModule
} from "@/data/sap-deliverables";
import { usePresalesStore } from "@/stores/presales-store";
import type { TaskWithState } from "@/stores/resource-planning-store";
import { useResourcePlanningStore } from "@/stores/resource-planning-store";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { useEffect, useState } from "react";

export function DeliverableMapMode() {
  const presalesDecisions = usePresalesStore(state => state.decisions);
  const { setSelectedModules, setTasks, tasks } = useResourcePlanningStore();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());

  // Auto-load modules from presales decisions
  useEffect(() => {
    // Strategy: Try multiple sources in priority order
    // 1. Timeline store selected packages (most recent)
    // 2. Presales decisions (earlier in workflow)
    // 3. Default to Finance_1

    let modulesToLoad: string[] = [];

    // Try presales decisions first (since that's what we know works)
    if (presalesDecisions.moduleCombo) {
      const presalesMapping: Record<string, string[]> = {
        'FinanceOnly': ['Finance_1'],
        'Finance+P2P': ['Finance_1', 'Finance_2'],
        'Finance+OTC': ['Finance_1', 'Finance_3'],
        'Finance+P2P+OTC': ['Finance_1', 'Finance_2', 'Finance_3'],
        'Core+HCM': ['Finance_1', 'HCM_1'],
      };

      modulesToLoad = presalesMapping[presalesDecisions.moduleCombo] || ['Finance_1'];
    }

    // Default fallback
    if (modulesToLoad.length === 0) {
      modulesToLoad = ['Finance_1']; // Always show Finance at minimum
    }

    // Remove duplicates
    modulesToLoad = [...new Set(modulesToLoad)];

    // Update store
    setSelectedModules(modulesToLoad);

    // Load tasks for selected modules
    const loadedTasks = getTasksForModules(modulesToLoad);
    const tasksWithState: TaskWithState[] = loadedTasks.map(task => ({
      ...task,
      completed: 0,
      delta: 100,
      assignedResource: null,
    }));

    setTasks(tasksWithState);

    console.log('[ResourcePlanning] Loaded modules:', modulesToLoad);
    console.log('[ResourcePlanning] Loaded tasks:', tasksWithState.length);

  }, [presalesDecisions.moduleCombo, setSelectedModules, setTasks]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSubModule = (subModuleId: string) => {
    const newExpanded = new Set(expandedSubModules);
    if (newExpanded.has(subModuleId)) {
      newExpanded.delete(subModuleId);
    } else {
      newExpanded.add(subModuleId);
    }
    setExpandedSubModules(newExpanded);
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
    }
  };

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-purple-900">Deliverable Tree</h2>
          <p className="text-sm text-purple-600 mt-1">
            {tasks.length} configuration tasks across {SAP_DELIVERABLES_CATALOG.modules.length} modules
          </p>
        </div>

        {/* Module Tree */}
        <div className="divide-y divide-gray-100">
          {SAP_DELIVERABLES_CATALOG.modules.map((module) => (
            <ModuleNode
              key={module.moduleId}
              module={module}
              isExpanded={expandedModules.has(module.moduleId)}
              onToggle={() => toggleModule(module.moduleId)}
              expandedSubModules={expandedSubModules}
              onToggleSubModule={toggleSubModule}
              getRiskColor={getRiskColor}
              getRiskIcon={getRiskIcon}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total Effort:</span>
                <span className="font-semibold text-gray-900">
                  {tasks.reduce((sum, t) => sum + (t.baseEffort * t.delta / 100), 0).toFixed(1)} PD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">High Risk:</span>
                <span className="font-semibold text-red-600">
                  {tasks.filter(t => t.riskLevel === 'high').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sharable:</span>
                <span className="font-semibold text-green-600">
                  {tasks.filter(t => t.sharable).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleNode({
  module,
  isExpanded,
  onToggle,
  expandedSubModules,
  onToggleSubModule,
  getRiskColor,
  getRiskIcon,
}: {
  module: DeliverableTree;
  isExpanded: boolean;
  onToggle: () => void;
  expandedSubModules: Set<string>;
  onToggleSubModule: (id: string) => void;
  getRiskColor: (risk: 'low' | 'medium' | 'high') => string;
  getRiskIcon: (risk: 'low' | 'medium' | 'high') => string;
}) {
  const totalEffort = module.subModules.reduce((sum, sm) => sum + sm.estimatedEffort, 0);

  return (
    <div>
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-purple-50/50 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-purple-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600" />
        )}
        <Package className="w-5 h-5 text-purple-600" />
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900">{module.moduleName}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {module.subModules.length} sub-modules · {totalEffort} PD
          </div>
        </div>
      </button>

      {/* Sub-Modules */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100">
          {module.subModules.map((subModule) => (
            <SubModuleNode
              key={subModule.id}
              subModule={subModule}
              isExpanded={expandedSubModules.has(subModule.id)}
              onToggle={() => onToggleSubModule(subModule.id)}
              getRiskColor={getRiskColor}
              getRiskIcon={getRiskIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubModuleNode({
  subModule,
  isExpanded,
  onToggle,
  getRiskColor,
  getRiskIcon,
}: {
  subModule: SubModule;
  isExpanded: boolean;
  onToggle: () => void;
  getRiskColor: (risk: 'low' | 'medium' | 'high') => string;
  getRiskIcon: (risk: 'low' | 'medium' | 'high') => string;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Sub-Module Header */}
      <button
        onClick={onToggle}
        className="w-full px-12 py-3 flex items-center gap-4 hover:bg-white/50 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-500" />
        )}
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-800 text-sm">{subModule.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {subModule.configurations.length} tasks · {subModule.estimatedEffort} PD · 
            Complexity: {subModule.complexity}x
          </div>
        </div>
      </button>

      {/* Configuration Tasks */}
      {isExpanded && (
        <div className="bg-white/80 px-12 pb-2">
          {subModule.configurations.map((config) => (
            <div
              key={config.id}
              className="flex items-center gap-4 py-2 px-4 border-l-2 border-gray-200 hover:border-purple-300 transition-colors"
            >
              <span className="text-lg">{getRiskIcon(config.riskLevel)}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">{config.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-4">
                  <span>{config.baseEffort} PD</span>
                  <span className="text-gray-300">•</span>
                  <span>{config.category}</span>
                  <span className="text-gray-300">•</span>
                  <span>{config.stream}</span>
                  {config.sharable && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-green-600">Sharable</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Skills: {config.skillRequired.join(', ')}
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(config.riskLevel)}`}>
                {config.riskLevel.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Modules Selected
        </h3>
        <p className="text-gray-600 mb-6">
          Select SAP modules in the Plan mode to see configuration-level deliverables
        </p>
        <button
          onClick={() => window.location.href = '/project'}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Go to Plan Mode
        </button>
      </div>
    </div>
  );
}