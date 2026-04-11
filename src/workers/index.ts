import { createPingWorker, scheduleAllPingChecks } from "./pingWorker";
import { createAlertWorker } from "./alertWorker";
import { createCleanupWorker, scheduleCleanupJob } from "./cleanupWorker";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("Starting MangoRack workers...");

  // Create workers
  const pingWorker = createPingWorker();
  const alertWorker = createAlertWorker();
  const cleanupWorker = createCleanupWorker();

  logger.info("Workers started: Ping (concurrency: 10), Alert (concurrency: 5), Cleanup (concurrency: 1)");

  // Schedule repeatable jobs
  await scheduleCleanupJob();

  // Schedule initial ping checks for all active services
  await scheduleAllPingChecks();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down workers gracefully...`);

    await Promise.all([
      pingWorker.close(),
      alertWorker.close(),
      cleanupWorker.close(),
    ]);

    logger.info("All workers stopped.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  logger.info("MangoRack workers running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  logger.error("Failed to start workers:", err);
  process.exit(1);
});
