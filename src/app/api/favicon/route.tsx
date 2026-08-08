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

// Status plate configuration. Status is expressed by the PLATE colour only —
// the Brand spec's misuse list is explicit that the mark itself is never
// recoloured to signal status ("a red beacon reads as a product-wide alarm",
// "never recolour the dot"). Strokes follow the spec's surface rule: light
// strokes (#E9EEF6) on any plate darker than #4A4A4A, brand slate otherwise.
const STATUS_COLORS = {
  connected: {
    background: "#0B57D0", // dark plate → light strokes
    foreground: "#E9EEF6",
  },
  disconnected: {
    background: "#FF9500", // light plate → slate strokes
    foreground: "#3A5060",
  },
  none: {
    background: "#3A5060", // the app-icon rule: slate field, light strokes
    foreground: "#E9EEF6",
  },
} as const;

type Status = keyof typeof STATUS_COLORS;

const GOLD = "#E5C264";

/**
 * The Cockpit beacon at the Brand spec's construction (48-unit grid, ring
 * centre (24,21), radii 16/9/4, 44° gap, 180° inner arc, stem 28→41), in the
 * spec's SIZE RAMP — the mark sheds parts as it shrinks rather than being
 * scaled down, because "a 16px scaled mark turns the inner arc and the dot
 * into one grey blob":
 *
 *   ≥40px   full mark, stroke 2.5
 *   24–39   full mark, stroke 2.8
 *   20–23   inner arc drops; ring + stem + dot 4.6, stroke 3.2
 *   16–19   stem drops too; ring + dot 5.4, stroke 3.6
 *   <16     the dot alone, r 13, in the structure colour — not gold
 *
 * The dot is gold at every size that keeps structure, and is never recoloured
 * for status. The strokes take the plate-appropriate colour passed in.
 */
function CockpitMark({
  color,
  size: iconSize = 32,
}: {
  color: string;
  size?: number;
}) {
  const scale = iconSize * 0.72;

  let sw = 2.5;
  let dot = 4;
  let arc = true;
  let stem = true;
  let ring = true;

  if (iconSize < 16) {
    ring = arc = stem = false;
    dot = 13;
  } else if (iconSize < 20) {
    arc = stem = false;
    sw = 3.6;
    dot = 5.4;
  } else if (iconSize < 24) {
    arc = false;
    sw = 3.2;
    dot = 4.6;
  } else if (iconSize < 40) {
    sw = 2.8;
  }

  return (
    <svg
      width={scale}
      height={scale}
      viewBox="0 0 48 48"
      fill="none"
      style={{ display: "block" }}
    >
      {ring && (
        <path
          d="M 29.99 35.84 A 16 16 0 1 0 18.01 35.84"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {arc && (
        <path
          d="M 15 21 A 9 9 0 0 1 33 21"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
        />
      )}
      <circle cx="24" cy="21" r={dot} fill={ring ? GOLD : color} />
      {stem && (
        <path
          d="M 24 28 L 24 41"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
        />
      )}
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
        <CockpitMark color={colors.foreground} size={size} />
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
