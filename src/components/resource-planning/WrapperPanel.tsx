"use client";

import { Wrapper, WrapperType, WRAPPER_DEFAULTS } from "@/lib/resourcing/model";
import { Sliders, Info } from "lucide-react";
import { motion } from "framer-motion";

interface WrapperPanelProps {
  wrappers: Wrapper[];
  technicalEffort: number;
  averageRate: number;
  onUpdateWrapper: (wrapperId: string, updates: Partial<Wrapper>) => void;
}

const WRAPPER_COLORS: Record<WrapperType, string> = {
  projectManagement: "#8B5CF6",
  basis: "#3B82F6",
  security: "#EF4444",
  testing: "#10B981",
  training: "#F59E0B",
  changeManagement: "#14B8A6",
};

const WRAPPER_ICONS: Record<WrapperType, string> = {
  projectManagement: "📊",
  basis: "⚙️",
  security: "🔒",
  testing: "🧪",
  training: "📚",
  changeManagement: "🔄",
};

export function WrapperPanel({
  wrappers,
  technicalEffort,
  averageRate,
  onUpdateWrapper,
}: WrapperPanelProps) {
  const totalWrapperEffort = wrappers.reduce(
    (sum, w) => sum + w.calculatedEffort,
    0
  );
  const totalWrapperCost = wrappers.reduce((sum, w) => sum + w.calculatedCost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sliders className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Wrapper Activities
              </h3>
              <p className="text-sm text-gray-500">
                Overhead activities calculated as % of technical effort
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Wrapper Effort</div>
            <div className="text-lg font-bold text-purple-600">
              {totalWrapperEffort.toFixed(1)} PD
            </div>
          </div>
        </div>
      </div>

      {/* Base Metrics */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-gray-500">Technical Effort</div>
            <div className="text-sm font-semibold text-gray-900">
              {technicalEffort.toFixed(1)} PD
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Average Rate</div>
            <div className="text-sm font-semibold text-gray-900">
              ${averageRate.toFixed(0)}/hr
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Wrapper Cost</div>
            <div className="text-sm font-semibold text-green-600">
              ${totalWrapperCost.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Wrapper List */}
      <div className="divide-y divide-gray-100">
        {wrappers.map((wrapper) => {
          const defaults = WRAPPER_DEFAULTS[wrapper.type];
          const isCustom = wrapper.effortPercentage !== defaults.percentage;

          return (
            <motion.div
              key={wrapper.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon & Name */}
                <div className="flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: `${WRAPPER_COLORS[wrapper.type]}20`,
                    }}
                  >
                    {WRAPPER_ICONS[wrapper.type]}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {wrapper.type
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </h4>
                    {isCustom && (
                      <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {wrapper.description}
                  </p>

                  {/* Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-700">
                        Effort Percentage
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={wrapper.effortPercentage}
                          onChange={(e) =>
                            onUpdateWrapper(wrapper.id, {
                              effortPercentage: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 px-2 py-1 text-xs text-right border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={wrapper.effortPercentage}
                      onChange={(e) =>
                        onUpdateWrapper(wrapper.id, {
                          effortPercentage: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: WRAPPER_COLORS[wrapper.type],
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                {/* Calculated Values */}
                <div className="flex-shrink-0 text-right space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Effort</div>
                    <div className="text-sm font-bold text-gray-900">
                      {wrapper.calculatedEffort.toFixed(1)} PD
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Cost</div>
                    <div className="text-sm font-semibold text-green-600">
                      ${wrapper.calculatedCost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Hours</div>
                    <div className="text-xs font-medium text-gray-700">
                      {(wrapper.calculatedEffort * 8).toFixed(0)} hrs
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicable Phases */}
              <div className="mt-4 flex items-center gap-2">
                <Info className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Applies to:{" "}
                  {defaults.phases.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-600">Technical Base</div>
            <div className="text-lg font-bold text-gray-900">
              {technicalEffort.toFixed(0)} PD
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Wrapper Total</div>
            <div className="text-lg font-bold text-purple-600">
              {totalWrapperEffort.toFixed(0)} PD
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Grand Total</div>
            <div className="text-lg font-bold text-indigo-600">
              {(technicalEffort + totalWrapperEffort).toFixed(0)} PD
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Cost</div>
            <div className="text-lg font-bold text-green-600">
              ${totalWrapperCost.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
