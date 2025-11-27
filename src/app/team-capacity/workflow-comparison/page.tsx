"use client";

import { useState } from "react";
import { Plus, Upload, Calendar, FileText, Users, X, Edit2, Trash2 } from "lucide-react";

/**
 * Workflow Comparison - Visual Prototypes
 *
 * Shows 3 critical workflow decisions visually:
 * 1. Where to capture project context (3 options)
 * 2. Resource creation flow (2 options)
 * 3. Integration flow (how it all connects)
 *
 * Policy Compliant: No emojis, typography-based hierarchy
 */

export default function WorkflowComparisonPage() {
  const [activeQuestion, setActiveQuestion] = useState<1 | 2>(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Workflow Visual Comparison
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Review each workflow visually to make informed decisions
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveQuestion(1)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeQuestion === 1
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Question 2: Where to Capture Context?
            </button>
            <button
              onClick={() => setActiveQuestion(2)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeQuestion === 2
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Question 4: Resource Creation Flow
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {activeQuestion === 1 && <ContextCaptureComparison />}
        {activeQuestion === 2 && <ResourceCreationComparison />}
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION 2: Where to Capture Context?
// ============================================================================

function ContextCaptureComparison() {
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C">("A");

  return (
    <div className="space-y-6">
      {/* Options Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Where Should Presales Capture Project Context?
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedOption("A")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedOption === "A"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Option A: During Project Creation
            </div>
            <div className="text-xs text-gray-600">
              Capture business context in NewProjectModal (extended form)
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
              Pros: Captured at source, no extra step
            </div>
            <div className="text-xs text-gray-500">
              Cons: Longer project creation flow
            </div>
          </button>

          <button
            onClick={() => setSelectedOption("B")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedOption === "B"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Option B: Separate Context Tab
            </div>
            <div className="text-xs text-gray-600">
              New tab in gantt-tool: Timeline | Context | Capacity
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
              Pros: Focused, can fill later
            </div>
            <div className="text-xs text-gray-500">
              Cons: Extra navigation step
            </div>
          </button>

          <button
            onClick={() => setSelectedOption("C")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedOption === "C"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Option C: Use Existing Architecture View
            </div>
            <div className="text-xs text-gray-600">
              Link to /architecture/v3, use existing businessContext
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
              Pros: No new UI, reuses existing
            </div>
            <div className="text-xs text-gray-500">
              Cons: Separate page, may be skipped
            </div>
          </button>
        </div>
      </div>

      {/* Visual Mockup */}
      {selectedOption === "A" && <OptionAExtendedProjectCreation />}
      {selectedOption === "B" && <OptionBSeparateContextTab />}
      {selectedOption === "C" && <OptionCArchitectureLink />}
    </div>
  );
}

// Option A: Extended Project Creation Modal
function OptionAExtendedProjectCreation() {
  const [step, setStep] = useState(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Option A: Extended NewProjectModal (Wizard Flow)
      </h3>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? "bg-blue-600 text-white"
                    : s < step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </button>
              {s < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Step 1: Basic Project Info
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              placeholder="YTL Cement SAP Implementation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Next: Business Context
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Step 2: Business Context (NEW)
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Situation (As-Is)
            </label>
            <textarea
              placeholder="Legacy on-premise SAP ECC 6.0 system with manual processes and limited integration..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target State (To-Be)
            </label>
            <textarea
              placeholder="Cloud-based SAP S/4HANA with automated workflows and real-time analytics..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Goals
            </label>
            <textarea
              placeholder="Support 50 concurrent users&#10;Reduce month-end closing from 5 days to 1 day&#10;Enable mobile access for field operations"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
            />
          </div>
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Next: Skills & Resources
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Step 3: Key Skills Needed (NEW)
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills Required for This Project
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g., SAP ABAP, Project Management)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Project Management", "SAP Functional", "SAP ABAP", "Business Analysis", "Mobile Development"].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {skill}
                  <button className="ml-2 text-blue-600 hover:text-blue-800">×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">User Experience Impact:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Context captured at project creation (no separate step)</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Available immediately in Capacity view</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Longer project creation flow (3 steps instead of 1)</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>May feel overwhelming for quick project setup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Option B: Separate Context Tab
function OptionBSeparateContextTab() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <h3 className="text-base font-semibold text-gray-900 p-6 pb-0">
        Option B: Separate "Project Context" Tab
      </h3>

      {/* Mock Gantt Tool Interface */}
      <div className="border-t border-gray-200 mt-6">
        {/* Tab Bar */}
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
        <div className="p-6 space-y-6 max-w-4xl">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Fill this once, use everywhere
            </div>
            <div className="text-xs text-blue-800">
              This context will appear in Capacity Planning view to help with resource allocation decisions
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Current Situation (As-Is)
              </label>
              <textarea
                placeholder="Describe the current state, systems, and processes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Target State (To-Be)
              </label>
              <textarea
                placeholder="Describe the desired future state and solution..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Project Goals
            </label>
            <textarea
              placeholder="List key goals and success criteria (one per line)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Key Skills Required
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["SAP Functional", "Project Management", "ABAP Development"].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Save Context
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">User Experience Impact:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Focused, dedicated space for context</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Can fill later (not blocking project creation)</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Easy to find and update</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Extra navigation step (Timeline → Context → Capacity)</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>May be forgotten/skipped if not prompted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Option C: Link to Architecture View
function OptionCArchitectureLink() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <h3 className="text-base font-semibold text-gray-900 p-6 pb-0">
        Option C: Use Existing Architecture View
      </h3>

      {/* Mock Flow Diagram */}
      <div className="p-8">
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Step 1: User at Capacity Planning View
              </div>
              <div className="text-xs text-gray-600">
                Click phase to allocate resources
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="flex-1 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Problem: No context available!
              </div>
              <div className="text-xs text-gray-600">
                User doesn't know what skills are needed
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="text-center text-sm text-gray-500">
            User realizes they need to fill context first
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Step 2: Navigate to Architecture View
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Click "Architecture" in GlobalNav or tab bar
              </div>
              <div className="bg-white border border-gray-200 rounded p-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">URL:</span>
                  <span className="font-mono text-gray-600">/architecture/v3</span>
                </div>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="flex-1 bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Step 3: Fill Business Context
              </div>
              <div className="text-xs text-gray-600 mb-2">
                Use existing tabs:
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                <div>• Business Context (entities, actors)</div>
                <div>• Current Landscape (AS-IS systems)</div>
                <div>• Proposed Solution (TO-BE)</div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="text-center text-sm text-gray-500">
            Context now saved in project.businessContext
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-purple-50 border-2 border-purple-400 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Step 4: Return to Capacity Planning
              </div>
              <div className="text-xs text-gray-600">
                Navigate back to gantt-tool
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="flex-1 bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Success: Context now visible!
              </div>
              <div className="text-xs text-gray-600">
                AS-IS, TO-BE, goals appear in split-screen context panel
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">User Experience Impact:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>No new UI development needed (reuse existing)</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Rich architecture data already available</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Requires navigation to completely different page</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Context switch breaks workflow (Timeline → Architecture → back)</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Architecture view may be too complex for simple context needs</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>High risk presales skip this step entirely</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION 4: Resource Creation Flow
// ============================================================================

function ResourceCreationComparison() {
  const [selectedFlow, setSelectedFlow] = useState<"existing" | "inline">("existing");

  return (
    <div className="space-y-6">
      {/* Options Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          How Should Resources Be Created?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedFlow("existing")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedFlow === "existing"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Existing Flow: ResourceManagementModal
            </div>
            <div className="text-xs text-gray-600">
              Dedicated modal with full resource library management
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
              Pros: Full-featured, centralized
            </div>
            <div className="text-xs text-gray-500">
              Cons: Separate from capacity view
            </div>
          </button>

          <button
            onClick={() => setSelectedFlow("inline")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedFlow === "inline"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">
              New Flow: Inline Resource Creation
            </div>
            <div className="text-xs text-gray-600">
              Create resources directly in capacity view
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
              Pros: Contextual, faster
            </div>
            <div className="text-xs text-gray-500">
              Cons: Limited features
            </div>
          </button>
        </div>
      </div>

      {/* Visual Mockup */}
      {selectedFlow === "existing" && <ExistingResourceManagementFlow />}
      {selectedFlow === "inline" && <InlineResourceCreationFlow />}
    </div>
  );
}

// Existing: ResourceManagementModal Flow
function ExistingResourceManagementFlow() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Existing: ResourceManagementModal (Current Implementation)
      </h3>

      {/* Flow Diagram */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">User at Capacity View</div>
            <div className="text-xs text-gray-600 mt-1">Wants to allocate resources to Phase 1</div>
          </div>
          <div className="text-xl text-gray-400">→</div>
          <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Need new resource!</div>
            <div className="text-xs text-gray-600 mt-1">Resource not in library yet</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-blue-50 border border-blue-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Click "Manage Resources" Button</div>
            <div className="text-xs text-gray-600 mt-1">Opens ResourceManagementModal</div>
          </div>
          <div className="text-xl text-gray-400">→</div>
          <div className="flex-1 bg-purple-50 border border-purple-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Fill Resource Details</div>
            <div className="text-xs text-gray-600 mt-1">Name, designation, category, email, etc.</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Resource Added to Library</div>
            <div className="text-xs text-gray-600 mt-1">Now available for allocation</div>
          </div>
          <div className="text-xl text-gray-400">→</div>
          <div className="flex-1 bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Close Modal, Return to Capacity</div>
            <div className="text-xs text-gray-600 mt-1">Can now allocate the new resource</div>
          </div>
        </div>
      </div>

      {/* Mock Interface */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mb-4"
      >
        Click to Preview ResourceManagementModal
      </button>

      {/* Modal Preview */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resource Management</h3>
                <div className="text-sm text-gray-600">Manage project resources and assignments</div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Resource List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-900">Resource Library (4)</div>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Resource
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Sarah Chen", designation: "Project Manager", category: "PM" },
                    { name: "Mike Wong", designation: "Solution Architect", category: "Technical" },
                    { name: "David Lee", designation: "SAP Consultant", category: "Functional" },
                    { name: "Emma Tan", designation: "ABAP Developer", category: "Developer" },
                  ].map((resource, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                        <div className="text-xs text-gray-600">{resource.designation} • {resource.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white rounded">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-white rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">User Experience Impact:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Full-featured: Edit, delete, view all resources</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Centralized resource library management</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Can manage org hierarchy, assign managers</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Breaks capacity allocation workflow (leave view → modal → return)</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Extra clicks to create resource mid-allocation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline: Quick Resource Creation
function InlineResourceCreationFlow() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        New: Inline Resource Creation (Proposed)
      </h3>

      {/* Flow Diagram */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">User at Capacity View</div>
            <div className="text-xs text-gray-600 mt-1">Looking at Phase 1, want to add resource</div>
          </div>
          <div className="text-xl text-gray-400">→</div>
          <div className="flex-1 bg-blue-50 border border-blue-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Click "+ Add Resource"</div>
            <div className="text-xs text-gray-600 mt-1">Inline form appears below phase</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-purple-50 border border-purple-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Quick Add Form</div>
            <div className="text-xs text-gray-600 mt-1">Name, designation, role (minimal fields)</div>
          </div>
          <div className="text-xl text-gray-400">→</div>
          <div className="flex-1 bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Resource Created & Allocated</div>
            <div className="text-xs text-gray-600 mt-1">Immediately appears in grid, ready to allocate</div>
          </div>
        </div>
      </div>

      {/* Mock Interface */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900">Phase 1: Planning & Requirements</div>
          <div className="text-xs text-gray-600">W1-W4</div>
        </div>

        <div className="space-y-3 mb-4">
          {/* Existing Resources */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
            <div className="text-xs text-gray-600">Project Manager</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">Mike Wong</div>
            <div className="text-xs text-gray-600">Solution Architect</div>
          </div>

          {/* Quick Add Form */}
          {showQuickAdd && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-900">Quick Add Resource</div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Designation</option>
                  <option>Principal</option>
                  <option>Director</option>
                  <option>Manager</option>
                  <option>Consultant</option>
                </select>
              </div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Category</option>
                <option>Project Management</option>
                <option>Business Analyst</option>
                <option>SAP Functional</option>
                <option>Developer</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  Add & Allocate
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Resource to Phase 1
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">User Experience Impact:</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Contextual: Create resource right where you need it</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Faster: No modal, no navigation away from capacity view</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 font-medium mr-2">+</span>
            <span>Smooth workflow: Create → allocate in one flow</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Limited fields (can't set email, department, manager)</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 font-medium mr-2">-</span>
            <span>Can't view/edit all resources centrally</span>
          </div>
          <div className="flex items-start">
            <span className="text-yellow-600 font-medium mr-2">?</span>
            <span>Could offer both: Quick add here + "Manage All Resources" button for advanced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
