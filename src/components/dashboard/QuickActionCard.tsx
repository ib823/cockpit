/**
 * QuickActionCard Component
 * Interactive card for quick actions
 */

import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface QuickActionCardProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'admin';
}

export function QuickActionCard({
  icon: Icon,
  iconColor,
  title,
  description,
  onClick,
  variant = 'default',
}: QuickActionCardProps) {
  const colorClasses = {
    blue: "bg-blue-light text-blue",
    green: "bg-green-light text-green",
    orange: "bg-orange-light text-orange",
    purple: "bg-purple-light text-purple",
    red: "bg-red-light text-red",
  };

  return (
    <button
      className={clsx(
        "flex flex-col text-left p-8 bg-primary border-2 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer w-full focus-visible:ring-offset-2",
        variant === 'admin' ? "border-subtle" : "border-transparent shadow-md"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center transition-default group-hover:scale-110", colorClasses[iconColor])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="display-small group-hover:text-blue transition-default">{title}</div>
      </div>

      <div className="body text-secondary mb-8 line-clamp-2">{description}</div>

      <div className="mt-auto flex items-center gap-2 body-semibold text-sm text-blue group-hover:gap-3 transition-all">
        <span>Open</span>
        <ArrowRight size={16} />
      </div>
    </button>
  );
}
