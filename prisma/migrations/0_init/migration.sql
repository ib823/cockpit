-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SHARE', 'EXPORT', 'APPROVE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ChipType" AS ENUM ('COUNTRY', 'EMPLOYEES', 'REVENUE', 'INDUSTRY', 'MODULES', 'TIMELINE', 'INTEGRATION', 'COMPLIANCE', 'LEGAL_ENTITIES', 'SSO', 'BANKING', 'EXISTING_SYSTEM', 'LOCATIONS', 'USERS', 'DATA_VOLUME', 'CURRENCIES', 'LANGUAGES');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "WeekNumberingType" AS ENUM ('PROJECT_RELATIVE', 'ISO_WEEK', 'CALENDAR_WEEK');

-- CreateEnum
CREATE TYPE "CostVisibilityLevel" AS ENUM ('PUBLIC', 'PRESALES_AND_FINANCE', 'FINANCE_ONLY');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT[],
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailApproval" (
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codeSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmailApproval_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chips" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DECIMAL(3,2) NOT NULL,
    "evidence" TEXT,
    "type" "ChipType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "chips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "languages" TEXT[],
    "complexity" TEXT NOT NULL,
    "effort" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "effort" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'otp',

    CONSTRAINT "magic_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "dependencies" TEXT,
    "effort" DECIMAL(10,2) NOT NULL,
    "startBusinessDay" INTEGER NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT,
    "complexity" TEXT,
    "duration" INTEGER,
    "employees" INTEGER,
    "endDate" TIMESTAMP(3),
    "industry" TEXT,
    "integrationPosture" TEXT,
    "legalEntities" INTEGER,
    "moduleCombo" TEXT,
    "ownerId" TEXT NOT NULL,
    "rateRegion" TEXT,
    "region" TEXT,
    "revenue" DECIMAL(15,2),
    "ssoMode" TEXT,
    "startDate" TIMESTAMP(3),
    "totalCost" DECIMAL(15,2),
    "totalEffort" DECIMAL(10,2),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscription" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "allocation" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ricefw_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "complexity" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "effortPerItem" DECIMAL(10,2) NOT NULL,
    "totalEffort" DECIMAL(10,2) NOT NULL,
    "phase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ricefw_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceFingerprint" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "label" TEXT,
    "version" INTEGER NOT NULL,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exception" BOOLEAN NOT NULL DEFAULT false,
    "firstLoginAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastTimelineAt" TIMESTAMP(3),
    "timelinesGenerated" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "passwordExpiresAt" TIMESTAMP(3),
    "passwordHistory" TEXT[],
    "totpSecret" TEXT,
    "totpEnabledAt" TIMESTAMP(3),
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 1,
    "sessionEpoch" INTEGER NOT NULL DEFAULT 0,
    "accountLockedAt" TIMESTAMP(3),
    "accountLockedReason" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailedLoginAt" TIMESTAMP(3),
    "pendingEmail" TEXT,
    "pendingEmailToken" TEXT,
    "pendingEmailExpiresAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lob" (
    "id" TEXT NOT NULL,
    "lobName" TEXT NOT NULL,
    "l3Count" INTEGER NOT NULL,
    "releaseTag" TEXT NOT NULL,
    "navigatorSectionUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L3ScopeItem" (
    "id" TEXT NOT NULL,
    "lobId" TEXT NOT NULL,
    "module" TEXT,
    "l3Code" TEXT NOT NULL,
    "l3Name" TEXT NOT NULL,
    "processNavigatorUrl" TEXT NOT NULL,
    "formerCode" TEXT,
    "releaseTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L3ScopeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplexityMetrics" (
    "id" TEXT NOT NULL,
    "l3Id" TEXT NOT NULL,
    "defaultTier" TEXT NOT NULL,
    "coefficient" DOUBLE PRECISION,
    "tierRationale" TEXT NOT NULL,
    "crossModuleTouches" TEXT,
    "localizationFlag" BOOLEAN NOT NULL DEFAULT false,
    "extensionRisk" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplexityMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationDetails" (
    "id" TEXT NOT NULL,
    "l3Id" TEXT NOT NULL,
    "integrationPackageAvailable" TEXT NOT NULL,
    "testScriptExists" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSelection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "l3ItemIds" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "totalMD" DOUBLE PRECISION NOT NULL,
    "durationMonths" DOUBLE PRECISION NOT NULL,
    "pmoMD" DOUBLE PRECISION NOT NULL,
    "phases" JSONB NOT NULL,
    "startDate" TIMESTAMP(3),
    "resources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "changes" JSONB,
    "changeReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "viewSettings" JSONB NOT NULL,
    "budget" JSONB,
    "orgChart" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentVersionId" TEXT,
    "versionReason" TEXT,
    "archivedAt" TIMESTAMP(3),
    "businessContext" JSONB,
    "currentLandscape" JSONB,
    "proposedSolution" JSONB,
    "diagramSettings" JSONB,
    "architectureVersion" TEXT,
    "lastArchitectureEdit" TIMESTAMP(3),

    CONSTRAINT "GanttProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttProjectActiveSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEditing" BOOLEAN NOT NULL DEFAULT false,
    "currentFocus" TEXT,

    CONSTRAINT "GanttProjectActiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttPhase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dependencies" TEXT[],

    CONSTRAINT "GanttPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttTask" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "assignee" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dependencies" TEXT[],
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 0,
    "parentTaskId" TEXT,

    CONSTRAINT "GanttTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "GanttMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttHoliday" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "region" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "GanttHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttResource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "managerResourceId" TEXT,
    "email" TEXT,
    "department" TEXT,
    "location" TEXT,
    "projectRole" TEXT,
    "companyName" TEXT,
    "assignmentLevel" TEXT NOT NULL DEFAULT 'both',
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "chargeRatePerHour" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'MYR',
    "utilizationTarget" INTEGER,
    "regionCode" TEXT,
    "isSubcontractor" BOOLEAN NOT NULL DEFAULT false,
    "rateType" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validationStatus" TEXT NOT NULL DEFAULT 'valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GanttResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttTaskResourceAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assignmentNotes" TEXT NOT NULL,
    "allocationPercentage" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GanttTaskResourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttPhaseResourceAssignment" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assignmentNotes" TEXT NOT NULL,
    "allocationPercentage" INTEGER NOT NULL,
    "allocationPattern" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GanttPhaseResourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttProjectShare" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "GanttProjectShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttProjectCollaborator" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),

    CONSTRAINT "GanttProjectCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttProjectInvite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,

    CONSTRAINT "GanttProjectInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "lastSeenIp" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nickname" TEXT,
    "userAgent" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "deviceId" TEXT,
    "deviceFingerprint" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "authMethod" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRecoveryRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "AccountRecoveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costBreakdown" JSONB NOT NULL,
    "margins" JSONB NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardScenario" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectData" JSONB NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "assumptions" JSONB,
    "costDelta" DECIMAL(12,2),
    "marginDelta" DECIMAL(6,3),
    "timeDelta" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DashboardScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elementId" TEXT,
    "elementType" TEXT,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'all',
    "showChartTables" BOOLEAN NOT NULL DEFAULT false,
    "autoRefresh" BOOLEAN NOT NULL DEFAULT false,
    "refreshInterval" INTEGER NOT NULL DEFAULT 300000,
    "customRateCard" JSONB,
    "notifyOnChange" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardShare" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "sharedWith" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'view',
    "expiresAt" TIMESTAMP(3),
    "password" TEXT,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardExport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "storageUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DashboardExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "businessContext" JSONB NOT NULL,
    "currentLandscape" JSONB NOT NULL,
    "proposedSolution" JSONB NOT NULL,
    "diagramSettings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEditedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ArchitectureProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureProjectVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessContext" JSONB NOT NULL,
    "currentLandscape" JSONB NOT NULL,
    "proposedSolution" JSONB NOT NULL,
    "diagramSettings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ArchitectureProjectVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureCollaborator" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,

    CONSTRAINT "ArchitectureCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceWeeklyAllocation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "weekIdentifier" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "weekNumberingType" "WeekNumberingType" NOT NULL DEFAULT 'PROJECT_RELATIVE',
    "weekNumber" INTEGER,
    "allocationPercent" SMALLINT NOT NULL,
    "workingDays" DECIMAL(5,2) NOT NULL,
    "mandays" DECIMAL(4,2),
    "sourcePhaseId" TEXT,
    "sourcePattern" TEXT,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "projectVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ResourceWeeklyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRateLookup" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "localCurrency" TEXT NOT NULL,
    "forexRate" DECIMAL(10,6) NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'MYR',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ResourceRateLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCosting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "grossServiceRevenue" DECIMAL(12,2) NOT NULL,
    "realizationRate" DECIMAL(5,4) NOT NULL,
    "commercialRate" DECIMAL(12,2) NOT NULL,
    "netServiceRevenue" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2) NOT NULL,
    "subcontractorCost" DECIMAL(12,2) NOT NULL,
    "outOfPocketExpense" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "grossMargin" DECIMAL(12,2) NOT NULL,
    "marginPercentage" DECIMAL(5,2) NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'MYR',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProjectCosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutOfPocketExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "totalMandays" DECIMAL(5,2) NOT NULL,
    "onsitePercentage" DECIMAL(5,2) NOT NULL,
    "onsiteDays" DECIMAL(5,2) NOT NULL,
    "flightCount" INTEGER NOT NULL DEFAULT 0,
    "flightRate" DECIMAL(10,2) NOT NULL,
    "totalFlightCost" DECIMAL(10,2) NOT NULL,
    "hotelRate" DECIMAL(10,2) NOT NULL,
    "totalHotelCost" DECIMAL(10,2) NOT NULL,
    "parkingTollRate" DECIMAL(10,2) NOT NULL,
    "totalParkingTollCost" DECIMAL(10,2) NOT NULL,
    "mileageRate" DECIMAL(10,2) NOT NULL,
    "mileageKm" DECIMAL(10,2) NOT NULL,
    "totalMileageCost" DECIMAL(10,2) NOT NULL,
    "totalOPECost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutOfPocketExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCostingConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "realizationRatePercent" DECIMAL(5,4) NOT NULL DEFAULT 0.4300,
    "internalCostPercent" DECIMAL(5,4) NOT NULL DEFAULT 0.3500,
    "opeAccommodationPerDay" DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    "opeMealsPerDay" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "opeTransportPerDay" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "opeTotalDefaultPerDay" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "intercompanyMarkupPercent" DECIMAL(5,4) NOT NULL DEFAULT 1.1500,
    "intercompanyHomeRegion" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'MYR',
    "costVisibilityLevel" "CostVisibilityLevel" NOT NULL DEFAULT 'FINANCE_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ProjectCostingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractorRate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "subcontractorCompany" TEXT NOT NULL,
    "dailyCommercialRate" DECIMAL(10,2) NOT NULL,
    "dailyCostRate" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "SubcontractorRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_userId_type_createdAt_idx" ON "AuditEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");

-- CreateIndex
CREATE INDEX "Authenticator_userId_idx" ON "Authenticator"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "chips_projectId_idx" ON "chips"("projectId");

-- CreateIndex
CREATE INDEX "chips_type_idx" ON "chips"("type");

-- CreateIndex
CREATE INDEX "comments_projectId_idx" ON "comments"("projectId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "form_items_projectId_idx" ON "form_items"("projectId");

-- CreateIndex
CREATE INDEX "holidays_date_idx" ON "holidays"("date");

-- CreateIndex
CREATE INDEX "holidays_region_idx" ON "holidays"("region");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_region_key" ON "holidays"("date", "region");

-- CreateIndex
CREATE INDEX "integration_items_projectId_idx" ON "integration_items"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "magic_tokens_token_key" ON "magic_tokens"("token");

-- CreateIndex
CREATE INDEX "magic_tokens_email_idx" ON "magic_tokens"("email");

-- CreateIndex
CREATE INDEX "magic_tokens_token_idx" ON "magic_tokens"("token");

-- CreateIndex
CREATE INDEX "magic_tokens_type_idx" ON "magic_tokens"("type");

-- CreateIndex
CREATE INDEX "phases_order_idx" ON "phases"("order");

-- CreateIndex
CREATE INDEX "phases_projectId_idx" ON "phases"("projectId");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_email_key" ON "push_subscriptions"("email");

-- CreateIndex
CREATE INDEX "push_subscriptions_email_idx" ON "push_subscriptions"("email");

-- CreateIndex
CREATE INDEX "resources_phaseId_idx" ON "resources"("phaseId");

-- CreateIndex
CREATE INDEX "resources_projectId_idx" ON "resources"("projectId");

-- CreateIndex
CREATE INDEX "ricefw_items_projectId_idx" ON "ricefw_items"("projectId");

-- CreateIndex
CREATE INDEX "ricefw_items_projectId_type_idx" ON "ricefw_items"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_lastActivity_idx" ON "sessions"("lastActivity");

-- CreateIndex
CREATE INDEX "sessions_deviceFingerprint_idx" ON "sessions"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "sessions_revokedAt_idx" ON "sessions"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "shares_token_key" ON "shares"("token");

-- CreateIndex
CREATE INDEX "shares_projectId_idx" ON "shares"("projectId");

-- CreateIndex
CREATE INDEX "shares_token_idx" ON "shares"("token");

-- CreateIndex
CREATE INDEX "snapshots_projectId_idx" ON "snapshots"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_projectId_version_key" ON "snapshots"("projectId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastSeenAt_idx" ON "users"("lastSeenAt");

-- CreateIndex
CREATE INDEX "users_accountLockedAt_idx" ON "users"("accountLockedAt");

-- CreateIndex
CREATE INDEX "users_passwordExpiresAt_idx" ON "users"("passwordExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "TeamMember_organizationId_idx" ON "TeamMember"("organizationId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_organizationId_key" ON "TeamMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Lob_lobName_key" ON "Lob"("lobName");

-- CreateIndex
CREATE INDEX "Lob_lobName_idx" ON "Lob"("lobName");

-- CreateIndex
CREATE UNIQUE INDEX "L3ScopeItem_l3Code_key" ON "L3ScopeItem"("l3Code");

-- CreateIndex
CREATE INDEX "L3ScopeItem_lobId_idx" ON "L3ScopeItem"("lobId");

-- CreateIndex
CREATE INDEX "L3ScopeItem_l3Code_idx" ON "L3ScopeItem"("l3Code");

-- CreateIndex
CREATE INDEX "L3ScopeItem_module_idx" ON "L3ScopeItem"("module");

-- CreateIndex
CREATE UNIQUE INDEX "ComplexityMetrics_l3Id_key" ON "ComplexityMetrics"("l3Id");

-- CreateIndex
CREATE INDEX "ComplexityMetrics_defaultTier_idx" ON "ComplexityMetrics"("defaultTier");

-- CreateIndex
CREATE INDEX "ComplexityMetrics_extensionRisk_idx" ON "ComplexityMetrics"("extensionRisk");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationDetails_l3Id_key" ON "IntegrationDetails"("l3Id");

-- CreateIndex
CREATE INDEX "SavedSelection_organizationId_idx" ON "SavedSelection"("organizationId");

-- CreateIndex
CREATE INDEX "SavedSelection_createdBy_idx" ON "SavedSelection"("createdBy");

-- CreateIndex
CREATE INDEX "SavedSelection_isPublic_idx" ON "SavedSelection"("isPublic");

-- CreateIndex
CREATE INDEX "RateCard_organizationId_isActive_idx" ON "RateCard"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "RateCard_country_idx" ON "RateCard"("country");

-- CreateIndex
CREATE INDEX "Scenario_userId_idx" ON "Scenario"("userId");

-- CreateIndex
CREATE INDEX "Scenario_organizationId_idx" ON "Scenario"("organizationId");

-- CreateIndex
CREATE INDEX "Scenario_createdAt_idx" ON "Scenario"("createdAt");

-- CreateIndex
CREATE INDEX "ScenarioVersion_scenarioId_idx" ON "ScenarioVersion"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioVersion_createdAt_idx" ON "ScenarioVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_scenarioId_versionNumber_key" ON "ScenarioVersion"("scenarioId", "versionNumber");

-- CreateIndex
CREATE INDEX "GanttProject_userId_idx" ON "GanttProject"("userId");

-- CreateIndex
CREATE INDEX "GanttProject_userId_deletedAt_updatedAt_idx" ON "GanttProject"("userId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "GanttProject_createdAt_idx" ON "GanttProject"("createdAt");

-- CreateIndex
CREATE INDEX "GanttProject_updatedAt_idx" ON "GanttProject"("updatedAt");

-- CreateIndex
CREATE INDEX "GanttProject_deletedAt_idx" ON "GanttProject"("deletedAt");

-- CreateIndex
CREATE INDEX "GanttProject_version_isLatest_idx" ON "GanttProject"("version", "isLatest");

-- CreateIndex
CREATE INDEX "GanttProject_parentVersionId_idx" ON "GanttProject"("parentVersionId");

-- CreateIndex
CREATE INDEX "GanttProject_lastModifiedBy_idx" ON "GanttProject"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "GanttProject_lastArchitectureEdit_idx" ON "GanttProject"("lastArchitectureEdit");

-- CreateIndex
CREATE INDEX "GanttProjectActiveSession_projectId_idx" ON "GanttProjectActiveSession"("projectId");

-- CreateIndex
CREATE INDEX "GanttProjectActiveSession_userId_idx" ON "GanttProjectActiveSession"("userId");

-- CreateIndex
CREATE INDEX "GanttProjectActiveSession_lastSeenAt_idx" ON "GanttProjectActiveSession"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "GanttProjectActiveSession_projectId_userId_key" ON "GanttProjectActiveSession"("projectId", "userId");

-- CreateIndex
CREATE INDEX "GanttPhase_projectId_idx" ON "GanttPhase"("projectId");

-- CreateIndex
CREATE INDEX "GanttPhase_projectId_order_idx" ON "GanttPhase"("projectId", "order");

-- CreateIndex
CREATE INDEX "GanttPhase_order_idx" ON "GanttPhase"("order");

-- CreateIndex
CREATE INDEX "GanttTask_phaseId_idx" ON "GanttTask"("phaseId");

-- CreateIndex
CREATE INDEX "GanttTask_phaseId_order_idx" ON "GanttTask"("phaseId", "order");

-- CreateIndex
CREATE INDEX "GanttTask_order_idx" ON "GanttTask"("order");

-- CreateIndex
CREATE INDEX "GanttTask_parentTaskId_idx" ON "GanttTask"("parentTaskId");

-- CreateIndex
CREATE INDEX "GanttTask_level_idx" ON "GanttTask"("level");

-- CreateIndex
CREATE INDEX "GanttMilestone_projectId_idx" ON "GanttMilestone"("projectId");

-- CreateIndex
CREATE INDEX "GanttMilestone_projectId_date_idx" ON "GanttMilestone"("projectId", "date");

-- CreateIndex
CREATE INDEX "GanttMilestone_date_idx" ON "GanttMilestone"("date");

-- CreateIndex
CREATE INDEX "GanttHoliday_projectId_idx" ON "GanttHoliday"("projectId");

-- CreateIndex
CREATE INDEX "GanttHoliday_projectId_date_idx" ON "GanttHoliday"("projectId", "date");

-- CreateIndex
CREATE INDEX "GanttHoliday_date_idx" ON "GanttHoliday"("date");

-- CreateIndex
CREATE INDEX "GanttResource_projectId_idx" ON "GanttResource"("projectId");

-- CreateIndex
CREATE INDEX "GanttResource_projectId_isActive_deletedAt_idx" ON "GanttResource"("projectId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "GanttResource_category_idx" ON "GanttResource"("category");

-- CreateIndex
CREATE INDEX "GanttResource_designation_idx" ON "GanttResource"("designation");

-- CreateIndex
CREATE INDEX "GanttResource_regionCode_idx" ON "GanttResource"("regionCode");

-- CreateIndex
CREATE INDEX "GanttResource_isSubcontractor_idx" ON "GanttResource"("isSubcontractor");

-- CreateIndex
CREATE INDEX "GanttResource_managerResourceId_idx" ON "GanttResource"("managerResourceId");

-- CreateIndex
CREATE INDEX "GanttResource_isActive_idx" ON "GanttResource"("isActive");

-- CreateIndex
CREATE INDEX "GanttResource_validationStatus_idx" ON "GanttResource"("validationStatus");

-- CreateIndex
CREATE INDEX "GanttResource_createdAt_idx" ON "GanttResource"("createdAt");

-- CreateIndex
CREATE INDEX "GanttTaskResourceAssignment_taskId_idx" ON "GanttTaskResourceAssignment"("taskId");

-- CreateIndex
CREATE INDEX "GanttTaskResourceAssignment_resourceId_idx" ON "GanttTaskResourceAssignment"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GanttTaskResourceAssignment_taskId_resourceId_key" ON "GanttTaskResourceAssignment"("taskId", "resourceId");

-- CreateIndex
CREATE INDEX "GanttPhaseResourceAssignment_phaseId_idx" ON "GanttPhaseResourceAssignment"("phaseId");

-- CreateIndex
CREATE INDEX "GanttPhaseResourceAssignment_resourceId_idx" ON "GanttPhaseResourceAssignment"("resourceId");

-- CreateIndex
CREATE INDEX "GanttPhaseResourceAssignment_assignedBy_idx" ON "GanttPhaseResourceAssignment"("assignedBy");

-- CreateIndex
CREATE INDEX "GanttPhaseResourceAssignment_allocationPattern_idx" ON "GanttPhaseResourceAssignment"("allocationPattern");

-- CreateIndex
CREATE UNIQUE INDEX "GanttPhaseResourceAssignment_phaseId_resourceId_key" ON "GanttPhaseResourceAssignment"("phaseId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GanttProjectShare_token_key" ON "GanttProjectShare"("token");

-- CreateIndex
CREATE INDEX "GanttProjectShare_projectId_idx" ON "GanttProjectShare"("projectId");

-- CreateIndex
CREATE INDEX "GanttProjectShare_token_idx" ON "GanttProjectShare"("token");

-- CreateIndex
CREATE INDEX "GanttProjectCollaborator_projectId_idx" ON "GanttProjectCollaborator"("projectId");

-- CreateIndex
CREATE INDEX "GanttProjectCollaborator_userId_idx" ON "GanttProjectCollaborator"("userId");

-- CreateIndex
CREATE INDEX "GanttProjectCollaborator_invitedBy_idx" ON "GanttProjectCollaborator"("invitedBy");

-- CreateIndex
CREATE UNIQUE INDEX "GanttProjectCollaborator_projectId_userId_key" ON "GanttProjectCollaborator"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GanttProjectInvite_token_key" ON "GanttProjectInvite"("token");

-- CreateIndex
CREATE INDEX "GanttProjectInvite_projectId_idx" ON "GanttProjectInvite"("projectId");

-- CreateIndex
CREATE INDEX "GanttProjectInvite_email_idx" ON "GanttProjectInvite"("email");

-- CreateIndex
CREATE INDEX "GanttProjectInvite_token_idx" ON "GanttProjectInvite"("token");

-- CreateIndex
CREATE INDEX "GanttProjectInvite_createdBy_idx" ON "GanttProjectInvite"("createdBy");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "TrustedDevice_fingerprint_idx" ON "TrustedDevice"("fingerprint");

-- CreateIndex
CREATE INDEX "TrustedDevice_lastSeenAt_idx" ON "TrustedDevice"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_userId_fingerprint_key" ON "TrustedDevice"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_ipAddress_idx" ON "LoginHistory"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginHistory_timestamp_idx" ON "LoginHistory"("timestamp");

-- CreateIndex
CREATE INDEX "LoginHistory_success_idx" ON "LoginHistory"("success");

-- CreateIndex
CREATE INDEX "LoginHistory_deviceFingerprint_idx" ON "LoginHistory"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_usedAt_idx" ON "RecoveryCode"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAction_token_key" ON "SecurityAction"("token");

-- CreateIndex
CREATE INDEX "SecurityAction_token_idx" ON "SecurityAction"("token");

-- CreateIndex
CREATE INDEX "SecurityAction_userId_idx" ON "SecurityAction"("userId");

-- CreateIndex
CREATE INDEX "SecurityAction_expiresAt_idx" ON "SecurityAction"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityAction_usedAt_idx" ON "SecurityAction"("usedAt");

-- CreateIndex
CREATE INDEX "AccountRecoveryRequest_userId_idx" ON "AccountRecoveryRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountRecoveryRequest_status_idx" ON "AccountRecoveryRequest"("status");

-- CreateIndex
CREATE INDEX "AccountRecoveryRequest_submittedAt_idx" ON "AccountRecoveryRequest"("submittedAt");

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_template_idx" ON "EmailLog"("template");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_projectId_userId_idx" ON "DashboardSnapshot"("projectId", "userId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_userId_createdAt_idx" ON "DashboardSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardScenario_projectId_idx" ON "DashboardScenario"("projectId");

-- CreateIndex
CREATE INDEX "DashboardScenario_userId_projectId_idx" ON "DashboardScenario"("userId", "projectId");

-- CreateIndex
CREATE INDEX "DashboardComment_projectId_elementId_idx" ON "DashboardComment"("projectId", "elementId");

-- CreateIndex
CREATE INDEX "DashboardComment_userId_projectId_idx" ON "DashboardComment"("userId", "projectId");

-- CreateIndex
CREATE INDEX "DashboardComment_parentId_idx" ON "DashboardComment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_userId_key" ON "DashboardSettings"("userId");

-- CreateIndex
CREATE INDEX "DashboardSettings_userId_idx" ON "DashboardSettings"("userId");

-- CreateIndex
CREATE INDEX "DashboardShare_snapshotId_idx" ON "DashboardShare"("snapshotId");

-- CreateIndex
CREATE INDEX "DashboardShare_sharedBy_idx" ON "DashboardShare"("sharedBy");

-- CreateIndex
CREATE INDEX "DashboardShare_sharedWith_idx" ON "DashboardShare"("sharedWith");

-- CreateIndex
CREATE INDEX "DashboardExport_projectId_idx" ON "DashboardExport"("projectId");

-- CreateIndex
CREATE INDEX "DashboardExport_userId_createdAt_idx" ON "DashboardExport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardExport_status_idx" ON "DashboardExport"("status");

-- CreateIndex
CREATE INDEX "ArchitectureProject_userId_idx" ON "ArchitectureProject"("userId");

-- CreateIndex
CREATE INDEX "ArchitectureProject_createdAt_idx" ON "ArchitectureProject"("createdAt");

-- CreateIndex
CREATE INDEX "ArchitectureProject_updatedAt_idx" ON "ArchitectureProject"("updatedAt");

-- CreateIndex
CREATE INDEX "ArchitectureProject_deletedAt_idx" ON "ArchitectureProject"("deletedAt");

-- CreateIndex
CREATE INDEX "ArchitectureProjectVersion_projectId_idx" ON "ArchitectureProjectVersion"("projectId");

-- CreateIndex
CREATE INDEX "ArchitectureProjectVersion_createdAt_idx" ON "ArchitectureProjectVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureProjectVersion_projectId_versionNumber_key" ON "ArchitectureProjectVersion"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "ArchitectureCollaborator_projectId_idx" ON "ArchitectureCollaborator"("projectId");

-- CreateIndex
CREATE INDEX "ArchitectureCollaborator_userId_idx" ON "ArchitectureCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureCollaborator_projectId_userId_key" ON "ArchitectureCollaborator"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_resourceId_weekIdentifier_idx" ON "ResourceWeeklyAllocation"("resourceId", "weekIdentifier");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_projectId_weekStartDate_idx" ON "ResourceWeeklyAllocation"("projectId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_sourcePhaseId_idx" ON "ResourceWeeklyAllocation"("sourcePhaseId");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_createdAt_idx" ON "ResourceWeeklyAllocation"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_weekNumberingType_idx" ON "ResourceWeeklyAllocation"("weekNumberingType");

-- CreateIndex
CREATE INDEX "ResourceWeeklyAllocation_projectVersionId_idx" ON "ResourceWeeklyAllocation"("projectVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceWeeklyAllocation_projectId_resourceId_weekIdentifie_key" ON "ResourceWeeklyAllocation"("projectId", "resourceId", "weekIdentifier");

-- CreateIndex
CREATE INDEX "ResourceRateLookup_regionCode_designation_idx" ON "ResourceRateLookup"("regionCode", "designation");

-- CreateIndex
CREATE INDEX "ResourceRateLookup_effectiveFrom_effectiveTo_idx" ON "ResourceRateLookup"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "ResourceRateLookup_updatedAt_idx" ON "ResourceRateLookup"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRateLookup_regionCode_designation_effectiveFrom_key" ON "ResourceRateLookup"("regionCode", "designation", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCosting_projectId_key" ON "ProjectCosting"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCosting_projectId_version_idx" ON "ProjectCosting"("projectId", "version");

-- CreateIndex
CREATE INDEX "ProjectCosting_calculatedAt_idx" ON "ProjectCosting"("calculatedAt");

-- CreateIndex
CREATE INDEX "ProjectCosting_calculatedBy_idx" ON "ProjectCosting"("calculatedBy");

-- CreateIndex
CREATE INDEX "OutOfPocketExpense_projectId_month_idx" ON "OutOfPocketExpense"("projectId", "month");

-- CreateIndex
CREATE INDEX "OutOfPocketExpense_resourceId_idx" ON "OutOfPocketExpense"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "OutOfPocketExpense_projectId_resourceId_month_key" ON "OutOfPocketExpense"("projectId", "resourceId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCostingConfig_projectId_key" ON "ProjectCostingConfig"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCostingConfig_projectId_idx" ON "ProjectCostingConfig"("projectId");

-- CreateIndex
CREATE INDEX "SubcontractorRate_projectId_idx" ON "SubcontractorRate"("projectId");

-- CreateIndex
CREATE INDEX "SubcontractorRate_resourceId_idx" ON "SubcontractorRate"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractorRate_projectId_resourceId_key" ON "SubcontractorRate"("projectId", "resourceId");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chips" ADD CONSTRAINT "chips_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_items" ADD CONSTRAINT "form_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_items" ADD CONSTRAINT "integration_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ricefw_items" ADD CONSTRAINT "ricefw_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L3ScopeItem" ADD CONSTRAINT "L3ScopeItem_lobId_fkey" FOREIGN KEY ("lobId") REFERENCES "Lob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexityMetrics" ADD CONSTRAINT "ComplexityMetrics_l3Id_fkey" FOREIGN KEY ("l3Id") REFERENCES "L3ScopeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationDetails" ADD CONSTRAINT "IntegrationDetails_l3Id_fkey" FOREIGN KEY ("l3Id") REFERENCES "L3ScopeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSelection" ADD CONSTRAINT "SavedSelection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioVersion" ADD CONSTRAINT "ScenarioVersion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProject" ADD CONSTRAINT "GanttProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProject" ADD CONSTRAINT "GanttProject_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProject" ADD CONSTRAINT "GanttProject_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "GanttProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectActiveSession" ADD CONSTRAINT "GanttProjectActiveSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectActiveSession" ADD CONSTRAINT "GanttProjectActiveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttPhase" ADD CONSTRAINT "GanttPhase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "GanttPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttMilestone" ADD CONSTRAINT "GanttMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttHoliday" ADD CONSTRAINT "GanttHoliday_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttResource" ADD CONSTRAINT "GanttResource_managerResourceId_fkey" FOREIGN KEY ("managerResourceId") REFERENCES "GanttResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttResource" ADD CONSTRAINT "GanttResource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTaskResourceAssignment" ADD CONSTRAINT "GanttTaskResourceAssignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTaskResourceAssignment" ADD CONSTRAINT "GanttTaskResourceAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttPhaseResourceAssignment" ADD CONSTRAINT "GanttPhaseResourceAssignment_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "GanttPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttPhaseResourceAssignment" ADD CONSTRAINT "GanttPhaseResourceAssignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectShare" ADD CONSTRAINT "GanttProjectShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectCollaborator" ADD CONSTRAINT "GanttProjectCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectCollaborator" ADD CONSTRAINT "GanttProjectCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectCollaborator" ADD CONSTRAINT "GanttProjectCollaborator_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectInvite" ADD CONSTRAINT "GanttProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttProjectInvite" ADD CONSTRAINT "GanttProjectInvite_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAction" ADD CONSTRAINT "SecurityAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRecoveryRequest" ADD CONSTRAINT "AccountRecoveryRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardScenario" ADD CONSTRAINT "DashboardScenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardScenario" ADD CONSTRAINT "DashboardScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardComment" ADD CONSTRAINT "DashboardComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DashboardComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardComment" ADD CONSTRAINT "DashboardComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardComment" ADD CONSTRAINT "DashboardComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSettings" ADD CONSTRAINT "DashboardSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardExport" ADD CONSTRAINT "DashboardExport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardExport" ADD CONSTRAINT "DashboardExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureProject" ADD CONSTRAINT "ArchitectureProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureProjectVersion" ADD CONSTRAINT "ArchitectureProjectVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ArchitectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureCollaborator" ADD CONSTRAINT "ArchitectureCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ArchitectureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureCollaborator" ADD CONSTRAINT "ArchitectureCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceWeeklyAllocation" ADD CONSTRAINT "ResourceWeeklyAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceWeeklyAllocation" ADD CONSTRAINT "ResourceWeeklyAllocation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceWeeklyAllocation" ADD CONSTRAINT "ResourceWeeklyAllocation_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES "GanttProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCosting" ADD CONSTRAINT "ProjectCosting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfPocketExpense" ADD CONSTRAINT "OutOfPocketExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfPocketExpense" ADD CONSTRAINT "OutOfPocketExpense_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostingConfig" ADD CONSTRAINT "ProjectCostingConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorRate" ADD CONSTRAINT "SubcontractorRate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GanttProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorRate" ADD CONSTRAINT "SubcontractorRate_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

