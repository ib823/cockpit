"use client";

import { useState } from "react";
import { AlertCircle, ExternalLink, ChevronRight, X } from "lucide-react";

/**
 * Option B: Separate Project Context Tab (Final Recommendation)
 *
 * Shows complete end-to-end flow:
 * 1. Context Tab UI (where presales fill AS-IS/TO-BE)
 * 2. Smart prompting in Capacity view (when context missing)
 * 3. Integration with Architecture/v3 (how they complement)
 *
 * Policy Compliance:
 * - No emojis (Constraint B)
 * - Typography-based hierarchy
 * - XSS-safe input handling (shown conceptually)
 * - Multi-device responsive
 */

type ViewMode = "context-tab" | "capacity-with-prompt" | "integration-demo";

export default function OptionBFinalPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("context-tab");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Option B: Project Context Tab (Recommended)
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Complete end-to-end flow with smart prompting and Architecture/v3 integration
          </p>

          {/* View Mode Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("context-tab")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === "context-tab"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              1. Context Tab UI
            </button>
            <button
              onClick={() => setViewMode("capacity-with-prompt")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === "capacity-with-prompt"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              2. Smart Prompting Flow
            </button>
            <button
              onClick={() => setViewMode("integration-demo")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === "integration-demo"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              3. Architecture/v3 Integration
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {viewMode === "context-tab" && <ContextTabView />}
        {viewMode === "capacity-with-prompt" && <CapacityWithPromptView />}
        {viewMode === "integration-demo" && <IntegrationDemoView />}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 1: Context Tab UI (Where Presales Fill Context)
// ============================================================================

function ContextTabView() {
  const [asIs, setAsIs] = useState("");
  const [toBe, setToBe] = useState("");
  const [goals, setGoals] = useState("");
  const [skills, setSkills] = useState<string[]>(["Project Management", "SAP Functional"]);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Context saved successfully!");
    }, 500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Mock Gantt Tool Tab Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 flex items-center space-x-6">
        <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
          Timeline
        </button>
        <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          Project Context
        </button>
        <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
          Architecture
        </button>
        <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
          Capacity Planning
        </button>
      </div>

      {/* Context Form */}
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* Helper Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-r">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-1">
                Fill once, use everywhere
              </div>
              <div className="text-sm text-blue-800">
                This context will help you make better resource allocation decisions in Capacity Planning.
                It will also be available in Architecture view for solution architects.
              </div>
            </div>
          </div>
        </div>

        {/* Business Context Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Context</h3>
          <p className="text-sm text-gray-600 mb-4">
            Describe the current situation and target state to provide context for resource planning
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Current Situation (As-Is)
              </label>
              <textarea
                value={asIs}
                onChange={(e) => setAsIs(e.target.value)}
                placeholder="Describe the current state, existing systems, and processes...

Example:
Legacy on-premise SAP ECC 6.0 system with manual processes, limited integration between modules, and no mobile access for field operations."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
              />
              <div className="text-xs text-gray-500 mt-1">
                This helps identify which legacy skills/knowledge are needed
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Target State (To-Be)
              </label>
              <textarea
                value={toBe}
                onChange={(e) => setToBe(e.target.value)}
                placeholder="Describe the desired future state and solution...

Example:
Cloud-based SAP S/4HANA with automated workflows, real-time analytics, integrated modules, and mobile apps for warehouse and quality control."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
              />
              <div className="text-xs text-gray-500 mt-1">
                This helps identify which new skills/technologies are needed
              </div>
            </div>
          </div>
        </div>

        {/* Project Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Project Goals
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="List key goals and success criteria (one per line)...

Example:
- Support 50 concurrent users across 3 facilities
- Reduce month-end closing from 5 days to 1 day
- Enable mobile access for field operations
- Improve inventory accuracy from 85% to 98%"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
          />
          <div className="text-xs text-gray-500 mt-1">
            Clear goals help determine project scope and required effort
          </div>
        </div>

        {/* Skills Section */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Key Skills Required
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Add skills that will be needed for this project (helps filter resources in Capacity Planning)
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && newSkill.trim()) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill("");
                }
              }}
              placeholder="Add skill (e.g., SAP ABAP, Mobile Development)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newSkill.trim()) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill("");
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center gap-2 border border-gray-200"
              >
                {skill}
                <button
                  onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            All fields are optional. You can fill this later if needed.
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Context"}
            </button>
          </div>
        </div>
      </div>

      {/* Data Model Explanation */}
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs font-semibold text-gray-700 mb-3">Technical Implementation:</div>
          <div className="bg-white border border-gray-200 rounded p-4 font-mono text-xs">
            <div className="text-gray-600 mb-2">// Saves to existing field (no schema change needed):</div>
            <div className="text-gray-900">
              project.businessContext = &#123;
              <div className="pl-4">
                <div>painPoints: `AS-IS: $&#123;asIs&#125;\nTO-BE: $&#123;toBe&#125;\nGOALS: $&#123;goals&#125;`,</div>
                <div>entities: [],  // Filled by architects in Architecture/v3</div>
                <div>actors: [],    // Filled by architects in Architecture/v3</div>
                <div>capabilities: [] // Filled by architects in Architecture/v3</div>
              </div>
              &#125;
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Note: Uses existing database field. Architecture/v3 can read and enhance this same data.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 2: Smart Prompting in Capacity Planning
// ============================================================================

