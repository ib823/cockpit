import React, { useState } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';

interface SAPPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDays: number;
  complexity: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

const SAP_PACKAGES: SAPPackage[] = [
  {
    id: 'finance-core',
    name: 'Finance Core (FI)',
    description: 'General Ledger, Accounts Payable, Accounts Receivable',
    category: 'Finance',
    estimatedDays: 45,
    complexity: 'medium'
  },
  {
    id: 'finance-advanced',
    name: 'Finance Advanced',
    description: 'Asset Accounting, Treasury, Risk Management',
    category: 'Finance',
    estimatedDays: 35,
    complexity: 'high',
    dependencies: ['finance-core']
  },
  {
    id: 'hr-core',
    name: 'HR Core (HCM)',
    description: 'Personnel Administration, Organizational Management',
    category: 'Human Resources',
    estimatedDays: 40,
    complexity: 'medium'
  },
  {
    id: 'hr-advanced',
    name: 'HR Advanced',
    description: 'Payroll, Time Management, Talent Management',
    category: 'Human Resources',
    estimatedDays: 50,
    complexity: 'high',
    dependencies: ['hr-core']
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Management',
    description: 'Procurement, Inventory, Warehouse Management',
    category: 'Operations',
    estimatedDays: 55,
    complexity: 'high'
  },
  {
    id: 'sales-distribution',
    name: 'Sales & Distribution',
    description: 'Order Management, Pricing, Shipping',
    category: 'Sales',
    estimatedDays: 40,
    complexity: 'medium'
  },
  {
    id: 'analytics-core',
    name: 'SAP Analytics Cloud',
    description: 'Business Intelligence, Planning, Predictive Analytics',
    category: 'Analytics',
    estimatedDays: 30,
    complexity: 'medium'
  },
  {
    id: 'analytics-advanced',
    name: 'Advanced Analytics',
    description: 'Data Science, Machine Learning, IoT Analytics',
    category: 'Analytics',
    estimatedDays: 35,
    complexity: 'high',
    dependencies: ['analytics-core']
  }
];

const SAPPackageSelector: React.FC = () => {
  const { selectedPackages, addPackage, removePackage, generateTimeline, phases } = useTimelineStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(SAP_PACKAGES.map(pkg => pkg.category)))];
  
  const filteredPackages = selectedCategory === 'all' 
    ? SAP_PACKAGES 
    : SAP_PACKAGES.filter(pkg => pkg.category === selectedCategory);

  const handlePackageToggle = (packageId: string) => {
    if (selectedPackages.includes(packageId)) {
      removePackage(packageId);
    } else {
      addPackage(packageId);
    }
  };

  const handleGenerateTimeline = () => {
    if (selectedPackages.length > 0) {
      generateTimeline();
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalEstimatedDays = selectedPackages.reduce((total, packageId) => {
    const pkg = SAP_PACKAGES.find(p => p.id === packageId);
    return total + (pkg?.estimatedDays || 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SAP Package Selection</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose the SAP modules for your implementation
          </p>
        </div>
        
        {selectedPackages.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {selectedPackages.length} packages selected
            </div>
            <div className="text-lg font-semibold text-gray-900">
              ~{totalEstimatedDays} days estimated
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredPackages.map(pkg => {
          const isSelected = selectedPackages.includes(pkg.id);
          const isDisabled = pkg.dependencies?.some(dep => !selectedPackages.includes(dep));
          
          return (
            <div
              key={pkg.id}
              className={`relative border rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => !isDisabled && handlePackageToggle(pkg.id)}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-3 right-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="pr-8">
                <h3 className="font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(pkg.complexity)}`}
                  >
                    {pkg.complexity} complexity
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pkg.estimatedDays}d
                  </span>
                </div>

                {pkg.dependencies && (
                  <div className="mt-2 text-xs text-gray-500">
                    Requires: {pkg.dependencies.map(dep => 
                      SAP_PACKAGES.find(p => p.id === dep)?.name
                    ).join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Timeline Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-500">
          {selectedPackages.length === 0 
            ? 'Select packages to generate timeline'
            : `${selectedPackages.length} packages selected`}
        </div>
        
        <div className="flex gap-3">
          {phases.length > 0 && (
            <button
              onClick={() => selectedPackages.forEach(removePackage)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={handleGenerateTimeline}
            disabled={selectedPackages.length === 0}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPackages.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {phases.length > 0 ? 'Update Timeline' : 'Generate Timeline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SAPPackageSelector;
