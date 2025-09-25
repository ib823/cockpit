'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '@/stores/simple-timeline-store';

// Simple date calculation
const businessDayToDate = (businessDay: number): Date => {
  const baseDate = new Date('2024-01-01');
  const date = new Date(baseDate);
  date.setDate(date.getDate() + Math.floor(businessDay * 1.4));
  return date;
};

const MILESTONE_COLORS = {
  deliverable: '#059669',
  decision: '#dc2626',
  golive: '#f59e0b', 
  review: '#7c3aed'
};

export default function SimpleTimeline() {
  const { 
    phases, 
    milestones, 
    selectedMilestoneId,
    selectedPhaseId,
    generateTimeline, 
    addMilestone,
    selectMilestone,
    selectPhase
  } = useTimelineStore();

  console.log('SimpleTimeline rendering - phases:', phases.length, 'milestones:', milestones.length);

  // Calculate timeline bounds
  const getTimelineBounds = () => {
    if (!phases.length) {
      return {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };
    }

    const startBusinessDay = Math.min(...phases.map(p => p.startBusinessDay));
    const endBusinessDay = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));

    return {
      startDate: businessDayToDate(startBusinessDay - 5),
      endDate: businessDayToDate(endBusinessDay + 10)
    };
  };

  const { startDate, endDate } = getTimelineBounds();

  // Calculate positions
  const calculatePosition = (businessDay: number): number => {
    const milestoneDate = businessDayToDate(businessDay);
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = milestoneDate.getTime() - startDate.getTime();
    const chartWidth = 900;
    const chartAreaWidth = chartWidth - 100;
    const relativePosition = elapsed / totalDuration;
    return Math.max(50, Math.min(chartWidth - 50, relativePosition * chartAreaWidth + 50));
  };

  if (!phases.length) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4">SAP Implementation Timeline</h2>
        
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xl font-medium text-gray-900 mb-2">No Timeline Data</p>
          <p className="text-gray-600 mb-6">Create phases to start adding professional milestones</p>
          <button 
            onClick={() => {
              console.log('Generate timeline clicked');
              generateTimeline();
            }}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Sample Timeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional SAP Timeline</h3>
        <p className="text-sm text-gray-600 mb-4">
          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
          {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | 
          {phases.length} phases | {milestones.length} milestones
        </p>
        
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-600 transform rotate-45"></div>
            <span>Deliverable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-red-600"></div>
            <span>Decision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span>Go-Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span>Review</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-full">
          {/* Canvas Timeline */}
          <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ height: '400px', minWidth: '900px' }}>
            
            {/* Timeline Header */}
            <div className="absolute top-4 left-4 right-4 h-16 bg-white border border-gray-200 rounded-lg flex items-center px-4">
              <div>
                <h4 className="font-semibold text-gray-900">McKinsey-Style Project Timeline</h4>
                <p className="text-xs text-gray-500">Professional milestone management</p>
              </div>
            </div>

            {/* Phases */}
            {phases.map((phase, index) => {
              const phaseStartDate = businessDayToDate(phase.startBusinessDay);
              const phaseEndDate = businessDayToDate(phase.startBusinessDay + phase.workingDays);
              
              const totalDuration = endDate.getTime() - startDate.getTime();
              const phaseStart = (phaseStartDate.getTime() - startDate.getTime()) / totalDuration;
              const phaseDuration = (phaseEndDate.getTime() - phaseStartDate.getTime()) / totalDuration;
              
              const x = phaseStart * 800 + 50;
              const width = Math.max(120, phaseDuration * 800);
              const y = 100 + index * 70;

              return (
                <div
                  key={phase.id}
                  className={`absolute rounded-lg cursor-pointer transition-all hover:opacity-90 ${
                    selectedPhaseId === phase.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: '50px',
                    backgroundColor: phase.color
                  }}
                  onClick={() => selectPhase(phase.id)}
                >
                  <div className="p-3 text-white">
                    <div className="font-semibold text-sm">{phase.name}</div>
                    <div className="text-xs opacity-90">{phase.workingDays} days</div>
                  </div>
                </div>
              );
            })}

            {/* Milestones */}
            {milestones.map((milestone, index) => {
              const x = calculatePosition(milestone.businessDay);
              const y = 80;
              const isSelected = selectedMilestoneId === milestone.id;
              const color = MILESTONE_COLORS[milestone.type];

              return (
                <div key={milestone.id} className="absolute">
                  {/* Vertical guide line */}
                  <div 
                    className="absolute border-l border-dashed border-gray-300 opacity-50"
                    style={{
                      left: `${x}px`,
                      top: `${y + 25}px`,
                      height: '280px'
                    }}
                  />
                  
                  {/* Milestone marker */}
                  <div
                    className={`absolute cursor-pointer transition-all hover:scale-110 ${
                      isSelected ? 'ring-2 ring-gray-700' : ''
                    }`}
                    style={{
                      left: `${x - 12}px`,
                      top: `${y}px`,
                    }}
                    onClick={() => selectMilestone(milestone.id)}
                  >
                    {/* Different shapes for different milestone types */}
                    {milestone.type === 'deliverable' && (
                      <div 
                        className="w-6 h-6 transform rotate-45"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    {milestone.type === 'decision' && (
                      <div 
                        className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent"
                        style={{ borderBottomColor: color }}
                      />
                    )}
                    {milestone.type === 'golive' && (
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    {milestone.type === 'review' && (
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>
                  
                  {/* Milestone label */}
                  <div 
                    className="absolute text-xs font-medium text-gray-700 text-center"
                    style={{
                      left: `${x - 40}px`,
                      top: `${y + 30}px`,
                      width: '80px'
                    }}
                  >
                    {milestone.name.length > 12 ? milestone.name.substring(0, 12) + '...' : milestone.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Milestone Controls */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Add Professional Milestones</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => addMilestone({
              name: 'Requirements Sign-off',
              type: 'deliverable',
              businessDay: Math.floor(Math.random() * 40) + 10,
              status: 'pending'
            })}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            <div className="w-3 h-2 bg-green-600 transform rotate-45 mr-2"></div>
            Add Deliverable
          </button>
          
          <button 
            onClick={() => addMilestone({
              name: 'Stakeholder Decision',
              type: 'decision',
              businessDay: Math.floor(Math.random() * 40) + 30,
              status: 'pending'
            })}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
          >
            <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-red-600 mr-2"></div>
            Add Decision
          </button>
          
          <button 
            onClick={() => addMilestone({
              name: 'System Go-Live',
              type: 'golive',
              businessDay: Math.floor(Math.random() * 30) + 100,
              status: 'pending'
            })}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            Add Go-Live
          </button>
          
          <button 
            onClick={() => addMilestone({
              name: 'Project Review',
              type: 'review',
              businessDay: Math.floor(Math.random() * 30) + 140,
              status: 'pending'
            })}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
            Add Review
          </button>
        </div>
      </div>

      {/* Test Data Section */}
      <div className="p-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Timeline Data</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Phases: {phases.map(p => p.name).join(', ')}</div>
          <div>Milestones: {milestones.map(m => `${m.name} (${m.type})`).join(', ')}</div>
        </div>
      </div>
    </div>
  );
}
