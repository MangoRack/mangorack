# Services

Services are the core concept in MangoLab. A service represents anything you want to monitor -- a web application, database, API, network device, or any other infrastructure component.

## What is a Service

A service in MangoLab has:
- A **name** and optional description
- A **type** that determines how it is monitored (HTTP, HTTPS, TCP, PING, DNS, Custom)
- A **URL or hostname** used for uptime checks
- **Monitoring settings** like check interval, timeout, and expected response
- An optional **node** assignment (PRO feature)
- **Categories and tags** for organization
- Associated **logs**, **metrics**, and **alerts**

## Adding Your First Service

1. From the dashboard, click the **Add Service** button (or navigate to **Services > Add New**).
2. Fill in the required fields:
   - **Name**: A human-readable name (e.g., "Nginx Reverse Proxy")
   - **URL**: The endpoint to monitor (e.g., `https://nginx.homelab.local`)
   - **Type**: Select the service type (e.g., HTTPS)
3. Optionally configure:
   - **Description**: What this service does
   - **Category**: Group related services (e.g., "Infrastructure", "Database", "Applications")
   - **Tags**: Additional labels for filtering (e.g., "production", "critical")
   - **Port**: Override the default port for the service type
   - **Icon**: Choose an icon for the dashboard
   - **Color**: Pick a color for visual identification
4. Configure monitoring settings (see below).
5. Click **Save** to create the service.

MangoLab will immediately begin monitoring the service based on your configuration.

## Service Types

### HTTP

Monitors a service by making HTTP requests. Use this for web applications, APIs, and any service accessible via plain HTTP.

- Default port: 80
- Checks: Sends an HTTP request and validates the status code
- Best for: Internal web services, APIs without TLS

### HTTPS

Same as HTTP but uses a secure TLS connection. Additionally monitors SSL certificate validity.

- Default port: 443
- Checks: Sends an HTTPS request, validates status code, and checks certificate expiry
- Best for: Public-facing web services, APIs with TLS

### TCP

Monitors a service by establishing a TCP connection on a specified port. Does not send or expect any application-level data.

- Requires: Port number
- Checks: Attempts a TCP connection within the configured timeout
- Best for: Databases (PostgreSQL, MySQL, Redis), message brokers, custom TCP services
- **PRO feature**

### PING

Monitors a service by sending ICMP ping requests to a hostname or IP address.

- Checks: Sends ICMP echo requests and measures round-trip time
- Best for: Network devices, routers, switches, bare-metal servers

### DNS

Monitors a DNS record by performing a DNS lookup and validating the response.

- Checks: Performs a DNS query and validates the result
- Best for: DNS servers, verifying DNS records are resolving correctly
- **PRO feature**

### Custom

A flexible service type for anything that does not fit the standard types. Custom services can receive logs and metrics via the ingestion API but do not have automatic uptime checks.

- Checks: None (manual status updates or via API)
- Best for: Services monitored by external tools, batch jobs, scheduled tasks

## Configuring Monitoring

Each service has monitoring settings that control how uptime checks work:

| Setting | Default | Description |
|---|---|---|
| **Ping Enabled** | `true` | Whether automatic monitoring is active |
| **Ping Interval** | `60` seconds | How often to check the service (Free: min 60s, PRO: min 10s) |
| **Ping Timeout** | `10` seconds | How long to wait before marking a check as failed |
| **Expected Status** | `200` | The HTTP status code that indicates the service is healthy (HTTP/HTTPS only) |
| **Ping Method** | `GET` | The HTTP method to use for checks (HTTP/HTTPS only) |
| **Ping Headers** | None | Custom HTTP headers to include in checks (PRO) |
| **Ping Body** | None | Request body for POST/PUT checks (PRO) |

### Setting the Check Interval

The check interval determines how frequently MangoLab sends a request to your service:

- **Free tier**: Minimum interval is 60 seconds
- **PRO tier**: Minimum interval is 10 seconds

Shorter intervals provide faster incident detection but generate more uptime check data. For most services, 30-60 seconds is a good balance.

