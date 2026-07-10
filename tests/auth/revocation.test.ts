import { describe, it, expect } from "vitest";
import { epochRevoked } from "@/lib/auth/revocation";

// The Redis-backed paths require a live Upstash instance and are exercised in
// integration; here we lock down the pure "sign out everywhere" decision that
// the middleware guard relies on.
describe("epochRevoked", () => {
  it("revokes tokens minted before the current epoch", () => {
    expect(epochRevoked(2, 1)).toBe(true);
    expect(epochRevoked(5, 0)).toBe(true);
  });

  it("allows tokens at the current epoch", () => {
    expect(epochRevoked(1, 1)).toBe(false);
    expect(epochRevoked(0, 0)).toBe(false);
  });

  it("allows tokens ahead of a stale/cold cache", () => {
    expect(epochRevoked(1, 2)).toBe(false);
  });

  it("is inert when either value is missing", () => {
    expect(epochRevoked(null, 1)).toBe(false);
    expect(epochRevoked(2, undefined)).toBe(false);
    expect(epochRevoked(undefined, undefined)).toBe(false);
  });
});
