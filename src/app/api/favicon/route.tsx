/**
 * Dynamic Favicon API
 *
 * Generates favicons with status-based colors for Bound brand.
 * Use ?status=connected|disconnected|none to change appearance.
 *
 * Status colors:
 * - connected: Blue (#007AFF) - Active/online state
 * - disconnected: Amber (#FF9500) - Warning/offline state
 * - none/default: Dark (#0F172A) - Default brand state
 */

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Status color configuration
const STATUS_COLORS = {
  connected: {
    background: "#007AFF", // Apple HIG Blue
    foreground: "#FFFFFF", // White
  },
  disconnected: {
    background: "#FF9500", // Apple HIG Orange
    foreground: "#1C1917", // Dark (for contrast)
  },
  none: {
    background: "#0F172A", // Slate dark
    foreground: "#FFFFFF", // White
  },
} as const;

type Status = keyof typeof STATUS_COLORS;

/**
 * Bound ≈ mark - two parallel wave strokes
 *
 * Clean, bold, recognizable ≈ design:
 * - Two parallel sinusoidal curves
 * - Optically centered in the container
 * - Gentle wave (Apple-like restraint)
 */
function BoundMark({
  color = "#FFFFFF",
  size: iconSize = 32,
}: {
  color?: string;
  size?: number;
}) {
  const scale = iconSize * 0.65;

  return (
    <svg
      width={scale}
      height={scale}
      viewBox="0 0 100 100"
      fill="none"
      style={{ display: "block" }}
    >
      {/* Top wave stroke */}
      <path
        d="M15 38 C25 24, 40 24, 50 38 C60 52, 75 52, 85 38"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom wave stroke */}
      <path
        d="M15 62 C25 48, 40 48, 50 62 C60 76, 75 76, 85 62"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse and validate status parameter
  const statusParam = searchParams.get("status") || "none";
  const status: Status =
    statusParam === "connected" || statusParam === "disconnected"
      ? statusParam
      : "none";

  // Parse size parameter (default 32, max 512 for security)
  const sizeParam = searchParams.get("size");
  const size = Math.min(Math.max(parseInt(sizeParam || "32", 10) || 32, 16), 512);

  // Calculate border radius based on size
  const borderRadius = Math.round(size * 0.1875); // ~6px at 32px

  const colors = STATUS_COLORS[status];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <BoundMark color={colors.foreground} size={size} />
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        // Cache for 1 hour, stale-while-revalidate for 1 day
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
