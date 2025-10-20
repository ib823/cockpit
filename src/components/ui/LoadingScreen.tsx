'use client';
import { GhostLoader } from '@/components/common';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <GhostLoader />
        <p className="mt-4 text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}
