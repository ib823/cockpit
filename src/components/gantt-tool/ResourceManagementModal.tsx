/**
 * Resource Management Modal
 *
 * Quick modal for managing resources directly from the Gantt timeline
 */

'use client';

import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  Save,
} from 'lucide-react';
import {
  Resource,
  ResourceFormData,
  ResourceCategory,
  ResourceDesignation,
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  ASSIGNMENT_LEVELS,
  AssignmentLevel,
} from '@/types/gantt-tool';

// Fixed rate ratios based on designation
const DESIGNATION_RATE_RATIOS: Record<ResourceDesignation, number> = {
  principal: 2.16718,
  director: 1.73375,
  senior_manager: 1.30031,
  manager: 0.81269,
  senior_consultant: 0.44427,
  consultant: 0.28173,
  analyst: 0.26006,
  subcontractor: 0.5, // Default rate for subcontractors
};

export function ResourceManagementModal({ onClose }: { onClose: () => void }) {
  const {
    currentProject,
    addResource,
    updateResource,
    deleteResource,
  } = useGanttToolStoreV2();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Calculate resource usage
  const getResourceUsage = (resourceId: string): number => {
    if (!currentProject) return 0;
    let count = 0;
    currentProject.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        if (task.resourceAssignments?.some(a => a.resourceId === resourceId)) {
          count++;
        }
      });
    });
    return count;
  };

  // Filter resources
  const filteredResources = useMemo(() => {
    if (!currentProject) return [];

    const resources = currentProject.resources || [];
    return resources.filter(resource => {
      const matchesSearch =
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [currentProject, searchQuery, categoryFilter]);

  const handleAddResource = () => {
    setEditingResource(null);
    setShowForm(true);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleDeleteResource = (resourceId: string, resourceName: string) => {
    const usage = getResourceUsage(resourceId);
    const confirmMessage = usage > 0
      ? `Delete "${resourceName}"?\n\nThis resource is used in ${usage} task(s). All assignments will be removed.`
      : `Delete "${resourceName}"?`;

    if (confirm(confirmMessage)) {
      deleteResource(resourceId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  if (!currentProject) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Resources</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {(currentProject.resources || []).length} resources · Quick add and edit
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-3 mb-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddResource}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All
              </button>
              {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon, color }]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key as ResourceCategory)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                    categoryFilter === key
                      ? 'text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  style={{
                    backgroundColor: categoryFilter === key ? color : undefined,
                  }}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Resource List */}
          <div className="flex-1 overflow-y-auto p-6">
            {showForm ? (
              <ResourceFormInline
                resource={editingResource}
                onClose={handleCloseForm}
                onSubmit={(data) => {
                  if (editingResource) {
                    updateResource(editingResource.id, data);
                  } else {
                    addResource(data);
                  }
                  handleCloseForm();
                }}
              />
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'No resources found'
                    : 'No resources yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first resource to start assigning to tasks'}
                </p>
                {!searchQuery && categoryFilter === 'all' && (
                  <button
                    onClick={handleAddResource}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Resource
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredResources.map((resource) => {
                  const category = RESOURCE_CATEGORIES[resource.category];
                  const usage = getResourceUsage(resource.id);

                  return (
                    <div
                      key={resource.id}
                      className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl flex-shrink-0">{category.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{resource.name}</h3>
                            <p className="text-xs text-gray-500">
                              {RESOURCE_DESIGNATIONS[resource.designation]}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit resource"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id, resource.name)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="mb-2">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                          style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                          }}
                        >
                          {category.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {resource.description}
                      </p>

                      {/* Usage */}
                      <div className="text-xs">
                        {usage > 0 ? (
                          <span className="text-blue-600 font-medium">
                            Used in {usage} task{usage !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not assigned yet</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Inline Resource Form (shown in the modal)
function ResourceFormInline({
  resource,
  onClose,
  onSubmit,
}: {
  resource: Resource | null;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
}) {
  const initialDesignation = resource?.designation || 'consultant';
  const [formData, setFormData] = useState<ResourceFormData>({
    name: resource?.name || '',
    category: resource?.category || 'functional',
    description: resource?.description || '',
    designation: initialDesignation,
    assignmentLevel: resource?.assignmentLevel || 'both',
    isBillable: resource?.isBillable !== undefined ? resource.isBillable : true,
    chargeRatePerHour: resource?.chargeRatePerHour || DESIGNATION_RATE_RATIOS[initialDesignation],
  });

  // Automatically update the rate when designation changes
  useEffect(() => {
    if (formData.isBillable) {
      setFormData(prev => ({
        ...prev,
        chargeRatePerHour: DESIGNATION_RATE_RATIOS[prev.designation],
      }));
    }
  }, [formData.designation, formData.isBillable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {resource ? 'Edit Resource' : 'Add New Resource'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Senior SAP Consultant, Technical Architect"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            This is a role, not a person name
          </p>
        </div>

        {/* Category and Designation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value as ResourceDesignation })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(RESOURCE_DESIGNATIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the role, skills, and responsibilities..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about skills and experience needed
          </p>
        </div>

        {/* Assignment Level */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assignment Level <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {Object.entries(ASSIGNMENT_LEVELS).map(([key, { label, description }]) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="assignmentLevel"
                  value={key}
                  checked={formData.assignmentLevel === key}
                  onChange={(e) => setFormData({ ...formData, assignmentLevel: e.target.value as AssignmentLevel })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Billing Configuration */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Billing Configuration
          </label>

          {/* Billable Toggle */}
          <label className="flex items-center gap-3 cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Billable resource</div>
              <div className="text-xs text-gray-500 mt-0.5">Include in cost calculations and budget tracking</div>
            </div>
          </label>

          {/* Charge Rate */}
          {formData.isBillable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rates Ratio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.chargeRatePerHour}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-calculated based on designation"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rate ratio is automatically set based on the selected designation
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {resource ? 'Save Changes' : 'Add Resource'}
          </button>
        </div>
      </form>
    </div>
  );
}
