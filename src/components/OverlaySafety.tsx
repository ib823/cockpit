"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function releaseScrollLock() {
  document.documentElement.classList.remove("overflow-hidden");
  document.body.classList.remove("overflow-hidden");
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";

  // Clear any residual inline styles that modals might leave
  if (document.body.style.paddingRight) {
    document.body.style.paddingRight = "";
  }
}

export default function OverlaySafety() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    let isFixing = false; // Prevent infinite loops
    let timeoutId: NodeJS.Timeout | null = null;

    const fix = () => {
      // Debounce and prevent re-entry
      if (isFixing) return;
      isFixing = true;

      try {
        releaseScrollLock();

        // Remove residual inert from focus-trap libs
        document.querySelectorAll("[inert]").forEach((n) => n.removeAttribute("inert"));

        // Disable pointer-events on hidden overlays and clean up orphaned modals
        const overlays = Array.from(
          document.querySelectorAll<HTMLElement>(
            '.fixed.inset-0, [role="dialog"], [data-headlessui-portal] .fixed, [data-radix-portal] .fixed, .ant-modal-wrap'
          )
        );
        overlays.forEach((el) => {
          const cs = getComputedStyle(el);
          const hidden =
            el.hasAttribute("hidden") ||
            el.getAttribute("aria-hidden") === "true" ||
            cs.display === "none" ||
            cs.visibility === "hidden" ||
            parseFloat(cs.opacity || "1") < 0.01;

          // Only modify if needed to prevent triggering mutations
          const currentPointerEvents = el.style.pointerEvents;
          if (hidden && currentPointerEvents !== "none") {
            el.style.pointerEvents = "none";
          }
        });

        // Clean up orphaned Ant Design modal masks
        const masks = document.querySelectorAll<HTMLElement>(".ant-modal-mask");
        masks.forEach((mask) => {
          const cs = getComputedStyle(mask);
          if (cs.display === "none" || parseFloat(cs.opacity || "1") < 0.01) {
            mask.style.pointerEvents = "none";
          }
        });
      } finally {
        // Release the lock after a short delay
        setTimeout(() => {
          isFixing = false;
        }, 100);
      }
    };

    // Debounced mutation handler
    const handleMutation = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(fix, 50); // Debounce mutations
    };

    // Mutation observer: react to DOM changes from modals/portals
    const mo = new MutationObserver(handleMutation);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "class"], // Don't observe 'style' to prevent loops
    });

    // Initial fix on mount
    fix();

    // ESC often closes modals; sweep afterward
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTimeout(fix, 100);
    };
    window.addEventListener("keydown", onKey);

    // Sweep on visibility change (returning to tab)
    const onVisibility = () => {
      if (document.visibilityState === "visible") fix();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      mo.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}
