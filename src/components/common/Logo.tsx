import React from "react";
import Image from "next/image";
import { company, logo, getLogoPath, getLogoDimensions } from "@/config/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

const textSizeClass = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-[22px]",
} as const;

const taglineSizeClass = {
  md: "text-[11px]",
  lg: "text-xs",
} as const;

/**
 * Company Logo Component
 *
 * Displays your company logo with proper sizing and theming.
 * Falls back to company name if logo file doesn't exist.
 */
export function Logo({ size = "md", theme = "light", showText = true, className = "" }: LogoProps) {
  const dimensions = getLogoDimensions(size);
  const logoPath = getLogoPath(theme);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo Image */}
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <Image src={logoPath} alt={logo.alt} fill className="object-contain" priority />
      </div>

      {/* Company Name (optional) */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-semibold text-[var(--color-text-primary)] ${textSizeClass[size]}`}>
            {company.name}
          </span>
          {size !== "sm" && (
            <span className={`text-[var(--color-text-secondary)] ${taglineSizeClass[size as "md" | "lg"]}`}>
              {company.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Logo Icon Only (for favicons, mobile nav, etc.)
 * Renders ≈ mark in a clean rounded square
 */
export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-[#007AFF] text-white rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M15 38 C25 24, 40 24, 50 38 C60 52, 75 52, 85 38"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M15 62 C25 48, 40 48, 50 62 C60 76, 75 76, 85 62"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
