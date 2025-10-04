# SAP Implementation Intelligence Platform (SIIP) - Complete Development Documentation

## Executive Summary

This document provides the complete technical specification and development roadmap for transforming the SIIP HTML mockup into a production-ready platform. The platform combines presales intelligence with delivery planning, serving as a unified tool for SAP implementation teams.

## Architecture Overview

### System Components

```mermaid
graph TB
    A[SIIP Platform] --> B[Presales Engine]
    A --> C[Timeline Configurator]
    A --> D[Intelligence Engine]

    B --> B1[Chip Extraction]
    B --> B2[Decision Cards]
    B --> B3[Scenario Generation]

    C --> C1[Planning Canvas]
    C --> C2[Resource Allocation]
    C --> C3[Gantt Visualization]

    D --> D1[Pattern Recognition]
    D --> D2[Effort Prediction]
    D --> D3[Risk Assessment]
```

### Technology Stack

**Frontend:**

- Next.js 14 (App Router)
- TypeScript 5.3+
- Tailwind CSS 3.4+
- Framer Motion (animations)
- React Query (state management)
- Zustand (global state)

**Backend:**

- Next.js API Routes
- Prisma (ORM)
- PostgreSQL (database)
- Redis (caching)

**Infrastructure:**

- Vercel (deployment)
- Supabase (database hosting)
- Upstash (Redis hosting)

## Detailed Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Project Setup

```bash
# Initialize Next.js project
npx create-next-app@latest siip --typescript --tailwind --app
cd siip

# Install core dependencies
pnpm add @prisma/client prisma
pnpm add zustand @tanstack/react-query
pnpm add framer-motion lucide-react
pnpm add react-hook-form @hookform/resolvers zod
pnpm add @radix-ui/react-dialog @radix-ui/react-select
pnpm add recharts react-window react-virtualized-auto-sizer

# Install dev dependencies
pnpm add -D @types/node typescript eslint prettier
pnpm add -D husky lint-staged @typescript-eslint/parser
```

#### Week 2: Core Architecture

```typescript
// src/types/siip.ts - Core Type System
export interface Chip {
  id: string;
  type: ChipType;
  value: string;
  confidence: number;
  source: "paste" | "upload" | "voice" | "manual";
  evidence?: {
    snippet: string;
    context: string;
    location: string;
  };
  validated: boolean;
  validatedBy?: string;
  timestamp: Date;
}

export type ChipType =
  | "country"
  | "entity"
  | "users"
  | "budget"
  | "start"
  | "golive"
  | "bank"
  | "bank_fmt"
  | "eInvoice"
  | "idp"
  | "integration"
  | "forms"
  | "fricew_target"
  | "module_combo"
  | "fx"
  | "rate_region";

export interface Decision {
  id: string;
  type: DecisionType;
  options: DecisionOption[];
  selected: string;
  rationale: string;
  impact: ImpactAnalysis;
  timestamp: Date;
}

export type DecisionType =
  | "module_combo"
  | "banking_path"
  | "integration_posture"
  | "sso_mode"
  | "fricew_target"
  | "rate_region"
  | "pricing_target";

export interface ScenarioPlan {
  id: string;
  name: string;
  moduleCombo: ModuleCombo;
  rateCard: RateCard;
  phases: PhaseConfig;
  plan: EffortAllocation[];
  overlaysApplied: string[];
  guardrails: GuardrailCheck;
  assumptions: string[];
  totals: ProjectTotals;
}
```

### Phase 2: Chip System (Weeks 3-4)

#### Chip Extraction Engine

```typescript
// src/lib/chip-extractor.ts
export class ChipExtractor {
  private patterns: Map<ChipType, RegExp> = new Map([
    ["country", /(Malaysia|Singapore|Vietnam|Thailand)/gi],
    ["employees", /(\d+)\s+employees?/gi],
    ["revenue", /(MYR|SGD|USD)\s*([\d,.]+)\s*(million|M)/gi],
    ["modules", /(Finance|HR|HCM|Supply Chain|SCM)/gi],
    ["timeline", /(Q[1-4]\s+\d{4})/gi],
    ["integration", /(Salesforce|Oracle|Microsoft|Azure)/gi],
    ["compliance", /(e-invoice|MyInvois|LHDN)/gi],
    ["banking", /(Host-to-Host|banking)/gi],
    ["sso", /(SSO|Azure AD|ADFS)/gi],
  ]);

  extract(text: string): Chip[] {
    const chips: Chip[] = [];

    for (const [type, pattern] of this.patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          chips.push({
            id: generateId(),
            type,
            value: match.trim(),
            confidence: this.calculateConfidence(type, match, text),
            source: "paste",
            validated: false,
            timestamp: new Date(),
          });
        });
      }
    }

    return this.deduplicateChips(chips);
  }

  private calculateConfidence(type: ChipType, match: string, context: string): number {
    // Implementation of confidence scoring algorithm
    const baseConfidence = 0.8;
    const contextBonus = this.analyzeContext(match, context);
    return Math.min(baseConfidence + contextBonus, 1.0);
  }

  private analyzeContext(match: string, context: string): number {
    // Context analysis for confidence boost
    return 0.1;
  }

  private deduplicateChips(chips: Chip[]): Chip[] {
    // Remove duplicate chips based on type and normalized value
    const seen = new Set<string>();
    return chips.filter((chip) => {
      const key = `${chip.type}:${chip.value.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

#### Chip Management Components

```typescript
// src/components/chips/chip-display.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Chip, ChipType } from '@/types/siip';

interface ChipDisplayProps {
  chips: Chip[];
  onValidate?: (chipId: string, isValid: boolean) => void;
  onEdit?: (chipId: string, newValue: string) => void;
  readonly?: boolean;
}

export const ChipDisplay: React.FC<ChipDisplayProps> = ({
  chips, onValidate, onEdit, readonly = false
}) => {
  const chipTypeColors: Record<ChipType, string> = {
    country: 'bg-blue-500',
    employees: 'bg-green-500',
    revenue: 'bg-purple-500',
    modules: 'bg-orange-500',
    timeline: 'bg-red-500',
    integration: 'bg-yellow-500',
    compliance: 'bg-indigo-500',
    banking: 'bg-pink-500',
    sso: 'bg-gray-500'
    // ... rest of chip types
  };

  return (
    <div className="flex flex-wrap gap-3">
      <AnimatePresence>
        {chips.map(chip => (
          <motion.div
            key={chip.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-2 h-2 rounded-full ${chipTypeColors[chip.type]}`} />
            <span className="text-xs uppercase font-medium text-gray-500">
              {chip.type}
            </span>
            <span className="font-medium">{chip.value}</span>
            <span className="text-xs text-green-600 font-medium">
              {Math.round(chip.confidence * 100)}%
            </span>
            {!readonly && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onValidate?.(chip.id, true)}
                  className="text-green-500 hover:bg-green-50 p-1 rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => onValidate?.(chip.id, false)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
