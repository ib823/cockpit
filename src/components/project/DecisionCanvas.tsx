// src/components/project/DecisionCanvas.tsx
"use client";

import { DecisionBar } from "@/components/presales/DecisionBar";

export function DecisionCanvas() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <DecisionBar />
      </div>
    </div>
  );
}
