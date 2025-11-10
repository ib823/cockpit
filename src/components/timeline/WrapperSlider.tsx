"use client";

import { Wrapper, WrapperCalculation } from "@/types/wrappers";
import { useWrappersStore } from "@/stores/wrappers-store";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as Slider from "@radix-ui/react-slider";

interface WrapperSliderProps {
  wrapper: Wrapper;
  calculation?: WrapperCalculation;
}

export function WrapperSlider({ wrapper, calculation }: WrapperSliderProps) {
  const { setWrapperPercentage, resetWrapper } = useWrappersStore();

  const hasChanged = wrapper.currentPercentage !== wrapper.defaultPercentage;

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wrapper.color }} />
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{wrapper.name}</h4>
            <p className="text-xs text-gray-500">{wrapper.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Percentage display */}
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {wrapper.currentPercentage.toFixed(0)}%
            </div>
            {calculation && (
              <div className="text-xs text-gray-600">{calculation.wrapperEffort.toFixed(0)} PD</div>
            )}
          </div>

          {/* Reset button */}
          {hasChanged && (
            <button
              onClick={() => resetWrapper(wrapper.id)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[wrapper.currentPercentage]}
          onValueChange={(value) => setWrapperPercentage(wrapper.id, value[0])}
          max={50}
          min={0}
          step={1}
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
            <Slider.Range
              className="absolute h-full rounded-full"
              style={{ backgroundColor: wrapper.color }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 rounded-full shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ borderColor: wrapper.color, "--tw-ring-color": wrapper.color } as any}
            aria-label={`${wrapper.name} percentage`}
          />
        </Slider.Root>
      </div>

      {/* Footer: Effort and Cost */}
      {calculation && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500">Effort: </span>
              <span className="font-semibold text-gray-900">
                {calculation.wrapperEffort.toFixed(1)} PD
              </span>
            </div>
            <div>
              <span className="text-gray-500">Cost: </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(calculation.wrapperCost, "MYR")}
              </span>
            </div>
          </div>

          {/* SAP Activate phase badge */}
          <div
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${wrapper.color}20`,
              color: wrapper.color,
            }}
          >
            {wrapper.sapActivatePhase}
          </div>
        </div>
      )}

      {/* Change indicator */}
      {hasChanged && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-blue-600 font-medium"
        >
          Modified from {wrapper.defaultPercentage}% default
        </motion.div>
      )}
    </div>
  );
}
