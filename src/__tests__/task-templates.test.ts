import { describe, it, expect } from 'vitest';
import {
  getTaskTemplatesForPhase,
  generateTasksForPhase,
  calculateTaskMetrics,
  TASK_TEMPLATES
} from '@/lib/task-templates';

describe('Task Templates', () => {
  describe('getTaskTemplatesForPhase', () => {
    it('should match Prepare phase by category', () => {
      const tasks = getTaskTemplatesForPhase('Some Phase', 'FI - Prepare');
      expect(tasks).toBe(TASK_TEMPLATES.prepare);
      expect(tasks).toHaveLength(3);
    });

    it('should match Explore phase by category', () => {
      const tasks = getTaskTemplatesForPhase('Some Phase', 'MM - Explore');
      expect(tasks).toBe(TASK_TEMPLATES.explore);
      expect(tasks).toHaveLength(3);
    });

    it('should match Realize phase by category', () => {
      const tasks = getTaskTemplatesForPhase('Some Phase', 'SD - Realize');
      expect(tasks).toBe(TASK_TEMPLATES.realize);
      expect(tasks).toHaveLength(3);
    });

    it('should match Deploy phase by category', () => {
      const tasks = getTaskTemplatesForPhase('Some Phase', 'Deployment - Deploy');
      expect(tasks).toBe(TASK_TEMPLATES.deploy);
      expect(tasks).toHaveLength(3);
    });

    it('should match Run phase by name', () => {
      const tasks = getTaskTemplatesForPhase('Hypercare Support', 'Support');
      expect(tasks).toBe(TASK_TEMPLATES.run);
      expect(tasks).toHaveLength(3);
    });

    it('should match Prepare phase by name when category not matching', () => {
      const tasks = getTaskTemplatesForPhase('Prepare Phase', 'Unknown');
      expect(tasks).toBe(TASK_TEMPLATES.prepare);
    });

    it('should return null for unmatched phase', () => {
      const tasks = getTaskTemplatesForPhase('Random Phase', 'Unknown Category');
      expect(tasks).toBeNull();
    });

    it('should handle case insensitive matching', () => {
      const tasks = getTaskTemplatesForPhase('PREPARE', 'FI - PREPARE');
      expect(tasks).toBe(TASK_TEMPLATES.prepare);
    });
  });

  describe('TASK_TEMPLATES structure', () => {
    it('should have all phase types', () => {
      expect(TASK_TEMPLATES).toHaveProperty('prepare');
      expect(TASK_TEMPLATES).toHaveProperty('explore');
      expect(TASK_TEMPLATES).toHaveProperty('realize');
      expect(TASK_TEMPLATES).toHaveProperty('deploy');
      expect(TASK_TEMPLATES).toHaveProperty('run');
    });

    it('Prepare tasks should sum to 100% effort', () => {
      const totalEffort = TASK_TEMPLATES.prepare.reduce((sum, t) => sum + (t.effortPercent || 0), 0);
      expect(totalEffort).toBe(100);
    });

    it('Explore tasks should sum to 100% effort', () => {
      const totalEffort = TASK_TEMPLATES.explore.reduce((sum, t) => sum + (t.effortPercent || 0), 0);
      expect(totalEffort).toBe(100);
    });

    it('Realize tasks should sum to 100% effort', () => {
      const totalEffort = TASK_TEMPLATES.realize.reduce((sum, t) => sum + (t.effortPercent || 0), 0);
      expect(totalEffort).toBe(100);
    });

    it('Deploy tasks should sum to 100% effort', () => {
      const totalEffort = TASK_TEMPLATES.deploy.reduce((sum, t) => sum + (t.effortPercent || 0), 0);
      expect(totalEffort).toBe(100);
    });

    it('Run tasks should sum to 100% effort', () => {
      const totalEffort = TASK_TEMPLATES.run.reduce((sum, t) => sum + (t.effortPercent || 0), 0);
      expect(totalEffort).toBe(100);
    });

    it('each task should have required fields', () => {
      Object.values(TASK_TEMPLATES).forEach(phaseTaskses => {
        phaseTaskses.forEach(task => {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('name');
          expect(task).toHaveProperty('effortPercent');
          expect(task).toHaveProperty('daysPercent');
          expect(task).toHaveProperty('defaultRole');
          expect(task.effortPercent).toBeGreaterThan(0);
          expect(task.daysPercent).toBeGreaterThan(0);
        });
      });
    });

    it('Prepare tasks should have correct roles', () => {
      expect(TASK_TEMPLATES.prepare[0].defaultRole).toBe('Project Manager');
      expect(TASK_TEMPLATES.prepare[1].defaultRole).toBe('Project Manager');
      expect(TASK_TEMPLATES.prepare[2].defaultRole).toBe('Basis Consultant');
    });

    it('Explore tasks should involve functional and technical teams', () => {
      TASK_TEMPLATES.explore.forEach(task => {
        expect(task.defaultRole).toContain('Functional');
      });
    });
  });

  describe('calculateTaskMetrics', () => {
    it('should calculate effort correctly', () => {
      const phaseEffort = 100; // man-days
      const phaseWorkingDays = 30;

      const tasks = calculateTaskMetrics(TASK_TEMPLATES.prepare, phaseEffort, phaseWorkingDays);

      // Team Mobilization: 25% of 100md = 25md
      expect(tasks[0].effort).toBe(25);
      // Project Governance: 40% of 100md = 40md
      expect(tasks[1].effort).toBe(40);
      // SAP Environment: 35% of 100md = 35md
      expect(tasks[2].effort).toBe(35);
    });

    it('should calculate working days correctly', () => {
      const phaseEffort = 100;
      const phaseWorkingDays = 30;

      const tasks = calculateTaskMetrics(TASK_TEMPLATES.prepare, phaseEffort, phaseWorkingDays);

      // Team Mobilization: 30% of 30d = 9d
      expect(tasks[0].workingDays).toBe(9);
      // Project Governance: 40% of 30d = 12d
      expect(tasks[1].workingDays).toBe(12);
      // SAP Environment: 30% of 30d = 9d
      expect(tasks[2].workingDays).toBe(9);
    });

    it('should preserve original template data', () => {
      const phaseEffort = 100;
      const phaseWorkingDays = 30;

      const tasks = calculateTaskMetrics(TASK_TEMPLATES.prepare, phaseEffort, phaseWorkingDays);

      tasks.forEach((task, idx) => {
        expect(task.id).toBe(TASK_TEMPLATES.prepare[idx].id);
        expect(task.name).toBe(TASK_TEMPLATES.prepare[idx].name);
        expect(task.effortPercent).toBe(TASK_TEMPLATES.prepare[idx].effortPercent);
        expect(task.daysPercent).toBe(TASK_TEMPLATES.prepare[idx].daysPercent);
        expect(task.defaultRole).toBe(TASK_TEMPLATES.prepare[idx].defaultRole);
      });
    });

    it('should handle decimal rounding for effort', () => {
      const phaseEffort = 33.3333;
      const phaseWorkingDays = 10;

      const tasks = calculateTaskMetrics(TASK_TEMPLATES.prepare, phaseEffort, phaseWorkingDays);

      // Should round to 1 decimal place
      tasks.forEach(task => {
        expect(task.effort).toBeDefined();
        expect(typeof task.effort).toBe('number');
        // Check it's rounded to 1 decimal
        const decimalPart = (task.effort! * 10) % 10;
        expect(decimalPart % 1).toBeLessThan(0.01);
      });
    });
  });

  describe('generateTasksForPhase', () => {
    it('should generate complete tasks for Prepare phase', () => {
      const tasks = generateTasksForPhase('FI - Prepare', 'FI - Prepare', 100, 30);

      expect(tasks).not.toBeNull();
      expect(tasks).toHaveLength(3);
      expect(tasks![0].name).toBe('Team Mobilization');
      expect(tasks![0].effort).toBe(25);
      expect(tasks![0].workingDays).toBe(9);
      expect(tasks![0].defaultRole).toBe('Project Manager');
    });

    it('should generate complete tasks for Explore phase', () => {
      const tasks = generateTasksForPhase('MM - Explore', 'MM - Explore', 200, 45);

      expect(tasks).not.toBeNull();
      expect(tasks).toHaveLength(3);
      expect(tasks![0].name).toBe('Design Workshop');
      expect(tasks![0].effort).toBe(90); // 45% of 200
      expect(tasks![0].workingDays).toBe(18); // 40% of 45
    });

    it('should return null for unknown phase', () => {
      const tasks = generateTasksForPhase('Unknown Phase', 'Unknown', 100, 30);
      expect(tasks).toBeNull();
    });

    it('should handle zero effort/duration gracefully', () => {
      const tasks = generateTasksForPhase('FI - Prepare', 'FI - Prepare', 0, 0);

      expect(tasks).not.toBeNull();
      expect(tasks).toHaveLength(3);
      tasks!.forEach(task => {
        expect(task.effort).toBe(0);
        expect(task.workingDays).toBe(0);
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical SAP FI Prepare phase', () => {
      const tasks = generateTasksForPhase(
        'Finance (FI) - Preparation',
        'FI - Prepare',
        50, // 50 man-days
        20  // 20 working days
      );

      expect(tasks).not.toBeNull();
      expect(tasks![0].effort).toBe(12.5); // 25% of 50
      expect(tasks![1].effort).toBe(20);   // 40% of 50
      expect(tasks![2].effort).toBe(17.5); // 35% of 50

      const totalEffort = tasks!.reduce((sum, t) => sum + t.effort!, 0);
      expect(totalEffort).toBeCloseTo(50, 0.1);
    });

    it('should handle large enterprise Realize phase', () => {
      const tasks = generateTasksForPhase(
        'SD - Realize',
        'SD - Realize',
        500, // 500 man-days
        120  // 120 working days
      );

      expect(tasks).not.toBeNull();
      expect(tasks![0].name).toBe('Configure/Build');
      expect(tasks![0].effort).toBe(250); // 50% of 500
      expect(tasks![1].effort).toBe(150); // 30% of 500
      expect(tasks![2].effort).toBe(100); // 20% of 500
    });

    it('should handle Hypercare/Run phase', () => {
      const tasks = generateTasksForPhase(
        'Post Go-Live Support',
        'Hypercare - Run',
        80,  // 80 man-days
        60   // 60 working days
      );

      expect(tasks).not.toBeNull();
      expect(tasks![0].name).toBe('Hypercare Support');
      expect(tasks![0].effort).toBe(48);  // 60% of 80
      expect(tasks![0].daysPercent).toBe(100); // Full duration
      expect(tasks![0].workingDays).toBe(60);  // 100% of 60
    });
  });
});
