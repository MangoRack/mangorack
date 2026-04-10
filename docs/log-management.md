# Log Management

MangoLab provides centralized log collection and viewing for all your homelab services. Logs can be ingested via the HTTP API and viewed through the built-in log viewer.

## The Log Viewer Interface

The log viewer (accessible from the main navigation under **Logs**) provides:

- **Real-time log stream**: View logs as they arrive in live mode
- **Filtering**: Filter by service, log level, source, and time range
- **Full-text search**: Search log messages for specific keywords or patterns
- **Log detail view**: Click any log entry to see the full message, metadata, and context
- **Color-coded levels**: Each log level has a distinct color for quick visual scanning

## Log Levels

MangoLab supports five standard log levels, ordered by severity:

| Level | Color | Description | Use For |
|---|---|---|---|
| `DEBUG` | Gray | Detailed diagnostic information | Development, troubleshooting |
| `INFO` | Blue | General informational messages | Normal operations, startup messages |
| `WARN` | Yellow | Potentially harmful situations | Deprecation warnings, approaching limits |
| `ERROR` | Red | Error events that may allow continued operation | Failed requests, connection issues |
| `FATAL` | Dark Red | Severe errors that cause the application to stop | Crashes, unrecoverable failures |

## Filtering and Searching Logs

### By Service

Select a specific service from the dropdown to show only its logs, or choose "All Services" to view logs across your entire homelab.

### By Level

Filter by one or more log levels. For example, show only `ERROR` and `FATAL` to focus on problems.

### By Source

Filter by the `source` field to show logs from a specific component (e.g., "nginx", "postgresql", "app").

### By Time Range

Select a predefined time range (15 minutes, 1 hour, 6 hours, 24 hours, 7 days) or set a custom start and end time.

### Full-Text Search

Enter keywords in the search box to filter log messages. The search matches against the `message` field.

## Live Mode (Real-Time Log Tailing)

Click the **Live** toggle in the log viewer to enable real-time streaming. In live mode:

- New log entries appear at the top of the list as they arrive
- The view auto-scrolls to show the latest entries
- Filters remain active -- only matching entries are shown
- Click **Live** again to pause and review the current logs

## HTTP Log Ingestion Endpoint

Send logs to MangoLab programmatically using the REST API.

### Endpoint

```
POST /api/ingest/logs
```

### Authentication

All requests must include the `X-Service-Token` header. The token value is the **service ID** of the service you want to associate the logs with.

You can find the service ID on the service detail page or via the API.

```
X-Service-Token: <service-id>
```

### Request Format

The request body must be a JSON array of log entry objects:

```json
[
  {
    "level": "INFO",
    "message": "Application started successfully",
    "source": "app",
    "timestamp": "2026-01-15T10:30:00Z",
    "metadata": {
      "version": "1.2.3",
      "pid": 1234
    }
  }
]
```

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `level` | string | No | `INFO` | One of: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` |
| `message` | string | **Yes** | -- | The log message (1-10,000 characters) |
| `source` | string | No | -- | The source/component name (max 255 characters) |
| `timestamp` | string | No | Current time | ISO 8601 datetime string |
| `metadata` | object | No | -- | Arbitrary key-value pairs for additional context |

### Batch Ingestion

You can send up to **1,000 log entries per request**. The request body is always an array, even for single entries:

```json
[
  {"level": "INFO", "message": "Request processed in 45ms", "source": "api"},
  {"level": "WARN", "message": "Slow query detected: 2.3s", "source": "db"},
  {"level": "ERROR", "message": "Failed to send email notification", "source": "notifications"}
]
```

### Response Format

**Success (201 Created):**

```json
{
  "data": {
    "ingested": 3
  }
}
```

**Validation Error (400):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "0.message: String must contain at least 1 character(s)"
  }
}
```

**Unauthorized (401):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "X-Service-Token header required"
  }
}
```

**Rate Limited (429):**

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Free plan: max 100 log entries per minute. Upgrade for higher limits."
  }
}
```

### Rate Limits

| Plan | Rate Limit |
|---|---|
| Free | 100 entries per minute per service |
| PRO | 10,000 entries per minute per service |

Rate limiting is enforced per service with a sliding 60-second window.

### curl Examples

**Send a single log entry:**