```

### Phase 3: Decision Engine (Weeks 5-6)

#### Decision Card System

```typescript
// src/components/decisions/decision-cards.tsx
export const DecisionCards: React.FC = () => {
  const [decisions, setDecisions] = useDecisionStore(state => [
    state.decisions,
    state.setDecision
  ]);

  const decisionConfigs: DecisionConfig[] = [
    {
      type: 'module_combo',
      title: 'Module Combination',
      description: 'Select your core SAP modules and integration scope',
      options: [
        {
          id: 'finance_p2p_otc',
          title: 'Finance + P2P + OTC',
          description: 'Complete order-to-cash and procure-to-pay',
          impact: { effort: 1.0, cost: 1.0, risk: 0.8, timeline: 1.0 }
        },
        {
          id: 'finance_hcm',
          title: 'Finance + HCM Core',
          description: 'Financial management with HR',
          impact: { effort: 0.8, cost: 0.8, risk: 0.6, timeline: 0.9 }
        },
        {
          id: 'finance_only',
          title: 'Finance Only',
          description: 'Financial accounting and controlling',
          impact: { effort: 0.6, cost: 0.6, risk: 0.4, timeline: 0.7 }
        }
      ]
    },
    {
      type: 'banking_path',
      title: 'Banking Integration',
      description: 'Choose your banking connectivity approach',
      options: [
        {
          id: 'host_to_host',
          title: 'Host-to-Host',
          description: 'Direct integration with bank APIs',
          impact: { effort: 1.2, cost: 1.1, risk: 0.9, timeline: 1.1 }
        },
        {
          id: 'sap_mbc',
          title: 'SAP Multi-Bank Connectivity',
          description: 'SAP\'s standard banking solution',
          impact: { effort: 1.0, cost: 1.0, risk: 0.7, timeline: 1.0 }
        },
        {
          id: 'manual_upload',
          title: 'Manual Upload',
          description: 'File-based bank statement processing',
          impact: { effort: 0.7, cost: 0.7, risk: 0.5, timeline: 0.8 }
        }
      ]
    }
    // ... more decision configurations
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decisionConfigs.map(config => (
        <DecisionCard
          key={config.type}
          config={config}
          selected={decisions[config.type]}
          onSelect={(optionId) => setDecision(config.type, optionId)}
        />
      ))}
    </div>
  );
};
```

### Phase 4: Planning Canvas (Weeks 7-8)

#### Effort Allocation Grid

```typescript
// src/components/planning/effort-grid.tsx
export const EffortGrid: React.FC = () => {
  const [effortData, updateEffort] = useEffortStore(state => [
    state.effortData,
    state.updateEffort
  ]);

  const streams = [
    'Finance', 'Procurement', 'Integration', 'Data Migration',
    'Testing', 'Change Management', 'Project Management'
  ];

  const phases = ['Prepare', 'Explore', 'Realize', 'Deploy', 'Run'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[200px_repeat(5,1fr)_120px] bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600 uppercase tracking-wider">
        <div className="p-4">Stream</div>
        {phases.map(phase => (
          <div key={phase} className="p-4 border-l border-gray-200">{phase}</div>
        ))}
        <div className="p-4 border-l border-gray-200">Total PD</div>
      </div>

      {streams.map(stream => (
        <EffortRow
          key={stream}
          stream={stream}
          phases={phases}
          effortData={effortData[stream] || {}}
          onUpdate={(phase, value) => updateEffort(stream, phase, value)}
        />
      ))}
    </div>
  );
};

const EffortRow: React.FC<{
  stream: string;
  phases: string[];
  effortData: Record<string, number>;
  onUpdate: (phase: string, value: number) => void;
}> = ({ stream, phases, effortData, onUpdate }) => {
  const total = phases.reduce((sum, phase) => sum + (effortData[phase] || 0), 0);

  return (
    <div className="grid grid-cols-[200px_repeat(5,1fr)_120px] border-b border-gray-100 hover:bg-gray-50">
      <div className="p-4 font-medium bg-gray-50 border-r border-gray-200">
        {stream}
      </div>
      {phases.map(phase => (
        <div key={phase} className="p-2 border-r border-gray-200 flex items-center justify-center">
          <input
            type="number"
            value={effortData[phase] || 0}
            onChange={(e) => onUpdate(phase, parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>
      ))}
      <div className="p-4 font-semibold text-blue-600 text-center border-l border-gray-200">
        {total}
      </div>
    </div>
  );
};
```

#### Speed Grammar Parser

```typescript
// src/lib/speed-grammar.ts
export class SpeedGrammarParser {
  private commands: Map<string, CommandHandler> = new Map([
    ["price", this.handlePriceCommand],
    ["margin", this.handleMarginCommand],
    ["reduce", this.handleReduceCommand],
    ["shift", this.handleShiftCommand],
    ["overlay", this.handleOverlayCommand],
  ]);

  parse(input: string): Command | null {
    // Handle effort allocation: "8d @SC(FI)"
    const effortMatch = input.match(/^(\d+)([dw])\s+@(\w+)\((\w+)\)(?:\s+@([\d.]+)FTE)?$/);
    if (effortMatch) {
      return {
        type: "effort",
        duration: parseInt(effortMatch[1]),
        unit: effortMatch[2] as "d" | "w",
        role: effortMatch[3],
        stream: effortMatch[4],
        fte: effortMatch[5] ? parseFloat(effortMatch[5]) : 1.0,
      };
    }

    // Handle commands: "/price 650000 lock"
    const commandMatch = input.match(/^\/(\w+)\s+(.+)$/);
    if (commandMatch) {
      const [, command, args] = commandMatch;
      const handler = this.commands.get(command);
      if (handler) {
        return handler.call(this, args);
      }
    }

    // Handle templates: "+template:Explore(Finance, Medium)"
    const templateMatch = input.match(/^\+template:(\w+)\(([^)]+)\)$/);
    if (templateMatch) {
      return {
        type: "template",
        phase: templateMatch[1],
        parameters: templateMatch[2].split(",").map((p) => p.trim()),
      };
    }

    return null;
  }

  private handlePriceCommand(args: string): Command {
    const match = args.match(/^(\d+)\s+(lock|unlock)?$/);
    return {
      type: "price",
      value: parseInt(match?.[1] || "0"),
      lock: match?.[2] === "lock",
    };
  }

  private handleMarginCommand(args: string): Command {
    const match = args.match(/^(\d+)\s+(lock|unlock)?$/);
    return {
      type: "margin",
      value: parseInt(match?.[1] || "0"),
      lock: match?.[2] === "lock",
    };
  }

  private handleReduceCommand(args: string): Command {
    const match = args.match(/^(\w+)\s+(\d+)\s+keep:([\w,]+)$/);
    return {
      type: "reduce",
      phase: match?.[1] || "",
      percentage: parseInt(match?.[2] || "0"),
      keep: match?.[3]?.split(",") || [],
    };
  }
}
```

### Phase 5: Timeline Visualization (Weeks 9-10)

#### Gantt Chart Component

```typescript
// src/components/timeline/gantt-chart.tsx
import { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface GanttChartProps {
  phases: Phase[];
  startDate: Date;
  endDate: Date;
  onPhaseUpdate?: (phaseId: string, updates: Partial<Phase>) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  phases, startDate, endDate, onPhaseUpdate
}) => {
  const timelineData = useMemo(() => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return phases.map(phase => {
      const phaseStartDays = Math.ceil((phase.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const phaseDuration = Math.ceil((phase.endDate.getTime() - phase.startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...phase,
        leftPosition: (phaseStartDays / totalDays) * 100,
        width: (phaseDuration / totalDays) * 100
      };
    });
  }, [phases, startDate, endDate]);

  const handlePhaseDrag = useCallback((phaseId: string, newLeftPosition: number) => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDays = (newLeftPosition / 100) * totalDays;
    const newStartDate = new Date(startDate.getTime() + newStartDays * 24 * 60 * 60 * 1000);

    onPhaseUpdate?.(phaseId, { startDate: newStartDate });
  }, [startDate, endDate, onPhaseUpdate]);

  const renderPhase = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const phase = timelineData[index];

    return (
      <div style={style} className="flex items-center px-4 border-b border-gray-100">
        <div className="w-48 font-medium text-sm">
          {phase.name}
        </div>
        <div className="flex-1 relative h-8">
          <GanttBar
            phase={phase}
            onDrag={(newPosition) => handlePhaseDrag(phase.id, newPosition)}
          />
        </div>
        <div className="w-24 text-sm text-gray-600 text-center">
          {phase.effort} PD
        </div>
      </div>
    );
  }, [timelineData, handlePhaseDrag]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-48 text-sm font-medium text-gray-600">Phase</div>
          <div className="flex-1 text-sm font-medium text-gray-600">Timeline</div>
          <div className="w-24 text-sm font-medium text-gray-600 text-center">Effort</div>
        </div>
      </div>

      <List
        height={400}
        itemCount={timelineData.length}
        itemSize={50}
        itemData={timelineData}
      >
        {renderPhase}
      </List>
    </div>
  );
};

const GanttBar: React.FC<{
  phase: TimelinePhase;
  onDrag: (newPosition: number) => void;
}> = ({ phase, onDrag }) => {
  return (
    <div
      className="absolute top-1 h-6 rounded cursor-move transition-all duration-200 hover:shadow-md"
      style={{
        left: `${phase.leftPosition}%`,
        width: `${phase.width}%`,
        background: phase.color || '#3B82F6'
      }}
      draggable
      onDragEnd={(e) => {
        // Calculate new position and call onDrag
        const rect = e.currentTarget.parentElement!.getBoundingClientRect();
        const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
        onDrag(Math.max(0, Math.min(100, newPosition)));
      }}
    >
      <div className="px-2 py-1 text-xs font-medium text-white truncate">
        {phase.name}
      </div>
    </div>
  );
};
```

### Phase 6: State Management (Week 11)

#### Zustand Store Architecture

```typescript
// src/store/siip-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chip, Decision, ScenarioPlan, EffortData } from "@/types/siip";

