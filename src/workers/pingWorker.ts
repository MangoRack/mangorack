import { Worker, Queue } from "bullmq";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { checkHTTP, checkTCP, checkPing } from "@/lib/ping";
import { processServiceCheck } from "@/lib/alerts";
import { logger } from "@/lib/logger";

function extractHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const QUEUE_NAME = "ping-checks";

export const pingQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 1,
  },
});

interface PingJobData {
  serviceId: string;
  url?: string;
  method?: string;
  expectedStatus?: number;
  timeout?: number;
  headers?: Record<string, string>;
  host?: string;
  port?: number;
  type?: string;
}

export function createPingWorker() {
  const worker = new Worker<PingJobData>(
    QUEUE_NAME,
    async (job) => {
      const {
        serviceId,
        url,
        method = "GET",
        expectedStatus = 200,
        timeout = 10,
        headers,
        host,
        port,
        type,
      } = job.data;

      let result;

      try {
        switch (type) {
          case "TCP":
            if (!host || !port) {
              throw new Error("TCP check requires host and port");
            }
            result = await checkTCP(host, port, timeout);
            break;

          case "PING":
            if (!host) {
              throw new Error("PING check requires host");
            }
            result = await checkPing(host, timeout);
            break;

          case "HTTP":
          case "HTTPS":
          default:
            if (!url) {
              throw new Error("HTTP/HTTPS check requires url");
            }
            result = await checkHTTP(
              url,
              method,
              expectedStatus,
              timeout,
              headers
            );
            break;
        }
      } catch (err: unknown) {
        result = {
          status: "DOWN" as const,
          responseTime: 0,
          error: err instanceof Error ? err.message : "Check failed",
        };
      }

      // Store uptime check record
      await prisma.uptimeCheck.create({
        data: {
          serviceId,
          status: result.status,
          responseTime: result.responseTime,
          statusCode: result.statusCode ?? null,
          error: result.error ?? null,
        },
      });

      // Update service status
      const updateData: Record<string, unknown> = {
        currentStatus: result.status,
        lastCheckedAt: new Date(),
      };
      if (result.status === "UP") {
        updateData.lastUpAt = new Date();
      } else if (result.status === "DOWN") {
        updateData.lastDownAt = new Date();
      }

      await prisma.service.update({
        where: { id: serviceId },
        data: updateData,
      });

      // Process alerts
      await processServiceCheck(serviceId, result);

      // Schedule next check
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: {
          pingEnabled: true,
          pingInterval: true,
          isActive: true,
          url: true,
          type: true,
          pingMethod: true,
          expectedStatus: true,
          pingTimeout: true,
          pingHeaders: true,
          port: true,
          node: { select: { hostname: true, ipAddress: true } },
        },
      });

      if (service && service.pingEnabled && service.isActive) {
        const host = service.node?.hostname || service.node?.ipAddress || extractHost(service.url);
        await pingQueue.add(
          `ping-${serviceId}`,
          {
            serviceId,
            url: service.url ?? undefined,
            method: service.pingMethod,
            expectedStatus: service.expectedStatus,
            timeout: service.pingTimeout,
            headers: (service.pingHeaders as Record<string, string>) ?? undefined,
            host: host ?? undefined,
            port: service.port ?? undefined,
            type: service.type,
          },
          { delay: service.pingInterval * 1000 }
        );
      }

      return result;
    },
    {
      connection: redis,
      concurrency: 10,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`Ping job ${job?.id} failed:`, err.message);
  });

  worker.on("completed", (job) => {
    logger.info(`Ping job ${job.id} completed for service ${job.data.serviceId}`);
  });

  return worker;
}

// Schedule initial checks for all active services
export async function scheduleAllPingChecks() {
  const services = await prisma.service.findMany({
    where: { isActive: true, pingEnabled: true },
    select: {
      id: true,
      url: true,
      type: true,
      pingMethod: true,
      expectedStatus: true,
      pingTimeout: true,
      pingHeaders: true,
      pingInterval: true,
      port: true,
      node: { select: { hostname: true, ipAddress: true } },
    },
  });

  for (const service of services) {
    const host = service.node?.hostname || service.node?.ipAddress || extractHost(service.url);
    await pingQueue.add(
      `ping-${service.id}`,
      {
        serviceId: service.id,
        url: service.url ?? undefined,
        method: service.pingMethod,
        expectedStatus: service.expectedStatus,
        timeout: service.pingTimeout,
        headers: (service.pingHeaders as Record<string, string>) ?? undefined,
        host: host ?? undefined,
        port: service.port ?? undefined,
        type: service.type,
      },
      {
        delay: (services.indexOf(service) * 1000) % 10000, // Stagger initial checks deterministically
      }
    );
  }

  logger.info(`Scheduled ping checks for ${services.length} services`);
}
