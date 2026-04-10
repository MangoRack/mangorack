# Alerts

MangoLab alerts notify you when something goes wrong with your services. Configure alert rules, set severity levels, and receive notifications via email, webhooks, Discord, or Slack.

## Alert Types

MangoLab supports six alert types:

| Type | Description | Trigger |
|---|---|---|
| `SERVICE_DOWN` | Service is unreachable | Uptime check fails N times within a window |
| `SERVICE_SLOW` | Service response time is high | Response time exceeds a threshold |
| `HIGH_ERROR_RATE` | Error rate is elevated | Percentage of errors exceeds a threshold |
| `LOG_PATTERN` | A specific log pattern appears | Log message matches a regex or keyword |
| `METRIC_THRESHOLD` | A metric crosses a boundary | Metric value exceeds or drops below a threshold |
| `CUSTOM` | User-defined condition | Custom condition evaluated via the API |

## Creating Alerts

### Step 1: Navigate to Alerts

From the main navigation, click **Alerts** then **Create Alert**.

### Step 2: Configure the Alert

1. **Name**: Give the alert a descriptive name (e.g., "Nginx Down Alert")
2. **Service**: Select the service to monitor (optional -- some alert types work across all services)
3. **Type**: Choose the alert type (see above)
4. **Condition**: Configure the specific condition based on the alert type

### Step 3: Set the Condition

Each alert type has its own condition format:

**SERVICE_DOWN:**

```json
{
  "checkCount": 3,
  "windowMinutes": 5
}
```

This fires when the service fails 3 checks within a 5-minute window.

**SERVICE_SLOW:**

```json
{
  "thresholdMs": 2000,
  "checkCount": 3,
  "windowMinutes": 10
}
```

This fires when response time exceeds 2000ms for 3 checks within 10 minutes.

**HIGH_ERROR_RATE:**

```json
{
  "thresholdPercent": 10,
  "windowMinutes": 15
}
```

This fires when more than 10% of checks fail within 15 minutes.

**LOG_PATTERN:**

```json
{
  "pattern": "OutOfMemoryError",
  "level": "ERROR",
  "countThreshold": 1,
  "windowMinutes": 5
}
```

This fires when the pattern "OutOfMemoryError" appears in an ERROR-level log entry.

**METRIC_THRESHOLD:**

```json
{
  "metric": "cpu_usage",
  "operator": "gt",
  "value": 90,
  "unit": "percent"
}
```

Operators: `gt` (greater than), `gte` (greater than or equal), `lt` (less than), `lte` (less than or equal), `eq` (equal).

### Step 4: Set Severity and Cooldown

- **Severity**: Choose the severity level (see below)
- **Cooldown**: Set the minimum time between repeated firings (default: 15 minutes)

### Step 5: Save

Click **Save** to create the alert. It will begin evaluating immediately.

## Severity Levels

| Severity | Badge Color | Use For |
|---|---|---|
| `INFO` | Blue | Non-critical informational alerts (e.g., certificate expiry in 30 days) |
| `WARNING` | Yellow | Situations that need attention soon (e.g., high memory usage, slow response) |
| `CRITICAL` | Red | Immediate action required (e.g., service down, disk full) |

Severity affects how notifications are displayed and can be used to filter alerts in the dashboard.

## Cooldown Periods

The cooldown period prevents alert fatigue by suppressing repeated notifications for the same alert:

- After an alert fires, it will not fire again until the cooldown period has elapsed
- Default cooldown: 15 minutes
- Configurable per alert (1 minute to 24 hours)
- The alert condition is still evaluated during cooldown, but no notification is sent

**Recommended cooldowns:**

| Scenario | Cooldown |
|---|---|
| Critical production service | 5 minutes |
| Standard service monitoring | 15 minutes |
| Non-critical/informational | 60 minutes |
| Daily summary alerts | 1440 minutes (24 hours) |

## Notification Channels

Notifications are configured in **Settings > Notifications**. When an alert fires, MangoLab sends notifications to all configured channels.

### Email Setup

1. Go to **Settings > Notifications**
2. Enter your email address in the **Notification Email** field
3. Click **Save**

MangoLab sends alert emails with:
- Alert name and severity in the subject line
- Service name and current status
- Alert condition details
- Timestamp of the event

