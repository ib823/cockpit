/**
 * Spinner Component - 3D Cube Spinner
 *
 * This component uses the new 3D rotating cube animation
 */

import React from "react";
import { CubeSpinner } from "./CubeSpinner";

interface SpinnerProps {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

export function Spinner({ size = "md", className = "", label }: SpinnerProps) {
  const pixelSize = typeof size === "number" ? size : sizeMap[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <CubeSpinner size={pixelSize} />
      {label && <span className="text-sm text-gray-600 mt-1">{label}</span>}
    </div>
  );
}

export function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <Spinner size="lg" label={label} />
      </div>
    </div>
  );
}