interface SIIPStore {
  // Current state
  currentScenario: "A" | "B" | "C";
  currentStage: number;

  // Data
  chips: Chip[];
  decisions: Record<string, Decision>;
  scenarios: Record<"A" | "B" | "C", ScenarioPlan>;
  effortData: EffortData;

  // Actions
  setCurrentScenario: (scenario: "A" | "B" | "C") => void;
  setCurrentStage: (stage: number) => void;

  // Chip management
  addChips: (chips: Chip[]) => void;
  updateChip: (chipId: string, updates: Partial<Chip>) => void;
  validateChip: (chipId: string, isValid: boolean) => void;

  // Decision management
  setDecision: (type: string, optionId: string) => void;

  // Effort management
  updateEffort: (stream: string, phase: string, value: number) => void;
  applySpeedGrammar: (command: string) => void;

  // Scenario management
  generateScenarios: () => void;
  cloneScenario: (from: "A" | "B" | "C", to: "A" | "B" | "C") => void;

  // Calculations
  calculateTotals: () => ProjectTotals;
  validateGuardrails: () => GuardrailResult;
}

export const useSIIPStore = create<SIIPStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentScenario: "A",
      currentStage: 0,
      chips: [],
      decisions: {},
      scenarios: {
        A: createEmptyScenario("Aggressive"),
        B: createEmptyScenario("Balanced"),
        C: createEmptyScenario("Conservative"),
      },
      effortData: {},

      // Actions
      setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
      setCurrentStage: (stage) => set({ currentStage: stage }),

      addChips: (newChips) =>
        set((state) => ({
          chips: [...state.chips, ...newChips],
        })),

      updateChip: (chipId, updates) =>
        set((state) => ({
          chips: state.chips.map((chip) => (chip.id === chipId ? { ...chip, ...updates } : chip)),
        })),

      validateChip: (chipId, isValid) =>
        set((state) => ({
          chips: state.chips.map((chip) =>
            chip.id === chipId ? { ...chip, validated: isValid } : chip
          ),
        })),

      setDecision: (type, optionId) =>
        set((state) => ({
          decisions: {
            ...state.decisions,
            [type]: {
              id: generateId(),
              type,
              selected: optionId,
              timestamp: new Date(),
              // ... other decision properties
            },
          },
        })),

      updateEffort: (stream, phase, value) =>
        set((state) => ({
          effortData: {
            ...state.effortData,
            [stream]: {
              ...state.effortData[stream],
              [phase]: value,
            },
          },
        })),

      applySpeedGrammar: (command) => {
        const parser = new SpeedGrammarParser();
        const parsed = parser.parse(command);

        if (parsed) {
          // Apply the parsed command to the state
          switch (parsed.type) {
            case "price":
              // Handle price locking
              break;
            case "margin":
              // Handle margin adjustment
              break;
            case "effort":
              // Handle effort allocation
              get().updateEffort(parsed.stream, "realize", parsed.duration);
              break;
          }
        }
      },

      generateScenarios: () => {
        const { chips, decisions } = get();
        const generator = new ScenarioGenerator();
        const scenarios = generator.generate(chips, decisions);

        set({ scenarios });
      },

      calculateTotals: () => {
        const { effortData, scenarios, currentScenario } = get();
        const calculator = new ProjectCalculator();
        return calculator.calculate(effortData, scenarios[currentScenario]);
      },

      validateGuardrails: () => {
        const { effortData } = get();
        const validator = new GuardrailValidator();
        return validator.validate(effortData);
      },
    }),
    {
      name: "siip-storage",
      partialize: (state) => ({
        chips: state.chips,
        decisions: state.decisions,
        effortData: state.effortData,
      }),
    }
  )
);
```

### Phase 7: Export & PDF Generation (Week 12)

#### PDF Generation Service

```typescript
// src/lib/pdf-generator.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export class ProposalGenerator {
  async generatePDF(scenario: ScenarioPlan, client: ClientProfile): Promise<Blob> {
    const pdf = new jsPDF("p", "mm", "a4");

    // Cover page
    await this.addCoverPage(pdf, scenario, client);

    // Executive summary
    pdf.addPage();
    await this.addExecutiveSummary(pdf, scenario);

    // Solution architecture
    pdf.addPage();
    await this.addSolutionArchitecture(pdf, scenario);

    // Timeline
    pdf.addPage("l"); // Landscape
    await this.addTimeline(pdf, scenario);

    // Investment breakdown
    pdf.addPage();
    await this.addInvestmentBreakdown(pdf, scenario);

    // Next steps
    pdf.addPage();
    await this.addNextSteps(pdf, scenario, client);

    return pdf.output("blob");
  }

  private async addCoverPage(pdf: jsPDF, scenario: ScenarioPlan, client: ClientProfile) {
    // Add client logo if provided
    if (client.logo) {
      pdf.addImage(client.logo, "PNG", 20, 20, 60, 20);
    }

    // Add company logo
    pdf.addImage("/logo.png", "PNG", 130, 20, 60, 20);

    // Title
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("SAP S/4HANA Implementation Proposal", 105, 80, { align: "center" });

    // Client name
    pdf.setFontSize(20);
    pdf.setTextColor(0, 122, 255);
    pdf.text(client.companyName, 105, 100, { align: "center" });

    // Details box
    const details = [
      ["Proposal Date:", new Date().toLocaleDateString()],
      ["Project Duration:", `${scenario.totals.months} months`],
      [
        "Total Investment:",
        `${scenario.totals.currency} ${scenario.totals.sellPrice.toLocaleString()}`,
      ],
      ["Success Probability:", "94%"],
    ];

    let yPos = 120;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    details.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 30, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 100, yPos);
      yPos += 10;
    });
  }

  private async addTimeline(pdf: jsPDF, scenario: ScenarioPlan) {
    // Create timeline visualization
    const canvas = await this.createTimelineCanvas(scenario);
    const imgData = canvas.toDataURL("image/png");

    pdf.addImage(imgData, "PNG", 20, 50, 257, 150); // Landscape dimensions

    // Add phase details
    const phases = scenario.phases;
    let yPos = 220;

    Object.entries(phases).forEach(([phase, config]) => {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(phase, 20, yPos);

      pdf.setFont("helvetica", "normal");
      pdf.text(`${config.durationWeeks} weeks`, 60, yPos);
      pdf.text(`${config.effort} PD`, 100, yPos);

      yPos += 7;
    });
  }

  private async createTimelineCanvas(scenario: ScenarioPlan): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 400;

    const ctx = canvas.getContext("2d")!;

    // Draw timeline bars
    const phases = Object.entries(scenario.phases);
    const totalWeeks = phases.reduce((sum, [, config]) => sum + (config.durationWeeks || 0), 0);

    let currentX = 50;
    const barHeight = 40;
    const colors = ["#30D158", "#007AFF", "#5856D6", "#FF9F0A", "#30D158"];

    phases.forEach(([phase, config], index) => {
      const width = ((config.durationWeeks || 0) / totalWeeks) * 800;

      // Draw bar
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(currentX, 150, width, barHeight);

      // Draw text
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(phase, currentX + width / 2, 175);

      currentX += width;
    });

    return canvas;
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// src/__tests__/chip-extractor.test.ts
import { ChipExtractor } from "@/lib/chip-extractor";

describe("ChipExtractor", () => {
  const extractor = new ChipExtractor();

  it("extracts country chips correctly", () => {
    const text = "We are a Malaysian manufacturing company";
    const chips = extractor.extract(text);

    expect(chips).toHaveLength(2);
    expect(chips[0]).toMatchObject({
      type: "country",
      value: "Malaysian",
      confidence: expect.any(Number),
    });
    expect(chips[1]).toMatchObject({
      type: "industry",
      value: "manufacturing",
    });
  });

  it("calculates confidence scores", () => {
    const text = "Malaysia Malaysia Singapore";
    const chips = extractor.extract(text);

    const malaysiaChip = chips.find((c) => c.value === "Malaysia");
    expect(malaysiaChip?.confidence).toBeGreaterThan(0.8);
  });

  it("deduplicates similar chips", () => {
    const text = "Malaysia malaysian Malaysian";
    const chips = extractor.extract(text);

    expect(chips.filter((c) => c.type === "country")).toHaveLength(1);
  });
});
```

### Integration Tests

```typescript
// src/__tests__/integration/planning-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanningCanvas } from '@/components/planning/planning-canvas';

