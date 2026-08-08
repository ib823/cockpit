/**
 * Guards the `getClientRects` shim in tests/setup.ts.
 *
 * jsdom performs no layout, so every element reports zero client rects, and
 * `tabbable` — which focus-trap uses — reads zero rects as "not rendered" and
 * therefore "not tabbable". Without the shim, focus-trap's activate() throws
 * for every modal in the repo, which is why the focus-trap suite was skipped
 * wholesale before it was fixed.
 *
 * The shim exists to make VISIBLE things tabbable. It must not make HIDDEN
 * things tabbable, or it stops being a test environment fix and becomes a way
 * to pass tests that should fail — a modal whose only control is display:none
 * would look fine.
 *
 * These assertions matter more than usual because the ancestor check was
 * deliberately narrowed for speed: a full getComputedStyle per ancestor cost
 * 21.4s across the 27 focus-trap tests against 7.3s without it, and under
 * coverage instrumentation that pushed three past the 5s timeout. What remains
 * is asserted here rather than assumed from the comment.
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { tabbable } from "tabbable";

function names(container: HTMLElement): string[] {
  return tabbable(container).map((node) => node.textContent ?? "");
}

describe("getClientRects shim", () => {
  it("reports a rect for an attached, visible element", () => {
    // The whole reason the shim exists: without it this list is empty and
    // every focus trap in the repo throws on activation.
    const { container } = render(
      <div>
        <button>visible</button>
      </div>
    );

    expect(container.querySelector("button")!.getClientRects()).toHaveLength(1);
    expect(names(container)).toEqual(["visible"]);
  });

  it("reports no rect for a detached element", () => {
    const orphan = document.createElement("button");
    expect(orphan.getClientRects()).toHaveLength(0);
  });

  it("still hides an element with its own display:none", () => {
    const { container } = render(
      <div>
        <button style={{ display: "none" }}>hidden</button>
        <button>visible</button>
      </div>
    );

    expect(names(container)).toEqual(["visible"]);
  });

  it("still hides an element with its own visibility:hidden", () => {
    const { container } = render(
      <div>
        <button style={{ visibility: "hidden" }}>hidden</button>
        <button>visible</button>
      </div>
    );

    expect(names(container)).toEqual(["visible"]);
  });

  it("still hides a control inside a display:none ancestor", () => {
    // This is the case the narrowed ancestor walk has to keep catching. A
    // collapsed accordion or a closed panel is exactly this shape, and if its
    // contents read as tabbable, a focus-trap test passes on a dialog whose
    // controls nobody can reach.
    const { container } = render(
      <div>
        <div style={{ display: "none" }}>
          <span>
            <button>buried</button>
          </span>
        </div>
        <button>visible</button>
      </div>
    );

    expect(names(container)).toEqual(["visible"]);
  });

  it("still hides a control inside a [hidden] ancestor", () => {
    const { container } = render(
      <div>
        <div hidden>
          <button>buried</button>
        </div>
        <button>visible</button>
      </div>
    );

    expect(names(container)).toEqual(["visible"]);
  });

  it("does not hide a control merely because an ancestor sets other styles", () => {
    // The narrowed walk looks only at display and [hidden]. An ancestor with
    // opacity or overflow set must not take its children out of the tab order.
    const { container } = render(
      <div>
        <div style={{ opacity: 0.5, overflow: "hidden", visibility: "visible" }}>
          <button>reachable</button>
        </div>
      </div>
    );

    expect(names(container)).toEqual(["reachable"]);
  });
});
