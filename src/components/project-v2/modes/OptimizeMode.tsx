"use client";

import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { Button } from "@/components/common/Button";
import { ArrowLeft, Sparkles, Plus } from "lucide-react";
import { Heading2, Heading3, BodyMD } from "@/components/common/Typography";
import { ResourcePanel } from "@/components/resource-planning";
import { RicefwPanel } from "@/components/estimation/RicefwPanel";
import { RicefwSummary } from "@/components/estimation/RicefwSummary";
import { useState } from "react";
import { RicefwItem } from "@/lib/ricefw/model";

/**
 * OptimizeMode - Resource optimization and RICEFW management
 *
 * Features:
 * - RICEFW object estimation (Reports, Interfaces, Conversions, Enhancements, Forms, Workflows)
 * - Resource allocation by phase
 * - Timeline optimization
 */
export function OptimizeMode() {
  const { setMode } = useProjectStore();
  const { phases } = useTimelineStore();
  const [ricefwItems, setRicefwItems] = useState<RicefwItem[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'ricefw'>('resources');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("plan")}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Plan
            </Button>

            {/* Tab Navigation */}
            <div className="flex gap-2 ml-8">
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'resources'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Resource Planning
              </button>
              <button
                onClick={() => setActiveTab('ricefw')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'ricefw'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                RICEFW Objects
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => setMode("present")}
          >
            Continue to Present
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Heading2 className="mb-2">Resource Planning</Heading2>
                <BodyMD className="text-gray-600 mb-6">
                  Allocate resources by phase. Resources are assigned at the phase level, not by individual tasks.
                </BodyMD>

                <ResourcePanel phases={phases} />
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <BodyMD className="text-gray-600 mb-2">Total Phases</BodyMD>
                  <Heading2>{phases.length}</Heading2>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <BodyMD className="text-gray-600 mb-2">Total Effort</BodyMD>
                  <Heading2>
                    {phases.reduce((sum, p) => sum + (p.effort || 0), 0)} days
                  </Heading2>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <BodyMD className="text-gray-600 mb-2">Total Resources</BodyMD>
                  <Heading2>
                    {phases.reduce((sum, p) => sum + (p.resources?.length || 0), 0)}
                  </Heading2>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ricefw' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Heading2 className="mb-2">RICEFW Objects</Heading2>
                <BodyMD className="text-gray-600 mb-6">
                  Define custom development objects: Reports, Interfaces, Conversions, Enhancements, Forms, and Workflows.
                  These will be added to your timeline and cost estimate.
                </BodyMD>

                <RicefwPanel
                  projectId="current-project"
                  items={ricefwItems}
                  averageHourlyRate={150}
                  onChange={setRicefwItems}
                />
              </div>

              {/* RICEFW Summary */}
              {ricefwItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <Heading3 className="mb-4">RICEFW Summary</Heading3>
                  <RicefwSummary items={ricefwItems} averageHourlyRate={150} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
