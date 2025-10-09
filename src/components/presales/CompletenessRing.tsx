"use client";

interface CompletenessRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CompletenessRing({ score, size = "md", showLabel = true }: CompletenessRingProps) {
  const radius = size === "sm" ? 16 : size === "md" ? 24 : 32;
  const strokeWidth = size === "sm" ? 2 : size === "md" ? 3 : 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  const getColor = (score: number) => {
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  const ringSize = size === "sm" ? "w-10 h-10" : size === "md" ? "w-14 h-14" : "w-18 h-18";

  return (
    <div className="flex items-center gap-4">
      <div className={`relative ${ringSize}`}>
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#E5E7EB"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getColor(score)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              transition: "stroke-dasharray 0.3s ease-in-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-bold text-gray-900 ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"}`}
          >
            {Math.round(score)}%
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="text-sm">
          <div className="font-medium text-gray-900">Completeness</div>
          <div
            className={`text-xs ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}
          >
            {score >= 80 ? "Ready to proceed" : score >= 60 ? "Almost ready" : "Needs attention"}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompletenessBar({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${getColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
