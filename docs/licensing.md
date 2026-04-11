# Licensing

MangoRack offers a free tier with core functionality and a PRO tier that unlocks advanced features and higher limits.

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

The PRO tier removes most limits and unlocks all features. Available as a $15/month subscription.

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

## LIFETIME Tier

The LIFETIME plan is identical to PRO in features and limits, plus unlimited nodes, services, log retention, and full API access. It is a one-time $50 purchase with no renewal required.

## Complete Comparison Table

| Feature | Free | PRO | Lifetime |
|---|---|---|---|
| **Monitoring** | | | |
| HTTP/HTTPS monitoring | Yes | Yes | Yes |
| TCP monitoring | No | Yes | Yes |
| DNS monitoring | No | Yes | Yes |
| PING monitoring | Yes | Yes | Yes |
| Custom ping headers | No | Yes | Yes |
| Min check interval | 60s | 10s | 10s |
| Max services | 5 | 100 | Unlimited |
| **Data** | | | |
| Log ingestion | 100/min | 10,000/min | Unlimited |
| Log retention | 3 days | 90 days | Unlimited |
| Uptime retention | 7 days | 365 days | Unlimited |
| Metric ingestion | No | Yes | Yes |
| Data export | No | Yes | Yes |
| **Alerts** | | | |
| Max alerts | 3 | 50 | Unlimited |
| Email alerts | Yes | Yes | Yes |
| Webhook alerts | No | Yes | Yes |
| Discord alerts | No | Yes | Yes |
| Slack alerts | No | Yes | Yes |
| **Dashboard** | | | |
| Max widgets | 6 | 50 | Unlimited |
| Multiple dashboards | No | Yes | Yes |
| Custom widgets | No | Yes | Yes |
| Advanced analytics | No | Yes | Yes |
| **Infrastructure** | | | |
| Max nodes | 1 | 20 | Unlimited |
| Node tracking | No | Yes | Yes |
| API access | No | Yes | Full |

## How to Purchase a License

Visit [mangorack.dev](https://mangorack.dev) to purchase a PRO or LIFETIME license key.

## Activating a License Key

1. Log into MangoRack as an admin
2. Navigate to **Settings > License**
3. Enter your license key in the format `MANGO-XXXXX-XXXXX-XXXXX-XXXXX`
4. Click **Activate**
5. The page will confirm your plan and expiration date (if applicable)

License activation takes effect immediately. All PRO features become available without restarting MangoRack.

## License Key Format

License keys follow this format:

```
MANGO-XXXXX-XXXXX-XXXXX-XXXXX
```

Where each `X` is a character from the set `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (ambiguous characters 0, O, 1, I, L are excluded for readability).

## Upgrading from Free to PRO

1. Purchase a PRO or LIFETIME license key from [mangorack.dev](https://mangorack.dev)
2. Go to **Settings > License**
3. Enter the key and click **Activate**
4. PRO features are available immediately

No data migration is needed. All your existing services, logs, alerts, and settings are preserved. The new limits take effect immediately.

## License Expiry Handling

When a PRO license expires:

- MangoRack reverts to the free tier limits
- Existing data beyond free tier limits is **not deleted** but may become inaccessible
- Services beyond the 5-service limit are not monitored until you reduce the count or renew
- Alerts beyond the 3-alert limit are disabled
- Log retention reverts to 3 days (older logs will be cleaned up on the next retention cycle)
- A banner appears in the dashboard indicating the license has expired

To renew, purchase a new license key from [mangorack.dev](https://mangorack.dev).

## Troubleshooting

### "Invalid key format"

The key does not match the expected pattern. Ensure it is in the format `MANGO-XXXXX-XXXXX-XXXXX-XXXXX` with no extra spaces or characters.

### "Invalid license key"

The license key could not be verified. Please contact support if you believe this is an error.

### "License key has expired"

Your PRO subscription has expired. Purchase a new key or upgrade to LIFETIME.

### License not taking effect

- Clear the Redis cache: `docker compose exec redis redis-cli FLUSHDB`
- Restart MangoRack: `docker compose restart app`

## Next Steps

- [Getting Started](getting-started.md) -- Install MangoRack
- [Configuration](configuration.md) -- Configure your instance
- [Services](services.md) -- Start adding services
