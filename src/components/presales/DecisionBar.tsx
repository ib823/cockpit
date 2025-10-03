"use client";
import { DecisionPill } from "@/components/ui/DecisionPill";
import { usePresalesStore } from "@/stores/presales-store";

interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  impact?: { cost: number; duration: number; risk: number };
}

const MODULE_COMBOS: DecisionOption[] = [
  { id: 'finance_only', label: 'Finance Only', impact: { cost: 0.8, duration: 0.9, risk: 0.7 } },
  { id: 'finance_hr', label: 'Finance + HR', impact: { cost: 1.3, duration: 1.2, risk: 0.8 } },
  { id: 'finance_scm', label: 'Finance + SCM', impact: { cost: 1.4, duration: 1.3, risk: 0.9 } },
  { id: 'full_suite', label: 'Full Suite', impact: { cost: 2.0, duration: 1.8, risk: 1.2 } }
];

const BANKING_PATHS: DecisionOption[] = [
  { id: 'manual', label: 'Manual Upload', impact: { cost: 0.9, duration: 0.8, risk: 0.6 } },
  { id: 'host_to_host', label: 'Host-to-Host', impact: { cost: 1.2, duration: 1.1, risk: 0.8 } },
  { id: 'multi_bank', label: 'Multi-Bank Connect', impact: { cost: 1.5, duration: 1.3, risk: 1.0 } }
];

export function DecisionBar() {
  const { decisions, setDecisions, chips, generateBaseline } = usePresalesStore();
  const completeness = (chips.length / 10) * 100; // Assuming 10 required chip types

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 card-shadow-lg animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Project Decisions</h3>
        <div className={`text-sm font-medium transition-colors ${
          completeness >= 80 ? 'text-green-600' : 'text-gray-600'
        }`}>
          {completeness >= 80 ? '✅' : '⚠️'} {completeness.toFixed(0)}% Complete
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DecisionPill
          label="Module Combo"
          value={decisions.moduleCombo}
          options={MODULE_COMBOS}
          onChange={(id) => setDecisions({...decisions, moduleCombo: id})}
        />
        <DecisionPill
          label="Banking Path"
          value={decisions.bankingPath}
          options={BANKING_PATHS}
          onChange={(id) => setDecisions({...decisions, bankingPath: id})}
        />
        <DecisionPill
          label="Rate Region"
          value={decisions.rateRegion}
          options={[
            { id: 'MY', label: 'Malaysia (MYR)' },
            { id: 'SG', label: 'Singapore (SGD)' },
            { id: 'VN', label: 'Vietnam (VND)' }
          ]}
          onChange={(id) => setDecisions({...decisions, rateRegion: id})}
        />
        <DecisionPill
          label="SSO Mode"
          value={decisions.ssoMode}
          options={[
            { id: 'day_one', label: 'Day One SSO' },
            { id: 'staged', label: 'Staged Rollout' }
          ]}
          onChange={(id) => setDecisions({...decisions, ssoMode: id})}
        />
      </div>

      {completeness >= 80 && (
        <button
          onClick={() => generateBaseline()}
          className="mt-4 gradient-blue text-white px-4 py-2 rounded-lg hover-lift shadow-md animate-fade-in"
        >
          Generate Baseline Plan
        </button>
      )}
    </div>
  );
}