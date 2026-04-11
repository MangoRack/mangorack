# Architecture

Technical overview of MangoLab's architecture, data model, and design decisions.

## System Architecture

```
                              +------------------+
                              |   Web Browser    |
                              +--------+---------+
                                       |
                                  HTTPS (443)
                                       |
                              +--------+---------+
                              |  Reverse Proxy   |
                              |  (Nginx/Traefik) |
                              +--------+---------+
                                       |
                                  HTTP (3000)
                                       |
                  +--------------------+--------------------+
                  |                                         |
                  |            MangoLab App                  |
                  |         (Next.js 14 / Node.js 20)       |
                  |                                         |
                  |  +-------------+   +----------------+   |
                  |  |  Next.js    |   |  Background    |   |
                  |  |  App Router |   |  Workers       |   |
                  |  |  (API +     |   |  - Uptime      |   |
                  |  |   UI SSR)   |   |  - Alerts      |   |
                  |  +------+------+   |  - Cleanup     |   |
                  |         |          +-------+--------+   |
                  +---------+------------------+------------+
                            |                  |
              +-------------+------+   +-------+--------+
              |                    |   |                 |
              |   PostgreSQL 16    |   |    Redis 7      |
              |                    |   |                 |
              |  - Users           |   |  - Cache        |
              |  - Services        |   |  - Rate limits  |
              |  - Uptime checks   |   |  - License      |
              |  - Logs            |   |    cache        |
              |  - Metrics         |   |                 |
              |  - Alerts          |   |                 |
              |  - Dashboards      |   |                 |
              +--------------------+   +-----------------+
```

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | 14 | React-based UI with server-side rendering |
| **Backend** | Next.js API Routes | 14 | REST API endpoints |
| **Runtime** | Node.js | 20 | JavaScript runtime |
| **Database** | PostgreSQL | 16 | Primary data store |
| **ORM** | Prisma | Latest | Database access and migrations |
| **Cache** | Redis | 7 | Caching, rate limiting |
| **Auth** | NextAuth.js | Latest | Session-based authentication |
| **Validation** | Zod | Latest | Request/response schema validation |
| **Container** | Docker | 20+ | Application packaging |
| **Orchestration** | Docker Compose | 2+ | Multi-container deployment |
| **Password Hashing** | bcryptjs | Latest | Secure password storage |
| **License Crypto** | Node.js crypto | Built-in | HMAC-SHA256 license key validation |

## Database Schema Overview

The database contains 11 models with the following relationships:

```
User ──────── UserSettings          (1:1)
  └── Session                       (1:many)

Node ──────── Service               (1:many)

Service ───── UptimeCheck           (1:many, cascade delete)
  ├── LogEntry                      (1:many, set null on delete)
  ├── MetricSeries ── MetricPoint   (1:many, cascade delete)
  └── Alert ──── AlertEvent         (1:many, cascade delete)

License                             (standalone)
DashboardLayout                     (standalone)
```

### Key Models

**User / Session / UserSettings**: Authentication and user preferences. Sessions use opaque tokens stored in the database. User settings include notification channel configuration (email, webhook, Discord, Slack).

**Service**: The core entity. Each service has a type (HTTP, HTTPS, TCP, PING, DNS, Custom), monitoring configuration (interval, timeout, expected status), and status tracking fields (currentStatus, lastCheckedAt, lastUpAt, lastDownAt).

**UptimeCheck**: Individual check results with status, response time, status code, and error details. Indexed by `[serviceId, checkedAt]` for efficient time-range queries.

**LogEntry**: Log entries with level, message, source, and metadata. Can be associated with a service or be service-independent. Indexed by `[serviceId, timestamp]`, `[timestamp]`, and `[level]`.

**MetricSeries / MetricPoint**: Time-series metric data. Each series is uniquely identified by `[serviceId, name]`. Points are indexed by `[seriesId, ts]` for efficient range queries.

**Alert / AlertEvent**: Alert rules with conditions and their firing history. Conditions are stored as JSON, allowing flexible schema per alert type.

**DashboardLayout**: Dashboard widget configurations stored as JSON. Supports multiple named layouts.

