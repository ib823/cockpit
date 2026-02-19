// app/architecture/generators/allGenerators.ts
// Architecture Diagram Generators for AS-IS/TO-BE Structure

import type { ArchitectureData } from '../types';

// Sanitize text for Mermaid diagrams - AGGRESSIVE sanitization for complex text
function sanitizeForMermaid(text: string): string {
  if (!text) return '';

  return text
    // STEP 1: First collapse all whitespace (newlines, tabs, multiple spaces)
    .replace(/[\n\r\t]+/g, ' ')         // All whitespace chars to single space
    .replace(/\s+/g, ' ')               // Collapse multiple spaces

    // STEP 2: Remove or escape problematic characters for Mermaid syntax
    .replace(/"/g, "'")                 // Double quotes → single quotes
    .replace(/\|/g, '/')                // Pipes → slashes
    .replace(/>/g, '')                  // Greater than → remove
    .replace(/</g, '')                  // Less than → remove
    .replace(/\(/g, '')                 // Open parenthesis → remove
    .replace(/\)/g, '')                 // Close parenthesis → remove
    .replace(/\[/g, '')                 // Open bracket → remove
    .replace(/\]/g, '')                 // Close bracket → remove
    .replace(/\{/g, '')                 // Open brace → remove
    .replace(/\}/g, '')                 // Close brace → remove
    .replace(/:/g, ' ')                 // Colons → space
    .replace(/;/g, ' ')                 // Semicolons → space
    .replace(/,/g, ' ')                 // Commas → space
    .replace(/\./g, ' ')                // Periods → space
    .replace(/[-–—]/g, ' ')             // All dashes → space
    .replace(/[&%$#@!]/g, '')           // Remove special symbols
    .replace(/\s+/g, ' ')               // Final whitespace collapse

    // STEP 3: Limit length
    .trim()
    .substring(0, 80);                  // Strict 80 char limit for safety
}

// Generator 1: System Context - Shows actors and external systems
export function generateSystemContextDiagram(data: Partial<ArchitectureData>): string {
  const { projectInfo, actors, externalSystems } = data;

  if (!projectInfo?.projectName || !actors?.length) return '';

  const actorsBlock = actors
    .map((actor, idx) => {
      const activities = actor.activities.slice(0, 3).join('<br/>• ');
      const actorName = sanitizeForMermaid(actor.name);
      const actorRole = sanitizeForMermaid(actor.role);
      const activitiesText = activities ? '<br/><br/>• ' + sanitizeForMermaid(activities) : '';
      return `        A${idx}[${actorName}<br/>${actorRole}${activitiesText}]`;
    })
    .join('\n');

  const projectName = sanitizeForMermaid(projectInfo.projectName);
  const projectDesc = projectInfo.description ? '<br/><br/>' + sanitizeForMermaid(projectInfo.description) : '';
  const systemBlock = `    SYS[${projectName}${projectDesc}]`;

  const externalBlock = externalSystems
    ?.map((sys, idx) => {
      const sysName = sanitizeForMermaid(sys.name);
      const sysPurpose = sanitizeForMermaid(sys.purpose);
      const shape = sys.type.toLowerCase().includes('database')
        ? `[(${sysName}<br/>${sysPurpose})]`
        : `[${sysName}<br/>${sysPurpose}]`;
      return `        EXT${idx}${shape}`;
    })
    .join('\n') || '';

  const actorConnections = actors.map((_, idx) => {
    return `    A${idx} --> SYS`;
  }).join('\n');

  const externalConnections = externalSystems
    ?.map((sys, idx) => {
      const integration = sanitizeForMermaid(sys.integration);
      const connector = integration ? `-->|${integration}|` : '-->';
      return `    SYS ${connector} EXT${idx}`;
    })
    .join('\n') || '';

  return `graph TB
    subgraph "Actors / Users"
${actorsBlock}
    end

    ${systemBlock}

    subgraph "External Systems"
${externalBlock}
    end

${actorConnections}
${externalConnections}

    style SYS fill:#4F46E5,stroke:#4338CA,stroke-width:3px,color:#fff`;
}

// Generator 2: Module Architecture - AS-IS Landscape (Current State)
export function generateModuleArchitectureDiagram(data: Partial<ArchitectureData>): string {
  const { asIs } = data;

  if (!asIs) return '';

  const { sapModules, nonSAPSystems, database, integrations } = asIs;

  // Check if we have any content to display
  if (!sapModules?.length && !nonSAPSystems?.length) return '';

  const sapBlocks = sapModules
    ?.map((area, areaIdx) => {
      const areaName = sanitizeForMermaid(area.area);
      const modules = area.modules
        .map((mod, modIdx) => {
          const id = `sap${areaIdx}${modIdx}`;
          const code = sanitizeForMermaid(mod.code);
          const name = sanitizeForMermaid(mod.name);
          const scope = mod.scope ? `<br/>${sanitizeForMermaid(mod.scope)}` : '';
          return `        ${id}[${code} - ${name}${scope}]`;
        })
        .join('\n');

      return `    subgraph sapArea${areaIdx}["SAP: ${areaName}"]
${modules}
    end`;
    })
    .join('\n\n') || '';

  const nonSAPBlocks = nonSAPSystems
    ?.map((sys, idx) => {
      const sysName = sanitizeForMermaid(sys.name);
      const sysType = sanitizeForMermaid(sys.type);
      const vendor = sys.vendor ? `<br/>${sanitizeForMermaid(sys.vendor)}` : '';
      return `        legacy${idx}[${sysName}<br/>${sysType}${vendor}]`;
    })
    .join('\n') || '';

  const legacySubgraph = nonSAPBlocks
    ? `    subgraph legacy["Legacy / Non-SAP Systems"]
${nonSAPBlocks}
    end`
    : '';

  const dbType = database?.type ? sanitizeForMermaid(database.type) : 'Database';
  const dbSize = database?.size ? '<br/>' + sanitizeForMermaid(database.size) : '';
  const dbBlock = database?.type ? `    database[(${dbType}${dbSize})]` : '';

  // Build connections
  const connections: string[] = [];

  // SAP modules connect to database
  sapModules?.forEach((area, areaIdx) => {
    area.modules.forEach((_, modIdx) => {
      if (dbBlock) {
        connections.push(`    sap${areaIdx}${modIdx} --> database`);
      }
    });
  });

  // Integration connections
  integrations?.forEach((integration, idx) => {
    const _source = sanitizeForMermaid(integration.source).replace(/\s+/g, '');
    const target = sanitizeForMermaid(integration.target).replace(/\s+/g, '');
    const method = sanitizeForMermaid(integration.method);
    connections.push(`    int${idx}{{${method}}} -.-> |${sanitizeForMermaid(integration.dataType)}| int${idx}target[${target}]`);
  });

  return `graph TB
${sapBlocks}

${legacySubgraph}

    ${dbBlock}

${connections.slice(0, 10).join('\n')}

    style database fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff`;
}

// Generator 3: Integration Architecture - TO-BE Solution
export function generateIntegrationArchitectureDiagram(data: Partial<ArchitectureData>): string {
  const { toBe, bridge } = data;

  if (!toBe) return '';

  const { sapModules, cloudSystems, integrations, integrationLayer } = toBe;

  // Check if we have content to display
  if (!sapModules?.length && !cloudSystems?.length && !integrations?.length) return '';

  // Build SAP S/4HANA modules block
  const sapBlocks = sapModules
    ?.map((area, areaIdx) => {
      const areaName = sanitizeForMermaid(area.area);
      const modules = area.modules
        .map((mod, modIdx) => {
          const id = `s4${areaIdx}${modIdx}`;
          const code = sanitizeForMermaid(mod.code);
          const name = sanitizeForMermaid(mod.name);
          return `        ${id}[${code} - ${name}]`;
        })
        .join('\n');

      return `    subgraph s4Area${areaIdx}["S/4HANA: ${areaName}"]
${modules}
    end`;
    })
    .join('\n\n') || '';

  // Build cloud systems block
  const cloudBlocks = cloudSystems
    ?.map((sys, idx) => {
      const sysName = sanitizeForMermaid(sys.name);
      const sysType = sanitizeForMermaid(sys.type);
      const purpose = sanitizeForMermaid(sys.purpose);
      return `        cloud${idx}[☁️ ${sysName}<br/>${sysType}<br/>${purpose}]`;
    })
    .join('\n') || '';

  const cloudSubgraph = cloudBlocks
    ? `    subgraph cloud["SAP Cloud Solutions"]
${cloudBlocks}
    end`
    : '';

  // Integration layer
  const intLayerBlock = integrationLayer?.middleware
    ? `    intLayer[🔄 ${sanitizeForMermaid(integrationLayer.middleware)}<br/>${sanitizeForMermaid(integrationLayer.description || '')}]`
    : '';

  // Bridge connections (AS-IS to TO-BE)
  const bridgeConnections = bridge?.connections
    ?.map((conn, idx) => {
      const source = sanitizeForMermaid(conn.asIsSource);
      const target = sanitizeForMermaid(conn.toBeTarget);
      const method = sanitizeForMermaid(conn.method);
      return `    bridge${idx}[${source}] -.->|${method}| bridgeTarget${idx}[${target}]`;
    })
    .slice(0, 5)
    .join('\n') || '';

  // Integration flows
  const integrationFlows = integrations
    ?.map((integration, idx) => {
      const source = sanitizeForMermaid(integration.source);
      const target = sanitizeForMermaid(integration.target);
      const method = sanitizeForMermaid(integration.method);
      const direction = integration.direction === 'Bidirectional' ? '<-->' : '-->';
      return `    flow${idx}[${source}] ${direction}|${method}| flowTarget${idx}[${target}]`;
    })
    .slice(0, 8)
    .join('\n') || '';

  return `graph TB
${sapBlocks}

${cloudSubgraph}

    ${intLayerBlock}

    subgraph bridgeSection["AS-IS → TO-BE Migration"]
${bridgeConnections}
    end

${integrationFlows}

    style intLayer fill:#6366F1,stroke:#4F46E5,stroke-width:2px,color:#fff`;
}

// Generator 4: Deployment Architecture
export function generateDeploymentArchitectureDiagram(data: Partial<ArchitectureData>): string {
  const { environments, infrastructure } = data;

  if (!environments?.length || !infrastructure?.deploymentModel) return '';

  const envBlocks = environments
    .map((env, idx) => {
      const envName = sanitizeForMermaid(env.name);
      const servers = env.servers
        .map((srv, srvIdx) => {
          const id = `env${idx}srv${srvIdx}`;
          const srvType = sanitizeForMermaid(srv.type);
          const srvSpecs = sanitizeForMermaid(srv.specs);
          const shape =
            srv.type.toLowerCase().includes('database') || srv.type.toLowerCase().includes('db')
              ? `[(${srvType}<br/>${srv.count}x ${srvSpecs})]`
              : `[${srvType}<br/>${srv.count}x ${srvSpecs}]`;
          return `        ${id}${shape}`;
        })
        .join('\n');

      return `    subgraph env${idx}["${envName}"]
${servers}
    end`;
    })
    .join('\n\n');

  const location = sanitizeForMermaid(infrastructure.location);
  const deploymentModel = sanitizeForMermaid(infrastructure.deploymentModel);
  const infraInfo = `    infraInfo["📍 ${location}<br/>📦 ${deploymentModel}"]`;

  return `graph TB
${envBlocks}

    ${infraInfo}

    style infraInfo fill:#FF9500,stroke:#C93400,stroke-width:2px,color:#000`;
}

// Generator 5: Security Architecture
export function generateSecurityArchitectureDiagram(data: Partial<ArchitectureData>): string {
  const { authMethods, securityControls, compliance } = data;

  if (!authMethods?.length || !securityControls?.length) return '';

  const authBlock = `    subgraph auth["Authentication"]
${authMethods.map((auth, idx) => {
      const method = sanitizeForMermaid(auth.method);
      const provider = sanitizeForMermaid(auth.provider);
      return `        auth${idx}["🔐 ${method}<br/>${provider}"]`;
    }).join('\n')}
    end`;

  const secBlocks = securityControls
    .map((ctrl, idx) => {
      const layer = sanitizeForMermaid(ctrl.layer);
      const controls = ctrl.controls
        .slice(0, 3)
        .map((c, cidx) => `        sec${idx}ctrl${cidx}["🛡️ ${sanitizeForMermaid(c)}"]`)
        .join('\n');
      return `    subgraph sec${idx}["${layer}"]
${controls}
    end`;
    })
    .join('\n\n');

  const compBlock =
    compliance?.standards.length &&
    `    compli["📋 Compliance:<br/>${compliance.standards.slice(0, 2).map(s => sanitizeForMermaid(s)).join('<br/>')}"]`;

  const firstSecCtrl = securityControls[0] ? `sec0ctrl0` : `auth0`;

  return `graph TB
    internet["🌐 Internet"]

${secBlocks}

${authBlock}

    ${compBlock || ''}

    internet --> ${firstSecCtrl}

    style compli fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff`;
}

// Generator 6: Sizing & Scalability
export function generateSizingScalabilityDiagram(data: Partial<ArchitectureData>): string {
  const { phases, scalability } = data;

  if (!phases?.length) return '';

  const phaseBlocks = phases
    .map((phase, idx) => {
      const phaseName = sanitizeForMermaid(phase.name);
      const phaseTimeline = sanitizeForMermaid(phase.timeline);
      const txSummary = phase.transactions
        .slice(0, 2)
        .map((t) => `${sanitizeForMermaid(t.type)}: ${sanitizeForMermaid(t.volume)}`)
        .join('<br/>');
      return `        P${idx}["📊 ${phaseName}<br/>👥 ${phase.users} users<br/>⏱️ ${phaseTimeline}${
        txSummary ? '<br/><br/>' + txSummary : ''
      }"]`;
    })
    .join('\n');

  const scaleBlock =
    scalability?.approach &&
    `    SCALE["📈 Scalability:<br/>${sanitizeForMermaid(scalability.approach)}<br/>Limits: ${sanitizeForMermaid(scalability.limits)}"]`;

  const connections = phases
    .map((_, idx) => (idx < phases.length - 1 ? `    P${idx} --> P${idx + 1}` : ''))
    .filter(Boolean)
    .join('\n');

  const finalConnection = scaleBlock ? `    P${phases.length - 1} --> SCALE` : '';

  return `graph LR
    subgraph "Growth Phases"
${phaseBlocks}
    end

    ${scaleBlock || ''}

${connections}
${finalConnection}

    style SCALE fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff`;
}
