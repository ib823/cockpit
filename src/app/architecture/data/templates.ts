// SAP Architecture Templates
// Based on common SAP implementation patterns across industries

import type { Module, Actor, ExternalSystem } from '../types';

export interface ModuleTemplate {
  name: string;
  description: string;
  area: string;
  modules: Omit<Module, 'id'>[];
}

export interface ActorTemplate {
  name: string;
  description: string;
  actors: Omit<Actor, 'id'>[];
}

export interface SystemTemplate {
  name: string;
  description: string;
  systems: Omit<ExternalSystem, 'id'>[];
}

// System Type Options (for dropdown)
export const SYSTEM_TYPES = [
  'Industrial Control System',
  'Legacy ERP',
  'Point of Sale (POS)',
  'Payment Gateway',
  'Banking System',
  'Tax/Government Portal',
  'Manufacturing Execution System (MES)',
  'Warehouse Management System (WMS)',
  'Customer Relationship Management (CRM)',
  'E-Commerce Platform',
  'Business Intelligence/Reporting',
  'Document Management System',
  'Custom Application',
  'Third-Party Service',
];

export const SAP_MODULE_TEMPLATES: Record<string, ModuleTemplate> = {
  'fi-co-standard': {
    name: 'Finance & Controlling (Standard)',
    description: 'Core financial modules for most SAP implementations',
    area: 'Finance & Controlling',
    modules: [
    ],
  },

  'fi-co-extended': {
    name: 'Finance & Controlling (Extended)',
    description: 'Full financial suite with advanced features',
    area: 'Finance & Controlling',
    modules: [
    ],
  },

  'sd-mm': {
    name: 'Sales & Materials Management',
    description: 'Supply chain core modules',
    area: 'Supply Chain',
    modules: [
    ],
  },

  'manufacturing': {
    name: 'Manufacturing Core',
    description: 'Production planning and execution',
    area: 'Manufacturing',
    modules: [
    ],
  },

  'retail': {
    name: 'Retail Management',
    description: 'Retail-specific modules',
    area: 'Retail',
    modules: [
    ],
  },

  'hr-hcm': {
    name: 'Human Resources (HCM)',
    description: 'Human capital management',
    area: 'Human Resources',
    modules: [
    ],
  },

  'crm': {
    name: 'Customer Relationship Management',
    description: 'CRM and customer engagement',
    area: 'CRM',
    modules: [
    ],
  },

  's4-finance': {
    name: 'S/4HANA Finance',
    description: 'Modern S/4HANA financial modules',
    area: 'S/4HANA Finance',
    modules: [
    ],
  },
};

export const INTEGRATION_TEMPLATES = {
  'payment-gateway': {
    name: 'Payment Gateway Integration',
    source: 'Payment Gateway',
    target: 'SAP FI',
    method: 'REST API',
    frequency: 'Real-time',
    direction: 'Bidirectional',
    dataType: 'Payment Transaction',
    volume: '10000/day',
  },

  'weighbridge': {
    name: 'Weighbridge Interface',
    source: 'Weighbridge System',
    target: 'SAP MM',
    method: 'File Transfer',
    frequency: 'Real-time',
    direction: 'Inbound',
    dataType: 'Goods Receipt',
    volume: '500/day',
  },

  'erp-to-erp': {
    name: 'ERP to ERP Integration',
    source: 'Legacy ERP',
    target: 'SAP S/4HANA',
    method: 'IDoc',
    frequency: 'Hourly',
    direction: 'Bidirectional',
    dataType: 'Master Data, Transactions',
    volume: '5000/hour',
  },

  'pos-integration': {
    name: 'Point of Sale Integration',
    source: 'POS System',
    target: 'SAP Retail',
    method: 'REST API',
    frequency: 'Real-time',
    direction: 'Bidirectional',
    dataType: 'Sales Transactions, Inventory',
    volume: '50000/day',
  },

  'banking-interface': {
    name: 'Banking Interface',
    source: 'Bank',
    target: 'SAP FI',
    method: 'File Transfer',
    frequency: 'Daily',
    direction: 'Inbound',
    dataType: 'Bank Statement',
    volume: '1/day',
  },

  'mes-integration': {
    name: 'MES Integration',
    source: 'MES System',
    target: 'SAP PP',
    method: 'RFC',
    frequency: 'Real-time',
    direction: 'Bidirectional',
    dataType: 'Production Confirmations',
    volume: '2000/day',
  },

  'ecommerce': {
    name: 'E-Commerce Integration',
    source: 'E-Commerce Platform',
    target: 'SAP SD',
    method: 'REST API',
    frequency: 'Real-time',
    direction: 'Bidirectional',
    dataType: 'Orders, Inventory, Customer Data',
    volume: '15000/day',
  },

  'tax-authority': {
    name: 'Tax Authority Interface',
    source: 'SAP FI',
    target: 'Tax Authority Portal',
    method: 'SOAP',
    frequency: 'Monthly',
    direction: 'Outbound',
    dataType: 'Tax Returns',
    volume: '1/month',
  },
};

