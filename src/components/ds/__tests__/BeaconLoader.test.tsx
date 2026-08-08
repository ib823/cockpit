/**
 * The beacon loader's contract, from the Brand spec's loading identity:
 * the SVG never announces; the visible status line is the live region and
 * carries the STATE ("Restoring…, 64%"), never just the brand; determinate
 * mode is a percentage-normalised ring fill where 0% shows the track only.
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BeaconLoader } from "../BeaconLoader";

describe("BeaconLoader", () => {
  it("announces the state through the status line, not the SVG", () => {
    const { container } = render(<BeaconLoader label="Restoring your last project" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Restoring your last project"
    );
    // The SVG is decoration; announcing it would read the brand, not the state.
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("appends the percentage in determinate mode", () => {
    render(<BeaconLoader label="Reading queued changes" progress={64} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Reading queued changes, 64%"
    );
  });

  it("fills the ring by percentage on the normalised 100-unit track", () => {
    render(<BeaconLoader label="x" progress={64} />);

    const arc = screen.getByTestId("beacon-progress");
    // pathLength normalises the spec's 88.3 real units, so the dash IS the
    // percentage — no unit conversion to get wrong.
    expect(arc).toHaveAttribute("pathLength", "100");
    expect(arc).toHaveAttribute("stroke-dasharray", "64 100");
  });

  it("shows the track only at 0% rather than pretending progress", () => {
    render(<BeaconLoader label="x" progress={0} />);

    expect(screen.getByTestId("beacon-progress")).toHaveAttribute(
      "stroke-dasharray",
      "0 100"
    );
  });

  it("clamps out-of-range progress instead of overdrawing the ring", () => {
    render(<BeaconLoader label="x" progress={140} />);

    expect(screen.getByTestId("beacon-progress")).toHaveAttribute(
      "stroke-dasharray",
      "100 100"
    );
    expect(screen.getByRole("status")).toHaveTextContent("x, 100%");
  });

  it("renders the emitting waves only when indeterminate", () => {
    const { container, rerender } = render(<BeaconLoader label="x" />);
    expect(container.querySelectorAll('g[class*="wave"]')).toHaveLength(2);

    rerender(<BeaconLoader label="x" progress={30} />);
    expect(container.querySelectorAll('g[class*="wave"]')).toHaveLength(0);
  });
});