> **Note:** Email notifications require a configured SMTP server. See your deployment configuration for mail setup.

### Webhook Integration (PRO)

Webhooks send an HTTP POST request to a URL of your choice when an alert fires.

1. Go to **Settings > Notifications**
2. Enter your webhook URL in the **Webhook URL** field
3. Click **Save**

**Webhook payload format:**

```json
{
  "alert": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "name": "Nginx Down Alert",
    "type": "SERVICE_DOWN",
    "severity": "CRITICAL"
  },
  "service": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "name": "Nginx",
    "url": "https://nginx.homelab.local",
    "currentStatus": "DOWN"
  },
  "event": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "message": "Nginx is DOWN - connection refused on port 443",
    "firedAt": "2026-01-15T10:30:00.000Z",
    "metadata": {
      "responseTime": null,
      "statusCode": null,
      "error": "Connection refused"
    }
  }
}
```

### Discord Webhook Setup (PRO)

Send alert notifications to a Discord channel:

**Step 1: Create a Discord webhook**

1. Open Discord and navigate to the channel where you want alerts
2. Click the gear icon (Edit Channel) next to the channel name
3. Go to **Integrations > Webhooks**
4. Click **New Webhook**
5. Give it a name (e.g., "MangoLab Alerts") and optionally set an avatar
6. Click **Copy Webhook URL**

**Step 2: Configure in MangoLab**

1. Go to **Settings > Notifications**
2. Paste the Discord webhook URL in the **Discord Webhook URL** field
3. Click **Save**

MangoLab will send formatted Discord embeds with color-coded severity (blue for INFO, yellow for WARNING, red for CRITICAL).

### Slack Webhook Setup (PRO)

Send alert notifications to a Slack channel:

**Step 1: Create a Slack app**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App > From scratch**
3. Name it "MangoLab" and select your workspace
4. Click **Create App**

**Step 2: Enable incoming webhooks**

1. In the app settings, go to **Incoming Webhooks**
2. Toggle **Activate Incoming Webhooks** to ON
3. Click **Add New Webhook to Workspace**
4. Select the channel where you want alerts
5. Click **Allow**
6. Copy the webhook URL (it looks like `https://hooks.slack.com/services/T.../B.../xxx`)

**Step 3: Configure in MangoLab**

1. Go to **Settings > Notifications**
2. Paste the Slack webhook URL in the **Slack Webhook URL** field
3. Click **Save**

MangoLab will send formatted Slack messages with severity-colored attachments.

## Alert History and Events

Every time an alert fires, MangoLab creates an **alert event** record. View alert history from:

- **Alerts page**: Shows all alerts with their last fired time and event count
- **Alert detail page**: Click an alert to see its full event history
- **Service detail page**: Shows events for alerts associated with that service

Each event records:
- **Message**: Human-readable description of what triggered the alert
- **Fired at**: When the alert fired
- **Resolved at**: When the condition cleared (if applicable)
- **Metadata**: Additional context (current values, thresholds, error details)

## Free vs PRO Alert Limits

| Feature | Free | PRO |
|---|---|---|
| Maximum alerts | 3 | 50 |
| Email notifications | Yes | Yes |
| Webhook notifications | No | Yes |
| Discord notifications | No | Yes |
| Slack notifications | No | Yes |
| Alert types | SERVICE_DOWN only | All types |

## Best Practices

1. **Start with SERVICE_DOWN alerts** for your most critical services. These are the highest-value alerts with the least noise.

2. **Set appropriate cooldowns** to avoid alert fatigue. If you get too many notifications, increase the cooldown or tighten the condition.

3. **Use severity levels intentionally**:
   - CRITICAL: Wake-me-up-at-3am issues
   - WARNING: Look-at-this-in-the-morning issues
   - INFO: Good-to-know, check-the-dashboard issues

4. **Combine alert types** for comprehensive monitoring. For example, use SERVICE_DOWN for availability and SERVICE_SLOW for performance on the same service.

5. **Test your notification channels** by creating a test alert with a condition that fires immediately.

## Next Steps

- [Services](services.md) -- Configure the services to alert on
- [Log Management](log-management.md) -- Set up log pattern alerts
- [Metrics](metrics.md) -- Set up metric threshold alerts
- [Dashboard](dashboard.md) -- View alert status on your dashboard
