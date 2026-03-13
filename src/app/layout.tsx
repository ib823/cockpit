import OverlaySafety from "@/components/OverlaySafety";
import VersionDisplay from "@/components/shared/VersionDisplay";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "@/styles/apple-design-system.css";
import "@/styles/accessibility.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bound",
  description: "From RFP to Proposal in 10 Minutes",
  manifest: "/manifest.json",
};

// Viewport configuration for optimal mobile rendering
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs BEFORE React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem("theme");
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const effectiveTheme = theme === "dark" || (theme !== "light" && prefersDark) ? "dark" : "light";
                  document.documentElement.classList.add(effectiveTheme);
                } catch (e) {
                  // localStorage might not be available, use system preference
                  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                    document.documentElement.classList.add("dark");
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Skip navigation link for screen readers (WCAG 2.4.1) */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {/* Initial loader created entirely by client-side script to avoid hydration errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                // Only show loader on initial page load, not client-side navigation
                // Check if this is a navigation (performance.navigation.type === 1) or reload
                var isInitialLoad = !window.performance ||
                  window.performance.navigation.type !== 1;

                if (!isInitialLoad) return;

                // Create loader div on client side only (avoids hydration mismatch)
                var loader = document.createElement('div');
                loader.id = 'initial-loader';
                loader.style.position = 'fixed';
                loader.style.top = '0';
                loader.style.left = '0';
                loader.style.width = '100vw';
                loader.style.height = '100vh';
                loader.style.display = 'flex';
                loader.style.alignItems = 'center';
                loader.style.justifyContent = 'center';
                loader.style.backgroundColor = '#ffffff';
                loader.style.zIndex = '9999';

                var container = document.createElement('div');
                container.id = 'loader-container';
                container.style.width = '220px';
                container.style.height = '220px';
                loader.appendChild(container);
                document.body.appendChild(loader);

                // Hide loader once React hydrates
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    if (loader) {
                      loader.style.opacity = '0';
                      loader.style.transition = 'opacity 0.3s ease';
                      setTimeout(function() {
                        loader.style.display = 'none';
                        if (loader.parentNode) {
                          loader.parentNode.removeChild(loader);
                        }
                      }, 300);
                    }
                  }, 100);
                });

                // Load Lottie from local bundle (no CDN dependency)
                var script = document.createElement('script');
                script.src = '/animations/lottie-light.min.js';
                script.onload = function() {
                  if (typeof lottie === 'undefined') return;
                  if (!container) return;

                  fetch('/animations/hex-loader.json')
                    .then(function(res) { return res.json(); })
                    .then(function(animationData) {
                      lottie.loadAnimation({
                        container: container,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: animationData
                      });
                    });
                };
                document.head.appendChild(script);
              })();
            `,
          }}
        />
        <Suspense fallback={null}>
          <OverlaySafety />
        </Suspense>
        <Providers>{children}</Providers>
        <VersionDisplay position="bottom-left" showOnHover />
      </body>
    </html>
  );
}
