# MangoLab

**Your homelab, fully under control.**

MangoLab is a self-hosted homelab tracker that monitors services, collects logs and metrics, tracks uptime, and alerts you when things go wrong. Built with Next.js 14, PostgreSQL, and Redis -- designed to run entirely on your own hardware with zero external dependencies.

![MangoLab Dashboard](docs/screenshots/dashboard.png)

---

## Features

- **Service Monitoring** -- Track HTTP, HTTPS, TCP, PING, DNS, and custom services with configurable check intervals, timeouts, and expected responses
- **Uptime Tracking** -- Continuous availability monitoring with uptime percentages, response time graphs, and incident detection
- **Log Management** -- Centralized log collection via REST API with real-time viewer, filtering, full-text search, and live tailing mode
- **Metrics Ingestion** -- Push custom numeric metrics (CPU, memory, disk, request counts) and visualize them with interactive charts
- **Alerting** -- Alert rules for service downtime, slow responses, error rates, log patterns, and metric thresholds with email, webhook, Discord, and Slack notifications
- **Customizable Dashboard** -- Drag-and-drop widgets (12 types) in multiple sizes with saveable layouts
- **Node Tracking** -- Map services to physical servers, VMs, containers, and cloud instances
- **SSL Monitoring** -- Automatic certificate expiry tracking for HTTPS services
- **License System** -- Free tier for small homelabs, PRO tier for power users with self-hostable license key generation
- **Privacy First** -- No telemetry, no phone-home, all data stays on your server

![MangoLab Services](docs/screenshots/services.png)

![MangoLab Logs](docs/screenshots/logs.png)

---

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/your-org/mangolab.git
cd mangolab
cp .env.example .env
```

### 2. Generate secrets and update .env

```bash
openssl rand -base64 32  # Use output for NEXTAUTH_SECRET
openssl rand -base64 32  # Use output for LICENSE_SECRET
# Edit .env with your values
```

### 3. Start everything

```bash
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and follow the setup wizard to create your admin account.

Verify the installation:

```bash
curl http://localhost:3000/api/health
# {"data":{"status":"ok","db":"ok","redis":"ok","version":"1.0.0"}}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://mangolab:changeme@localhost:5432/mangolab` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Yes | `changeme` | PostgreSQL password (used in docker-compose) |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string |
| `NEXTAUTH_SECRET` | **Yes** | -- | Secret for session encryption (min 32 chars). Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Public URL of the app (must match browser URL) |
| `LICENSE_SECRET` | Yes | `default-license-secret` | Secret for license key generation/validation |
| `PORT` | No | `3000` | Port the app listens on |
| `NODE_ENV` | No | `production` | Node environment |

---

## Free vs PRO

| Feature | Free | PRO |
|---|---|---|
| **Services** | 5 | 100 |
| **Alerts** | 3 | 50 |
| **Nodes** | 1 | 20 |
| **Log retention** | 3 days | 90 days |
| **Uptime retention** | 7 days | 365 days |
| **Min ping interval** | 60s | 10s |
| **Log ingestion rate** | 100/min | 10,000/min |
| **Dashboard widgets** | 6 | 50 |
| Multiple dashboards | -- | Yes |
| Advanced analytics | -- | Yes |
| Custom widgets | -- | Yes |
| API access | -- | Yes |
| Webhook alerts | -- | Yes |
| Discord alerts | -- | Yes |
| Slack alerts | -- | Yes |
| Data export | -- | Yes |
| Node tracking | -- | Yes |
| Metric ingestion | -- | Yes |
| Custom ping headers | -- | Yes |
| TCP monitoring | -- | Yes |
| DNS monitoring | -- | Yes |

---

## Generate a License Key

MangoLab runs on the FREE plan by default. To unlock PRO features, generate a license key:

```bash
# Generate a PRO key (no expiration)
npx ts-node scripts/generate-license.ts --plan PRO

# Generate a PRO key with expiration
npx ts-node scripts/generate-license.ts --plan PRO --expires 2027-12-31

# Generate a LIFETIME key
npx ts-node scripts/generate-license.ts --plan LIFETIME
```

Enter the generated key at **Settings > License** in the app.

> **Note:** The `LICENSE_SECRET` in `.env` must match between key generation and your running instance.

---

## Log Ingestion

Send logs to MangoLab via the REST API:

```bash
curl -X POST http://localhost:3000/api/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: <your-service-id>" \
  -d '[
    {"level": "INFO", "message": "Application started", "source": "app"},
    {"level": "ERROR", "message": "Connection timeout", "source": "db"}
  ]'
```

---

## Metric Ingestion (PRO)

Send metrics to MangoLab via the REST API:

```bash
curl -X POST http://localhost:3000/api/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: <your-service-id>" \
  -d '{
    "serviceId": "<your-service-id>",
    "metrics": [
      {"name": "cpu_usage", "value": 45.2, "unit": "percent"},
      {"name": "memory_usage", "value": 72.8, "unit": "percent"}
    ]
  }'
```

---

## Backup

```bash
# Backup PostgreSQL
docker compose exec db pg_dump -U mangolab mangolab > backup.sql

# Restore PostgreSQL
docker compose exec -T db psql -U mangolab mangolab < backup.sql
```

---

## Documentation

Full documentation is available in the [`docs/`](docs/) directory:

- [Getting Started](docs/getting-started.md) -- Installation and first-run setup
- [Configuration](docs/configuration.md) -- All environment variables and settings
- [Services](docs/services.md) -- Adding and managing monitored services
- [Uptime Monitoring](docs/uptime-monitoring.md) -- How uptime tracking works
- [Log Management](docs/log-management.md) -- Log collection and the ingestion API
- [Metrics](docs/metrics.md) -- Custom metric ingestion and visualization
- [Alerts](docs/alerts.md) -- Alert rules and notification channels
- [Dashboard](docs/dashboard.md) -- Widget types and layout customization
- [Nodes](docs/nodes.md) -- Infrastructure node tracking (PRO)
- [Licensing](docs/licensing.md) -- Free vs PRO and license key management
- [API Reference](docs/api-reference.md) -- Complete REST API documentation
- [Deployment](docs/deployment.md) -- Production deployment with reverse proxy and HTTPS
- [Troubleshooting](docs/troubleshooting.md) -- Common issues and solutions
- [Architecture](docs/architecture.md) -- Technical design overview

---

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Validation**: Zod
- **Deployment**: Docker + Docker Compose

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with a descriptive message
6. Push to your fork and open a Pull Request

For bug reports and feature requests, please use [GitHub Issues](https://github.com/your-org/mangolab/issues).

---

## Troubleshooting

**App won't start / health check fails:**
- Check logs: `docker compose logs app`
- Ensure `NEXTAUTH_SECRET` is set and at least 32 characters
- Ensure PostgreSQL and Redis are healthy: `docker compose ps`

**Database connection errors:**
- Verify `DATABASE_URL` matches your PostgreSQL credentials
- Check if the database is ready: `docker compose logs db`

**License key invalid:**
- Ensure `LICENSE_SECRET` in `.env` matches the secret used when the key was generated
- Regenerate a key with the current secret

**Redis connection errors:**
- Verify `REDIS_URL` is correct
- Check Redis status: `docker compose logs redis`

For more, see the full [Troubleshooting Guide](docs/troubleshooting.md).

---

## License

MIT
