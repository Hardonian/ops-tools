# ADR-0001: Use Express for Customer API

## Status

Accepted

## Date

2025-01-15

## Context

We need an HTTP framework for the customer-api service that provides:

- Mature ecosystem and wide community support
- TypeScript compatibility
- Minimal learning curve for the team
- Production-grade middleware (logging, error handling, body parsing)
- Easy integration with Kubernetes health checks

The service is a straightforward CRUD-style API serving customer data. It does not
require WebSocket support, server-side rendering, or complex routing beyond
standard REST patterns.

## Decision

We will use **Express 4** with **TypeScript** for the customer-api service.

Express was chosen over the following alternatives:

| Framework    | Rationale for passing                                       |
|-------------|--------------------------------------------------------------|
| Fastify      | Faster raw performance, but team has less experience; Express ecosystem is larger |
| Koa          | Smaller community; middleware model less familiar to the team |
| Hono         | Newer project, ecosystem still maturing; fewer production examples |
| NestJS       | Full framework with DI, decorators — overkill for a thin data-serving API |

## Consequences

### Positive

- Team already knows Express; zero ramp-up time
- Massive middleware ecosystem (helmet, cors, rate-limit, etc.)
- Straightforward to containerize and run in Kubernetes
- Mature TypeScript support via `@types/express`

### Negative

- Express 4 is not natively async-aware (must handle errors manually in async routes)
- Performance is lower than Fastify under high concurrency, though not a bottleneck
  for this service's expected load (hundreds of req/s, not thousands)

### Mitigations

- Async error handling wrapped in a utility function
- Performance acceptable at expected scale; revisit if load grows 10x+
- Express 5 is on the horizon with better async support; migration path is clear
