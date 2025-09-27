// Gap Cards Component - Displays missing requirements with actionable feedback
'use client';

import React from 'react';
import { GapCard, getGapsByCategory } from '@/lib/completeness-validator';

interface GapCardsProps {
  gaps: GapCard[];
  onFixAction?: (gapId: string, action: string) => void;
  className?: string;
}

const severityStyles = {
  block: {
    container: 'border-red-200 bg-red-50',
    header: 'text-red-800',
    message: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: '🚫'
  },
  warn: {
    container: 'border-amber-200 bg-amber-50',
    header: 'text-amber-800', 
    message: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: '⚠️'
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    header: 'text-blue-800',
    message: 'text-blue-600', 
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'ℹ️'
  }
};

const categoryLabels = {
  basic: 'Basic Information',
  decisions: 'Key Decisions',
  technical: 'Technical Details'
};

export function GapCards({ gaps, onFixAction, className = '' }: GapCardsProps) {
  if (gaps.length === 0) {
    return (
      <div className={`p-4 border border-green-200 bg-green-50 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <div>
            <div className="font-medium text-green-800">All requirements met</div>
            <div className="text-sm text-green-600">Ready to proceed with planning</div>
          </div>
        </div>
      </div>
    );
  }

  const gapsByCategory = getGapsByCategory(gaps);
  const sortedCategories = ['basic', 'decisions', 'technical'].filter(cat => gapsByCategory[cat]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Missing Requirements</h4>
        <span className="text-sm text-gray-500">{gaps.length} item{gaps.length !== 1 ? 's' : ''}</span>
      </div>

      {sortedCategories.map(category => (
        <div key={category} className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h5>
          
          {gapsByCategory[category].map(gap => (
            <GapCardItem
              key={gap.id}
              gap={gap}
              onFixAction={onFixAction}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface GapCardItemProps {
  gap: GapCard;
  onFixAction?: (gapId: string, action: string) => void;
}

function GapCardItem({ gap, onFixAction }: GapCardItemProps) {
  const styles = severityStyles[gap.severity];

  const handleFixClick = () => {
    if (onFixAction) {
      onFixAction(gap.id, gap.fixAction);
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{styles.icon}</span>
        
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${styles.header}`}>
            {gap.title}
          </div>
          <div className={`text-sm mt-1 ${styles.message}`}>
            {gap.fixAction}
          </div>
        </div>

        {onFixAction && (
          <button
            onClick={handleFixClick}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${styles.button}`}
          >
            Fix
          </button>
        )}
      </div>
    </div>
  );
}

export default GapCards;