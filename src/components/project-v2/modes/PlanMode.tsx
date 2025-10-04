"use client";

import { ImprovedGanttChart } from "@/components/timeline/ImprovedGanttChart";
import { cn, formatCurrency, formatDuration } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore, type Phase } from "@/stores/timeline-store";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Eye,
  Flag,
  Plus,
  Presentation,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SlideOver } from "../shared/SlideOver";
import { StatBadge } from "../shared/StatBadge";

// Helper to calculate phase cost
function calculatePhaseCost(phase: Phase): number {
  if (!phase.resources || phase.resources.length === 0) return 0;
  return phase.resources.reduce((sum, resource) => {
    const hours = phase.workingDays * 8 * (resource.allocation / 100);
    return sum + hours * resource.hourlyRate;
  }, 0);
}

export function PlanMode() {
  const { phases, selectedPackages, getProjectCost } = useTimelineStore();
  const { setMode, regenerateTimeline, timelineIsStale } = useProjectStore();
  const { chips, completeness } = usePresalesStore();
  const totalCost = getProjectCost();

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [zoom, setZoom] = useState<"week" | "month">("month");
  const [presentationMode, setPresentationMode] = useState(false);

  // Auto-generate timeline if empty and we have requirements
  useEffect(() => {
    console.log("[PlanMode] Check auto-generate:", {
      phaseCount: phases.length,
      chipCount: chips.length,
      completeness: completeness.score,
    });

    if (phases.length === 0 && chips.length > 0 && completeness.score >= 30) {
      console.log("[PlanMode] 🚀 Triggering auto-generate timeline...");
      regenerateTimeline(true);

      // Give stores time to update
      setTimeout(() => {
        const updatedPhases = useTimelineStore.getState().phases;
        console.log(`[PlanMode] After regeneration: ${updatedPhases.length} phases`);
      }, 100);
    }
  }, [phases.length, chips.length, completeness.score, regenerateTimeline]);

  // Memoized callbacks for performance
  const handleRegenerate = useCallback(() => {
    regenerateTimeline(true);
  }, [regenerateTimeline]);

  // Memoize expensive calculations
  const totalDuration = useMemo(
    () => phases.reduce((sum, phase) => sum + phase.workingDays, 0),
    [phases]
  );

  // Empty state - no timeline yet
  // ========================================
// COPY-PASTE SOLUTION: Add this to PlanMode.tsx
// ========================================

// STEP 1: Find the empty state section in PlanMode (around line 70-90)
// Look for: if (phases.length === 0) {

// Empty state - no timeline yet
  if (phases.length === 0) {
    const hasEnoughData = chips.length > 0 && completeness.score >= 30;

    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {hasEnoughData ? "Ready to Generate Timeline" : "Need More Requirements"}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {hasEnoughData
              ? `You have ${chips.length} requirements captured (${completeness.score}% complete). Click below to generate your project timeline.`
              : `Add more requirements in Capture mode. Currently at ${completeness.score}% (need 30% minimum).`}
          </p>

          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded text-left text-xs font-mono">
            <div>Chips: {chips.length}</div>
            <div>Completeness: {completeness.score}%</div>
            <div>Phases: {phases.length}</div>
            <div>Can Generate: {hasEnoughData ? "YES ✅" : "NO ❌"}</div>
          </div>

          {hasEnoughData && (
            <button
              onClick={() => {
                console.log("🔧 [MANUAL] Force regenerating timeline...");
                console.log(`   Input: ${chips.length} chips, ${completeness.score}% complete`);
                
                regenerateTimeline(true);
                
                setTimeout(() => {
                  const updatedPhases = useTimelineStore.getState().phases;
                  const updatedPackages = useTimelineStore.getState().selectedPackages;
                  
                  console.log(`   ✅ Generated: ${updatedPhases.length} phases, ${updatedPackages.length} packages`);
                  
                  if (updatedPhases.length > 0) {
                    alert(`Success! Generated ${updatedPhases.length} phases. Reloading page...`);
                    window.location.reload();
                  } else {
                    alert("Generation failed. Check console for errors.");
                    console.error("Timeline generation produced 0 phases");
                  }
                }, 1500);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              🚀 Generate Timeline Now
            </button>
          )}

          {!hasEnoughData && (
            <button
              onClick={() => setMode("capture")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Capture Mode
            </button>
          )}
        </div>
      </div>
    );
  }
// STEP 3: Save the file
// STEP 4: Refresh browser
// STEP 5: Click "Generate Timeline Now" button
// STEP 6: Check console logs and wait for success message

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          {/* Left: Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode("decide")}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              ← Back to Decisions
            </button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Regenerate Timeline
            </button>
          </div>

          {/* Right: View Controls */}
          <div className="flex items-center gap-4">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setZoom("week")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  zoom === "week"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setZoom("month")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  zoom === "month"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Month
              </button>
            </div>

            {/* Presentation toggle */}
            <button
              onClick={() => setPresentationMode(!presentationMode)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                         rounded-lg transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              {presentationMode ? "Edit Mode" : "Present Mode"}
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Navigation buttons */}
            <button
              onClick={() => setMode('optimize')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Optimize Resources
            </button>

            <button
              onClick={() => setMode('present')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Presentation className="w-4 h-4" />
              Present
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-3">
          <StatBadge label="Duration" value={formatDuration(totalDuration)} icon={Calendar} />
          {!presentationMode && (
            <StatBadge label="Cost" value={formatCurrency(totalCost, "MYR")} icon={DollarSign} />
          )}
          <StatBadge label="Phases" value={phases.length} icon={Flag} />
        </div>
      </div>

      {/* Stale warning banner */}
      {timelineIsStale && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yellow-900">
              Timeline outdated - decisions changed
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            className="px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700
                       transition-colors text-sm font-medium"
          >
            Regenerate
          </button>
        </motion.div>
      )}

      {/* Timeline visualization */}
      <div className="flex-1 overflow-hidden bg-white">
        <ImprovedGanttChart   
          onPhaseClick={(phase) => setSelectedPhase(phase)}
        />
      </div>

      {/* Phase inspector slide-over */}
      {!presentationMode && (
        <SlideOver
          open={selectedPhase !== null}
          onClose={() => setSelectedPhase(null)}
          title={selectedPhase?.name || "Phase Details"}
          width={500}
        >
          {selectedPhase && (
            <div className="space-y-6">
              {/* Phase overview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{formatDuration(selectedPhase.workingDays)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resources</span>
                    <span className="font-medium">{selectedPhase.resources?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost</span>
                    <span className="font-medium">
                      {formatCurrency(calculatePhaseCost(selectedPhase), "MYR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resources list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Team Members</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add Resource
                  </button>
                </div>

                {selectedPhase.resources && selectedPhase.resources.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPhase.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                            {(resource.name || resource.role).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {resource.name || resource.role}
                            </div>
                            <div className="text-xs text-gray-500">{resource.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">{resource.allocation}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No resources assigned yet
                  </p>
                )}
              </div>

              {/* Phase description */}
              {selectedPhase.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedPhase.description}</p>
                </div>
              )}
            </div>
          )}
        </SlideOver>
      )}
    </div>
  );
}
