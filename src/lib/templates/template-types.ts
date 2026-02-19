/**
 * Template System - Type Definitions
 *
 * Templates allow users to start projects quickly with pre-configured
 * phases, tasks, milestones, and resources.
 */

import type { GanttPhase, GanttTask, Resource, GanttHoliday, GanttMilestone } from "@/types/gantt-tool";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string; // Base64 or URL to preview image
  estimatedDuration: string; // Human-readable: "3 months", "6 weeks"
  estimatedCost?: string; // "$50k - $150k"
  complexity: "beginner" | "intermediate" | "advanced";
  tags: string[];

  // Template content
  phases: TemplatePhase[];
  resources?: TemplateResource[];
  milestones?: TemplateMilestone[];
  holidays?: GanttHoliday[];

  // Metadata
  author?: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number; // How many times template has been used
  featured?: boolean; // Show in featured section
}

export interface TemplatePhase {
  name: string;
  description?: string;
  color: string;
  durationDays: number; // Working days
  tasks: TemplateTask[];
  sortOrder: number;
}

export interface TemplateTask {
  name: string;
  description?: string;
  durationDays: number; // Working days
  assignee?: string; // Resource name or role
  progress?: number;
  dependencies?: string[]; // Task names this depends on
  sortOrder: number;
}

export interface TemplateResource {
  name: string;
  email?: string;
  role: string;
  category: string;
  designation: string;
  rate: number;
  workingHours: number;
  color: string;
}

export interface TemplateMilestone {
  name: string;
  description?: string;
  dayOffset: number; // Days from project start
  color: string;
}

export type TemplateCategory =
  | "software"
  | "consulting-sap"
  | "construction"
  | "marketing"
  | "general"
  | "blank";

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color for category badge
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, TemplateCategoryInfo> = {
  software: {
    id: "software",
    name: "Software Development",
    description: "Agile sprints, product launches, and feature development",
    icon: "Code",
    color: "#007AFF", // Blue
  },
  "consulting-sap": {
    id: "consulting-sap",
    name: "SAP Consulting",
    description: "SAP implementations, integrations, and transformations",
    icon: "Briefcase",
    color: "#AF52DE", // Purple
  },
  construction: {
    id: "construction",
    name: "Construction",
    description: "Building projects, renovations, and infrastructure",
    icon: "HardHat",
    color: "#FF9500", // Amber
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    description: "Campaigns, content strategy, and event planning",
    icon: "Megaphone",
    color: "#FF2D55", // Pink
  },
  general: {
    id: "general",
    name: "General Purpose",
    description: "Versatile templates for any industry",
    icon: "FolderKanban",
    color: "#34C759", // Green
  },
  blank: {
    id: "blank",
    name: "Start from Scratch",
    description: "Empty project template",
    icon: "FilePlus",
    color: "#8E8E93", // Gray
  },
};

// Helper function to get category info
export function getCategoryInfo(category: TemplateCategory): TemplateCategoryInfo {
  return TEMPLATE_CATEGORIES[category];
}

// Helper function to filter templates by category
export function filterTemplatesByCategory(
  templates: ProjectTemplate[],
  category: TemplateCategory | "all"
): ProjectTemplate[] {
  if (category === "all") return templates;
  return templates.filter((t) => t.category === category);
}

// Helper function to search templates
export function searchTemplates(templates: ProjectTemplate[], query: string): ProjectTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
