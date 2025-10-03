'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex items-center justify-center h-full', className)}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md px-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <Icon className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
        </motion.div>

        <h2 className="text-2xl font-light text-gray-900 mt-6">
          {title}
        </h2>

        <p className="text-gray-500 mt-2 text-sm">
          {description}
        </p>

        {(action || secondaryAction) && (
          <div className="flex flex-col gap-3 mt-8">
            {action && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={action.onClick}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           transition-all hover:scale-105 font-medium shadow-lg shadow-blue-600/30"
              >
                {action.label}
              </motion.button>
            )}

            {secondaryAction && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={secondaryAction.onClick}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl
                           hover:bg-gray-50 transition-all font-medium"
              >
                {secondaryAction.label}
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
