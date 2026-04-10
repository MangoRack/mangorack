# Troubleshooting

This guide covers common issues and their solutions.

## Container Won't Start

### Check the logs

```bash
docker compose logs app
docker compose logs db
docker compose logs redis
```

### Common causes

**Missing or invalid NEXTAUTH_SECRET:**

```
Error: NEXTAUTH_SECRET must be at least 32 characters
```

Solution: Set a valid secret in `.env`:

```bash
openssl rand -base64 32
# Copy the output to NEXTAUTH_SECRET in .env
```

**Port already in use:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

Solution: Change the PORT in `.env` or stop the conflicting process:

```bash
# Find what is using port 3000
lsof -i :3000
# Or change the port
echo "PORT=3001" >> .env
docker compose up -d
```

**Database not ready:**

The app may start before PostgreSQL finishes initializing. The health check and `depends_on` condition should handle this, but if it persists:

```bash
docker compose restart app
```

**Insufficient memory:**

If the container is being OOM-killed, check resource usage:

```bash
docker stats
```

Increase the memory limit or allocate more RAM to Docker.

## Database Connection Errors

```
Error: Can't reach database server at `db:5432`
```

### Checklist

1. **Is the database container running?**

   ```bash
   docker compose ps db
   ```

2. **Is the database healthy?**

   ```bash
   docker compose exec db pg_isready -U mangolab
   ```

3. **Does DATABASE_URL match the credentials?**

   The `DATABASE_URL` in the app environment must match the `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` for the db service.

4. **Can the app reach the database?**

   ```bash
   docker compose exec app sh -c "nc -zv db 5432"
   ```

5. **Check database logs:**

   ```bash
   docker compose logs db
   ```

### Fixing a corrupted database

If the database is corrupted (rare):

```bash
# Stop everything
docker compose down

# Remove the database volume (WARNING: deletes all data)
docker volume rm mangolab_postgres_data

# Restart (creates a fresh database)
docker compose up -d
```

## Redis Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

### Checklist

1. **Is Redis running?**

   ```bash
   docker compose ps redis
   ```

2. **Can you ping Redis?**

   ```bash
   docker compose exec redis redis-cli ping
   # Should return: PONG
   ```

3. **Is REDIS_URL correct?**

   Inside Docker Compose, the hostname should be `redis`, not `localhost`:

   ```env
   REDIS_URL=redis://redis:6379
   ```

4. **Check Redis logs:**

   ```bash
   docker compose logs redis
   ```

MangoLab will continue to function without Redis, but caching and rate limiting will be disabled.

## Authentication Issues

### "Invalid credentials" when logging in

- Verify you are using the correct email and password
- Passwords are case-sensitive
- If you forgot your password, see "How to reset admin password" below

### Redirect loop or "CSRF token mismatch"

This usually means `NEXTAUTH_URL` does not match the URL in your browser:

```env
# If you access MangoLab at https://mangolab.example.com:
NEXTAUTH_URL=https://mangolab.example.com

# If you access it at http://192.168.1.100:3000:
NEXTAUTH_URL=http://192.168.1.100:3000
```

After changing `NEXTAUTH_URL`, restart the app:

```bash
docker compose restart app
```

### Session expires too quickly

Sessions are managed by NextAuth.js. If sessions expire unexpectedly, ensure `NEXTAUTH_SECRET` has not changed. Changing the secret invalidates all existing sessions.

## "Setup Already Completed" Error

This message appears when navigating to `/setup` after an admin account already exists. This is expected behavior.

If you need to re-run setup:

```bash
# Connect to the database
docker compose exec db psql -U mangolab mangolab

# Delete the existing user(s)
DELETE FROM "Session" WHERE 1=1;
DELETE FROM "UserSettings" WHERE 1=1;
DELETE FROM "User" WHERE 1=1;

# Exit psql
\q
```

Restart the app and navigate to `/setup` again.

## Services Showing UNKNOWN Status

A service shows `UNKNOWN` when it has never been checked. This happens when:

- The service was just created
- Ping monitoring is disabled (`pingEnabled: false`)
- The background worker has not run yet

**Solution:**

- Wait for the first check interval to elapse (default: 60 seconds)
- Verify that `pingEnabled` is `true` for the service
- Check the app logs for worker errors: `docker compose logs app | grep -i worker`

## Logs Not Appearing

### Logs sent via the API are not showing up

