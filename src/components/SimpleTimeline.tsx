import React from 'react';
import { useTimelineStore } from '@/stores/simple-timeline-store';

export default function SimpleTimeline() {
  const { phases, milestones, generateTimeline, addMilestone, selectMilestone, selectedMilestoneId } = useTimelineStore();

  if (!phases.length) {
    return (
      <div style={{ 
        padding: '60px 40px', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          SAP Implementation Timeline
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          Create phases to start adding professional milestones
        </p>
        <button 
          onClick={generateTimeline}
          style={{ 
            padding: '12px 32px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          Generate Sample Timeline
        </button>
      </div>
    );
  }

  // Calculate total timeline duration
  const maxBusinessDay = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
  const timelineWidth = 800;

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ padding: '32px 40px', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
          Professional Timeline
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          SAP implementation with milestone tracking
        </p>
      </div>

      {/* Timeline Canvas */}
      <div style={{ padding: '40px', position: 'relative' }}>
        <div style={{ 
          position: 'relative', 
          height: '300px', 
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #f3f4f6'
        }}>
          
          {/* Timeline axis */}
          <div style={{
            position: 'absolute',
            top: '50px',
            left: '40px',
            right: '40px',
            height: '2px',
            backgroundColor: '#d1d5db'
          }} />

          {/* Phase bars */}
          {phases.map((phase, index) => {
            const startPercent = (phase.startBusinessDay / maxBusinessDay) * 100;
            const widthPercent = (phase.workingDays / maxBusinessDay) * 100;
            const yPosition = 80 + (index * 70);
            
            return (
              <div key={phase.id}>
                {/* Phase bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${40 + (startPercent * 0.01 * (timelineWidth - 80))}px`,
                    top: `${yPosition}px`,
                    width: `${Math.max(120, widthPercent * 0.01 * (timelineWidth - 80))}px`,
                    height: '40px',
                    backgroundColor: phase.color,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {phase.name}
                </div>
              </div>
            );
          })}

          {/* Milestone markers - positioned ON the timeline */}
          {milestones.map((milestone) => {
            const xPercent = (milestone.businessDay / maxBusinessDay) * 100;
            const xPosition = 40 + (xPercent * 0.01 * (timelineWidth - 80));
            const isSelected = selectedMilestoneId === milestone.id;
            
            return (
              <div key={milestone.id}>
                {/* Vertical guideline */}
                <div style={{
                  position: 'absolute',
                  left: `${xPosition}px`,
                  top: '50px',
                  width: '2px',
                  height: '200px',
                  backgroundColor: '#d1d5db',
                  borderLeft: '2px dashed #9ca3af'
                }} />
                
                {/* Milestone marker */}
                <div
                  onClick={() => selectMilestone(milestone.id)}
                  style={{
                    position: 'absolute',
                    left: `${xPosition - 16}px`,
                    top: '34px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    zIndex: 10
                  }}
                >
                  {milestone.type === 'deliverable' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#059669',
                      transform: 'rotate(45deg)',
                      borderRadius: '4px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      border: isSelected ? '3px solid #1f2937' : 'none'
                    }} />
                  )}
                  
                  {milestone.type === 'decision' && (
                    <div style={{
                      width: '0',
                      height: '0',
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderBottom: '28px solid #dc2626',
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      position: 'relative',
                      outline: isSelected ? '3px solid #1f2937' : 'none',
                      outlineOffset: '2px'
                    }} />
                  )}
                  
                  {milestone.type === 'golive' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#f59e0b',
                      borderRadius: '50%',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      border: isSelected ? '3px solid #1f2937' : 'none'
                    }} />
                  )}
                  
                  {milestone.type === 'review' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#7c3aed',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      border: isSelected ? '3px solid #1f2937' : 'none'
                    }} />
                  )}
                </div>
                
                {/* Milestone label */}
                <div style={{
                  position: 'absolute',
                  left: `${xPosition - 40}px`,
                  top: '10px',
                  width: '80px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}>
                  {milestone.name.length > 10 ? milestone.name.substring(0, 10) + '...' : milestone.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '32px 40px', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          Add Milestone
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button 
            onClick={() => addMilestone({
              name: 'Requirements',
              type: 'deliverable',
              businessDay: Math.floor(Math.random() * 30) + 10,
              status: 'pending'
            })}
            style={{
              padding: '12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Deliverable
          </button>
          <button 
            onClick={() => addMilestone({
              name: 'Decision',
              type: 'decision',
              businessDay: Math.floor(Math.random() * 30) + 40,
              status: 'pending'
            })}
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Decision
          </button>
          <button 
            onClick={() => addMilestone({
              name: 'Go-Live',
              type: 'golive',
              businessDay: Math.floor(Math.random() * 20) + 100,
              status: 'pending'
            })}
            style={{
              padding: '12px',
              backgroundColor: '#fed7aa',
              color: '#9a3412',
              border: '1px solid #fdba74',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go-Live
          </button>
          <button 
            onClick={() => addMilestone({
              name: 'Review',
              type: 'review',
              businessDay: Math.floor(Math.random() * 20) + 140,
              status: 'pending'
            })}
            style={{
              padding: '12px',
              backgroundColor: '#e9d5ff',
              color: '#581c87',
              border: '1px solid #c4b5fd',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
