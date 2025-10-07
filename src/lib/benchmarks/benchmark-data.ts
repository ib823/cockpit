/**
 * BENCHMARK DATA CATALOG
 *
 * Industry-standard benchmarks for SAP implementations
 * Based on historical data and industry reports
 *
 * Sources:
 * - Gartner SAP Implementation Survey 2024
 * - Panorama Consulting ERP Report 2024
 * - Internal project database (anonymized)
 */

export interface BenchmarkMetric {
  id: string;
  name: string;
  description: string;
  unit: 'days' | 'months' | 'fte' | 'ratio' | 'percentage';

  // Benchmark ranges by complexity
  simple: { min: number; max: number; median: number };
  moderate: { min: number; max: number; median: number };
  complex: { min: number; max: number; median: number };

  // Context
  category: 'duration' | 'resources' | 'cost' | 'quality';
  importance: 'high' | 'medium' | 'low';
}

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  // DURATION BENCHMARKS
  {
    id: 'total_duration',
    name: 'Total Implementation Duration',
    description: 'End-to-end project duration from kickoff to go-live',
    unit: 'months',
    simple: { min: 3, max: 6, median: 4 },
    moderate: { min: 6, max: 12, median: 9 },
    complex: { min: 12, max: 24, median: 18 },
    category: 'duration',
    importance: 'high',
  },
  {
    id: 'design_phase',
    name: 'Design Phase Duration',
    description: 'Business process design and solution blueprint',
    unit: 'days',
    simple: { min: 20, max: 40, median: 30 },
    moderate: { min: 40, max: 80, median: 60 },
    complex: { min: 80, max: 120, median: 100 },
    category: 'duration',
    importance: 'high',
  },
  {
    id: 'build_phase',
    name: 'Build Phase Duration',
    description: 'Configuration, development, and customization',
    unit: 'days',
    simple: { min: 30, max: 60, median: 45 },
    moderate: { min: 60, max: 120, median: 90 },
    complex: { min: 120, max: 200, median: 150 },
    category: 'duration',
    importance: 'high',
  },
  {
    id: 'test_phase',
    name: 'Test Phase Duration',
    description: 'Integration testing, UAT, and performance testing',
    unit: 'days',
    simple: { min: 20, max: 40, median: 30 },
    moderate: { min: 40, max: 80, median: 60 },
    complex: { min: 80, max: 120, median: 100 },
    category: 'duration',
    importance: 'high',
  },

  // RESOURCE BENCHMARKS
  {
    id: 'team_size',
    name: 'Average Team Size',
    description: 'Average number of consultants across all phases',
    unit: 'fte',
    simple: { min: 3, max: 5, median: 4 },
    moderate: { min: 5, max: 10, median: 7 },
    complex: { min: 10, max: 20, median: 15 },
    category: 'resources',
    importance: 'high',
  },
  {
    id: 'peak_team_size',
    name: 'Peak Team Size',
    description: 'Maximum team size during build/test phases',
    unit: 'fte',
    simple: { min: 4, max: 8, median: 6 },
    moderate: { min: 8, max: 15, median: 12 },
    complex: { min: 15, max: 30, median: 22 },
    category: 'resources',
    importance: 'medium',
  },
  {
    id: 'consultant_ratio',
    name: 'Consultant to Employee Ratio',
    description: 'Ratio of consultants to client employees involved',
    unit: 'ratio',
    simple: { min: 0.5, max: 1.0, median: 0.7 },
    moderate: { min: 0.3, max: 0.8, median: 0.5 },
    complex: { min: 0.2, max: 0.6, median: 0.4 },
    category: 'resources',
    importance: 'medium',
  },

  // QUALITY BENCHMARKS
  {
    id: 'ricefw_per_module',
    name: 'RICEFW Objects per Module',
    description: 'Average custom objects per SAP module',
    unit: 'ratio',
    simple: { min: 2, max: 5, median: 3 },
    moderate: { min: 5, max: 15, median: 10 },
    complex: { min: 15, max: 40, median: 25 },
    category: 'quality',
    importance: 'medium',
  },
  {
    id: 'test_coverage',
    name: 'Test Coverage',
    description: 'Percentage of requirements covered by test cases',
    unit: 'percentage',
    simple: { min: 80, max: 95, median: 90 },
    moderate: { min: 85, max: 98, median: 92 },
    complex: { min: 90, max: 100, median: 95 },
    category: 'quality',
    importance: 'low',
  },
];

