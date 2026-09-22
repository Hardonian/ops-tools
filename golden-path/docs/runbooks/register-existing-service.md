# Runbook: Register an Existing Service in the Catalog

This runbook walks you through adding an existing (already-deployed) service to the Backstage catalog.

**Estimated time**: 15-30 minutes
**Prerequisites**: Access to the service's GitHub repository, Backstage access

---

## Step 1: Create catalog-info.yaml

Create a `catalog-info.yaml` file in the **root** of your service's GitHub repository:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-existing-service
  description: "Brief description of what this service does"
  annotations:
    github.com/project-slug: org/my-existing-service
    backstage.io/techdocs-ref: dir:.
    # Optional but recommended:
    pagerduty.com/service-id: PXXXXXX
    grafana.com/dashboard-id: "12345"
    backstage.io/techdocs-ref: dir:./docs
    api.github.com/repo-url: https://github.com/org/my-existing-service
  tags:
    - java          # or python, node, go, etc.
    - spring-boot   # framework tag
    - team-xxx      # team tag for filtering
  links:
    - url: https://grafana.internal.example.com/d/my-service
      title: Service Dashboard
      icon: dashboard
    - url: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs
      title: CloudWatch Logs
      icon: cloudwatch
  lifecycle: production  # experimental | development | production | deprecated
spec:
  type: service         # service | website | library | api | other
  owner: team-xxx       # Must match a registered Group entity in the catalog
  system: my-system     # Parent system (must exist as a System entity)
  providesApis:         # Optional: list of API entities this component provides
    - my-api-v1
  dependsOn:            # Optional: list of dependencies
    - component:database-postgres
    - resource:aws-s3-bucket-name
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `metadata.name` | Lowercase kebab-case, globally unique | `payment-processor` |
| `metadata.description` | Human-readable description | `Processes payment transactions` |
| `spec.type` | Component type | `service` |
| `spec.owner` | Must be a registered Group entity | `team-payments` |
| `spec.lifecycle` | Current lifecycle stage | `production` |

### Optional But Recommended

| Field | Description | Why |
|-------|-------------|-----|
| `metadata.annotations.github.com/project-slug` | GitHub repo link | Enables source code navigation |
| `metadata.annotations.backstage.io/techdocs-ref` | TechDocs location | Enables documentation rendering |
| `metadata.tags` | Searchable tags | Enables filtering and discovery |
| `metadata.links` | External service links | Quick access to dashboards, logs |
| `spec.system` | Parent system | Enables architecture visualization |
| `spec.providesApis` | API contracts | Enables dependency graph |
| `spec.dependsOn` | Dependencies | Enables impact analysis |

## Step 2: Validate YAML Locally

Before committing, validate the YAML syntax:

```bash
# Using yq (recommended)
yq eval catalog-info.yaml

# Or using Python
python3 -c "import yaml; yaml.safe_load(open('catalog-info.yaml'))"

# Verify against Backstage schema
npx @backstage/cli repo-info catalog validate catalog-info.yaml
```

## Step 3: Add to Location Entity (If Applicable)

For services in shared repositories or monorepos, register via a **Location entity**:

1. Navigate to the platform team's catalog configuration repo:
   ```bash
   git clone https://github.com/goldenpath/catalog-locations.git
   ```

2. Create or edit the location file for your team:
   ```yaml
   # locations/team-payments.yaml
   apiVersion: backstage.io/v1alpha1
   kind: Location
   metadata:
     name: team-payments
     description: All services owned by the payments team
     tags:
       - team-payments
   spec:
     targets:
       - https://github.com/org/my-existing-service/blob/main/catalog-info.yaml
       - https://github.com/org/another-service/blob/main/catalog-info.yaml
   ```

3. Commit and push the location file

## Step 4: Commit and Push

```bash
# In your service repository
git add catalog-info.yaml
git commit -m "chore: register service in Backstage catalog"
git push origin main
```

## Step 5: Verify in Backstage UI

1. Navigate to `https://backstage.internal.example.com/catalog`
2. Click **Components** in the left sidebar
3. Search for your service name
4. Verify:
   - ✅ Entity appears in the catalog
   - ✅ Owner is displayed correctly
   - ✅ Lifecycle shows the correct stage
   - ✅ Links to source code work
   - ✅ TechDocs renders (if configured)

## Step 6: Verify Catalog Relationships

1. Open your component page in Backstage
2. Click **Has Components** / **Depends On** tabs
3. Verify:
   - Parent system relationship is correct
   - Dependencies are linked to actual entities
   - API contracts are properly associated

## Step 7: Run Scorecard

1. Navigate to your component → **Scorecard**
2. Review the production readiness checks
3. Target: Score ≥ 80/100
4. Address any failures (see [fix-scorecard-failure](fix-scorecard-failure.md))

---

## Common Issues

### Entity Not Appearing

1. **Check YAML syntax**: Run `yq eval catalog-info.yaml` to validate
2. **Check name uniqueness**: No other entity can have the same name
3. **Check owner exists**: `spec.owner` must match a registered Group entity
4. **Check repository**: Catalog auto-refreshes from Git; wait 5-10 minutes or trigger manual refresh
5. **Check logs**: `kubectl logs -n backstage deployment/backstage-catalog`

### Owner Not Found

If the owner group doesn't exist, create it:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: team-payments
  description: Payments team
  annotations:
    github.com/team-slug: org/payments
spec:
  type: team
  children: []  # Add individual user entities here
```

### TechDocs Not Rendering

1. Verify `backstage.io/techdocs-ref: dir:.` is set
2. Ensure `docs/` directory exists with `mkdocs.yml` or equivalent
3. Check TechDocs build logs in Backstage

---

## Checklist

- [ ] `catalog-info.yaml` created with all required fields
- [ ] YAML validated locally
- [ ] Added to team location entity (if applicable)
- [ ] Committed and pushed to main branch
- [ ] Entity appears in Backstage catalog
- [ ] Owner, lifecycle, and system are correct
- [ ] Source code link works
- [ ] TechDocs renders (if configured)
- [ ] Scorecard score ≥ 80
