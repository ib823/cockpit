import React from "react";
import Image from "next/image";
import { company, logo, getLogoPath, getLogoDimensions } from "@/config/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

/**
 * Company Logo Component
 *
 * Displays your company logo with proper sizing and theming.
 * Falls back to company name if logo file doesn't exist.
 */
export function Logo({
  size = "md",
  theme = "light",
  showText = true,
  className = "",
}: LogoProps) {
  const dimensions = getLogoDimensions(size);
  const logoPath = getLogoPath(theme);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo Image */}
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <Image
          src={logoPath}
          alt={logo.alt}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Company Name (optional) */}
      {showText && (
        <div className="flex flex-col">
          <span
            className="font-semibold text-gray-900"
            style={{
              fontSize: size === "sm" ? "14px" : size === "md" ? "18px" : "22px",
            }}
          >
            {company.name}
          </span>
          {size !== "sm" && (
            <span
              className="text-gray-600 text-xs"
              style={{
                fontSize: size === "md" ? "11px" : "12px",
              }}
            >
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
