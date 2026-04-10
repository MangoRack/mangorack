# Licensing

MangoLab offers a free tier with core functionality and a PRO tier that unlocks advanced features and higher limits. This guide covers everything about licensing, from feature comparison to key generation.

## Free Tier

The free tier is fully functional for small homelabs. No license key is needed.

| Feature | Free Tier Limit |
|---|---|
| Services | 5 |
| Alerts | 3 |
| Nodes | 1 |
| Log retention | 3 days |
| Uptime retention | 7 days |
| Minimum ping interval | 60 seconds |
| Log ingestion rate | 100 entries/min |
| Dashboard widgets | 6 |
| Multiple dashboards | No |
| Advanced analytics | No |
| Custom widgets | No |
| API access | No |
| Webhook alerts | No |
| Discord alerts | No |
| Slack alerts | No |
| Data export | No |
| Node tracking | No |
| Metric ingestion | No |
| Custom ping headers | No |
| TCP monitoring | No |
| DNS monitoring | No |

## PRO Tier

The PRO tier removes most limits and unlocks all features.

| Feature | PRO Tier Limit |
|---|---|
| Services | 100 |
| Alerts | 50 |
| Nodes | 20 |
| Log retention | 90 days |
| Uptime retention | 365 days |
| Minimum ping interval | 10 seconds |
| Log ingestion rate | 10,000 entries/min |
| Dashboard widgets | 50 |
| Multiple dashboards | Yes |
| Advanced analytics | Yes |
| Custom widgets | Yes |
| API access | Yes |
| Webhook alerts | Yes |
| Discord alerts | Yes |
| Slack alerts | Yes |
| Data export | Yes |
| Node tracking | Yes |
| Metric ingestion | Yes |
| Custom ping headers | Yes |
| TCP monitoring | Yes |
| DNS monitoring | Yes |

## Complete Comparison Table

| Feature | Free | PRO |
|---|---|---|
| **Monitoring** | | |
| HTTP/HTTPS monitoring | Yes | Yes |
| TCP monitoring | No | Yes |
| DNS monitoring | No | Yes |
| PING monitoring | Yes | Yes |
| Custom ping headers | No | Yes |
| Min check interval | 60s | 10s |
| Max services | 5 | 100 |
| **Data** | | |
| Log ingestion | 100/min | 10,000/min |
| Log retention | 3 days | 90 days |
| Uptime retention | 7 days | 365 days |
| Metric ingestion | No | Yes |
| Data export | No | Yes |
| **Alerts** | | |
| Max alerts | 3 | 50 |
| Email alerts | Yes | Yes |
| Webhook alerts | No | Yes |
| Discord alerts | No | Yes |
| Slack alerts | No | Yes |
| **Dashboard** | | |
| Max widgets | 6 | 50 |
| Multiple dashboards | No | Yes |
| Custom widgets | No | Yes |
| Advanced analytics | No | Yes |
| **Infrastructure** | | |
| Max nodes | 1 | 20 |
| Node tracking | No | Yes |
| API access | No | Yes |

## How to Purchase a License

