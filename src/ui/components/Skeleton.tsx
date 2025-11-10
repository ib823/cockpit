import React from "react";
import clsx from "clsx";

const Shimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      "relative overflow-hidden rounded-[var(--r-sm)] bg-[var(--canvas)] border border-[var(--line)]",
      className
    )}
  >
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.4s_infinite]"
      style={{ backgroundSize: "468px 100%" }}
    />
    <style jsx>{`
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </div>
);

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => (
  <div className={clsx("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Shimmer key={i} className={clsx("h-3", i === lines - 1 && "w-2/3")} />
    ))}
  </div>
);

export interface SkeletonRectProps {
  className?: string;
}

export const SkeletonRect: React.FC<SkeletonRectProps> = ({ className }) => (
  <Shimmer className={clsx("h-24 w-full", className)} />
);

export interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size = 40, className }) => (
  <div
    className={clsx(
      "relative overflow-hidden rounded-full bg-[var(--canvas)] border border-[var(--line)]",
      className
    )}
    style={{ width: size, height: size }}
  >
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.4s_infinite]"
      style={{ backgroundSize: "468px 100%" }}
    />
    <style jsx>{`
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </div>
);
