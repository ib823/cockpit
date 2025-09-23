import { describe, it, expect } from 'vitest';
import { calculateEffort, sequencePhases } from '../calculations';

describe('Timeline Calculations', () => {
  it('calculates effort correctly', () => {
    const effort = calculateEffort(['FI_1', 'HR_1'], 'complex');
    expect(effort).toBe(182); // 140 * 1.3
  });
  
  it('sequences phases with dependencies', () => {
    const phases = [
      { id: '1', name: 'A', dependencies: [] },
      { id: '2', name: 'B', dependencies: ['1'] },
      { id: '3', name: 'C', dependencies: ['1', '2'] }
    ];
    const result = sequencePhases(phases);
    expect(result[0].id).toBe('1');
    expect(result[2].id).toBe('3');
  });
});
