/**
 * Dynamic Favicon API
 *
 * Generates favicons with status-based colors for the Cockpit brand.
 * Use ?status=connected|disconnected|none to change appearance.
 *
 * Status colors:
 * - connected: Blue (#0B57D0) - Active/online state
 * - disconnected: Amber (#FF9500) - Warning/offline state
 * - none/default: Dark (#0F172A) - Default brand state
 */

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Status color configuration
const STATUS_COLORS = {
  connected: {
    background: "#0B57D0", // Apple HIG Blue
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
 * The Cockpit mark: a beacon. Same geometry as public/logo-cockpit.svg,
 * drawn in the status foreground colour so it stays readable on every
 * status background.
 *
 * The favicon uses a heavier stroke than the full-size mark (34 vs 17 in a
 * 512 viewBox): at 16-32px a 17-unit stroke aliases into fog, and a favicon
 * that cannot be recognised in a tab strip is decoration. The gold point
 * keeps its brand colour except on the amber "disconnected" background,
 * where gold-on-amber has no contrast and the foreground colour takes over.
 */
function CockpitMark({
  color = "#FFFFFF",
  dotColor,
  size: iconSize = 32,
}: {
  color?: string;
  dotColor?: string;
  size?: number;
}) {
  const scale = iconSize * 0.72;

  return (
    <svg
      width={scale}
      height={scale}
      viewBox="0 0 512 512"
      fill="none"
      style={{ display: "block" }}
    >
      {/* Outer ring, broken at the base for the stem */}
      <path
        d="M 284.6 393.2 A 150 150 0 1 0 227.4 393.2"
        stroke={color}
        strokeWidth="34"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner arc */}
      <path
        d="M 176.2 283.2 A 88 88 0 1 1 335.8 283.2"
        stroke={color}
        strokeWidth="34"
        strokeLinecap="round"
        fill="none"
      />
      {/* The gold point */}
      <circle cx="256" cy="246" r="36" fill={dotColor ?? "#E3B54D"} />
      {/* Stem, through the break */}
      <path
        d="M 256 296 L 256 424"
        stroke={color}
        strokeWidth="34"
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
        <CockpitMark
          color={colors.foreground}
          // Gold on amber has no contrast; the disconnected state hands the
          // point to the foreground colour instead.
          dotColor={status === "disconnected" ? colors.foreground : undefined}
          size={size}
        />
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
