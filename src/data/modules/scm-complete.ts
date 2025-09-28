import { SAPModule } from '@/data/sap-modules-complete';

export const SCM_MODULES: Record<string, SAPModule> = {
  HCM_1: {
    id: 'HCM_1',
    name: 'Personnel Administration',
    category: 'HCM',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: [],
    description: 'Employee master data, organizational management, position management',
    criticalPath: true
  },
  HCM_2: {
    id: 'HCM_2',
    name: 'Payroll',
    category: 'HCM',
    baseEffort: 60,
    complexity: 1.5,
    dependencies: ['HCM_1', 'Finance_1'],
    description: 'Payroll processing, statutory deductions, tax calculations',
    criticalPath: true
  },
  HCM_3: {
    id: 'HCM_3',
    name: 'Time Management',
    category: 'HCM',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['HCM_1'],
    description: 'Time recording, attendance, shifts, overtime calculations',
    criticalPath: false
  },
  HCM_4: {
    id: 'HCM_4',
    name: 'Benefits Administration',
    category: 'HCM',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['HCM_1', 'HCM_2'],
    description: 'Benefits enrollment, eligibility, life events processing',
    criticalPath: false
  },
  HCM_5: {
    id: 'HCM_5',
    name: 'Talent Management',
    category: 'HCM',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['HCM_1'],
    description: 'Performance management, succession planning, career development',
    criticalPath: false
  },
  HCM_6: {
    id: 'HCM_6',
    name: 'Recruitment',
    category: 'HCM',
    baseEffort: 24,
    complexity: 0.8,
    dependencies: ['HCM_1'],
    description: 'Applicant tracking, requisitions, onboarding processes',
    criticalPath: false
  },
  HCM_7: {
    id: 'HCM_7',
    name: 'Learning Management',
    category: 'HCM',
    baseEffort: 26,
    complexity: 0.8,
    dependencies: ['HCM_1'],
    description: 'Training administration, course catalog, certifications tracking',
    criticalPath: false
  },
  HCM_8: {
    id: 'HCM_8',
    name: 'Compensation Management',
    category: 'HCM',
    baseEffort: 32,
    complexity: 1.0,
    dependencies: ['HCM_1', 'HCM_2'],
    description: 'Salary planning, merit increases, bonus calculations',
    criticalPath: false
  },
  HCM_9: {
    id: 'HCM_9',
    name: 'Employee Self-Service',
    category: 'HCM',
    baseEffort: 20,
    complexity: 0.7,
    dependencies: ['HCM_1', 'Technical_3'],
    description: 'Leave requests, personal data updates, payslip access',
    criticalPath: false
  }
};