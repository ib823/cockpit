'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { SAP_MODULES } from '@/data/sap-modules-complete';

const CATEGORIES = [
  'Finance',
  'HCM',
  'SCM',
  'CX',
  'Analytics',
  'Procurement',
  'Technical',
  'Compliance',
  'Industry',
];

export function ModuleCatalog() {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Finance']);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const onDragStart = (event: React.DragEvent, moduleId: string) => {
    const module = SAP_MODULES[moduleId as keyof typeof SAP_MODULES];
    event.dataTransfer.setData('application/reactflow', JSON.stringify(module));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Filter modules by search
  const filteredModules = Object.entries(SAP_MODULES).filter(([id, module]) => {
    if (!search) return true;
    return (
      module.name.toLowerCase().includes(search.toLowerCase()) ||
      module.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by category
  const modulesByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredModules.filter(([, m]) => m.category === category);
    return acc;
  }, {} as Record<string, [string, any][]>);

  return (
    <div className="w-80 bg-white border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Module Catalog
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORIES.map((category) => {
          const modules = modulesByCategory[category] || [];
          if (modules.length === 0) return null;

          const isExpanded = expandedCategories.includes(category);

          return (
            <div key={category} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-semibold text-sm text-gray-900">
                  {category}
                </span>
                <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {modules.length}
                </span>
              </button>

              {/* Module Items */}
              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {modules.map(([id, module]) => (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, id)}
                      className="px-3 py-2 hover:bg-blue-50 rounded-lg cursor-move transition-colors border border-transparent hover:border-blue-200"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {module.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {module.baseEffort} PD • {module.complexity}×
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t bg-blue-50">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Drag modules onto the canvas to build your architecture
        </p>
      </div>
    </div>
  );
}