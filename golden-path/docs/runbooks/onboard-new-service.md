# Runbook: Onboard a New Service

This runbook walks you through creating a new service from a template, registering it in the catalog, and deploying it to development.

**Estimated time**: 30-60 minutes
**Prerequisites**: GitHub access, Kubernetes namespace access, Backstage access

---

## Step 1: Create Service from Template

1. Navigate to the Backstage portal: `https://backstage.internal.example.com`
2. Click **Create** in the top navigation
3. Select the appropriate template for your language/framework:
   - `node-typescript-service` — TypeScript/Node.js services
   - `java-spring-boot-service` — Java Spring Boot services
   - `python-fastapi-service` — Python FastAPI services
   - `go-gin-service` — Go Gin services
4. Fill in the template parameters:
   - **Service name**: Use lowercase kebab-case (e.g., `payment-processor`)
   - **Description**: One-line description of the service
   - **Owner team**: Select from the group dropdown (e.g., `team-payments`)
   - **Domain**: Select the business domain (e.g., `payments`)
   - **System**: Select the parent system (e.g., `payment-system`)
   - **Repository owner**: Your GitHub org (default: `goldenpath`)
5. Click **Create**
6. Wait for the scaffolding to complete (typically 1-2 minutes)
7. Click the link to your new GitHub repository

## Step 2: Verify Catalog Registration

1. Back to the portal, navigate to **Catalog** → **Components**
2. Search for your service name
3. Verify the entity appears with:
   - Correct owner displayed
   - Lifecycle set to `experimental`
   - Type set to `service`
   - Correct system assignment
4. If the entity is missing, check that `catalog-info.yaml` exists in your repo root

## Step 3: Configure Ownership

1. Open `catalog-info.yaml` in your repository
2. Verify and update the `spec.owner` field:
   ```yaml
   spec:
     owner: team-payments  # Must match a registered Group entity
   ```
3. Add relevant annotations:
   ```yaml
   metadata:
     annotations:
       github.com/project-slug: goldenpath/payment-processor
       backstage.io/techdocs-ref: dir:.
       pagerduty.com/service-id: PXXXXXX
       grafana.com/dashboard-id: "12345"
   ```
4. Commit and push changes

## Step 4: Set Up CI/CD

1. **GitHub Actions** (default for new services):
   - `.github/workflows/ci.yml` is pre-configured from the template
   - Verifies build, lint, test on every PR
   - Deploys to dev on merge to `main`

2. **Verify CI pipeline**:
   ```bash
   gh run list --repo goldenpath/payment-processor --limit 5
   ```
   - Confirm the first CI run succeeds

3. **Configure deployment environments**:
   - Dev: Automatic on merge to `main`
   - Staging: Manual trigger or automatic after dev health check
   - Production: Manual trigger with approval gate

## Step 5: Set Up Monitoring & Alerts

1. **Grafana Dashboard**:
   - Navigate to Grafana → Dashboards → Import
   - Use the platform template dashboard (ID: `12345`)
   - Update the datasource and service name labels
   - Add the dashboard link to `catalog-info.yaml` annotations

2. **PagerDuty Service**:
   - Create a PagerDuty service in the `payments` service directory
   - Set escalation policy to your team's on-call rotation
   - Add the PagerDuty service ID to `catalog-info.yaml` annotations

3. **SLO Configuration** (if applicable):
   - Add SLO definition to `slo/` directory in your repo
   - Commit and verify SLO appears in the SLO dashboard

## Step 6: Write Documentation

1. **Create TechDocs**:
   ```bash
   # In your service repo
   mkdir -p docs
   ```
2. Create `docs/index.md`:
   ```markdown
   # payment-processor
   
   ## Overview
   [Describe what this service does]
   
   ## Architecture
   [Describe key components and data flow]
   
   ## API Reference
   [Document your API endpoints]
   
   ## Development
   [Local development instructions]
   
   ## Deployment
   [How to deploy, rollback, etc.]
   ```
3. Enable TechDocs in `app-config.yaml`:
   ```yaml
   techdocs:
     builder: local
     generator:
       runIn: docker
     publisher:
       type: local
   ```
4. Commit, push, and verify TechDocs renders in Backstage

## Step 7: Validate Production Readiness Scorecard

1. In Backstage, navigate to your component → **Scorecard**
2. Review the 10 production readiness checks (see [fix-scorecard-failure](fix-scorecard-failure.md) for remediation)
3. Target: Score ≥ 80/100 before requesting production deployment
4. Address any failing checks:
   - `catalog-info.yaml` completeness
   - Documentation present and renders
   - CI pipeline passing
   - Ownership configured
   - Monitoring configured
   - Resource limits set
   - Security scanning enabled
   - Dependency pinning
   - Liveness/readiness probes
   - Graceful shutdown handler

## Step 8: Deploy to Development

1. Merge your initial PR to `main`
2. Verify the CI pipeline triggers and passes
3. Verify the deployment to dev namespace:
   ```bash
   kubectl get pods -n dev-payment-processor
   ```
4. Verify health checks:
   ```bash
   kubectl port-forward -n dev-payment-processor svc/payment-processor 8080:8080
   curl http://localhost:8080/health
   ```
5. Run smoke tests against the dev endpoint

## Step 9: Request Staging Access

1. Once scorecard score ≥ 80 and dev deployment is healthy:
   - Create a promotion request in the Backstage portal
   - Attach link to your CI pipeline run
   - Tag your team lead for approval
2. After approval, deployment to staging proceeds automatically

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Service not appearing in catalog | Check `catalog-info.yaml` exists at repo root; verify YAML syntax |
| CI pipeline failing | Check GitHub Actions logs; common issues: missing secrets, test failures |
| Deployment pod in CrashLoopBackOff | Check logs: `kubectl logs -n dev-<name> -l app=<name>` |
| Health check failing | Verify `/health` endpoint exists and returns 200 |
| Scorecard below 80 | See [fix-scorecard-failure](fix-scorecard-failure.md) for per-check remediation |
