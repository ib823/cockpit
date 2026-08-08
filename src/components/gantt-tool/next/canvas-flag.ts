"use client";

/**
 * Which Gantt canvas `/gantt-tool` renders.
 *
 * The port is a strangler: both canvases exist, both read the same store, and
 * this decides which one mounts. Three properties matter more than the
 * mechanism.
 *
 *  - **Legacy is the default, and cannot stop being the default by accident.**
 *    The only way to get the new canvas is to ask for it by name. There is no
 *    "roll out to 10%", no env var that flips it for everyone on the next
 *    deploy. `/gantt-tool` is the product; it does not get to be the testbed.
 *
 *  - **Switching is a URL, not a deploy.** `?canvas=next` and `?canvas=legacy`.
 *    A build-time `NEXT_PUBLIC_` flag would mean a full rebuild per comparison,
 *    and on Vercel those are inlined at build time — the thing that already
 *    cost a confused afternoon this week when a DSN change appeared not to
 *    take. Comparing the two canvases on the same plan, in the same session,
 *    is the entire point of a strangler; that has to be cheap.
 *
 *  - **The choice sticks, so a reload during testing does not silently revert
 *    to legacy** and make a bug look fixed. It is per-browser, in
 *    localStorage, and never leaves the device.
 *
 * Read it through `useGanttCanvasChoice`, not directly: the value has to be
 * resolved after mount, because localStorage does not exist during the server
 * render and reading it inside the component body is a hydration mismatch.
 */

import { useEffect, useState } from "react";

export type CanvasChoice = "legacy" | "next";

const STORAGE_KEY = "cockpit.ganttCanvas";
const QUERY_PARAM = "canvas";

/** Anything not explicitly "next" is legacy. Unknown values do not experiment. */
function parse(value: string | null | undefined): CanvasChoice | null {
  if (value === "next") return "next";
  if (value === "legacy") return "legacy";
  return null;
}

/**
 * Resolves the choice from the URL first, then the stored preference.
 *
 * Exported for tests, which is why it takes its inputs rather than reading the
 * globals itself.
 */
export function resolveChoice(
  search: string,
  stored: string | null
): CanvasChoice {
  const fromUrl = parse(new URLSearchParams(search).get(QUERY_PARAM));
  if (fromUrl) return fromUrl;
  return parse(stored) ?? "legacy";
}

export function useGanttCanvasChoice(): CanvasChoice {
  // Always "legacy" on the server and on the first client render, so the two
  // agree. A user who asked for `next` sees one legacy frame before the effect
  // runs — a trade worth making against a hydration error on the live screen.
  const [choice, setChoice] = useState<CanvasChoice>("legacy");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Safari in private mode throws on localStorage. Falling back to the URL
      // alone is correct; failing to render the Gantt would not be.
    }

    const resolved = resolveChoice(window.location.search, stored);
    setChoice(resolved);

    // Persist only what the URL asked for. Writing on every resolve would
    // re-save "legacy" over a stored "next" on any navigation without the
    // param, which is the opposite of sticky.
    if (parse(new URLSearchParams(window.location.search).get(QUERY_PARAM))) {
      try {
        window.localStorage.setItem(STORAGE_KEY, resolved);
      } catch {
        // See above.
      }
    }
  }, []);

  return choice;
}
