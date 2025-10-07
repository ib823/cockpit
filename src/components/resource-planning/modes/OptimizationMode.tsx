"use client";

import { useResourcePlanningStore } from "@/stores/resource-planning-store";
import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Loader2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

export function OptimizationMode() {
  const { 
    tasks,
    resources,
    optimizationResult,
    isOptimizing,
    runOptimization,
    addResource 
  } = useResourcePlanningStore();

  const handleRunOptimization = () => {
    runOptimization();
  };

  const handleAddSampleResources = () => {
    // Add sample resources for demo
    addResource({
      role: 'Senior Manager',
      region: 'ABMY',
      skills: ['SAP FI', 'Accounting Standards', 'Financial Close'],
      dailyRate: 750,
    });
    
    addResource({
      role: 'Senior Consultant',
      region: 'ABMY',
      skills: ['SAP FI', 'Customer Master Data', 'Vendor Master Data', 'Credit Control'],
      dailyRate: 410,
    });
    
    addResource({
      role: 'Consultant',
      region: 'ABMY',
      skills: ['SAP MM', 'Procurement', 'Inventory Management'],
      dailyRate: 260,
    });
    
    addResource({
      role: 'Senior Consultant',
      region: 'ABVN',
      skills: ['SAP Basis', 'HANA', 'Infrastructure'],
      dailyRate: 180,
    });
  };

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  if (resources.length === 0) {
    return <NoResourcesState onAddSampleResources={handleAddSampleResources} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Run Optimization Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-bold mb-2">AI-Powered Optimization</h2>
          <p className="text-purple-100 text-lg mb-6">
            Analyze {tasks.length} tasks across {resources.length} resources
          </p>
          
          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg
              transition-all duration-200 inline-flex items-center gap-4
              ${isOptimizing
                ? 'bg-white/20 cursor-wait'
                : 'bg-white text-purple-600 hover:scale-105 hover:shadow-2xl'
              }
            `}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run Optimization
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {optimizationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<TrendingDown className="w-6 h-6" />}
              label="Total Cost"
              value={`MYR ${optimizationResult.totalCost.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`}
              color="purple"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Avg Utilization"
              value={`${optimizationResult.utilization.toFixed(0)}%`}
              color="blue"
              subtitle={optimizationResult.utilization > 80 ? 'Efficient' : 'Room for improvement'}
            />
            <MetricCard
              icon={<Sparkles className="w-6 h-6" />}
              label="Confidence"
              value={`${optimizationResult.confidence}%`}
              color="green"
              subtitle={`${optimizationResult.resources.length} resources allocated`}
            />
          </div>

          {/* Bottlenecks */}
          {optimizationResult.bottlenecks.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Bottlenecks ({optimizationResult.bottlenecks.length})
                </h3>
              </div>
              
              <div className="space-y-4">
                {optimizationResult.bottlenecks.map((bottleneck, idx) => (
                  <BottleneckCard key={idx} bottleneck={bottleneck} />
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {optimizationResult.opportunities.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Opportunities ({optimizationResult.opportunities.length})
                </h3>
              </div>
              
              <div className="space-y-4">
                {optimizationResult.opportunities.map((opportunity, idx) => (
                  <OpportunityCard key={idx} opportunity={opportunity} />
                ))}
              </div>
            </div>
          )}

          {/* Resource Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resource Allocation
            </h3>
            
            <div className="space-y-4">
              {optimizationResult.resources.map((resource) => (
                <ResourceRow key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
  }[color];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function BottleneckCard({ bottleneck }: { bottleneck: any }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-200 bg-red-50',
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${severityColors[bottleneck.severity] || severityColors.low}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1">{bottleneck.description}</div>
          <div className="text-sm text-gray-600 mb-2">
            Impact: MYR {bottleneck.impact.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium">Mitigation:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {bottleneck.mitigation.map((m: string, idx: number) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className={`
          px-2 py-1 rounded text-xs font-semibold uppercase
          ${bottleneck.severity === 'critical' ? 'bg-red-200 text-red-800' :
            bottleneck.severity === 'high' ? 'bg-orange-200 text-orange-800' :
            bottleneck.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-blue-200 text-blue-800'}
        `}>
          {bottleneck.severity}
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: any }) {
  return (
    <div className="border-l-4 border-green-200 bg-green-50 rounded-r-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1">{opportunity.description}</div>
          <div className="text-sm text-green-700 font-semibold mb-2">
            💰 Save MYR {opportunity.savingsPotential.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium">Actions:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {opportunity.actions.map((a: string, idx: number) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-2 py-1 rounded text-xs font-semibold bg-green-200 text-green-800">
          {opportunity.confidence}% confidence
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ resource }: { resource: any }) {
  const utilizationColor = 
    resource.utilization > 100 ? 'bg-red-500' :
    resource.utilization > 80 ? 'bg-green-500' :
    'bg-yellow-500';

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{resource.role}</div>
        <div className="text-sm text-gray-600">
          {resource.region} · {resource.tasks.length} tasks · 
          MYR {resource.cost.toLocaleString('en-MY', { maximumFractionDigits: 0 })}
        </div>
      </div>
      
      <div className="w-48">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Utilization</span>
          <span className="font-semibold">{resource.utilization.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${utilizationColor} transition-all duration-500`}
            style={{ width: `${Math.min(100, resource.utilization)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Tasks to Optimize
        </h3>
        <p className="text-gray-600 mb-6">
          Go to Deliverable Map mode to load configuration tasks first
        </p>
      </div>
    </div>
  );
}

function NoResourcesState({ onAddSampleResources }: { onAddSampleResources: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Resources Added
        </h3>
        <p className="text-gray-600 mb-6">
          Add resources to run optimization algorithm
        </p>
        <button
          onClick={onAddSampleResources}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Add Sample Resources
        </button>
      </div>
    </div>
  );
}