/**
 * Industry-specific adjustment factors
 */
export const INDUSTRY_FACTORS: Record<string, { multiplier: number; rationale: string }> = {
  'Manufacturing': {
    multiplier: 1.0,
    rationale: 'Standard SAP fit with well-defined processes',
  },
  'Oil & Gas': {
    multiplier: 1.3,
    rationale: 'Complex regulatory requirements and asset management',
  },
  'Financial Services': {
    multiplier: 1.4,
    rationale: 'High compliance requirements and data sensitivity',
  },
  'Healthcare': {
    multiplier: 1.2,
    rationale: 'Regulatory compliance and patient data protection',
  },
  'Retail': {
    multiplier: 0.9,
    rationale: 'Standardized processes with less customization',
  },
  'Utilities': {
    multiplier: 1.1,
    rationale: 'Specialized industry processes and asset management',
  },
  'Public Sector': {
    multiplier: 1.5,
    rationale: 'Extensive compliance, procurement rules, and stakeholder management',
  },
  'Automotive': {
    multiplier: 1.1,
    rationale: 'Complex supply chain and manufacturing processes',
  },
  'Consumer Products': {
    multiplier: 0.95,
    rationale: 'Well-established SAP templates available',
  },
  'Technology': {
    multiplier: 0.85,
    rationale: 'Tech-savvy workforce with faster adoption',
  },
};

/**
 * Geographic adjustment factors
 */
export const GEOGRAPHIC_FACTORS: Record<string, { multiplier: number; rationale: string }> = {
  'Singapore': {
    multiplier: 1.0,
    rationale: 'Baseline market with high digital maturity',
  },
  'Malaysia': {
    multiplier: 0.95,
    rationale: 'Lower rates but good talent availability',
  },
  'Indonesia': {
    multiplier: 0.9,
    rationale: 'Cost-effective but may require more training',
  },
  'Thailand': {
    multiplier: 0.9,
    rationale: 'Growing SAP market with competitive rates',
  },
  'Vietnam': {
    multiplier: 0.85,
    rationale: 'Emerging market with lower costs',
  },
  'Philippines': {
    multiplier: 0.85,
    rationale: 'Strong English skills, cost-effective delivery',
  },
  'United States': {
    multiplier: 1.5,
    rationale: 'Premium market with higher rates',
  },
  'United Kingdom': {
    multiplier: 1.4,
    rationale: 'Mature market with high day rates',
  },
  'Germany': {
    multiplier: 1.3,
    rationale: 'SAP homeland with premium expertise',
  },
  'Australia': {
    multiplier: 1.3,
    rationale: 'High cost of living and premium rates',
  },
  'India': {
    multiplier: 0.7,
    rationale: 'Highly cost-effective with large talent pool',
  },
};

/**
 * Complexity determination from project characteristics
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

export interface ProjectCharacteristics {
  moduleCount: number;
  legalEntityCount: number;
  userCount: number;
  integrationCount: number;
  customizationLevel: 'low' | 'medium' | 'high';
  hasGlobalRollout: boolean;
  hasLegacyMigration: boolean;
}

export function determineComplexity(chars: ProjectCharacteristics): ComplexityLevel {
  let complexityScore = 0;

  // Module count (0-3 points)
  if (chars.moduleCount >= 8) complexityScore += 3;
  else if (chars.moduleCount >= 4) complexityScore += 2;
  else complexityScore += 1;

  // Legal entities (0-2 points)
  if (chars.legalEntityCount >= 5) complexityScore += 2;
  else if (chars.legalEntityCount >= 2) complexityScore += 1;

  // User count (0-2 points)
  if (chars.userCount >= 1000) complexityScore += 2;
  else if (chars.userCount >= 200) complexityScore += 1;

  // Integrations (0-2 points)
  if (chars.integrationCount >= 10) complexityScore += 2;
  else if (chars.integrationCount >= 5) complexityScore += 1;

  // Customization (0-2 points)
  if (chars.customizationLevel === 'high') complexityScore += 2;
  else if (chars.customizationLevel === 'medium') complexityScore += 1;

  // Additional complexity factors (0-2 points)
  if (chars.hasGlobalRollout) complexityScore += 1;
  if (chars.hasLegacyMigration) complexityScore += 1;

  // Determine final complexity level
  if (complexityScore >= 10) return 'complex';
  if (complexityScore >= 6) return 'moderate';
  return 'simple';
}