Visit [mangolab.dev](https://mangolab.dev) to purchase a PRO or LIFETIME license key.

## Activating a License Key

1. Log into MangoLab as an admin
2. Navigate to **Settings > License**
3. Enter your license key in the format `MANGO-XXXXX-XXXXX-XXXXX-XXXXX`
4. Click **Activate**
5. The page will confirm your plan and expiration date (if applicable)

License activation takes effect immediately. All PRO features become available without restarting MangoLab.

## License Key Format

License keys follow this format:

```
MANGO-XXXXX-XXXXX-XXXXX-XXXXX
```

Where each `X` is a character from the set `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (ambiguous characters 0, O, 1, I, L are excluded for readability).

**Examples:**

```
MANGO-A3B5C-D7E9F-G2H4J-K6M8N
MANGO-P3Q5R-S7T9U-V2W4X-Y6Z82
```

## Self-Generating License Keys

MangoLab includes a license key generator for development, testing, and personal use. This requires access to the server where MangoLab is installed.

### Prerequisites

- Node.js 20+ installed (or run inside the Docker container)
- The `LICENSE_SECRET` environment variable must match between generation and validation

### Generate a PRO key

```bash
npx ts-node scripts/generate-license.ts --plan PRO
```

### Generate a PRO key with an expiration date

```bash
npx ts-node scripts/generate-license.ts --plan PRO --expires 2027-12-31
```

### Generate a LIFETIME key (never expires)

```bash
npx ts-node scripts/generate-license.ts --plan LIFETIME
```

### Using npm scripts

If configured in `package.json`:

```bash
npm run generate-license -- --plan PRO
npm run generate-license -- --plan LIFETIME
npm run generate-license -- --plan PRO --expires 2027-12-31
```

### Output

```
MangoLab License Key Generated
==============================
Plan:    PRO
Expires: Never
Key:     MANGO-A3B5C-D7E9F-G2H4J-K6M8N
```

> **Important:** The `LICENSE_SECRET` used when generating the key must be the same `LICENSE_SECRET` configured in your MangoLab instance's `.env` file. If they do not match, the key will fail validation.

## License Validation (How It Works)

When you activate a license key, MangoLab performs the following steps:

1. **Format validation**: Checks that the key matches the `MANGO-XXXXX-XXXXX-XXXXX-XXXXX` pattern
2. **Base32 decoding**: Decodes the key body into binary data
3. **HMAC verification**: Verifies the key's signature using `LICENSE_SECRET` and SHA-256 HMAC. This ensures the key was generated with the same secret.
4. **Plan extraction**: Reads the plan type (PRO or LIFETIME) from the key payload
5. **Expiry check**: If the key has an expiration date, verifies it has not passed
6. **Database storage**: Stores the validated license in the database
7. **Cache update**: Caches the validation result in Redis for 1 hour to avoid repeated validation overhead

Subsequent checks of the current plan:
1. Check Redis cache first (fast path)
2. If cache miss, query the database for a valid, non-expired license
3. Cache the result for future lookups

## Upgrading from Free to PRO

1. Obtain a PRO or LIFETIME license key (purchase or self-generate)
2. Go to **Settings > License**
3. Enter the key and click **Activate**
4. PRO features are available immediately

No data migration is needed. All your existing services, logs, alerts, and settings are preserved. The new limits take effect immediately -- for example, you can now create up to 100 services instead of 5.

## License Expiry Handling

When a PRO license expires:

- MangoLab reverts to the free tier limits
- Existing data beyond free tier limits is **not deleted** but may become inaccessible
- Services beyond the 5-service limit are not monitored until you reduce the count or renew
- Alerts beyond the 3-alert limit are disabled
- Log retention reverts to 3 days (older logs will be cleaned up on the next retention cycle)
- A banner appears in the dashboard indicating the license has expired

To renew, simply activate a new license key.

## LIFETIME License

The LIFETIME plan is identical to PRO in features and limits, but it never expires. It is a one-time purchase with no renewal required.

LIFETIME keys are generated with no expiry timestamp, so the expiry check is skipped during validation.

## Troubleshooting

### "Invalid key format"

The key does not match the expected pattern. Ensure it is in the format `MANGO-XXXXX-XXXXX-XXXXX-XXXXX` with no extra spaces or characters.

### "Invalid license key"

The HMAC signature verification failed. This means the key was generated with a different `LICENSE_SECRET`. Ensure the `LICENSE_SECRET` in your `.env` file matches the one used when the key was generated.

### "License key has expired"

The key's expiration date has passed. Generate or purchase a new key.

### License not taking effect

- Clear the Redis cache: `docker compose exec redis redis-cli FLUSHDB`
- Restart MangoLab: `docker compose restart app`

## Next Steps

- [Getting Started](getting-started.md) -- Install MangoLab
- [Configuration](configuration.md) -- Configure LICENSE_SECRET
- [Services](services.md) -- Start adding services with PRO limits
