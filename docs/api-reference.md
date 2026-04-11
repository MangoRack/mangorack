# API Reference

Complete REST API documentation for MangoRack.

## Authentication

MangoRack uses two authentication methods:

| Method | Used For | Header |
|---|---|---|
| **Session-based** | Dashboard and management endpoints | Cookie-based (automatic in browser) |
| **Token-based** | Ingestion endpoints (`/api/ingest/*`) | `X-Service-Token: <service-id>` |

Session-based authentication is handled automatically when using the MangoRack web interface. For programmatic API access (PRO feature), include the session cookie obtained from the login endpoint.

Token-based authentication uses the service ID as a bearer token in the `X-Service-Token` header. This is used exclusively for log and metric ingestion.

## Base URL

```
http://localhost:3000
```

Or your configured `NEXTAUTH_URL` for production deployments.

## Headers

All requests should include:

```
Content-Type: application/json
```

Ingestion requests must include:

```
X-Service-Token: <service-id>
```

## Response Format

### Success responses

```json
{
  "data": {
    "...": "..."
  }
}
```

### Error responses

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `LIMIT_EXCEEDED` | 403 | Free tier limit reached |
| `RATE_LIMITED` | 429 | Too many requests |
| `INVALID_SERVICE` | 400 | Referenced service does not exist or is inactive |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Health

#### GET /api/health

Check the health of MangoRack and its dependencies.

- **Auth required:** No
- **Query params:** None

**Example request:**

```bash
curl http://localhost:3000/api/health
```

**Example response (200):**

```json
{
  "data": {
    "status": "ok",
    "db": "ok",
    "redis": "ok",
    "version": "1.0.0"
  }
}
```

**Example response (503 -- degraded):**

```json
{
  "data": {
    "status": "degraded",
    "db": "ok",
    "redis": "error",
    "version": "1.0.0"
  }
}
```

---

### Services

#### GET /api/services

List all services.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `UP`, `DOWN`, `DEGRADED`, `PAUSED`, `UNKNOWN` |
| `type` | string | Filter by type: `HTTP`, `HTTPS`, `TCP`, `PING`, `DNS`, `CUSTOM` |
| `category` | string | Filter by category |
| `tag` | string | Filter by tag |
| `search` | string | Search by name or description |

**Example request:**

```bash
curl http://localhost:3000/api/services \
  -H "Cookie: next-auth.session-token=..."
```

**Example response:**

```json
{
  "data": [
    {
      "id": "clxxxxxxxxxxxxxxxxxx",
      "name": "Nginx",
      "description": "Reverse proxy",
      "url": "https://nginx.homelab.local",
      "type": "HTTPS",
      "category": "Infrastructure",
      "tags": ["proxy", "web"],
      "currentStatus": "UP",
      "pingInterval": 30,
      "lastCheckedAt": "2026-01-15T10:30:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/services

Create a new service.

- **Auth required:** Yes (session)
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Service name |
| `description` | string | No | Service description |
| `url` | string | No | URL or hostname to monitor |
| `type` | string | Yes | `HTTP`, `HTTPS`, `TCP`, `PING`, `DNS`, `CUSTOM` |
| `category` | string | No | Category for grouping |
| `tags` | string[] | No | Tags for filtering |
| `nodeId` | string | No | Associated node ID (PRO) |
| `port` | number | No | Port number |
| `icon` | string | No | Icon name |
| `color` | string | No | Hex color code |
| `pingEnabled` | boolean | No | Enable monitoring (default: true) |
| `pingInterval` | number | No | Check interval in seconds (default: 60) |
| `pingTimeout` | number | No | Timeout in seconds (default: 10) |
| `expectedStatus` | number | No | Expected HTTP status code (default: 200) |
| `pingMethod` | string | No | HTTP method (default: GET) |
| `pingHeaders` | object | No | Custom headers (PRO) |
| `pingBody` | string | No | Request body (PRO) |

**Example request:**

```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "My API",
    "url": "https://api.example.com/health",
    "type": "HTTPS",
    "category": "Applications",
    "tags": ["api", "production"],
    "pingInterval": 30,
    "expectedStatus": 200
  }'