// ====================
// ACTOR TEMPLATES
// ====================

export const ACTOR_TEMPLATES: Record<string, ActorTemplate> = {
  'manufacturing-operations': {
    name: 'Manufacturing Operations Team',
    description: 'Typical roles in a manufacturing/production environment',
    actors: [
      {
        name: 'Plant Manager',
        role: 'Operations Management',
        activities: ['Approves production orders', 'Reviews plant performance', 'Manages operations budget'],
      },
      {
        name: 'Production Supervisor',
        role: 'Production',
        activities: ['Creates production orders', 'Confirms production', 'Manages shop floor'],
      },
      {
        name: 'Quality Inspector',
        role: 'Quality Assurance',
        activities: ['Creates inspection lots', 'Records quality results', 'Issues quality certificates'],
      },
      {
        name: 'Maintenance Engineer',
        role: 'Plant Maintenance',
        activities: ['Creates maintenance notifications', 'Schedules preventive maintenance', 'Records equipment history'],
      },
      {
        name: 'Warehouse Supervisor',
        role: 'Warehousing',
        activities: ['Manages goods receipts', 'Performs stock transfers', 'Conducts cycle counts'],
      },
    ],
  },

  'finance-team': {
    name: 'Finance Team',
    description: 'Core finance and accounting roles',
    actors: [
      {
        name: 'Finance Manager',
        role: 'Financial Management',
        activities: ['Reviews financial reports', 'Approves journal entries', 'Manages closing activities'],
      },
      {
        name: 'Accountant',
        role: 'Accounting',
        activities: ['Posts journal entries', 'Processes invoices', 'Reconciles accounts'],
      },
      {
        name: 'Accounts Payable Clerk',
        role: 'Accounts Payable',
        activities: ['Processes vendor invoices', 'Executes payment runs', 'Manages vendor accounts'],
      },
      {
        name: 'Accounts Receivable Clerk',
        role: 'Accounts Receivable',
        activities: ['Posts customer invoices', 'Processes incoming payments', 'Manages dunning'],
      },
    ],
  },

  'procurement-team': {
    name: 'Procurement & Supply Chain Team',
    description: 'Purchasing and materials management roles',
    actors: [
      {
        name: 'Procurement Manager',
        role: 'Procurement',
        activities: ['Approves purchase requisitions', 'Negotiates contracts', 'Reviews supplier performance'],
      },
      {
        name: 'Buyer',
        role: 'Purchasing',
        activities: ['Creates purchase orders', 'Manages vendor relationships', 'Processes RFQs'],
      },
      {
        name: 'Inventory Controller',
        role: 'Inventory Management',
        activities: ['Monitors stock levels', 'Manages reorder points', 'Analyzes inventory turns'],
      },
    ],
  },

  'sales-team': {
    name: 'Sales & Distribution Team',
    description: 'Customer-facing sales roles',
    actors: [
      {
        name: 'Sales Manager',
        role: 'Sales Management',
        activities: ['Approves sales orders', 'Reviews sales reports', 'Manages pricing'],
      },
      {
        name: 'Sales Representative',
        role: 'Sales',
        activities: ['Creates sales quotations', 'Processes sales orders', 'Manages customer inquiries'],
      },
      {
        name: 'Shipping Coordinator',
        role: 'Logistics',
        activities: ['Creates delivery documents', 'Prints picking lists', 'Posts goods issues'],
      },
    ],
  },

  'retail-team': {
    name: 'Retail Store Team',
    description: 'Roles in retail/store environments',
    actors: [
      {
        name: 'Store Manager',
        role: 'Store Management',
        activities: ['Reviews daily sales', 'Manages store inventory', 'Approves markdowns'],
      },
      {
        name: 'Cashier',
        role: 'Point of Sale',
        activities: ['Processes customer transactions', 'Handles returns', 'Manages cash drawer'],
      },
      {
        name: 'Stock Controller',
        role: 'Inventory',
        activities: ['Receives store deliveries', 'Performs stock takes', 'Manages replenishment'],
      },
    ],
  },

  'hr-team': {
    name: 'Human Resources Team',
    description: 'HR and payroll roles',
    actors: [
      {
        name: 'HR Manager',
        role: 'Human Resources',
        activities: ['Approves employee changes', 'Reviews HR reports', 'Manages organizational structure'],
      },
      {
        name: 'Payroll Officer',
        role: 'Payroll',
        activities: ['Processes payroll', 'Manages time data', 'Generates payslips'],
      },
      {
        name: 'Recruitment Officer',
        role: 'Talent Acquisition',
        activities: ['Posts job openings', 'Manages candidates', 'Processes new hires'],
      },
    ],
  },

  'management-team': {
    name: 'Executive Management',
    description: 'C-level and senior management roles',
    actors: [
      {
        name: 'Chief Financial Officer (CFO)',
        role: 'Financial Leadership',
        activities: ['Reviews management reports', 'Approves budgets', 'Makes strategic decisions'],
      },
      {
        name: 'Chief Operating Officer (COO)',
        role: 'Operations Leadership',
        activities: ['Reviews KPIs', 'Approves capital expenditure', 'Oversees operations'],
      },
      {
        name: 'Controller',
        role: 'Financial Control',
        activities: ['Reviews financial performance', 'Manages reporting', 'Oversees compliance'],
      },
    ],
  },
};

