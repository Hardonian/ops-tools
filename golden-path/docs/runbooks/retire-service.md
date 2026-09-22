# Runbook: Retire a Service

This runbook walks you through deprecating and retiring a service from the platform.

**Estimated time**: 2-4 hours (spread over days/weeks depending on dependency removal)
**Prerequisites**: Service owner access, Backstage access, deployment access

---

## Step 1: Assess Dependencies

Before retiring, identify all dependencies:

1. **Check catalog relationships**:
   - Navigate to your service in Backstage → **Dependencies** tab
   - List all services that depend on this service

2. **Check who depends on your API**:
   ```bash
   # Search catalog for consumers
   grep -r "dependsOn.*your-service" --include="catalog-info.yaml"
   ```

3. **Check traffic patterns**:
   - Review Grafana dashboards for inbound traffic
   - Identify all clients calling your service

4. **Document dependencies**:
   | Dependency | Owner | Migration Plan | ETA |
   |-----------|-------|----------------|-----|
   | service-a | team-foo | Switch to service-b | 2 weeks |
   | service-b | team-bar | Decommission entirely | 1 week |

## Step 2: Update Lifecycle to Deprecated

1. Update `catalog-info.yaml`:
   ```yaml
   metadata:
     annotations:
       backstage.io/dependedBy: "none"  # Remove dependencies first
     description: "[DEPRECATED] This service is scheduled for retirement on YYYY-MM-DD"
     tags:
       - deprecated
       - retirement-YYYY-MM
   spec:
     lifecycle: deprecated
   ```

2. Add deprecation notice to documentation:
   ```markdown
   # Service Name (DEPRECATED)
   
   > ⚠️ **This service is deprecated and will be retired on YYYY-MM-DD.**
   > 
   > For questions, contact: team-xxx@example.com
   
   ## Migration Guide
   [Instructions for migrating to the replacement service]
   ```

3. Commit and push

## Step 3: Notify Stakeholders

1. **Send deprecation notice** to all dependents:
   ```markdown
   Subject: [DEPRECATED] my-service scheduled for retirement YYYY-MM-DD
   
   Team,
   
   The service `my-service` is deprecated and will be retired on YYYY-MM-DD.
   
   **Migration required for:**
   - [ ] team-foo: Switch API calls to service-b
   - [ ] team-bar: Remove dependency on my-service
   
   **Migration guide:** [link to docs]
   **Questions:** Contact team-xxx@example.com
   
   Please confirm migration completion by YYYY-MM-DD.
   ```

2. **Update status page** with deprecation notice

3. **Create tracking issue** in GitHub:
   ```markdown
   Title: [RETIREMENT] Decommission my-service by YYYY-MM-DD
   
   ## Dependencies
   - [ ] team-foo: Switch to service-b (ETA: YYYY-MM-DD)
   - [ ] team-bar: Remove dependency (ETA: YYYY-MM-DD)
   
   ## Decommission Steps
   - [ ] All dependents migrated
   - [ ] Traffic dropped to zero
   - [ ] Monitoring removed
   - [ ] Deployment removed
   - [ ] Catalog entity updated
   - [ ] Repository archived
   ```

## Step 4: Decommission Infrastructure

1. **Remove from Kubernetes** (after all traffic stops):
   ```bash
   # Scale down deployment
   kubectl scale deployment/my-service -n production --replicas=0
   
   # Wait for in-flight requests to drain
   sleep 300
   
   # Remove deployment
   kubectl delete deployment/my-service -n production
   kubectl delete service/my-service -n production
   ```

2. **Remove infrastructure claims** (if using Crossplane):
   ```bash
   # List claims for this service
   kubectl get databaseclaim,queueclaim,bucketclaim -n team-xxx | grep my-service
   
   # Delete claims (set deletionPolicy: retain if data must be preserved)
   kubectl delete databaseclaim/my-service-db -n team-xxx
   ```

3. **Remove CI/CD pipelines**:
   - Archive GitHub Actions workflows
   - Remove from deployment dashboards
   - Remove from ArgoCD application (if applicable)

## Step 5: Update Catalog

1. Update `catalog-info.yaml` to mark as retired:
   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: Component
   metadata:
     name: my-service
     description: "[RETIRED] Service decommissioned on YYYY-MM-DD"
     tags:
       - retired
     annotations:
       backstage.io/retired: "true"
       backstage.io/retired-on: "YYYY-MM-DD"
       backstage.io/retired-by: "team-xxx"
   spec:
     lifecycle: retired
     owner: team-xxx  # Keep owner for historical reference
   ```

2. **Option A: Keep entity for historical reference** (recommended)
   - Update lifecycle to `retired`
   - Add retirement annotations
   - Entity remains searchable for audit purposes

3. **Option B: Remove entity entirely** (if no historical value)
   - Remove `catalog-info.yaml` from repository
   - Remove from location entity
   - Entity disappears from catalog after next refresh

## Step 6: Archive Documentation

1. **Archive TechDocs**:
   - Keep docs folder in repository for historical reference
   - Add deprecation banner to all pages
   - Update mkdocs.yml to mark as archived:
     ```yaml
     site_name: my-service (ARCHIVED)
     ```

2. **Archive repository**:
   ```bash
   # Archive on GitHub
   gh repo archive goldenpath/my-service
   ```

3. **Move to archive team** (if applicable):
   ```bash
   # Transfer to archive org
   gh repo transfer goldenpath/my-service goldenpath-archive
   ```

## Step 7: Remove Monitoring

1. **Remove Grafana dashboards**:
   - Export dashboard JSON for archival
   - Delete from Grafana
   - Remove dashboard link from catalog annotations

2. **Remove PagerDuty service**:
   - Disable the service in PagerDuty
   - Remove PagerDuty service ID from catalog annotations
   - Archive any runbooks associated with the service

3. **Remove alerting rules**:
   - Remove from Prometheus/Alertmanager configurations
   - Remove from monitoring dashboards

## Step 8: Verify Retirement

1. **Check catalog**:
   - Service shows as `retired` lifecycle
   - No active dependencies
   - Documentation archived

2. **Check infrastructure**:
   - No running pods
   - No active claims
   - No traffic to service endpoints

3. **Check monitoring**:
   - No active alerts
   - Dashboards archived or removed
   - No data collection

4. **Close tracking issue**:
   - Mark all items as completed
   - Add final summary
   - Close the issue

---

## Rollback: If Retirement Needs to Be Reversed

If the service needs to be restored:

1. **Restore from archive**:
   ```bash
   # Unarchive repository
   gh repo unarchive goldenpath/my-service
   ```

2. **Restore deployment**:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl scale deployment/my-service -n production --replicas=2
   ```

3. **Update catalog**:
   ```yaml
   spec:
     lifecycle: production
   ```

4. **Notify stakeholders**:
   - Send reactivation notice
   - Update status page

---

## Checklist

- [ ] Dependencies assessed and documented
- [ ] Stakeholders notified
- [ ] Migration completed for all dependents
- [ ] Traffic reduced to zero
- [ ] Deployment removed from Kubernetes
- [ ] Infrastructure claims deleted
- [ ] CI/CD pipelines removed
- [ ] Catalog entity updated to `retired`
- [ ] Documentation archived
- [ ] Repository archived
- [ ] Monitoring removed
- [ ] Tracking issue closed
