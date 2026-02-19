/**
 * Animated Loading Spinner - From Uiverse.io
 * Source: https://uiverse.io/alexruix/white-cat-50
 *
 * Beautiful bouncing cube animation with shadow effect
 * Replaces Loader2 from lucide-react with a more visually appealing spinner
 *
 * Features:
 * - Pure CSS animations (no JS dependencies)
 * - Accessible (ARIA labels, reduced motion support)
 * - Responsive sizing
 * - Customizable colors
 */

import React from "react";

interface AnimatedSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
  color?: "blue" | "white" | "gray" | "purple" | "green" | "red";
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

const colorMap = {
  blue: "#007AFF",
  white: "#FFFFFF",
  gray: "#8E8E93",
  purple: "#AF52DE",
  green: "#34C759",
  red: "#FF3B30",
};

export function AnimatedSpinner({
  size = "md",
  className = "",
  label,
  color = "blue",
}: AnimatedSpinnerProps) {
  const pixelSize = sizeMap[size];
  const spinnerColor = colorMap[color];
  const shadowColor = `${spinnerColor}50`; // Add 50% opacity to shadow

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className="bouncing-cube-loader"
        role="status"
        aria-label={label || "Loading"}
        style={{
          width: pixelSize,
          height: pixelSize,
          margin: "auto",
          position: "relative",
        }}
      >
        {/* Shadow */}
        <div
          style={{
            content: '""',
            width: pixelSize,
            height: pixelSize * 0.1,
            background: shadowColor,
            position: "absolute",
            top: pixelSize * 1.25,
            left: 0,
            borderRadius: "50%",
            animation: "shadow324 0.5s linear infinite",
          }}
        />
        {/* Cube */}
        <div
          style={{
            content: '""',
            width: "100%",
            height: "100%",
            background: spinnerColor,
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: "4px",
            animation: "jump7456 0.5s linear infinite",
          }}
        />

        <style jsx>{`
          @keyframes jump7456 {
            15% {
              border-bottom-right-radius: 3px;
            }

            25% {
              transform: translateY(${pixelSize * 0.1875}px) rotate(22.5deg);
            }

            50% {
              transform: translateY(${pixelSize * 0.375}px) scale(1, 0.9) rotate(45deg);
              border-bottom-right-radius: 40px;
            }

            75% {
              transform: translateY(${pixelSize * 0.1875}px) rotate(67.5deg);
            }

            100% {
              transform: translateY(0) rotate(90deg);
            }
          }

          @keyframes shadow324 {
            0%,
            100% {
              transform: scale(1, 1);
            }

            50% {
              transform: scale(1.2, 1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .bouncing-cube-loader > div {
              animation: none !important;
              transform: rotate(0deg);
            }
          }
        `}</style>
      </div>
      {label && (
        <span className="text-sm text-gray-600 mt-2" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Alternative Dot Spinner - For variety
 * Three bouncing dots animation
 */
export function DotSpinner({
  size = "md",
  className = "",
  color = "blue",
}: Omit<AnimatedSpinnerProps, "label">) {
  const dotSize = sizeMap[size] / 4;
  const spinnerColor = colorMap[color];

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: spinnerColor,
            borderRadius: "50%",
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Pulse Spinner - Expanding circle
 */
export function PulseSpinner({
  size = "md",
  className = "",
  color = "blue",
}: Omit<AnimatedSpinnerProps, "label">) {
  const pixelSize = sizeMap[size];
  const spinnerColor = colorMap[color];

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
      style={{
        width: pixelSize,
        height: pixelSize,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: `3px solid ${spinnerColor}`,
          animation: "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          backgroundColor: spinnerColor,
          animation: "pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite",
        }}
      />
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.33);
            opacity: 1;
          }
          80%,
          100% {
            opacity: 0;
          }
        }

        @keyframes pulse-dot {
          0%,
          100% {
            transform: scale(0);
          }
          50% {
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Spinner Overlay - Full screen loading overlay
 */
export function SpinnerOverlay({
  label,
  variant = "default",
}: {
  label?: string;
  variant?: "default" | "dots" | "pulse";
}) {
  const SpinnerComponent =
    variant === "dots" ? DotSpinner : variant === "pulse" ? PulseSpinner : AnimatedSpinner;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        {variant === "default" ? (
          <AnimatedSpinner size="lg" label={label} />
        ) : (
          <>
            <SpinnerComponent size="lg" />
            {label && (
              <p className="text-sm text-gray-600 mt-4 text-center animate-pulse">{label}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
