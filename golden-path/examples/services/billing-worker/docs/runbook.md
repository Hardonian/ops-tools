# billing-worker Runbook

## Overview

The billing-worker is an event-driven service that processes billing events
(invoice generation, payment reconciliation, refund processing) for the commerce
platform. It runs as a long-lived process with a heartbeat mechanism and health
endpoint for Kubernetes orchestration.

**Service:** billing-worker  
**System:** commerce-platform  
**Owner:** team-product  
**On-call rotation:** #team-product-oncall (Slack)

## Architecture

```
┌──────────────────┐       ┌──────────────────┐       ┌────────────────┐
│  Redis Streams   │──────▶│  billing-worker  │──────▶│  PostgreSQL    │
│  (event queue)   │       │  :3001 (health)  │       │  (billing DB)  │
└──────────────────┘       └──────────────────┘       └────────────────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │  Sentry /    │
                           │  Error Track  │
                           └──────────────┘
```

**Key facts:**

- Stateful (maintains in-flight event tracking)
- Does NOT run as a Deployment with high replica count — use 1–2 replicas max
  for event-processing ordering guarantees
- Health endpoint on port 3001 for Kubernetes probes
- Structured JSON logs to stdout/stderr
- Heartbeat emitted every 30 seconds (configurable via `HEARTBEAT_INTERVAL`)

## Alerts

### billing-worker:NoHeartbeat

**Severity:** critical  
**Threshold:** No heartbeat received for > 90 seconds (3x interval)  
**Impact:** Worker may be stuck or crashed; billing events not being processed

**Immediate actions:**

1. Check pod status: `kubectl get pods -l app=billing-worker -n commerce`
2. Inspect logs for errors: `kubectl logs -l app=billing-worker -n commerce --tail=200`
3. If pod is running but no heartbeat, check for event-processing deadlocks
4. Restart the pod: `kubectl rollout restart deployment/billing-worker -n commerce`

### billing-worker:HighFailureRate

**Severity:** warning  
**Threshold:** > 10% event processing failures over 5 minutes  
**Impact:** Billing events not being processed correctly; invoices may be delayed

**Immediate actions:**

1. Check error logs for common failure patterns
2. Verify downstream services (PostgreSQL) are healthy
3. Check if event payloads have changed format (schema evolution issue)
4. If systemic, pause event processing and investigate before resuming

### billing-worker:EventBacklog

**Severity:** warning  
**Threshold:** Queue depth > 1000 messages  
**Impact:** Billing events processing is falling behind

**Immediate actions:**

1. Check processing latency in Grafana
2. Verify worker is running and healthy
3. Consider scaling to 2 replicas (if event partitioning allows)
4. Check for events causing repeated failures (DLQ inspection)

### billing-worker:HighMemoryUsage

**Severity:** warning  
**Threshold:** Memory > 80% of limit  
**Impact:** Risk of OOM kill, losing in-flight events

**Actions:**

1. Check for memory leaks (growing in-flight event set)
2. Verify events are being cleaned up after processing
3. Increase memory limits if legitimate growth

## Escalation

| Time Elapsed | Action                                              |
|-------------|-----------------------------------------------------|
| 0 min       | On-call engineer acknowledges alert                 |
| 5 min       | Check worker pod status and logs                    |
| 15 min      | Escalate to team-product lead if unresolved         |
| 30 min      | Escalate to platform engineering for infra issues   |
| 60 min      | War room — involve billing domain expert            |

**Escalation contacts:**

- team-product lead: Slack `@team-product-lead`
- Billing domain expert: Slack `@billing-expert`
- Platform engineering: Slack `#platform-eng-oncall`

## Recovery

### Worker pod stuck (no heartbeat)

```bash
# Check pod status and logs
kubectl describe pod -l app=billing-worker -n commerce
kubectl logs -l app=billing-worker -n commerce --tail=500

# Restart
kubectl rollout restart deployment/billing-worker -n commerce

# Verify recovery
kubectl get pods -l app=billing-worker -n commerce -w
```

### Event processing backlog after outage

```bash
# Check queue depth (Redis example)
redis-cli LLEN billing:events:pending

# If backed up, temporarily scale workers
kubectl scale deployment/billing-worker -n commerce --replicas=2

# Monitor processing rate
kubectl logs -l app=billing-worker -n commerce -f | grep "Event processed"
```

### Database connectivity loss

```bash
# Test database connectivity from worker pod
kubectl exec -it deploy/billing-worker -n commerce -- \
  node -e "const net = require('net'); const s = net.connect(5432, 'commerce-postgres'); s.on('connect', () => { console.log('connected'); s.end(); }); s.on('error', (e) => { console.error(e.message); process.exit(1); });"

# Check network policies
kubectl get networkpolicies -n commerce -l app=billing-worker
```

### Full service recovery (post-outage)

1. Verify worker pod is running and sending heartbeats
2. Check that events in the queue are being consumed (queue depth decreasing)
3. Verify processed events are persisted to database
4. Check for any events that may need reprocessing (DLQ)
5. Confirm downstream consumers (invoice emails, receipts) are working
6. Post-incident review within 24 hours

### Scaling considerations

```bash
# For event processing, max 2 replicas recommended for ordering
kubectl scale deployment/billing-worker -n commerce --replicas=2

# Monitor queue partition assignment
kubectl logs -l app=billing-worker -n commerce --tail=50 | grep "partition"
```

## Useful Commands

```bash
# Tail structured logs
kubectl logs -l app=billing-worker -n commerce -f --max-log-requests=50

# Shell into a running pod
kubectl exec -it deploy/billing-worker -n commerce -- /bin/sh

# Check resource usage
kubectl top pods -l app=billing-worker -n commerce

# Port-forward health endpoint for local inspection
kubectl port-forward svc/billing-worker 3001:3001 -n commerce

# Check recent events (if using Redis Streams)
redis-cli XREVRANGE billing:events + - COUNT 20
```
