'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Package2, Trash2, Info } from 'lucide-react';

interface ModuleNodeData {
  id: string;
  name: string;
  category: string;
  baseEffort: number;
  complexity: number;
  status?: 'in-scope' | 'future' | 'excluded';
}

export const ModuleNode = memo(({ data, selected }: NodeProps<ModuleNodeData>) => {
  const statusColors = {
    'in-scope': 'border-blue-500 bg-blue-50',
    'future': 'border-orange-500 bg-orange-50',
    'excluded': 'border-gray-300 bg-gray-50',
  };

  const statusColor = statusColors[data.status || 'in-scope'];

  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 ${
        selected ? 'ring-2 ring-blue-400' : ''
      } ${statusColor} min-w-[200px] transition-all hover:shadow-xl`}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-500"
      />
      
      <div className="flex items-start gap-2">
        <Package2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {data.name}
          </div>
          <div className="text-xs text-gray-500">
            {data.category}
          </div>
          
          {/* Metrics */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
              {data.baseEffort} PD
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
              {data.complexity}×
            </span>
          </div>
        </div>
        
        <button
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Will add delete handler in next milestone
          }}
        >
          <Info className="w-4 h-4 text-gray-400 hover:text-blue-600" />
        </button>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
});

ModuleNode.displayName = 'ModuleNode';