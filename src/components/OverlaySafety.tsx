'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function releaseScrollLock() {
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');
  document.body.style.overflow = '';
  (document.body.style as any).pointerEvents = ''; // ensure body clickable
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
        document.querySelectorAll('[inert]').forEach((n) => n.removeAttribute('inert'));

        // Disable pointer-events on hidden overlays
        const overlays = Array.from(
          document.querySelectorAll<HTMLElement>(
            '.fixed.inset-0, [role="dialog"], [data-headlessui-portal] .fixed, [data-radix-portal] .fixed'
          )
        );
        overlays.forEach((el) => {
          const cs = getComputedStyle(el);
          const hidden =
            el.hasAttribute('hidden') ||
            el.getAttribute('aria-hidden') === 'true' ||
            cs.display === 'none' ||
            cs.visibility === 'hidden' ||
            parseFloat(cs.opacity || '1') < 0.01;

          // Only modify if needed to prevent triggering mutations
          const currentPointerEvents = el.style.pointerEvents;
          if (hidden && currentPointerEvents !== 'none') {
            el.style.pointerEvents = 'none';
          }
        });
      } finally {
        // Release the lock after a short delay
        setTimeout(() => { isFixing = false; }, 100);
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
      attributeFilter: ['hidden', 'aria-hidden', 'class'] // Don't observe 'style' to prevent loops
    });

    // Periodic safety sweep (less frequent)
    const id = window.setInterval(fix, 2000); // Every 2s instead of 400ms
    fix();

    // ESC often closes modals; sweep afterward
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTimeout(fix, 100);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearInterval(id);
      mo.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}
