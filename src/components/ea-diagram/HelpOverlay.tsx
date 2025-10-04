'use client';

import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

export function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border z-50">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Keyboard Shortcuts</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Delete module</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Clear diagram</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ K</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Zoom to fit</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ 0</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pan canvas</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space + Drag</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Select module</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Click</kbd>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border-t">
        <p className="text-xs text-blue-800">
          <strong>💡 Pro Tip:</strong> Drag modules from the left sidebar onto the canvas. Dependencies are auto-drawn!
        </p>
      </div>
    </div>
  );
}