-- CreateEnum
CREATE TYPE "LicensePlan" AS ENUM ('FREE', 'PRO', 'LIFETIME');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('PHYSICAL', 'VIRTUAL', 'CONTAINER', 'CLOUD');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HTTP', 'HTTPS', 'TCP', 'PING', 'DNS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('UP', 'DOWN', 'DEGRADED', 'PAUSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SERVICE_DOWN', 'SERVICE_SLOW', 'HIGH_ERROR_RATE', 'LOG_PATTERN', 'METRIC_THRESHOLD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "dashboardLayout" JSONB,
    "defaultTimeRange" TEXT NOT NULL DEFAULT '24h',
    "notifyOnDown" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnRecover" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" TEXT,
    "notifyWebhook" TEXT,
    "notifyDiscordWebhook" TEXT,
    "notifySlackWebhook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "plan" "LicensePlan" NOT NULL DEFAULT 'FREE',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "email" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "NodeType" NOT NULL DEFAULT 'PHYSICAL',
    "hostname" TEXT,
    "ipAddress" TEXT,
    "os" TEXT,
    "cpu" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "type" "ServiceType" NOT NULL DEFAULT 'HTTP',
    "category" TEXT,
    "tags" TEXT[],
    "nodeId" TEXT,
    "port" INTEGER,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pingInterval" INTEGER NOT NULL DEFAULT 60,
    "pingTimeout" INTEGER NOT NULL DEFAULT 10,
    "expectedStatus" INTEGER NOT NULL DEFAULT 200,
    "pingMethod" TEXT NOT NULL DEFAULT 'GET',
    "pingHeaders" JSONB,
    "pingBody" TEXT,
    "currentStatus" "ServiceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheckedAt" TIMESTAMP(3),
    "lastUpAt" TIMESTAMP(3),
    "lastDownAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UptimeCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UptimeCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSeries" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricPoint" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceId" TEXT,
    "type" "AlertType" NOT NULL,
    "condition" JSONB NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldownMins" INTEGER NOT NULL DEFAULT 15,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "License_key_key" ON "License"("key");

-- CreateIndex
CREATE INDEX "License_isValid_idx" ON "License"("isValid");

-- CreateIndex
CREATE INDEX "License_plan_idx" ON "License"("plan");

-- CreateIndex
CREATE INDEX "Service_nodeId_idx" ON "Service"("nodeId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_currentStatus_idx" ON "Service"("currentStatus");

-- CreateIndex
CREATE INDEX "UptimeCheck_serviceId_checkedAt_idx" ON "UptimeCheck"("serviceId", "checkedAt");

-- CreateIndex
CREATE INDEX "UptimeCheck_checkedAt_idx" ON "UptimeCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "LogEntry_serviceId_timestamp_idx" ON "LogEntry"("serviceId", "timestamp");

-- CreateIndex
CREATE INDEX "LogEntry_timestamp_idx" ON "LogEntry"("timestamp");

-- CreateIndex
CREATE INDEX "LogEntry_level_idx" ON "LogEntry"("level");

-- CreateIndex
CREATE INDEX "MetricSeries_serviceId_idx" ON "MetricSeries"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricSeries_serviceId_name_key" ON "MetricSeries"("serviceId", "name");

-- CreateIndex
CREATE INDEX "MetricPoint_seriesId_ts_idx" ON "MetricPoint"("seriesId", "ts");

-- CreateIndex
CREATE INDEX "MetricPoint_ts_idx" ON "MetricPoint"("ts");

-- CreateIndex
CREATE INDEX "Alert_serviceId_idx" ON "Alert"("serviceId");

-- CreateIndex
CREATE INDEX "Alert_isEnabled_idx" ON "Alert"("isEnabled");

-- CreateIndex
CREATE INDEX "AlertEvent_alertId_firedAt_idx" ON "AlertEvent"("alertId", "firedAt");

-- CreateIndex
CREATE INDEX "AlertEvent_firedAt_idx" ON "AlertEvent"("firedAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UptimeCheck" ADD CONSTRAINT "UptimeCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSeries" ADD CONSTRAINT "MetricSeries_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricPoint" ADD CONSTRAINT "MetricPoint_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MetricSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

