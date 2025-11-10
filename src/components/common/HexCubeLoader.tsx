/**
 * HexCubeLoader Component
 *
 * Branded loading animation using Lottie
 * Features a rotating hex cube with 6 facets in brand green colors
 * Includes smooth rotation, breathing scale effect, and subtle 3D rocking
 */

"use client";

import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface HexCubeLoaderProps {
  size?: number;
  className?: string;
}

export function HexCubeLoader({ size = 220, className = "" }: HexCubeLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Lottie animation data - Hex Cube with 6 Facets
    const animationData = {
      v: "5.7.4",
      fr: 60,
      ip: 0,
      op: 240,
      w: 1024,
      h: 1024,
      nm: "Hex Cube 6 Facets – Tilt & Breathe",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Hex Cube 6",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [0],
                  e: [360],
                  i: { x: [0.5], y: [1.0] },
                  o: { x: [0.5], y: [0.0] },
                },
                {
                  t: 240,
                  s: [360],
                },
              ],
            },
            p: { a: 0, k: [512, 512, 0] },
            a: { a: 0, k: [512, 512, 0] },
            s: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [96, 96, 100],
                  e: [104, 104, 100],
                  i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
                  o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
                },
                {
                  t: 120,
                  s: [104, 104, 100],
                  e: [96, 96, 100],
                  i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
                  o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
                },
                {
                  t: 240,
                  s: [96, 96, 100],
                  e: [96, 96, 100],
                },
              ],
            },
            sk: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [0],
                  e: [4],
                  i: { x: [0.5], y: [1.0] },
                  o: { x: [0.5], y: [0.0] },
                },
                {
                  t: 120,
                  s: [4],
                  e: [-4],
                  i: { x: [0.5], y: [1.0] },
                  o: { x: [0.5], y: [0.0] },
                },
                {
                  t: 240,
                  s: [-4],
                  e: [0],
                },
              ],
            },
            sa: { a: 0, k: 45 },
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              nm: "Hex Facets",
              it: [
                {
                  ty: "sh",
                  nm: "facet0",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [183.8, 316.5],
                        [511.9, 127.0],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill0",
                  c: { a: 0, k: [0.72, 0.89, 0.6, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "sh",
                  nm: "facet1",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [511.9, 127.0],
                        [840.1, 316.5],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill1",
                  c: { a: 0, k: [0.65, 0.85, 0.56, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "sh",
                  nm: "facet2",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [840.1, 316.5],
                        [840.1, 695.4],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill2",
                  c: { a: 0, k: [0.61, 0.83, 0.54, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "sh",
                  nm: "facet3",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [840.1, 695.4],
                        [511.9, 884.9],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill3",
                  c: { a: 0, k: [0.68, 0.86, 0.58, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "sh",
                  nm: "facet4",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [511.9, 884.9],
                        [183.8, 695.4],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill4",
                  c: { a: 0, k: [0.74, 0.89, 0.61, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "sh",
                  nm: "facet5",
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [511.9, 505.9],
                        [183.8, 695.4],
                        [183.8, 316.5],
                      ],
                      c: true,
                    },
                  },
                },
                {
                  ty: "fl",
                  nm: "fill5",
                  c: { a: 0, k: [0.8, 0.92, 0.66, 1] },
                  o: { a: 0, k: 100 },
                },
                {
                  ty: "tr",
                  nm: "Transform",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 },
                  sk: { a: 0, k: 0 },
                  sa: { a: 0, k: 0 },
                },
              ],
            },
          ],
          ip: 0,
          op: 240,
          st: 0,
          bm: 0,
        },
      ],
    };

    // Initialize Lottie animation
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
    });

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-block",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
