# Uptime Monitoring

MangoLab continuously monitors your services and tracks their availability over time. This guide explains how uptime monitoring works and how to get the most out of it.

## How Uptime Checks Work

MangoLab runs a background scheduler that performs uptime checks on each active service based on its configured interval. Here is what happens during each check:

1. **Scheduler triggers** -- When a service's check interval has elapsed since its last check, the scheduler queues a new check.
2. **Check executes** -- Depending on the service type:
   - **HTTP/HTTPS**: Sends an HTTP(S) request with the configured method, headers, and body. Measures response time.
   - **TCP**: Attempts a TCP connection to the specified host and port.
   - **PING**: Sends ICMP echo requests and measures round-trip time.
   - **DNS**: Performs a DNS lookup for the configured domain.
3. **Result evaluated** -- The check result is compared against the service's expected outcome (e.g., HTTP 200). The service status is updated accordingly.
4. **Data stored** -- The check result (status, response time, status code, errors) is written to the `UptimeCheck` table.
5. **Alerts evaluated** -- If the status changed (e.g., UP to DOWN), any configured alerts are evaluated and may fire notifications.

## Check Intervals and Scheduling

The check interval determines how frequently MangoLab tests each service:

| Plan | Minimum Interval | Recommended |
|---|---|---|
| Free | 60 seconds | 60 seconds |
| PRO | 10 seconds | 30 seconds |

**How scheduling works:**

- Checks are staggered to avoid overwhelming your network or services
- If a check takes longer than the configured timeout, it is marked as failed
- The next check is scheduled based on the interval from the start of the previous check, not its completion
- Paused services are skipped entirely

**Choosing an interval:**

- **10-30 seconds**: Mission-critical services where every second of downtime matters
- **60 seconds**: Standard monitoring for most services (default)
- **300 seconds (5 min)**: Non-critical services or external APIs where you want to minimize load

## Understanding Uptime Percentages

Uptime percentage is calculated as:

```
uptime_percentage = (successful_checks / total_checks) * 100
```

MangoLab calculates uptime over several time windows:

| Window | Description |
|---|---|
| **24 hours** | Last 24 hours of checks |
| **7 days** | Last 7 days |
| **30 days** | Last 30 days |
| **90 days** | Last 90 days (PRO only) |

**What counts as "successful":**

- HTTP/HTTPS: Status code matches the expected status (default: 200)
- TCP: Connection established within the timeout
- PING: At least one reply received within the timeout
- DNS: Query returned a valid response

**What counts as "failed":**

- Connection timeout
- Connection refused
- Unexpected status code
- DNS resolution failure
- TLS/SSL handshake failure

**Status mapping:**

| Status | Meaning |
|---|---|
| `UP` | Check succeeded |
| `DOWN` | Check failed |
| `DEGRADED` | Check succeeded but response time exceeded a threshold |
| `PAUSED` | Monitoring is disabled -- not counted in uptime calculations |
| `UNKNOWN` | Service has not been checked yet |

## Uptime Page and Status Overview

The uptime page provides a bird's-eye view of all your services:

- **Status grid**: Shows current status of every service with color-coded indicators (green = UP, red = DOWN, yellow = DEGRADED, gray = PAUSED/UNKNOWN)
- **Uptime bars**: Visual timeline showing uptime history per service
- **Overall uptime**: Aggregate uptime percentage across all services
- **Response time summary**: Average, minimum, and maximum response times

## Incident Detection and Tracking

MangoLab automatically detects incidents based on status changes:

- **Incident starts** when a service transitions from `UP` to `DOWN` (or `DEGRADED`)
- **Incident ends** when the service transitions back to `UP`
- **Incident duration** is calculated from the first failed check to the first successful recovery check

Each incident records:
- Start time (first failed check)
- End time (first successful check after failure)
- Duration
- Error details from the failed checks
- Number of failed checks during the incident

## Response Time Tracking

Every successful uptime check records the response time in milliseconds. MangoLab uses this data to:

- **Graph response time trends** over time
- **Detect degradation** when response times increase significantly
- **Calculate averages** for different time windows
- **Trigger alerts** when response time exceeds a threshold (SERVICE_SLOW alert type)

Response time includes:
- **HTTP/HTTPS**: DNS resolution + TCP connection + TLS handshake + time to first byte
- **TCP**: Time to establish the TCP connection
- **PING**: Round-trip time of the ICMP echo

## SSL Certificate Monitoring

For HTTPS services, MangoLab automatically monitors SSL certificate status:

- **Certificate expiry**: Checks the certificate expiration date
- **Days until expiry**: Displayed on the service detail page
- **Expiry warnings**: Triggers alerts when the certificate is close to expiring (configurable threshold)

This helps you avoid unexpected certificate expirations that could cause service outages.

## Uptime History and Data Retention

Uptime check data is retained based on your plan:

| Plan | Retention Period |
|---|---|
| Free | 7 days |
| PRO | 365 days |

After the retention period, individual check records are automatically deleted. However, aggregated uptime statistics (daily/weekly/monthly percentages) may be retained longer for historical reporting.

**Data stored per check:**

| Field | Description |
|---|---|
| `status` | UP, DOWN, or DEGRADED |
| `responseTime` | Response time in milliseconds (null if failed) |
| `statusCode` | HTTP status code (HTTP/HTTPS only, null otherwise) |
| `error` | Error message if the check failed |
| `checkedAt` | Timestamp of the check |

## Best Practices

1. **Set realistic timeouts**: A 10-second timeout is appropriate for most services. Increase to 15-30 seconds for services behind slow networks or external APIs.

2. **Use health endpoints**: Instead of monitoring your app's homepage, create a dedicated `/health` endpoint that checks internal dependencies (database, cache, etc.).

3. **Stagger intervals**: If you have many services, avoid setting them all to the same interval. Stagger by a few seconds to distribute load.

4. **Monitor from the right perspective**: MangoLab checks from the server it runs on. If your services are on the same network, checks will be fast. For external services, consider network latency in your timeout configuration.

5. **Review uptime regularly**: Check the uptime page weekly to identify patterns (e.g., services that degrade during peak hours).

## Next Steps

- [Services](services.md) -- Configure service monitoring settings
- [Alerts](alerts.md) -- Set up alerts for downtime and degradation
- [Dashboard](dashboard.md) -- Customize your uptime overview
