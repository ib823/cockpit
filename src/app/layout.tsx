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
  title: "Cockpit",
  description: "From RFP to Proposal in 10 Minutes",
  manifest: "/manifest.json",
  // Static fallbacks so the tab shows the beacon before hydration and in
  // no-JS contexts; DynamicFavicon swaps in the status-plated version once
  // the client is up.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
        <Suspense fallback={null}>
          <OverlaySafety />
        </Suspense>
        <Providers>{children}</Providers>
        <VersionDisplay position="bottom-left" showOnHover />
      </body>
    </html>
  );
}
