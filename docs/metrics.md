# Metrics

MangoRack allows you to ingest, store, and visualize custom numeric metrics for your services. Track CPU usage, memory consumption, request counts, queue depths, or any other numeric measurement. Metric ingestion is a **PRO feature**.

## What Metrics Can Be Tracked

Metrics in MangoRack are organized as **metric series**, where each series is a named time series of numeric data points associated with a service. Examples:

| Metric Name | Unit | Description |
|---|---|---|
| `cpu_usage` | percent | CPU utilization percentage |
| `memory_usage` | percent | Memory utilization percentage |
| `memory_used_mb` | MB | Absolute memory usage in megabytes |
| `disk_usage` | percent | Disk utilization percentage |
| `request_count` | count | Number of requests processed |
| `response_time_avg` | ms | Average response time in milliseconds |
| `error_rate` | percent | Percentage of requests that resulted in errors |
| `queue_depth` | count | Number of items in a work queue |
| `active_connections` | count | Number of active connections |
| `temperature` | celsius | Hardware temperature reading |

You are free to define any metric name and unit that makes sense for your use case.

## HTTP Metrics Ingestion Endpoint

### Endpoint

```
POST /api/ingest/metrics
```

### Authentication

All requests must include the `X-Service-Token` header with a valid service ID:

```
X-Service-Token: <service-id>
```

### Request Format

```json
{
  "serviceId": "clxxxxxxxxxxxxxxxxxx",
  "metrics": [
    {
      "name": "cpu_usage",
      "value": 45.2,
      "unit": "percent",
      "ts": "2026-01-15T10:00:00Z"
    },
    {
      "name": "memory_usage",
      "value": 72.8,
      "unit": "percent",
      "ts": "2026-01-15T10:00:00Z"
    }
  ]
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `serviceId` | string | **Yes** | The CUID of the service to associate metrics with |
| `metrics` | array | **Yes** | Array of 1-500 metric data points |
| `metrics[].name` | string | **Yes** | Metric name (1-255 characters) |
| `metrics[].value` | number | **Yes** | Numeric value |
| `metrics[].unit` | string | No | Unit of measurement (max 50 characters) |
| `metrics[].ts` | string | No | ISO 8601 timestamp (defaults to current time) |

### Response Format

**Success (201 Created):**

```json
{
  "data": {
    "ingested": 2
  }
}
```

**Validation Error (400):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "metrics.0.name: String must contain at least 1 character(s)"
  }
}
```

### How Metric Series Work

When you ingest metrics, MangoRack automatically manages metric series:

1. **First ingestion** of a new metric name for a service creates a new `MetricSeries` record with the name and unit.
2. **Subsequent ingestions** with the same metric name append data points to the existing series.
3. Each series is uniquely identified by the combination of `serviceId` and `name`.

This means you do not need to pre-register or configure metrics -- just start sending data.

### curl Examples

**Send a single metric:**

```bash
curl -X POST http://localhost:3000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '{
    "serviceId": "clxxxxxxxxxxxxxxxxxx",
    "metrics": [
      {
        "name": "cpu_usage",
        "value": 45.2,
        "unit": "percent"
      }
    ]
  }'
```

**Send multiple metrics at once:**

```bash
curl -X POST http://localhost:3000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '{
    "serviceId": "clxxxxxxxxxxxxxxxxxx",
    "metrics": [
      {"name": "cpu_usage", "value": 45.2, "unit": "percent"},
      {"name": "memory_usage", "value": 72.8, "unit": "percent"},
      {"name": "disk_usage", "value": 34.1, "unit": "percent"},
      {"name": "active_connections", "value": 142, "unit": "count"}
    ]
  }'
```

**Send metrics with explicit timestamps:**

```bash
curl -X POST http://localhost:3000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '{
    "serviceId": "clxxxxxxxxxxxxxxxxxx",
    "metrics": [
      {"name": "cpu_usage", "value": 45.2, "unit": "percent", "ts": "2026-01-15T10:00:00Z"},
      {"name": "cpu_usage", "value": 52.1, "unit": "percent", "ts": "2026-01-15T10:01:00Z"},
      {"name": "cpu_usage", "value": 38.7, "unit": "percent", "ts": "2026-01-15T10:02:00Z"}
    ]
  }'
```

### Integration Examples

#### Node.js

