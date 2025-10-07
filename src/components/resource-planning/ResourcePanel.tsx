"use client";

import { useState } from "react";
import { PhaseResource, ResourceRole } from "@/lib/resourcing/model";
import { Edit2, Trash2, Plus, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResourcePanelProps {
  phaseId: string;
  phaseName: string;
  phaseEffort: number;
  resources: PhaseResource[];
  onUpdateResource: (resourceId: string, updates: Partial<PhaseResource>) => void;
  onAddResource: (role: ResourceRole, region: string, allocation: number) => void;
  onRemoveResource: (resourceId: string) => void;
}

const ROLE_COLORS: Record<ResourceRole, string> = {
  PM: "#8B5CF6",
  Technical: "#3B82F6",
  Functional: "#10B981",
  Architect: "#F59E0B",
  Basis: "#EF4444",
  Security: "#EC4899",
  ChangeManagement: "#14B8A6",
  Testing: "#6366F1",
  Training: "#84CC16",
};

export function ResourcePanel({
  phaseId,
  phaseName,
  phaseEffort,
  resources = [], // Default to empty array
  onUpdateResource,
  onAddResource,
  onRemoveResource,
}: ResourcePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRole, setNewRole] = useState<ResourceRole>("Technical");
  const [newRegion, setNewRegion] = useState("US-East");
  const [newAllocation, setNewAllocation] = useState(50);

  const totalAllocation = resources.reduce((sum, r) => sum + r.allocation, 0);
  const totalCost = resources.reduce((sum, r) => sum + r.calculatedCost, 0);
  const totalHours = resources.reduce((sum, r) => sum + r.calculatedHours, 0);

  const handleAddResource = () => {
    onAddResource(newRole, newRegion, newAllocation);
    setShowAddForm(false);
    setNewRole("Technical");
    setNewRegion("US-East");
    setNewAllocation(50);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{phaseName}</h3>
              <p className="text-sm text-gray-500">{phaseEffort} PD baseline effort</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Allocation</div>
            <div
              className={`text-lg font-bold ${
                totalAllocation > 100 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {totalAllocation}%
            </div>
          </div>
        </div>
      </div>

      {/* Resource List */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence>
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Resource Info */}
                <div className="flex-1 grid grid-cols-5 gap-4">
                  {/* Role */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ROLE_COLORS[resource.role] }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {resource.role}
                    </span>
                  </div>

                  {/* Region */}
                  <div>
                    <div className="text-xs text-gray-500">Region</div>
                    {editingId === resource.id ? (
                      <select
                        value={resource.region}
                        onChange={(e) =>
                          onUpdateResource(resource.id, { region: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="US-East">US-East</option>
                        <option value="Asia-Pacific">Asia-Pacific</option>
                      </select>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {resource.region}
                      </div>
                    )}
                  </div>

                  {/* Allocation */}
                  <div>
                    <div className="text-xs text-gray-500">Allocation %</div>
                    {editingId === resource.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={resource.allocation}
                        onChange={(e) =>
                          onUpdateResource(resource.id, {
                            allocation: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {resource.allocation}%
                      </div>
                    )}
                  </div>

                  {/* Hours */}
                  <div>
                    <div className="text-xs text-gray-500">Hours</div>
                    <div className="text-sm font-medium text-gray-900">
                      {resource.calculatedHours.toFixed(1)}
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <div className="text-xs text-gray-500">Cost</div>
                    <div className="text-sm font-semibold text-green-600">
                      ${resource.calculatedCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {editingId === resource.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Done
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingId(resource.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit resource"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveResource(resource.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Resource Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-4 bg-indigo-50 border-t border-indigo-100"
          >
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ResourceRole)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Functional">Functional</option>
                  <option value="Architect">Architect</option>
                  <option value="PM">PM</option>
                  <option value="Basis">Basis</option>
                  <option value="Security">Security</option>
                  <option value="Testing">Testing</option>
                  <option value="Training">Training</option>
                  <option value="ChangeManagement">Change Management</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Region</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="US-East">US-East</option>
                  <option value="Asia-Pacific">Asia-Pacific</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Allocation %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newAllocation}
                  onChange={(e) => setNewAllocation(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAddResource}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Hours</div>
              <div className="text-sm font-bold text-gray-900">
                {totalHours.toFixed(0)} hrs
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Cost</div>
              <div className="text-sm font-bold text-green-600">
                ${totalCost.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
