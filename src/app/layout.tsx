import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAP Implementation Cockpit",
  description: "Professional SAP implementation planning and estimation",
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