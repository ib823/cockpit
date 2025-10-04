// src/app/project/layout.tsx
"use client";

import { ProjectCanvas } from "@/components/project/ProjectCanvas";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <ProjectCanvas />;
}
