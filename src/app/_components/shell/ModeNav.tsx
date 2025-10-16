'use client';
import { useRouter, usePathname } from 'next/navigation';

const modes = [
  { id: 'capture', label: 'Capture', path: '/project/capture' },
  { id: 'decide', label: 'Decide', path: '/project/decide' },
  { id: 'plan', label: 'Plan', path: '/project/plan' },
  { id: 'present', label: 'Present', path: '/project/present' },
];

export const ModeNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-8 px-6">
        {modes.map((mode) => {
          const isActive = pathname === mode.path;
          return (
            <button
              key={mode.id}
              onClick={() => router.push(mode.path)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
