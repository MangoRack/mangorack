import prisma from "@/lib/prisma";
import type { Alert, AlertEvent, UserSettings } from "@prisma/client";

interface AlertCondition {
  operator?: "gt" | "lt" | "eq" | "gte" | "lte" | "contains" | "matches";
  value?: number | string;
  threshold?: number;
  responseTimeMs?: number;
  errorRate?: number;
  pattern?: string;
  metric?: string;
  consecutiveFailures?: number;
}

interface CheckContext {
  status: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  recentChecks?: Array<{ status: string }>;
  logMessage?: string;
  metricValue?: number;
}

export async function evaluateAlert(
  alert: Alert,
  context: CheckContext
): Promise<boolean> {
  const condition = alert.condition as AlertCondition;

  switch (alert.type) {
    case "SERVICE_DOWN": {
      const consecutiveRequired = condition.consecutiveFailures || 1;
      if (consecutiveRequired <= 1) {
        return context.status === "DOWN";
      }
      const recentChecks = context.recentChecks || [];
      const downCount = recentChecks
        .slice(0, consecutiveRequired)
        .filter((c) => c.status === "DOWN").length;
      return downCount >= consecutiveRequired;
    }

    case "SERVICE_SLOW": {
      const threshold = condition.responseTimeMs || condition.threshold || 5000;
      return (
        context.status !== "DOWN" &&
        (context.responseTime ?? 0) > threshold
      );
    }

    case "HIGH_ERROR_RATE": {
      const rateThreshold = condition.errorRate || 0.5;
      const recentChecks = context.recentChecks || [];
      if (recentChecks.length === 0) return false;
      const errorCount = recentChecks.filter(
        (c) => c.status === "DOWN"
      ).length;
      const errorRate = errorCount / recentChecks.length;
      return errorRate >= rateThreshold;
    }

    case "LOG_PATTERN": {
      const pattern = condition.pattern;
      if (!pattern || !context.logMessage) return false;
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(context.logMessage);
      } catch {
        return context.logMessage.includes(pattern);
      }
    }

    case "METRIC_THRESHOLD": {
      const op = condition.operator || "gt";
      const val = condition.value;
      const metricVal = context.metricValue;
      if (metricVal === undefined || val === undefined) return false;
      const numVal = Number(val);
      switch (op) {
        case "gt":
          return metricVal > numVal;
        case "lt":
          return metricVal < numVal;
        case "eq":
          return metricVal === numVal;
        case "gte":
          return metricVal >= numVal;
        case "lte":
          return metricVal <= numVal;
        default:
          return false;
      }
    }

    case "CUSTOM": {
      // Custom alerts simply check if status matches condition value
      if (condition.value && typeof condition.value === "string") {
        return context.status === condition.value;
      }
      return false;
    }

    default:
      return false;
  }
}

export async function sendNotification(
  alert: Alert,
  event: AlertEvent,
  settings: UserSettings | null
): Promise<void> {
  const payload = {
    alert: { id: alert.id, name: alert.name, type: alert.type, severity: alert.severity },
    event: { id: event.id, message: event.message, firedAt: event.firedAt },
  };

  const promises: Promise<void>[] = [];

  // Webhook notification
  if (settings?.notifyWebhook) {
    promises.push(
      sendWebhook(settings.notifyWebhook, payload).catch((err) =>
        console.error("Webhook notification failed:", err)
      )
    );
  }

  // Discord webhook
  if (settings?.notifyDiscordWebhook) {
    promises.push(
      sendDiscord(settings.notifyDiscordWebhook, alert, event).catch((err) =>
        console.error("Discord notification failed:", err)
      )
    );
  }

  // Slack webhook
  if (settings?.notifySlackWebhook) {
    promises.push(
      sendSlack(settings.notifySlackWebhook, alert, event).catch((err) =>
        console.error("Slack notification failed:", err)
      )
    );
  }

  await Promise.allSettled(promises);
}

async function sendWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendDiscord(
  webhookUrl: string,
  alert: Alert,
  event: AlertEvent
): Promise<void> {
  const severityColors: Record<string, number> = {
    INFO: 0x3498db,
    WARNING: 0xf39c12,
    CRITICAL: 0xe74c3c,
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: `Alert: ${alert.name}`,
          description: event.message,
          color: severityColors[alert.severity] || 0x95a5a6,
          fields: [
            { name: "Type", value: alert.type, inline: true },
            { name: "Severity", value: alert.severity, inline: true },
          ],
          timestamp: event.firedAt,
          footer: { text: "MangoLab Alert System" },
        },
      ],
    }),
  });
}

async function sendSlack(
  webhookUrl: string,
  alert: Alert,
  event: AlertEvent
): Promise<void> {
  const severityEmoji: Record<string, string> = {
    INFO: ":information_source:",
    WARNING: ":warning:",
    CRITICAL: ":rotating_light:",
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${severityEmoji[alert.severity] || ""} Alert: ${alert.name}`,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: event.message },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Type:* ${alert.type} | *Severity:* ${alert.severity} | *Fired:* ${event.firedAt}`,
            },
          ],
        },
      ],
    }),
  });
}

export async function processServiceCheck(
  serviceId: string,
  checkResult: { status: string; responseTime?: number; statusCode?: number; error?: string }
): Promise<void> {
  // Get all enabled alerts for this service
  const alerts = await prisma.alert.findMany({
    where: {
      serviceId,
      isEnabled: true,
    },
  });

  if (alerts.length === 0) return;

  // Get recent checks for context
  const recentChecks = await prisma.uptimeCheck.findMany({
    where: { serviceId },
    orderBy: { checkedAt: "desc" },
    take: 10,
    select: { status: true },
  });

  // Get user settings for notifications (find the first user with settings)
  const userWithSettings = await prisma.user.findFirst({
    include: { settings: true },
  });
  const settings = userWithSettings?.settings ?? null;

  for (const alert of alerts) {
    // Check cooldown
    if (alert.lastFiredAt) {
      const cooldownMs = alert.cooldownMins * 60 * 1000;
      const timeSinceLastFire = Date.now() - alert.lastFiredAt.getTime();
      if (timeSinceLastFire < cooldownMs) continue;
    }

    const context: CheckContext = {
      status: checkResult.status,
      responseTime: checkResult.responseTime,
      statusCode: checkResult.statusCode,
      error: checkResult.error,
      recentChecks: recentChecks.map((c) => ({ status: c.status })),
    };

    const shouldFire = await evaluateAlert(alert, context);
    if (!shouldFire) continue;

    // Create alert event
    const event = await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        message: `Alert "${alert.name}" fired: Service ${checkResult.status}. ${checkResult.error || ""}`.trim(),
        metadata: {
          status: checkResult.status,
          responseTime: checkResult.responseTime,
          statusCode: checkResult.statusCode,
          error: checkResult.error,
        },
      },
    });

    // Update alert lastFiredAt
    await prisma.alert.update({
      where: { id: alert.id },
      data: { lastFiredAt: new Date() },
    });

    // Send notification
    await sendNotification(alert, event, settings);
  }
}
