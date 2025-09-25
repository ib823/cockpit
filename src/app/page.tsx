'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          SAP Timeline Manager
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Professional milestone management for SAP implementation projects
        </p>
        <Link 
          href="/timeline"
          className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Open Timeline →
        </Link>
        <div className="mt-6 text-sm text-gray-500 text-center">
          Features: Milestone markers • Real-time editing • Professional UX
        </div>
      </div>
    </div>
  );
}
