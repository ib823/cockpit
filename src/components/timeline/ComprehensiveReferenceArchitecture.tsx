"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Globe,
  DollarSign,
  Target,
  Layers,
  Boxes,
  Workflow,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { useProjectContextStore } from "@/stores/project-context-store";
import { useWrappersStore } from "@/stores/wrappers-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { formatCurrency } from "@/lib/utils";

export function ComprehensiveReferenceArchitecture() {
  const [expandedSection, setExpandedSection] = useState<string | null>("business");

  const {
    businessContext,
    strategyDrivers,
    externalSystems,
    sapSupplements,
    getTotalIntegrationEffort,
    getTotalSupplementEffort,
    getCriticalDrivers,
  } = useProjectContextStore();

  const { getTotalWrapperEffort, wrappers } = useWrappersStore();
  const { phases, getProjectCost } = useTimelineStore();

  // Show message if no real project data
  const hasRealData = phases.length > 0 && businessContext.clientName !== "Example Corp";

  // Calculate efforts
  const coreModuleEffort = phases.reduce((sum, phase) => sum + (phase.workingDays || 0), 0);
  const wrapperEffort = getTotalWrapperEffort();
  const integrationEffort = getTotalIntegrationEffort();
  const supplementEffort = getTotalSupplementEffort();
  const totalEffort = coreModuleEffort + wrapperEffort + integrationEffort + supplementEffort;
  const totalCost = getProjectCost();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">SAP Implementation Reference Architecture</h2>
            <p className="text-blue-100 text-sm">
              {businessContext.clientName} - {businessContext.projectCode}
            </p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold">{totalEffort.toFixed(0)} PD</div>
            <div className="text-sm text-blue-100">Total Project Effort</div>
          </div>
        </div>
      </div>

      {/* Demo Data Warning */}
      {!hasRealData && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Info className="w-4 h-4" />
            <p>
              <strong>Demo Data:</strong> This reference shows example data. Generate a timeline
              from your requirements in Plan mode to see your actual project architecture.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Business Context */}
      <Section
        title="Business Context"
        icon={<Building2 className="w-5 h-5" />}
        isExpanded={expandedSection === "business"}
        onToggle={() => toggleSection("business")}
        badge={`${businessContext.numberOfUsers} users`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Users"
            value={businessContext.numberOfUsers.toLocaleString()}
            sublabel={`${businessContext.numberOfLegalEntities} legal entities`}
          />
          <MetricCard
            icon={<Globe className="w-5 h-5 text-green-600" />}
            label="Countries"
            value={businessContext.numberOfCountries.toString()}
            sublabel={`${businessContext.numberOfSites} sites`}
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5 text-purple-600" />}
            label="Revenue"
            value={`${(businessContext.annualRevenue / 1000000).toFixed(0)}M`}
            sublabel={`${businessContext.complexity} complexity`}
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5 text-orange-600" />}
            label="Go-Live"
            value={businessContext.goLiveQuarter}
            sublabel={`${businessContext.timelinePressure} timeline`}
          />
        </div>

        {/* Countries Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {businessContext.countries.map((country) => (
            <div key={country.code} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl mb-1">{getFlagEmoji(country.code)}</div>
              <div className="text-sm font-semibold text-gray-900">{country.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {country.users} users • {country.legalEntities} entities
              </div>
              {country.compliance.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">{country.compliance.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Section 2: Strategy & Drivers */}
      <Section
        title="Strategy & Drivers"
        icon={<Target className="w-5 h-5" />}
        isExpanded={expandedSection === "strategy"}
        onToggle={() => toggleSection("strategy")}
        badge={`${getCriticalDrivers().length} critical`}
      >
        <div className="space-y-4">
          {strategyDrivers.map((driver) => (
            <motion.div
              key={driver.id}
              className={`p-4 rounded-lg border-2 ${
                driver.priority === "critical"
                  ? "border-red-200 bg-red-50"
                  : driver.priority === "high"
                    ? "border-orange-200 bg-orange-50"
                    : "border-gray-200 bg-gray-50"
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(driver.category)}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {driver.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {driver.kpis.map((kpi, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-green-600">✓</span>
                        <span>{kpi}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    driver.priority === "critical"
                      ? "bg-red-100 text-red-700"
                      : driver.priority === "high"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {driver.priority.toUpperCase()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Section 3: IT Landscape */}
      <Section
        title="IT Landscape"
        icon={<Layers className="w-5 h-5" />}
        isExpanded={expandedSection === "landscape"}
        onToggle={() => toggleSection("landscape")}
        badge={`${phases.length} modules`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SAP Core Modules */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Boxes className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">SAP Core Modules</h4>
            </div>
            <div className="space-y-2">
              {phases.slice(0, 7).map((phase) => (
                <div key={phase.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{phase.name}</span>
                  <span className="font-semibold text-blue-600">
                    {phase.workingDays?.toFixed(0)} PD
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-blue-200">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Total Core</span>
                  <span>{coreModuleEffort.toFixed(0)} PD</span>
                </div>
              </div>
            </div>
          </div>

          {/* SAP Supplements */}
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">SAP Supplements</h4>
            </div>
            <div className="space-y-2">
              {sapSupplements.map((supp) => (
                <div key={supp.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{supp.name}</span>
                  <span className="font-semibold text-purple-600">{supp.effort} PD</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-purple-200">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span>Total Supplements</span>
                  <span>{supplementEffort.toFixed(0)} PD</span>
                </div>
              </div>
            </div>
          </div>

          {/* External Systems */}
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <Workflow className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">External Systems</h4>
            </div>
            <div className="space-y-2">
              {externalSystems.map((system) => {
                const systemEffort = system.interfaces.reduce(
                  (sum, iface) => sum + iface.estimatedEffort,
                  0
                );
                return (
                  <div key={system.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-gray-700">{system.name}</div>
                      <div className="text-xs text-gray-500">
                        {system.interfaces.length} interface
                        {system.interfaces.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">{systemEffort} PD</span>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-green-200">
                <div className="flex items-center justify-between font-bold text-green-900">
                  <span>Total Integration</span>
                  <span>{integrationEffort.toFixed(0)} PD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Details */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Integration Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {externalSystems.flatMap((system) =>
              system.interfaces.map((iface) => (
                <div
                  key={iface.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                >
                  <div>
                    <div className="font-medium text-gray-900">{iface.name}</div>
                    <div className="text-xs text-gray-500">
                      {iface.protocol} • {iface.frequency} • {iface.direction}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    {iface.estimatedEffort} PD
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Section>

      {/* Section 4: SAP Activate Phases */}
      <Section
        title="SAP Activate Methodology"
        icon={<Calendar className="w-5 h-5" />}
        isExpanded={expandedSection === "activate"}
        onToggle={() => toggleSection("activate")}
        badge="5 phases"
      >
        <div className="grid grid-cols-5 gap-4">
          {[
            {
              name: "Prepare",
              icon: "🎯",
              range: "5-10 PD",
              activities: ["Kickoff", "Planning", "Team Setup"],
            },
            {
              name: "Explore",
              icon: "🔍",
              range: "20-30 PD",
              activities: ["Fit-Gap", "Design", "Prototypes"],
            },
            {
              name: "Realize",
              icon: "⚙️",
              range: "60-80 PD",
              activities: ["Config", "Development", "Unit Test"],
            },
            {
              name: "Deploy",
              icon: "🚀",
              range: "15-25 PD",
              activities: ["Cutover", "Go-Live", "Training"],
            },
            {
              name: "Run",
              icon: "📈",
              range: "10-15 PD",
              activities: ["Hypercare", "Operations", "Support"],
            },
          ].map((phase, index) => (
            <motion.div
              key={phase.name}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
            >
              <div className="text-3xl mb-2">{phase.icon}</div>
              <div className="font-bold text-gray-900 mb-1">{phase.name}</div>
              <div className="text-xs text-gray-600 mb-2">{phase.range}</div>
              <div className="space-y-1">
                {phase.activities.map((activity, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    • {activity}
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${((index + 1) / 5) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Section 5: Wrappers */}
      <Section
        title="Wrappers (Continuous Activities)"
        icon={<Workflow className="w-5 h-5" />}
        isExpanded={expandedSection === "wrappers"}
        onToggle={() => toggleSection("wrappers")}
        badge={`${wrapperEffort.toFixed(0)} PD`}
      >
        <div className="space-y-2">
          {wrappers.map((wrapper) => {
            const wrapperPD = (coreModuleEffort * wrapper.currentPercentage) / 100;
            return (
              <div
                key={wrapper.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: wrapper.color }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{wrapper.name}</div>
                    <div className="text-xs text-gray-500">{wrapper.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{wrapperPD.toFixed(0)} PD</div>
                  <div className="text-xs text-gray-500">{wrapper.currentPercentage}% of core</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 text-white">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{coreModuleEffort.toFixed(0)}</div>
            <div className="text-xs text-gray-400">Core Modules (PD)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{wrapperEffort.toFixed(0)}</div>
            <div className="text-xs text-gray-400">Wrappers (PD)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{supplementEffort.toFixed(0)}</div>
            <div className="text-xs text-gray-400">Supplements (PD)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{integrationEffort.toFixed(0)}</div>
            <div className="text-xs text-gray-400">Integration (PD)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{totalEffort.toFixed(0)}</div>
            <div className="text-xs text-gray-400">TOTAL (PD)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{Math.ceil(totalEffort / 20)}</div>
            <div className="text-xs text-gray-400">Months (est.)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

function Section({ title, icon, isExpanded, onToggle, badge, children }: SectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <div className="text-gray-600">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
              {badge}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}

function MetricCard({ icon, label, value, sublabel }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sublabel && <div className="text-xs text-gray-500 mt-1">{sublabel}</div>}
    </div>
  );
}

// Helper functions
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    efficiency: "⚡",
    compliance: "📋",
    growth: "📈",
    modernization: "🔄",
  };
  return icons[category] || "🎯";
}
