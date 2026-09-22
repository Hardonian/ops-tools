# Runbook: Fix Scorecard Failures

This runbook provides specific remediation for each of the 10 production readiness scorecard checks.

**Estimated time**: Varies per check (5-60 minutes each)
**Prerequisites**: Access to your service repository, Backstage access

---

## Scorecard Overview

| # | Check | Points | Threshold |
|---|-------|--------|-----------|
| 1 | Catalog Info Complete | 10 | All required fields present |
| 2 | Documentation Present | 10 | TechDocs renders successfully |
| 3 | CI Pipeline Passing | 10 | Green build on default branch |
| 4 | Ownership Configured | 10 | Valid owner assigned |
| 5 | Monitoring Configured | 10 | Dashboard + alerts linked |
| 6 | Resource Limits Set | 10 | CPU/memory limits defined |
| 7 | Security Scanning | 10 | SAST/dependency scanning enabled |
| 8 | Dependency Pinning | 10 | All dependencies pinned to versions |
| 9 | Health Probes | 10 | Liveness + readiness probes configured |
| 10 | Graceful Shutdown | 10 | Signal handler implemented |
| **Total** | | **100** | **Target: ≥ 80** |

---

## Check 1: Catalog Info Complete (10 points)

**Failure message**: `catalog-info.yaml missing required fields`

**Diagnostic**:
```bash
# Check if file exists
cat catalog-info.yaml | head -20

# Validate required fields
yq '.metadata.name' catalog-info.yaml
yq '.metadata.description' catalog-info.yaml
yq '.spec.owner' catalog-info.yaml
yq '.spec.lifecycle' catalog-info.yaml
yq '.spec.type' catalog-info.yaml
```

**Remediation**:
1. Ensure `catalog-info.yaml` exists in repo root
2. Add all required fields:
   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: Component
   metadata:
     name: <service-name>        # REQUIRED
     description: <description>   # REQUIRED
     annotations:
       github.com/project-slug: org/service  # RECOMMENDED
   spec:
     type: service               # REQUIRED
     owner: team-xxx             # REQUIRED - must be valid Group entity
     lifecycle: production       # REQUIRED
     system: my-system           # RECOMMENDED
   ```
3. Commit and push
4. Wait for catalog refresh (5-10 minutes) or trigger manual refresh in Backstage

---

## Check 2: Documentation Present (10 points)

**Failure message**: `TechDocs not configured or not rendering`

**Diagnostic**:
```bash
# Check if docs directory exists
ls -la docs/

# Check TechDocs config
cat app-config.yaml | grep -A 10 techdocs

# Check mkdocs config
cat mkdocs.yml
```

**Remediation**:
1. Create `docs/` directory if missing
2. Add `docs/index.md` with at minimum:
   ```markdown
   # Service Name
   
   ## Overview
   Brief description of what this service does.
   
   ## API Reference
   Document your API endpoints.
   
   ## Development
   How to run locally.
   ```
3. Add TechDocs annotation to `catalog-info.yaml`:
   ```yaml
   metadata:
     annotations:
       backstage.io/techdocs-ref: dir:.
   ```
4. Add `mkdocs.yml` if using MkDocs (default for most templates)
5. Commit and push
6. Verify TechDocs renders in Backstage

---

## Check 3: CI Pipeline Passing (10 points)

**Failure message**: `CI pipeline not passing on default branch`

**Diagnostic**:
```bash
# Check latest CI runs
gh run list --repo goldenpath/your-service --limit 5

# Check if workflow file exists
cat .github/workflows/ci.yml
```

**Remediation**:
1. Ensure `.github/workflows/ci.yml` exists (should be auto-created by template)
2. If missing, create a basic CI workflow:
   ```yaml
   name: CI
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run lint
         - run: npm test
         - run: npm run build
   ```
3. Fix any failing test or lint errors
4. Ensure all required secrets are configured in GitHub
5. Push and verify CI passes

---

## Check 4: Ownership Configured (10 points)

**Failure message**: `No valid owner assigned to component`

**Diagnostic**:
```bash
# Check owner in catalog-info.yaml
yq '.spec.owner' catalog-info.yaml