**License**: License key storage with plan type, activation date, and expiry. The key itself contains embedded plan and expiry data verified via HMAC.

## Background Workers

MangoLab runs several background workers within the Node.js process:

### Uptime Check Worker

- Runs on a timer matching each service's `pingInterval`
- Iterates over all active services where `pingEnabled = true`
- Performs the appropriate check based on service type
- Updates the service's `currentStatus`, `lastCheckedAt`, `lastUpAt`, `lastDownAt`
- Creates an `UptimeCheck` record

### Alert Evaluation Worker

- Triggered after each uptime check
- Evaluates all enabled alerts for the checked service
- Compares current data against alert conditions
- Respects cooldown periods
- Creates `AlertEvent` records and sends notifications when alerts fire

### Data Cleanup Worker

- Runs periodically (e.g., every hour)
- Deletes uptime checks older than the retention period (7 days free, 365 days PRO)
- Deletes log entries older than the retention period (3 days free, 90 days PRO)
- Compacts metric data into aggregated points for older time ranges

## Data Flow: Uptime Checks

```
Timer fires
    |
    v
For each active service:
    |
    v
Perform check (HTTP/TCP/PING/DNS)
    |
    v
Record UptimeCheck
    |
    v
Update Service status
    |
    v
Evaluate alerts for this service
    |
    +--> Alert condition met?
         |
         Yes --> Cooldown elapsed?
                 |
                 Yes --> Create AlertEvent
                         |
                         v
                         Send notifications
                         (email, webhook, Discord, Slack)
```

## Data Flow: Log Ingestion

```
HTTP POST /api/ingest/logs
    |
    v
Validate X-Service-Token
    |
    v
Check rate limit (Redis counter)
    |
    v
Validate request body (Zod schema)
    |
    v
Insert LogEntry records (Prisma createMany)
    |
    v
Return ingested count
```

## Data Flow: Metric Ingestion

```
HTTP POST /api/ingest/metrics
    |
    v
Validate X-Service-Token
    |
    v
Validate request body (Zod schema)
    |
    v
Group metrics by name
    |
    v
For each metric name:
    |
    v
Upsert MetricSeries (find or create by serviceId + name)
    |
    v
Insert MetricPoint records (Prisma createMany)
    |
    v
Return total ingested count
```

## Caching Strategy

MangoLab uses Redis for caching with the following patterns:

| Cache Key | TTL | Purpose |
|---|---|---|
| `license:<key>` | 1 hour | Cache license validation results to avoid repeated crypto operations |
| `license:current_plan` | 1 hour | Cache the current license plan for quick feature checks |
| `ratelimit:logs:<serviceId>` | 60 seconds | Sliding window counter for log ingestion rate limiting |

Cache invalidation:
- License cache is updated when a new license is validated
- Rate limit counters expire automatically after 60 seconds
- If Redis is unavailable, the application continues without caching (database is used as fallback)

## Security Model

### Authentication

- Passwords are hashed with bcrypt (12 rounds)
- Sessions use opaque tokens stored in the database
- Session tokens are transmitted via HTTP-only cookies
- `NEXTAUTH_SECRET` encrypts the session cookie

### Authorization

- All dashboard and management API endpoints require an active session
- Ingestion endpoints use service ID as a bearer token (no user session required)
- There is no multi-user role system -- all authenticated users have full access

### License Security

- License keys are validated server-side using cryptographic signatures
- The key payload contains the plan type and expiry date
- Timing-safe comparison is used to prevent timing attacks

### Network Security

- The Docker Compose setup isolates services on an internal network
- Only the app container's port is exposed to the host
- Database and Redis are not directly accessible from outside Docker
- In production, bind the app port to `127.0.0.1` and use a reverse proxy

### Data Security

- All data is stored locally -- MangoLab does not phone home or send telemetry
- No data leaves the server unless you configure external notification channels
- Database credentials should use strong passwords
- The `.env` file should not be committed to version control

## Next Steps

- [Configuration](configuration.md) -- Configure all components
- [Deployment](deployment.md) -- Production deployment
- [API Reference](api-reference.md) -- Full API documentation
