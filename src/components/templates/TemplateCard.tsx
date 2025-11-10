/**
 * Template Card Component
 *
 * Displays a project template with preview information
 */

"use client";

import { useState } from "react";
import { Clock, DollarSign, FolderKanban, CheckCircle2, ChevronRight, Star } from "lucide-react";
import type { ProjectTemplate } from "@/lib/templates/template-types";
import { getCategoryInfo } from "@/lib/templates/template-types";
import { getTemplateStats } from "@/lib/templates/template-engine";
import { colorValues, getElevationShadow, withOpacity } from "@/lib/design-system";

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: (template: ProjectTemplate) => void;
  featured?: boolean;
}

export function TemplateCard({ template, onSelect, featured = false }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryInfo = getCategoryInfo(template.category);
  const stats = getTemplateStats(template);

  // Complexity badge colors
  const complexityColors = {
    beginner: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    intermediate: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
    advanced: { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  };

  const complexityColor = complexityColors[template.complexity];

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: isHovered ? getElevationShadow(3) : getElevationShadow(1),
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(template)}
    >
      {/* Featured Badge */}
      {(featured || template.featured) && (
        <div
          className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: withOpacity(colorValues.warning[500], 0.1),
            border: `1px solid ${colorValues.warning[200]}`,
          }}
        >
          <Star
            className="w-3 h-3"
            style={{ color: colorValues.warning[600], fill: colorValues.warning[600] }}
          />
          <span className="text-xs font-medium" style={{ color: colorValues.warning[700] }}>
            Featured
          </span>
        </div>
      )}

      {/* Category Header */}
      <div
        className="px-5 py-4 border-b border-gray-100"
        style={{
          background: `linear-gradient(135deg, ${withOpacity(categoryInfo.color, 0.05)} 0%, ${withOpacity(
            categoryInfo.color,
            0.02
          )} 100%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                style={{
                  backgroundColor: withOpacity(categoryInfo.color, 0.1),
                  border: `1px solid ${withOpacity(categoryInfo.color, 0.2)}`,
                }}
              >
                <FolderKanban className="w-3.5 h-3.5" style={{ color: categoryInfo.color }} />
                <span className="text-xs font-medium" style={{ color: categoryInfo.color }}>
                  {categoryInfo.name}
                </span>
              </div>

              {/* Complexity Badge */}
              <div
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: complexityColor.bg,
                  color: complexityColor.text,
                  border: `1px solid ${complexityColor.border}`,
                }}
              >
                {template.complexity}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: withOpacity(colorValues.primary[500], 0.1) }}
            >
              <Clock className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Duration</div>
              <div className="text-sm font-semibold text-gray-900">
                {template.estimatedDuration}
              </div>
            </div>
          </div>

          {/* Cost */}
          {template.estimatedCost && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: withOpacity(colorValues.success[600], 0.1) }}
              >
                <DollarSign className="w-4 h-4" style={{ color: colorValues.success[600] }} />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Est. Cost</div>
                <div className="text-sm font-semibold text-gray-900">{template.estimatedCost}</div>
              </div>
            </div>
          )}
        </div>

        {/* Project Composition */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Phases</span>
            <span className="font-semibold text-gray-900">{stats.phaseCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tasks</span>
            <span className="font-semibold text-gray-900">{stats.taskCount}</span>
          </div>
          {stats.resourceCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Resources</span>
              <span className="font-semibold text-gray-900">{stats.resourceCount}</span>
            </div>
          )}
          {stats.milestoneCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Milestones</span>
              <span className="font-semibold text-gray-900">{stats.milestoneCount}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                +{template.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Use Template Button */}
        <button
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            backgroundColor: isHovered ? colorValues.primary[600] : colorValues.primary[500],
            color: "#ffffff",
            boxShadow: isHovered
              ? `0 4px 12px ${withOpacity(colorValues.primary[600], 0.3)}`
              : "none",
            transform: isHovered ? "scale(1.02)" : "scale(1)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Use This Template
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Usage Count (if available) */}
      {template.usageCount !== undefined && template.usageCount > 0 && (
        <div className="px-5 py-2 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500">
            Used <span className="font-semibold text-gray-700">{template.usageCount}</span> times
          </div>
        </div>
      )}
    </div>
  );
}
