'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { SAP_CATALOG, PACKAGE_CATEGORIES, DEPENDENCY_MAP } from '@/data/sap-catalog';

export default function ModuleSelector() {
  const { selectedPackages, addPackage, removePackage, clearPackages } = useTimelineStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDependencies, setShowDependencies] = useState(true);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    let modules = Object.values(SAP_CATALOG);
    
    // Category filter
    if (selectedCategory !== 'all') {
      const categoryModuleIds = PACKAGE_CATEGORIES[selectedCategory] || [];
      modules = modules.filter(m => categoryModuleIds.includes(m.id));
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      modules = modules.filter(m => 
        m.name.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term)
      );
    }
    
    return modules;
  }, [searchTerm, selectedCategory]);

  // Get all dependencies for selected modules
  const requiredDependencies = useMemo(() => {
    const deps = new Set<string>();
    selectedPackages.forEach(pkgId => {
      const moduleDeps = DEPENDENCY_MAP[pkgId] || [];
      moduleDeps.forEach(dep => deps.add(dep));
    });
    return Array.from(deps);
  }, [selectedPackages]);

  // Handle module selection with dependency checking
  const handleModuleToggle = (moduleId: string) => {
    if (selectedPackages.includes(moduleId)) {
      // Check if other modules depend on this
      const dependents = selectedPackages.filter(pkg => 
        (DEPENDENCY_MAP[pkg] || []).includes(moduleId)
      );
      
      if (dependents.length > 0 && showDependencies) {
        if (confirm(`${dependents.length} module(s) depend on this. Remove anyway?`)) {
          removePackage(moduleId);
          // Also remove dependents
          dependents.forEach(dep => removePackage(dep));
        }
      } else {
        removePackage(moduleId);
      }
    } else {
      // Add module and its dependencies
      addPackage(moduleId);
      
      if (showDependencies) {
        const deps = DEPENDENCY_MAP[moduleId] || [];
        deps.forEach(dep => {
          if (!selectedPackages.includes(dep)) {
            addPackage(dep);
          }
        });
      }
    }
  };

  // Calculate total effort
  const totalEffort = useMemo(() => {
    return selectedPackages.reduce((sum, pkgId) => {
      const pkg = SAP_CATALOG[pkgId];
      return sum + (pkg ? pkg.effort * pkg.complexity : 0);
    }, 0);
  }, [selectedPackages]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">SAP Module Selection</h2>
        
        {/* Stats Bar */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Modules:</span>
              <span className="ml-2 font-semibold">{Object.keys(SAP_CATALOG).length}</span>
            </div>
            <div>
              <span className="text-gray-600">Selected:</span>
              <span className="ml-2 font-semibold text-blue-600">{selectedPackages.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Dependencies:</span>
              <span className="ml-2 font-semibold text-orange-600">{requiredDependencies.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Effort:</span>
              <span className="ml-2 font-semibold text-green-600">{totalEffort} days</span>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {Object.keys(PACKAGE_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDependencies}
              onChange={(e) => setShowDependencies(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-select dependencies</span>
          </label>
          
          <button
            onClick={clearPackages}
            disabled={selectedPackages.length === 0}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
        
        {/* Missing Dependencies Warning */}
        {requiredDependencies.some(dep => !selectedPackages.includes(dep)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Missing required dependencies. Enable auto-select or add manually.
            </p>
          </div>
        )}
      </div>
      
      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {filteredModules.map(module => {
          const isSelected = selectedPackages.includes(module.id);
          const isRequired = requiredDependencies.includes(module.id);
          const hasDependencies = (DEPENDENCY_MAP[module.id] || []).length > 0;
          
          return (
            <div
              key={module.id}
              onClick={() => handleModuleToggle(module.id)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected 
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                  : isRequired
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-sm">
                  {module.name}
                </h4>
                <div className="flex items-center gap-1">
                  {hasDependencies && (
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded" title="Has dependencies">
                      D
                    </span>
                  )}
                  {module.criticalPath && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded" title="Critical path">
                      CP
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">
                {module.description}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {module.id} • {module.category}
                </span>
                <span className={`font-medium ${
                  isSelected ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {module.effort}d
                </span>
              </div>
              
              {isRequired && !isSelected && (
                <div className="mt-2 text-xs text-orange-600">
                  Required dependency
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredModules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No modules found matching your criteria
        </div>
      )}
    </div>
  );
}