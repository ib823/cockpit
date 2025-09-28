import { SAPModule } from '@/data/sap-modules-complete';

export const CX_MODULES: Record<string, SAPModule> = {
  CX_1: {
    id: 'CX_1',
    name: 'Sales Cloud',
    category: 'CX',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['SCM_6'],
    description: 'Lead management, opportunity tracking, sales forecasting',
    criticalPath: false
  },
  CX_2: {
    id: 'CX_2',
    name: 'Service Cloud',
    category: 'CX',
    baseEffort: 32,
    complexity: 0.9,
    dependencies: ['CX_1'],
    description: 'Case management, knowledge base, field service',
    criticalPath: false
  },
  CX_3: {
    id: 'CX_3',
    name: 'Commerce Cloud',
    category: 'CX',
    baseEffort: 45,
    complexity: 1.2,
    dependencies: ['SCM_6', 'Finance_3'],
    description: 'B2B/B2C storefront, product catalog, checkout, order management',
    criticalPath: false
  },
  CX_4: {
    id: 'CX_4',
    name: 'Marketing Cloud',
    category: 'CX',
    baseEffort: 38,
    complexity: 1.0,
    dependencies: ['CX_1'],
    description: 'Campaign management, segmentation, marketing automation',
    criticalPath: false
  },
  CX_5: {
    id: 'CX_5',
    name: 'Customer Data Platform',
    category: 'CX',
    baseEffort: 40,
    complexity: 1.1,
    dependencies: ['CX_1', 'CX_4'],
    description: 'Customer 360 view, data unification, identity resolution',
    criticalPath: false
  },
  CX_6: {
    id: 'CX_6',
    name: 'Configure Price Quote',
    category: 'CX',
    baseEffort: 36,
    complexity: 1.1,
    dependencies: ['CX_1', 'SCM_6'],
    description: 'Product configuration, pricing rules, quote generation',
    criticalPath: false
  },
  CX_7: {
    id: 'CX_7',
    name: 'Subscription Billing',
    category: 'CX',
    baseEffort: 34,
    complexity: 1.0,
    dependencies: ['Finance_3', 'CX_3'],
    description: 'Recurring billing, usage-based pricing, subscription management',
    criticalPath: false
  },
  CX_8: {
    id: 'CX_8',
    name: 'Partner Channel Management',
    category: 'CX',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['CX_1'],
    description: 'Partner portals, deal registration, channel analytics',
    criticalPath: false
  },
  CX_9: {
    id: 'CX_9',
    name: 'Loyalty Management',
    category: 'CX',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['CX_3', 'CX_4'],
    description: 'Points programs, rewards, member tiers, promotions',
    criticalPath: false
  },
  CX_10: {
    id: 'CX_10',
    name: 'Sales Performance',
    category: 'CX',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['CX_1', 'HCM_8'],
    description: 'Quota management, incentive compensation, territory planning',
    criticalPath: false
  },
  CX_11: {
    id: 'CX_11',
    name: 'Customer Experience Analytics',
    category: 'CX',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['CX_1', 'CX_2'],
    description: 'Journey analytics, sentiment analysis, experience metrics',
    criticalPath: false
  },
  CX_12: {
    id: 'CX_12',
    name: 'Digital Asset Management',
    category: 'CX',
    baseEffort: 22,
    complexity: 0.7,
    dependencies: ['CX_3', 'CX_4'],
    description: 'Media library, content versioning, brand assets',
    criticalPath: false
  },
  CX_13: {
    id: 'CX_13',
    name: 'Customer Identity Access',
    category: 'CX',
    baseEffort: 26,
    complexity: 0.8,
    dependencies: ['CX_3', 'Technical_14'],
    description: 'SSO, consent management, preference center',
    criticalPath: false
  },
  CX_14: {
    id: 'CX_14',
    name: 'Conversational AI',
    category: 'CX',
    baseEffort: 32,
    complexity: 1.0,
    dependencies: ['CX_2'],
    description: 'Chatbots, virtual assistants, NLP integration',
    criticalPath: false
  }
};