/**
 * QuickActionCard Component
 * Interactive card for quick actions
 * Apple HIG compliant design
 */

import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import styles from './QuickActionCard.module.css';

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
  return (
    <button
      className={`${styles.card} ${variant === 'admin' ? styles.admin : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${styles[iconColor]}`}>
          <Icon className={`${styles.icon} ${styles[iconColor]}`} />
        </div>
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.description}>{description}</div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Open</span>
        <ArrowRight className={styles.arrow} />
      </div>
    </button>
  );
}
