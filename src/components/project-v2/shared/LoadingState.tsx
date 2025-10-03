'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'chip' | 'timeline' | 'decision';
  count?: number;
  className?: string;
}

function ChipSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-4 rounded-lg shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </motion.div>
  );
}

function TimelineSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-lg shadow-sm"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Phase bars */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div
              className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DecisionSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
    >
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function LoadingState({
  type = 'chip',
  count = 3,
  className
}: LoadingStateProps) {
  const Skeleton = {
    chip: ChipSkeleton,
    timeline: TimelineSkeleton,
    decision: DecisionSkeleton,
  }[type];

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Skeleton />
        </motion.div>
      ))}
    </div>
  );
}
