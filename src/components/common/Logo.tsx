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
 */
export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold rounded-lg ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {company.name.charAt(0)}
    </div>
  );
}
