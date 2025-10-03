'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatBadgeProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

export function StatBadge({
  label,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  className,
}: StatBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}

      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium opacity-70">{label}</span>
        <span className="text-sm font-semibold">{value}</span>

        {trend && (
          <span className={cn(
            'text-xs',
            trend === 'up' && 'text-red-600',
            trend === 'down' && 'text-green-600',
            trend === 'neutral' && 'text-gray-600'
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
          </span>
        )}
      </div>
    </motion.div>
  );
}
