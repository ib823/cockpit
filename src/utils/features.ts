// Feature flags for the application
export const FEATURES = {
  ENABLE_DRAG_DROP: false,
  ENABLE_EXPORT: false,
  ENABLE_ADVANCED_ANALYTICS: false,
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}