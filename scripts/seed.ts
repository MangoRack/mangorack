import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding MangoLab database...")

  // 1. Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12)
  const user = await prisma.user.upsert({
    where: { email: "admin@mangolab.local" },
    update: {},
    create: {
      email: "admin@mangolab.local",
      name: "Admin",
      passwordHash,
      settings: {
        create: {
          theme: "system",
          defaultTimeRange: "24h",
          notifyOnDown: true,
          notifyOnRecover: true,
        },
      },
    },
  })
  console.log(`  Created user: ${user.email}`)

  // 2. Create a node
  const node = await prisma.node.upsert({
    where: { id: "seed-node-1" },
    update: {},
    create: {
      id: "seed-node-1",
      name: "homelab-01",
      description: "Primary homelab server",
      type: "PHYSICAL",
      hostname: "homelab-01.local",
      ipAddress: "192.168.1.100",
      os: "Debian 12",
      cpu: "Intel i7-12700K",
      ram: "64 GB DDR5",
      storage: "2 TB NVMe",
      tags: ["primary", "production"],
      isActive: true,
    },
  })
  console.log(`  Created node: ${node.name}`)

  // 3. Create demo services
  const services = [
    {
      id: "seed-svc-nginx",
      name: "Nginx",
      description: "Reverse proxy and web server",
      url: "https://nginx.homelab.local",
      type: "HTTPS" as const,
      category: "Infrastructure",
      tags: ["proxy", "web"],
      port: 443,
      icon: "globe",
      color: "#009639",
      currentStatus: "UP" as const,
      pingInterval: 30,
      nodeId: node.id,
    },
    {
      id: "seed-svc-postgres",
      name: "PostgreSQL",
      description: "Primary database server",
      url: "tcp://db.homelab.local:5432",
      type: "TCP" as const,
      category: "Database",
      tags: ["database", "sql"],
      port: 5432,
      icon: "database",
      color: "#336791",
      currentStatus: "UP" as const,
      pingInterval: 60,
      nodeId: node.id,
    },
    {
      id: "seed-svc-redis",
      name: "Redis",
      description: "In-memory cache and message broker",
      url: "tcp://redis.homelab.local:6379",
      type: "TCP" as const,
      category: "Database",
      tags: ["cache", "redis"],
      port: 6379,
      icon: "zap",
      color: "#DC382D",
      currentStatus: "UP" as const,
      pingInterval: 30,
      nodeId: node.id,
    },
    {
      id: "seed-svc-grafana",
      name: "Grafana",
      description: "Monitoring and observability dashboards",
      url: "http://grafana.homelab.local:3000",
      type: "HTTP" as const,
      category: "Monitoring",
      tags: ["monitoring", "dashboards"],
      port: 3000,
      icon: "bar-chart",
      color: "#F46800",
      currentStatus: "DEGRADED" as const,
      pingInterval: 60,
      nodeId: node.id,
    },
    {
      id: "seed-svc-nextcloud",
      name: "Nextcloud",
      description: "Self-hosted cloud storage",
      url: "https://cloud.homelab.local",
      type: "HTTPS" as const,
      category: "Applications",
      tags: ["storage", "cloud"],
      port: 443,
      icon: "cloud",
      color: "#0082C9",
      currentStatus: "UP" as const,
      pingInterval: 60,
      nodeId: node.id,
    },
    {
      id: "seed-svc-homeassistant",
      name: "Home Assistant",
      description: "Home automation platform",
      url: "http://ha.homelab.local:8123",
      type: "HTTP" as const,
      category: "Applications",
      tags: ["automation", "iot"],
      port: 8123,
      icon: "home",
      color: "#18BCF2",
      currentStatus: "DOWN" as const,
      pingInterval: 30,
      nodeId: node.id,
    },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: {
        ...svc,
        isActive: true,
        isPinned: false,
        pingEnabled: true,
        pingTimeout: 10,
        expectedStatus: 200,
        pingMethod: "GET",
        lastCheckedAt: new Date(),
        lastUpAt: svc.currentStatus === "UP" ? new Date() : null,
        lastDownAt: svc.currentStatus === "DOWN" ? new Date() : null,
      },
    })
    console.log(`  Created service: ${svc.name} (${svc.currentStatus})`)
  }

  // 4. Create uptime checks for each service
  const now = new Date()
  for (const svc of services) {
    const checks = []
    for (let i = 0; i < 24; i++) {
      const checkedAt = new Date(now.getTime() - i * 60 * 60 * 1000) // hourly for past 24h
      const isUp = svc.currentStatus !== "DOWN" || i > 2 // DOWN services were up until 2 hours ago
      checks.push({
        serviceId: svc.id,
        status: isUp
          ? ("UP" as const)
          : ("DOWN" as const),
        responseTime: isUp ? Math.floor(Math.random() * 200) + 20 : null,
        statusCode: isUp
          ? svc.type === "TCP"
            ? null
            : 200
          : null,
        error: isUp ? null : "Connection refused",
        checkedAt,
      })
    }
    await prisma.uptimeCheck.createMany({ data: checks })
  }
  console.log("  Created uptime checks (24 per service)")

  // 5. Create log entries
  const logEntries = [
    {
      serviceId: "seed-svc-nginx",
      level: "INFO" as const,
      message: "Nginx started successfully on port 443",
      source: "nginx",
      metadata: { pid: 1234 },
      timestamp: new Date(now.getTime() - 3600000),
    },
    {
      serviceId: "seed-svc-nginx",
      level: "WARN" as const,
      message: "SSL certificate expires in 14 days",
      source: "nginx",
      metadata: { domain: "homelab.local" },
      timestamp: new Date(now.getTime() - 1800000),
    },
    {
      serviceId: "seed-svc-postgres",
      level: "INFO" as const,
      message: "Database system is ready to accept connections",
      source: "postgresql",
      metadata: { version: "16.2" },
      timestamp: new Date(now.getTime() - 7200000),
    },
    {
      serviceId: "seed-svc-postgres",
      level: "INFO" as const,
      message: "Automatic vacuum completed on public.uptime_checks",
      source: "postgresql",
      metadata: { table: "uptime_checks", rows_removed: 1523 },
      timestamp: new Date(now.getTime() - 600000),
    },
    {
      serviceId: "seed-svc-redis",
      level: "INFO" as const,
      message: "Redis is starting oO0OoO0OoO0Oo",
      source: "redis-server",
      metadata: { version: "7.2.4" },
      timestamp: new Date(now.getTime() - 5400000),
    },
    {
      serviceId: "seed-svc-grafana",
      level: "WARN" as const,
      message: "High memory usage detected: 89% of available memory",
      source: "grafana",
      metadata: { memUsedMB: 1820, memTotalMB: 2048 },
      timestamp: new Date(now.getTime() - 900000),
    },
    {
      serviceId: "seed-svc-grafana",
      level: "ERROR" as const,
      message: "Failed to connect to datasource: prometheus timeout after 30s",
      source: "grafana",
      metadata: { datasource: "prometheus", timeout: 30 },
      timestamp: new Date(now.getTime() - 300000),
    },
    {
      serviceId: "seed-svc-nextcloud",
      level: "INFO" as const,
      message: "Cron job finished successfully",
      source: "nextcloud",
      metadata: { duration: "12s" },
      timestamp: new Date(now.getTime() - 2400000),
    },
    {
      serviceId: "seed-svc-homeassistant",
      level: "ERROR" as const,
      message: "Failed to start: port 8123 already in use",
      source: "homeassistant",
      metadata: { port: 8123 },
      timestamp: new Date(now.getTime() - 7200000),
    },
    {
      serviceId: "seed-svc-homeassistant",
      level: "FATAL" as const,
      message: "Service crashed: unable to bind to port",
      source: "homeassistant",
      metadata: { exitCode: 1 },
      timestamp: new Date(now.getTime() - 7100000),
    },
    {
      serviceId: null,
      level: "INFO" as const,
      message: "MangoLab started on port 3000",
      source: "mangolab",
      metadata: { version: "1.0.0" },
      timestamp: new Date(now.getTime() - 86400000),
    },
    {
      serviceId: null,
      level: "INFO" as const,
      message: "Database migrations applied successfully",
      source: "mangolab",
      metadata: { migrations: 3 },
      timestamp: new Date(now.getTime() - 86300000),
    },
  ]

  await prisma.logEntry.createMany({ data: logEntries })
  console.log(`  Created ${logEntries.length} log entries`)

  // 6. Create alerts
  const alerts = [
    {
      id: "seed-alert-1",
      name: "Home Assistant Down",
      serviceId: "seed-svc-homeassistant",
      type: "SERVICE_DOWN" as const,
      condition: { checkCount: 3, windowMinutes: 5 },
      severity: "CRITICAL" as const,
      isEnabled: true,
      cooldownMins: 15,
      lastFiredAt: new Date(now.getTime() - 7000000),
    },
    {
      id: "seed-alert-2",
      name: "Grafana High Memory",
      serviceId: "seed-svc-grafana",
      type: "METRIC_THRESHOLD" as const,
      condition: { metric: "memory_usage", operator: "gt", value: 85, unit: "percent" },
      severity: "WARNING" as const,
      isEnabled: true,
      cooldownMins: 30,
      lastFiredAt: new Date(now.getTime() - 900000),
    },
  ]

  for (const alert of alerts) {
    await prisma.alert.upsert({
      where: { id: alert.id },
      update: {},
      create: alert,
    })
    console.log(`  Created alert: ${alert.name}`)
  }

  // Create alert events
  await prisma.alertEvent.createMany({
    data: [
      {
        alertId: "seed-alert-1",
        message: "Home Assistant is DOWN - connection refused on port 8123",
        metadata: { responseTime: null, statusCode: null },
        firedAt: new Date(now.getTime() - 7000000),
        resolvedAt: null,
      },
      {
        alertId: "seed-alert-2",
        message: "Grafana memory usage at 89% (threshold: 85%)",
        metadata: { currentValue: 89, threshold: 85 },
        firedAt: new Date(now.getTime() - 900000),
        resolvedAt: null,
      },
    ],
  })
  console.log("  Created alert events")

  console.log("")
  console.log("Seed complete!")
  console.log("  Login: admin@mangolab.local / admin123")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
