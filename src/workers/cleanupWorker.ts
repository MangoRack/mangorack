import { Worker, Queue } from "bullmq";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { getLicensePlan, getRetentionDays } from "@/lib/limits";
import { logger } from "@/lib/logger";

const QUEUE_NAME = "cleanup";

export const cleanupQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

export function createCleanupWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      logger.info(`Running cleanup job: ${job.name}`);

      const plan = await getLicensePlan();
      const retentionDays = getRetentionDays(plan);
      const retentionDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      // Delete old uptime checks
      const deletedChecks = await prisma.uptimeCheck.deleteMany({
        where: { checkedAt: { lt: retentionDate } },
      });
      logger.info(`Deleted ${deletedChecks.count} old uptime checks`);

      // Delete old log entries
      const deletedLogs = await prisma.logEntry.deleteMany({
        where: { timestamp: { lt: retentionDate } },
      });
      logger.info(`Deleted ${deletedLogs.count} old log entries`);

      // Compact metric points older than 7 days to hourly averages
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );

      await compactMetrics(sevenDaysAgo, thirtyDaysAgo, "hourly");
      await compactMetrics(thirtyDaysAgo, retentionDate, "daily");

      // Delete metric points older than retention
      const deletedPoints = await prisma.metricPoint.deleteMany({
        where: { ts: { lt: retentionDate } },
      });
      logger.info(`Deleted ${deletedPoints.count} old metric points`);

      return {
        deletedChecks: deletedChecks.count,
        deletedLogs: deletedLogs.count,
        deletedPoints: deletedPoints.count,
      };
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`Cleanup job ${job?.id} failed:`, err.message);
  });

  worker.on("completed", (job, result) => {
    logger.info(`Cleanup job ${job.id} completed:`, result);
  });

  return worker;
}

async function compactMetrics(
  olderThan: Date,
  newerThan: Date,
  resolution: "hourly" | "daily"
): Promise<void> {
  const series = await prisma.metricSeries.findMany({
    select: { id: true },
  });

  const bucketMs =
    resolution === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  for (const s of series) {
    const points = await prisma.metricPoint.findMany({
      where: {
        seriesId: s.id,
        ts: { gte: newerThan, lt: olderThan },
      },
      orderBy: { ts: "asc" },
    });

    if (points.length <= 1) continue;

    // Group by time bucket
    const buckets = new Map<number, { values: number[]; ids: string[] }>();
    for (const point of points) {
      const bucket =
        Math.floor(point.ts.getTime() / bucketMs) * bucketMs;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { values: [], ids: [] });
      }
      const b = buckets.get(bucket)!;
      b.values.push(point.value);
      b.ids.push(point.id);
    }

    for (const [ts, bucket] of buckets) {
      if (bucket.ids.length <= 1) continue;

      // Calculate average
      const avg =
        bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;

      // Delete all points in bucket except first, then update first with average
      const [keepId, ...deleteIds] = bucket.ids;

      if (deleteIds.length > 0) {
        await prisma.metricPoint.deleteMany({
          where: { id: { in: deleteIds } },
        });
      }

      await prisma.metricPoint.update({
        where: { id: keepId },
        data: { value: avg, ts: new Date(ts) },
      });
    }
  }

  logger.info(`Compacted metrics to ${resolution} resolution`);
}

export async function scheduleCleanupJob() {
  // Remove existing repeatable jobs with same key
  const existingJobs = await cleanupQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    if (job.name === "daily-cleanup") {
      await cleanupQueue.removeRepeatableByKey(job.key);
    }
  }

  // Schedule daily cleanup at 3 AM
  await cleanupQueue.add(
    "daily-cleanup",
    {},
    {
      repeat: {
        pattern: "0 3 * * *", // 3 AM every day
      },
    }
  );

  logger.info("Scheduled daily cleanup job");
}
