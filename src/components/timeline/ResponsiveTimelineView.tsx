"use client";

import { Container } from "@/components/ui/Container";
import { Heading, Text } from "@/components/ui/Typography";
import { ResponsiveStack } from "@/components/ui/ResponsiveShell";
import { useTimelineStore } from "@/stores/timeline-store";
import { ResourcePanel } from "@/components/resource-planning/ResourcePanel";
import { WrapperPanel } from "@/components/resource-planning/WrapperPanel";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Clock, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export function ResponsiveTimelineView() {
  const {
    phases,
    resourcePlan,
    generateResources,
    updatePhaseResourceAllocation,
    addPhaseResource,
    removePhaseResource,
    updateWrapperConfig,
    getMargin,
  } = useTimelineStore();

  // Generate resources on mount if not already generated
  useEffect(() => {
    if (!resourcePlan && phases.length > 0) {
      generateResources();
    }
  }, [phases, resourcePlan, generateResources]);

  if (!resourcePlan) {
    return (
      <Container size="xl">
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <Text className="text-gray-500">Generating resource plan...</Text>
        </div>
      </Container>
    );
  }

  const sellingPrice = 500000; // Example selling price
  const margin = getMargin(sellingPrice);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="2xl">
        <ResponsiveStack spacing="lg">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Heading as="h1" className="text-gray-900 mb-2">
              Resource Planning
            </Heading>
            <Text className="text-gray-600">
              Phase-level resource allocation and cost estimation
            </Text>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Technical Effort Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Technical Effort</div>
                  <div className="text-xl font-bold text-gray-900">
                    {resourcePlan.totals.technicalEffort.toFixed(0)} PD
                  </div>
                </div>
              </div>
            </div>

            {/* Wrapper Effort Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Wrapper Effort</div>
                  <div className="text-xl font-bold text-gray-900">
                    {resourcePlan.totals.wrapperEffort.toFixed(0)} PD
                  </div>
                </div>
              </div>
            </div>

            {/* Total Cost Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Cost</div>
                  <div className="text-xl font-bold text-green-600">
                    ${resourcePlan.totals.totalCost.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Margin</div>
                  <div
                    className={`text-xl font-bold ${
                      margin >= 20 ? "text-green-600" : margin >= 10 ? "text-orange-600" : "text-red-600"
                    }`}
                  >
                    {margin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase Resource Panels */}
          <ResponsiveStack spacing="md">
            <Heading as="h2" className="text-gray-900">
              Phase Resources
            </Heading>

            {resourcePlan.phases.map((phaseAllocation, index) => (
              <motion.div
                key={phaseAllocation.phaseId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <ResourcePanel
                  phaseId={phaseAllocation.phaseId}
                  phaseName={phaseAllocation.phaseName}
                  phaseEffort={phaseAllocation.baseEffort}
                  resources={phaseAllocation.resources}
                  onUpdateResource={(resourceId, updates) =>
                    updatePhaseResourceAllocation(phaseAllocation.phaseId, resourceId, updates)
                  }
                  onAddResource={(role, region, allocation) =>
                    addPhaseResource(phaseAllocation.phaseId, role, region, allocation)
                  }
                  onRemoveResource={(resourceId) =>
                    removePhaseResource(phaseAllocation.phaseId, resourceId)
                  }
                />
              </motion.div>
            ))}
          </ResponsiveStack>

          {/* Wrapper Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <ResponsiveStack spacing="md">
              <Heading as="h2" className="text-gray-900">
                Overhead Activities
              </Heading>
              <WrapperPanel
                wrappers={resourcePlan.wrappers}
                technicalEffort={resourcePlan.totals.technicalEffort}
                averageRate={resourcePlan.totals.averageRate}
                onUpdateWrapper={(wrapperId, updates) =>
                  updateWrapperConfig(wrapperId, updates)
                }
              />
            </ResponsiveStack>
          </motion.div>

          {/* Final Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">Total Effort</div>
                <div className="text-3xl font-bold">
                  {resourcePlan.totals.totalEffort.toFixed(0)} PD
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {(resourcePlan.totals.totalEffort * 8).toFixed(0)} hours
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">Project Cost</div>
                <div className="text-3xl font-bold">
                  ${resourcePlan.totals.totalCost.toLocaleString()}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  Avg rate: ${resourcePlan.totals.averageRate.toFixed(0)}/hr
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">Target Margin</div>
                <div className="text-3xl font-bold">{margin.toFixed(1)}%</div>
                <div className="text-xs opacity-75 mt-1">
                  Selling: ${sellingPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        </ResponsiveStack>
      </Container>
    </div>
  );
}
