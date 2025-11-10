/**
 * Root Loading Component
 *
 * Displays during initial page load and navigation
 * Uses the branded HexCubeLoader animation
 */

"use client";

import { HexCubeLoader } from "@/components/common";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        zIndex: 9999,
      }}
    >
      <HexCubeLoader size={220} />
    </div>
  );
}
