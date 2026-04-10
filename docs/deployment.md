# Deployment

This guide covers deploying MangoLab in production with HTTPS, reverse proxies, backups, and updates.

## Docker Compose Production Setup

The default `docker-compose.yml` is suitable for production. For a hardened setup, consider these additions:

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only (proxy handles external traffic)
    environment:
      - DATABASE_URL=postgresql://mangolab:${POSTGRES_PASSWORD}@db:5432/mangolab
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - LICENSE_SECRET=${LICENSE_SECRET}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=mangolab
      - POSTGRES_USER=mangolab
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mangolab"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Key differences from development:
- Port binding restricted to `127.0.0.1` (reverse proxy handles external access)
- Resource limits set for each container
- Redis memory limit configured with eviction policy

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name mangolab.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mangolab.example.com;

    ssl_certificate /etc/letsencrypt/live/mangolab.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mangolab.example.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Traefik

Add these labels to the `app` service in `docker-compose.yml`:

```yaml
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mangolab.rule=Host(`mangolab.example.com`)"
      - "traefik.http.routers.mangolab.entrypoints=websecure"
      - "traefik.http.routers.mangolab.tls.certresolver=letsencrypt"
      - "traefik.http.services.mangolab.loadbalancer.server.port=3000"
    networks:
      - traefik
      - default

networks:
  traefik:
    external: true
```

Remove the `ports` mapping since Traefik handles routing directly.

### Caddy

```
mangolab.example.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically obtains and renews SSL certificates via Let's Encrypt.

## HTTPS / SSL Setup

### Using Let's Encrypt with Certbot (for Nginx)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d mangolab.example.com

# Auto-renewal is configured automatically
# Verify with:
sudo certbot renew --dry-run
```

### Using Let's Encrypt with Traefik

Add to your Traefik static configuration:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

## Custom Domain Configuration

1. **Set up DNS**: Create an A record pointing `mangolab.example.com` to your server's IP address.

2. **Update NEXTAUTH_URL**: Set it to your custom domain in `.env`:

   ```env
   NEXTAUTH_URL=https://mangolab.example.com
   ```

3. **Configure reverse proxy**: Use one of the configurations above.

4. **Restart MangoLab**:

   ```bash
   docker compose down && docker compose up -d
   ```

## Updating MangoLab

To update to the latest version:

```bash
# Pull the latest images
docker compose pull

# Rebuild if using a local build
docker compose build --no-cache

# Restart with the new version
docker compose up -d
```

Database migrations run automatically on startup. If a migration fails, check the logs:

```bash
docker compose logs app
```

### Rollback

If an update causes issues:

```bash
# Stop the current version
docker compose down

# Check out the previous version
git checkout v1.x.x

# Rebuild and start
docker compose build
docker compose up -d
```

## Backup and Restore

### Database Backup

```bash
# Create a SQL dump
docker compose exec db pg_dump -U mangolab mangolab > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose exec db pg_dump -U mangolab mangolab | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore

```bash
# Restore from SQL dump
docker compose exec -T db psql -U mangolab mangolab < backup_20260115_103000.sql

# Restore from compressed backup
gunzip -c backup_20260115_103000.sql.gz | docker compose exec -T db psql -U mangolab mangolab
```

### Redis Data Backup

```bash
# Trigger a Redis save
docker compose exec redis redis-cli BGSAVE

# Copy the dump file
docker cp $(docker compose ps -q redis):/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

### Full Backup Script

```bash
#!/bin/bash
# backup-mangolab.sh -- Full backup of MangoLab data

set -euo pipefail

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up MangoLab..."

# 1. Database
echo "  Backing up PostgreSQL..."
docker compose exec -T db pg_dump -U mangolab mangolab | gzip > "$BACKUP_DIR/postgres.sql.gz"

# 2. Redis
echo "  Backing up Redis..."
docker compose exec redis redis-cli BGSAVE
sleep 2
docker cp "$(docker compose ps -q redis):/data/dump.rdb" "$BACKUP_DIR/redis.rdb"

# 3. Environment file
echo "  Backing up .env..."
cp .env "$BACKUP_DIR/env.backup"

# 4. Clean up old backups (keep last 30 days)
find ./backups -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;

echo "Backup complete: $BACKUP_DIR"
echo "  postgres.sql.gz: $(du -h "$BACKUP_DIR/postgres.sql.gz" | cut -f1)"
echo "  redis.rdb: $(du -h "$BACKUP_DIR/redis.rdb" | cut -f1)"
```

Schedule with cron:

```cron
# Daily backup at 2 AM
0 2 * * * /path/to/mangolab/backup-mangolab.sh >> /var/log/mangolab-backup.log 2>&1
```

## Monitoring MangoLab Itself

Use the health endpoint to monitor MangoLab from an external monitoring tool (e.g., UptimeRobot, Healthchecks.io):

```
GET https://mangolab.example.com/api/health
```

- Returns `200` when healthy, `503` when degraded
- Checks both database and Redis connectivity
- No authentication required

You can also add MangoLab as a service within itself for uptime tracking.

## Resource Requirements at Scale

| Services | Recommended RAM | Recommended CPU | Estimated DB Size (30 days) |
|---|---|---|---|
| 1-10 | 1 GB | 1 core | < 100 MB |
| 10-25 | 2 GB | 2 cores | 100-500 MB |
| 25-50 | 4 GB | 2 cores | 500 MB - 1 GB |
| 50-100 | 8 GB | 4 cores | 1-5 GB |

Factors that increase resource usage:
- Shorter check intervals (more uptime check data)
- High log ingestion volume
- High metric ingestion volume
- Many concurrent dashboard users

## Multi-Instance Considerations

MangoLab is designed to run as a single instance. If you need high availability:

- **Database**: Use a managed PostgreSQL service with built-in replication (or set up PostgreSQL streaming replication)
- **Redis**: Use Redis Sentinel or a managed Redis service
- **Application**: Running multiple app instances is not officially supported, as background workers (uptime checks, alert evaluation) may produce duplicate work. If needed, consider running one instance for the web UI and one for background processing.

## Next Steps

- [Configuration](configuration.md) -- All environment variables
- [Troubleshooting](troubleshooting.md) -- Common issues and solutions
- [Architecture](architecture.md) -- Technical overview
