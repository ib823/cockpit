import { describe, it, expect } from 'vitest';
import {
  calculatePhaseResource,
  calculatePhaseAllocation,
  calculateWrapper,
  calculateResourcePlan,
  calculateMargin,
  getDefaultRate,
  createDefaultPhaseResources,
  createDefaultWrappers,
} from '@/lib/resourcing/model';

describe('M4 - Phase-Level Resourcing Model', () => {
  describe('Resource Calculations', () => {
    it('should calculate phase resource hours and cost', () => {
      const resource = calculatePhaseResource({
        id: 'test-1',
        phaseId: 'phase-1',
        phaseName: 'Prepare',
        role: 'Technical',
        region: 'US-East',
        allocation: 50,
        hourlyRate: 165,
        phaseEffort: 10, // 10 PD
      });

      // 10 PD * 8 hours * 50% allocation = 40 hours
      expect(resource.calculatedHours).toBe(40);
      // 40 hours * $165/hr = $6,600
      expect(resource.calculatedCost).toBe(6600);
    });

    it('should calculate phase allocation totals', () => {
      const phase = calculatePhaseAllocation({
        phaseId: 'phase-1',
        phaseName: 'Prepare',
        category: 'prepare',
        baseEffort: 10,
        resources: [
          {
            id: '1',
            phaseId: 'phase-1',
            phaseName: 'Prepare',
            role: 'Technical',
            region: 'US-East',
            allocation: 70,
            hourlyRate: 165,
            phaseEffort: 10,
            calculatedHours: 0,
            calculatedCost: 0,
          },
          {
            id: '2',
            phaseId: 'phase-1',
            phaseName: 'Prepare',
            role: 'Functional',
            region: 'US-East',
            allocation: 30,
            hourlyRate: 155,
            phaseEffort: 10,
            calculatedHours: 0,
            calculatedCost: 0,
          },
        ],
      });

      // Technical: 10 * 8 * 70% = 56 hrs * $165 = $9,240
      // Functional: 10 * 8 * 30% = 24 hrs * $155 = $3,720
      // Total: $12,960
      expect(phase.totalCost).toBe(12960);

      // Total hours: 56 + 24 = 80
      // Average rate: $12,960 / 80 = $162/hr
      expect(phase.averageRate).toBe(162);
    });

    it('should calculate wrapper effort and cost', () => {
      const wrapper = calculateWrapper(
        {
          id: 'wrapper-pm',
          type: 'projectManagement',
          phases: ['phase-1'],
          effortPercentage: 15,
          description: 'PM activities',
        },
        100, // 100 PD technical effort
        150 // $150/hr average rate
      );

      // 100 PD * 15% = 15 PD
      expect(wrapper.calculatedEffort).toBe(15);
      // 15 PD * 8 hrs * $150/hr = $18,000
      expect(wrapper.calculatedCost).toBe(18000);
    });
  });

  describe('Resource Plan', () => {
    it('should calculate complete resource plan', () => {
      const plan = calculateResourcePlan(
        [
          {
            phaseId: 'phase-1',
            phaseName: 'Prepare',
            category: 'prepare',
            baseEffort: 50,
            resources: createDefaultPhaseResources('phase-1', 'Prepare', 50, 'US-East'),
          },
        ],
        createDefaultWrappers('project-1', ['phase-1'])
      );

      expect(plan.totals.technicalEffort).toBe(50);
      expect(plan.totals.wrapperEffort).toBeGreaterThan(0);
      expect(plan.totals.totalEffort).toBeGreaterThan(50);
      expect(plan.totals.totalCost).toBeGreaterThan(0);
    });
  });

  describe('Default Rates', () => {
    it('should return correct default rates for US-East', () => {
      expect(getDefaultRate('PM', 'US-East')).toBe(175);
      expect(getDefaultRate('Technical', 'US-East')).toBe(165);
      expect(getDefaultRate('Functional', 'US-East')).toBe(155);
    });

    it('should return correct default rates for Asia-Pacific', () => {
      expect(getDefaultRate('PM', 'Asia-Pacific')).toBe(125);
      expect(getDefaultRate('Technical', 'Asia-Pacific')).toBe(115);
    });

    it('should fallback to US-East for unknown region', () => {
      expect(getDefaultRate('PM', 'Unknown')).toBe(175);
    });
  });

  describe('Margin Calculation', () => {
    it('should calculate margin correctly', () => {
      const margin = calculateMargin(80000, 100000);
      // (100,000 - 80,000) / 100,000 = 20%
      expect(margin).toBe(20);
    });

    it('should return 0 for zero selling price', () => {
      const margin = calculateMargin(80000, 0);
      expect(margin).toBe(0);
    });
  });

  describe('Default Resource Creation', () => {
    it('should create default phase resources with correct allocation', () => {
      const resources = createDefaultPhaseResources('phase-1', 'Prepare', 100, 'US-East');

      expect(resources).toHaveLength(3);

      const technical = resources.find(r => r.role === 'Technical');
      const functional = resources.find(r => r.role === 'Functional');
      const architect = resources.find(r => r.role === 'Architect');

      expect(technical?.allocation).toBe(70);
      expect(functional?.allocation).toBe(20);
      expect(architect?.allocation).toBe(10);
    });

    it('should create default wrappers with correct percentages', () => {
      const wrappers = createDefaultWrappers('project-1', ['phase-1', 'phase-2']);

      expect(wrappers).toHaveLength(6);

      const pm = wrappers.find(w => w.type === 'projectManagement');
      const testing = wrappers.find(w => w.type === 'testing');

      expect(pm?.effortPercentage).toBe(15);
      expect(testing?.effortPercentage).toBe(20);
    });
  });
});
