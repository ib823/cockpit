"use client";

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, Users, Save } from 'lucide-react';
import type { Phase, Resource } from '@/types/core';
import { Button } from '@/components/common/Button';
import { Heading2, BodySM } from '@/components/common/Typography';
import { animation } from '@/lib/design-system';

interface ResourceManagerModalProps {
  phase: Phase;
  onClose: () => void;
  onSave: (resources: Resource[]) => void;
}

const REGIONS = [
  { code: 'ABMY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ABSG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ABVN', name: 'Vietnam', flag: '🇻🇳' },
];

const ROLES = [
  { id: 'lead', name: 'Project Lead', color: 'bg-purple-100 text-purple-700' },
  { id: 'architect', name: 'Solution Architect', color: 'bg-blue-100 text-blue-700' },
  { id: 'consultant', name: 'Consultant', color: 'bg-green-100 text-green-700' },
  { id: 'developer', name: 'Developer', color: 'bg-orange-100 text-orange-700' },
  { id: 'analyst', name: 'Business Analyst', color: 'bg-pink-100 text-pink-700' },
  { id: 'tester', name: 'QA Tester', color: 'bg-indigo-100 text-indigo-700' },
];

const DEFAULT_RATES: Record<string, number> = {
  'ABMY-lead': 250,
  'ABMY-architect': 220,
  'ABMY-consultant': 180,
  'ABMY-developer': 150,
  'ABMY-analyst': 140,
  'ABMY-tester': 120,
  'ABSG-lead': 300,
  'ABSG-architect': 270,
  'ABSG-consultant': 230,
  'ABSG-developer': 180,
  'ABSG-analyst': 170,
  'ABSG-tester': 150,
  'ABVN-lead': 150,
  'ABVN-architect': 130,
  'ABVN-consultant': 110,
  'ABVN-developer': 90,
  'ABVN-analyst': 85,
  'ABVN-tester': 75,
};

export function ResourceManagerModal({ phase, onClose, onSave }: ResourceManagerModalProps) {
  const [resources, setResources] = useState<Resource[]>(phase.resources || []);

  const addResource = () => {
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name: '',
      role: 'consultant',
      allocation: 100,
      region: 'ABMY',
      hourlyRate: DEFAULT_RATES['ABMY-consultant'],
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources(resources.map(r => {
      if (r.id !== id) return r;

      const updated = { ...r, ...updates };

      // Auto-update hourly rate when role or region changes
      if (updates.role || updates.region) {
        const rateKey = `${updated.region}-${updated.role}`;
        updated.hourlyRate = DEFAULT_RATES[rateKey] || updated.hourlyRate;
      }

      return updated;
    }));
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleSave = () => {
    onSave(resources);
    onClose();
  };

  const totalAllocation = resources.reduce((sum, r) => sum + r.allocation, 0);
  const avgAllocation = resources.length > 0 ? totalAllocation / resources.length : 0;
  const isOverAllocated = avgAllocation > 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: animation.duration.normal }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <Heading2>Resource Allocation</Heading2>
                <BodySM className="text-gray-600 mt-1">{phase.name}</BodySM>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Resources</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{resources.length}</div>
              </div>
              <div className={`rounded-lg p-4 ${isOverAllocated ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-sm font-medium ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
                  Avg Allocation
                </div>
                <div className={`text-2xl font-bold mt-1 ${isOverAllocated ? 'text-red-900' : 'text-green-900'}`}>
                  {avgAllocation.toFixed(0)}%
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Duration</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{phase.workingDays}d</div>
              </div>
            </div>

            {/* Resource List */}
            <div className="space-y-4 mb-4">
              {resources.map((resource, idx) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Name */}
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Name</label>
                      <input
                        type="text"
                        value={resource.name || ''}
                        onChange={(e) => updateResource(resource.id, { name: e.target.value })}
                        placeholder="Enter name..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Role */}
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Role</label>
                      <select
                        value={resource.role}
                        onChange={(e) => updateResource(resource.id, { role: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      >
                        {ROLES.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Region */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Region</label>
                      <select
                        value={resource.region}
                        onChange={(e) => updateResource(resource.id, { region: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      >
                        {REGIONS.map(reg => (
                          <option key={reg.code} value={reg.code}>
                            {reg.flag} {reg.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Allocation */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Allocation</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={resource.allocation}
                          onChange={(e) => updateResource(resource.id, { allocation: parseInt(e.target.value, 10) || 0 })}
                          min="0"
                          max="200"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm pr-6"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Rate</label>
                      <input
                        type="number"
                        value={resource.hourlyRate}
                        onChange={(e) => updateResource(resource.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeResource(resource.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Resource Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={addResource}
              leftIcon={<Plus className="w-5 h-5" />}
              className="w-full border-2 border-dashed"
            >
              Add Resource
            </Button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-8 border-t border-gray-200 bg-gray-50">
            <div>
              {isOverAllocated && (
                <BodySM className="text-red-600 font-medium">⚠️ Team is over-allocated</BodySM>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
