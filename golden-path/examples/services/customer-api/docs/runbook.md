# customer-api Runbook

## Overview

The customer-api serves customer data for the commerce platform. It is a
stateless HTTP service backed by an in-memory store (currently) with planned
PostgreSQL integration. Downtime directly impacts storefront customer lookups,
admin dashboards, and downstream billing workflows.

**Service:** customer-api  
**System:** commerce-platform  
**Owner:** team-product  
**On-call rotation:** #team-product-oncall (Slack)

## Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌────────────────┐
│  API Gateway │──────▶│  customer-api    │──────▶│  PostgreSQL    │
│  (Kong/Envoy)│       │  :3000           │       │  (primary)     │
└──────────────┘       └──────────────────┘       └────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  Redis Cache  │
                       │  (read cache) │
                       └──────────────┘
```

**Key facts:**

- Stateless, horizontally scalable (no local session state)
- Listens on port 3000 (configurable via `PORT` env var)
- Health endpoint at `/health` used by Kubernetes probes
- Logs structured JSON to stdout/stderr for collection by Fluentd/Datadog

## Alerts

### customer-api:HighErrorRate

**Severity:** critical  
**Threshold:** > 5% 5xx responses over 5 minutes  
**Impact:** Customer lookups fail; storefront shows errors

**Immediate actions:**

1. Check Grafana dashboard for error breakdown (4xx vs 5xx)
2. Inspect recent deployments: `kubectl rollout history deployment/customer-api -n commerce`
3. If correlated with a deployment, roll back: `kubectl rollout undo deployment/customer-api -n commerce`

### customer-api:HighLatency

**Severity:** warning  
**Threshold:** p99 > 500ms over 10 minutes  
**Impact:** Slow customer lookups, potential timeouts from API gateway

**Immediate actions:**

1. Check if database latency has increased (PostgreSQL dashboards)
2. Check for cold-start after scaling event
3. Review slow query log if database-backed

### customer-api:PodRestartLoop

**Severity:** critical  
**Threshold:** Pod restarted > 3 times in 10 minutes  
**Impact:** Service unavailable, request failures

**Immediate actions:**

1. Check pod logs: `kubectl logs -l app=customer-api -n commerce --tail=200`
2. Look for OOM kills: `kubectl describe pod <pod-name> -n commerce`
3. If OOM, increase memory limits in deployment.yaml
4. If crash loop from code error, check recent config/source changes

### customer-api:HighMemoryUsage

**Severity:** warning  
**Threshold:** Memory > 80% of limit  
**Impact:** Risk of OOM kill under load

**Actions:**

1. Check for memory leaks (heap snapshots if available)
2. Consider scaling horizontally or increasing memory limits
3. Review if in-memory data structures have grown unbounded

## Escalation

| Time Elapsed | Action                                              |
|-------------|-----------------------------------------------------|
| 0 min       | On-call engineer acknowledges alert                 |
| 5 min       | Investigate root cause using Grafana + pod logs     |
| 15 min      | Escalate to team-product lead if unresolved         |
| 30 min      | Escalate to platform engineering for infra issues   |
| 60 min      | War room with on-call + team lead + platform eng    |

**Escalation contacts:**

- team-product lead: Slack `@team-product-lead`
- Platform engineering: Slack `#platform-eng-oncall`
- Infrastructure: PagerDuty service `commerce-platform-infra`

## Recovery

### Service deployment failure

```bash
# Check current rollout status
kubectl rollout status deployment/customer-api -n commerce

# Roll back to previous version
kubectl rollout undo deployment/customer-api -n commerce

# Verify rollback
kubectl rollout status deployment/customer-api -n commerce
```

### Database connectivity loss

```bash
# Check database endpoint from within cluster
kubectl exec -it deploy/customer-api -n commerce -- \
  curl -s http://commerce-postgres:5432/health

# Check network policies
kubectl get networkpolicies -n commerce -l app=customer-api
```

### Full service recovery (post-outage)

1. Verify all pods are running: `kubectl get pods -l app=customer-api -n commerce`
2. Verify health endpoint: `curl -s https://api.internal/health | jq`
3. Run synthetic test suite against staging
4. Check dependent services (billing-worker, storefront) are healthy
5. Post-incident review within 24 hours

### Scaling

```bash
# Manual scale
kubectl scale deployment/customer-api -n commerce --replicas=5

# Verify HPA
kubectl get hpa customer-api -n commerce
```

## Useful Commands

```bash
# Tail structured logs
kubectl logs -l app=customer-api -n commerce -f --max-log-requests=50

# Shell into a running pod
kubectl exec -it deploy/customer-api -n commerce -- /bin/sh

# Port-forward for local debugging
kubectl port-forward svc/customer-api 3000:3000 -n commerce

# Check resource usage
kubectl top pods -l app=customer-api -n commerce
```
