import { SAPModule } from '@/data/sap-modules-complete';

export const TECHNICAL_MODULES: Record<string, SAPModule> = {
  Technical_1: {
    id: 'Technical_1',
    name: 'System Landscape Setup',
    category: 'Technical',
    baseEffort: 20,
    complexity: 1.0,
    dependencies: [],
    description: 'DEV, QAS, PRD system setup, transport routes',
    criticalPath: true
  },
  Technical_2: {
    id: 'Technical_2',
    name: 'Data Migration Framework',
    category: 'Technical',
    baseEffort: 40,
    complexity: 1.2,
    dependencies: [],
    description: 'Migration cockpit, data mapping, validation, load programs',
    criticalPath: true
  },
  Technical_3: {
    id: 'Technical_3',
    name: 'Integration Platform',
    category: 'Technical',
    baseEffort: 35,
    complexity: 1.1,
    dependencies: ['Technical_1'],
    description: 'PI/PO, CPI, API management, middleware configuration',
    criticalPath: true
  },
  Technical_4: {
    id: 'Technical_4',
    name: 'User Management',
    category: 'Technical',
    baseEffort: 15,
    complexity: 0.7,
    dependencies: ['Technical_1'],
    description: 'User provisioning, role design, authorization setup',
    criticalPath: true
  },
  Technical_5: {
    id: 'Technical_5',
    name: 'Backup & Recovery',
    category: 'Technical',
    baseEffort: 12,
    complexity: 0.6,
    dependencies: ['Technical_1'],
    description: 'Backup strategies, disaster recovery, business continuity',
    criticalPath: false
  },
  Technical_6: {
    id: 'Technical_6',
    name: 'Performance Optimization',
    category: 'Technical',
    baseEffort: 18,
    complexity: 0.8,
    dependencies: ['Technical_1'],
    description: 'Database tuning, buffer optimization, archiving strategy',
    criticalPath: false
  },
  Technical_7: {
    id: 'Technical_7',
    name: 'Security Configuration',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.9,
    dependencies: ['Technical_4'],
    description: 'Security policies, encryption, audit logging, GRC setup',
    criticalPath: true
  },
  Technical_8: {
    id: 'Technical_8',
    name: 'Transport Management',
    category: 'Technical',
    baseEffort: 10,
    complexity: 0.5,
    dependencies: ['Technical_1'],
    description: 'Transport strategy, CTS+, change control processes',
    criticalPath: false
  },
  Technical_9: {
    id: 'Technical_9',
    name: 'System Monitoring',
    category: 'Technical',
    baseEffort: 14,
    complexity: 0.6,
    dependencies: ['Technical_1'],
    description: 'Solution Manager setup, alerts, health monitoring',
    criticalPath: false
  },
  Technical_10: {
    id: 'Technical_10',
    name: 'Print Management',
    category: 'Technical',
    baseEffort: 12,
    complexity: 0.6,
    dependencies: ['Technical_1'],
    description: 'Output devices, spool management, form design',
    criticalPath: false
  },
  Technical_11: {
    id: 'Technical_11',
    name: 'Workflow Configuration',
    category: 'Technical',
    baseEffort: 25,
    complexity: 0.9,
    dependencies: ['Technical_1'],
    description: 'Workflow builder, approval chains, notification setup',
    criticalPath: false
  },
  Technical_12: {
    id: 'Technical_12',
    name: 'Business Rules Framework',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_1'],
    description: 'BRF+ configuration, decision tables, rule management',
    criticalPath: false
  },
  Technical_13: {
    id: 'Technical_13',
    name: 'Master Data Governance',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.0,
    dependencies: ['Technical_2'],
    description: 'MDG setup, data quality rules, approval workflows',
    criticalPath: false
  },
  Technical_14: {
    id: 'Technical_14',
    name: 'Single Sign-On',
    category: 'Technical',
    baseEffort: 16,
    complexity: 0.7,
    dependencies: ['Technical_4', 'Technical_7'],
    description: 'SSO configuration, SAML, OAuth integration',
    criticalPath: false
  },
  Technical_15: {
    id: 'Technical_15',
    name: 'Mobile Platform',
    category: 'Technical',
    baseEffort: 28,
    complexity: 0.9,
    dependencies: ['Technical_3'],
    description: 'Mobile services, app deployment, offline capability',
    criticalPath: false
  },
  Technical_16: {
    id: 'Technical_16',
    name: 'Analytics Platform',
    category: 'Technical',
    baseEffort: 35,
    complexity: 1.0,
    dependencies: ['Technical_1'],
    description: 'BW setup, data models, extraction, reporting framework',
    criticalPath: false
  },
  Technical_17: {
    id: 'Technical_17',
    name: 'Fiori Launchpad',
    category: 'Technical',
    baseEffort: 18,
    complexity: 0.7,
    dependencies: ['Technical_1', 'Technical_14'],
    description: 'Launchpad configuration, tiles, catalogs, groups',
    criticalPath: false
  },
  Technical_18: {
    id: 'Technical_18',
    name: 'Custom Development Framework',
    category: 'Technical',
    baseEffort: 15,
    complexity: 0.7,
    dependencies: ['Technical_1'],
    description: 'Development guidelines, naming conventions, code repository',
    criticalPath: false
  },
  Technical_19: {
    id: 'Technical_19',
    name: 'EDI Configuration',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_3'],
    description: 'IDoc setup, partner profiles, message control',
    criticalPath: false
  },
  Technical_20: {
    id: 'Technical_20',
    name: 'API Management',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['Technical_3'],
    description: 'REST/OData services, API gateway, rate limiting',
    criticalPath: false
  },
  Technical_21: {
    id: 'Technical_21',
    name: 'Event Mesh',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_3'],
    description: 'Event-driven architecture, pub/sub, event routing',
    criticalPath: false
  },
  Technical_22: {
    id: 'Technical_22',
    name: 'Process Automation',
    category: 'Technical',
    baseEffort: 26,
    complexity: 0.9,
    dependencies: ['Technical_11'],
    description: 'RPA bots, process mining, automation workflows',
    criticalPath: false
  },
  Technical_23: {
    id: 'Technical_23',
    name: 'Document Management',
    category: 'Technical',
    baseEffort: 18,
    complexity: 0.7,
    dependencies: ['Technical_1'],
    description: 'DMS configuration, document types, archiving links',
    criticalPath: false
  },
  Technical_24: {
    id: 'Technical_24',
    name: 'Output Management',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_10'],
    description: 'Adobe forms, SAPscript, Smart Forms configuration',
    criticalPath: false
  },
  Technical_25: {
    id: 'Technical_25',
    name: 'Tax Engine',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.0,
    dependencies: ['Finance_12'],
    description: 'Tax engine configuration, jurisdiction setup, compliance',
    criticalPath: false
  },
  Technical_26: {
    id: 'Technical_26',
    name: 'Compliance Reporting',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_16', 'Finance_15'],
    description: 'Regulatory reporting, audit trails, compliance dashboards',
    criticalPath: false
  },
  Technical_27: {
    id: 'Technical_27',
    name: 'Cloud Connector',
    category: 'Technical',
    baseEffort: 14,
    complexity: 0.6,
    dependencies: ['Technical_1'],
    description: 'Hybrid connectivity, VPN setup, network configuration',
    criticalPath: false
  },
  Technical_28: {
    id: 'Technical_28',
    name: 'Identity Authentication',
    category: 'Technical',
    baseEffort: 16,
    complexity: 0.7,
    dependencies: ['Technical_14'],
    description: 'IAS configuration, MFA setup, password policies',
    criticalPath: false
  },
  Technical_29: {
    id: 'Technical_29',
    name: 'Certificate Management',
    category: 'Technical',
    baseEffort: 10,
    complexity: 0.5,
    dependencies: ['Technical_7'],
    description: 'SSL certificates, certificate lifecycle, trust stores',
    criticalPath: false
  },
  Technical_30: {
    id: 'Technical_30',
    name: 'Job Scheduling',
    category: 'Technical',
    baseEffort: 12,
    complexity: 0.6,
    dependencies: ['Technical_1'],
    description: 'Background jobs, job chains, scheduling calendars',
    criticalPath: false
  },
  Technical_31: {
    id: 'Technical_31',
    name: 'Alert Management',
    category: 'Technical',
    baseEffort: 10,
    complexity: 0.5,
    dependencies: ['Technical_9'],
    description: 'Alert rules, notification channels, escalation procedures',
    criticalPath: false
  },
  Technical_32: {
    id: 'Technical_32',
    name: 'Change Management',
    category: 'Technical',
    baseEffort: 14,
    complexity: 0.6,
    dependencies: ['Technical_8'],
    description: 'Change advisory board, RFC process, change calendar',
    criticalPath: false
  },
  Technical_33: {
    id: 'Technical_33',
    name: 'Test Management',
    category: 'Technical',
    baseEffort: 18,
    complexity: 0.7,
    dependencies: ['Technical_1'],
    description: 'Test plans, test automation, defect tracking',
    criticalPath: false
  },
  Technical_34: {
    id: 'Technical_34',
    name: 'Data Archiving',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_1'],
    description: 'Archiving objects, retention policies, data retrieval',
    criticalPath: false
  },
  Technical_35: {
    id: 'Technical_35',
    name: 'Information Lifecycle',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['Technical_34'],
    description: 'ILM policies, data aging, retention management',
    criticalPath: false
  },
  Technical_36: {
    id: 'Technical_36',
    name: 'Data Privacy',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_7', 'Technical_13'],
    description: 'GDPR compliance, data masking, consent management',
    criticalPath: false
  },
  Technical_37: {
    id: 'Technical_37',
    name: 'Blockchain Integration',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.1,
    dependencies: ['Technical_3'],
    description: 'Blockchain service integration, smart contracts',
    criticalPath: false
  },
  Technical_38: {
    id: 'Technical_38',
    name: 'IoT Integration',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.0,
    dependencies: ['Technical_3', 'Technical_21'],
    description: 'IoT device connectivity, edge computing, data ingestion',
    criticalPath: false
  },
  Technical_39: {
    id: 'Technical_39',
    name: 'Machine Learning Platform',
    category: 'Technical',
    baseEffort: 35,
    complexity: 1.2,
    dependencies: ['Technical_16'],
    description: 'ML model deployment, training pipelines, inference services',
    criticalPath: false
  },
  Technical_40: {
    id: 'Technical_40',
    name: 'Predictive Analytics',
    category: 'Technical',
    baseEffort: 32,
    complexity: 1.1,
    dependencies: ['Technical_39'],
    description: 'Predictive models, forecasting, anomaly detection',
    criticalPath: false
  },
  Technical_41: {
    id: 'Technical_41',
    name: 'Data Intelligence',
    category: 'Technical',
    baseEffort: 38,
    complexity: 1.2,
    dependencies: ['Technical_16', 'Technical_13'],
    description: 'Data catalog, lineage, quality monitoring',
    criticalPath: false
  },
  Technical_42: {
    id: 'Technical_42',
    name: 'Process Intelligence',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.0,
    dependencies: ['Technical_22'],
    description: 'Process mining, conformance checking, process optimization',
    criticalPath: false
  },
  Technical_43: {
    id: 'Technical_43',
    name: 'Conversational AI Platform',
    category: 'Technical',
    baseEffort: 34,
    complexity: 1.1,
    dependencies: ['Technical_39'],
    description: 'Chatbot framework, NLU services, dialog management',
    criticalPath: false
  },
  Technical_44: {
    id: 'Technical_44',
    name: 'Knowledge Graph',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.0,
    dependencies: ['Technical_41'],
    description: 'Entity relationships, semantic search, graph analytics',
    criticalPath: false
  },
  Technical_45: {
    id: 'Technical_45',
    name: 'Digital Twin',
    category: 'Technical',
    baseEffort: 36,
    complexity: 1.2,
    dependencies: ['Technical_38', 'Technical_16'],
    description: 'Virtual models, real-time simulation, predictive maintenance',
    criticalPath: false
  },
  Technical_46: {
    id: 'Technical_46',
    name: 'Edge Computing',
    category: 'Technical',
    baseEffort: 26,
    complexity: 0.9,
    dependencies: ['Technical_38'],
    description: 'Edge nodes, local processing, data aggregation',
    criticalPath: false
  },
  Technical_47: {
    id: 'Technical_47',
    name: 'Streaming Analytics',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.0,
    dependencies: ['Technical_21'],
    description: 'Real-time analytics, stream processing, CEP',
    criticalPath: false
  },
  Technical_48: {
    id: 'Technical_48',
    name: 'Data Lake',
    category: 'Technical',
    baseEffort: 32,
    complexity: 1.1,
    dependencies: ['Technical_41'],
    description: 'Raw data storage, data zones, ingestion pipelines',
    criticalPath: false
  },
  Technical_49: {
    id: 'Technical_49',
    name: 'Data Warehouse Cloud',
    category: 'Technical',
    baseEffort: 40,
    complexity: 1.2,
    dependencies: ['Technical_16', 'Technical_48'],
    description: 'Cloud DW setup, data modeling, virtual marts',
    criticalPath: false
  },
  Technical_50: {
    id: 'Technical_50',
    name: 'Business Network',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.8,
    dependencies: ['Technical_3'],
    description: 'B2B network integration, trading partners, collaboration',
    criticalPath: false
  },
  Technical_51: {
    id: 'Technical_51',
    name: 'Sustainability Management',
    category: 'Technical',
    baseEffort: 26,
    complexity: 0.9,
    dependencies: ['Technical_16'],
    description: 'Carbon footprint tracking, ESG reporting, green ledger',
    criticalPath: false
  },
  Technical_52: {
    id: 'Technical_52',
    name: 'Multi-Cloud Management',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['Technical_27'],
    description: 'Multi-cloud connectivity, workload distribution',
    criticalPath: false
  },
  Technical_53: {
    id: 'Technical_53',
    name: 'Container Platform',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_1'],
    description: 'Kubernetes setup, container orchestration, microservices',
    criticalPath: false
  },
  Technical_54: {
    id: 'Technical_54',
    name: 'DevOps Pipeline',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_18', 'Technical_33'],
    description: 'CI/CD setup, automated deployment, infrastructure as code',
    criticalPath: false
  },
  Technical_55: {
    id: 'Technical_55',
    name: 'Low-Code Platform',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.8,
    dependencies: ['Technical_18'],
    description: 'Citizen development, app templates, visual builders',
    criticalPath: false
  },
  Technical_56: {
    id: 'Technical_56',
    name: 'GraphQL Gateway',
    category: 'Technical',
    baseEffort: 18,
    complexity: 0.7,
    dependencies: ['Technical_20'],
    description: 'GraphQL schema, resolvers, federation',
    criticalPath: false
  },
  Technical_57: {
    id: 'Technical_57',
    name: 'Observability Platform',
    category: 'Technical',
    baseEffort: 20,
    complexity: 0.8,
    dependencies: ['Technical_9', 'Technical_31'],
    description: 'Distributed tracing, metrics, logs aggregation',
    criticalPath: false
  },
  Technical_58: {
    id: 'Technical_58',
    name: 'Chaos Engineering',
    category: 'Technical',
    baseEffort: 16,
    complexity: 0.7,
    dependencies: ['Technical_33', 'Technical_57'],
    description: 'Failure injection, resilience testing, game days',
    criticalPath: false
  },
  Technical_59: {
    id: 'Technical_59',
    name: 'Service Mesh',
    category: 'Technical',
    baseEffort: 22,
    complexity: 0.9,
    dependencies: ['Technical_53'],
    description: 'Service discovery, load balancing, circuit breakers',
    criticalPath: false
  },
  Technical_60: {
    id: 'Technical_60',
    name: 'Data Virtualization',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_41'],
    description: 'Virtual data layer, federated queries, caching',
    criticalPath: false
  },
  Technical_61: {
    id: 'Technical_61',
    name: 'Augmented Analytics',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.0,
    dependencies: ['Technical_40', 'Technical_43'],
    description: 'Natural language queries, auto-insights, smart discovery',
    criticalPath: false
  },
  Technical_62: {
    id: 'Technical_62',
    name: 'Computer Vision',
    category: 'Technical',
    baseEffort: 32,
    complexity: 1.1,
    dependencies: ['Technical_39'],
    description: 'Image recognition, OCR, video analytics',
    criticalPath: false
  },
  Technical_63: {
    id: 'Technical_63',
    name: 'Voice Interface',
    category: 'Technical',
    baseEffort: 26,
    complexity: 0.9,
    dependencies: ['Technical_43'],
    description: 'Voice commands, speech-to-text, voice authentication',
    criticalPath: false
  },
  Technical_64: {
    id: 'Technical_64',
    name: 'Robotic Process Control',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.0,
    dependencies: ['Technical_22', 'Technical_38'],
    description: 'Physical robot integration, control systems',
    criticalPath: false
  },
  Technical_65: {
    id: 'Technical_65',
    name: 'Digital Assistant',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_43', 'Technical_63'],
    description: 'Virtual assistant, task automation, contextual help',
    criticalPath: false
  },
  Technical_66: {
    id: 'Technical_66',
    name: 'Recommendation Engine',
    category: 'Technical',
    baseEffort: 26,
    complexity: 0.9,
    dependencies: ['Technical_39'],
    description: 'Collaborative filtering, content-based recommendations',
    criticalPath: false
  },
  Technical_67: {
    id: 'Technical_67',
    name: 'Fraud Detection',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.0,
    dependencies: ['Technical_40', 'Technical_47'],
    description: 'Anomaly detection, pattern recognition, risk scoring',
    criticalPath: false
  },
  Technical_68: {
    id: 'Technical_68',
    name: 'Quantum Computing Interface',
    category: 'Technical',
    baseEffort: 40,
    complexity: 1.5,
    dependencies: ['Technical_39'],
    description: 'Quantum algorithms, optimization problems',
    criticalPath: false
  },
  Technical_69: {
    id: 'Technical_69',
    name: 'AR/VR Platform',
    category: 'Technical',
    baseEffort: 34,
    complexity: 1.2,
    dependencies: ['Technical_15'],
    description: 'Augmented reality apps, virtual training, 3D visualization',
    criticalPath: false
  },
  Technical_70: {
    id: 'Technical_70',
    name: 'Metaverse Integration',
    category: 'Technical',
    baseEffort: 36,
    complexity: 1.3,
    dependencies: ['Technical_69', 'Technical_37'],
    description: 'Virtual spaces, avatars, digital assets',
    criticalPath: false
  },
  Technical_71: {
    id: 'Technical_71',
    name: 'Web3 Integration',
    category: 'Technical',
    baseEffort: 30,
    complexity: 1.1,
    dependencies: ['Technical_37'],
    description: 'DeFi protocols, NFTs, decentralized identity',
    criticalPath: false
  },
  Technical_72: {
    id: 'Technical_72',
    name: 'Homomorphic Encryption',
    category: 'Technical',
    baseEffort: 28,
    complexity: 1.2,
    dependencies: ['Technical_7', 'Technical_36'],
    description: 'Encrypted computation, secure multi-party computation',
    criticalPath: false
  },
  Technical_73: {
    id: 'Technical_73',
    name: 'Zero Trust Architecture',
    category: 'Technical',
    baseEffort: 32,
    complexity: 1.1,
    dependencies: ['Technical_7', 'Technical_28'],
    description: 'Micro-segmentation, continuous verification, SASE',
    criticalPath: false
  },
  Technical_74: {
    id: 'Technical_74',
    name: 'Green IT Platform',
    category: 'Technical',
    baseEffort: 24,
    complexity: 0.9,
    dependencies: ['Technical_51', 'Technical_57'],
    description: 'Energy monitoring, carbon optimization, sustainable computing',
    criticalPath: false
  }
};