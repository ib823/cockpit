"use client";

import { ReactNode } from "react";

interface TimelineContainerProps {
  children: ReactNode;
}

export function TimelineContainer({ children }: TimelineContainerProps) {
  return <div className="timeline-container w-full h-full">{children}</div>;
}

export default TimelineContainer;
