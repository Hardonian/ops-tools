# customer-api

RESTful HTTP service that provides customer data for the commerce platform.

## Overview

The customer-api is a production-grade Express/TypeScript service responsible for
serving customer records. It exposes a RESTful JSON API under `/api/v1/` and
includes a liveness/readiness probe at `/health`.

**Owner:** team-product  
**System:** commerce-platform  
**Lifecycle:** production

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express 4
- **Language:** TypeScript 5
- **Container:** Docker (multi-stage, Alpine-based)

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The server listens on the port defined by the `PORT` environment variable
(defaults to `3000`).

## API Reference

### Health Check

```
GET /health
```

Returns service health status. Used by Kubernetes liveness/readiness probes.

**Response:**
```json
{
  "status": "ok",
  "service": "customer-api",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345
}
```

### List Customers

```
GET /api/v1/customers
```

Returns a paginated list of customers.

**Query Parameters:**

| Param    | Type   | Default | Description              |
|----------|--------|---------|--------------------------|
| `limit`  | number | 20      | Max results per page     |
| `offset` | number | 0       | Offset for pagination    |

**Response:**
```json
{
  "data": [
    {
      "id": "cust_abc123",
      "email": "alice@example.com",
      "name": "Alice Johnson",
      "createdAt": "2024-06-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 142
  }
}
```

### Get Customer by ID

```
GET /api/v1/customers/:id
```

Returns a single customer record.

**Response:**
```json
{
  "id": "cust_abc123",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "phone": "+1-555-0100",
  "createdAt": "2024-06-01T08:00:00.000Z",
  "updatedAt": "2025-01-10T14:22:00.000Z"
}
```

**Error Responses:**

| Status | Body                                    | Description         |
|--------|-----------------------------------------|---------------------|
| 400    | `{ "error": "Invalid customer ID" }`   | Malformed ID        |
| 404    | `{ "error": "Customer not found" }`    | ID does not exist   |
| 500    | `{ "error": "Internal server error" }` | Unexpected failure  |

## Configuration

| Environment Variable | Default              | Description              |
|---------------------|----------------------|--------------------------|
| `PORT`              | `3000`               | HTTP listen port         |
| `LOG_LEVEL`         | `info`               | Logging level            |
| `NODE_ENV`          | `development`        | Runtime environment      |

## Deployment

```bash
# Build Docker image
docker build -t customer-api:latest .

# Run container
docker run -p 3000:3000 -e NODE_ENV=production customer-api:latest
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
