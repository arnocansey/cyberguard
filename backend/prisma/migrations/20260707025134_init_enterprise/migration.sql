-- CreateTable
CREATE TABLE "SoarExecution" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "alertId" TEXT,
    "tenantId" TEXT,
    "targetIp" TEXT,
    "stepsExecuted" TEXT[],
    "status" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoarExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ioc" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ioc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hostname" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "recipients" TEXT[],
    "query" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MlFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,
    "expectedLabel" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MlFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionRuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "notes" TEXT,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectionRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoarExecution_tenantId_idx" ON "SoarExecution"("tenantId");

-- CreateIndex
CREATE INDEX "Ioc_tenantId_idx" ON "Ioc"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "ReportSchedule_tenantId_idx" ON "ReportSchedule"("tenantId");

-- CreateIndex
CREATE INDEX "MlFeedback_tenantId_idx" ON "MlFeedback"("tenantId");

-- CreateIndex
CREATE INDEX "DetectionRuleVersion_ruleId_idx" ON "DetectionRuleVersion"("ruleId");
