import type { Metadata } from "next";
import "./globals.css";
import { company } from "@/config/brand";

export const metadata: Metadata = {
  title: company.name,
  description: company.tagline,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: company.name,
    description: company.tagline,
    url: company.website,
    siteName: company.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: company.name,
    description: company.tagline,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}