# Check if owner group exists in catalog
# (via Backstage UI: Catalog → Groups → search for team name)
```

**Remediation**:
1. Verify `spec.owner` is set in `catalog-info.yaml`
2. Verify the owner matches a registered Group entity in Backstage
3. If the group doesn't exist, request platform team to create it:
   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: Group
   metadata:
     name: team-payments
   spec:
     type: team
   ```
4. Update your service's `catalog-info.yaml`:
   ```yaml
   spec:
     owner: team-payments
   ```

---

## Check 5: Monitoring Configured (10 points)

**Failure message**: `No dashboard or alerting configured`

**Diagnostic**:
```bash
# Check annotations for monitoring links
yq '.metadata.annotations' catalog-info.yaml | grep -E "grafana|pagerduty|datadog"
```

**Remediation**:
1. **Create Grafana Dashboard**:
   - Use the platform standard dashboard template (import ID: `12345`)
   - Update service name labels
   - Add dashboard link to `catalog-info.yaml`:
     ```yaml
     metadata:
       annotations:
         grafana.com/dashboard-id: "12345"
     ```

2. **Configure PagerDuty Alerts**:
   - Create a PagerDuty service for your team
   - Configure escalation policy
   - Add PagerDuty annotation:
     ```yaml
     metadata:
       annotations:
         pagerduty.com/service-id: PXXXXXX
     ```

3. **Add custom alerting** (if applicable):
   - Define SLOs in `slo/` directory
   - Configure alerting rules in monitoring tool

---

## Check 6: Resource Limits Set (10 points)

**Failure message**: `No resource limits defined for Kubernetes deployment`

**Diagnostic**:
```bash
# Check deployment manifests
cat k8s/deployment.yaml | grep -A 10 resources

# Or check Helm values
cat helm/values.yaml | grep -A 10 resources
```

**Remediation**:
1. Add resource limits to your Kubernetes manifests or Helm values:
   ```yaml
   # k8s/deployment.yaml or helm values.yaml
   resources:
     requests:
       cpu: 100m
       memory: 128Mi
     limits:
       cpu: 500m
       memory: 512Mi
   ```

2. If using Helm, add to `values.yaml`:
   ```yaml
   resources:
     requests:
       cpu: 100m
       memory: 128Mi
     limits:
       cpu: 500m
       memory: 512Mi
   ```

3. Commit and redeploy

---

## Check 7: Security Scanning (10 points)

**Failure message**: `No security scanning configured`

**Diagnostic**:
```bash
# Check for security scanning configs
cat .github/workflows/ci.yml | grep -E "trivy|snyk|semgrep|codeql"
cat .snyk
cat .semgrep.yml
```

**Remediation**:
1. **Enable CodeQL** (recommended):
   - Go to GitHub → Settings → Code security and analysis
   - Enable CodeQL analysis for your repository

2. **Add Trivy to CI**:
   ```yaml
   # Add to .github/workflows/ci.yml
   - name: Run Trivy vulnerability scanner
     uses: aquasecurity/trivy-action@master
     with:
       scan-type: 'fs'
       scan-ref: '.'
       severity: 'CRITICAL,HIGH'
   ```

3. **Add Snyk** (alternative):
   ```yaml
   - name: Run Snyk
     uses: snyk/actions/node@master
     env:
       SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
   ```

4. Commit and push

---

## Check 8: Dependency Pinning (10 points)

**Failure message**: `Unpinned dependencies detected`

**Diagnostic**:
```bash
# Check for unpinned dependencies in package.json
cat package.json | grep -E "\"[*]|\">=|\">"

# Or requirements.txt
cat requirements.txt | grep -v "=="

# Or go.mod
grep -v "//" go.mod | head -20
```

