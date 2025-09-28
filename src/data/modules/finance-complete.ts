import { SAPModule } from '@/data/sap-modules-complete';

export const FINANCE_MODULES: Record<string, SAPModule> = {
  Finance_1: {
    id: 'Finance_1',
    name: 'General Ledger',
    category: 'Finance',
    baseEffort: 40,
    complexity: 1.0,
    dependencies: [],
    description: 'Core GL with chart of accounts, cost centers, profit centers',
    criticalPath: true
  },
  Finance_2: {
    id: 'Finance_2',
    name: 'Accounts Payable',
    category: 'Finance',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['Finance_1'],
    description: 'Vendor management, invoice processing, payment runs',
    criticalPath: false
  },
  Finance_3: {
    id: 'Finance_3',
    name: 'Accounts Receivable',
    category: 'Finance',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['Finance_1'],
    description: 'Customer management, billing, collections, credit management',
    criticalPath: false
  },
  Finance_4: {
    id: 'Finance_4',
    name: 'Asset Accounting',
    category: 'Finance',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['Finance_1'],
    description: 'Fixed asset lifecycle, depreciation, asset transactions',
    criticalPath: false
  },
  Finance_5: {
    id: 'Finance_5',
    name: 'Controlling - Cost Centers',
    category: 'Finance',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['Finance_1'],
    description: 'Cost center accounting, allocations, planning',
    criticalPath: true
  },
  Finance_6: {
    id: 'Finance_6',
    name: 'Controlling - Profit Centers',
    category: 'Finance',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['Finance_1', 'Finance_5'],
    description: 'Profit center accounting, transfer pricing',
    criticalPath: false
  },
  Finance_7: {
    id: 'Finance_7',
    name: 'Internal Orders',
    category: 'Finance',
    baseEffort: 20,
    complexity: 0.7,
    dependencies: ['Finance_5'],
    description: 'Internal cost tracking, overhead projects',
    criticalPath: false
  },
  Finance_8: {
    id: 'Finance_8',
    name: 'Product Costing',
    category: 'Finance',
    baseEffort: 45,
    complexity: 1.2,
    dependencies: ['Finance_5', 'SCM_2'],
    description: 'Standard costing, actual costing, variance analysis',
    criticalPath: true
  },
  Finance_9: {
    id: 'Finance_9',
    name: 'Profitability Analysis',
    category: 'Finance',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['Finance_6'],
    description: 'Multi-dimensional profitability reporting',
    criticalPath: false
  },
  Finance_10: {
    id: 'Finance_10',
    name: 'Cash Management',
    category: 'Finance',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['Finance_2', 'Finance_3'],
    description: 'Cash position, liquidity forecast, bank reconciliation',
    criticalPath: false
  },
  Finance_11: {
    id: 'Finance_11',
    name: 'Treasury Management',
    category: 'Finance',
    baseEffort: 40,
    complexity: 1.1,
    dependencies: ['Finance_10'],
    description: 'Cash operations, risk management, hedge accounting',
    criticalPath: false
  },
  Finance_12: {
    id: 'Finance_12',
    name: 'Tax Management',
    category: 'Finance',
    baseEffort: 35,
    complexity: 1.2,
    dependencies: ['Finance_1', 'Finance_2', 'Finance_3'],
    description: 'GST, VAT, withholding tax configuration',
    criticalPath: true
  },
  Finance_13: {
    id: 'Finance_13',
    name: 'Financial Consolidation',
    category: 'Finance',
    baseEffort: 50,
    complexity: 1.3,
    dependencies: ['Finance_1', 'Finance_9'],
    description: 'Group consolidation, elimination, currency translation',
    criticalPath: false
  },
  Finance_14: {
    id: 'Finance_14',
    name: 'Budgeting & Planning',
    category: 'Finance',
    baseEffort: 40,
    complexity: 1.0,
    dependencies: ['Finance_5', 'Finance_6'],
    description: 'Budget preparation, allocation, version management',
    criticalPath: false
  },
  Finance_15: {
    id: 'Finance_15',
    name: 'Financial Reporting',
    category: 'Finance',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['Finance_1'],
    description: 'Financial statements, statutory reports, management reports',
    criticalPath: true
  },
  Finance_16: {
    id: 'Finance_16',
    name: 'Bank Statement Processing',
    category: 'Finance',
    baseEffort: 20,
    complexity: 0.7,
    dependencies: ['Finance_10'],
    description: 'Electronic bank statement import and reconciliation',
    criticalPath: false
  },
  Finance_17: {
    id: 'Finance_17',
    name: 'Credit Management',
    category: 'Finance',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['Finance_3'],
    description: 'Credit limits, credit blocks, risk categories',
    criticalPath: false
  },
  Finance_18: {
    id: 'Finance_18',
    name: 'Collections Management',
    category: 'Finance',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['Finance_3', 'Finance_17'],
    description: 'Dunning procedures, collection strategies, dispute management',
    criticalPath: false
  },
  Finance_19: {
    id: 'Finance_19',
    name: 'Travel & Expense',
    category: 'Finance',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['Finance_2', 'HCM_1'],
    description: 'Travel requests, expense reports, per diem calculations',
    criticalPath: false
  },
  Finance_20: {
    id: 'Finance_20',
    name: 'Lease Accounting',
    category: 'Finance',
    baseEffort: 32,
    complexity: 1.0,
    dependencies: ['Finance_4'],
    description: 'IFRS 16 compliance, lease contracts, right-of-use assets',
    criticalPath: false
  },
  Finance_21: {
    id: 'Finance_21',
    name: 'Project Systems',
    category: 'Finance',
    baseEffort: 38,
    complexity: 1.1,
    dependencies: ['Finance_5', 'Finance_7'],
    description: 'Project planning, budgeting, execution, settlement',
    criticalPath: false
  },
  Finance_22: {
    id: 'Finance_22',
    name: 'Investment Management',
    category: 'Finance',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['Finance_4', 'Finance_21'],
    description: 'Capital investment programs, appropriation requests',
    criticalPath: false
  },
  Finance_23: {
    id: 'Finance_23',
    name: 'Funds Management',
    category: 'Finance',
    baseEffort: 33,
    complexity: 1.0,
    dependencies: ['Finance_14'],
    description: 'Budget availability control, commitment management',
    criticalPath: false
  },
  Finance_24: {
    id: 'Finance_24',
    name: 'Grant Management',
    category: 'Finance',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['Finance_21', 'Finance_23'],
    description: 'Grant budgeting, monitoring, reporting',
    criticalPath: false
  },
  Finance_25: {
    id: 'Finance_25',
    name: 'Real Estate Management',
    category: 'Finance',
    baseEffort: 36,
    complexity: 1.0,
    dependencies: ['Finance_4', 'Finance_20'],
    description: 'Property management, rental contracts, facility costs',
    criticalPath: false
  },
  Finance_26: {
    id: 'Finance_26',
    name: 'Insurance Management',
    category: 'Finance',
    baseEffort: 24,
    complexity: 0.8,
    dependencies: ['Finance_2', 'Finance_4'],
    description: 'Insurance policies, claims processing, risk coverage',
    criticalPath: false
  },
  Finance_27: {
    id: 'Finance_27',
    name: 'Intercompany Transactions',
    category: 'Finance',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['Finance_1', 'Finance_2', 'Finance_3'],
    description: 'Intercompany billing, netting, reconciliation',
    criticalPath: false
  },
  Finance_28: {
    id: 'Finance_28',
    name: 'Financial Supply Chain',
    category: 'Finance',
    baseEffort: 34,
    complexity: 1.0,
    dependencies: ['Finance_10', 'Finance_11'],
    description: 'Supply chain financing, dynamic discounting, reverse factoring',
    criticalPath: false
  },
  Finance_29: {
    id: 'Finance_29',
    name: 'Revenue Recognition',
    category: 'Finance',
    baseEffort: 42,
    complexity: 1.2,
    dependencies: ['Finance_3', 'Finance_9'],
    description: 'IFRS 15 compliance, contract management, POB calculations',
    criticalPath: true
  },
  Finance_30: {
    id: 'Finance_30',
    name: 'Financial Closing Cockpit',
    category: 'Finance',
    baseEffort: 26,
    complexity: 0.8,
    dependencies: ['Finance_1', 'Finance_15'],
    description: 'Period-end closing tasks, scheduling, monitoring',
    criticalPath: true
  }
};