1. **Check the API response**: Ensure you are getting a `201` response with `"ingested": N`
2. **Verify the service token**: The `X-Service-Token` must be a valid, active service ID
3. **Check rate limiting**: Free tier is limited to 100 entries/min per service
4. **Verify the request format**: The body must be a JSON array of log objects

### System logs (from uptime checks) are missing

- Ensure services have `pingEnabled: true`
- Check that the background worker is running: `docker compose logs app | grep -i uptime`

### Logs disappearing after a few days

This is expected. Log retention is 3 days on the free tier and 90 days on PRO. Logs older than the retention period are automatically deleted.

## Alerts Not Firing

1. **Is the alert enabled?** Check that `isEnabled` is `true`

2. **Is the alert in cooldown?** After firing, alerts will not fire again until the cooldown period elapses (default: 15 minutes)

3. **Is the condition being met?** Review the alert condition and compare it to the actual data:
   - For SERVICE_DOWN: Are enough checks failing within the window?
   - For METRIC_THRESHOLD: Is the metric actually crossing the threshold?

4. **Are notification channels configured?** Go to **Settings > Notifications** and verify your email, webhook, or Discord/Slack URLs

5. **Check the alert event history**: Navigate to the alert detail page to see if events are being created (even if notifications are failing)

## High Memory Usage

### App container using too much memory

- Set memory limits in `docker-compose.yml`:

  ```yaml
  deploy:
    resources:
      limits:
        memory: 512M
  ```

- Reduce the number of concurrent connections by lowering the check frequency

### Database using too much memory

- Tune PostgreSQL settings:

  ```yaml
  db:
    command: postgres -c shared_buffers=128MB -c effective_cache_size=256MB
  ```

- Check for large tables: `docker compose exec db psql -U mangolab mangolab -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;"`

### Redis using too much memory

- Set a memory limit:

  ```yaml
  redis:
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
  ```

## Slow Dashboard Performance

- **Reduce widget count**: Each widget makes API calls. Free tier is limited to 6 widgets for this reason.
- **Use shorter time ranges**: Querying 90 days of data is slower than 24 hours.
- **Check database performance**: Run `VACUUM ANALYZE` on large tables:

  ```bash
  docker compose exec db psql -U mangolab mangolab -c "VACUUM ANALYZE;"
  ```

- **Check Redis**: Ensure Redis is running -- it caches expensive queries.

## Docker Health Check Failing

```
container mangolab-app is unhealthy
```

The health check calls `curl -f http://localhost:3000/api/health` inside the container.

**Common causes:**

1. The app is still starting (wait for `start_period: 40s` to elapse)
2. The database or Redis is down (check with `docker compose ps`)
3. The app crashed (check logs: `docker compose logs app --tail 50`)

**Increase health check tolerance:**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 60s
  timeout: 15s
  retries: 5
  start_period: 60s
```

## How to Reset Admin Password

If you have forgotten the admin password, update it directly in the database:

```bash
# Generate a new bcrypt hash
docker compose exec app node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword123', 12).then(h => console.log(h))"

# Update the password in the database
docker compose exec db psql -U mangolab mangolab -c \
  "UPDATE \"User\" SET \"passwordHash\" = '\$2a\$12\$...' WHERE email = 'admin@mangolab.local';"
```

Replace `\$2a\$12\$...` with the actual hash output from the first command, and `admin@mangolab.local` with the admin email.

Then restart the app:

```bash
docker compose restart app
```

## How to Completely Reset the Installation

> **Warning:** This deletes ALL data including services, logs, metrics, alerts, and user accounts.

```bash
# Stop all containers
docker compose down

# Remove all data volumes
docker volume rm mangolab_postgres_data mangolab_redis_data

# Restart (fresh installation)
docker compose up -d
```

Navigate to `http://localhost:3000` and you will see the setup wizard again.

## Getting Support

If you cannot resolve an issue with this guide:

1. **Check existing issues**: Search the [GitHub Issues](https://github.com/your-org/mangolab/issues) for similar problems
2. **File a new issue**: Include:
   - MangoLab version (`/api/health` response)
   - Docker and Docker Compose versions
   - Relevant log output (`docker compose logs app --tail 100`)
   - Steps to reproduce the issue
   - Your `.env` file (with secrets redacted)
3. **Community**: Join the discussions on GitHub

## Next Steps

- [Configuration](configuration.md) -- Review all configuration options
- [Deployment](deployment.md) -- Production deployment best practices
- [Architecture](architecture.md) -- Understanding MangoLab internals
