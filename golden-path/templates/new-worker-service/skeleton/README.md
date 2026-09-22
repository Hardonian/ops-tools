# {{ component_name }}

{{ description }}

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

The worker will start processing jobs and emit heartbeats every 30 seconds.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| HEARTBEAT_INTERVAL | Heartbeat interval in ms | 30000 |
| LOG_LEVEL | Logging level | info |

## Deployment

This service is containerized and deployed via GitHub Actions CI/CD pipeline.

See [docs/runbook.md](docs/runbook.md) for operational procedures.

## Owner

- **Owner**: {{ owner }}
- **System**: {{ system }}