// ====================
// EXTERNAL SYSTEM TEMPLATES
// ====================

export const SYSTEM_TEMPLATES: Record<string, SystemTemplate> = {
  'manufacturing-systems': {
    name: 'Manufacturing Systems',
    description: 'Common systems in manufacturing plants',
    systems: [
      {
        name: 'Weighbridge System',
        type: 'Industrial Control System',
        purpose: 'Captures material weights at weighbridge for goods receipt',
        integration: 'File Transfer (XML)',
      },
      {
        name: 'MES (Manufacturing Execution System)',
        type: 'Manufacturing Execution System (MES)',
        purpose: 'Shop floor control and production confirmations',
        integration: 'RFC/REST API',
      },
      {
        name: 'SCADA/PLC System',
        type: 'Industrial Control System',
        purpose: 'Process automation and equipment monitoring',
        integration: 'OPC UA/Modbus',
      },
      {
        name: 'LIMS (Laboratory Information System)',
        type: 'Custom Application',
        purpose: 'Quality testing and lab results management',
        integration: 'REST API',
      },
    ],
  },

  'retail-systems': {
    name: 'Retail Systems',
    description: 'Common systems in retail operations',
    systems: [
      {
        name: 'POS (Point of Sale)',
        type: 'Point of Sale (POS)',
        purpose: 'Store checkout and transaction processing',
        integration: 'REST API',
      },
      {
        name: 'E-Commerce Platform',
        type: 'E-Commerce Platform',
        purpose: 'Online sales channel and customer orders',
        integration: 'REST API',
      },
      {
        name: 'Loyalty Management System',
        type: 'Customer Relationship Management (CRM)',
        purpose: 'Customer loyalty program and rewards',
        integration: 'REST API',
      },
    ],
  },

  'finance-systems': {
    name: 'Finance & Banking Systems',
    description: 'Common financial integrations',
    systems: [
      {
        name: 'Banking System',
        type: 'Banking System',
        purpose: 'Bank statement import and payment processing',
        integration: 'File Transfer (MT940/CAMT)',
      },
      {
        name: 'Payment Gateway',
        type: 'Payment Gateway',
        purpose: 'Online payment processing for customer transactions',
        integration: 'REST API',
      },
      {
        name: 'Tax Authority Portal',
        type: 'Tax/Government Portal',
        purpose: 'Tax filing and compliance reporting',
        integration: 'SOAP/File Upload',
      },
      {
        name: 'Credit Card Processor',
        type: 'Payment Gateway',
        purpose: 'Credit card payment processing',
        integration: 'REST API',
      },
    ],
  },

  'legacy-systems': {
    name: 'Legacy Systems',
    description: 'Common legacy system integrations',
    systems: [
      {
        name: 'Legacy ERP System',
        type: 'Legacy ERP',
        purpose: 'Legacy ERP to be replaced or run in parallel during transition',
        integration: 'File Transfer/IDoc',
      },
      {
        name: 'Legacy Reporting System',
        type: 'Business Intelligence/Reporting',
        purpose: 'Historical reporting database',
        integration: 'Database Connection',
      },
      {
        name: 'Custom Inventory System',
        type: 'Custom Application',
        purpose: 'Site-specific inventory management',
        integration: 'File Transfer',
      },
    ],
  },

  'common-integrations': {
    name: 'Common Enterprise Systems',
    description: 'Typical enterprise system integrations',
    systems: [
      {
        name: 'Document Management System',
        type: 'Document Management System',
        purpose: 'Document storage and archiving',
        integration: 'REST API',
      },
      {
        name: 'Business Intelligence Platform',
        type: 'Business Intelligence/Reporting',
        purpose: 'Advanced analytics and data warehouse',
        integration: 'Database Connection/OData',
      },
      {
        name: 'CRM System',
        type: 'Customer Relationship Management (CRM)',
        purpose: 'Customer relationship and sales force automation',
        integration: 'REST API/Middleware',
      },
      {
        name: 'HR/Payroll System',
        type: 'Third-Party Service',
        purpose: 'External payroll processing service',
        integration: 'File Transfer',
      },
    ],
  },
};
