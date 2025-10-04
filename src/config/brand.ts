/**
 * BRAND CONFIGURATION
 *
 * Customize this file to match your company's brand identity.
 * All colors, logos, and theme settings in one place.
 */

// ============================================================================
// COMPANY INFORMATION
// ============================================================================

export const company = {
  name: "SAP Cockpit",
  tagline: "SAP Implementation Excellence",

  // Website and contact
  website: "https://sapcockpit.com",
  email: "hello@sapcockpit.com",

  // Social links (optional)
  social: {
    linkedin: "https://linkedin.com/company/sap-cockpit",
    twitter: "https://twitter.com/sapcockpit",
    github: "https://github.com/sapcockpit",
  },
} as const;

// ============================================================================
// LOGO CONFIGURATION
// ============================================================================

export const logo = {
  // Path to your logo files (place in /public folder)
  // Recommended formats: SVG (preferred), PNG (with transparency)
  light: "/logo-light.svg",  // Logo for light backgrounds
  dark: "/logo-dark.svg",    // Logo for dark backgrounds
  icon: "/icon.svg",         // Small icon/favicon

  // Logo dimensions (adjust to your logo's aspect ratio)
  width: {
    sm: "120px",   // Small screens, mobile
    md: "160px",   // Medium screens, tablets
    lg: "200px",   // Large screens, desktop
  },

  height: {
    sm: "32px",
    md: "40px",
    lg: "48px",
  },

  // Alt text for accessibility
  alt: "Your Company Logo",
} as const;

// ============================================================================
// BRAND COLORS
// ============================================================================

export const brandColors = {
  // PRIMARY BRAND COLOR
  // This will replace the default blue throughout the app
  primary: {
    50: "#eff6ff",   // Lightest tint
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",  // Main brand color
    600: "#2563eb",  // Darker for hover states
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",  // Darkest shade
  },

  // SECONDARY/ACCENT COLOR
  // Complementary color for CTAs and highlights
  accent: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",  // Main accent
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },

  // SUCCESS COLOR (keep green for positive actions)
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
  },

  // WARNING COLOR (keep yellow/orange for warnings)
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
  },

  // ERROR COLOR (keep red for errors)
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },
} as const;

// ============================================================================
// EMOJI/ICON PREFERENCES
// ============================================================================

export const icons = {
  // Use emojis throughout the app?
  useEmojis: true,

  // Custom emoji mappings (replace with your preferences)
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  loading: "⏳",
  celebration: "🎉",
  rocket: "🚀",
  sparkles: "✨",
  checkmark: "✓",

  // Or use icon library instead (lucide-react, heroicons, etc.)
  // iconLibrary: "lucide-react",
} as const;

// ============================================================================
// THEME PREFERENCES
// ============================================================================

export const theme = {
  // Default theme mode
  defaultMode: "light" as "light" | "dark" | "system",

  // Allow users to switch themes?
  allowThemeToggle: true,

  // Border radius (rounded corners)
  borderRadius: "modern" as "sharp" | "modern" | "rounded",
  // sharp = no rounded corners
  // modern = subtle rounded (8-12px)
  // rounded = very rounded (16-24px)

  // Font preferences
  fontFamily: {
    // Headings - make it bold and impactful
    heading: "system-ui, -apple-system, sans-serif",

    // Body text - optimized for readability
    body: "system-ui, -apple-system, sans-serif",

    // Monospace - for code/numbers
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
  },

  // Shadows (depth/elevation)
  shadows: "subtle" as "none" | "subtle" | "pronounced",
  // none = flat design
  // subtle = soft shadows
  // pronounced = strong elevation
} as const;

// ============================================================================
// REGION-SPECIFIC SETTINGS
// ============================================================================

export const regions = {
  // Default region
  default: "ABMY" as "ABMY" | "ABSG" | "ABVN",

  // Customize region labels
  labels: {
    ABMY: "🇲🇾 Malaysia",
    ABSG: "🇸🇬 Singapore",
    ABVN: "🇻🇳 Vietnam",
  },

  // Show flags in UI?
  showFlags: true,
} as const;

// ============================================================================
// CUSTOMIZATION HELPER FUNCTIONS
// ============================================================================

/**
 * Get Tailwind color class for primary brand color
 */
export function getPrimaryColorClass(shade: keyof typeof brandColors.primary = 600) {
  // Map your brand color to Tailwind classes
  // This requires updating tailwind.config.ts with your brand colors
  return `bg-primary-${shade}`;
}

/**
 * Get CSS color value for primary brand color
 */
export function getPrimaryColor(shade: keyof typeof brandColors.primary = 600): string {
  return brandColors.primary[shade];
}

/**
 * Get logo path based on theme mode
 */
export function getLogoPath(mode: "light" | "dark" = "light"): string {
  return mode === "dark" ? logo.dark : logo.light;
}

/**
 * Get logo dimensions based on screen size
 */
export function getLogoDimensions(size: "sm" | "md" | "lg" = "md") {
  return {
    width: logo.width[size],
    height: logo.height[size],
  };
}
