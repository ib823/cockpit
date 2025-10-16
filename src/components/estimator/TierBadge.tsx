/**
 * TierBadge Component
 *
 * Displays complexity tier badges with color coding:
 * - A (Green): Simple/Vanilla (0.006 coefficient)
 * - B (Blue): Operational/Cross-Module (0.008)
 * - C (Orange): Complex/End-to-End (0.010)
 * - D (Red): Extension Required (custom pricing)
 */

import { Tag } from 'antd';

interface TierBadgeProps {
  tier: 'A' | 'B' | 'C' | 'D';
  showTooltip?: boolean;
}

const TIER_CONFIG = {
  A: {
    color: 'success',
    label: 'A',
    description: 'Simple/Vanilla',
  },
  B: {
    color: 'processing',
    label: 'B',
    description: 'Operational/Cross-Module',
  },
  C: {
    color: 'warning',
    label: 'C',
    description: 'Complex/End-to-End',
  },
  D: {
    color: 'error',
    label: 'D',
    description: 'Extension Required',
  },
} as const;

export function TierBadge({ tier, showTooltip = false }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  return (
    <Tag
      color={config.color}
      title={showTooltip ? config.description : undefined}
      style={{ fontWeight: 600, minWidth: '28px', textAlign: 'center' }}
    >
      {config.label}
    </Tag>
  );
}
