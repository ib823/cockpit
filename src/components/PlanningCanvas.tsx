"use client";

import { useState } from "react";

const PHASES = ["Prepare", "Explore", "Realize", "Deploy", "Run"];
const STREAMS = ["PMO", "Finance", "HR", "Supply Chain", "Integration", "Data", "Testing", "OCM"];

export default function PlanningCanvas() {
  const [, setSelectedCell] = useState<{ stream: string; phase: string } | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border bg-gray-50 px-4 py-2 text-left text-sm font-medium">Stream</th>
            {PHASES.map((phase) => (
              <th
                key={phase}
                className="border bg-gray-50 px-4 py-2 text-center text-sm font-medium"
              >
                {phase}
              </th>
            ))}
            <th className="border bg-gray-50 px-4 py-2 text-center text-sm font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {STREAMS.map((stream) => (
            <tr key={stream}>
              <td className="border px-4 py-2 text-sm font-medium">{stream}</td>
              {PHASES.map((phase) => (
                <td
                  key={`${stream}-${phase}`}
                  className="border px-2 py-1 text-center hover:bg-blue-50 cursor-pointer"
                  onClick={() => setSelectedCell({ stream, phase })}
                >
                  <input
                    type="number"
                    min="0"
                    className="w-16 px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </td>
              ))}
              <td className="border bg-gray-50 px-4 py-2 text-center text-sm font-semibold">0d</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="border bg-gray-100 px-4 py-2 text-sm font-semibold">Total</td>
            {PHASES.map((phase) => (
              <td
                key={phase}
                className="border bg-gray-100 px-4 py-2 text-center text-sm font-semibold"
              >
                0d
              </td>
            ))}
            <td className="border bg-gray-200 px-4 py-2 text-center text-sm font-bold">0d</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
