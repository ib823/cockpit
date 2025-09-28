export interface SAPModule {
  id: string;
  name: string;
  category: string;
  baseEffort: number;
  complexity: number;
  dependencies: string[];
  description: string;
  criticalPath: boolean;
}

export const SAP_MODULES_COMPLETE: Record<string, SAPModule> = {
  // ========== FINANCE (30 modules) ==========
  Finance_1: { id: 'Finance_1', name: 'General Ledger', category: 'Finance', baseEffort: 40, complexity: 1.0, dependencies: [], description: 'Core financial accounting and reporting', criticalPath: true },
  Finance_2: { id: 'Finance_2', name: 'Accounts Payable', category: 'Finance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_1'], description: 'Vendor invoice and payment processing', criticalPath: false },
  Finance_3: { id: 'Finance_3', name: 'Accounts Receivable', category: 'Finance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_1'], description: 'Customer billing and collections', criticalPath: false },
  Finance_4: { id: 'Finance_4', name: 'Asset Accounting', category: 'Finance', baseEffort: 30, complexity: 0.9, dependencies: ['Finance_1'], description: 'Fixed asset management and depreciation', criticalPath: false },
  Finance_5: { id: 'Finance_5', name: 'Controlling', category: 'Finance', baseEffort: 45, complexity: 1.2, dependencies: ['Finance_1'], description: 'Cost center and profit center accounting', criticalPath: true },
  Finance_6: { id: 'Finance_6', name: 'Product Costing', category: 'Finance', baseEffort: 35, complexity: 1.1, dependencies: ['Finance_5'], description: 'Product cost planning and analysis', criticalPath: false },
  Finance_7: { id: 'Finance_7', name: 'Profitability Analysis', category: 'Finance', baseEffort: 30, complexity: 1.0, dependencies: ['Finance_5'], description: 'Segment profitability reporting', criticalPath: false },
  Finance_8: { id: 'Finance_8', name: 'Internal Orders', category: 'Finance', baseEffort: 20, complexity: 0.7, dependencies: ['Finance_5'], description: 'Internal cost tracking', criticalPath: false },
  Finance_9: { id: 'Finance_9', name: 'Cash Management', category: 'Finance', baseEffort: 35, complexity: 0.9, dependencies: ['Finance_1'], description: 'Cash position and liquidity forecast', criticalPath: false },
  Finance_10: { id: 'Finance_10', name: 'Bank Accounting', category: 'Finance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_9'], description: 'Bank statement processing', criticalPath: false },
  Finance_11: { id: 'Finance_11', name: 'Tax Accounting', category: 'Finance', baseEffort: 40, complexity: 1.3, dependencies: ['Finance_1'], description: 'GST/VAT/WHT processing', criticalPath: true },
  Finance_12: { id: 'Finance_12', name: 'Financial Consolidation', category: 'Finance', baseEffort: 50, complexity: 1.4, dependencies: ['Finance_1'], description: 'Group consolidation and reporting', criticalPath: false },
  Finance_13: { id: 'Finance_13', name: 'Treasury', category: 'Finance', baseEffort: 45, complexity: 1.2, dependencies: ['Finance_9'], description: 'Treasury and risk management', criticalPath: false },
  Finance_14: { id: 'Finance_14', name: 'Travel Management', category: 'Finance', baseEffort: 20, complexity: 0.7, dependencies: ['Finance_2'], description: 'Travel expense processing', criticalPath: false },
  Finance_15: { id: 'Finance_15', name: 'Budget Management', category: 'Finance', baseEffort: 30, complexity: 0.9, dependencies: ['Finance_5'], description: 'Budget planning and control', criticalPath: false },
  Finance_16: { id: 'Finance_16', name: 'Project Accounting', category: 'Finance', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_5'], description: 'Project cost and revenue tracking', criticalPath: false },
  Finance_17: { id: 'Finance_17', name: 'Lease Accounting', category: 'Finance', baseEffort: 25, complexity: 0.9, dependencies: ['Finance_4'], description: 'IFRS 16 lease management', criticalPath: false },
  Finance_18: { id: 'Finance_18', name: 'Credit Management', category: 'Finance', baseEffort: 30, complexity: 0.9, dependencies: ['Finance_3'], description: 'Credit limit and risk management', criticalPath: false },
  Finance_19: { id: 'Finance_19', name: 'Collections Management', category: 'Finance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_18'], description: 'Dunning and collections', criticalPath: false },
  Finance_20: { id: 'Finance_20', name: 'Electronic Banking', category: 'Finance', baseEffort: 30, complexity: 1.0, dependencies: ['Finance_10'], description: 'Electronic payment processing', criticalPath: false },
  Finance_21: { id: 'Finance_21', name: 'Intercompany Processing', category: 'Finance', baseEffort: 35, complexity: 1.1, dependencies: ['Finance_1'], description: 'Intercompany reconciliation', criticalPath: false },
  Finance_22: { id: 'Finance_22', name: 'Financial Planning', category: 'Finance', baseEffort: 40, complexity: 1.1, dependencies: ['Finance_15'], description: 'Financial planning and analysis', criticalPath: false },
  Finance_23: { id: 'Finance_23', name: 'Cost of Sales Accounting', category: 'Finance', baseEffort: 30, complexity: 1.0, dependencies: ['Finance_5'], description: 'COGS calculation and reporting', criticalPath: false },
  Finance_24: { id: 'Finance_24', name: 'Revenue Recognition', category: 'Finance', baseEffort: 35, complexity: 1.2, dependencies: ['Finance_1'], description: 'IFRS 15 revenue recognition', criticalPath: true },
  Finance_25: { id: 'Finance_25', name: 'Funds Management', category: 'Finance', baseEffort: 30, complexity: 0.9, dependencies: ['Finance_15'], description: 'Public sector fund accounting', criticalPath: false },
  Finance_26: { id: 'Finance_26', name: 'Real Estate Management', category: 'Finance', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_1'], description: 'Property and lease management', criticalPath: false },
  Finance_27: { id: 'Finance_27', name: 'Joint Venture Accounting', category: 'Finance', baseEffort: 30, complexity: 1.0, dependencies: ['Finance_1'], description: 'JV accounting and reporting', criticalPath: false },
  Finance_28: { id: 'Finance_28', name: 'Financial Closing Cockpit', category: 'Finance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_1'], description: 'Period-end closing automation', criticalPath: false },
  Finance_29: { id: 'Finance_29', name: 'Central Finance', category: 'Finance', baseEffort: 60, complexity: 1.5, dependencies: ['Finance_1'], description: 'Central finance replication', criticalPath: false },
  Finance_30: { id: 'Finance_30', name: 'Group Reporting', category: 'Finance', baseEffort: 40, complexity: 1.2, dependencies: ['Finance_12'], description: 'Consolidated financial reporting', criticalPath: false },

  // ========== SUPPLY CHAIN (8 modules) ==========
  SCM_1: { id: 'SCM_1', name: 'Materials Management', category: 'SCM', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_1'], description: 'Procurement and inventory', criticalPath: true },
  SCM_2: { id: 'SCM_2', name: 'Production Planning', category: 'SCM', baseEffort: 50, complexity: 1.3, dependencies: ['SCM_1'], description: 'Manufacturing planning', criticalPath: true },
  SCM_3: { id: 'SCM_3', name: 'Quality Management', category: 'SCM', baseEffort: 25, complexity: 0.8, dependencies: ['SCM_1'], description: 'Quality inspection', criticalPath: false },
  SCM_4: { id: 'SCM_4', name: 'Plant Maintenance', category: 'SCM', baseEffort: 30, complexity: 0.9, dependencies: ['SCM_1'], description: 'Asset maintenance', criticalPath: false },
  SCM_5: { id: 'SCM_5', name: 'Sales & Distribution', category: 'SCM', baseEffort: 40, complexity: 1.1, dependencies: ['SCM_1', 'Finance_3'], description: 'Order to cash', criticalPath: true },
  SCM_6: { id: 'SCM_6', name: 'Warehouse Management', category: 'SCM', baseEffort: 35, complexity: 1.0, dependencies: ['SCM_1'], description: 'Warehouse operations', criticalPath: false },
  SCM_7: { id: 'SCM_7', name: 'Transportation Management', category: 'SCM', baseEffort: 30, complexity: 0.9, dependencies: ['SCM_5'], description: 'Logistics and shipping', criticalPath: false },
  SCM_8: { id: 'SCM_8', name: 'Extended Warehouse Management', category: 'SCM', baseEffort: 45, complexity: 1.2, dependencies: ['SCM_6'], description: 'Advanced warehouse operations', criticalPath: false },

  // ========== HUMAN CAPITAL (9 modules) ==========
  HCM_1: { id: 'HCM_1', name: 'Personnel Administration', category: 'HCM', baseEffort: 30, complexity: 0.9, dependencies: [], description: 'Employee master data', criticalPath: true },
  HCM_2: { id: 'HCM_2', name: 'Payroll', category: 'HCM', baseEffort: 60, complexity: 1.5, dependencies: ['HCM_1', 'Finance_1'], description: 'Payroll processing', criticalPath: true },
  HCM_3: { id: 'HCM_3', name: 'Time Management', category: 'HCM', baseEffort: 25, complexity: 0.8, dependencies: ['HCM_1'], description: 'Time and attendance', criticalPath: false },
  HCM_4: { id: 'HCM_4', name: 'Benefits Administration', category: 'HCM', baseEffort: 30, complexity: 0.9, dependencies: ['HCM_1'], description: 'Employee benefits', criticalPath: false },
  HCM_5: { id: 'HCM_5', name: 'Recruitment', category: 'HCM', baseEffort: 25, complexity: 0.8, dependencies: ['HCM_1'], description: 'Talent acquisition', criticalPath: false },
  HCM_6: { id: 'HCM_6', name: 'Performance Management', category: 'HCM', baseEffort: 20, complexity: 0.7, dependencies: ['HCM_1'], description: 'Performance reviews', criticalPath: false },
  HCM_7: { id: 'HCM_7', name: 'Learning Management', category: 'HCM', baseEffort: 20, complexity: 0.7, dependencies: ['HCM_1'], description: 'Training and development', criticalPath: false },
  HCM_8: { id: 'HCM_8', name: 'Succession Planning', category: 'HCM', baseEffort: 20, complexity: 0.7, dependencies: ['HCM_6'], description: 'Career planning', criticalPath: false },
  HCM_9: { id: 'HCM_9', name: 'Compensation Management', category: 'HCM', baseEffort: 30, complexity: 0.9, dependencies: ['HCM_1'], description: 'Compensation planning', criticalPath: false },

  // ========== PROCUREMENT (7 modules) ==========
  PROC_1: { id: 'PROC_1', name: 'Strategic Sourcing', category: 'Procurement', baseEffort: 30, complexity: 1.0, dependencies: ['SCM_1'], description: 'Supplier and contract management', criticalPath: false },
  PROC_2: { id: 'PROC_2', name: 'Operational Procurement', category: 'Procurement', baseEffort: 25, complexity: 0.9, dependencies: ['PROC_1'], description: 'Purchase requisitions and orders', criticalPath: false },
  PROC_3: { id: 'PROC_3', name: 'Invoice Management', category: 'Procurement', baseEffort: 20, complexity: 0.8, dependencies: ['Finance_2'], description: 'Invoice processing and matching', criticalPath: false },
  PROC_4: { id: 'PROC_4', name: 'Catalog Management', category: 'Procurement', baseEffort: 20, complexity: 0.7, dependencies: ['PROC_1'], description: 'Product catalog management', criticalPath: false },
  PROC_5: { id: 'PROC_5', name: 'Contract Management', category: 'Procurement', baseEffort: 25, complexity: 0.9, dependencies: ['PROC_1'], description: 'Contract lifecycle management', criticalPath: false },
  PROC_6: { id: 'PROC_6', name: 'Supplier Management', category: 'Procurement', baseEffort: 25, complexity: 0.9, dependencies: ['PROC_1'], description: 'Supplier onboarding and evaluation', criticalPath: false },
  PROC_7: { id: 'PROC_7', name: 'Spend Analysis', category: 'Procurement', baseEffort: 20, complexity: 0.8, dependencies: ['PROC_1'], description: 'Spend visibility and analytics', criticalPath: false },

  // ========== CUSTOMER EXPERIENCE (14 modules) ==========
  CX_1: { id: 'CX_1', name: 'Sales Cloud', category: 'CX', baseEffort: 35, complexity: 1.0, dependencies: [], description: 'Sales force automation', criticalPath: false },
  CX_2: { id: 'CX_2', name: 'Service Cloud', category: 'CX', baseEffort: 30, complexity: 0.9, dependencies: [], description: 'Customer service management', criticalPath: false },
  CX_3: { id: 'CX_3', name: 'Commerce Cloud', category: 'CX', baseEffort: 40, complexity: 1.2, dependencies: ['SCM_5'], description: 'E-commerce platform', criticalPath: false },
  CX_4: { id: 'CX_4', name: 'Marketing Cloud', category: 'CX', baseEffort: 35, complexity: 1.1, dependencies: [], description: 'Marketing automation', criticalPath: false },
  CX_5: { id: 'CX_5', name: 'Customer Data Platform', category: 'CX', baseEffort: 30, complexity: 1.0, dependencies: [], description: 'Customer data unification', criticalPath: false },
  CX_6: { id: 'CX_6', name: 'Field Service Management', category: 'CX', baseEffort: 30, complexity: 0.9, dependencies: ['CX_2'], description: 'Field service operations', criticalPath: false },
  CX_7: { id: 'CX_7', name: 'CPQ', category: 'CX', baseEffort: 35, complexity: 1.1, dependencies: ['CX_1'], description: 'Configure price quote', criticalPath: false },
  CX_8: { id: 'CX_8', name: 'Subscription Billing', category: 'CX', baseEffort: 30, complexity: 1.0, dependencies: ['Finance_3'], description: 'Subscription management', criticalPath: false },
  CX_9: { id: 'CX_9', name: 'Sales Performance', category: 'CX', baseEffort: 25, complexity: 0.8, dependencies: ['CX_1'], description: 'Sales analytics and forecasting', criticalPath: false },
  CX_10: { id: 'CX_10', name: 'Customer Identity', category: 'CX', baseEffort: 25, complexity: 0.9, dependencies: ['CX_5'], description: 'Customer identity and access', criticalPath: false },
  CX_11: { id: 'CX_11', name: 'Loyalty Management', category: 'CX', baseEffort: 25, complexity: 0.8, dependencies: ['CX_4'], description: 'Customer loyalty programs', criticalPath: false },
  CX_12: { id: 'CX_12', name: 'Trade Promotion', category: 'CX', baseEffort: 30, complexity: 0.9, dependencies: ['CX_1'], description: 'Trade promotion management', criticalPath: false },
  CX_13: { id: 'CX_13', name: 'Customer Analytics', category: 'CX', baseEffort: 25, complexity: 0.9, dependencies: ['CX_5'], description: 'Customer insights and analytics', criticalPath: false },
  CX_14: { id: 'CX_14', name: 'Social Studio', category: 'CX', baseEffort: 20, complexity: 0.7, dependencies: ['CX_4'], description: 'Social media management', criticalPath: false },

  // ========== TECHNICAL (20 modules) ==========
  Technical_1: { id: 'Technical_1', name: 'Basis Configuration', category: 'Technical', baseEffort: 20, complexity: 1.0, dependencies: [], description: 'System setup', criticalPath: true },
  Technical_2: { id: 'Technical_2', name: 'Data Migration', category: 'Technical', baseEffort: 40, complexity: 1.2, dependencies: [], description: 'Data migration', criticalPath: true },
  Technical_3: { id: 'Technical_3', name: 'Integration Platform', category: 'Technical', baseEffort: 35, complexity: 1.1, dependencies: ['Technical_1'], description: 'System integration', criticalPath: true },
  Technical_4: { id: 'Technical_4', name: 'Security & Authorization', category: 'Technical', baseEffort: 30, complexity: 1.0, dependencies: ['Technical_1'], description: 'Security setup', criticalPath: true },
  Technical_5: { id: 'Technical_5', name: 'Workflow Management', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_1'], description: 'Workflow configuration', criticalPath: false },
  Technical_6: { id: 'Technical_6', name: 'Output Management', category: 'Technical', baseEffort: 20, complexity: 0.7, dependencies: ['Technical_1'], description: 'Forms and outputs', criticalPath: false },
  Technical_7: { id: 'Technical_7', name: 'Archiving', category: 'Technical', baseEffort: 20, complexity: 0.7, dependencies: ['Technical_1'], description: 'Data archiving', criticalPath: false },
  Technical_8: { id: 'Technical_8', name: 'Performance Tuning', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_1'], description: 'System optimization', criticalPath: false },
  Technical_9: { id: 'Technical_9', name: 'System Monitoring', category: 'Technical', baseEffort: 20, complexity: 0.7, dependencies: ['Technical_1'], description: 'Monitoring setup', criticalPath: false },
  Technical_10: { id: 'Technical_10', name: 'Backup & Recovery', category: 'Technical', baseEffort: 20, complexity: 0.8, dependencies: ['Technical_1'], description: 'Backup strategy', criticalPath: false },
  Technical_11: { id: 'Technical_11', name: 'Transport Management', category: 'Technical', baseEffort: 15, complexity: 0.6, dependencies: ['Technical_1'], description: 'Transport configuration', criticalPath: false },
  Technical_12: { id: 'Technical_12', name: 'Custom Development', category: 'Technical', baseEffort: 50, complexity: 1.3, dependencies: ['Technical_1'], description: 'Custom ABAP development', criticalPath: false },
  Technical_13: { id: 'Technical_13', name: 'Fiori Configuration', category: 'Technical', baseEffort: 30, complexity: 1.0, dependencies: ['Technical_1'], description: 'Fiori launchpad setup', criticalPath: false },
  Technical_14: { id: 'Technical_14', name: 'Mobile Platform', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_13'], description: 'Mobile app deployment', criticalPath: false },
  Technical_15: { id: 'Technical_15', name: 'EDI Setup', category: 'Technical', baseEffort: 30, complexity: 1.0, dependencies: ['Technical_3'], description: 'EDI configuration', criticalPath: false },
  Technical_16: { id: 'Technical_16', name: 'API Management', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_3'], description: 'API gateway setup', criticalPath: false },
  Technical_17: { id: 'Technical_17', name: 'Master Data Governance', category: 'Technical', baseEffort: 35, complexity: 1.1, dependencies: ['Technical_2'], description: 'MDG configuration', criticalPath: false },
  Technical_18: { id: 'Technical_18', name: 'Business Rules', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_5'], description: 'Business rules framework', criticalPath: false },
  Technical_19: { id: 'Technical_19', name: 'Process Orchestration', category: 'Technical', baseEffort: 30, complexity: 1.0, dependencies: ['Technical_3'], description: 'Process integration', criticalPath: false },
  Technical_20: { id: 'Technical_20', name: 'Event Mesh', category: 'Technical', baseEffort: 25, complexity: 0.9, dependencies: ['Technical_3'], description: 'Event-driven architecture', criticalPath: false },

  // ========== ANALYTICS (15 modules) ==========
  Analytics_1: { id: 'Analytics_1', name: 'SAP Analytics Cloud', category: 'Analytics', baseEffort: 40, complexity: 1.1, dependencies: [], description: 'Business intelligence platform', criticalPath: false },
  Analytics_2: { id: 'Analytics_2', name: 'Embedded Analytics', category: 'Analytics', baseEffort: 25, complexity: 0.8, dependencies: ['Analytics_1'], description: 'Real-time operational reporting', criticalPath: false },
  Analytics_3: { id: 'Analytics_3', name: 'Planning & Consolidation', category: 'Analytics', baseEffort: 35, complexity: 1.1, dependencies: ['Finance_1'], description: 'Financial planning', criticalPath: false },
  Analytics_4: { id: 'Analytics_4', name: 'Predictive Analytics', category: 'Analytics', baseEffort: 30, complexity: 1.0, dependencies: ['Analytics_1'], description: 'Predictive modeling', criticalPath: false },
  Analytics_5: { id: 'Analytics_5', name: 'Data Warehousing', category: 'Analytics', baseEffort: 40, complexity: 1.2, dependencies: ['Technical_2'], description: 'Data warehouse setup', criticalPath: false },
  Analytics_6: { id: 'Analytics_6', name: 'Business Warehouse', category: 'Analytics', baseEffort: 45, complexity: 1.2, dependencies: ['Analytics_5'], description: 'BW/4HANA setup', criticalPath: false },
  Analytics_7: { id: 'Analytics_7', name: 'Data Intelligence', category: 'Analytics', baseEffort: 35, complexity: 1.1, dependencies: ['Analytics_5'], description: 'Data orchestration', criticalPath: false },
  Analytics_8: { id: 'Analytics_8', name: 'Information Steward', category: 'Analytics', baseEffort: 25, complexity: 0.8, dependencies: ['Technical_17'], description: 'Data quality management', criticalPath: false },
  Analytics_9: { id: 'Analytics_9', name: 'Smart Predict', category: 'Analytics', baseEffort: 25, complexity: 0.9, dependencies: ['Analytics_4'], description: 'Automated machine learning', criticalPath: false },
  Analytics_10: { id: 'Analytics_10', name: 'Digital Boardroom', category: 'Analytics', baseEffort: 20, complexity: 0.7, dependencies: ['Analytics_1'], description: 'Executive dashboards', criticalPath: false },
  Analytics_11: { id: 'Analytics_11', name: 'Analytics Designer', category: 'Analytics', baseEffort: 25, complexity: 0.8, dependencies: ['Analytics_1'], description: 'Custom analytics apps', criticalPath: false },
  Analytics_12: { id: 'Analytics_12', name: 'Data Catalog', category: 'Analytics', baseEffort: 20, complexity: 0.7, dependencies: ['Analytics_7'], description: 'Metadata management', criticalPath: false },
  Analytics_13: { id: 'Analytics_13', name: 'Analytics Hub', category: 'Analytics', baseEffort: 25, complexity: 0.8, dependencies: ['Analytics_1'], description: 'Analytics content sharing', criticalPath: false },
  Analytics_14: { id: 'Analytics_14', name: 'Augmented Analytics', category: 'Analytics', baseEffort: 20, complexity: 0.8, dependencies: ['Analytics_1'], description: 'AI-powered insights', criticalPath: false },
  Analytics_15: { id: 'Analytics_15', name: 'Analytics Path', category: 'Analytics', baseEffort: 20, complexity: 0.7, dependencies: ['Analytics_1'], description: 'Guided analytics', criticalPath: false },

  // ========== INDUSTRY SPECIFIC (20 modules) ==========
  Industry_1: { id: 'Industry_1', name: 'Retail Merchandising', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['SCM_1'], description: 'Retail specific processes', criticalPath: false },
  Industry_2: { id: 'Industry_2', name: 'Banking Services', category: 'Industry', baseEffort: 45, complexity: 1.2, dependencies: ['Finance_1'], description: 'Banking operations', criticalPath: false },
  Industry_3: { id: 'Industry_3', name: 'Insurance Management', category: 'Industry', baseEffort: 45, complexity: 1.2, dependencies: ['Finance_1'], description: 'Insurance processes', criticalPath: false },
  Industry_4: { id: 'Industry_4', name: 'Utilities', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['CX_2'], description: 'Utility billing and services', criticalPath: false },
  Industry_5: { id: 'Industry_5', name: 'Healthcare', category: 'Industry', baseEffort: 45, complexity: 1.2, dependencies: ['HCM_1'], description: 'Healthcare management', criticalPath: false },
  Industry_6: { id: 'Industry_6', name: 'Public Sector', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['Finance_25'], description: 'Government processes', criticalPath: false },
  Industry_7: { id: 'Industry_7', name: 'Oil & Gas', category: 'Industry', baseEffort: 45, complexity: 1.2, dependencies: ['SCM_4'], description: 'Upstream/downstream operations', criticalPath: false },
  Industry_8: { id: 'Industry_8', name: 'Automotive', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['SCM_2'], description: 'Automotive manufacturing', criticalPath: false },
  Industry_9: { id: 'Industry_9', name: 'Aerospace & Defense', category: 'Industry', baseEffort: 45, complexity: 1.3, dependencies: ['SCM_2'], description: 'A&D specific requirements', criticalPath: false },
  Industry_10: { id: 'Industry_10', name: 'Chemicals', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['SCM_3'], description: 'Chemical industry processes', criticalPath: false },
  Industry_11: { id: 'Industry_11', name: 'Pharma', category: 'Industry', baseEffort: 45, complexity: 1.3, dependencies: ['SCM_3'], description: 'Pharmaceutical compliance', criticalPath: false },
  Industry_12: { id: 'Industry_12', name: 'Consumer Products', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['SCM_5'], description: 'CPG processes', criticalPath: false },
  Industry_13: { id: 'Industry_13', name: 'High Tech', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['SCM_2'], description: 'Electronics manufacturing', criticalPath: false },
  Industry_14: { id: 'Industry_14', name: 'Telecommunications', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['CX_8'], description: 'Telco billing and services', criticalPath: false },
  Industry_15: { id: 'Industry_15', name: 'Media', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_24'], description: 'Media and entertainment', criticalPath: false },
  Industry_16: { id: 'Industry_16', name: 'Professional Services', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_16'], description: 'Services automation', criticalPath: false },
  Industry_17: { id: 'Industry_17', name: 'Engineering & Construction', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['Finance_16'], description: 'Project-based operations', criticalPath: false },
  Industry_18: { id: 'Industry_18', name: 'Real Estate', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['Finance_26'], description: 'Property management', criticalPath: false },
  Industry_19: { id: 'Industry_19', name: 'Transportation', category: 'Industry', baseEffort: 35, complexity: 1.0, dependencies: ['SCM_7'], description: 'Logistics operations', criticalPath: false },
  Industry_20: { id: 'Industry_20', name: 'Mining', category: 'Industry', baseEffort: 40, complexity: 1.1, dependencies: ['SCM_4'], description: 'Mining operations', criticalPath: false },

  // ========== COMPLIANCE (9 modules) ==========
  Compliance_1: { id: 'Compliance_1', name: 'GRC Risk Management', category: 'Compliance', baseEffort: 35, complexity: 1.0, dependencies: [], description: 'Risk management framework', criticalPath: false },
  Compliance_2: { id: 'Compliance_2', name: 'GRC Audit Management', category: 'Compliance', baseEffort: 30, complexity: 0.9, dependencies: ['Compliance_1'], description: 'Audit management', criticalPath: false },
  Compliance_3: { id: 'Compliance_3', name: 'GRC Process Control', category: 'Compliance', baseEffort: 30, complexity: 0.9, dependencies: ['Compliance_1'], description: 'Internal controls', criticalPath: false },
  Compliance_4: { id: 'Compliance_4', name: 'GRC Access Control', category: 'Compliance', baseEffort: 35, complexity: 1.0, dependencies: ['Technical_4'], description: 'Access governance', criticalPath: false },
  Compliance_5: { id: 'Compliance_5', name: 'Tax Compliance', category: 'Compliance', baseEffort: 35, complexity: 1.1, dependencies: ['Finance_11'], description: 'Tax reporting compliance', criticalPath: false },
  Compliance_6: { id: 'Compliance_6', name: 'E-Invoicing', category: 'Compliance', baseEffort: 25, complexity: 0.8, dependencies: ['Finance_3'], description: 'Electronic invoicing', criticalPath: false },
  Compliance_7: { id: 'Compliance_7', name: 'Privacy & GDPR', category: 'Compliance', baseEffort: 30, complexity: 1.0, dependencies: ['Technical_4'], description: 'Data privacy compliance', criticalPath: false },
  Compliance_8: { id: 'Compliance_8', name: 'Environmental Compliance', category: 'Compliance', baseEffort: 25, complexity: 0.8, dependencies: [], description: 'EHS compliance', criticalPath: false },
  Compliance_9: { id: 'Compliance_9', name: 'Trade Compliance', category: 'Compliance', baseEffort: 30, complexity: 0.9, dependencies: ['SCM_7'], description: 'Import/export compliance', criticalPath: false }
};

export function getModuleDependencies(moduleId: string): string[] {
  const module = SAP_MODULES_COMPLETE[moduleId];
  if (!module) return [];

  const deps = new Set<string>(module.dependencies);

  module.dependencies.forEach(depId => {
    getModuleDependencies(depId).forEach(d => deps.add(d));
  });

  return Array.from(deps);
}

export function calculateModuleEffort(moduleIds: string[]): number {
  return moduleIds.reduce((total, id) => {
    const module = SAP_MODULES_COMPLETE[id];
    return total + (module ? module.baseEffort * module.complexity : 0);
  }, 0);
}