```bash
curl -X POST http://localhost:3000/api/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '[{
    "level": "INFO",
    "message": "Backup completed successfully",
    "source": "backup-script",
    "metadata": {"size_mb": 256, "duration_s": 45}
  }]'
```

**Send multiple log entries:**

```bash
curl -X POST http://localhost:3000/api/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '[
    {"level": "INFO", "message": "Starting daily backup", "source": "cron"},
    {"level": "INFO", "message": "Backing up database...", "source": "cron"},
    {"level": "INFO", "message": "Backup complete: 256 MB", "source": "cron"}
  ]'
```

**Send an error log:**

```bash
curl -X POST http://localhost:3000/api/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '[{
    "level": "ERROR",
    "message": "Disk space critically low: 2% remaining",
    "source": "monitor",
    "metadata": {"disk": "/dev/sda1", "available_gb": 4.2, "total_gb": 256}
  }]'
```

### Integration Examples

#### Node.js

```javascript
const MANGOLAB_URL = "http://localhost:3000";
const SERVICE_TOKEN = "clxxxxxxxxxxxxxxxxxx";

async function sendLog(level, message, source, metadata) {
  const response = await fetch(`${MANGOLAB_URL}/api/ingest/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": SERVICE_TOKEN,
    },
    body: JSON.stringify([{ level, message, source, metadata }]),
  });

  if (!response.ok) {
    console.error("Failed to send log:", await response.text());
  }
}

// Usage
sendLog("INFO", "Server started on port 8080", "api", { port: 8080 });
sendLog("ERROR", "Database connection failed", "api", { host: "db.local" });
```

#### Python

```python
import requests
import json
from datetime import datetime

MANGOLAB_URL = "http://localhost:3000"
SERVICE_TOKEN = "clxxxxxxxxxxxxxxxxxx"

def send_log(level, message, source=None, metadata=None):
    entry = {
        "level": level,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    if source:
        entry["source"] = source
    if metadata:
        entry["metadata"] = metadata

    response = requests.post(
        f"{MANGOLAB_URL}/api/ingest/logs",
        headers={
            "Content-Type": "application/json",
            "X-Service-Token": SERVICE_TOKEN,
        },
        json=[entry],
    )

    if response.status_code != 201:
        print(f"Failed to send log: {response.text}")

# Usage
send_log("INFO", "Backup completed", "backup-script", {"size_mb": 256})
send_log("ERROR", "Disk full", "monitor", {"disk": "/dev/sda1"})
```

#### Bash / Cron

```bash
#!/bin/bash
# send-log.sh -- Send a log entry to MangoLab

MANGOLAB_URL="http://localhost:3000"
SERVICE_TOKEN="clxxxxxxxxxxxxxxxxxx"
LEVEL="${1:-INFO}"
MESSAGE="$2"
SOURCE="${3:-script}"

curl -s -X POST "$MANGOLAB_URL/api/ingest/logs" \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: $SERVICE_TOKEN" \
  -d "[{
    \"level\": \"$LEVEL\",
    \"message\": \"$MESSAGE\",
    \"source\": \"$SOURCE\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }]"
```

Use in a cron job:

```cron
# Log disk usage every hour
0 * * * * /path/to/send-log.sh INFO "Disk usage: $(df -h / | tail -1 | awk '{print $5}')" "cron-disk"

# Log backup results
0 3 * * * /path/to/backup.sh && /path/to/send-log.sh INFO "Nightly backup completed" "cron-backup" || /path/to/send-log.sh ERROR "Nightly backup FAILED" "cron-backup"
```

## Log Retention Policies

Logs are automatically deleted after the retention period expires:

| Plan | Retention |
|---|---|
| Free | 3 days |
| PRO | 90 days |

Retention is enforced by a background cleanup job that runs periodically. Logs older than the retention period are permanently deleted and cannot be recovered.

## Exporting Logs (PRO)

PRO users can export logs in JSON or CSV format:

1. Navigate to **Logs** and apply your desired filters
2. Click the **Export** button
3. Choose the format (JSON or CSV)
4. The file will be downloaded to your browser

Exports include all fields: timestamp, level, message, source, metadata, and service name.

## Next Steps

- [Metrics](metrics.md) -- Track numeric metrics alongside logs
- [Alerts](alerts.md) -- Trigger alerts based on log patterns
- [API Reference](api-reference.md) -- Full API documentation for log ingestion