describe('Planning Flow Integration', () => {
  it('updates effort allocation and recalculates totals', async () => {
    render(<PlanningCanvas />);

    // Find Finance/Realize input
    const input = screen.getByDisplayValue('45');

    // Update value
    fireEvent.change(input, { target: { value: '60' } });

    // Verify total updates
    await waitFor(() => {
      expect(screen.getByText('122')).toBeInTheDocument(); // 107 + 15
    });
  });

  it('processes speed grammar commands', async () => {
    render(<PlanningCanvas />);

    const commandInput = screen.getByPlaceholderText('/price 650000 lock');

    fireEvent.change(commandInput, { target: { value: '8d @SC(FI)' } });
    fireEvent.keyDown(commandInput, { key: 'Enter' });

    await waitFor(() => {
      // Verify effort allocation updated
      expect(screen.getByDisplayValue('8')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// cypress/e2e/complete-flow.cy.ts
describe("Complete SIIP Flow", () => {
  it("processes RFP to final proposal", () => {
    cy.visit("/");

    // Stage 1: Paste RFP
    cy.get('[data-testid="rfp-input"]').type(
      "Malaysian manufacturing company, 850 employees, need Finance and HR modules"
    );

    // Verify chips extracted
    cy.get('[data-testid="chip"]').should("have.length.at.least", 3);

    // Stage 2: Make decisions
    cy.get('[data-testid="decision-card"]').first().click();
    cy.get('[data-testid="decision-option"]').first().click();

    // Stage 3: Configure effort
    cy.get('[data-testid="effort-input"]').first().clear().type("50");

    // Stage 4: Generate proposal
    cy.get('[data-testid="generate-proposal"]').click();

    // Verify PDF generated
    cy.get('[data-testid="download-pdf"]').should("be.visible");
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// src/app/layout.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const PlanningCanvas = dynamic(() => import('@/components/planning/planning-canvas'), {
  loading: () => <div>Loading planning canvas...</div>,
  ssr: false
});

const GanttChart = dynamic(() => import('@/components/timeline/gantt-chart'), {
  loading: () => <div>Loading timeline...</div>,
  ssr: false
});
```

### Virtual Scrolling

```typescript
// For large datasets (50+ SAP packages)
import { FixedSizeList as List } from 'react-window';

export const PackageList: React.FC = () => {
  const packages = useSAPPackages(); // 50+ packages

  return (
    <List
      height={400}
      itemCount={packages.length}
      itemSize={60}
      itemData={packages}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <PackageItem package={data[index]} />
        </div>
      )}
    </List>
  );
};
```

## Security Implementation

### Input Validation

```typescript
// src/lib/validation.ts
import { z } from "zod";

export const chipSchema = z.object({
  type: z.enum(["country", "employees", "revenue" /* ... */]),
  value: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
  source: z.enum(["paste", "upload", "voice", "manual"]),
});

export const decisionSchema = z.object({
  type: z.enum(["module_combo", "banking_path" /* ... */]),
  selected: z.string().min(1),
  rationale: z.string().max(500),
});

export function validateChipInput(input: unknown): Chip {
  return chipSchema.parse(input);
}
```

### XSS Prevention

```typescript
// src/lib/sanitize.ts
import DOMPurify from "dompurify";

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, "") // Remove HTML brackets
    .replace(/javascript:/gi, "") // Remove JS protocols
    .slice(0, 1000); // Limit length
}
```

## Deployment Configuration

### Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "framework": "nextjs",
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  },
  "build": {
    "env": {
      "GENERATE_SOURCEMAP": "false"
    }
  }
}
```

### Environment Configuration

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/siip"
REDIS_URL="rediss://user:pass@host:6380"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Feature flags
ENABLE_ADVANCED_FEATURES=true
ENABLE_PDF_GENERATION=true
ENABLE_COLLABORATION=false
```

## Development Team Handoff

### Repository Structure

```
siip/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── chips/          # Chip-related components
│   │   ├── decisions/      # Decision card components
│   │   ├── planning/       # Planning canvas components
│   │   └── timeline/       # Timeline/Gantt components
│   ├── lib/                # Utilities and services
│   │   ├── chip-extractor.ts
│   │   ├── speed-grammar.ts
│   │   ├── pdf-generator.ts
│   │   └── calculations.ts
│   ├── store/              # State management
│   ├── types/              # TypeScript definitions
│   └── data/               # Static data and catalogs
├── prisma/                 # Database schema
├── tests/                  # Test files
└── docs/                   # Documentation
```

### Getting Started

```bash
# 1. Clone and setup
git clone <repository-url>
cd siip
pnpm install

# 2. Setup database
pnpm db:generate
pnpm db:push

# 3. Start development
pnpm dev

# 4. Run tests
pnpm test
pnpm test:e2e
```

### Development Workflow

1. **Feature Development**: Create feature branch from `main`
2. **Component First**: Build components in isolation with Storybook
3. **State Integration**: Connect components to Zustand store
4. **Testing**: Write unit tests for business logic, integration tests for flows
5. **E2E Testing**: Add Cypress tests for critical user journeys
6. **Code Review**: Ensure TypeScript strict mode compliance
7. **Deployment**: Merge to main triggers Vercel deployment

### Critical Success Factors

1. **Data Fidelity**: Preserve all existing SAP package definitions and calculations
2. **Performance**: Maintain sub-200ms response times for chip extraction
3. **Accessibility**: WCAG 2.1 AA compliance for all interactive elements
4. **Mobile Experience**: Responsive design with touch-friendly interactions
5. **Type Safety**: 100% TypeScript coverage with strict mode

### Next Phase: Intelligence Layer

After core platform completion, implement:

- ML-based effort prediction
- Pattern recognition for similar projects
- Automated risk assessment
- Portfolio-level insights and benchmarking

This documentation provides the complete roadmap for transforming the SIIP mockup into a production-ready platform that scales SAP implementation expertise.

Siip Complete Mockup

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAP Implementation Intelligence Platform (SIIP)</title>
    <style>
        /* SIIP Design System - Production Ready */
        :root {
            /* Brand Colors */
            --primary: #007AFF;
            --primary-hover: #0056CC;
            --primary-light: rgba(0, 122, 255, 0.08);
            --success: #30D158;
            --warning: #FF9F0A;
            --danger: #FF453A;
            
            /* Neutral Colors */
            --background: #FFFFFF;
            --surface: #FAFAFA;
            --surface-elevated: #FFFFFF;
            --glass: rgba(255, 255, 255, 0.85);
            
            /* Text Colors */
            --text-primary: #1C1C1E;
            --text-secondary: #6B6B70;
            --text-tertiary: #AEAEB2;
            --text-accent: #007AFF;
            
            /* Border & Shadow */
            --border: rgba(0, 0, 0, 0.06);
            --border-medium: rgba(0, 0, 0, 0.1);
            --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.1);
            --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.08);
            --shadow-medium: 0 8px 40px rgba(0, 0, 0, 0.12);
            
            /* Geometry */
            --radius: 12px;
            --radius-small: 8px;
            --radius-large: 16px;
            
            /* Animation */
            --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
            --duration-fast: 0.2s;
            --duration-medium: 0.4s;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
            background: var(--background);
            color: var(--text-primary);
            font-size: 16px;
            line-height: 1.5;
            overflow-x: hidden;
        }
        
        /* Layout Structure */
        .app {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Header with Scenario Management */
        .header {
            background: var(--glass);
            backdrop-filter: saturate(180%) blur(20px);
            border-bottom: 1px solid var(--border);
            padding: 12px 24px;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary) 0%, #5AC8FA 100%);
            border-radius: var(--radius-small);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 14px;
        }
        
        .app-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        /* Scenario Tabs */
        .scenario-tabs {
            display: flex;
            background: var(--surface);
            border-radius: var(--radius-small);
            padding: 4px;
            gap: 4px;
        }
        
        .scenario-tab {
            padding: 8px 16px;
            border-radius: var(--radius-small);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
            background: transparent;
            border: none;
            color: var(--text-secondary);
        }
        
        .scenario-tab.active {
            background: var(--primary);
            color: white;
        }
        
        .scenario-tab:hover:not(.active) {
            background: var(--primary-light);
            color: var(--primary);
        }
        
        /* Action Bar */
        .action-bar {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .command-input {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-small);
            padding: 8px 12px;
            font-size: 14px;
            font-family: 'SF Mono', monospace;
            width: 200px;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .command-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        .present-mode {
            background: var(--success);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: var(--radius-small);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
        }
        
        /* Main Content */
        .main {
            flex: 1;
            display: flex;
        }
        
        /* Left Sidebar - SAP Activate Phases */
        .sidebar {
            width: 280px;
            background: var(--surface);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid var(--border);
        }
        
        .sidebar-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .sidebar-subtitle {
            font-size: 14px;
            color: var(--text-secondary);
        }
        
        .phase-nav {
            flex: 1;
            padding: 16px;
        }
        
        .phase-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: var(--radius-small);
            cursor: pointer;
            margin-bottom: 8px;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .phase-item:hover {
            background: var(--primary-light);
        }
        
        .phase-item.active {
            background: var(--primary);
            color: white;
        }
        
        .phase-indicator {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }
        
        .phase-item.active .phase-indicator {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        .phase-details h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .phase-details span {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .wave-picker {
            padding: 16px;
            border-top: 1px solid var(--border);
        }
        
        .wave-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .wave-options {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .wave-chip {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: var(--radius-small);
            font-size: 12px;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .wave-chip.selected {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }
        
        /* Center Content - Planning Canvas */
        .content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
        }
        
        .stage {
            display: none;
        }
        
        .stage.active {
            display: block;
        }
        
        /* Stage 1: Chip Extraction */
        .chip-extraction {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .stage-header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .stage-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .stage-subtitle {
            font-size: 18px;
            color: var(--text-secondary);
        }
        
        .input-zone {
            background: var(--surface);
            border-radius: var(--radius-large);
            padding: 32px;
            margin-bottom: 32px;
            border: 2px solid var(--border);
            transition: all var(--duration-medium) var(--ease);
        }
        
        .input-zone:hover {
            border-color: var(--primary);
            box-shadow: var(--shadow-medium);
        }
        
        .input-instruction {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .text-input {
            width: 100%;
            min-height: 200px;
            border: none;
            background: var(--background);
            border-radius: var(--radius);
            padding: 20px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            outline: none;
        }
        
        .text-input:focus {
            box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        /* Chip Display */
        .chips-container {
            margin-top: 24px;
        }
        
        .chips-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .extraction-status {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
        }
        
        .chips-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .chip {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 8px 12px;
            font-size: 14px;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .chip:hover {
            border-color: var(--primary);
            transform: translateY(-1px);
        }
        
        .chip-type {
            background: var(--primary);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .chip-confidence {
            color: var(--success);
            font-size: 12px;
            font-weight: 600;
        }
        
        /* Stage 2: Decision Cards */
        .decision-cards {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .decision-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .decision-card {
            background: var(--background);
            border: 2px solid var(--border);
            border-radius: var(--radius-large);
            padding: 24px;
            cursor: pointer;
            transition: all var(--duration-medium) var(--ease);
        }
        
        .decision-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
        }
        
        .decision-card.selected {
            border-color: var(--primary);
            background: var(--primary-light);
        }
        
        .decision-header {
            margin-bottom: 16px;
        }
        
        .decision-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .decision-description {
            font-size: 14px;
            color: var(--text-secondary);
        }
        
        .decision-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .decision-option {
            padding: 12px 16px;
            background: var(--surface);
            border-radius: var(--radius-small);
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
            border: 2px solid transparent;
        }
        
        .decision-option:hover {
            background: var(--primary-light);
        }
        
        .decision-option.selected {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        
        .option-title {
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .option-description {
            font-size: 12px;
            opacity: 0.7;
        }
        
        /* Stage 3: Planning Canvas */
        .planning-canvas {
            max-width: none;
        }
        
        .canvas-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .canvas-controls {
            display: flex;
            gap: 12px;
        }
        
        .anchor-toggle {
            display: flex;
            background: var(--surface);
            border-radius: var(--radius-small);
            padding: 4px;
        }
        
        .anchor-option {
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            border-radius: var(--radius-small);
            transition: all var(--duration-fast) var(--ease);
            background: transparent;
            border: none;
            color: var(--text-secondary);
        }
        
        .anchor-option.active {
            background: var(--primary);
            color: white;
        }
        
        /* Planning Grid */
        .planning-grid {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            margin-bottom: 24px;
        }
        
        .grid-header {
            display: grid;
            grid-template-columns: 150px repeat(5, 1fr) 120px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .grid-header > div {
            padding: 12px;
            border-right: 1px solid var(--border);
        }
        
        .grid-header > div:last-child {
            border-right: none;
        }
        
        .grid-row {
            display: grid;
            grid-template-columns: 150px repeat(5, 1fr) 120px;
            border-bottom: 1px solid var(--border);
            min-height: 50px;
        }
        
        .grid-row:last-child {
            border-bottom: none;
        }
        
        .grid-row:hover {
            background: rgba(0, 122, 255, 0.02);
        }
        
        .stream-label {
            padding: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            border-right: 1px solid var(--border);
            background: var(--surface);
        }
        
        .effort-cell {
            padding: 4px;
            border-right: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .effort-cell:last-child {
            border-right: none;
        }
        
        .effort-input {
            width: 60px;
            padding: 6px 8px;
            border: 1px solid var(--border);
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .effort-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-light);
        }
        
        .stream-total {
            padding: 12px;
            font-weight: 600;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Mini Timeline */
        .mini-timeline {
            background: var(--surface);
            border-radius: var(--radius);
            padding: 20px;
            margin-bottom: 24px;
        }
        
        .timeline-header {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .timeline-bars {
            display: flex;
            align-items: center;
            gap: 4px;
            height: 40px;
        }
        
        .timeline-bar {
            height: 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .timeline-bar:hover {
            transform: scaleY(1.2);
        }
        
        /* Stage 4: Scenario Comparison */
        .scenario-comparison {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }
        
        .scenario-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .scenario-card {
            background: var(--background);
            border: 2px solid var(--border);
            border-radius: var(--radius-large);
            padding: 24px;
            transition: all var(--duration-medium) var(--ease);
        }
        
        .scenario-card.active {
            border-color: var(--primary);
            box-shadow: var(--shadow-medium);
        }
        
        .scenario-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .scenario-metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .metric-item {
            text-align: center;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 4px;
        }
        
        .metric-label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Right Sidebar - Resources & Export */
        .right-sidebar {
            width: 320px;
            background: var(--surface);
            border-left: 1px solid var(--border);
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-section {
            padding: 20px;
            border-bottom: 1px solid var(--border);
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Resource Catalog */
        .resource-catalog {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .resource-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: var(--background);
            border-radius: var(--radius-small);
            font-size: 14px;
        }
        
        .resource-role {
            font-weight: 500;
        }
        
        .resource-rate {
            color: var(--text-secondary);
            font-size: 12px;
        }
        
        /* FX Rates */
        .fx-rates {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .fx-item {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        
        .fx-pair {
            font-weight: 500;
        }
        
        .fx-rate {
            color: var(--text-secondary);
        }
        
        /* Export Actions */
        .export-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .export-button {
            background: var(--background);
            border: 2px solid var(--border);
            padding: 12px 16px;
            border-radius: var(--radius);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .export-button:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-1px);
        }
        
        /* Footer - Totals */
        .footer {
            background: var(--surface);
            border-top: 1px solid var(--border);
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .totals-section {
            display: flex;
            gap: 32px;
        }
        
        .total-item {
            text-align: center;
        }
        
        .total-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 4px;
        }
        
        .total-label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .action-buttons {
            display: flex;
            gap: 12px;
        }
        
        .primary-button {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: var(--radius);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .primary-button:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }
        
        .secondary-button {
            background: var(--background);
            color: var(--text-primary);
            border: 2px solid var(--border);
            padding: 12px 24px;
            border-radius: var(--radius);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease);
        }
        
        .secondary-button:hover {
            border-color: var(--primary);
            color: var(--primary);
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
            .right-sidebar {
                width: 280px;
            }
            
            .sidebar {
                width: 240px;
            }
        }
        
        @media (max-width: 768px) {
            .main {
                flex-direction: column;
            }
            
            .sidebar, .right-sidebar {
                width: 100%;
                height: auto;
                border: none;
                border-bottom: 1px solid var(--border);
            }
            
            .phase-nav {
                display: flex;
                overflow-x: auto;
                padding: 16px;
            }
            
            .phase-item {
                flex-shrink: 0;
                margin-right: 8px;
                margin-bottom: 0;
            }
            
            .grid-header, .grid-row {
                grid-template-columns: 100px repeat(3, 1fr) 80px;
                font-size: 11px;
            }
            
            .scenario-cards {
                grid-template-columns: 1fr;
            }
        }
        
        /* Utility Classes */
        .hidden { display: none; }
        .visible { display: block; }
        .text-center { text-align: center; }
        .mt-16 { margin-top: 16px; }
        .mb-16 { margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="app">
        <!-- Header with Scenario Management -->
        <header class="header">
            <div class="logo-section">
                <div class="logo-icon">S</div>
                <h1 class="app-title">SAP Implementation Intelligence Platform</h1>
            </div>
            
            <div class="scenario-tabs">
                <button class="scenario-tab active" onclick="switchScenario('A')">Scenario A</button>
                <button class="scenario-tab" onclick="switchScenario('B')">Scenario B</button>
                <button class="scenario-tab" onclick="switchScenario('C')">Scenario C</button>
            </div>
            
            <div class="action-bar">
                <input 
                    type="text" 
                    class="command-input" 
                    placeholder="/price 650000 lock"
                    onkeydown="handleSpeedGrammar(event)"
                >
                <button class="present-mode" onclick="togglePresentMode()">Present</button>
            </div>
        </header>
        
        <main class="main">
            <!-- Left Sidebar - SAP Activate Phases -->
            <aside class="sidebar">
                <div class="sidebar-header">
                    <h2 class="sidebar-title">SAP Activate Methodology</h2>
                    <p class="sidebar-subtitle">Navigate implementation phases</p>
                </div>
                
                <nav class="phase-nav">
                    <div class="phase-item active" onclick="showStage(0)">
                        <div class="phase-indicator">1</div>
                        <div class="phase-details">
                            <h4>Capture</h4>
                            <span>Requirements extraction</span>
                        </div>
                    </div>
                    <div class="phase-item" onclick="showStage(1)">
                        <div class="phase-indicator">2</div>
                        <div class="phase-details">
                            <h4>Decide</h4>
                            <span>Module configuration</span>
                        </div>
                    </div>
                    <div class="phase-item" onclick="showStage(2)">
                        <div class="phase-indicator">3</div>
                        <div class="phase-details">
                            <h4>Plan</h4>
                            <span>Resource allocation</span>
                        </div>
                    </div>
                    <div class="phase-item" onclick="showStage(3)">
                        <div class="phase-indicator">4</div>
                        <div class="phase-details">
                            <h4>Present</h4>
                            <span>Scenario comparison</span>
                        </div>
                    </div>
                </nav>
                
                <div class="wave-picker">
                    <h3 class="wave-title">Implementation Waves</h3>
                    <div class="wave-options">
                        <div class="wave-chip selected">Malaysia</div>
                        <div class="wave-chip">Singapore</div>
                        <div class="wave-chip">Vietnam</div>
                        <div class="wave-chip">Thailand</div>
                    </div>
                </div>
            </aside>
            
            <!-- Main Content Area -->
            <div class="content">
                <!-- Stage 1: Chip Extraction -->
                <div class="stage chip-extraction active">
                    <div class="stage-header">
                        <h1 class="stage-title">Extract Requirements</h1>
                        <p class="stage-subtitle">Paste your RFP or describe your project. AI will extract structured requirements instantly.</p>
                    </div>
                    
                    <div class="input-zone">
                        <label class="input-instruction">Paste your RFP, requirements document, or describe your project needs</label>
                        <textarea 
                            class="text-input" 
                            placeholder="Example:

We are a Malaysian manufacturing company with 850 employees looking to implement SAP S/4HANA. Our annual revenue is MYR 120 million. We need Finance and Procurement modules, HR for payroll and time tracking, integration with banking via Host-to-Host, and Salesforce integration. Project timeline: Q1 2025 to Q4 2025. We need MyInvois compliance, have 12 custom forms and 8 reports to rebuild, and use Microsoft Azure AD for SSO."
oninput="extractChips(this.value)" ></textarea>

                        <div class="chips-container">
                            <div class="chips-header">
                                <div class="extraction-status"></div>
                                <h3>Extracted Requirements (Live)</h3>
                            </div>
                            <div class="chips-grid" id="chips-display">
                                <!-- Chips will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stage 2: Decision Cards -->
                <div class="stage decision-cards">
                    <div class="stage-header">
                        <h1 class="stage-title">Configure Solution</h1>
                        <p class="stage-subtitle">Make key decisions that shape your implementation approach and timeline.</p>
                    </div>

                    <div class="decision-grid">
                        <div class="decision-card" onclick="selectDecision(this, 'module_combo')">
                            <div class="decision-header">
                                <h3 class="decision-title">Module Combination</h3>
                                <p class="decision-description">Select your core SAP modules and integration scope</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'finance_p2p_otc')">
                                    <div class="option-title">Finance + P2P + OTC</div>
                                    <div class="option-description">Complete order-to-cash and procure-to-pay</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'finance_hcm')">
                                    <div class="option-title">Finance + HCM Core</div>
                                    <div class="option-description">Financial management with HR</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'finance_only')">
                                    <div class="option-title">Finance Only</div>
                                    <div class="option-description">Financial accounting and controlling</div>
                                </div>
                            </div>
                        </div>

                        <div class="decision-card" onclick="selectDecision(this, 'banking_path')">
                            <div class="decision-header">
                                <h3 class="decision-title">Banking Integration</h3>
                                <p class="decision-description">Choose your banking connectivity approach</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'host_to_host')">
                                    <div class="option-title">Host-to-Host</div>
                                    <div class="option-description">Direct integration with bank APIs</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'sap_mbc')">
                                    <div class="option-title">SAP Multi-Bank Connectivity</div>
                                    <div class="option-description">SAP's standard banking solution</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'manual_upload')">
                                    <div class="option-title">Manual Upload</div>
                                    <div class="option-description">File-based bank statement processing</div>
                                </div>
                            </div>
                        </div>

                        <div class="decision-card" onclick="selectDecision(this, 'integration_posture')">
                            <div class="decision-header">
                                <h3 class="decision-title">Integration Platform</h3>
                                <p class="decision-description">Select your integration architecture approach</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'btp_integration')">
                                    <div class="option-title">SAP BTP Integration Suite</div>
                                    <div class="option-description">Native SAP integration platform</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'existing_ipaas')">
                                    <div class="option-title">Coexist with Existing iPaaS</div>
                                    <div class="option-description">Keep current integration platform</div>
                                </div>
                            </div>
                        </div>

                        <div class="decision-card" onclick="selectDecision(this, 'sso_mode')">
                            <div class="decision-header">
                                <h3 class="decision-title">SSO Implementation</h3>
                                <p class="decision-description">Choose your single sign-on deployment strategy</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'day_one')">
                                    <div class="option-title">Day-One SSO</div>
                                    <div class="option-description">Deploy SSO with go-live</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'staged')">
                                    <div class="option-title">Staged Implementation</div>
                                    <div class="option-description">Deploy SSO in later phase</div>
                                </div>
                            </div>
                        </div>

                        <div class="decision-card" onclick="selectDecision(this, 'fricew_target')">
                            <div class="decision-header">
                                <h3 class="decision-title">FRICEW Strategy</h3>
                                <p class="decision-description">Define your customization approach</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'replace_70')">
                                    <div class="option-title">70% Replace</div>
                                    <div class="option-description">Aggressive standardization approach</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'replace_50')">
                                    <div class="option-title">50% Replace</div>
                                    <div class="option-description">Balanced transformation approach</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'replace_30')">
                                    <div class="option-title">30% Replace</div>
                                    <div class="option-description">Conservative migration approach</div>
                                </div>
                            </div>
                        </div>

                        <div class="decision-card" onclick="selectDecision(this, 'rate_region')">
                            <div class="decision-header">
                                <h3 class="decision-title">Rate Card & FX</h3>
                                <p class="decision-description">Select pricing region and currency</p>
                            </div>
                            <div class="decision-options">
                                <div class="decision-option selected" onclick="selectOption(event, 'abmy_myr')">
                                    <div class="option-title">ABMY - MYR</div>
                                    <div class="option-description">Malaysia rates in Ringgit</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'absg_sgd')">
                                    <div class="option-title">ABSG - SGD</div>
                                    <div class="option-description">Singapore rates in Singapore Dollars</div>
                                </div>
                                <div class="decision-option" onclick="selectOption(event, 'abvn_vnd')">
                                    <div class="option-title">ABVN - VND</div>
                                    <div class="option-description">Vietnam rates in Vietnamese Dong</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stage 3: Planning Canvas -->
                <div class="stage planning-canvas">
                    <div class="stage-header">
                        <h1 class="stage-title">Planning Canvas</h1>
                        <p class="stage-subtitle">Configure effort allocation across SAP Activate phases and workstreams.</p>
                    </div>

                    <div class="canvas-header">
                        <div class="canvas-controls">
                            <div class="anchor-toggle">
                                <button class="anchor-option active" onclick="setAnchor('pd')">Keep PD</button>
                                <button class="anchor-option" onclick="setAnchor('fte')">Keep FTE</button>
                                <button class="anchor-option" onclick="setAnchor('duration')">Keep Duration</button>
                            </div>
                        </div>
                    </div>

                    <div class="planning-grid">
                        <div class="grid-header">
                            <div>Stream</div>
                            <div>Prepare</div>
                            <div>Explore</div>
                            <div>Realize</div>
                            <div>Deploy</div>
                            <div>Run</div>
                            <div>Total PD</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Finance</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('finance', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="24" onchange="updateEffort('finance', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="45" onchange="updateEffort('finance', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="18" onchange="updateEffort('finance', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="8" onchange="updateEffort('finance', 'run', this.value)"></div>
                            <div class="stream-total">107</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Procurement</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="8" onchange="updateEffort('procurement', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="18" onchange="updateEffort('procurement', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="32" onchange="updateEffort('procurement', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('procurement', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="6" onchange="updateEffort('procurement', 'run', this.value)"></div>
                            <div class="stream-total">76</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Integration</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="6" onchange="updateEffort('integration', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('integration', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="28" onchange="updateEffort('integration', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="15" onchange="updateEffort('integration', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="4" onchange="updateEffort('integration', 'run', this.value)"></div>
                            <div class="stream-total">65</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Data Migration</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="4" onchange="updateEffort('data', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="8" onchange="updateEffort('data', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="22" onchange="updateEffort('data', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('data', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="2" onchange="updateEffort('data', 'run', this.value)"></div>
                            <div class="stream-total">48</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Testing</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="2" onchange="updateEffort('testing', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="6" onchange="updateEffort('testing', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="35" onchange="updateEffort('testing', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="18" onchange="updateEffort('testing', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="3" onchange="updateEffort('testing', 'run', this.value)"></div>
                            <div class="stream-total">64</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Change Mgmt</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="8" onchange="updateEffort('ocm', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('ocm', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="18" onchange="updateEffort('ocm', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="22" onchange="updateEffort('ocm', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="12" onchange="updateEffort('ocm', 'run', this.value)"></div>
                            <div class="stream-total">72</div>
                        </div>

                        <div class="grid-row">
                            <div class="stream-label">Project Mgmt</div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="15" onchange="updateEffort('pmo', 'prepare', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="20" onchange="updateEffort('pmo', 'explore', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="25" onchange="updateEffort('pmo', 'realize', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="20" onchange="updateEffort('pmo', 'deploy', this.value)"></div>
                            <div class="effort-cell"><input type="number" class="effort-input" value="10" onchange="updateEffort('pmo', 'run', this.value)"></div>
                            <div class="stream-total">90</div>
                        </div>
                    </div>

                    <div class="mini-timeline">
                        <h3 class="timeline-header">Project Timeline (14 months)</h3>
                        <div class="timeline-bars">
                            <div class="timeline-bar" style="width: 12%; background: linear-gradient(90deg, #30D158, #32D74B);">Prepare<br>2 months</div>
                            <div class="timeline-bar" style="width: 20%; background: linear-gradient(90deg, #007AFF, #5AC8FA);">Explore<br>3 months</div>
                            <div class="timeline-bar" style="width: 40%; background: linear-gradient(90deg, #5856D6, #AF52DE);">Realize<br>6 months</div>
                            <div class="timeline-bar" style="width: 20%; background: linear-gradient(90deg, #FF9F0A, #FFCC02);">Deploy<br>2 months</div>
                            <div class="timeline-bar" style="width: 8%; background: linear-gradient(90deg, #30D158, #32D74B);">Run<br>1 month</div>
                        </div>
                    </div>
                </div>

                <!-- Stage 4: Scenario Comparison -->
                <div class="stage scenario-comparison">
                    <div class="stage-header">
                        <h1 class="stage-title">Scenario Comparison</h1>
                        <p class="stage-subtitle">Compare different implementation approaches and select the optimal scenario.</p>
                    </div>

                    <div class="comparison-header">
                        <div>
                            <h2>Implementation Options</h2>
                            <p>Generated scenarios based on your requirements and decisions</p>
                        </div>
                    </div>

                    <div class="scenario-cards">
                        <div class="scenario-card active">
                            <h3 class="scenario-name">Scenario A: Aggressive</h3>
                            <div class="scenario-metrics">
                                <div class="metric-item">
                                    <div class="metric-value">522</div>
                                    <div class="metric-label">Person Days</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">12</div>
                                    <div class="metric-label">Months</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">MYR 1.8M</div>
                                    <div class="metric-label">Total Cost</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">High</div>
                                    <div class="metric-label">Risk Level</div>
                                </div>
                            </div>
                        </div>

                        <div class="scenario-card">
                            <h3 class="scenario-name">Scenario B: Balanced</h3>
                            <div class="scenario-metrics">
                                <div class="metric-item">
                                    <div class="metric-value">645</div>
                                    <div class="metric-label">Person Days</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">14</div>
                                    <div class="metric-label">Months</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">MYR 2.1M</div>
                                    <div class="metric-label">Total Cost</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">Medium</div>
                                    <div class="metric-label">Risk Level</div>
                                </div>
                            </div>
                        </div>

                        <div class="scenario-card">
                            <h3 class="scenario-name">Scenario C: Conservative</h3>
                            <div class="scenario-metrics">
                                <div class="metric-item">
                                    <div class="metric-value">758</div>
                                    <div class="metric-label">Person Days</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">16</div>
                                    <div class="metric-label">Months</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">MYR 2.4M</div>
                                    <div class="metric-label">Total Cost</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">Low</div>
                                    <div class="metric-label">Risk Level</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Sidebar - Resources & Export -->
            <aside class="right-sidebar">
                <div class="sidebar-section">
                    <h3 class="section-title">Resource Catalog</h3>
                    <div class="resource-catalog">
                        <div class="resource-item">
                            <span class="resource-role">Partner</span>
                            <span class="resource-rate">MYR 1,200/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Director</span>
                            <span class="resource-rate">MYR 1,000/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Sr. Manager</span>
                            <span class="resource-rate">MYR 800/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Manager</span>
                            <span class="resource-rate">MYR 600/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Sr. Consultant</span>
                            <span class="resource-rate">MYR 450/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Consultant</span>
                            <span class="resource-rate">MYR 350/day</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-role">Analyst</span>
                            <span class="resource-rate">MYR 250/day</span>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Exchange Rates</h3>
                    <div class="fx-rates">
                        <div class="fx-item">
                            <span class="fx-pair">USD/MYR</span>
                            <span class="fx-rate">4.72</span>
                        </div>
                        <div class="fx-item">
                            <span class="fx-pair">SGD/MYR</span>
                            <span class="fx-rate">3.48</span>
                        </div>
                        <div class="fx-item">
                            <span class="fx-pair">EUR/MYR</span>
                            <span class="fx-rate">5.12</span>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Export Options</h3>
                    <div class="export-actions">
                        <button class="export-button" onclick="exportToPDF()">
                            📄 Generate PDF
                        </button>
                        <button class="export-button" onclick="exportToCSV()">
                            📊 Export CSV
                        </button>
                        <button class="export-button" onclick="generateShareableLink()">
                            🔗 Share Link
                        </button>
                        <button class="export-button" onclick="exportAssumptions()">
                            📝 Assumptions
                        </button>
                    </div>
                </div>
            </aside>
        </main>

        <!-- Footer - Project Totals -->
        <footer class="footer">
            <div class="totals-section">
                <div class="total-item">
                    <div class="total-value">522</div>
                    <div class="total-label">Person Days</div>
                </div>
                <div class="total-item">
                    <div class="total-value">MYR 1,834,200</div>
                    <div class="total-label">Base Cost</div>
                </div>
                <div class="total-item">
                    <div class="total-value">15%</div>
                    <div class="total-label">Risk Buffer</div>
                </div>
                <div class="total-item">
                    <div class="total-value">-5%</div>
                    <div class="total-label">Discount</div>
                </div>
                <div class="total-item">
                    <div class="total-value">MYR 2,009,313</div>
                    <div class="total-label">Sell Price</div>
                </div>
                <div class="total-item">
                    <div class="total-value">22%</div>
                    <div class="total-label">Margin</div>
                </div>
            </div>

            <div class="action-buttons">
                <button class="secondary-button" onclick="saveScenario()">Save Scenario</button>
                <button class="primary-button" onclick="generateProposal()">Generate Proposal</button>
            </div>
        </footer>
    </div>

    <script>
        // SIIP Application State
        let currentStage = 0;
        let currentScenario = 'A';
        let chips = [];
        let decisions = {};
        let effortData = {};
        let scenarioData = {
            A: { name: 'Aggressive', pd: 522, months: 12, cost: 1834200, risk: 'High' },
            B: { name: 'Balanced', pd: 645, months: 14, cost: 2100000, risk: 'Medium' },
            C: { name: 'Conservative', pd: 758, months: 16, cost: 2400000, risk: 'Low' }
        };

        // Chip Types and Extraction Patterns
        const chipTypes = {
            country: { pattern: /(Malaysia|Singapore|Vietnam|Thailand|Indonesia)/gi, confidence: 0.9 },
            employees: { pattern: /(\d+)\s+employees?/gi, confidence: 0.85 },
            revenue: { pattern: /(MYR|SGD|USD)\s*([\d,.]+)\s*(million|M)/gi, confidence: 0.88 },
            industry: { pattern: /(manufacturing|retail|technology|financial|healthcare)/gi, confidence: 0.82 },
            modules: { pattern: /(Finance|HR|HCM|Supply Chain|SCM|Procurement)/gi, confidence: 0.85 },
            timeline: { pattern: /(Q[1-4]\s+\d{4}|[1-2]\d{3})/gi, confidence: 0.87 },
            integration: { pattern: /(Salesforce|Oracle|Microsoft|Azure|AWS)/gi, confidence: 0.90 },
            compliance: { pattern: /(e-invoice|MyInvois|LHDN|SST)/gi, confidence: 0.85 },
            banking: { pattern: /(Host-to-Host|banking|bank)/gi, confidence: 0.80 },
            sso: { pattern: /(SSO|single sign|Azure AD|ADFS)/gi, confidence: 0.88 }
        };

        // Navigation Functions
        function showStage(index) {
            // Update navigation
            document.querySelectorAll('.phase-item').forEach((item, i) => {
                item.classList.remove('active');
                if (i === index) item.classList.add('active');
            });

            // Update content
            document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
            document.querySelectorAll('.stage')[index]?.classList.add('active');

            currentStage = index;
        }

        function switchScenario(scenario) {
            document.querySelectorAll('.scenario-tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            currentScenario = scenario;

            // Update totals in footer
            const data = scenarioData[scenario];
            updateFooterTotals(data);
        }

        // Chip Extraction
        function extractChips(text) {
            chips = [];
            const chipsDisplay = document.getElementById('chips-display');

            if (!text.trim()) {
                chipsDisplay.innerHTML = '';
                return;
            }

            // Extract chips using patterns
            Object.entries(chipTypes).forEach(([type, config]) => {
                const matches = text.match(config.pattern);
                if (matches) {
                    matches.forEach(match => {
                        chips.push({
                            type: type,
                            value: match,
                            confidence: config.confidence,
                            source: 'paste'
                        });
                    });
                }
            });

            // Render chips
            renderChips();

            // Auto-advance if enough chips
            if (chips.length >= 5) {
                setTimeout(() => showStage(1), 2000);
            }
        }

        function renderChips() {
            const chipsDisplay = document.getElementById('chips-display');
            chipsDisplay.innerHTML = chips.map(chip => `
                <div class="chip">
                    <span class="chip-type">${chip.type}</span>
                    <span>${chip.value}</span>
                    <span class="chip-confidence">${Math.round(chip.confidence * 100)}%</span>
                </div>
            `).join('');
        }

        // Decision Management
        function selectDecision(card, decisionType) {
            document.querySelectorAll('.decision-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        }

        function selectOption(event, optionId) {
            event.stopPropagation();
            const card = event.target.closest('.decision-card');
            card.querySelectorAll('.decision-option').forEach(opt => opt.classList.remove('selected'));
            event.target.classList.add('selected');
        }

        // Planning Canvas
        function updateEffort(stream, phase, value) {
            if (!effortData[stream]) effortData[stream] = {};
            effortData[stream][phase] = parseInt(value);

            // Recalculate totals
            calculateTotals();
        }

        function setAnchor(mode) {
            document.querySelectorAll('.anchor-option').forEach(opt => opt.classList.remove('active'));
            event.target.classList.add('active');
        }

        function calculateTotals() {
            // Recalculate stream totals and update display
            document.querySelectorAll('.grid-row').forEach((row, index) => {
                const inputs = row.querySelectorAll('.effort-input');
                const total = Array.from(inputs).reduce((sum, input) => sum + parseInt(input.value || 0), 0);
                row.querySelector('.stream-total').textContent = total;
            });

            // Update footer totals
            const totalPD = Array.from(document.querySelectorAll('.stream-total'))
                .reduce((sum, el) => sum + parseInt(el.textContent || 0), 0);

            updateFooterTotals({ pd: totalPD, cost: totalPD * 3500 });
        }

        // Speed Grammar Processing
        function handleSpeedGrammar(event) {
            if (event.key === 'Enter') {
                const command = event.target.value;
                processSpeedGrammar(command);
                event.target.value = '';
            }
        }

        function processSpeedGrammar(command) {
            console.log('Processing command:', command);

            // Examples of speed grammar patterns:
            // 8d @SC(FI) - 8 days Senior Consultant Finance
            // /price 650000 lock - Lock price at 650K
            // /margin 22 lock - Lock margin at 22%
            // +overlay:MY eInvoice - Add Malaysia e-invoice overlay

            if (command.startsWith('/price')) {
                const price = command.match(/(\d+)/)?.[1];
                if (price) {
                    document.querySelector('.total-value').textContent = `MYR ${parseInt(price).toLocaleString()}`;
                }
            } else if (command.startsWith('/margin')) {
                const margin = command.match(/(\d+)/)?.[1];
                if (margin) {
                    document.querySelectorAll('.total-value')[5].textContent = `${margin}%`;
                }
            }
        }

        // Export Functions
        function exportToPDF() {
            console.log('Generating PDF proposal...');
            // Integration with PDF generation
        }

        function exportToCSV() {
            console.log('Exporting effort data to CSV...');
            // CSV export functionality
        }

        function generateShareableLink() {
            const url = `${window.location.origin}/?scenario=${currentScenario}&data=${btoa(JSON.stringify(effortData))}`;
            navigator.clipboard.writeText(url);
            alert('Shareable link copied to clipboard!');
        }

        function exportAssumptions() {
            console.log('Generating assumptions document...');
        }

        // Present Mode
        function togglePresentMode() {
            document.body.classList.toggle('present-mode');
        }

        // Utility Functions
        function updateFooterTotals(data) {
            if (data.pd) {
                document.querySelectorAll('.total-value')[0].textContent = data.pd;
            }
            if (data.cost) {
                document.querySelectorAll('.total-value')[1].textContent = `MYR ${data.cost.toLocaleString()}`;
            }
        }

        function saveScenario() {
            console.log('Saving scenario data...');
            localStorage.setItem('siip-scenario', JSON.stringify({
                scenario: currentScenario,
                chips: chips,
                decisions: decisions,
                effort: effortData
            }));
        }

        function generateProposal() {
            console.log('Generating final proposal...');
            showStage(3);
        }

        // Initialize Application
        document.addEventListener('DOMContentLoaded', () => {
            // Load sample data for demonstration
            setTimeout(() => {
                const sampleText = `We are a Malaysian manufacturing company with 850 employees looking to implement SAP S/4HANA. Our annual revenue is MYR 120 million. We need Finance and Procurement modules, HR for payroll and time tracking, integration with banking via Host-to-Host, and Salesforce integration. Project timeline: Q1 2025 to Q4 2025. We need MyInvois compliance, have 12 custom forms and 8 reports to rebuild, and use Microsoft Azure AD for SSO.`;

                const textInput = document.querySelector('.text-input');
                if (textInput && !textInput.value) {
                    textInput.value = sampleText;
                    extractChips(sampleText);
                }
            }, 3000);

            // Initialize calculations
            calculateTotals();
        });
    </script>

</body>
</html>
