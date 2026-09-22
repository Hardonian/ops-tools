# ADR-0001: Event-Driven Billing Processing

## Status

Accepted

## Date

2025-01-15

## Context

The commerce platform needs to process billing-related events (invoice
generation, payment reconciliation, refund processing) asynchronously. These
operations:

- Can tolerate seconds-to-minutes latency (not real-time critical)
- Require guaranteed at-least-once processing
- Should not block the request path of the customer-api or storefront
- May need retry logic for transient failures (network timeouts, DB locks)
- Benefit from independent scaling from the HTTP services

The alternative would be synchronous processing within the HTTP request path,
which couples billing logic to API latency and availability.

## Decision

We will adopt an **event-driven architecture** for billing processing using a
separate worker service (`billing-worker`) that consumes events from a message
queue.

**Event source:** Redis Streams (initially), with migration path to Kafka if
throughput or ordering requirements grow.

**Event types:**

| Event Type           | Trigger               | Processing                              |
|---------------------|----------------------|-----------------------------------------|
| `order.created`     | New order placed     | Generate invoice, calculate tax         |
| `payment.received`  | Payment confirmed    | Update invoice status, record payment   |
| `payment.failed`    | Payment declined     | Retry logic, notify customer            |
| `invoice.overdue`   | Scheduled check      | Send reminder, flag for collections     |
| `refund.requested`  | Customer/agent       | Process refund, update financial records |

## Consequences

### Positive

- Billing processing is decoupled from API request path — API latency unaffected
- Worker can be scaled independently based on event volume
- Failed events can be retried without affecting the caller
- Natural audit trail via event log
- Easy to add new event types and processors without changing existing code

### Negative

- Added operational complexity: worker must be monitored, events must be managed
- Eventual consistency: billing state may lag behind order state by seconds
- Need to handle duplicate events (at-least-once delivery guarantee)
- Debugging distributed event flows is harder than synchronous call stacks

### Mitigations

- Idempotent event processing (events carry unique IDs, processed state tracked)
- Structured logging with correlation IDs for distributed tracing
- Dead-letter queue for events that fail after max retries
- Heartbeat mechanism for liveness detection
- Comprehensive runbook for operational troubleshooting

## Alternatives Considered

| Approach              | Why Rejected                                              |
|-----------------------|-----------------------------------------------------------|
| Synchronous (in API)  | Couples billing to API latency; no retry; not scalable    |
| AWS Lambda            | Cold start latency; vendor lock-in; less control over runtime |
| Bull/BullMQ          | Node.js queue library; less robust than Redis Streams for our scale |
| Kafka from day one    | Operational overhead excessive for initial scale; Redis Streams sufficient |
