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

The service will start on port {{ port }}.

### Health Check

```bash
curl http://localhost:{{ port }}/health
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT     | HTTP port   | {{ port }}  |

## Deployment

This service is containerized and deployed via GitHub Actions CI/CD pipeline.

See [docs/runbook.md](docs/runbook.md) for operational procedures.

## Owner

- **Owner**: {{ owner }}
- **System**: {{ system }}
