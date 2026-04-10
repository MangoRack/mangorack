import { createPingWorker, scheduleAllPingChecks } from "./pingWorker";
import { createAlertWorker } from "./alertWorker";
import { createCleanupWorker, scheduleCleanupJob } from "./cleanupWorker";

async function main() {
  console.log("Starting MangoLab workers...");

  // Create workers
  const pingWorker = createPingWorker();
  const alertWorker = createAlertWorker();
  const cleanupWorker = createCleanupWorker();

  console.log("Workers started:");
  console.log("  - Ping worker (concurrency: 10)");
  console.log("  - Alert worker (concurrency: 5)");
  console.log("  - Cleanup worker (concurrency: 1)");

  // Schedule repeatable jobs
  await scheduleCleanupJob();

  // Schedule initial ping checks for all active services
  await scheduleAllPingChecks();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down workers gracefully...`);

    await Promise.all([
      pingWorker.close(),
      alertWorker.close(),
      cleanupWorker.close(),
    ]);

    console.log("All workers stopped.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  console.log("MangoLab workers running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Failed to start workers:", err);
  process.exit(1);
});
