"use client";

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Award } from 'lucide-react';
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
  { code: 'ABMY', name: 'Malaysia', flag: '🇲🇾', costIndex: 1.0 },
  { code: 'ABSG', name: 'Singapore', flag: '🇸🇬', costIndex: 1.2 },
  { code: 'ABVN', name: 'Vietnam', flag: '🇻🇳', costIndex: 0.6 },
];

const ROLE_PROFILES = [
  {
    id: 'lead',
    name: 'Project Lead',
    icon: '👔',
    baseRate: 250,
    expertise: 'Strategic oversight, stakeholder management',
    impact: 'critical'
  },
  {
    id: 'architect',
    name: 'Solution Architect',
    icon: '🏗️',
    baseRate: 220,
    expertise: 'Technical design, integration strategy',
    impact: 'critical'
  },
  {
    id: 'consultant',
    name: 'Functional Consultant',
    icon: '💼',
    baseRate: 180,
    expertise: 'Process design, configuration',
    impact: 'high'
  },
  {
    id: 'developer',
    name: 'Developer',
    icon: '💻',
    baseRate: 150,
    expertise: 'Custom code, enhancements',
    impact: 'high'
  },
  {
    id: 'analyst',
    name: 'Business Analyst',
    icon: '📊',
    baseRate: 140,
    expertise: 'Requirements, testing',
    impact: 'medium'
  },
  {
    id: 'tester',
    name: 'QA Specialist',
    icon: '🔍',
    baseRate: 120,
    expertise: 'Quality assurance, UAT',
    impact: 'medium'
  },
];

/**
 * Resource Manager - Strategic & Insightful
 *
 * Jobs/Ive Principles:
 * - Show impact, not just data entry
 * - Provide intelligent recommendations
 * - Make cost/quality trade-offs visible
 * - Beautiful, minimal interface
 */
