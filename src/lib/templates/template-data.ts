/**
 * Template Data - Pre-built Project Templates
 *
 * Professional templates for common project types across industries
 */

import type { ProjectTemplate } from './template-types';

export const TEMPLATES: ProjectTemplate[] = [
  // ============================================================================
  // SAP CONSULTING TEMPLATES
  // ============================================================================
  {
    id: 'sap-s4hana-implementation',
    name: 'SAP S/4HANA Implementation',
    description: 'Complete S/4HANA implementation following SAP Activate methodology with all 5 phases: Prepare, Explore, Realize, Deploy, and Run.',
    category: 'consulting-sap',
    estimatedDuration: '9-12 months',
    estimatedCost: '$500k - $2M',
    complexity: 'advanced',
    tags: ['sap', 's4hana', 'erp', 'transformation', 'activate'],
    featured: true,
    phases: [
      {
        name: 'Prepare',
        description: 'Project initiation, team setup, and initial planning',
        color: '#3B82F6',
        durationDays: 30,
        sortOrder: 1,
        tasks: [
          { name: 'Kick-off Meeting', durationDays: 1, assignee: 'Project Manager', sortOrder: 1 },
          { name: 'Project Charter Creation', durationDays: 3, assignee: 'Project Manager', sortOrder: 2 },
          { name: 'Stakeholder Analysis', durationDays: 5, assignee: 'Business Analyst', sortOrder: 3 },
          { name: 'Team Onboarding', durationDays: 5, assignee: 'Project Manager', sortOrder: 4 },
          { name: 'Environment Setup', durationDays: 10, assignee: 'Technical Lead', sortOrder: 5 },
          { name: 'Project Plan Finalization', durationDays: 6, assignee: 'Project Manager', sortOrder: 6 },
        ],
      },
      {
        name: 'Explore',
        description: 'Requirements gathering, fit-gap analysis, and solution design',
        color: '#10B981',
        durationDays: 60,
        sortOrder: 2,
        tasks: [
          { name: 'Business Process Workshops', durationDays: 15, assignee: 'Business Analyst', sortOrder: 1 },
          { name: 'Fit-Gap Analysis', durationDays: 20, assignee: 'Functional Consultant', sortOrder: 2 },
          { name: 'Solution Architecture Design', durationDays: 15, assignee: 'Solution Architect', sortOrder: 3 },
          { name: 'Integration Design', durationDays: 10, assignee: 'Technical Lead', sortOrder: 4 },
        ],
      },
      {
        name: 'Realize',
        description: 'System configuration, development, and testing',
        color: '#F59E0B',
        durationDays: 90,
        sortOrder: 3,
        tasks: [
          { name: 'Base Configuration', durationDays: 20, assignee: 'Functional Consultant', sortOrder: 1 },
          { name: 'Custom Development', durationDays: 30, assignee: 'ABAP Developer', sortOrder: 2 },
          { name: 'Integration Development', durationDays: 25, assignee: 'Integration Specialist', sortOrder: 3 },
          { name: 'Unit Testing', durationDays: 15, assignee: 'QA Analyst', sortOrder: 4 },
        ],
      },
      {
        name: 'Deploy',
        description: 'User training, data migration, cutover, and go-live',
        color: '#EC4899',
        durationDays: 45,
        sortOrder: 4,
        tasks: [
          { name: 'End User Training', durationDays: 15, assignee: 'Training Specialist', sortOrder: 1 },
          { name: 'Data Migration', durationDays: 15, assignee: 'Data Migration Lead', sortOrder: 2 },
          { name: 'UAT Execution', durationDays: 10, assignee: 'QA Analyst', sortOrder: 3 },
          { name: 'Go-Live Preparation', durationDays: 3, assignee: 'Project Manager', sortOrder: 4 },
          { name: 'Go-Live', durationDays: 2, assignee: 'Project Manager', sortOrder: 5 },
        ],
      },
      {
        name: 'Run',
        description: 'Hypercare support and optimization',
        color: '#8B5CF6',
        durationDays: 30,
        sortOrder: 5,
        tasks: [
          { name: 'Hypercare Support', durationDays: 20, assignee: 'Support Team', sortOrder: 1 },
          { name: 'Issue Resolution', durationDays: 15, assignee: 'Technical Lead', sortOrder: 2 },
          { name: 'Performance Optimization', durationDays: 10, assignee: 'Basis Consultant', sortOrder: 3 },
          { name: 'Project Closure', durationDays: 5, assignee: 'Project Manager', sortOrder: 4 },
        ],
      },
    ],
    resources: [
      { name: 'Project Manager', email: 'pm@example.com', role: 'PM', category: 'pm', designation: 'manager', rate: 150, workingHours: 8, color: '#F59E0B' },
      { name: 'Solution Architect', email: 'architect@example.com', role: 'Architect', category: 'leadership', designation: 'senior_manager', rate: 200, workingHours: 8, color: '#3B82F6' },
      { name: 'Functional Consultant', email: 'functional@example.com', role: 'Consultant', category: 'functional', designation: 'senior_consultant', rate: 130, workingHours: 8, color: '#10B981' },
      { name: 'ABAP Developer', email: 'developer@example.com', role: 'Developer', category: 'technical', designation: 'consultant', rate: 120, workingHours: 8, color: '#8B5CF6' },
      { name: 'QA Analyst', email: 'qa@example.com', role: 'QA', category: 'qa', designation: 'consultant', rate: 100, workingHours: 8, color: '#EC4899' },
    ],
    milestones: [
      { name: 'Project Kickoff', dayOffset: 0, color: '#3B82F6' },
      { name: 'Design Sign-off', dayOffset: 90, color: '#10B981' },
      { name: 'UAT Complete', dayOffset: 210, color: '#F59E0B' },
      { name: 'Go-Live', dayOffset: 255, color: '#EC4899' },
      { name: 'Project Closure', dayOffset: 285, color: '#8B5CF6' },
    ],
    author: 'SAP Practice Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  // ============================================================================
  // SOFTWARE DEVELOPMENT TEMPLATES
  // ============================================================================
  {
    id: 'agile-sprint-planning',
    name: 'Agile Sprint (2 weeks)',
    description: '2-week agile sprint with planning, development, testing, and retrospective following Scrum methodology.',
    category: 'software',
    estimatedDuration: '2 weeks',
    estimatedCost: '$20k - $50k',
    complexity: 'beginner',
    tags: ['agile', 'scrum', 'sprint', 'software'],
    featured: true,
    phases: [
      {
        name: 'Sprint Planning',
        description: 'Story refinement and sprint commitment',
        color: '#3B82F6',
        durationDays: 1,
        sortOrder: 1,
        tasks: [
          { name: 'Backlog Refinement', durationDays: 0.5, assignee: 'Product Owner', sortOrder: 1 },
          { name: 'Sprint Planning Meeting', durationDays: 0.5, assignee: 'Scrum Master', sortOrder: 2 },
        ],
      },
      {
        name: 'Development',
        description: 'Feature development and daily standups',
        color: '#10B981',
        durationDays: 7,
        sortOrder: 2,
        tasks: [
          { name: 'Feature Implementation', durationDays: 6, assignee: 'Developer', sortOrder: 1 },
          { name: 'Code Review', durationDays: 2, assignee: 'Tech Lead', sortOrder: 2 },
          { name: 'Daily Standups', durationDays: 7, assignee: 'Scrum Master', sortOrder: 3 },
        ],
      },
      {
        name: 'Testing',
        description: 'QA testing and bug fixes',
        color: '#F59E0B',
        durationDays: 3,
        sortOrder: 3,
        tasks: [
          { name: 'QA Testing', durationDays: 2, assignee: 'QA Engineer', sortOrder: 1 },
          { name: 'Bug Fixes', durationDays: 2, assignee: 'Developer', sortOrder: 2 },
          { name: 'Regression Testing', durationDays: 1, assignee: 'QA Engineer', sortOrder: 3 },
        ],
      },
      {
        name: 'Review & Retro',
        description: 'Sprint review and retrospective',
        color: '#8B5CF6',
        durationDays: 1,
        sortOrder: 4,
        tasks: [
          { name: 'Sprint Review', durationDays: 0.5, assignee: 'Product Owner', sortOrder: 1 },
          { name: 'Sprint Retrospective', durationDays: 0.5, assignee: 'Scrum Master', sortOrder: 2 },
        ],
      },
    ],
    resources: [
      { name: 'Product Owner', email: 'po@example.com', role: 'PO', category: 'pm', designation: 'manager', rate: 120, workingHours: 8, color: '#3B82F6' },
      { name: 'Scrum Master', email: 'sm@example.com', role: 'SM', category: 'pm', designation: 'senior_consultant', rate: 110, workingHours: 8, color: '#10B981' },
      { name: 'Tech Lead', email: 'lead@example.com', role: 'Lead', category: 'technical', designation: 'senior_manager', rate: 150, workingHours: 8, color: '#F59E0B' },
      { name: 'Developer', email: 'dev@example.com', role: 'Dev', category: 'technical', designation: 'consultant', rate: 100, workingHours: 8, color: '#8B5CF6' },
      { name: 'QA Engineer', email: 'qa@example.com', role: 'QA', category: 'qa', designation: 'consultant', rate: 90, workingHours: 8, color: '#EC4899' },
    ],
    milestones: [
      { name: 'Sprint Start', dayOffset: 0, color: '#3B82F6' },
      { name: 'Mid-Sprint Check', dayOffset: 5, color: '#10B981' },
      { name: 'Code Freeze', dayOffset: 9, color: '#F59E0B' },
      { name: 'Sprint End', dayOffset: 12, color: '#8B5CF6' },
    ],
    author: 'Engineering Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Complete product launch from planning through post-launch optimization with marketing and engineering coordination.',
    category: 'software',
    estimatedDuration: '3 months',
    estimatedCost: '$100k - $250k',
    complexity: 'intermediate',
    tags: ['product', 'launch', 'marketing', 'release'],
    featured: false,
    phases: [
      {
        name: 'Planning',
        description: 'Product strategy and launch planning',
        color: '#3B82F6',
        durationDays: 15,
        sortOrder: 1,
        tasks: [
          { name: 'Market Research', durationDays: 5, assignee: 'Product Manager', sortOrder: 1 },
          { name: 'Competitive Analysis', durationDays: 5, assignee: 'Marketing Lead', sortOrder: 2 },
          { name: 'Launch Strategy', durationDays: 5, assignee: 'Product Manager', sortOrder: 3 },
        ],
      },
      {
        name: 'Development',
        description: 'Feature development and testing',
        color: '#10B981',
        durationDays: 40,
        sortOrder: 2,
        tasks: [
          { name: 'Core Features', durationDays: 25, assignee: 'Engineering Team', sortOrder: 1 },
          { name: 'Beta Testing', durationDays: 10, assignee: 'QA Team', sortOrder: 2 },
          { name: 'Bug Fixes', durationDays: 5, assignee: 'Engineering Team', sortOrder: 3 },
        ],
      },
      {
        name: 'Marketing Prep',
        description: 'Marketing materials and campaigns',
        color: '#F59E0B',
        durationDays: 20,
        sortOrder: 3,
        tasks: [
          { name: 'Landing Page', durationDays: 10, assignee: 'Designer', sortOrder: 1 },
          { name: 'Marketing Collateral', durationDays: 10, assignee: 'Content Writer', sortOrder: 2 },
          { name: 'Email Campaign', durationDays: 5, assignee: 'Marketing Manager', sortOrder: 3 },
        ],
      },
      {
        name: 'Launch',
        description: 'Product release and monitoring',
        color: '#EC4899',
        durationDays: 5,
        sortOrder: 4,
        tasks: [
          { name: 'Launch Event', durationDays: 1, assignee: 'Product Manager', sortOrder: 1 },
          { name: 'Press Release', durationDays: 1, assignee: 'PR Manager', sortOrder: 2 },
          { name: 'Launch Monitoring', durationDays: 3, assignee: 'Engineering Team', sortOrder: 3 },
        ],
      },
      {
        name: 'Post-Launch',
        description: 'Optimization and iteration',
        color: '#8B5CF6',
        durationDays: 20,
        sortOrder: 5,
        tasks: [
          { name: 'User Feedback Analysis', durationDays: 10, assignee: 'Product Manager', sortOrder: 1 },
          { name: 'Quick Wins', durationDays: 10, assignee: 'Engineering Team', sortOrder: 2 },
        ],
      },
    ],
    milestones: [
      { name: 'Planning Complete', dayOffset: 15, color: '#3B82F6' },
      { name: 'Beta Release', dayOffset: 55, color: '#10B981' },
      { name: 'Marketing Ready', dayOffset: 75, color: '#F59E0B' },
      { name: 'Public Launch', dayOffset: 80, color: '#EC4899' },
    ],
    author: 'Product Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  // ============================================================================
  // CONSTRUCTION TEMPLATES
  // ============================================================================
  {
    id: 'building-construction',
    name: 'Building Construction',
    description: 'Commercial building construction project from permits through completion with all major phases.',
    category: 'construction',
    estimatedDuration: '18 months',
    estimatedCost: '$2M - $10M',
    complexity: 'advanced',
    tags: ['construction', 'building', 'commercial', 'infrastructure'],
    featured: false,
    phases: [
      {
        name: 'Permits & Planning',
        description: 'Obtain permits and finalize plans',
        color: '#3B82F6',
        durationDays: 60,
        sortOrder: 1,
        tasks: [
          { name: 'Permit Applications', durationDays: 30, assignee: 'Project Manager', sortOrder: 1 },
          { name: 'Final Plans Review', durationDays: 20, assignee: 'Architect', sortOrder: 2 },
          { name: 'Contractor Selection', durationDays: 10, assignee: 'Project Manager', sortOrder: 3 },
        ],
      },
      {
        name: 'Site Preparation',
        description: 'Clear site and prepare foundation',
        color: '#10B981',
        durationDays: 45,
        sortOrder: 2,
        tasks: [
          { name: 'Site Clearing', durationDays: 15, assignee: 'Site Supervisor', sortOrder: 1 },
          { name: 'Excavation', durationDays: 20, assignee: 'Excavation Crew', sortOrder: 2 },
          { name: 'Foundation Prep', durationDays: 10, assignee: 'Concrete Team', sortOrder: 3 },
        ],
      },
      {
        name: 'Foundation',
        description: 'Pour foundation and cure',
        color: '#F59E0B',
        durationDays: 30,
        sortOrder: 3,
        tasks: [
          { name: 'Foundation Pour', durationDays: 5, assignee: 'Concrete Team', sortOrder: 1 },
          { name: 'Curing Period', durationDays: 20, assignee: 'Site Supervisor', sortOrder: 2 },
          { name: 'Foundation Inspection', durationDays: 5, assignee: 'Inspector', sortOrder: 3 },
        ],
      },
      {
        name: 'Framing & Structure',
        description: 'Build structural framework',
        color: '#EC4899',
        durationDays: 90,
        sortOrder: 4,
        tasks: [
          { name: 'Steel Framework', durationDays: 40, assignee: 'Steel Workers', sortOrder: 1 },
          { name: 'Floor Systems', durationDays: 30, assignee: 'Carpentry Team', sortOrder: 2 },
          { name: 'Roof Structure', durationDays: 20, assignee: 'Roofing Team', sortOrder: 3 },
        ],
      },
      {
        name: 'MEP Installation',
        description: 'Mechanical, Electrical, Plumbing',
        color: '#8B5CF6',
        durationDays: 75,
        sortOrder: 5,
        tasks: [
          { name: 'HVAC Installation', durationDays: 30, assignee: 'HVAC Contractor', sortOrder: 1 },
          { name: 'Electrical Wiring', durationDays: 25, assignee: 'Electricians', sortOrder: 2 },
          { name: 'Plumbing Systems', durationDays: 20, assignee: 'Plumbers', sortOrder: 3 },
        ],
      },
      {
        name: 'Finishing',
        description: 'Interior and exterior finishing',
        color: '#06B6D4',
        durationDays: 60,
        sortOrder: 6,
        tasks: [
          { name: 'Drywall & Paint', durationDays: 25, assignee: 'Finishing Crew', sortOrder: 1 },
          { name: 'Flooring', durationDays: 20, assignee: 'Flooring Team', sortOrder: 2 },
          { name: 'Fixtures & Trim', durationDays: 15, assignee: 'Carpentry Team', sortOrder: 3 },
        ],
      },
      {
        name: 'Final Inspection',
        description: 'Inspections and handover',
        color: '#84CC16',
        durationDays: 20,
        sortOrder: 7,
        tasks: [
          { name: 'Final Inspection', durationDays: 5, assignee: 'Inspector', sortOrder: 1 },
          { name: 'Punch List Items', durationDays: 10, assignee: 'General Contractor', sortOrder: 2 },
          { name: 'Handover', durationDays: 5, assignee: 'Project Manager', sortOrder: 3 },
        ],
      },
    ],
    milestones: [
      { name: 'Permits Approved', dayOffset: 60, color: '#3B82F6' },
      { name: 'Foundation Complete', dayOffset: 135, color: '#10B981' },
      { name: 'Structure Complete', dayOffset: 225, color: '#EC4899' },
      { name: 'MEP Complete', dayOffset: 300, color: '#8B5CF6' },
      { name: 'Final Inspection', dayOffset: 360, color: '#84CC16' },
    ],
    author: 'Construction Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  // ============================================================================
  // MARKETING TEMPLATES
  // ============================================================================
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign Launch',
    description: 'Complete marketing campaign from strategy through execution and analysis.',
    category: 'marketing',
    estimatedDuration: '6 weeks',
    estimatedCost: '$30k - $100k',
    complexity: 'intermediate',
    tags: ['marketing', 'campaign', 'digital', 'advertising'],
    featured: true,
    phases: [
      {
        name: 'Strategy',
        description: 'Campaign planning and strategy',
        color: '#3B82F6',
        durationDays: 7,
        sortOrder: 1,
        tasks: [
          { name: 'Target Audience Research', durationDays: 3, assignee: 'Marketing Strategist', sortOrder: 1 },
          { name: 'Campaign Goals & KPIs', durationDays: 2, assignee: 'Marketing Manager', sortOrder: 2 },
          { name: 'Budget Allocation', durationDays: 2, assignee: 'Marketing Manager', sortOrder: 3 },
        ],
      },
      {
        name: 'Content Creation',
        description: 'Create all campaign assets',
        color: '#10B981',
        durationDays: 14,
        sortOrder: 2,
        tasks: [
          { name: 'Copywriting', durationDays: 7, assignee: 'Copywriter', sortOrder: 1 },
          { name: 'Design Assets', durationDays: 7, assignee: 'Graphic Designer', sortOrder: 2 },
          { name: 'Video Production', durationDays: 10, assignee: 'Video Producer', sortOrder: 3 },
        ],
      },
      {
        name: 'Campaign Setup',
        description: 'Configure all marketing channels',
        color: '#F59E0B',
        durationDays: 5,
        sortOrder: 3,
        tasks: [
          { name: 'Email Campaign Setup', durationDays: 2, assignee: 'Email Marketer', sortOrder: 1 },
          { name: 'Social Media Scheduling', durationDays: 2, assignee: 'Social Media Manager', sortOrder: 2 },
          { name: 'Ad Platform Setup', durationDays: 3, assignee: 'PPC Specialist', sortOrder: 3 },
        ],
      },
      {
        name: 'Launch',
        description: 'Campaign goes live',
        color: '#EC4899',
        durationDays: 14,
        sortOrder: 4,
        tasks: [
          { name: 'Campaign Launch', durationDays: 1, assignee: 'Marketing Manager', sortOrder: 1 },
          { name: 'Daily Monitoring', durationDays: 14, assignee: 'Marketing Analyst', sortOrder: 2 },
          { name: 'A/B Testing', durationDays: 10, assignee: 'Growth Marketer', sortOrder: 3 },
        ],
      },
      {
        name: 'Analysis',
        description: 'Results analysis and reporting',
        color: '#8B5CF6',
        durationDays: 5,
        sortOrder: 5,
        tasks: [
          { name: 'Data Analysis', durationDays: 3, assignee: 'Marketing Analyst', sortOrder: 1 },
          { name: 'Final Report', durationDays: 2, assignee: 'Marketing Manager', sortOrder: 2 },
        ],
      },
    ],
    milestones: [
      { name: 'Strategy Approved', dayOffset: 7, color: '#3B82F6' },
      { name: 'Content Ready', dayOffset: 21, color: '#10B981' },
      { name: 'Campaign Launch', dayOffset: 26, color: '#EC4899' },
      { name: 'Final Report', dayOffset: 45, color: '#8B5CF6' },
    ],
    author: 'Marketing Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  // ============================================================================
  // GENERAL TEMPLATES
  // ============================================================================
  {
    id: 'simple-project',
    name: 'Simple Project Timeline',
    description: 'Basic 3-phase project template suitable for any small project or initiative.',
    category: 'general',
    estimatedDuration: '4-8 weeks',
    estimatedCost: '$10k - $50k',
    complexity: 'beginner',
    tags: ['simple', 'basic', 'starter', 'general'],
    featured: false,
    phases: [
      {
        name: 'Planning',
        description: 'Project planning and preparation',
        color: '#3B82F6',
        durationDays: 10,
        sortOrder: 1,
        tasks: [
          { name: 'Define Objectives', durationDays: 3, assignee: 'Project Manager', sortOrder: 1 },
          { name: 'Resource Planning', durationDays: 3, assignee: 'Project Manager', sortOrder: 2 },
          { name: 'Kickoff Meeting', durationDays: 1, assignee: 'Project Manager', sortOrder: 3 },
        ],
      },
      {
        name: 'Execution',
        description: 'Main project work',
        color: '#10B981',
        durationDays: 20,
        sortOrder: 2,
        tasks: [
          { name: 'Task 1', durationDays: 7, assignee: 'Team Member', sortOrder: 1 },
          { name: 'Task 2', durationDays: 7, assignee: 'Team Member', sortOrder: 2 },
          { name: 'Task 3', durationDays: 6, assignee: 'Team Member', sortOrder: 3 },
        ],
      },
      {
        name: 'Completion',
        description: 'Project closure and review',
        color: '#8B5CF6',
        durationDays: 5,
        sortOrder: 3,
        tasks: [
          { name: 'Final Review', durationDays: 2, assignee: 'Project Manager', sortOrder: 1 },
          { name: 'Documentation', durationDays: 2, assignee: 'Team Member', sortOrder: 2 },
          { name: 'Lessons Learned', durationDays: 1, assignee: 'Project Manager', sortOrder: 3 },
        ],
      },
    ],
    milestones: [
      { name: 'Project Start', dayOffset: 0, color: '#3B82F6' },
      { name: 'Execution Start', dayOffset: 10, color: '#10B981' },
      { name: 'Project End', dayOffset: 35, color: '#8B5CF6' },
    ],
    author: 'Keystone Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },

  // ============================================================================
  // BLANK TEMPLATE
  // ============================================================================
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with an empty project. Add your own phases, tasks, and resources.',
    category: 'blank',
    estimatedDuration: 'Custom',
    estimatedCost: 'Custom',
    complexity: 'beginner',
    tags: ['blank', 'empty', 'custom', 'scratch'],
    featured: false,
    phases: [],
    resources: [],
    milestones: [],
    author: 'Keystone Team',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    usageCount: 0,
  },
];

// Helper function to get template by ID
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}

// Helper function to get featured templates
export function getFeaturedTemplates(): ProjectTemplate[] {
  return TEMPLATES.filter(t => t.featured);
}

// Helper function to get templates by complexity
export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): ProjectTemplate[] {
  return TEMPLATES.filter(t => t.complexity === complexity);
}
