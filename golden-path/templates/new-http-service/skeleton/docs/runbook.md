# Runbook: {{ component_name }}

## Overview

- **Service**: {{ component_name }}
- **Owner**: {{ owner }}
- **Port**: {{ port }}
- **Type**: HTTP Service

## Alerts

| Alert Name | Severity | Description |
|-----------|----------|-------------|
| HighErrorRate | Critical | 5xx error rate exceeds 5% for 5 minutes |
| HighLatency | Warning | p99 latency exceeds 500ms for 5 minutes |
| ServiceDown | Critical | Health check failing for > 1 minute |

## Escalation

1. **On-call engineer**: Check service logs and health endpoint
2. **Team lead**: If unresolved after 15 minutes
3. **Platform team**: If infrastructure issue suspected

## Recovery Steps

1. Check service health: `curl http://localhost:{{ port }}/health`
2. Review logs: `kubectl logs -l app={{ component_name }} -f`
3. Restart service: `kubectl rollout restart deployment/{{ component_name }}`
4. Rollback if needed: `kubectl rollout undo deployment/{{ component_name }}`

## Useful Commands

```bash
# Check pod status
kubectl get pods -l app={{ component_name }}

# View logs
kubectl logs -l app={{ component_name }} --tail=100

# Port forward for local debugging
kubectl port-forward svc/{{ component_name }} {{ port }}:{{ port }}
```
