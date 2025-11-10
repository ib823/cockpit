/**
 * Global Search Component
 *
 * Powerful search across projects, tasks, phases, and resources
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Modal, Input, Empty, Tabs } from "antd";
import { Search, FolderKanban, CheckCircle2, Calendar, Users, Target } from "lucide-react";
import type { GanttProject, GanttTask, GanttPhase, Resource } from "@/types/gantt-tool";
import { colorValues, withOpacity } from "@/lib/design-system";

interface SearchResult {
  type: "project" | "phase" | "task" | "resource" | "milestone";
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  relevance: number;
  matchedFields: string[];
  item: any;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  projects?: GanttProject[];
  onSelectResult?: (result: SearchResult) => void;
}

export function GlobalSearch({ open, onClose, projects = [], onSelectResult }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | SearchResult["type"]>("all");

  // Perform search
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    projects.forEach((project) => {
      // Search in project
      const projectMatches: string[] = [];
      if (project.name.toLowerCase().includes(lowerQuery)) projectMatches.push("name");
      if (project.description?.toLowerCase().includes(lowerQuery))
        projectMatches.push("description");

      if (projectMatches.length > 0) {
        searchResults.push({
          type: "project",
          id: project.id,
          title: project.name,
          subtitle: project.description,
          metadata: project.startDate,
          relevance: projectMatches.includes("name") ? 100 : 80,
          matchedFields: projectMatches,
          item: project,
        });
      }

      // Search in phases
      project.phases.forEach((phase) => {
        const phaseMatches: string[] = [];
        if (phase.name.toLowerCase().includes(lowerQuery)) phaseMatches.push("name");
        if (phase.description?.toLowerCase().includes(lowerQuery)) phaseMatches.push("description");

        if (phaseMatches.length > 0) {
          searchResults.push({
            type: "phase",
            id: phase.id,
            title: phase.name,
            subtitle: `${project.name} • ${phase.description}`,
            metadata: `${phase.startDate} - ${phase.endDate}`,
            relevance: phaseMatches.includes("name") ? 90 : 70,
            matchedFields: phaseMatches,
            item: phase,
          });
        }

        // Search in tasks
        phase.tasks.forEach((task) => {
          const taskMatches: string[] = [];
          if (task.name.toLowerCase().includes(lowerQuery)) taskMatches.push("name");
          if (task.description?.toLowerCase().includes(lowerQuery)) taskMatches.push("description");
          if (task.assignee?.toLowerCase().includes(lowerQuery)) taskMatches.push("assignee");

          if (taskMatches.length > 0) {
            searchResults.push({
              type: "task",
              id: task.id,
              title: task.name,
              subtitle: `${project.name} • ${phase.name}`,
              metadata: task.assignee || "Unassigned",
              relevance: taskMatches.includes("name") ? 85 : 65,
              matchedFields: taskMatches,
              item: task,
            });
          }
        });
      });

      // Search in resources
      project.resources?.forEach((resource) => {
        const resourceMatches: string[] = [];
        if (resource.name.toLowerCase().includes(lowerQuery)) resourceMatches.push("name");
        if (resource.email?.toLowerCase().includes(lowerQuery)) resourceMatches.push("email");
        if (resource.projectRole?.toLowerCase().includes(lowerQuery)) resourceMatches.push("projectRole");

        if (resourceMatches.length > 0) {
          searchResults.push({
            type: "resource",
            id: resource.id,
            title: resource.name,
            subtitle: resource.projectRole || resource.category,
            metadata: resource.email || "",
            relevance: resourceMatches.includes("name") ? 95 : 75,
            matchedFields: resourceMatches,
            item: resource,
          });
        }
      });

      // Search in milestones
      project.milestones?.forEach((milestone) => {
        const milestoneMatches: string[] = [];
        if (milestone.name.toLowerCase().includes(lowerQuery)) milestoneMatches.push("name");
        if (milestone.description?.toLowerCase().includes(lowerQuery))
          milestoneMatches.push("description");

        if (milestoneMatches.length > 0) {
          searchResults.push({
            type: "milestone",
            id: milestone.id,
            title: milestone.name,
            subtitle: `${project.name} • ${milestone.description}`,
            metadata: milestone.date,
            relevance: milestoneMatches.includes("name") ? 90 : 70,
            matchedFields: milestoneMatches,
            item: milestone,
          });
        }
      });
    });

    // Sort by relevance
    return searchResults.sort((a, b) => b.relevance - a.relevance);
  }, [query, projects]);

  // Filter by selected tab
  const filteredResults = useMemo(() => {
    if (selectedTab === "all") return results;
    return results.filter((r) => r.type === selectedTab);
  }, [results, selectedTab]);

  // Count by type
  const counts = useMemo(() => {
    const c = {
      all: results.length,
      project: 0,
      phase: 0,
      task: 0,
      resource: 0,
      milestone: 0,
    };

    results.forEach((r) => {
      c[r.type]++;
    });

    return c;
  }, [results]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onSelectResult?.(result);
      onClose();
      setQuery("");
    },
    [onSelectResult, onClose]
  );

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedTab("all");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      title="Global Search"
      closable={true}
      styles={{
        body: { padding: 0 },
      }}
    >
      <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <Input
            size="large"
            placeholder="Search projects, tasks, resources..."
            prefix={<Search className="w-5 h-5" style={{ color: colorValues.neutral[400] }} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              fontSize: "15px",
            }}
          />
        </div>

        {/* Results */}
        {query.length >= 2 ? (
          <>
            {/* Tabs */}
            <Tabs
              activeKey={selectedTab}
              onChange={(key) => setSelectedTab(key as any)}
              style={{ padding: "0 16px" }}
              items={[
                { key: "all", label: `All (${counts.all})` },
                { key: "project", label: `Projects (${counts.project})` },
                { key: "task", label: `Tasks (${counts.task})` },
                { key: "phase", label: `Phases (${counts.phase})` },
                { key: "resource", label: `Resources (${counts.resource})` },
                { key: "milestone", label: `Milestones (${counts.milestone})` },
              ]}
            />

            {/* Results List */}
            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: "400px" }}>
              {filteredResults.length === 0 ? (
                <Empty
                  description={`No ${selectedTab === "all" ? "" : selectedTab + "s"} found`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div className="space-y-2">
                  {filteredResults.map((result) => (
                    <SearchResultCard
                      key={`${result.type}-${result.id}`}
                      result={result}
                      query={query}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Search
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: colorValues.neutral[300] }}
            />
            <p className="text-sm" style={{ color: colorValues.neutral[500] }}>
              Type at least 2 characters to search
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Search Result Card
function SearchResultCard({
  result,
  query,
  onClick,
}: {
  result: SearchResult;
  query: string;
  onClick: () => void;
}) {
  const icon = {
    project: <FolderKanban className="w-4 h-4" />,
    phase: <Calendar className="w-4 h-4" />,
    task: <CheckCircle2 className="w-4 h-4" />,
    resource: <Users className="w-4 h-4" />,
    milestone: <Target className="w-4 h-4" />,
  }[result.type];

  const color = {
    project: colorValues.primary[500],
    phase: colorValues.warning[600],
    task: colorValues.success[600],
    resource: colorValues.primary[600],
    milestone: colorValues.error[500],
  }[result.type];

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: withOpacity(colorValues.warning[500], 0.3),
                padding: "0 2px",
                borderRadius: "2px",
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div
      className="p-3 rounded-lg border cursor-pointer transition-all duration-150 hover:shadow-md"
      style={{
        backgroundColor: "#fff",
        borderColor: colorValues.neutral[200],
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.backgroundColor = withOpacity(color, 0.02);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colorValues.neutral[200];
        e.currentTarget.style.backgroundColor = "#fff";
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: withOpacity(color, 0.1),
            color,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded uppercase font-semibold"
              style={{
                backgroundColor: withOpacity(color, 0.1),
                color,
              }}
            >
              {result.type}
            </span>
            <span
              className="text-sm font-medium truncate"
              style={{ color: colorValues.neutral[900] }}
            >
              {highlightText(result.title)}
            </span>
          </div>
          {result.subtitle && (
            <div className="text-xs truncate" style={{ color: colorValues.neutral[500] }}>
              {highlightText(result.subtitle)}
            </div>
          )}
          {result.metadata && (
            <div className="text-xs mt-1" style={{ color: colorValues.neutral[400] }}>
              {result.metadata}
            </div>
          )}
        </div>

        {/* Relevance Score */}
        <div className="flex-shrink-0 text-right">
          <div
            className="text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: withOpacity(color, 0.1),
              color,
            }}
          >
            {result.relevance}%
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to programmatically trigger global search
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close };
}