```javascript
const MANGORACK_URL = "http://localhost:3000";
const SERVICE_TOKEN = "clxxxxxxxxxxxxxxxxxx";
const SERVICE_ID = "clxxxxxxxxxxxxxxxxxx";

async function sendMetrics(metrics) {
  const response = await fetch(`${MANGORACK_URL}/api/ingest/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": SERVICE_TOKEN,
    },
    body: JSON.stringify({ serviceId: SERVICE_ID, metrics }),
  });

  if (!response.ok) {
    console.error("Failed to send metrics:", await response.text());
  }
}

// Collect and send system metrics every 30 seconds
setInterval(async () => {
  const memUsage = process.memoryUsage();
  await sendMetrics([
    { name: "heap_used_mb", value: memUsage.heapUsed / 1024 / 1024, unit: "MB" },
    { name: "heap_total_mb", value: memUsage.heapTotal / 1024 / 1024, unit: "MB" },
    { name: "rss_mb", value: memUsage.rss / 1024 / 1024, unit: "MB" },
  ]);
}, 30000);
```

#### Python

```python
import requests
import psutil
import time
from datetime import datetime

MANGORACK_URL = "http://localhost:3000"
SERVICE_TOKEN = "clxxxxxxxxxxxxxxxxxx"
SERVICE_ID = "clxxxxxxxxxxxxxxxxxx"

def send_metrics(metrics):
    response = requests.post(
        f"{MANGORACK_URL}/api/ingest/metrics",
        headers={
            "Content-Type": "application/json",
            "X-Service-Token": SERVICE_TOKEN,
        },
        json={"serviceId": SERVICE_ID, "metrics": metrics},
    )
    if response.status_code != 201:
        print(f"Failed to send metrics: {response.text}")

# Collect and send system metrics every 30 seconds
while True:
    send_metrics([
        {"name": "cpu_usage", "value": psutil.cpu_percent(), "unit": "percent"},
        {"name": "memory_usage", "value": psutil.virtual_memory().percent, "unit": "percent"},
        {"name": "disk_usage", "value": psutil.disk_usage("/").percent, "unit": "percent"},
    ])
    time.sleep(30)
```

#### Bash (Prometheus-style Push)

```bash
#!/bin/bash
# push-metrics.sh -- Push system metrics to MangoRack

MANGORACK_URL="http://localhost:3000"
SERVICE_TOKEN="clxxxxxxxxxxxxxxxxxx"
SERVICE_ID="clxxxxxxxxxxxxxxxxxx"

CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%//')
MEM=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

curl -s -X POST "$MANGORACK_URL/api/ingest/metrics" \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: $SERVICE_TOKEN" \
  -d "{
    \"serviceId\": \"$SERVICE_ID\",
    \"metrics\": [
      {\"name\": \"cpu_usage\", \"value\": $CPU, \"unit\": \"percent\"},
      {\"name\": \"memory_usage\", \"value\": $MEM, \"unit\": \"percent\"},
      {\"name\": \"disk_usage\", \"value\": $DISK, \"unit\": \"percent\"}
    ]
  }"
```

Use with cron:

```cron
# Push system metrics every minute
* * * * * /path/to/push-metrics.sh
```

## Viewing Metrics Charts

Navigate to a service's detail page and click the **Metrics** tab to view charts. Each metric series is displayed as a line chart with:

- **Time range selector**: Choose from predefined ranges or set a custom window
- **Auto-refresh**: Charts update automatically when new data arrives
- **Hover details**: Hover over any point to see the exact value and timestamp
- **Zoom**: Click and drag to zoom into a specific time range

## Metric Aggregation and Compaction

For performance, MangoRack aggregates older metric data:

- **Raw data**: Individual data points are retained for recent data
- **1-minute aggregates**: After 24 hours, data is compacted to 1-minute averages
- **5-minute aggregates**: After 7 days, data is further compacted
- **1-hour aggregates**: After 30 days, data is compacted to hourly averages

This ensures that charts remain responsive even when viewing long time ranges.

## Custom Metric Dashboards (PRO)

PRO users can create custom dashboards with metric widgets:

1. Navigate to **Dashboard > Edit**
2. Add a **Metric Chart** widget
3. Select the service and metric series to display
4. Configure the chart type (line, bar, area)
5. Set the time range and refresh interval
6. Save the dashboard

You can create multiple dashboards with different metric views for different purposes (e.g., "Server Health", "Application Performance", "Network").

## Next Steps

- [Log Management](log-management.md) -- Centralized log collection
- [Alerts](alerts.md) -- Set up alerts based on metric thresholds
- [Dashboard](dashboard.md) -- Build custom metric dashboards
- [API Reference](api-reference.md) -- Full API documentation
