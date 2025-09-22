"use client";

import { usePresalesStore } from "@/stores/presales-store";

const MODULE_COMBOS = [
  { id: "FinanceOnly", label: "Finance Only", modules: ["FI", "CO"], effort: 180 },
  { id: "FinanceHR", label: "Finance + HR", modules: ["FI", "CO", "HR"], effort: 280 },
  { id: "FullSuite", label: "Full Suite", modules: ["FI", "CO", "HR", "MM", "SD"], effort: 450 },
];

const BANKING_PATHS = [
  { id: "manual", label: "Manual Uploads", effort: 0 },
  { id: "hostToHost", label: "Host-to-Host", effort: 15 },
  { id: "mbc", label: "Multi-Bank Connect", effort: 30 },
];

const RATE_REGIONS = [
  { id: "MY", label: "Malaysia", currency: "MYR" },
  { id: "SG", label: "Singapore", currency: "SGD" },
  { id: "VN", label: "Vietnam", currency: "VND" },
];

export default function DecisionBar() {
  const { decisions, updateDecision } = usePresalesStore();

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Module Combo */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Modules:</span>
          <select
            value={decisions.moduleCombo || ""}
            onChange={(e) => updateDecision("moduleCombo", e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose combo...</option>
            {MODULE_COMBOS.map((combo) => (
              <option key={combo.id} value={combo.id}>
                {combo.label} ({combo.effort}d)
              </option>
            ))}
          </select>
        </div>

        {/* Banking Path */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Banking:</span>
          <select
            value={decisions.bankingPath || "manual"}
            onChange={(e) => updateDecision("bankingPath", e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BANKING_PATHS.map((path) => (
              <option key={path.id} value={path.id}>
                {path.label} {path.effort > 0 && `(+${path.effort}d)`}
              </option>
            ))}
          </select>
        </div>

        {/* Rate Region */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Region:</span>
          <select
            value={decisions.rateRegion || "MY"}
            onChange={(e) => updateDecision("rateRegion", e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RATE_REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label} ({region.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Auto-Transit Indicator */}
        <div className="ml-auto flex items-center gap-2">
          {decisions.moduleCombo && decisions.bankingPath && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Ready for planning
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