function CapacityWithPromptView() {
  const [showPrompt, setShowPrompt] = useState(true);
  const [contextFilled, setContextFilled] = useState(false);

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Smart Prompting: Guiding Users to Fill Context
        </h3>
        <p className="text-sm text-gray-600">
          When presales opens Capacity Planning without filling context, we show a gentle prompt.
          This makes the workflow "just work" without forcing or blocking.
        </p>
      </div>

      {/* Mock Capacity View */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Tab Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 flex items-center space-x-6">
          <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
            Timeline
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
            Project Context
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
            Architecture
          </button>
          <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            Capacity Planning
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Prompt (when context is missing) */}
          {showPrompt && !contextFilled && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r mb-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-yellow-900 mb-2">
                    Add project context for better resource decisions
                  </div>
                  <div className="text-sm text-yellow-800 mb-3">
                    To make informed resource allocation decisions, it helps to understand:
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1 mb-4">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>What systems and processes exist today (As-Is)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>What the target solution looks like (To-Be)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>What skills will be needed for this project</span>
                    </li>
                  </ul>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setContextFilled(true)}
                      className="px-5 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                    >
                      Fill Context Now
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowPrompt(false)}
                      className="px-5 py-2 border border-yellow-600 text-yellow-900 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="p-1 hover:bg-yellow-100 rounded"
                >
                  <X className="w-4 h-4 text-yellow-600" />
                </button>
              </div>
            </div>
          )}

          {/* Success State (when context is filled) */}
          {contextFilled && (
            <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-900 mb-1">
                    Context saved successfully
                  </div>
                  <div className="text-sm text-green-800">
                    Project context is now available. You can view it in the sidebar while allocating resources.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setContextFilled(false);
                    setShowPrompt(true);
                  }}
                  className="text-xs text-green-700 underline hover:text-green-900"
                >
                  Reset Demo
                </button>
              </div>
            </div>
          )}

          {/* Capacity Grid Placeholder */}
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm font-medium mb-2">Capacity Planning Grid</div>
            <div className="text-xs">
              (Split-screen with timeline + context would appear here)
            </div>
          </div>
        </div>
      </div>

      {/* UX Principles */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-xs font-semibold text-gray-700 mb-3">Apple UX Principles Applied:</div>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-medium">✓</span>
            <span><strong>Non-blocking:</strong> Users can skip and continue</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-medium">✓</span>
            <span><strong>Guided:</strong> Clear value proposition</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-medium">✓</span>
            <span><strong>One-click action:</strong> No complex navigation</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-medium">✓</span>
            <span><strong>Dismissible:</strong> Users stay in control</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 3: Integration with Architecture/v3
// ============================================================================

function IntegrationDemoView() {
  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          How Project Context Integrates with Architecture/v3
        </h3>
        <p className="text-sm text-gray-600">
          Presales fills simple text context. Solution architects can later enhance with detailed entities,
          actors, and system diagrams. Both use the SAME database field - no duplication.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="space-y-6">
          {/* Step 1: Presales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
              <div className="text-sm font-semibold text-blue-900 mb-3">
                Step 1: Presales Fills Context Tab
              </div>
              <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs">
                <div className="text-gray-900 mb-2">project.businessContext = &#123;</div>
                <div className="pl-4 text-gray-700 space-y-1">
                  <div>painPoints: "AS-IS: Legacy SAP...",</div>
                  <div className="text-gray-400">entities: [],  // Empty</div>
                  <div className="text-gray-400">actors: [],    // Empty</div>
                  <div className="text-gray-400">capabilities: [] // Empty</div>
                </div>
                <div className="text-gray-900">&#125;</div>
              </div>
              <div className="text-xs text-blue-800 mt-3">
                Presales focuses on simple AS-IS/TO-BE description
              </div>
            </div>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-5">
              <div className="text-sm font-semibold text-purple-900 mb-3">
                Step 2: Architect Opens Architecture/v3
              </div>
              <div className="bg-white border border-purple-200 rounded p-3 font-mono text-xs">
                <div className="text-gray-900 mb-2">// Reads SAME field</div>
                <div className="text-gray-900 mb-2">project.businessContext = &#123;</div>
                <div className="pl-4 text-gray-700 space-y-1">
                  <div className="text-green-600">painPoints: "AS-IS: Legacy..." ✓ Already filled!</div>
                  <div>entities: [&#123; name: "Finance" &#125;], // Adds detail</div>
                  <div>actors: [&#123; name: "CFO" &#125;],       // Adds detail</div>
                  <div>capabilities: [...]              // Adds detail</div>
                </div>
                <div className="text-gray-900">&#125;</div>
              </div>
              <div className="text-xs text-purple-800 mt-3">
                Architect enhances with detailed entities/actors
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-center">
            <div className="inline-block px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-300">
              Both write to SAME field → No duplication
            </div>
          </div>

          {/* Step 3: Back to Capacity */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-5">
            <div className="text-sm font-semibold text-green-900 mb-3">
              Step 3: Capacity Planning Reads Context
            </div>
            <div className="bg-white border border-green-200 rounded p-3 font-mono text-xs">
              <div className="text-gray-900 mb-2">// Displays in split-screen sidebar:</div>
              <div className="pl-4 text-gray-700 space-y-2">
                <div>
                  <div className="font-semibold">AS-IS:</div>
                  <div className="text-gray-600">Legacy SAP ECC 6.0 with manual processes...</div>
                </div>
                <div>
                  <div className="font-semibold">TO-BE:</div>
                  <div className="text-gray-600">Cloud S/4HANA with automated workflows...</div>
                </div>
                <div className="text-gray-400">
                  (Ignores entities/actors - not needed for capacity view)
                </div>
              </div>
            </div>
            <div className="text-xs text-green-800 mt-3">
              Context available without extra navigation
            </div>
          </div>
        </div>
      </div>

      {/* Link to Architecture/v3 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Advanced Users: Full Architecture View
            </div>
            <div className="text-sm text-gray-600">
              For detailed system diagrams, entity relationships, and integration flows, use Architecture/v3.
              It reads the same context presales filled and allows adding detailed architectural data.
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap ml-4">
            Open Architecture/v3
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single Source of Truth */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-xs font-semibold text-gray-700 mb-3">
          Database Design: Single Source of Truth
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="font-semibold text-gray-900 mb-2">Project Context Tab</div>
            <div className="text-xs text-gray-600">
              Writes: painPoints (AS-IS/TO-BE)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Simple text fields for presales
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="font-semibold text-gray-900 mb-2">Architecture/v3</div>
            <div className="text-xs text-gray-600">
              Reads: painPoints, Writes: entities/actors/capabilities
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Detailed diagrams for architects
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="font-semibold text-gray-900 mb-2">Capacity Planning</div>
            <div className="text-xs text-gray-600">
              Reads: painPoints (AS-IS/TO-BE)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Displays in context sidebar
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-4 text-center">
          All 3 interfaces use GanttProject.businessContext - No duplication, no conflicts
        </div>
      </div>
    </div>
  );
}