**Remediation**:
1. **Node.js**: Pin exact versions in `package.json`:
   ```json
   {
     "dependencies": {
       "express": "4.18.2",      // ✅ Pinned
       "lodash": "4.17.21"       // ✅ Pinned
     }
   }
   ```
   Avoid: `"express": "^4.18.2"` (unpinned)

2. **Python**: Pin exact versions in `requirements.txt`:
   ```
   flask==3.0.0          # ✅ Pinned
   gunicorn==21.2.0      # ✅ Pinned
   ```
   Avoid: `flask>=3.0.0` or `flask~=3.0` (unpinned)

3. **Go**: Go modules are inherently pinned (go.mod + go.sum)

4. Commit and push

---

## Check 9: Health Probes (10 points)

**Failure message**: `No liveness or readiness probes configured`

**Diagnostic**:
```bash
# Check Kubernetes manifests
cat k8s/deployment.yaml | grep -A 5 livenessProbe
cat k8s/deployment.yaml | grep -A 5 readinessProbe

# Check Helm templates
cat helm/templates/deployment.yaml | grep -A 5 livenessProbe
```

**Remediation**:
1. Add health endpoint to your application (if not already present):
   ```javascript
   // Node.js example
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

   app.get('/ready', (req, res) => {
     // Check database connection, cache, etc.
     if (isDatabaseConnected()) {
       res.json({ status: 'ready' });
     } else {
       res.status(503).json({ status: 'not ready' });
     }
   });
   ```

2. Add probes to Kubernetes manifests:
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
     initialDelaySeconds: 15
     periodSeconds: 10
     timeoutSeconds: 5
     failureThreshold: 3
   readinessProbe:
     httpGet:
       path: /ready
       port: 8080
     initialDelaySeconds: 5
     periodSeconds: 5
     timeoutSeconds: 3
     failureThreshold: 3
   ```

3. Commit and redeploy

---

## Check 10: Graceful Shutdown (10 points)

**Failure message**: `No graceful shutdown handler implemented`

**Diagnostic**:
```bash
# Search for signal handlers
grep -r "SIGTERM\|SIGINT\|graceful" src/
```

**Remediation**:
1. Add signal handler to your application:
   ```javascript
   // Node.js example
   process.on('SIGTERM', () => {
     console.log('SIGTERM received. Starting graceful shutdown...');
     server.close(() => {
       console.log('All connections closed. Exiting.');
       process.exit(0);
     });
     
     // Force exit after 30 seconds
     setTimeout(() => {
       console.error('Forced shutdown after timeout');
       process.exit(1);
     }, 30000);
   });
   ```

   ```python
   # Python example
   import signal
   import sys

   def graceful_shutdown(signum, frame):
       print(f"Received signal {signum}. Starting graceful shutdown...")
       # Close database connections
       # Stop accepting new requests
       # Wait for in-flight requests to complete
       sys.exit(0)

   signal.signal(signal.SIGTERM, graceful_shutdown)
   signal.signal(signal.SIGINT, graceful_shutdown)
   ```

2. Ensure your process:
   - Stops accepting new connections
   - Waits for in-flight requests to complete
   - Closes database connections
   - Exits cleanly

3. Set `terminationGracePeriodSeconds` in your deployment:
   ```yaml
   spec:
     template:
       spec:
         terminationGracePeriodSeconds: 30
   ```

4. Commit and redeploy

---

## After Fixing All Failures

1. **Verify scorecard** in Backstage:
   - Navigate to your component → Scorecard
   - Confirm all 10 checks pass (100/100)
   - Or at minimum: score ≥ 80/100

2. **Request production deployment** if score ≥ 80:
   - Create promotion request in Backstage
   - Tag team lead for approval

3. **Monitor for regressions**:
   - Scorecard runs on every catalog refresh
   - Failures appear in the component page
   - Alerts notify owners of score drops

---

## Quick Reference: Scorecard Commands

```bash
# Check scorecard via CLI (if available)
backstage-cli scorecard get component:my-service

# Trigger catalog refresh
curl -X POST https://backstage.internal.example.com/api/catalog/refresh

# Check component health
kubectl get pods -n backstage | grep my-service
```
