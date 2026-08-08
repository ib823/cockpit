/**
 * The AMS chevron's contract: it mirrors GanttBar's interactive surface — one
 * named button, selection via aria-pressed, select/keydown delegated — so the
 * canvas's plumbing cannot tell an AMS row from any other. The paint is the
 * only difference, and the paint is legacy's: five chevrons, 160px, #FF6B35.
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GanttAmsChevron } from "../GanttAmsChevron";

const DESCRIPTION = "Hypercare, ongoing support contract, starts 1 Mar 26";

describe("GanttAmsChevron", () => {
  it("is a single named button carrying the whole fact", () => {
    render(<GanttAmsChevron left={100} description={DESCRIPTION} />);

    // There is no visible text at all, so the accessible name is everything a
    // screen reader gets — it must say what this is, not just that it exists.
    expect(screen.getByRole("button", { name: DESCRIPTION })).toBeInTheDocument();
  });

  it("positions at the given offset and keeps legacy's fixed footprint", () => {
    render(<GanttAmsChevron left={137} description={DESCRIPTION} />);

    const button = screen.getByRole("button");
    // Fixed width is the point: the strip must not scale with the contract
    // duration, which is exactly why it exists instead of a bar.
    expect(button.style.left).toBe("137px");
  });

  it("draws five chevrons, all hidden from assistive technology", () => {
    const { container } = render(
      <GanttAmsChevron left={0} description={DESCRIPTION} />
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(5);
    for (const svg of svgs) {
      // Five decorative shapes announced individually would bury the one
      // named button between them.
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("reflects selection through aria-pressed, like GanttBar", () => {
    const { rerender } = render(
      <GanttAmsChevron left={0} description={DESCRIPTION} selected={false} />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(<GanttAmsChevron left={0} description={DESCRIPTION} selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("delegates select and keydown to the canvas", () => {
    const onSelect = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <GanttAmsChevron
        left={0}
        description={DESCRIPTION}
        onSelect={onSelect}
        onKeyDown={onKeyDown}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowDown" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
