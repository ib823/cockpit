/**
 * User Preferences Store
 *
 * Manages user interface preferences including expert mode, display settings,
 * and other personalization options. Persisted to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type LanguageCode = "en" | "zh" | "de" | "es";
export type AccentColor = "blue" | "purple" | "green" | "orange" | "red" | "teal";
export type DensityMode = "compact" | "comfortable" | "spacious";

interface PreferencesState {
  // UI Mode
  expertMode: boolean;
  showFormulas: boolean;
  showTooltips: boolean;

  // Display
  theme: ThemeMode;
  language: LanguageCode;
  compactMode: boolean;
  accentColor: AccentColor;
  densityMode: DensityMode;

  // Estimator Defaults
  defaultProfile: string;
  autoCalculate: boolean;
  showUncertaintyAnalysis: boolean;
  showSensitivityAnalysis: boolean;

  // Timeline Preferences
  timelineAutoSync: boolean;
  showResourceAllocations: boolean;
  highlightCriticalPath: boolean;

  // Notifications
  showNotifications: boolean;
  playSounds: boolean;

  // Actions
  toggleExpertMode: () => void;
  setShowFormulas: (show: boolean) => void;
  setShowTooltips: (show: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
  setCompactMode: (compact: boolean) => void;
  setAccentColor: (color: AccentColor) => void;
  setDensityMode: (mode: DensityMode) => void;
  setDefaultProfile: (profile: string) => void;
  setAutoCalculate: (auto: boolean) => void;
  setShowUncertaintyAnalysis: (show: boolean) => void;
  setShowSensitivityAnalysis: (show: boolean) => void;
  setTimelineAutoSync: (auto: boolean) => void;
  setShowResourceAllocations: (show: boolean) => void;
  setHighlightCriticalPath: (highlight: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setPlaySounds: (play: boolean) => void;
  resetToDefaults: () => void;
}

const defaultState = {
  // UI Mode
  expertMode: false,
  showFormulas: false,
  showTooltips: true,

  // Display
  theme: "system" as ThemeMode,
  language: "en" as LanguageCode,
  compactMode: false,
  accentColor: "blue" as AccentColor,
  densityMode: "comfortable" as DensityMode,

  // Estimator Defaults
  defaultProfile: "malaysia-mid-market",
  autoCalculate: true,
  showUncertaintyAnalysis: true,
  showSensitivityAnalysis: true,

  // Timeline Preferences
  timelineAutoSync: true,
  showResourceAllocations: true,
  highlightCriticalPath: true,

  // Notifications
  showNotifications: true,
  playSounds: false,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,

      toggleExpertMode: () =>
        set((state) => ({
          expertMode: !state.expertMode,
          // Auto-enable advanced features in expert mode
          showFormulas: !state.expertMode ? true : state.showFormulas,
          showUncertaintyAnalysis: !state.expertMode ? true : state.showUncertaintyAnalysis,
          showSensitivityAnalysis: !state.expertMode ? true : state.showSensitivityAnalysis,
        })),

      setShowFormulas: (show) => set({ showFormulas: show }),
      setShowTooltips: (show) => set({ showTooltips: show }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setAccentColor: (color) => set({ accentColor: color }),
      setDensityMode: (mode) => set({ densityMode: mode }),
      setDefaultProfile: (profile) => set({ defaultProfile: profile }),
      setAutoCalculate: (auto) => set({ autoCalculate: auto }),
      setShowUncertaintyAnalysis: (show) => set({ showUncertaintyAnalysis: show }),
      setShowSensitivityAnalysis: (show) => set({ showSensitivityAnalysis: show }),
      setTimelineAutoSync: (auto) => set({ timelineAutoSync: auto }),
      setShowResourceAllocations: (show) => set({ showResourceAllocations: show }),
      setHighlightCriticalPath: (highlight) => set({ highlightCriticalPath: highlight }),
      setShowNotifications: (show) => set({ showNotifications: show }),
      setPlaySounds: (play) => set({ playSounds: play }),

      resetToDefaults: () => set(defaultState),
    }),
    {
      name: "user-preferences",
      version: 1,
    }
  )
);

/**
 * Hook to get current expert mode status
 */
export function useExpertMode() {
  return usePreferencesStore((state) => state.expertMode);
}

/**
 * Hook to get current theme
 */
export function useTheme() {
  return usePreferencesStore((state) => state.theme);
}

/**
 * Hook to get current language
 */
export function useLanguage() {
  return usePreferencesStore((state) => state.language);
}
