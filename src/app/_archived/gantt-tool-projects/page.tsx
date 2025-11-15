/**
 * Gantt Tool - Projects List Page
 *
 * Shows all stored projects and allows quick access
 */

"use client";

import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { Calendar, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GanttProjectsPage() {
  const router = useRouter();
  const { projects, loadProject, deleteProject, unloadCurrentProject, currentProject } =
    useGanttToolStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Unload current project to show all projects
    if (currentProject) {
      unloadCurrentProject();
    }
  }, [currentProject, unloadCurrentProject]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  const handleLoadProject = (projectId: string) => {
    loadProject(projectId);
    router.push("/gantt-tool");
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Your Gantt Projects</h1>
          </div>
          <p className="text-gray-600">
            Found {projects.length} project{projects.length !== 1 ? "s" : ""} in your browser
            storage
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h2>
            <p className="text-gray-500 mb-6">You haven&apos;t created any projects yet.</p>
            <button
              onClick={() => router.push("/gantt-tool")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...projects]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((project) => {
                const totalTasks = project.phases.reduce((sum, p) => sum + p.tasks.length, 0);
                const totalMilestones = project.milestones.length;

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Project Header */}
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="p-5 bg-gray-50">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {project.phases.length}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Phases</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{totalTasks}</div>
                          <div className="text-xs text-gray-600 mt-1">Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{totalMilestones}</div>
                          <div className="text-xs text-gray-600 mt-1">Milestones</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString()} at{" "}
                        {new Date(project.updatedAt).toLocaleTimeString()}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadProject(project.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Open
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Back to Main Page */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/gantt-tool")}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            ← Back to Gantt Tool
          </button>
        </div>
      </div>
    </div>
  );
}
