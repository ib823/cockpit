export const FEATURES = {
  ENABLE_PDF_EXPORT: process.env.NEXT_PUBLIC_ENABLE_PDF === "true",
  ENABLE_BAHASA_PATTERNS: true, // Always on after implementation
  ENABLE_MULTIPLIERS: true,
  ENABLE_RESOURCE_DRAG_DROP: false, // TODO: Phase 2
  ENABLE_TELEMETRY: process.env.NODE_ENV === "production",
};
