"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SAP Implementation Cockpit
          </h1>
          <p className="text-xl text-gray-600">
            Intelligent tools for SAP project planning and execution
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Presales Card */}
          <Link href="/presales" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Presales Engine
              </h2>
              <p className="text-gray-600">
                Extract requirements from RFPs and generate intelligent proposals
              </p>
            </div>
          </Link>
          
          {/* Timeline Card */}
          <Link href="/timeline" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                Timeline Builder
              </h2>
              <p className="text-gray-600">
                Visual project timeline with resource planning and cost calculation
              </p>
            </div>
          </Link>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Version 0.1.0 | Built with Next.js & TypeScript
          </p>
        </div>
      </div>
    </main>
  );
}
