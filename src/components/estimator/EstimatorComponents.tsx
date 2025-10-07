/**
 * ESTIMATOR UI COMPONENTS
 *
 * Shared components for Estimator and Whiteboard pages:
 * - StatCard: Small metric display
 * - BarItem: Pareto bar chart item
 * - TornadoDiagram: Sensitivity analysis visualization
 * - BenchmarkChart: Histogram comparison
 * - ConfidenceMeter: 0-100% gauge
 * - MetricCard: Icon + label + value
 */

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import React from 'react';

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: string;
  color: 'purple' | 'orange' | 'green' | 'gray' | 'blue';
}

export function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200'
  };

  const textClasses = {
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    green: 'text-green-700',
    gray: 'text-gray-700',
    blue: 'text-blue-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className={`text-xs font-medium mb-1 ${textClasses[color]}`}>{label}</div>
      <div className={`text-xl font-bold ${textClasses[color]}`}>{value}</div>
    </div>
  );
}

// ============================================================================
// BAR ITEM (Pareto)
// ============================================================================

interface BarItemProps {
  label: string;
  value: number; // Percentage
  color: 'blue' | 'purple' | 'orange' | 'gray' | 'green';
}

export function BarItem({ label, value, color }: BarItemProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-8 bg-gray-100 rounded overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TORNADO DIAGRAM
// ============================================================================

interface TornadoDiagramProps {
  baseValue: number;
  factors: Array<{
    name: string;
    low: number; // Delta from baseline (negative)
    high: number; // Delta from baseline (positive)
  }>;
}

export function TornadoDiagram({ baseValue, factors }: TornadoDiagramProps) {
  return (
    <div className="space-y-4">
      {factors.map((factor, index) => {
        const totalRange = Math.abs(factor.low) + factor.high;
        const widthPercent = (totalRange / (baseValue * 0.4)) * 100; // Scale to 40% max
        const leftOffset = 50 - (Math.abs(factor.low) / (baseValue * 0.4)) * 50;

        return (
          <div key={factor.name} className="relative">
            <div className="text-sm font-medium text-gray-700 mb-2">{factor.name}</div>
            <div className="flex items-center gap-2">
              <div className="w-12 text-right text-xs text-gray-500">
                {baseValue + factor.low}
              </div>
              <div className="flex-1 h-8 bg-gray-100 rounded relative">
                {/* Center line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-gray-400" />
                </div>
                {/* Tornado bar */}
                <motion.div
                  className="absolute h-full bg-gradient-to-r from-red-400 to-green-400 rounded"
                  style={{
                    width: `${Math.min(widthPercent, 100)}%`,
                    left: `${leftOffset}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(widthPercent, 100)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
              <div className="w-12 text-left text-xs text-gray-500">
                {baseValue + factor.high}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// BENCHMARK CHART
// ============================================================================

interface BenchmarkChartProps {
  yourEstimate: number;
  benchmarks: number[];
}

export function BenchmarkChart({ yourEstimate, benchmarks }: BenchmarkChartProps) {
  const allValues = [...benchmarks, yourEstimate];
  const max = Math.max(...allValues);

  return (
    <div className="mb-8">
      <div className="flex items-end gap-2 h-48">
        {benchmarks.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <motion.div
              className={`w-full rounded-t ${
                value === yourEstimate ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              style={{ height: `${(value / max) * 100}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${(value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            <div className="text-xs text-gray-600 mt-2">{value}</div>
            {value === yourEstimate && (
              <div className="text-xs font-semibold text-blue-600 mt-1">You</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONFIDENCE METER
// ============================================================================

interface ConfidenceMeterProps {
  value: number; // 0-100
  label?: string;
}

export function ConfidenceMeter({ value, label = 'Confidence Level' }: ConfidenceMeterProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Based on historical data and project similarity analysis.
      </p>
    </div>
  );
}

// ============================================================================
// METRIC CARD (with icon)
// ============================================================================

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

export function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// ============================================================================
// REGRESSION TABLE
// ============================================================================

interface RegressionTableProps {
  variables: Array<{
    name: string;
    beta: number;
    pValue: number;
    confidenceInterval: [number, number];
    significant: boolean;
  }>;
}

export function RegressionTable({ variables }: RegressionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="text-left py-2 px-3 font-medium text-gray-700">Variable</th>
            <th className="text-left py-2 px-3 font-medium text-gray-700">β</th>
            <th className="text-left py-2 px-3 font-medium text-gray-700">p-value</th>
            <th className="text-left py-2 px-3 font-medium text-gray-700">95% CI</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable, i) => (
            <tr key={variable.name} className="border-b border-gray-100">
              <td className="py-3 px-3">{variable.name}</td>
              <td className="py-3 px-3 font-mono">{variable.beta.toFixed(3)}</td>
              <td className="py-3 px-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    variable.significant
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {variable.pValue < 0.001 ? '<0.001' : variable.pValue.toFixed(3)}
                </span>
              </td>
              <td className="py-3 px-3 font-mono">
                [{variable.confidenceInterval[0].toFixed(3)}, {variable.confidenceInterval[1].toFixed(3)}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// TOOLTIP WRAPPER
// ============================================================================

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </motion.div>
      )}
    </span>
  );
}

// ============================================================================
// ACCORDION (Collapsible Sections)
// ============================================================================

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-4 border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <motion.svg
          className="w-4 h-4 text-gray-600"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-4 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
