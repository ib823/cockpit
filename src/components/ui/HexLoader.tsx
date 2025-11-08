'use client';

import { useEffect, useRef } from 'react';

interface HexLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 40,   // Small - for inline/buttons
  md: 80,   // Medium - for cards/sections
  lg: 140,  // Large - for modals
  xl: 220,  // Extra large - for full page
};

const FACETS = [
  [[511.9, 505.9], [183.8, 316.5], [511.9, 127.0]],
  [[511.9, 505.9], [511.9, 127.0], [840.1, 316.5]],
  [[511.9, 505.9], [840.1, 316.5], [840.1, 695.4]],
  [[511.9, 505.9], [840.1, 695.4], [511.9, 884.9]],
  [[511.9, 505.9], [511.9, 884.9], [183.8, 695.4]],
  [[511.9, 505.9], [183.8, 695.4], [183.8, 316.5]],
];

const PALETTES_HEX = {
  amber: ['#FFE08A', '#FFD166', '#FFC247', '#FFDCA0', '#FFE8B0', '#FFF0C6'],
  blue: ['#A9D8FF', '#99D0FF', '#8ACBFF', '#9ED4FF', '#AEDCFF', '#C2E7FF'],
  red: ['#FFB3B3', '#FF9E9E', '#FF8A8A', '#FFBBBB', '#FFCCCC', '#FFD6D6'],
  green: ['#B8E299', '#A5D98F', '#9BD48B', '#AEDD93', '#BCE49B', '#CDECA9'],
};

const PALETTE_KEYS = Object.keys(PALETTES_HEX) as Array<keyof typeof PALETTES_HEX>;

// Gamma-correct color helpers
const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function hexToLinRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function linRGBToHex([r, g, b]: [number, number, number]): string {
  const rs = Math.round(clamp01(linearToSrgb(r)) * 255);
  const gs = Math.round(clamp01(linearToSrgb(g)) * 255);
  const bs = Math.round(clamp01(linearToSrgb(b)) * 255);
  return '#' + [rs, gs, bs].map((v) => v.toString(16).padStart(2, '0')).join('');
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

export function HexLoader({ size = 'xl', className = '' }: HexLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const polysRef = useRef<SVGPolygonElement[]>([]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const polys = polysRef.current;
    const mount = containerRef.current;

    // Animation constants
    const ROT_PERIOD_MS = 3840;
    const BREATH_PERIOD_MS = 4096;
    const BREATH_AMPL = 0.04;

    // Palette morph state
    let currentKey: keyof typeof PALETTES_HEX = 'green';
    let targetKey: keyof typeof PALETTES_HEX = 'amber';
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

    const t0 = performance.now();
    let rafId: number;

    const frame = (now: number) => {
      const t = now - t0;
      const angle = (t * 360) / ROT_PERIOD_MS;
      const scale = 1 + BREATH_AMPL * Math.sin((t / BREATH_PERIOD_MS) * Math.PI * 2);
      mount.style.transform = `translateZ(0) rotate(${angle}deg) scale(${scale})`;

      const u = (now - tLegStart) / legDurMS;
      const w = u >= 1 ? 1 : u <= 0 ? 0 : easeCosine(u);

      const P0 = PALETTES_LIN[currentKey];
      const P1 = PALETTES_LIN[targetKey];

      for (let i = 0; i < 6; i++) {
        const mixLin = lerpLinRGB(P0[i], P1[i], w);
        const hex = linRGBToHex(mixLin);
        polys[i]?.setAttribute('fill', hex);
        polys[i]?.setAttribute('stroke', hex);
      }

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

  const pixelSize = SIZES[size];

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '50% 50%',
          willChange: 'transform',
          contain: 'layout paint size',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1024 1024"
          aria-label="Loading"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#fff',
            shapeRendering: 'geometricPrecision',
          }}
        >
          <rect x="0" y="0" width="1024" height="1024" fill="#ffffff" />
          <g>
            {FACETS.map((facet, i) => (
              <polygon
                key={i}
                ref={(el) => {
                  if (el) polysRef.current[i] = el;
                }}
                points={facet.map((p) => p.join(',')).join(' ')}
                fill={PALETTES_HEX.green[i]}
                stroke={PALETTES_HEX.green[i]}
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
                shapeRendering="geometricPrecision"
                pointerEvents="none"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
