'use client';

import { usePresalesStore } from '@/stores/presales-store';

export function ModeSelector() {
  const { mode, setMode } = usePresalesStore();
  
  const modes: Array<{ value: typeof mode; label: string }> = [
    { value: 'capture', label: 'Capture' },
    { value: 'decide', label: 'Decide' },
    { value: 'plan', label: 'Plan' },
    { value: 'review', label: 'Review' },
    { value: 'present', label: 'Present' },
  ];
  
  return (
    <div className="flex items-center gap-1 text-sm">
      {modes.map((m, index) => (
        <div key={m.value} className="flex items-center">
          <button
            onClick={() => setMode(m.value)}
            className={`px-2 py-1 rounded cursor-pointer transition-colors ${
              mode === m.value 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {m.label}
          </button>
          {index < modes.length - 1 && (
            <span className="text-gray-400 mx-1">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
