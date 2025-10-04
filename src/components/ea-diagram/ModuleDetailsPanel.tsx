'use client';

import { DollarSign, Package2, X, Zap } from 'lucide-react';
import { Node } from 'reactflow';

interface ModuleDetailsPanelProps {
  node: Node | null;
  onClose: () => void;
}

export function ModuleDetailsPanel({ node, onClose }: ModuleDetailsPanelProps) {
  if (!node) return null;

  const data = node.data;

  return (
    <div className="absolute top-20 right-6 w-96 bg-white rounded-lg shadow-2xl border z-40">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Package2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{data.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Category */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
          <p className="text-sm font-medium text-gray-900 mt-1">{data.category}</p>
        </div>

        {/* Description */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
          <p className="text-sm text-gray-700 mt-1">{data.description}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Effort</span>
            </div>
            <p className="text-lg font-bold text-green-900">{data.baseEffort} PD</p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">Complexity</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{data.complexity}×</p>
          </div>
        </div>

        {/* Dependencies */}
        {data.dependencies && data.dependencies.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Dependencies</span>
            <div className="mt-2 space-y-1">
              {data.dependencies.map((dep: string) => (
                <div key={dep} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {dep}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Path */}
        {data.criticalPath && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800">
              <strong>⚠️ Critical Path:</strong> This module is on the critical path and may impact timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}