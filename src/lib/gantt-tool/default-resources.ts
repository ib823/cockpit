/**
 * Default Pre-configured Resources for Gantt Tool
 *
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 * All categories, all designations, no clutter.
 */

import type { Resource } from '@/types/gantt-tool';
import { nanoid } from 'nanoid';

export function createDefaultResources(): Resource[] {
  const now = new Date().toISOString();

  const createResource = (name: string, category: string, designation: string, description: string): Resource => ({
    id: nanoid(),
    name,
    category: category as any,
    designation: designation as any,
    description,
    createdAt: now,
    managerResourceId: undefined,
    email: undefined,
    department: undefined,
    location: undefined,
    projectRole: undefined,
  });

  return [
    // FUNCTIONAL - SAP-specific module consultants
    createResource('SAP Solution Architect', 'functional', 'principal', 'End-to-end solution design across all SAP modules'),
    createResource('SAP FI/CO Lead', 'functional', 'senior_manager', 'Finance & Controlling workstream lead'),
    createResource('SAP MM/SD Manager', 'functional', 'manager', 'Materials Management & Sales Distribution manager'),
    createResource('SAP FI/CO Consultant', 'functional', 'senior_consultant', 'Finance & Controlling configuration and design'),
    createResource('SAP MM Consultant', 'functional', 'consultant', 'Materials Management configuration'),
    createResource('SAP SD Consultant', 'functional', 'consultant', 'Sales & Distribution configuration'),
    createResource('SAP PP/QM Consultant', 'functional', 'consultant', 'Production Planning & Quality Management'),
    createResource('SAP HCM Consultant', 'functional', 'consultant', 'Human Capital Management configuration'),
    createResource('SAP PM Consultant', 'functional', 'consultant', 'Plant Maintenance configuration'),
    createResource('SAP Business Analyst', 'functional', 'analyst', 'Requirements gathering and documentation'),
    createResource('External SAP Consultant', 'functional', 'subcontractor', 'External functional consultant support'),

    // TECHNICAL - SAP development and integration
    createResource('SAP Technical Architect', 'technical', 'principal', 'Technical architecture and integration design'),
    createResource('ABAP Development Lead', 'technical', 'senior_manager', 'ABAP development workstream lead'),
    createResource('Integration Manager', 'technical', 'manager', 'Integration and interfaces manager'),
    createResource('Senior ABAP Developer', 'technical', 'senior_consultant', 'Complex ABAP development and optimization'),
    createResource('ABAP Developer', 'technical', 'consultant', 'Custom ABAP development'),
    createResource('SAP BTP Developer', 'technical', 'consultant', 'SAP Business Technology Platform development'),
    createResource('SAP Fiori Developer', 'technical', 'consultant', 'Fiori/UI5 application development'),
    createResource('Integration Specialist', 'technical', 'consultant', 'PI/PO, CPI integration configuration'),
    createResource('Technical Analyst', 'technical', 'analyst', 'Technical specifications and documentation'),
    createResource('External ABAP Developer', 'technical', 'subcontractor', 'External development support'),

    // BASIS - SAP infrastructure and system administration
    createResource('SAP Infrastructure Architect', 'basis', 'principal', 'SAP landscape architecture and strategy'),
    createResource('SAP Basis Lead', 'basis', 'senior_manager', 'Basis and infrastructure workstream lead'),
    createResource('SAP Basis Manager', 'basis', 'manager', 'Day-to-day basis operations manager'),
    createResource('Senior SAP Basis Admin', 'basis', 'senior_consultant', 'System administration and performance tuning'),
    createResource('SAP Basis Administrator', 'basis', 'consultant', 'System installation, patching, and support'),
    createResource('SAP HANA Administrator', 'basis', 'consultant', 'HANA database administration'),
    createResource('Basis Support Analyst', 'basis', 'analyst', 'Level 1/2 basis support'),
    createResource('External Basis Consultant', 'basis', 'subcontractor', 'External basis support'),

    // SECURITY - SAP GRC and authorization
    createResource('SAP Security Architect', 'security', 'principal', 'Enterprise security architecture and GRC strategy'),
    createResource('SAP GRC Lead', 'security', 'senior_manager', 'GRC and security workstream lead'),
    createResource('SAP Security Manager', 'security', 'manager', 'Security operations and compliance manager'),
    createResource('SAP GRC Consultant', 'security', 'senior_consultant', 'Access Control, Process Control, Risk Management'),
    createResource('SAP Authorization Consultant', 'security', 'consultant', 'Role design and authorization configuration'),
    createResource('SAP Security Specialist', 'security', 'consultant', 'Security configuration and audit'),
    createResource('Security Analyst', 'security', 'analyst', 'Security monitoring and reporting'),
    createResource('External GRC Consultant', 'security', 'subcontractor', 'External GRC support'),

    // PROJECT MANAGEMENT - SAP program and project leadership
    createResource('SAP Program Director', 'pm', 'principal', 'Overall SAP transformation program leadership'),
    createResource('Senior SAP Project Manager', 'pm', 'senior_manager', 'Multi-workstream project management'),
    createResource('SAP Project Manager', 'pm', 'manager', 'Workstream or phase project management'),
    createResource('SAP Scrum Master', 'pm', 'senior_consultant', 'Agile delivery and sprint facilitation'),
    createResource('PMO Lead', 'pm', 'senior_consultant', 'PMO operations and reporting lead'),
    createResource('PMO Consultant', 'pm', 'consultant', 'Project coordination and reporting'),
    createResource('PMO Analyst', 'pm', 'analyst', 'Project administration and tracking'),
    createResource('External PM Consultant', 'pm', 'subcontractor', 'External project management support'),

    // CHANGE MANAGEMENT - Organizational change and training
    createResource('OCM Director', 'change', 'principal', 'Organizational change strategy and leadership'),
    createResource('Senior OCM Manager', 'change', 'senior_manager', 'Change management workstream lead'),
    createResource('Change Manager', 'change', 'manager', 'Change initiatives and stakeholder management'),
    createResource('Training Manager', 'change', 'senior_consultant', 'Training strategy and curriculum design'),
    createResource('OCM Consultant', 'change', 'consultant', 'Change activities and user adoption'),
    createResource('Training Specialist', 'change', 'consultant', 'End-user training delivery'),
    createResource('Communications Specialist', 'change', 'consultant', 'Change communications and messaging'),
    createResource('Change Analyst', 'change', 'analyst', 'Change impact analysis and support'),
    createResource('External OCM Consultant', 'change', 'subcontractor', 'External change management support'),

    // QUALITY ASSURANCE - Testing and quality control
    createResource('SAP QA Director', 'qa', 'principal', 'Overall quality assurance strategy and governance'),
    createResource('QA Lead', 'qa', 'senior_manager', 'Testing workstream lead and test strategy'),
    createResource('Test Manager', 'qa', 'manager', 'Test planning and execution management'),
    createResource('Senior Test Engineer', 'qa', 'senior_consultant', 'Complex test scenario design and automation'),
    createResource('Test Engineer', 'qa', 'consultant', 'Test case execution and defect management'),
    createResource('Automation Specialist', 'qa', 'consultant', 'Test automation and scripting'),
    createResource('UAT Coordinator', 'qa', 'consultant', 'User acceptance testing coordination'),
    createResource('QA Analyst', 'qa', 'analyst', 'Test data preparation and support'),
    createResource('External QA Consultant', 'qa', 'subcontractor', 'External testing support'),

    // LEADERSHIP - Executive and strategic leadership
    createResource('Chief Information Officer', 'leadership', 'principal', 'Executive IT leadership and digital strategy'),
    createResource('VP of Digital Transformation', 'leadership', 'director', 'Digital transformation vision and roadmap'),
    createResource('Chief Technology Officer', 'leadership', 'principal', 'Technology strategy and innovation leadership'),
    createResource('Head of SAP CoE', 'leadership', 'director', 'SAP Center of Excellence leadership'),
    createResource('Enterprise Architect', 'leadership', 'director', 'Enterprise architecture and technology standards'),
    createResource('SAP Practice Lead', 'leadership', 'senior_manager', 'SAP practice management and capability building'),
  ];
}
