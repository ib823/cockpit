// src/config/responsive.ts
import { Grid } from "antd";

export const BREAKPOINTS = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 } as const;
export const CONTAINER_MAX_WIDTH = {
  xs: "100%",
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
} as const;

const useBreakpoint = Grid.useBreakpoint;

export type WidthKey = keyof typeof CONTAINER_MAX_WIDTH;

export function useScreen() {
  const screens = useBreakpoint();
  const widthKey: WidthKey =
    (screens.xxl && "xxl") ||
    (screens.xl && "xl") ||
    (screens.lg && "lg") ||
    (screens.md && "md") ||
    (screens.sm && "sm") ||
    "xs";

  const containerMaxWidth =
    typeof CONTAINER_MAX_WIDTH[widthKey] === "number"
      ? `${CONTAINER_MAX_WIDTH[widthKey]}px`
      : CONTAINER_MAX_WIDTH[widthKey];

  const density: "comfortable" | "normal" | "compact" =
    widthKey === "xs" || widthKey === "sm" ? "comfortable" : widthKey === "md" ? "normal" : "compact";

  return { screens, widthKey, containerMaxWidth, density };
}
