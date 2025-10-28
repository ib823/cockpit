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
  name: "Keystone",
  tagline: "SAP Implementation Excellence",

  // Website and contact
  website: "https://keystone.com",
  email: "hello@keystone.com",

  // Social links (optional)
  social: {
    linkedin: "https://linkedin.com/company/keystone",
    twitter: "https://twitter.com/keystone",
    github: "https://github.com/keystone",
  },
} as const;

// ============================================================================
// LOGO CONFIGURATION
// ============================================================================

export const logo = {
  // Path to your logo files (place in /public folder)
  // Recommended formats: SVG (preferred), PNG (with transparency)
  light: "/logo-keystone.png",  // Logo for light backgrounds
  dark: "/logo-keystone.png",    // Logo for dark backgrounds (same logo works on both)
  icon: "/keystone-icon.png",    // Small icon/favicon

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
  alt: "Keystone Logo",
} as const;

// ============================================================================
// BRAND COLORS
// ============================================================================

export const brandColors = {
  // PRIMARY BRAND COLOR - Keystone Navy Blue
  // This will replace the default blue throughout the app
  primary: {
    50: "#e0f2fe",   // Lightest tint
    100: "#bae6fd",
    200: "#7dd3fc",
    300: "#38bdf8",
    400: "#0ea5e9",
    500: "#1e3a8a",  // Main brand color - Navy Blue
    600: "#1e40af",  // Darker for hover states
    700: "#1d4ed8",
    800: "#1e3a8a",
    900: "#172554",  // Darkest shade
  },

  // SECONDARY/ACCENT COLOR - Keystone Cyan
  // Complementary color for CTAs and highlights
  accent: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",  // Main accent - Cyan
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
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
