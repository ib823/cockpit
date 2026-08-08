/**
 * The property under test is not "the flag works" but "the flag cannot turn
 * itself on". `/gantt-tool` is a working screen; the new canvas has to be asked
 * for explicitly, every time the request is ambiguous.
 */

import { describe, expect, it } from "vitest";
import { resolveChoice } from "../canvas-flag";

describe("resolveChoice", () => {
  it("defaults to legacy with no URL param and nothing stored", () => {
    expect(resolveChoice("", null)).toBe("legacy");
  });

  it("uses the new canvas only when asked for by name", () => {
    expect(resolveChoice("?canvas=next", null)).toBe("next");
  });

  it("lets the URL override a stored preference in both directions", () => {
    expect(resolveChoice("?canvas=legacy", "next")).toBe("legacy");
    expect(resolveChoice("?canvas=next", "legacy")).toBe("next");
  });

  it("keeps a stored choice when the URL says nothing", () => {
    // Otherwise a reload mid-test silently reverts to legacy and a bug in the
    // new canvas looks fixed.
    expect(resolveChoice("", "next")).toBe("next");
  });

  it("treats any unrecognised value as legacy rather than experimenting", () => {
    expect(resolveChoice("?canvas=v2", null)).toBe("legacy");
    expect(resolveChoice("?canvas=true", null)).toBe("legacy");
    expect(resolveChoice("?canvas=", null)).toBe("legacy");
    expect(resolveChoice("", "garbage")).toBe("legacy");
  });

  it("is not fooled by a param that merely contains the word", () => {
    expect(resolveChoice("?nextcanvas=1", null)).toBe("legacy");
    expect(resolveChoice("?canvasnext=1", null)).toBe("legacy");
  });

  it("ignores other params around it", () => {
    expect(resolveChoice("?zoom=week&canvas=next&tab=timeline", null)).toBe("next");
  });
});
