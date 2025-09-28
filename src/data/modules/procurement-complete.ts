import { SAPModule } from '@/data/sap-modules-complete';

export const PROCUREMENT_MODULES: Record<string, SAPModule> = {
  Procurement_1: {
    id: 'Procurement_1',
    name: 'Strategic Sourcing',
    category: 'Procurement',
    baseEffort: 30,
    complexity: 0.9,
    dependencies: ['SCM_1'],
    description: 'RFQ/RFP management, vendor evaluation, contract negotiation',
    criticalPath: false
  },
  Procurement_2: {
    id: 'Procurement_2',
    name: 'Contract Management',
    category: 'Procurement',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['Procurement_1', 'Finance_2'],
    description: 'Contract lifecycle, compliance monitoring, renewal management',
    criticalPath: false
  },
  Procurement_3: {
    id: 'Procurement_3',
    name: 'Catalog Management',
    category: 'Procurement',
    baseEffort: 22,
    complexity: 0.7,
    dependencies: ['SCM_1'],
    description: 'Product catalogs, punch-out catalogs, content management',
    criticalPath: false
  },
  Procurement_4: {
    id: 'Procurement_4',
    name: 'Operational Procurement',
    category: 'Procurement',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['SCM_1', 'Finance_2'],
    description: 'Purchase requisitions, PO processing, goods receipt',
    criticalPath: true
  },
  Procurement_5: {
    id: 'Procurement_5',
    name: 'Supplier Collaboration',
    category: 'Procurement',
    baseEffort: 25,
    complexity: 0.8,
    dependencies: ['Procurement_1', 'Procurement_4'],
    description: 'Vendor portals, ASN processing, supplier scorecards',
    criticalPath: false
  },
  Procurement_6: {
    id: 'Procurement_6',
    name: 'Services Procurement',
    category: 'Procurement',
    baseEffort: 32,
    complexity: 1.0,
    dependencies: ['Procurement_4', 'Finance_21'],
    description: 'Service entry sheets, milestone billing, time sheets',
    criticalPath: false
  },
  Procurement_7: {
    id: 'Procurement_7',
    name: 'Spend Analytics',
    category: 'Procurement',
    baseEffort: 26,
    complexity: 0.8,
    dependencies: ['Procurement_4'],
    description: 'Spend visibility, category analysis, savings tracking',
    criticalPath: false
  }
};