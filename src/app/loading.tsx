/**
 * Root route-loading boundary, shown while any route's server payload is in
 * flight. One full-surface load, so it uses the brand beacon — which carries
 * its own 400ms appear delay, keeping fast navigations loader-free.
 */

"use client";

import { BeaconLoader } from "@/components/ds/BeaconLoader";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--ds-surface-app)",
        zIndex: 9999,
      }}
    >
      <BeaconLoader label="Loading…" />
    </div>
  );
}
