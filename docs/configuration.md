# Configuration

MangoLab is configured through environment variables defined in the `.env` file. This guide covers every available option.

## Environment Variables Reference

### Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://mangolab:changeme@localhost:5432/mangolab` | Full PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Yes | `changeme` | PostgreSQL password (used by the `db` container in Docker Compose) |

**Connection string format:**

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Using an external database:**

If you already have a PostgreSQL 16+ instance, set `DATABASE_URL` to point to it and remove the `db` service from `docker-compose.yml`:

```env
DATABASE_URL=postgresql://myuser:mypass@db.example.com:5432/mangolab
```

Requirements for external databases:
- PostgreSQL 16 or higher
- A dedicated database (e.g., `mangolab`)
- A user with full privileges on that database
- Network connectivity from the MangoLab container

**Custom port:**

```env
DATABASE_URL=postgresql://mangolab:changeme@db:5433/mangolab
```

### Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string |

**Connection string format:**

```
redis://[:PASSWORD@]HOST:PORT[/DB_NUMBER]
```

**Using an external Redis:**

```env
REDIS_URL=redis://:myredispassword@redis.example.com:6379/0
```

**Redis Sentinel support:**

For high-availability Redis setups, provide a Sentinel connection string:

```env
REDIS_URL=redis+sentinel://sentinel1:26379,sentinel2:26379/mymaster/0
```

Redis is used for:
- License validation caching (1-hour TTL)
- Rate limiting (log ingestion)
- Session data (optional)

MangoLab will continue to function if Redis is temporarily unavailable, but caching and rate limiting will be bypassed.

### Authentication

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXTAUTH_SECRET` | **Yes** | -- | Secret key for encrypting sessions. Must be at least 32 characters. |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | The canonical URL of your MangoLab instance. Must match the URL users access in their browser. |

**Generating a secret:**

```bash
openssl rand -base64 32
```

**Reverse proxy configuration:**

When running behind a reverse proxy (Nginx, Traefik, Caddy), set `NEXTAUTH_URL` to the external URL:

```env
NEXTAUTH_URL=https://mangolab.example.com
```

> **Important:** If `NEXTAUTH_URL` does not match the URL in the browser, authentication will fail with redirect errors.

### Application

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Port the application listens on inside the container. The Docker Compose file maps this to the host. |
| `NODE_ENV` | No | `production` | Node.js environment. Always use `production` for deployed instances. |

## Docker Volume Mounts

The default `docker-compose.yml` defines two named volumes:

| Volume | Container Path | Purpose |
|---|---|---|
| `postgres_data` | `/var/lib/postgresql/data` | PostgreSQL database files |
| `redis_data` | `/data` | Redis persistence (RDB/AOF) |

To use bind mounts instead (useful for easier backups):

```yaml
volumes:
  - ./data/postgres:/var/lib/postgresql/data
  - ./data/redis:/data
```

## Memory and Resource Tuning

### Minimum resources

| Container | Min RAM | Min CPU |
|---|---|---|
| `app` | 256 MB | 0.5 cores |
| `db` | 256 MB | 0.25 cores |
| `redis` | 64 MB | 0.1 cores |

### Setting resource limits in Docker Compose

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'
```

### PostgreSQL tuning

For larger installations, you can pass PostgreSQL configuration via the `db` service:

```yaml
db:
  image: postgres:16-alpine
  command: >
    postgres
    -c shared_buffers=256MB
    -c effective_cache_size=512MB
    -c work_mem=16MB
    -c maintenance_work_mem=128MB
```

### Redis tuning

For Redis memory limits:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

## Full .env Example

```env
# ── Database
DATABASE_URL=postgresql://mangolab:a-strong-password@db:5432/mangolab
POSTGRES_PASSWORD=a-strong-password

# ── Redis
REDIS_URL=redis://redis:6379

# ── Auth
NEXTAUTH_SECRET=Gx9k3mF7pQw2tR5vY8zA1cE4hJ6nB0dL
NEXTAUTH_URL=https://mangolab.example.com

# ── App
PORT=3000
NODE_ENV=production
```

## Next Steps

- [Getting Started](getting-started.md) -- Installation walkthrough
- [Deployment](deployment.md) -- Production deployment with reverse proxy and HTTPS
- [Services](services.md) -- Adding services to monitor
