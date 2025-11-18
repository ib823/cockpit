"use client";

import React, { useState } from 'react';
import { Plus, CheckCircle, Clock } from 'lucide-react';
import type { Phase } from '../types';
import styles from './proposed-solution-tab.module.css';

interface PhaseTimelineProps {
  phases: Phase[];
  onAddPhase: () => void;
  onUpdatePhase: (id: string, updates: Partial<Phase>) => void;
  onRemovePhase: (id: string) => void;
  selectedPhaseId: string | null;
  onSelectPhase: (id: string | null) => void;
}

export function PhaseTimeline({
  phases,
  onAddPhase,
  onUpdatePhase,
  onRemovePhase,
  selectedPhaseId,
  onSelectPhase,
}: PhaseTimelineProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineTrack}>
        {sortedPhases.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <div
              className={`${styles.timelineNode} ${selectedPhaseId === phase.id ? styles.timelineNodeSelected : ''}`}
              onClick={() => onSelectPhase(phase.id)}
            >
              <div className={styles.timelineNodeIcon}>
                {phase.scope === 'in-scope' ? <CheckCircle size={16} /> : <Clock size={16} />}
              </div>
              <div className={styles.timelineNodeLabel}>{phase.name || `Phase ${index + 1}`}</div>
              <div className={styles.timelineNodeSublabel}>{phase.timeline}</div>
            </div>
            {index < sortedPhases.length - 1 && <div className={styles.timelineConnector}></div>}
          </React.Fragment>
        ))}
        <button onClick={onAddPhase} className={styles.addPhaseButton}>
          <Plus size={20} />
          <span>Add Phase</span>
        </button>
      </div>
    </div>
  );
}
