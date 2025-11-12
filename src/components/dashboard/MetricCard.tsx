/**
 * MetricCard Component
 * Displays a single metric with icon, value, and description
 * Apple HIG compliant design
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './MetricCard.module.css';

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
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${styles[iconColor]}`}>
          <Icon className={`${styles.icon} ${styles[iconColor]}`} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={isEmpty ? styles.emptyValue : styles.value}>
          {isEmpty ? '—' : value}
        </div>
        <div className={styles.label}>{label}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  );
}