export function ResourceManagerModal({ phase, onClose, onSave }: ResourceManagerModalProps) {
  const [resources, setResources] = useState<Resource[]>(phase.resources || []);

  // Calculate strategic metrics
  const metrics = useMemo(() => {
    const totalCost = resources.reduce((sum, r) => {
      const days = phase.workingDays || 0;
      const hours = days * 8 * (r.allocation / 100);
      return sum + (hours * r.hourlyRate);
    }, 0);

    const totalCapacity = resources.reduce((sum, r) => sum + r.allocation, 0);
    const avgSeniority = resources.length > 0
      ? resources.reduce((sum, r) => {
          const role = ROLE_PROFILES.find(rp => rp.id === r.role);
          return sum + (role?.baseRate || 0);
        }, 0) / resources.length
      : 0;

    const criticalRoles = resources.filter(r => {
      const role = ROLE_PROFILES.find(rp => rp.id === r.role);
      return role?.impact === 'critical';
    }).length;

    const isOverAllocated = totalCapacity > resources.length * 100;
    const isUnderStaffed = resources.length < 3;
    const hasArchitect = resources.some(r => r.role === 'architect');
    const hasLead = resources.some(r => r.role === 'lead');

    return {
      totalCost,
      totalCapacity,
      avgSeniority,
      criticalRoles,
      isOverAllocated,
      isUnderStaffed,
      hasArchitect,
      hasLead,
      teamSize: resources.length,
      qualityScore: (hasArchitect && hasLead ? 100 : 70) + (criticalRoles * 10) - (isOverAllocated ? 20 : 0)
    };
  }, [resources, phase.workingDays]);

  const addResource = (roleId: string) => {
    const role = ROLE_PROFILES.find(r => r.id === roleId);
    if (!role) return;

    const defaultRegion = 'ABMY';
    const region = REGIONS.find(r => r.code === defaultRegion)!;
    const baseRate = role.baseRate * region.costIndex;

    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name: `${role.name} ${resources.length + 1}`,
      role: roleId,
      allocation: 100,
      region: defaultRegion,
      hourlyRate: baseRate,
    };

    setResources([...resources, newResource]);
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources(resources.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };

      // Auto-update rate when role/region changes
      if (updates.role || updates.region) {
        const role = ROLE_PROFILES.find(rp => rp.id === updated.role);
        const region = REGIONS.find(rg => rg.code === updated.region);
        if (role && region) {
          updated.hourlyRate = role.baseRate * region.costIndex;
        }
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: animation.duration.normal }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <Heading2 className="text-white text-2xl">Resource Strategy</Heading2>
                  <BodySM className="text-blue-100 mt-1">{phase.name} | {phase.workingDays} days</BodySM>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Strategic Metrics Bar */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <MetricCard
                icon={<Users className="w-5 h-5" />}
                label="Team Size"
                value={metrics.teamSize.toString()}
                status={metrics.teamSize >= 3 ? 'good' : 'warning'}
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Phase Cost"
                value={`$${(metrics.totalCost / 1000).toFixed(0)}k`}
                status="neutral"
              />
              <MetricCard
                icon={<Award className="w-5 h-5" />}
                label="Quality Score"
                value={`${Math.min(100, metrics.qualityScore)}%`}
                status={metrics.qualityScore >= 90 ? 'good' : metrics.qualityScore >= 70 ? 'warning' : 'critical'}
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Critical Roles"
                value={`${metrics.criticalRoles}/${resources.length}`}
                status={metrics.hasArchitect && metrics.hasLead ? 'good' : 'warning'}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-start gap-3">
              {!metrics.hasArchitect && (
                <Alert type="warning" message="Consider adding a Solution Architect for technical governance" />
              )}
              {!metrics.hasLead && (
                <Alert type="warning" message="Project Lead recommended for stakeholder management" />
              )}
              {metrics.isOverAllocated && (
                <Alert type="critical" message="Team is over-allocated. Review allocations." />
              )}
              {metrics.qualityScore >= 90 && (
                <Alert type="success" message="Excellent team composition for this phase" />
              )}
            </div>
          </div>

          {/* Content - Two Columns */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="grid grid-cols-2 gap-8">
              {/* Left: Role Selector */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Team Members</h3>
                <div className="space-y-2">
                  {ROLE_PROFILES.map(role => (
                    <motion.button
                      key={role.id}
                      onClick={() => addResource(role.id)}
                      className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{role.icon}</span>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                              {role.name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{role.expertise}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                role.impact === 'critical' ? 'bg-red-100 text-red-700' :
                                role.impact === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {role.impact}
                              </span>
                              <span className="text-xs text-gray-500">${role.baseRate}/hr</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Right: Current Team */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Current Team ({resources.length})
                </h3>
                {resources.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No team members yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add roles from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map(resource => {
                      const role = ROLE_PROFILES.find(r => r.id === resource.role);
                      const cost = (phase.workingDays || 0) * 8 * (resource.allocation / 100) * resource.hourlyRate;

                      return (
                        <motion.div
                          key={resource.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{role?.icon}</span>
                              <div>
                                <input
                                  type="text"
                                  value={resource.name}
                                  onChange={e => updateResource(resource.id, { name: e.target.value })}
                                  className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors"
                                  placeholder="Name..."
                                />
                                <div className="text-xs text-gray-600 mt-1">{role?.name}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeResource(resource.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Region</label>
                              <select
                                value={resource.region}
                                onChange={e => updateResource(resource.id, { region: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                              >
                                {REGIONS.map(r => (
                                  <option key={r.code} value={r.code}>{r.flag} {r.code}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Allocation</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={resource.allocation}
                                  onChange={e => updateResource(resource.id, { allocation: parseInt(e.target.value) || 0 })}
                                  min="0"
                                  max="200"
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-gray-500">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Phase Cost</label>
                              <div className="px-2 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg">
                                ${(cost / 1000).toFixed(1)}k
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {resources.length} resources • ${(metrics.totalCost / 1000).toFixed(0)}k total cost
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                Save Team
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MetricCard({ icon, label, value, status }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical' | 'neutral';
}) {
  const colors = {
    good: 'bg-green-500/20 text-green-100',
    warning: 'bg-yellow-500/20 text-yellow-100',
    critical: 'bg-red-500/20 text-red-100',
    neutral: 'bg-white/20 text-white'
  };

  return (
    <div className={`rounded-lg p-3 ${colors[status]} backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs opacity-90">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Alert({ type, message }: { type: 'success' | 'warning' | 'critical'; message: string }) {
  const config = {
    success: { icon: <CheckCircle className="w-4 h-4" />, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    critical: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' }
  };

  const style = config[type];

  return (
    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border} ${style.text} text-sm`}>
      {style.icon}
      <span>{message}</span>
    </div>
  );
}
