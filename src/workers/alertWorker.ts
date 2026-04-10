import { Worker, Queue } from "bullmq";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { evaluateAlert, sendNotification } from "@/lib/alerts";

const QUEUE_NAME = "alert-evaluation";

export const alertQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  },
});

interface AlertJobData {
  type: "service_check" | "log_ingestion" | "metric_ingestion";
  serviceId?: string;
  checkResult?: {
    status: string;
    responseTime?: number;
    statusCode?: number;
    error?: string;
  };
  logMessage?: string;
  logLevel?: string;
  metricName?: string;
  metricValue?: number;
}

export function createAlertWorker() {
  const worker = new Worker<AlertJobData>(
    QUEUE_NAME,
    async (job) => {
      const { type, serviceId, checkResult, logMessage, metricName, metricValue } =
        job.data;

      // Find applicable alerts
      const alertWhere: Record<string, unknown> = { isEnabled: true };
      if (serviceId) {
        alertWhere.OR = [
          { serviceId },
          { serviceId: null }, // Global alerts
        ];
      }

      const alerts = await prisma.alert.findMany({ where: alertWhere });

      // Get user settings for notifications
      const userWithSettings = await prisma.user.findFirst({
        include: { settings: true },
      });
      const settings = userWithSettings?.settings ?? null;

      for (const alert of alerts) {
        // Check cooldown
        if (alert.lastFiredAt) {
          const cooldownMs = alert.cooldownMins * 60 * 1000;
          if (Date.now() - alert.lastFiredAt.getTime() < cooldownMs) {
            continue;
          }
        }

        // Build context
        let recentChecks: Array<{ status: string }> = [];
        if (serviceId) {
          const checks = await prisma.uptimeCheck.findMany({
            where: { serviceId },
            orderBy: { checkedAt: "desc" },
            take: 10,
            select: { status: true },
          });
          recentChecks = checks.map((c) => ({ status: c.status }));
        }

        const context = {
          status: checkResult?.status || "UNKNOWN",
          responseTime: checkResult?.responseTime,
          statusCode: checkResult?.statusCode,
          error: checkResult?.error,
          recentChecks,
          logMessage,
          metricValue,
        };

        // Filter by alert type and job type
        let applicable = false;
        switch (type) {
          case "service_check":
            applicable = ["SERVICE_DOWN", "SERVICE_SLOW", "HIGH_ERROR_RATE", "CUSTOM"].includes(
              alert.type
            );
            break;
          case "log_ingestion":
            applicable = alert.type === "LOG_PATTERN";
            break;
          case "metric_ingestion":
            applicable = alert.type === "METRIC_THRESHOLD";
            break;
        }

        if (!applicable) continue;

        const shouldFire = await evaluateAlert(alert, context);
        if (!shouldFire) continue;

        // Create alert event
        const event = await prisma.alertEvent.create({
          data: {
            alertId: alert.id,
            message: buildAlertMessage(alert, type, job.data),
            metadata: {
              type,
              serviceId,
              ...checkResult,
              logMessage,
              metricName,
              metricValue,
            },
          },
        });

        // Update lastFiredAt
        await prisma.alert.update({
          where: { id: alert.id },
          data: { lastFiredAt: new Date() },
        });

        // Send notifications
        await sendNotification(alert, event, settings);
      }
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`Alert job ${job?.id} failed:`, err.message);
  });

  return worker;
}

function buildAlertMessage(
  alert: { name: string; type: string },
  type: string,
  data: AlertJobData
): string {
  switch (type) {
    case "service_check":
      return `Alert "${alert.name}" fired: Service status is ${data.checkResult?.status || "unknown"}. ${data.checkResult?.error || ""}`.trim();
    case "log_ingestion":
      return `Alert "${alert.name}" fired: Log pattern matched in message: "${data.logMessage?.substring(0, 200) || ""}"`;
    case "metric_ingestion":
      return `Alert "${alert.name}" fired: Metric "${data.metricName}" value is ${data.metricValue}`;
    default:
      return `Alert "${alert.name}" fired`;
  }
}