### Custom Headers (PRO)

Some services require specific headers for health checks. For example, an API that requires an `Authorization` header:

```json
{
  "Authorization": "Bearer my-api-token",
  "Accept": "application/json"
}
```

Set custom headers in the service configuration under **Advanced > Ping Headers**.

### Custom Request Body (PRO)

For services that require a POST or PUT request with a body (e.g., a GraphQL health check):

1. Set **Ping Method** to `POST`
2. Add the request body in **Advanced > Ping Body**:

```json
{
  "query": "{ health { status } }"
}
```

## Service Categories and Tags

### Categories

Categories are single-label groups for organizing services on the dashboard. Common categories include:

- **Infrastructure** -- Reverse proxies, load balancers, DNS servers
- **Database** -- PostgreSQL, MySQL, Redis, MongoDB
- **Applications** -- Web apps, APIs, microservices
- **Monitoring** -- Grafana, Prometheus, logging systems
- **Storage** -- NAS, S3-compatible storage, Nextcloud
- **Networking** -- Routers, switches, firewalls, VPN gateways

### Tags

Tags are flexible labels for cross-cutting concerns:

- `production`, `staging`, `development`
- `critical`, `high`, `low`
- `public`, `internal`
- `docker`, `kubernetes`, `bare-metal`

Tags can be used to filter services on the dashboard and in the API.

## Viewing Service Details

Click on any service in the dashboard to view its detail page, which includes:

- **Current status** (UP, DOWN, DEGRADED, PAUSED, UNKNOWN)
- **Uptime percentage** over configurable time ranges (24h, 7d, 30d, 90d)
- **Response time graph** showing latency trends
- **Recent uptime checks** with individual check results
- **Recent logs** associated with this service
- **Metrics charts** for any ingested metrics
- **Active alerts** configured for this service

## Pausing and Resuming Monitoring

To temporarily stop monitoring a service without deleting it:

1. Navigate to the service detail page
2. Click **Pause Monitoring** (or toggle the **Ping Enabled** switch off)

The service status will change to `PAUSED`. No uptime checks will be performed while paused.

To resume monitoring, toggle **Ping Enabled** back on. The service status will return to its actual state on the next check.

## Deleting Services

To permanently delete a service:

1. Navigate to the service detail page
2. Click **Delete Service**
3. Confirm the deletion

> **Warning:** Deleting a service permanently removes all associated uptime checks, logs (that were linked to it), and alerts. This action cannot be undone.

## Best Practices

### Web Applications (HTTP/HTTPS)

- Use the HTTPS type whenever possible
- Set the expected status code to match your health endpoint (usually `200`)
- If your app has a dedicated health endpoint (e.g., `/health`, `/status`), use that URL instead of the homepage
- Set the check interval to 30 seconds for critical services

### Databases (TCP)

- Monitor the database port (PostgreSQL: 5432, MySQL: 3306, Redis: 6379)
- Use a 60-second interval -- databases rarely go down suddenly
- Consider monitoring both the database and its replication/backup status separately

### Network Devices (PING)

- Use PING type for routers, switches, and other network devices
- A 60-second interval is typically sufficient
- Monitor from the MangoLab server's network perspective -- ensure the devices are reachable

### External Services

- For services outside your network, use HTTPS with a longer timeout (15-30 seconds)
- Be mindful of rate limits on external APIs
- Use a longer check interval (300 seconds) for non-critical external services

## Service Limits

| | Free | PRO |
|---|---|---|
| Maximum services | 5 | 100 |
| Minimum ping interval | 60 seconds | 10 seconds |
| Custom headers | No | Yes |
| TCP monitoring | No | Yes |
| DNS monitoring | No | Yes |

## Next Steps

- [Uptime Monitoring](uptime-monitoring.md) -- Deep dive into uptime tracking
- [Log Management](log-management.md) -- Send and view logs for your services
- [Metrics](metrics.md) -- Track custom metrics for your services
- [Alerts](alerts.md) -- Set up notifications when services have issues
