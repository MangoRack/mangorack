# Getting Started

This guide walks you through installing and running MangoLab for the first time.

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| **Docker** | v20.10+ | Latest stable |
| **Docker Compose** | v2.0+ | Latest stable |
| **RAM** | 1 GB | 2 GB+ |
| **Disk** | 1 GB | 10 GB+ (depends on log/metric volume) |
| **CPU** | 1 core | 2+ cores |
| **OS** | Any Docker-supported OS | Linux (Debian/Ubuntu) |

MangoLab runs entirely in Docker containers. You do not need Node.js, PostgreSQL, or Redis installed on your host machine.

## Quick Start

### Step 1: Clone and Configure

```bash
git clone https://github.com/your-org/mangolab.git
cd mangolab
cp .env.example .env
```

### Step 2: Generate Secrets

Generate a random secret and add it to your `.env` file:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

Open `.env` in your editor and replace the placeholder values:

```env
NEXTAUTH_SECRET=<paste generated secret>
POSTGRES_PASSWORD=<choose a strong database password>
```

> **Important:** `NEXTAUTH_SECRET` must be at least 32 characters long. It is used to encrypt user sessions.

### Step 3: Start MangoLab

```bash
docker compose up -d
```

Docker will pull the required images (PostgreSQL 16, Redis 7, and the MangoLab app), run database migrations automatically, and start all services.

Wait about 30-60 seconds for everything to initialize, then open [http://localhost:3000](http://localhost:3000).

## First-Run Setup Wizard

On the very first launch, MangoLab redirects you to the setup wizard at `/setup`. The wizard guides you through:

1. **Create Admin Account** -- Enter your email address, display name, and a strong password. This will be the primary administrator account.
2. **Configure Basics** -- Choose your default theme (light, dark, or system) and preferred time range for dashboards.
3. **Add Your First Service (Optional)** -- You can add a service to monitor right away, or skip this step and do it later from the dashboard.
4. **Activate License (Optional)** -- If you have a PRO or LIFETIME license key, enter it here. You can also skip this and activate later from Settings.

After completing the wizard, you will be redirected to the main dashboard.

## Verifying the Installation

Check that MangoLab is running correctly by hitting the health endpoint:

```bash
curl http://localhost:3000/api/health
```

A healthy response looks like:

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

If the status is `"degraded"`, check which component (`db` or `redis`) is reporting `"error"` and review the corresponding container logs.

You can also check container health directly:

```bash
docker compose ps
```

All three containers (`app`, `db`, `redis`) should show `healthy` status.

## Common First-Run Issues

### Container keeps restarting

```bash
docker compose logs app
```

**Common causes:**
- `NEXTAUTH_SECRET` is not set or is too short (minimum 32 characters)
- Database is not ready yet -- wait 30 seconds and check again
- Port 3000 is already in use -- change the `PORT` variable in `.env`

### "Setup already completed" error

If you see this message when trying to access `/setup`, it means an admin account already exists. Log in with your admin credentials instead. If you have forgotten your password, see the [Troubleshooting Guide](troubleshooting.md#how-to-reset-admin-password).

### Database migration errors

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# Run migrations manually
docker compose exec app npx prisma migrate deploy
```

### Cannot connect on port 3000

- Verify the port mapping: `docker compose ps`
- Check if a firewall is blocking port 3000
- If running on a remote server, use the server's IP address instead of `localhost`
- If you changed the `PORT` variable, use that port instead

### Health check shows "degraded"

- Check database: `docker compose logs db`
- Check Redis: `docker compose logs redis`
- Verify both containers are running: `docker compose ps`

## Next Steps

- [Configuration](configuration.md) -- Fine-tune all environment variables and settings
- [Services](services.md) -- Add your first services to monitor
- [Deployment](deployment.md) -- Set up for production with HTTPS and reverse proxy
