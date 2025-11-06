import { parseResourceData } from '../resource-parser';
import { parseScheduleData } from '../schedule-parser';

describe('Resource Parser', () => {
  const mockSchedule = parseScheduleData('Discovery\tTask 1\t2026-01-01\t2026-01-31').data!;

  describe('Valid Input', () => {
    it('should parse valid resource data', () => {
      const input = 'Role\tDesignation\tW1\tW2\tW3\tW4\nProject Manager\tManager\t5\t5\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources.length).toBe(1);
      expect(result.data?.totalMandays).toBe(20);
    });

    it('should infer categories correctly', () => {
      const input = 'Role\tDesignation\tW1\nProject Manager\tManager\t5\nSAP Developer\tConsultant\t5\nBasis Lead\tManager\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].category).toBe('pm');
      expect(result.data?.resources[1].category).toBe('technical');
      expect(result.data?.resources[2].category).toBe('basis');
    });

    it('should map weeks to calendar dates', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].weeklyEffort[0].weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should skip resources with zero effort', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t0\t0\nDeveloper\tConsultant\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources.length).toBe(1);
      expect(result.data?.resources[0].name).toBe('Developer');
    });

    it('should handle decimal effort values', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t2.5\t3.5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].totalDays).toBe(6);
    });

    it('should handle empty cells with dash', () => {
      const input = 'Role\tDesignation\tW1\tW2\tW3\nProject Manager\tManager\t5\t-\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].weeklyEffort.length).toBe(2);
      expect(result.data?.resources[0].totalDays).toBe(10);
    });

    it('should calculate total mandays across all resources', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t5\t5\nDeveloper\tConsultant\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.totalMandays).toBe(20);
    });

    it('should map designation variations', () => {
      const input = 'Role\tDesignation\tW1\nLead 1\tSenior Manager\t5\nLead 2\tSr Manager\t5\nLead 3\tSeniorManager\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].designation).toBe('senior_manager');
      expect(result.data?.resources[1].designation).toBe('senior_manager');
      expect(result.data?.resources[2].designation).toBe('senior_manager');
    });
  });

  describe('Validation Errors', () => {
    it('should reject empty input', () => {
      const result = parseResourceData('', mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('No resource data');
    });

    it('should reject missing role name', () => {
      const input = 'Role\tDesignation\tW1\tW2\n\tManager\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe('role');
      expect(result.errors[0].message).toContain('required');
    });

    it('should reject missing designation', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\t\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe('designation');
    });

    it('should accept unknown designation and mark for manual mapping', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tInvalidRole\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      // Parser is lenient - unknown designations are marked for manual mapping, not rejected
      expect(result.success).toBe(true);
      expect(result.data?.unmappedResources).toHaveLength(1);
      expect(result.data?.unmappedResources[0].originalDesignation).toBe('InvalidRole');
      expect(result.warnings[0]).toContain('not recognized');
    });

    it('should reject negative mandays', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t-5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('cannot be negative');
    });

    it('should reject input that is too large', () => {
      const largeInput = 'x'.repeat(600_000);
      const result = parseResourceData(largeInput, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('too large');
    });

    it('should reject SQL injection attempts', () => {
      const input = 'Role\tDesignation\tW1\nDROP TABLE\tManager\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('forbidden');
    });

    it('should reject XSS attempts', () => {
      const input = 'Role\tDesignation\tW1\n<script>alert(1)</script>\tManager\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('forbidden');
    });

    it('should reject no weekly columns', () => {
      const input = 'Role\tDesignation\nProject Manager\tManager';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('No weekly columns');
    });

    it('should reject too many resources', () => {
      const lines = ['Role\tDesignation\tW1'];
      for (let i = 0; i < 1100; i++) {
        lines.push(`Resource ${i}\tConsultant\t5`);
      }
      const input = lines.join('\n');
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Too many resources');
    });
  });

  describe('Warnings', () => {
    it('should warn for > 5 days per week', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t10\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.includes('exceeds'))).toBe(true);
    });

    it('should warn for invalid numbers', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\tabc\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Invalid number');
    });

    it('should warn for resources with zero effort', () => {
      // When a resource has zero effort, it gets skipped with a warning
      // If there's at least one other valid resource, success is true
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t0\t0\nDeveloper\tConsultant\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.includes('no effort'))).toBe(true);
    });
  });

  describe('Category Inference', () => {
    const testCases = [
      { role: 'PM', designation: 'Manager', expected: 'pm' },
      { role: 'Project Manager', designation: 'Manager', expected: 'pm' },
      { role: 'Solution Architect', designation: 'Principal', expected: 'leadership' },
      { role: 'Tech Lead', designation: 'Senior Consultant', expected: 'leadership' },
      { role: 'ABAP Developer', designation: 'Consultant', expected: 'technical' },
      { role: 'SAP Developer', designation: 'Consultant', expected: 'technical' },
      { role: 'Basis Administrator', designation: 'Consultant', expected: 'basis' },
      { role: 'Cloud Engineer', designation: 'Consultant', expected: 'basis' },
      { role: 'Security Specialist', designation: 'Consultant', expected: 'security' },
      { role: 'QA Lead', designation: 'Manager', expected: 'qa' },
      { role: 'Quality Assurance', designation: 'Consultant', expected: 'qa' },
      { role: 'Change Manager', designation: 'Manager', expected: 'change' },
      { role: 'Training Lead', designation: 'Consultant', expected: 'change' },
      { role: 'FICO Consultant', designation: 'Consultant', expected: 'functional' },
      { role: 'MM Consultant', designation: 'Consultant', expected: 'functional' },
      { role: 'SAP Consultant', designation: 'Consultant', expected: 'functional' },
      { role: 'Unknown Role', designation: 'Analyst', expected: 'other' },
    ];

    testCases.forEach(({ role, designation, expected }) => {
      it(`should infer ${expected} category for ${role}`, () => {
        const input = `Role\tDesignation\tW1\n${role}\t${designation}\t5`;
        const result = parseResourceData(input, mockSchedule);

        expect(result.success).toBe(true);
        expect(result.data?.resources[0].category).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lines in data', () => {
      const input = 'Role\tDesignation\tW1\nProject Manager\tManager\t5\n\n\nDeveloper\tConsultant\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources.length).toBe(2);
    });

    it('should handle Windows line endings', () => {
      const input = 'Role\tDesignation\tW1\r\nProject Manager\tManager\t5\r\nDeveloper\tConsultant\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources.length).toBe(2);
    });

    it('should trim whitespace from cells', () => {
      const input = 'Role\tDesignation\tW1\n  Project Manager  \t  Manager  \t  5  ';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].name).toBe('Project Manager');
    });

    it('should handle more effort columns than week headers', () => {
      const input = 'Role\tDesignation\tW1\tW2\nProject Manager\tManager\t5\t5\t5\t5\t5\t5';
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      // Should only use effort up to number of week headers (2)
      expect(result.data?.resources[0].weeklyEffort.length).toBe(2);
    });

    it('should truncate very long role names', () => {
      const longName = 'A'.repeat(300);
      const input = `Role\tDesignation\tW1\n${longName}\tManager\t5`;
      const result = parseResourceData(input, mockSchedule);

      expect(result.success).toBe(true);
      expect(result.data?.resources[0].name.length).toBeLessThanOrEqual(200);
    });
  });
});
