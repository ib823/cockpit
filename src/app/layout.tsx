import OverlaySafety from "@/components/OverlaySafety";
import VersionDisplay from "@/components/shared/VersionDisplay";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "@/styles/apple-design-system.css";
import "@/styles/design-tokens.css";
import "@/styles/accessibility.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Keystone",
  description: "From RFP to Proposal in 10 Minutes",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
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

                // Load Lottie and initialize animation
                var script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js';
                script.onload = function() {
                  if (typeof lottie === 'undefined') return;
                  if (!container) return;

                  var animationData = ${JSON.stringify({
                    v: "5.7.4",
                    fr: 60,
                    ip: 0,
                    op: 240,
                    w: 1024,
                    h: 1024,
                    nm: "Hex Cube 6 Facets",
                    ddd: 0,
                    assets: [],
                    layers: [
                      {
                        ddd: 0,
                        ind: 1,
                        ty: 4,
                        nm: "Hex Cube 6",
                        sr: 1,
                        ks: {
                          o: { a: 0, k: 100 },
                          r: {
                            a: 1,
                            k: [
                              {
                                t: 0,
                                s: [0],
                                e: [360],
                                i: { x: [0.5], y: [1.0] },
                                o: { x: [0.5], y: [0.0] },
                              },
                              { t: 240, s: [360] },
                            ],
                          },
                          p: { a: 0, k: [512, 512, 0] },
                          a: { a: 0, k: [512, 512, 0] },
                          s: {
                            a: 1,
                            k: [
                              {
                                t: 0,
                                s: [96, 96, 100],
                                e: [104, 104, 100],
                                i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
                                o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
                              },
                              {
                                t: 120,
                                s: [104, 104, 100],
                                e: [96, 96, 100],
                                i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
                                o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
                              },
                              { t: 240, s: [96, 96, 100], e: [96, 96, 100] },
                            ],
                          },
                          sk: {
                            a: 1,
                            k: [
                              {
                                t: 0,
                                s: [0],
                                e: [4],
                                i: { x: [0.5], y: [1.0] },
                                o: { x: [0.5], y: [0.0] },
                              },
                              {
                                t: 120,
                                s: [4],
                                e: [-4],
                                i: { x: [0.5], y: [1.0] },
                                o: { x: [0.5], y: [0.0] },
                              },
                              { t: 240, s: [-4], e: [0] },
                            ],
                          },
                          sa: { a: 0, k: 45 },
                        },
                        ao: 0,
                        shapes: [
                          {
                            ty: "gr",
                            nm: "Hex Facets",
                            it: [
                              {
                                ty: "sh",
                                nm: "facet0",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [183.8, 316.5],
                                      [511.9, 127.0],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill0",
                                c: { a: 0, k: [0.72, 0.89, 0.6, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "sh",
                                nm: "facet1",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [511.9, 127.0],
                                      [840.1, 316.5],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill1",
                                c: { a: 0, k: [0.65, 0.85, 0.56, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "sh",
                                nm: "facet2",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [840.1, 316.5],
                                      [840.1, 695.4],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill2",
                                c: { a: 0, k: [0.61, 0.83, 0.54, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "sh",
                                nm: "facet3",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [840.1, 695.4],
                                      [511.9, 884.9],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill3",
                                c: { a: 0, k: [0.68, 0.86, 0.58, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "sh",
                                nm: "facet4",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [511.9, 884.9],
                                      [183.8, 695.4],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill4",
                                c: { a: 0, k: [0.74, 0.89, 0.61, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "sh",
                                nm: "facet5",
                                ks: {
                                  a: 0,
                                  k: {
                                    i: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    o: [
                                      [0, 0],
                                      [0, 0],
                                      [0, 0],
                                    ],
                                    v: [
                                      [511.9, 505.9],
                                      [183.8, 695.4],
                                      [183.8, 316.5],
                                    ],
                                    c: true,
                                  },
                                },
                              },
                              {
                                ty: "fl",
                                nm: "fill5",
                                c: { a: 0, k: [0.8, 0.92, 0.66, 1] },
                                o: { a: 0, k: 100 },
                              },
                              {
                                ty: "tr",
                                nm: "Transform",
                                p: { a: 0, k: [0, 0] },
                                a: { a: 0, k: [0, 0] },
                                s: { a: 0, k: [100, 100] },
                                r: { a: 0, k: 0 },
                                o: { a: 0, k: 100 },
                                sk: { a: 0, k: 0 },
                                sa: { a: 0, k: 0 },
                              },
                            ],
                          },
                        ],
                        ip: 0,
                        op: 240,
                        st: 0,
                        bm: 0,
                      },
                    ],
                  })};

                  lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData: animationData
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
