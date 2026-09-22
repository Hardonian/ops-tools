# billing-worker

Event-driven worker service that processes billing events for the commerce platform.

## Overview

The billing-worker is an experimental Node.js/TypeScript service that consumes
billing events from a message queue, processes them (invoice generation, payment
reconciliation, notification dispatch), and persists results. It runs as a
long-lived process with a heartbeat mechanism and graceful shutdown support.

**Owner:** team-product  
**System:** commerce-platform  
**Lifecycle:** experimental

## Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript 5
- **Container:** Docker (multi-stage, Alpine-based)
- **Message queue:** Redis Streams (pluggable via `EventProcessor` interface)

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Event Processing

The worker processes the following billing event types:

| Event Type          | Description                                   |
|--------------------|-----------------------------------------------|
| `order.created`     | Generate initial invoice for a new order       |
| `payment.received`  | Record payment and update invoice status       |
| `payment.failed`    | Handle failed payment, trigger retry logic     |
| `invoice.overdue`   | Handle overdue invoices, send reminders        |
| `refund.requested`  | Process refund requests and update records     |

## Graceful Shutdown

The worker handles `SIGTERM` and `SIGINT` signals:

1. Stops accepting new events from the queue
2. Waits for in-flight event processing to complete (up to 30 seconds)
3. Logs final heartbeat
4. Exits cleanly with code 0

If processing does not complete within 30 seconds, the worker exits with code 1.

## Configuration

| Environment Variable  | Default               | Description                       |
|----------------------|-----------------------|-----------------------------------|
| `PORT`               | `3001`                | Metrics/health port               |
| `LOG_LEVEL`          | `info`                | Logging level                     |
| `NODE_ENV`           | `development`         | Runtime environment               |
| `HEARTBEAT_INTERVAL` | `30000`               | Heartbeat interval in milliseconds|
| `REDIS_URL`          | `redis://localhost:6379` | Redis connection URL           |

## Deployment

```bash
# Build Docker image
docker build -t billing-worker:latest .

# Run container
docker run -e NODE_ENV=production billing-worker:latest
```

For Kubernetes deployment, see [`infra/k8s/deployment.yaml`](infra/k8s/deployment.yaml).

## Development

```bash
npm install
npm run dev    # Starts with ts-node watch mode
npm run lint   # ESLint
npm test       # Tests (if configured)
```

## Operational Runbook

See [`docs/runbook.md`](docs/runbook.md) for alerts, escalation, and recovery
procedures.
