/**
 * ESTIMATOR - PROPER FORMULA IMPLEMENTATION
 *
 * Formula: Total MD = BCE × (1 + SB) × (1 + PC) × (1 + OSG) + FW
 *
 * Where:
 * - BCE: Base Core Effort (from profile preset)
 * - SB: Scope Breadth (L3 items + integrations + extra modules)
 * - PC: Process Complexity (in-app/BTP extensions)
 * - OSG: Org Scale & Geography (countries/entities/languages/sessions)
 * - FW: Factory Wrapper (97 MD base, scales with scope)
 */

'use client';

import { motion } from 'framer-motion';
import { Calculator, Info, Package, ArrowRight, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { formulaEngine, PROFILE_PRESETS, type EstimatorInputs } from '@/lib/estimator/formula-engine';
import { l3CatalogComplete } from '@/lib/estimator/l3-catalog-complete';
import type { L3Item } from '@/lib/estimator/formula-engine';
import { convertEstimateToChips, generateProjectName, extractEstimateMetadata } from '@/lib/estimator/to-chips-converter';
import { usePresalesStore } from '@/stores/presales-store';

export default function EstimatorPage() {
  const router = useRouter();
  const { addChips } = usePresalesStore();

  // Profile selection
  const [profileIndex, setProfileIndex] = useState(1); // Singapore Mid-Market default
  const profile = PROFILE_PRESETS[profileIndex];

  // Scope Breadth (SB) inputs
  const [selectedL3Items, setSelectedL3Items] = useState<L3Item[]>([]);
  const [integrations, setIntegrations] = useState(2);
  const [showL3Modal, setShowL3Modal] = useState(false);

  // Process Complexity (PC) inputs
  const [inAppExt, setInAppExt] = useState(0);
  const [btpExt, setBtpExt] = useState(0);

  // Org Scale & Geography (OSG) inputs
  const [countries, setCountries] = useState(1);
  const [entities, setEntities] = useState(1);
  const [languages, setLanguages] = useState(1);
  const [peakSessions, setPeakSessions] = useState(100);

  // Calculate estimate using real formula engine
  const estimate = useMemo(() => {
    const inputs: EstimatorInputs = {
      profile,
      modules: profile.modules,
      l3Items: selectedL3Items,
      integrations,
      inAppExtensions: inAppExt,
      btpExtensions: btpExt,
      countries,
      entities,
      languages,
      peakSessions
    };
    return formulaEngine.calculateTotal(inputs);
  }, [profile, selectedL3Items, integrations, inAppExt, btpExt, countries, entities, languages, peakSessions]);

  // Timeline phases (SAP Activate)
  const phases = [
    { name: 'Prepare', percent: 12, color: 'bg-blue-500' },
    { name: 'Explore', percent: 18, color: 'bg-purple-500' },
    { name: 'Realize', percent: 45, color: 'bg-green-500' },
    { name: 'Deploy', percent: 15, color: 'bg-orange-500' },
    { name: 'Run', percent: 10, color: 'bg-gray-500' }
  ].map(p => ({ ...p, weeks: Math.ceil(estimate.duration.weeks * p.percent / 100) }));

  // Handler: Build Full Plan (Bridge to Project)
  const handleBuildFullPlan = () => {
    const inputs: EstimatorInputs = {
      profile,
      modules: profile.modules,
      l3Items: selectedL3Items,
      integrations,
      inAppExtensions: inAppExt,
      btpExtensions: btpExt,
      countries,
      entities,
      languages,
      peakSessions
    };

    // Convert to chips
    const chips = convertEstimateToChips(inputs);

    // Add to presales store
    addChips(chips);

    // Navigate to project with source flag
    const projectName = generateProjectName(inputs);
    const encodedName = encodeURIComponent(projectName);
    router.push(`/project?mode=plan&source=estimator&name=${encodedName}`);
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* LEFT: INPUTS */}
      <div className="w-[420px] bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h1 className="text-2xl font-light text-gray-900 mb-1">SAP Estimator</h1>
          <p className="text-sm text-gray-500">Formula-driven effort estimation</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Base Profile</label>
            <div className="space-y-2">
              {PROFILE_PRESETS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setProfileIndex(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    profileIndex === idx
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{p.bce} MD base • {p.modules.join(', ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Breadth (SB) */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Scope Breadth (SB)</label>
              <span className="text-sm font-mono text-blue-600">
                {((estimate.sbMultiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>

            {/* L3 Items */}
            <div className="mb-4">
              <button
                onClick={() => setShowL3Modal(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedL3Items.length} L3 Items Selected
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>
              {selectedL3Items.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedL3Items.slice(0, 5).map(item => (
                    <span key={item.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                      {item.code}
                    </span>
                  ))}
                  {selectedL3Items.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{selectedL3Items.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Integrations */}
            <div>
              <label className="text-xs text-gray-700 mb-2 block">Integrations (+3% each)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={integrations}
                onChange={(e) => setIntegrations(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Process Complexity (PC) */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Process Complexity (PC)</label>
              <span className="text-sm font-mono text-purple-600">
                {((estimate.pcMultiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-700 mb-2 block">In-App Extensions (+1% each)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={inAppExt}
                  onChange={(e) => setInAppExt(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 mb-2 block">BTP Extensions (+5% each)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={btpExt}
                  onChange={(e) => setBtpExt(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Org Scale & Geography (OSG) */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900">Org/Scale/Geography (OSG)</label>
              <span className="text-sm font-mono text-orange-600">
                {((estimate.osgMultiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 mb-2 block">Countries</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={countries}
                  onChange={(e) => setCountries(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 mb-2 block">Entities</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={entities}
                  onChange={(e) => setEntities(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 mb-2 block">Languages</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={languages}
                  onChange={(e) => setLanguages(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 mb-2 block">Peak Users</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={peakSessions}
                  onChange={(e) => setPeakSessions(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <button
              onClick={handleBuildFullPlan}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Rocket className="w-4 h-4" />
              Build Full Plan
            </button>
            <button
              onClick={() => router.push('/whiteboard')}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              Deep Analysis →
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: RESULTS */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 space-y-6">
          {/* Hero Number */}
          <motion.div
            className="bg-white rounded-2xl p-10 shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Estimated Project Duration</p>
              <motion.div
                key={estimate.totalEffort}
                className="text-7xl font-extralight text-gray-900"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              >
                {estimate.duration.months}
              </motion.div>
              <p className="text-xl text-gray-400 font-light mb-6">months</p>

              <div className="flex justify-center gap-8 text-sm">
                <div>
                  <p className="text-gray-500">Total Effort</p>
                  <p className="text-xl font-light text-gray-900">{estimate.totalEffort} MD</p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="text-xl font-light text-gray-900">{estimate.duration.weeks} weeks</p>
                </div>
                <div>
                  <p className="text-gray-500">Team Size</p>
                  <p className="text-xl font-light text-gray-900">~{estimate.fte} FTE</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="text-xl font-light text-green-600">{estimate.confidence}%</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formula Breakdown */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="font-medium text-gray-900">Formula Breakdown</h2>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                <span className="text-gray-600">BCE (Base Core Effort)</span>
                <span className="text-blue-600 font-semibold">{estimate.bce} MD</span>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-200 space-y-2">
                <div className="text-gray-700 text-xs mb-2">Multipliers:</div>
                <div className="flex justify-between text-xs pl-2">
                  <span className="text-gray-600">× (1 + SB) Scope Breadth</span>
                  <span className="text-blue-600">{estimate.sbMultiplier.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-xs pl-2">
                  <span className="text-gray-600">× (1 + PC) Process Complexity</span>
                  <span className="text-purple-600">{estimate.pcMultiplier.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-xs pl-2">
                  <span className="text-gray-600">× (1 + OSG) Org/Scale/Geo</span>
                  <span className="text-orange-600">{estimate.osgMultiplier.toFixed(3)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-700">Core Effort</span>
                  <span className="text-purple-600 font-semibold">{estimate.coreEffort} MD</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                <span className="text-gray-600">+ FW (Factory Wrapper)</span>
                <span className="text-green-600 font-semibold">{estimate.fw} MD</span>
              </div>

              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 text-white">
                <span className="font-semibold">Total Effort</span>
                <span className="font-bold text-lg">{estimate.totalEffort} MD</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="font-medium text-gray-900 mb-4">Project Timeline (SAP Activate)</h2>
            <div className="space-y-3">
              {phases.map((phase, idx) => (
                <div key={phase.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{phase.name}</span>
                    <span className="text-sm text-gray-500">{phase.weeks}w ({phase.percent}%)</span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      className={`h-full ${phase.color} flex items-center px-3`}
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.percent}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                    >
                      <span className="text-white text-xs font-medium">
                        {Math.round(estimate.totalEffort * phase.percent / 100)} MD
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <p>{estimate.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* L3 Selector Modal */}
      {showL3Modal && (
        <L3SelectorModal
          selectedItems={selectedL3Items}
          onSelect={setSelectedL3Items}
          onClose={() => setShowL3Modal(false)}
        />
      )}
    </div>
  );
}

// Industry presets for L3 selector
const INDUSTRY_PRESETS = {
  manufacturing: {
    name: 'Manufacturing',
    codes: ['PP-001', 'QM-001', 'MM-001', 'PM-001', 'SD-001'],
  },
  retail: {
    name: 'Retail & Distribution',
    codes: ['SD-001', 'SD-002', 'MM-002', 'WM-001', 'LE-001'],
  },
  finance: {
    name: 'Financial Services',
    codes: ['FI-001', 'CO-001', 'TR-001', 'RE-001', 'BPC-001'],
  },
  utilities: {
    name: 'Utilities',
    codes: ['IS-U-001', 'PM-002', 'CS-001', 'SD-003'],
  },
} as const;

// L3 Item Selector Modal
function L3SelectorModal({
  selectedItems,
  onSelect,
  onClose
}: {
  selectedItems: L3Item[];
  onSelect: (items: L3Item[]) => void;
  onClose: () => void;
}) {
  const [localSelected, setLocalSelected] = useState(selectedItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'A' | 'B' | 'C' | null>(null);

  const modules = l3CatalogComplete.getModules();

  const toggleItem = (item: L3Item) => {
    setLocalSelected(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  // Apply industry preset
  const applyPreset = (presetKey: keyof typeof INDUSTRY_PRESETS) => {
    const preset = INDUSTRY_PRESETS[presetKey];
    const allItems = modules.flatMap(m => l3CatalogComplete.getByModule(m));
    const presetItems = allItems.filter(item => preset.codes.includes(item.code));

    // Add preset items that aren't already selected
    const newItems = presetItems.filter(
      item => !localSelected.find(s => s.id === item.id)
    );

    if (newItems.length > 0) {
      setLocalSelected(prev => [...prev, ...newItems]);
    }
  };

  // Filter modules and items
  const filteredModules = modules.map(module => ({
    module,
    items: l3CatalogComplete.getByModule(module).filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = tierFilter === null || item.tier === tierFilter;

      return matchesSearch && matchesTier;
    })
  })).filter(m => m.items.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Select L3 Scope Items</h2>
              <p className="text-sm text-gray-500 mt-1">{localSelected.length} items selected</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search L3 items by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTierFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tierFilter === null
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Tiers
            </button>
            {(['A', 'B', 'C'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tierFilter === tier
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>

          {/* Industry Presets */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Quick Select by Industry:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as keyof typeof INDUSTRY_PRESETS)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items match your search criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTierFilter(null);
                }}
                className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredModules.map(({ module, items }) => (
              <div key={module}>
                <h3 className="font-semibold text-gray-900 mb-3">{module} ({items.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map(item => {
                    const isSelected = localSelected.find(i => i.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        title={item.description || item.name}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-mono text-xs text-gray-500">{item.code}</div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">Tier {item.tier} ({item.coefficient})</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setLocalSelected([])}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(localSelected);
                onClose();
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
