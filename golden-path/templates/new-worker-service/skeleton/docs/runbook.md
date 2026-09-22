# Runbook: {{ component_name }}

## Overview

- **Service**: {{ component_name }}
- **Owner**: {{ owner }}
- **Type**: Worker Service (background job processor)

## Alerts

| Alert Name | Severity | Description |
|-----------|----------|-------------|
| WorkerDown | Critical | No heartbeat received for > 2 minutes |
| JobProcessingStalled | Critical | No jobs processed in last 5 minutes |
| HighMemoryUsage | Warning | Memory usage exceeds 80% |

## Escalation

1. **On-call engineer**: Check worker logs and heartbeat status
2. **Team lead**: If unresolved after 15 minutes
3. **Platform team**: If infrastructure issue suspected

## Recovery Steps

1. Check worker status: `kubectl logs -l app={{ component_name }} -f`
2. Check heartbeat: Look for heartbeat logs in the last 30 seconds
3. Restart worker: `kubectl rollout restart deployment/{{ component_name }}`
4. Rollback if needed: `kubectl rollout undo deployment/{{ component_name }}`

## Useful Commands

```bash
# Check pod status
kubectl get pods -l app={{ component_name }}

# View logs
kubectl logs -l app={{ component_name }} --tail=100

# Scale worker
kubectl scale deployment/{{ component_name }} --replicas=2
```
