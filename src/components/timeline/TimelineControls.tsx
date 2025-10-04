"use client";

import { useState, useEffect } from "react";
import { useTimelineStore } from "@/stores/timeline-store";

export default function TimelineControls() {
  const {
    phases,
    profile,
    getProjectCost,
    getProjectStartDate,
    getProjectEndDate,
    clientPresentationMode,
    togglePresentationMode,
    setZoomLevel,
    zoomLevel,
  } = useTimelineStore();

  // Prevent hydration mismatch by only rendering dates on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe currency formatting
  const formatCurrency = (amount: any, region: string) => {
    const safeAmount = Number(amount) || 0;

    if (region === "ABSG") {
      return `SGD ${safeAmount.toLocaleString()}`;
    } else if (region === "ABVN") {
      return `VND ${safeAmount.toLocaleString()}`;
    }
    return `MYR ${safeAmount.toLocaleString()}`;
  };

  // Safe date formatting
  const formatDate = (date: any) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "TBD";
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const startDate = mounted && getProjectStartDate ? getProjectStartDate() : null;
  const endDate = mounted && getProjectEndDate ? getProjectEndDate() : null;
  const totalCost = getProjectCost ? getProjectCost() : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-semibold">{formatDate(startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="text-lg font-semibold">{formatDate(endDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Phases</p>
            <p className="text-lg font-semibold">{phases?.length || 0}</p>
          </div>
          {!clientPresentationMode && (
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalCost, profile?.region || "ABMY")}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {setZoomLevel && (
            <select
              value={zoomLevel || "weekly"}
              onChange={(e) => setZoomLevel(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}

          {togglePresentationMode && (
            <button
              onClick={togglePresentationMode}
              className={`px-4 py-2 rounded-lg ${
                clientPresentationMode ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {clientPresentationMode ? "Exit Presentation" : "Presentation Mode"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
