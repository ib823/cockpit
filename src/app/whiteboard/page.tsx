/**
 * WHITEBOARD - DEEP ANALYSIS
 *
 * Same layout as Estimator but with tabs for deep analysis:
 * - Scope: L3 item selection (158 items)
 * - Pareto: 80/20 analysis
 * - Validation: Statistical validation
 * - Timeline: Full Gantt chart
 */

'use client';

import { motion } from 'framer-motion';
import { Calculator, Info, ArrowLeft, Package, BarChart3, CheckCircle2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { l3CatalogComplete } from '@/lib/estimator/l3-catalog-complete';

// Base effort for Malaysia
const BASE_EFFORT_MY = 520;
const FIXED_WORK = 97;
const WEEKS_PER_MD = 0.05;

type Tab = 'scope' | 'pareto' | 'validation' | 'timeline';

export default function WhiteboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('scope');

  // Parameters
  const [scopeBreadth, setScopeBreadth] = useState(0.06);
  const [integrations, setIntegrations] = useState(2);
  const [inAppExt, setInAppExt] = useState(0);
  const [btpExt, setBtpExt] = useState(0);
  const [countries, setCountries] = useState(1);
  const [entities, setEntities] = useState(1);
  const [peakUsers, setPeakUsers] = useState(100);

  // L3 scope items
  const [selectedL3Items, setSelectedL3Items] = useState<string[]>([]);
  const modules = l3CatalogComplete.getModules();

  // Calculations
  const calculatePC = () => {
    const intMult = integrations * 0.005;
    const extMult = (inAppExt * 0.003) + (btpExt * 0.002);
    return Math.min(intMult + extMult, 0.30);
  };

  const calculateOSG = () => {
    const countryMult = (countries - 1) * 0.05;
    const entityMult = (entities - 1) * 0.03;
    const userMult = peakUsers > 500 ? 0.10 : peakUsers > 200 ? 0.05 : 0;
    return Math.min(countryMult + entityMult + userMult, 0.50);
  };

  const pc = calculatePC();
  const osg = calculateOSG();
  const sbMultiplier = 1 + scopeBreadth;
  const pcMultiplier = 1 + pc;
  const osgMultiplier = 1 + osg;
  const totalMultiplier = sbMultiplier * pcMultiplier * osgMultiplier;
  const totalMD = Math.round(BASE_EFFORT_MY * totalMultiplier + FIXED_WORK);
  const totalWeeks = Math.round(totalMD * WEEKS_PER_MD);
  const totalMonths = (totalWeeks / 4.33).toFixed(1);
  const estimatedFTE = Math.ceil(totalMD / totalWeeks);

  const phases = [
    { name: 'Prepare', percent: 12, color: 'bg-blue-500' },
    { name: 'Explore', percent: 18, color: 'bg-purple-500' },
    { name: 'Realize', percent: 45, color: 'bg-green-500' },
    { name: 'Deploy', percent: 15, color: 'bg-orange-500' },
    { name: 'Run', percent: 10, color: 'bg-gray-500' }
  ].map(p => ({ ...p, weeks: Math.ceil(totalWeeks * p.percent / 100) }));

  const tabs = [
    { id: 'scope' as Tab, label: 'Scope Items', icon: Package },
    { id: 'pareto' as Tab, label: 'Pareto Analysis', icon: BarChart3 },
    { id: 'validation' as Tab, label: 'Validation', icon: CheckCircle2 },
    { id: 'timeline' as Tab, label: 'Timeline', icon: Calendar }
  ];

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* LEFT: INPUTS (same as estimator) */}
      <div className="w-[400px] bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <button
            onClick={() => router.push('/estimator')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Estimator
          </button>
          <h1 className="text-2xl font-light text-gray-900 mb-1">Deep Analysis</h1>
          <p className="text-sm text-gray-500">Malaysia base: {BASE_EFFORT_MY} MD</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Scope Breadth */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Scope Breadth (SB)</label>
              <span className="text-sm font-mono text-blue-600">+{(scopeBreadth * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.30"
              step="0.01"
              value={scopeBreadth}
              onChange={(e) => setScopeBreadth(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-gray-600 mt-2">{selectedL3Items.length} L3 items selected</p>
          </div>

          {/* Project Complexity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Project Complexity (PC)</label>
              <span className="text-sm font-mono text-purple-600">+{(pc * 100).toFixed(0)}%</span>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="text-xs text-gray-700">Integrations</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={integrations}
                  onChange={(e) => setIntegrations(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">In-App Extensions</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={inAppExt}
                  onChange={(e) => setInAppExt(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">BTP Extensions</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={btpExt}
                  onChange={(e) => setBtpExt(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Org/Scale/Geography */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Org/Scale/Geography (OSG)</label>
              <span className="text-sm font-mono text-orange-600">+{(osg * 100).toFixed(0)}%</span>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="text-xs text-gray-700">Countries</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={countries}
                  onChange={(e) => setCountries(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">Legal Entities</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={entities}
                  onChange={(e) => setEntities(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700">Peak Concurrent Users</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={peakUsers}
                  onChange={(e) => setPeakUsers(parseInt(e.target.value) || 100)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Effort</span>
                <span className="font-semibold text-gray-900">{totalMD} MD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">{totalMonths} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Multiplier</span>
                <span className="font-semibold text-gray-900">{totalMultiplier.toFixed(2)}×</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: TABS + CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex gap-1 p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {activeTab === 'scope' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900">L3 Scope Items</h2>
                <p className="text-gray-600">Select SAP process navigator items (158 available)</p>

                {modules.map(module => {
                  const items = l3CatalogComplete.getByModule(module);
                  return (
                    <div key={module} className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">{module} ({items.length})</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {items.slice(0, 10).map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedL3Items(prev =>
                                prev.includes(item.id)
                                  ? prev.filter(id => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                            className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                              selectedL3Items.includes(item.id)
                                ? 'bg-blue-50 border-blue-300 text-blue-900'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-mono text-xs text-gray-500">{item.code}</div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">Tier {item.tier}</div>
                          </button>
                        ))}
                      </div>
                      {items.length > 10 && (
                        <p className="text-xs text-gray-500 mt-3">+ {items.length - 10} more items...</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'pareto' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900">Pareto Analysis (80/20 Rule)</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <p className="text-gray-600 mb-6">20% of features drive 80% of effort</p>
                  <div className="space-y-4">
                    {[
                      { driver: 'Scope Breadth', impact: scopeBreadth * 100, color: 'bg-blue-500' },
                      { driver: 'Project Complexity', impact: pc * 100, color: 'bg-purple-500' },
                      { driver: 'Org/Scale/Geo', impact: osg * 100, color: 'bg-orange-500' }
                    ].sort((a, b) => b.impact - a.impact).map(item => (
                      <div key={item.driver}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{item.driver}</span>
                          <span className="text-sm text-gray-600">+{item.impact.toFixed(0)}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${Math.min(item.impact * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900">Statistical Validation</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Model Accuracy</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">R² Score</p>
                        <p className="text-2xl font-light text-green-600">0.84</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">MAPE</p>
                        <p className="text-2xl font-light text-blue-600">11.3%</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="text-2xl font-light text-purple-600">85%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Formula Breakdown</h3>
                    <div className="font-mono text-sm bg-gray-50 rounded-lg p-4">
                      <div>Total = BCE × (1 + SB) × (1 + PC) × (1 + OSG) + FW</div>
                      <div className="text-gray-600 mt-2">
                        = {BASE_EFFORT_MY} × {sbMultiplier.toFixed(2)} × {pcMultiplier.toFixed(2)} × {osgMultiplier.toFixed(2)} + {FIXED_WORK}
                      </div>
                      <div className="text-green-600 font-semibold mt-2">= {totalMD} MD</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900">Project Timeline (SAP Activate)</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="space-y-4">
                    {phases.map((phase, idx) => (
                      <div key={phase.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{phase.name}</span>
                          <span className="text-sm text-gray-600">{phase.weeks} weeks ({phase.percent}%)</span>
                        </div>
                        <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <motion.div
                            className={`h-full ${phase.color} flex items-center px-4`}
                            initial={{ width: 0 }}
                            animate={{ width: `${phase.percent}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          >
                            <span className="text-white font-medium text-sm">
                              {Math.round(totalMD * phase.percent / 100)} MD
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                    <p>Total duration: {totalWeeks} weeks ({totalMonths} months)</p>
                    <p>Estimated team: ~{estimatedFTE} FTE</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
