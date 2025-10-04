'use client';

import { useEADiagramStore } from '@/stores/ea-diagram-store';
import { ChevronLeft, Package2 } from 'lucide-react';
import { useState } from 'react';
import { useEAContext } from './EAProvider';

export function EAFloatingWidget() {
  const { isPanelOpen, openPanel } = useEAContext();
  const { nodes } = useEADiagramStore();
  const [showPreview, setShowPreview] = useState(false);

  // Don't show if panel is open or on EA diagram page
  if (isPanelOpen || typeof window !== 'undefined' && window.location.pathname === '/ea-diagram') {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* Preview on hover */}
      {showPreview && nodes.length > 0 && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-2xl border p-3 mb-2">
          <div className="text-xs text-gray-500 mb-2">Current Architecture</div>
          <div className="space-y-1">
            {nodes.slice(0, 5).map((node) => (
              <div key={node.id} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 truncate">{node.data.name}</span>
              </div>
            ))}
            {nodes.length > 5 && (
              <div className="text-xs text-gray-400 ml-4">
                +{nodes.length - 5} more modules
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={openPanel}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className="group relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        <Package2 className="w-6 h-6" />
        
        {/* Badge */}
        {nodes.length > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
            {nodes.length}
          </div>
        )}

        {/* Tooltip */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          View Architecture
          <ChevronLeft className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 -mr-4" />
        </div>
      </button>
    </div>
  );
}