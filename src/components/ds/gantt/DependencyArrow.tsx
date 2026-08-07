"use client";

/**
 * Design system — dependency arrow (layer 4, Domain surfaces)
 *
 * The link between a predecessor and its successor.
 *
 * Drawn as SVG, and `aria-hidden` throughout — deliberately. A screen reader
 * cannot follow a line across a canvas, so the same information reaches it
 * through `aria-describedby` on the successor row, listing every predecessor
 * by name, link type and lag (see `describePredecessors`). Arrows are the
 * sighted rendering of a fact that also exists as text, not the only copy.
 *
 * The stub case matters more than it looks: when a predecessor is outside the
 * rendered window or inside a collapsed phase, an arrow to nowhere is worse
 * than no arrow. It renders as a focusable caret that navigates to the
 * predecessor, expanding its phase if needed — so the link stays traversable
 * even when one end is not on screen.
 */

import React from "react";

export type LinkType = "FS" | "SS" | "FF" | "SF";

export interface DependencyArrowProps {
  /** Predecessor edge, in canvas pixels. */
  from: { x: number; y: number };
  /** Successor edge, in canvas pixels. */
  to: { x: number; y: number };
  type?: LinkType;
  /** Highlights the arrow when either end is selected. */
  active?: boolean;
}

/** Clearance so the elbow never runs along a bar's edge. */
const ELBOW = 10;

export function DependencyArrow({ from, to, type = "FS", active }: DependencyArrowProps) {
  // A finish-to-start link that runs backwards has to route around the bars
  // rather than through them, which is the case a naive straight line gets
  // visibly wrong on any re-planned schedule.
  const backwards = to.x < from.x + ELBOW * 2;

  const path = backwards
    ? [
        `M ${from.x} ${from.y}`,
        `H ${from.x + ELBOW}`,
        `V ${(from.y + to.y) / 2}`,
        `H ${to.x - ELBOW}`,
        `V ${to.y}`,
        `H ${to.x}`,
      ].join(" ")
    : [`M ${from.x} ${from.y}`, `H ${(from.x + to.x) / 2}`, `V ${to.y}`, `H ${to.x}`].join(" ");

  const stroke = active ? "var(--ds-accent-default)" : "var(--ds-border-strong)";

  return (
    <g aria-hidden="true" data-link-type={type}>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 1.5 : 1}
        strokeLinejoin="round"
      />
      {/* Arrowhead drawn as a filled triangle rather than a marker element:
          markers inherit stroke width and go spindly when the arrow is thin. */}
      <polygon
        points={`${to.x},${to.y} ${to.x - 5},${to.y - 3.5} ${to.x - 5},${to.y + 3.5}`}
        fill={stroke}
      />
    </g>
  );
}

export interface DependencyStubProps {
  /** Where the stub sits on the successor's row. */
  x: number;
  y: number;
  /** Named so the control says which link it follows. */
  predecessorName: string;
  /** True when following it must expand a collapsed phase first. */
  collapsed?: boolean;
  onNavigate: () => void;
}

/**
 * The marker shown when a predecessor is off-window or collapsed.
 *
 * Focusable and activatable, because the alternative — an arrow that stops at
 * the canvas edge — tells the user a link exists while giving them no way to
 * reach it.
 */
export function DependencyStub({
  x,
  y,
  predecessorName,
  collapsed,
  onNavigate,
}: DependencyStubProps) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <foreignObject x={-16} y={-10} width={20} height={20} overflow="visible">
        <button
          type="button"
          onClick={onNavigate}
          aria-label={
            collapsed
              ? `Go to predecessor ${predecessorName}, in a collapsed phase`
              : `Go to predecessor ${predecessorName}, outside the visible range`
          }
          style={{
            width: 18,
            height: 18,
            padding: 0,
            border: "none",
            background: "none",
            color: "var(--ds-content-secondary)",
            cursor: "pointer",
            lineHeight: 1,
            fontSize: 12,
          }}
        >
          <span aria-hidden="true">◀</span>
        </button>
      </foreignObject>
    </g>
  );
}