```

**Example response (201):**

```json
{
  "data": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "name": "My API",
    "url": "https://api.example.com/health",
    "type": "HTTPS",
    "currentStatus": "UNKNOWN",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

#### GET /api/services/:id

Get a single service by ID.

- **Auth required:** Yes (session)

**Example request:**

```bash
curl http://localhost:3000/api/services/clxxxxxxxxxxxxxxxxxx \
  -H "Cookie: next-auth.session-token=..."
```

#### PATCH /api/services/:id

Update a service.

- **Auth required:** Yes (session)
- **Request body:** Any fields from the POST schema (partial update)

**Example request:**

```bash
curl -X PATCH http://localhost:3000/api/services/clxxxxxxxxxxxxxxxxxx \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"pingInterval": 15, "pingEnabled": true}'
```

#### DELETE /api/services/:id

Delete a service and all associated data.

- **Auth required:** Yes (session)

**Example request:**

```bash
curl -X DELETE http://localhost:3000/api/services/clxxxxxxxxxxxxxxxxxx \
  -H "Cookie: next-auth.session-token=..."
```

**Example response (200):**

```json
{
  "data": {
    "deleted": true
  }
}
```

#### GET /api/services/:id/logs

Get logs for a specific service.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `level` | string | Filter by level: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` |
| `search` | string | Search log messages |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |
| `limit` | number | Number of entries (default: 50, max: 1000) |
| `offset` | number | Pagination offset |

#### GET /api/services/:id/metrics

Get metric series and data points for a specific service.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `name` | string | Filter by metric name |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |

---

### Uptime

#### GET /api/uptime

Get uptime summary for all services.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `range` | string | Time range: `24h`, `7d`, `30d`, `90d` |

**Example request:**

```bash
curl http://localhost:3000/api/uptime?range=7d \
  -H "Cookie: next-auth.session-token=..."
```

**Example response:**

```json
{
  "data": [
    {
      "serviceId": "clxxxxxxxxxxxxxxxxxx",
      "serviceName": "Nginx",
      "uptimePercent": 99.95,
      "totalChecks": 10080,
      "successfulChecks": 10075,
      "avgResponseTime": 45
    }
  ]
}
```

#### GET /api/uptime/:id

Get detailed uptime data for a specific service.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `range` | string | Time range: `24h`, `7d`, `30d`, `90d` |
| `limit` | number | Number of check records to return |

---

### Logs

#### GET /api/logs

Get logs across all services.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `serviceId` | string | Filter by service |
| `level` | string | Filter by level |
| `source` | string | Filter by source |
| `search` | string | Search log messages |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |
| `limit` | number | Number of entries (default: 50, max: 1000) |
| `offset` | number | Pagination offset |

**Example request:**

```bash
curl "http://localhost:3000/api/logs?level=ERROR&limit=10" \
  -H "Cookie: next-auth.session-token=..."
```

**Example response:**

```json
{
  "data": [
    {
      "id": "clxxxxxxxxxxxxxxxxxx",
      "serviceId": "clxxxxxxxxxxxxxxxxxx",
      "level": "ERROR",
      "message": "Connection timeout after 30s",
      "source": "grafana",
      "metadata": {"datasource": "prometheus"},
      "timestamp": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Analytics

#### GET /api/analytics

Get analytics data for the dashboard.

- **Auth required:** Yes (session)
- **Query params:**

| Param | Type | Description |
|---|---|---|
| `range` | string | Time range: `24h`, `7d`, `30d` |

---

### Alerts

#### GET /api/alerts

List all alerts.

- **Auth required:** Yes (session)

**Example response:**

```json
{
  "data": [
    {
      "id": "clxxxxxxxxxxxxxxxxxx",
      "name": "Nginx Down Alert",
      "serviceId": "clxxxxxxxxxxxxxxxxxx",
      "type": "SERVICE_DOWN",
      "condition": {"checkCount": 3, "windowMinutes": 5},
      "severity": "CRITICAL",
      "isEnabled": true,
      "cooldownMins": 15,
      "lastFiredAt": "2026-01-15T10:30:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/alerts

Create a new alert.

- **Auth required:** Yes (session)
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Alert name |
| `serviceId` | string | No | Service to alert on |
| `type` | string | Yes | `SERVICE_DOWN`, `SERVICE_SLOW`, `HIGH_ERROR_RATE`, `LOG_PATTERN`, `METRIC_THRESHOLD`, `CUSTOM` |
| `condition` | object | Yes | Alert condition (varies by type) |
| `severity` | string | No | `INFO`, `WARNING`, `CRITICAL` (default: `WARNING`) |
| `isEnabled` | boolean | No | Enable the alert (default: true) |
| `cooldownMins` | number | No | Cooldown in minutes (default: 15) |

**Example request:**

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "API Down",
    "serviceId": "clxxxxxxxxxxxxxxxxxx",
    "type": "SERVICE_DOWN",
    "condition": {"checkCount": 3, "windowMinutes": 5},
    "severity": "CRITICAL",
    "cooldownMins": 10
  }'
```

#### GET /api/alerts/:id

Get a single alert with its event history.

- **Auth required:** Yes (session)

#### PATCH /api/alerts/:id

Update an alert.

- **Auth required:** Yes (session)
- **Request body:** Any fields from the POST schema (partial update)

#### DELETE /api/alerts/:id

Delete an alert and its event history.

- **Auth required:** Yes (session)

---

### Nodes

#### GET /api/nodes

List all nodes.

- **Auth required:** Yes (session)
- **PRO feature**

**Example response:**

```json
{
  "data": [
    {
      "id": "clxxxxxxxxxxxxxxxxxx",
      "name": "homelab-01",
      "type": "PHYSICAL",
      "hostname": "homelab-01.local",
      "ipAddress": "192.168.1.100",
      "os": "Debian 12",
      "cpu": "Intel i7-12700K",
      "ram": "64 GB DDR5",
      "storage": "2 TB NVMe",
      "isActive": true,
      "services": [
        {"id": "clxxxxxxxxxxxxxxxxxx", "name": "Nginx", "currentStatus": "UP"}
      ]
    }
  ]
}
```

#### POST /api/nodes

Create a new node.

- **Auth required:** Yes (session)
- **PRO feature**
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Node name |
| `description` | string | No | Node description |
| `type` | string | Yes | `PHYSICAL`, `VIRTUAL`, `CONTAINER`, `CLOUD` |
| `hostname` | string | No | Network hostname |
| `ipAddress` | string | No | IP address |
| `os` | string | No | Operating system |
| `cpu` | string | No | CPU description |
| `ram` | string | No | RAM capacity |
| `storage` | string | No | Storage capacity |
| `tags` | string[] | No | Tags |

---

### Dashboard

#### GET /api/dashboard/layout

Get the current dashboard layout.

- **Auth required:** Yes (session)

**Example response:**

```json
{
  "data": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "name": "Default",
    "isDefault": true,
    "layout": {
      "widgets": [
        {"type": "quick-stats", "size": "small", "position": {"x": 0, "y": 0}},
        {"type": "service-list", "size": "large", "position": {"x": 0, "y": 1}}
      ]
    }
  }
}
```

#### POST /api/dashboard/layout

Save a dashboard layout.

- **Auth required:** Yes (session)
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Dashboard name (default: "Default") |
| `isDefault` | boolean | No | Set as default dashboard |
| `layout` | object | Yes | Widget layout configuration |

#### GET /api/dashboard/widgets

Get available widget types and their configuration options.

- **Auth required:** Yes (session)

---

### License

#### GET /api/license/status

Get the current license status.

- **Auth required:** Yes (session)

**Example response:**

```json
{
  "data": {
    "plan": "PRO",
    "isValid": true,
    "expiresAt": "2027-12-31T00:00:00.000Z",
    "features": {
      "maxServices": 100,
      "maxAlerts": 50,
      "maxNodes": 20,
      "logRetentionDays": 90,
      "metricIngestion": true,
      "webhookAlerts": true
    }
  }
}
```

#### POST /api/license/validate

Validate and activate a license key.

- **Auth required:** Yes (session)
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | string | Yes | License key in format `MANGO-XXXXX-XXXXX-XXXXX-XXXXX` |

**Example request:**

```bash
curl -X POST http://localhost:3000/api/license/validate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"key": "MANGO-A3B5C-D7E9F-G2H4J-K6M8N"}'
```

**Example response:**

```json
{
  "data": {
    "valid": true,
    "plan": "PRO",
    "expiresAt": "2027-12-31T00:00:00.000Z"
  }
}
```

---

### Ingestion

#### POST /api/ingest/logs

Ingest log entries for a service.

- **Auth required:** Yes (X-Service-Token)
- **Rate limited:** Free: 100/min, PRO: 10,000/min
- **Request body:** Array of log entry objects (1-1000 entries)

| Field | Type | Required | Description |
|---|---|---|---|
| `level` | string | No | `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` (default: `INFO`) |
| `message` | string | Yes | Log message (1-10,000 chars) |
| `source` | string | No | Source identifier (max 255 chars) |
| `timestamp` | string | No | ISO 8601 datetime (default: now) |
| `metadata` | object | No | Arbitrary key-value metadata |

**Example request:**

```bash
curl -X POST http://localhost:3000/api/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '[
    {"level": "INFO", "message": "Server started", "source": "app"},
    {"level": "ERROR", "message": "DB connection failed", "source": "db"}
  ]'
```

**Example response (201):**

```json
{
  "data": {
    "ingested": 2
  }
}
```

#### POST /api/ingest/metrics

Ingest metric data points for a service.

- **Auth required:** Yes (X-Service-Token)
- **PRO feature**
- **Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `serviceId` | string | Yes | Target service CUID |
| `metrics` | array | Yes | Array of 1-500 metric objects |
| `metrics[].name` | string | Yes | Metric name (1-255 chars) |
| `metrics[].value` | number | Yes | Numeric value |
| `metrics[].unit` | string | No | Unit of measurement (max 50 chars) |
| `metrics[].ts` | string | No | ISO 8601 datetime (default: now) |

**Example request:**

```bash
curl -X POST http://localhost:3000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: clxxxxxxxxxxxxxxxxxx" \
  -d '{
    "serviceId": "clxxxxxxxxxxxxxxxxxx",
    "metrics": [
      {"name": "cpu_usage", "value": 45.2, "unit": "percent"},
      {"name": "memory_usage", "value": 72.8, "unit": "percent"}
    ]
  }'
```

**Example response (201):**

```json
{
  "data": {
    "ingested": 2
  }
}
```
