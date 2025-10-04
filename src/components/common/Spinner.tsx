import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { getAnimationDuration, prefersReducedMotion } from "@/lib/design-system";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function Spinner({ size = "md", className = "", label }: SpinnerProps) {
  const reducedMotion = prefersReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.div
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={reducedMotion ? {} : {
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className={className}
        role="status"
        aria-label={label || "Loading"}
      >
        <Loader2 className={`${sizeClasses[size]} ${reducedMotion ? 'opacity-75' : ''}`} />
      </motion.div>
      {label && (
        <span className="text-sm text-gray-600" aria-live="polite">
          {label}
        </span>
      )}
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
