// src/lib/estimation-constants.ts
// ALL constants from Presales Estimation Playbook §8

export const ESTIMATION_CONSTANTS = {
  // ========== §4.1 Company & Footprint ==========
  BASE_EXPLORE: 40, // PD
  BASE_REALIZE: 180, // PD
  BASE_DEPLOY: 80, // PD
  BASE_RUN: 20, // PD per month
  ENTITY_ADDER: 8, // PD per additional legal entity
  CURRENCY_ADDER: 3, // PD per additional currency
  LANGUAGE_ADDER: 5, // PD per additional language
  TIMEZONE_ADDER: 2, // PD per additional timezone
  SHARED_SERVICES_DISCOUNT: 0.85, // 15% discount
  DECISION_VELOCITY_SLOW_FACTOR: 1.15, // 15% surcharge
  BLACKOUT_ADDER_PER_WEEK: 1.5, // PD per week of blackout

  // ========== §4.2 Scope Items ==========
  SCOPE_BASE: {
    small: { e: 5, r: 20, d: 10, ru: 2 },
    medium: { e: 10, r: 40, d: 20, ru: 4 },
    large: { e: 20, r: 80, d: 40, ru: 8 },
    xlarge: { e: 40, r: 160, d: 80, ru: 16 },
  },
  VARIANT_FACTOR: 0.3, // 30% adder per variant
  CRITICALITY_FACTOR: 0.2, // 20% adder per 100% criticality
  WORKFLOW_ADDER: 3, // PD per custom workflow
  FORM_ADDER: 2, // PD per custom form
  REPORT_ADDER: 4, // PD per custom report
  LOCALIZATION_ADDER_PER_ITEM: 1.5, // PD per localized instance
  DEPENDENCY_ADDER: 1.5, // PD per dependency
  DATA_VOLUME_ADDER: 0.5, // PD per 100K records
  INTEGRATION_TOUCH_ADDER: 2, // PD per integration touchpoint

  // ========== §4.3 Users & Roles ==========
  PERSONA_BASE: 12, // PD per persona
  USER_SCALING: 0.05, // Log scale factor for users
  CONCURRENCY_ADDER: 5, // PD if >30% concurrent
  UI_LANGUAGE_ADDER: 4, // PD per additional UI language
  ACCESSIBILITY_ADDER: 8, // PD for WCAG compliance
  ROLE_ADDER: 0.5, // PD per role beyond 10
  SOD_ADDER: 1.5, // PD per SoD rule
  UAT_ADDER: 0.2, // PD per 10 UAT users
  TRAINING_COHORT_ADDER: 2, // PD per training cohort
  SUPER_USER_ADDER: 1, // PD per super user

  // ========== §4.4 Data Migration ==========
  MIGRATION_OBJECT_BASE: {
    simple: 5,
    medium: 12,
    complex: 25,
  },
  VOLUME_FACTORS: {
    under_10k: 0,
    "10k_100k": 0.2,
    "100k_1M": 0.5,
    over_1M: 1.0,
  },
  SOURCE_ADDER: 3, // PD per additional source system
  QUALITY_FACTORS: {
    high: 1.0,
    medium: 1.3,
    low: 1.8,
  },
  TRANSFORMATION_ADDER: 1, // PD per transformation rule
  CUSTOM_FIELD_ADDER: 0.5, // PD per custom field
  MOCK_RUN_ADDER: 3, // PD per mock run beyond first
  RECONCILIATION_ADDER: 5, // PD for reconciliation
  PII_ADDER: 4, // PD for PII handling
  HISTORICAL_ADDER: 2, // PD per year beyond 2 years
  TIGHT_CUTOVER_ADDER: 8, // PD if cutover < 24 hours
  MDM_DISCOUNT: 0.85, // 15% discount if MDM in place

  // ========== §4.5 Integrations ==========
  PROTOCOL_BASELINES: {
    REST: 15,
    SOAP: 18,
    OData: 12,
    "RFC/BAPI": 20,
    IDoc: 22,
    SFTP: 10,
    AS2: 25,
    Kafka: 30,
    MQ: 20,
    File: 8,
  },
  SECURITY_FACTORS: {
    basic: 1.0,
    oauth: 1.2,
    certificate: 1.3,
    advanced: 1.5,
  },
  INTEGRATION_VOLUME_ADDERS: {
    under_1k: 0,
    "1k_10k": 2,
    "10k_100k": 5,
    over_100k: 10,
  },
  INTEGRATION_TRANSFORMATION_ADDER: 2, // PD per transformation rule
  ERROR_HANDLING_ADDER: 5, // PD for advanced error handling
  MONITORING_ADDER: 3, // PD for monitoring setup
  EXTRA_ENV_ADDER: 4, // PD for additional environment
  PARTNER_FACTOR: 1.25, // 25% surcharge for partner involvement
  REUSE_DISCOUNT: 0.75, // 25% discount for pattern reuse
  INTEGRATION_NFR_ADDER: 4, // PD for NFR requirements
  COMPLIANCE_ADDER: 6, // PD for compliance requirements
  BACKFILL_ADDER: 8, // PD for backfill requirements
  RUNBOOK_ADDER: 2, // PD for runbook creation

  // ========== §4.6 Forms, Reports, Analytics ==========
  FORM_BASE: {
    simple: 2,
    medium: 4,
    complex: 8,
  },
  REPORT_BASE: {
    simple: 3,
    medium: 6,
    complex: 12,
  },
  SAC_CONNECTION_ADDER: 8, // PD for SAC connection
  SAC_PAGE_ADDER: 4, // PD per SAC page/dashboard
  SAC_WIDGET_ADDER: 1, // PD per widget
  SAC_RLS_ADDER: 3, // PD for row-level security
  SAC_REFRESH_ADDER: 2, // PD for scheduled refresh
  LANGUAGE_FORM_ADDER: 1.5, // PD per additional language for form
  BRAND_VARIANT_ADDER: 2, // PD per brand variant
  COPY_VARIANT_ADDER: 1, // PD per copy variant
  CHANNEL_ADDER: 3, // PD per additional channel

  // ========== §4.7 Localization & Compliance ==========
  COUNTRY_OVERLAY_ADDER: 12, // PD per country beyond first
  E_INVOICE_MODELS: {
    API: 20,
    Peppol: 25,
    Clearance: 30,
  },
  PLATFORM_ADDER: 5, // PD per e-invoice platform
  WHT_ADDER: 8, // PD for withholding tax
  STATUTORY_REPORT_ADDER: 6, // PD per statutory report
  BANK_FORMAT_ADDER: 4, // PD per bank format
  TAX_CODE_DENSITY_FACTOR: 0.05, // PD per 100 tax codes
  NUMBERING_SCHEME_ADDER: 3, // PD per numbering scheme
  COMPLIANCE_EVIDENCE_ADDER: 5, // PD for compliance evidence

  // ========== §4.8 Volumes ==========
  VOLUME_BANDS: {
    under_1k: 0,
    "1k_10k": 2,
    "10k_100k": 5,
    "100k_1M": 10,
    over_1M: 20,
  },
  LINES_PER_DOC_FACTOR: 0.01, // PD per 100 lines/doc
  PEAK_FACTOR: {
    month_end: 1.1,
    quarter_end: 1.2,
    year_end: 1.3,
  },
  ILM_SETUP_ADDER: 6, // PD for ILM setup
  MONITORING_VOLUME_ADDER: 3, // PD for volume monitoring

  // ========== §4.9 NFR & Security ==========
  SLA_BANDS: {
    standard: 0,
    "99.5%": 5,
    "99.9%": 10,
    "99.95%": 15,
  },
  LATENCY_TARGET_ADDER: 8, // PD for strict latency requirements
  RESIDENCY_ADDER: 6, // PD for data residency requirements
  SSO_SETUP: {
    SAML: 8,
    OAuth: 10,
    OIDC: 12,
  },
  MFA_ADDER: 4, // PD for MFA setup
  SOD_RULES_BASE: 10, // PD base for SoD setup
  LOGGING_ADDER: 5, // PD for comprehensive logging
  KMS_ADDER: 8, // PD for key management
  PEN_TEST_ADDER: 12, // PD for penetration testing
  FRAMEWORK_COMPLIANCE_ADDER: 15, // PD per compliance framework

  // ========== §4.10 Environments & Cutover ==========
  THREE_SYSTEM_ADDER: 5, // PD for 3-system landscape
  EXTRA_ENV_BASE: 4, // PD per additional environment
  REFRESH_ADDER: 2, // PD per data refresh
  DRESS_REHEARSAL_ADDER: 8, // PD per dress rehearsal
  CUTOVER_WINDOW_FACTORS: {
    weekend: 1.0,
    under_24h: 1.2,
    under_12h: 1.5,
  },
  FREEZE_PERIOD_ADDER: 3, // PD per week of freeze
  ROLLBACK_PLAN_ADDER: 6, // PD for rollback planning
  PARALLEL_SITE_ADDER: 20, // PD per parallel site
  GOVERNANCE_PACK_ADDER: 8, // PD for governance pack

  // ========== §4.11 Training & OCM ==========
  IMPACT_ASSESSMENT_BASE: 10, // PD for impact assessment
  COMMS_PLAN_BASE: 8, // PD for communications plan
  ARTIFACT_ADDER: 2, // PD per comms artifact
  ADOPTION_KPI_ADDER: 5, // PD for adoption tracking
  TTT_COHORT_ADDER: 3, // PD per train-the-trainer cohort
  FLOORWALKING_ADDER: 10, // PD for floorwalking support

  // ========== §4.12 Run Support ==========
  RUN_BASE_PER_LOB: 15, // PD per line of business
  TICKETS_PER_WEEK_ADDER: 0.5, // PD per 10 tickets/week
  TRIAGE_CADENCE_FACTOR: {
    "24x7": 1.5,
    business_hours: 1.0,
    best_effort: 0.8,
  },
  MONITORING_SETUP_ADDER: 5, // PD for monitoring setup
  COVERAGE_WINDOW_FACTORS: {
    "8x5": 1.0,
    "12x5": 1.2,
    "24x5": 1.5,
    "24x7": 2.0,
  },
  KT_SESSION_ADDER: 2, // PD per KT session
  EXIT_CRITERIA_ADDER: 4, // PD for exit criteria definition

  // ========== §4.13 Risks & Assumptions ==========
  RISK_WORKSHOP_BASE: 4, // PD for risk workshop
  REGISTER_MAINTENANCE_ADDER: 1, // PD per month for register
  ASSUMPTIONS_PACK_BASE: 3, // PD for assumptions documentation
  CONTINGENCY_LEVELS: {
    low: 1.07, // 7%
    medium: 1.1, // 10%
    high: 1.12, // 12%
  },

  // ========== §4.14 Timeline & Constraints ==========
  DEADLINE_OVERHEAD_FACTOR: 1.1, // 10% overhead for hard deadline
  BLACKOUT_WEEK_ADDER: 1.5, // PD per week of blackout
  EXTERNAL_DEPENDENCY_ADDER: 2, // PD per external dependency
  WORKING_MODEL_FACTORS: {
    onsite: 1.0,
    hybrid: 1.05,
    remote: 1.1,
  },

  // ========== §4.15 Extensions & BTP ==========
  EXTENSION_BASE: {
    key_user: 15,
    in_app: 25,
    side_by_side: 40,
  },
  WORKFLOW_STEP_ADDER: 2, // PD per workflow step
  API_ADDER: 5, // PD per custom API
  EVENT_ADDER: 3, // PD per custom event
  SECURITY_MODEL_ADDER: 8, // PD for security model
  UI_SCREEN_ADDER: 6, // PD per custom UI screen
  MULTI_TENANT_ADDER: 12, // PD for multi-tenancy
  RESIDENCY_ADDER_EXTENSION: 6, // PD for data residency in extension

  // ========== Phase Distribution (SAP Activate) ==========
  PHASE_DISTRIBUTION: {
    prepare: 0.05, // 5%
    explore: 0.2, // 20%
    realize: 0.45, // 45%
    deploy: 0.2, // 20%
    run: 0.1, // 10%
  },

  // ========== Stream Distribution ==========
  STREAM_WEIGHTS: {
    "Business Transformation & OCM": 0.15,
    "Project Management": 0.1,
    "Solution Architecture": 0.12,
    Configuration: 0.25,
    "Development & Extensions": 0.15,
    "Data Migration": 0.1,
    Integration: 0.08,
    "Testing & Quality Assurance": 0.05,
  },
};

export type EstimationConstants = typeof ESTIMATION_CONSTANTS;
