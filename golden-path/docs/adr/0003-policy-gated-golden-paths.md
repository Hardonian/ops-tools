# ADR-0003: Policy-Gated Golden Paths Using OPA + Kyverno

## Status

**Accepted** — June 2026

## Context

Without guardrails, teams bypass golden paths and accumulate technical debt:

- **Unregistered services**: Teams deploy services not in the catalog
- **Missing metadata**: Services lack ownership, documentation, or monitoring
- **Insecure deployments**: Services deployed without proper security policies
- **Non-compliant infrastructure**: Infrastructure provisioned outside approved patterns
- **No production readiness validation**: Services promoted to production without meeting standards

We need **automated policy enforcement** that:
- Validates service catalog entries against organizational standards
- Enforces Kubernetes deployment policies (security, resource limits, labels)
- Gates deployments based on production readiness scorecard results
- Provides clear, actionable feedback when policies fail

## Decision

We will use a **two-layer policy enforcement model**:

### Layer 1: OPA (Open Policy Agent) for Catalog & Application Policies

OPA evaluates policies against Backstage catalog entities and application configurations:

| Policy | Scope | Enforcement |
|--------|-------|-------------|
| `catalog.required-fields` | Catalog entities | Must have owner, lifecycle, type, description |
| `catalog.ownership-required` | Catalog entities | Owner must be a valid group entity |
| `catalog.docs-required` | Catalog entities | TechDocs must be configured |
| `catalog.scorecard-minimum` | Catalog entities | Production readiness score ≥ 80/100 |
| `app.image-policy` | Container images | Must use approved base images |
| `app.secret-management` | Application config | No hardcoded secrets; must use Vault/Sealed Secrets |

### Layer 2: Kyverno for Kubernetes Policies

Kyverno enforces admission control on Kubernetes resources:

| Policy | Scope | Action |
|--------|-------|--------|
| `require-labels` | Deployments, Services | Require `app.kubernetes.io/*` labels |
| `require-resource-limits` | Pods | CPU/memory limits must be set |
| `disallow-privileged` | Pods | No privileged containers |
| `require-network-policy` | Namespaces | Default deny ingress must exist |
| `enforce-image-registries` | Pods | Only pull from approved registries |
| `require-cost-center-label` | Namespaces | Billing metadata required |

### Policy Enforcement Points

```
Developer → Git Push → CI Validation (OPA) → PR Merge → Deploy to Dev → 
  Kyverno Admission → Promote to Staging → Scorecard Check (OPA) → 
  Deploy to Staging → Kyverno Admission → Promote to Prod → 
  Scorecard Gate (OPA) → Deploy to Production
```

## Consequences

### Positive
- **Policy-as-code**: Policies versioned in Git; changes reviewed via PRs
- **Shift-left feedback**: OPA validates in CI, catching issues before merge
- **Runtime enforcement**: Kyverno prevents non-compliant deployments at the API server
- **Clear remediation**: Policy violation messages include fix instructions
- **Auditability**: All policy decisions logged and queryable
- **Progressive enforcement**: Can start with `audit` mode, then switch to `enforce`

### Negative
- **Learning curve**: Teams need to understand Rego (OPA) and Kyverno policy syntax
- **Policy maintenance**: Policies must evolve as organizational standards change
- **False positives**: Overly strict policies can block legitimate deployments
- **Debugging complexity**: Two policy systems mean two places to troubleshoot
- **Performance**: Kyverno webhook adds latency to Kubernetes API calls (~50ms)

### Mitigations
- Start with `audit` mode for new policies; gather data before enforcing
- Provide clear policy violation messages with links to remediation docs
- Maintain a policy catalog with examples and test cases
- Monitor policy rejection rates; tune policies based on false positive data
- Regular policy review cadence (monthly) to retire outdated policies
