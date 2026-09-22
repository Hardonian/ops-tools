# Runbook: {{ component_name }}

## Overview

- **Service**: {{ service }}
- **Runbook**: {{ component_name }}
- **Owner**: {{ owner }}
- **Last Updated**: {{ now | date('YYYY-MM-DD') }}

This runbook provides operational procedures for the {{ service }} service.

## Alerts

| Alert Name | Severity | Description | Action Required |
|-----------|----------|-------------|-----------------|
| *Add your alerts here* | | | |

## Escalation Path

1. **On-call engineer**: Initial response and investigation
2. **Service owner ({{ owner }})**: Technical escalation
3. **Platform team**: Infrastructure issues
4. **Management**: Business-critical incidents

## Common Issues & Resolution

### Issue 1: [Describe common issue]

**Symptoms**: What operators will see
**Root Cause**: Why it happens
**Resolution**:
1. Step one
2. Step two
3. Step three

### Issue 2: [Describe common issue]

**Symptoms**: What operators will see
**Root Cause**: Why it happens
**Resolution**:
1. Step one
2. Step two
3. Step three

## Recovery Procedures

### Service Down

1. Check service health: `curl http://localhost:8080/health`
2. Check pod status: `kubectl get pods -l app={{ service }}`
3. View logs: `kubectl logs -l app={{ service }} --tail=100`
4. Restart: `kubectl rollout restart deployment/{{ service }}`

### High Latency

1. Check current metrics
2. Review recent deployments
3. Scale up if needed: `kubectl scale deployment/{{ service }} --replicas=3`
4. Rollback if recent deployment: `kubectl rollout undo deployment/{{ service }}`

### Database Connection Issues

1. Check database connectivity
2. Verify connection string
3. Check connection pool settings
4. Restart service with fresh connections

## Useful Commands

```bash
# Check service status
kubectl get pods -l app={{ service }}

# View logs
kubectl logs -l app={{ service }} --tail=100 -f

# Port forward for debugging
kubectl port-forward svc/{{ service }} 8080:8080

# Scale service
kubectl scale deployment/{{ service }} --replicas=N

# Rollback deployment
kubectl rollout undo deployment/{{ service }}
```

## Monitoring & Metrics

- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (if available)
- Dashboard: [Add Grafana/dashboard link here]

## Related Documentation

- [Service README](../README.md)
- [API Documentation](../docs/api.md)
- [Architecture Decision Records](../docs/adr/)
