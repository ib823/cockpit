"use client";

import { EACanvas } from '@/components/ea-diagram/EACanvas';
import { ExportMenu } from '@/components/ea-diagram/ExportMenu';
import { Sparkles } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';

function EADiagramPageInner() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Enterprise Architecture Diagram
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual representation of your SAP solution architecture
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu />

          <button
            onClick={() => {
              // Trigger generate from canvas
              const event = new CustomEvent('generate-from-chips');
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-4 h-4" />
            Generate from RFP
          </button>
        </div>
      </header>
      <EACanvas />
    </div>
  );
}

export default function EADiagramPage() {
  return (
    <ReactFlowProvider>
      <EADiagramPageInner />
    </ReactFlowProvider>
  );
}