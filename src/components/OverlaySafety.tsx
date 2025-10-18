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
    const fix = () => {
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
        if (hidden) el.style.pointerEvents = 'none';
      });
    };

    // Mutation observer: react immediately to DOM changes from modals/portals
    const mo = new MutationObserver(() => fix());
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden','aria-hidden','style','class'] });

    // Periodic safety sweep + on route/query changes
    const id = window.setInterval(fix, 400);
    fix();

    // ESC often closes modals; sweep afterward
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTimeout(fix, 0); };
    window.addEventListener('keydown', onKey);

    return () => { window.removeEventListener('keydown', onKey); window.clearInterval(id); mo.disconnect(); };
  }, [pathname, search]);

  return null;
}
