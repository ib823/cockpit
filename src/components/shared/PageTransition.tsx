/**
 * Page Transition Component
 * Smooth fade/slide animations between page navigations
 *
 * Features:
 * - Fade-in animation on mount
 * - Slide-up effect for modern feel
 * - Loading state during navigation
 * - Respects prefers-reduced-motion
 * - Works with Next.js App Router
 */

"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Spin } from "antd";

interface PageTransitionProps {
  children: ReactNode;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation type */
  type?: "fade" | "slide" | "fade-slide";
}

export function PageTransition({
  children,
  duration = 300,
  type = "fade-slide",
}: PageTransitionProps) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Trigger animation on pathname change
  useEffect(() => {
    setIsAnimating(true);

    // Delay to allow exit animation
    const timer = setTimeout(
      () => {
        setDisplayChildren(children);
        setIsAnimating(false);
      },
      prefersReducedMotion ? 0 : duration / 2
    );

    return () => clearTimeout(timer);
  }, [pathname, children, duration, prefersReducedMotion]);

  const animationStyle = prefersReducedMotion
    ? {}
    : {
        animation: isAnimating
          ? `pageExit ${duration}ms ease-out`
          : `pageEnter ${duration}ms ease-out`,
      };

  return (
    <>
      <div style={animationStyle}>{displayChildren}</div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            ${type.includes("slide") ? "transform: translateY(10px);" : ""}
          }
          to {
            opacity: 1;
            ${type.includes("slide") ? "transform: translateY(0);" : ""}
          }
        }

        @keyframes pageExit {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Loading Indicator Component
 * Shows during navigation with smooth fade-in
 */
interface NavigationLoaderProps {
  /** Show loading indicator */
  loading: boolean;
  /** Custom loading message */
  message?: string;
}

export function NavigationLoader({ loading, message = "Loading..." }: NavigationLoaderProps) {
  const [show, setShow] = useState(false);

  // Delay showing loader to avoid flash on fast navigations
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [loading]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        zIndex: 9999,
        animation: "fadeIn 200ms ease-out",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Spin size="large" />
        <div className="text-base" style={{ marginTop: "16px", color: "#64748b" }}>
          {message}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to track navigation loading state
 * Useful for showing loading indicators during route changes
 */
export function useNavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setLoading(true);
      setPrevPathname(pathname);

      // Clear loading state after animation
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return { loading, pathname };
}

/**
 * Scroll Restoration Component
 * Preserves scroll position on specific pages
 */
interface ScrollRestorationProps {
  /** Pages where scroll should be preserved */
  preserveScrollOnPages?: string[];
}

export function ScrollRestoration({ preserveScrollOnPages = [] }: ScrollRestorationProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Save scroll position before navigation
    const handleScroll = () => {
      if (pathname && preserveScrollOnPages.includes(pathname)) {
        sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString());
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Restore scroll position on mount
    if (pathname && preserveScrollOnPages.includes(pathname)) {
      const savedScroll = sessionStorage.getItem(`scroll-${pathname}`);
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    } else {
      // Scroll to top on new pages
      window.scrollTo(0, 0);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, preserveScrollOnPages]);

  return null;
}
