/**
 * Dynamic Favicon API
 *
 * Generates favicons with status-based colors for Keystone brand.
 * Use ?status=connected|disconnected|none to change appearance.
 *
 * Status colors:
 * - connected: Blue (#2563EB) - Active/online state
 * - disconnected: Amber (#F59E0B) - Warning/offline state
 * - none/default: Dark (#0F172A) - Default brand state
 */

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Status color configuration
const STATUS_COLORS = {
  connected: {
    background: "#2563EB", // Blue
    foreground: "#FFFFFF", // White
  },
  disconnected: {
    background: "#F59E0B", // Amber
    foreground: "#1C1917", // Dark (for contrast)
  },
  none: {
    background: "#0F172A", // Slate dark
    foreground: "#FFFFFF", // White
  },
} as const;

type Status = keyof typeof STATUS_COLORS;

/**
 * Custom K letterform SVG - Keystone brand mark
 *
 * Clean, bold, recognizable K design:
 * - Thick vertical stem on the left
 * - Upper arm: diagonal from middle-left to top-right
 * - Lower arm: diagonal from middle-left to bottom-right
 */
function KeystoneK({
  color = "#FFFFFF",
  size: iconSize = 32,
}: {
  color?: string;
  size?: number;
}) {
  // Scale the K to fit nicely within the icon with padding
  const scale = iconSize * 0.65;

  return (
    <svg
      width={scale}
      height={scale}
      viewBox="0 0 100 100"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Vertical stem */}
      <rect x="10" y="5" width="22" height="90" />

      {/* Upper diagonal arm */}
      <polygon points="32,50 32,35 90,5 90,25 50,50" />

      {/* Lower diagonal arm */}
      <polygon points="32,50 32,65 90,95 90,75 50,50" />
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
        <KeystoneK color={colors.foreground} size={size} />
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
