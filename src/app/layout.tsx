import { EAContextPanel } from "@/components/ea-diagram/EAContextPanel";
import { EAFloatingWidget } from "@/components/ea-diagram/EAFloatingWidget";
import { EAProvider } from "@/components/ea-diagram/EAProvider";
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
        <EAProvider>
          {children}
          <EAFloatingWidget />
          <EAContextPanel />
        </EAProvider>
      </body>
    </html>
  );
}