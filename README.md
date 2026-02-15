# BlackRoad Status

Real-time status page for BlackRoad services.

## Live

- **Status Page**: https://blackroad-status.amundsonalexa.workers.dev
- **API**: https://blackroad-status.amundsonalexa.workers.dev/api/status

## Features

- **Real-time Health Checks** - Monitors all BlackRoad services every request
- **Latency Tracking** - Shows response times for each service
- **90-day Uptime History** - Visual uptime bar
- **Incident Management** - Recent incidents with updates
- **Auto-refresh** - Page refreshes every 60 seconds
- **Beautiful UI** - Golden Ratio design with BlackRoad branding

## Monitored Services

### API
- GraphQL API
- Webhooks
- Email Service

### Web
- Website (blackroad.io)
- Dashboard
- Documentation

## API Response

```json
{
  "overall": "All Systems Operational",
  "services": [
    {
      "id": "graphql",
      "name": "GraphQL API",
      "status": "operational",
      "latency": 45,
      "lastChecked": "2026-02-15T04:30:00Z"
    }
  ],
  "incidents": [],
  "lastChecked": "2026-02-15T04:30:00Z"
}
```

## Status Types

| Status | Description |
|--------|-------------|
| `operational` | Service is working normally |
| `degraded` | Service is slow or partially impacted |
| `outage` | Service is unavailable |

## Development

```bash
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

## License

Proprietary - BlackRoad OS, Inc.
