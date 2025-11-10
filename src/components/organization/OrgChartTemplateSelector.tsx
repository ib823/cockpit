"use client";

import React, { useState } from "react";
import { ORG_CHART_TEMPLATES, type OrgChartTemplate } from "@/lib/gantt-tool/org-chart-templates";
import { useGanttToolStore } from "@/stores/gantt-tool-store-v2";

interface OrgChartTemplateSelectorProps {
  onClose?: () => void;
}

export function OrgChartTemplateSelector({ onClose }: OrgChartTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<OrgChartTemplate | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const applyOrgChartTemplate = useGanttToolStore((state) => (state as any).applyOrgChartTemplate);
  const currentProject = useGanttToolStore((state) => state.currentProject);

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const confirmed = replaceExisting
      ? window.confirm(
          "This will replace ALL existing resources with the template. This cannot be undone. Continue?"
        )
      : window.confirm("This will add template resources to your existing org chart. Continue?");

    if (confirmed) {
      applyOrgChartTemplate(selectedTemplate, replaceExisting);
      onClose?.();
    }
  };

  const hasExistingResources = currentProject && currentProject.resources.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Apply Org Chart Template</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose a template to quickly set up your project organization structure
          </p>
        </div>

        <div className="p-6">
          {/* Template Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {ORG_CHART_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {template.resources.length} roles
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                        {template.category.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Template Preview</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTemplate.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          resource.category === "pm"
                            ? "#F59E0B"
                            : resource.category === "functional"
                              ? "#3B82F6"
                              : resource.category === "technical"
                                ? "#8B5CF6"
                                : resource.category === "basis"
                                  ? "#10B981"
                                  : resource.category === "security"
                                    ? "#EF4444"
                                    : resource.category === "change"
                                      ? "#EC4899"
                                      : "#64748B",
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{resource.name}</div>
                      {resource.projectRole && (
                        <div className="text-xs text-gray-600">{resource.projectRole}</div>
                      )}
                    </div>
                    {resource.isPlaceholder && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        To be filled
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          {hasExistingResources && selectedTemplate && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="replace-existing"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="replace-existing" className="flex-1">
                  <div className="font-medium text-gray-900">Replace existing resources</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {replaceExisting
                      ? "All existing resources will be removed and replaced with template resources."
                      : "Template resources will be added to your existing org chart (duplicates by name will be skipped)."}
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedTemplate
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}
