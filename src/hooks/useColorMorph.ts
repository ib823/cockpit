"use client";

import { useEffect, useState } from "react";

const PALETTES_HEX = {
  amber: ["#FFE08A", "#FFD166", "#FFC247", "#FFDCA0", "#FFE8B0", "#FFF0C6"],
  blue: ["#A9D8FF", "#99D0FF", "#8ACBFF", "#9ED4FF", "#AEDCFF", "#C2E7FF"],
  red: ["#FFB3B3", "#FF9E9E", "#FF8A8A", "#FFBBBB", "#FFCCCC", "#FFD6D6"],
  green: ["#B8E299", "#A5D98F", "#9BD48B", "#AEDD93", "#BCE49B", "#CDECA9"],
};

const PALETTE_KEYS = Object.keys(PALETTES_HEX) as Array<keyof typeof PALETTES_HEX>;

// Gamma-correct color helpers
const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function hexToLinRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function linRGBToHex([r, g, b]: [number, number, number]): string {
  const rs = Math.round(clamp01(linearToSrgb(r)) * 255);
  const gs = Math.round(clamp01(linearToSrgb(g)) * 255);
  const bs = Math.round(clamp01(linearToSrgb(b)) * 255);
  return "#" + [rs, gs, bs].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const PALETTES_LIN: Record<string, Array<[number, number, number]>> = {};
for (const k of PALETTE_KEYS) {
  PALETTES_LIN[k] = PALETTES_HEX[k].map(hexToLinRGB);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpLinRGB(
  c0: [number, number, number],
  c1: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
}

const easeCosine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * Custom hook that provides the current morphing color matching the HexLoader animation
 * Returns a hex color string that morphs through green → amber → blue → red palettes
 */
export function useColorMorph(): string {
  const [color, setColor] = useState("#9BD48B"); // Start with green[2]

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Palette morph state
    let currentKey: keyof typeof PALETTES_HEX = "green";
    let targetKey: keyof typeof PALETTES_HEX = "amber";
    let tLegStart = performance.now();
    let legDurMS = 5600;

    const chooseNextTarget = (excludeKey: string) => {
      const options = PALETTE_KEYS.filter((k) => k !== excludeKey);
      return options[Math.floor(Math.random() * options.length)];
    };

    const scheduleNextLeg = (now: number) => {
      currentKey = targetKey;
      targetKey = chooseNextTarget(currentKey);
      tLegStart = now;
      legDurMS = 5200 + Math.random() * 1600;
    };

    let rafId: number;

    const frame = (now: number) => {
      const u = (now - tLegStart) / legDurMS;
      const w = u >= 1 ? 1 : u <= 0 ? 0 : easeCosine(u);

      const P0 = PALETTES_LIN[currentKey];
      const P1 = PALETTES_LIN[targetKey];

      // Use the middle color (index 2) for the text
      const mixLin = lerpLinRGB(P0[2], P1[2], w);
      const hex = linRGBToHex(mixLin);
      setColor(hex);

      if (u >= 1) {
        scheduleNextLeg(now);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return color;
}
