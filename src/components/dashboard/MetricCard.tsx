/**
 * MetricCard Component
 * Displays a single metric with icon, value, and description
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'green' | 'orange' | 'purple';
  label: string;
  value: number | string;
  description: string;
  isEmpty?: boolean;
}

export function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  description,
  isEmpty = false,
}: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-light text-blue",
    green: "bg-green-light text-green",
    orange: "bg-orange-light text-orange",
    purple: "bg-purple-light text-purple",
  };

  return (
    <div className="p-6 bg-primary border border-subtle rounded-2xl shadow-sm hover:shadow-md transition-default animate-fade-in">
      <div className="mb-4">
        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[iconColor])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className={clsx("display-medium mb-1 truncate", isEmpty ? "text-tertiary" : "text-primary")}>
          {isEmpty ? '—' : value}
        </div>
        <div className="body-semibold text-sm mb-1 text-primary">{label}</div>
        <div className="detail text-secondary line-clamp-2">{description}</div>
      </div>
    </div>
  );
}
