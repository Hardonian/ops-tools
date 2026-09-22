# ADR-0002: Catalog as the Platform Control Plane

## Status

**Accepted** — June 2026

## Context

Service metadata is currently scattered across multiple sources:

- **Ownership**: Defined in Jira projects but not linked to services
- **Architecture**: Drawn in Lucidchart, often out of date
- **Dependencies**: Tracked in spreadsheets maintained by platform team
- **Deployment info**: In CI/CD pipelines but not queryable centrally
- **Health metrics**: Across Grafana, Datadog, and PagerDuty — no unified view

This fragmentation causes:
- **Incident response delays**: On-call engineers can't quickly identify service owners
- **Architecture drift**: Design docs diverge from actual implementation
- **Policy blindness**: No way to enforce standards across all services consistently
- **Onboarding friction**: New engineers spend weeks learning "what exists"

We need a **single source of truth** for all service metadata that other platform components can query, validate, and enforce policies against.

## Decision

We will use the **Backstage Software Catalog** as the **single source of truth (SSOT)** for all service metadata across the platform.

The catalog will enforce a **catalog-first** model:

1. **All services must be registered** in the catalog before they can be deployed to production
2. **Catalog entities** are the canonical source for ownership, lifecycle, dependencies, and metadata
3. **Other systems query the catalog** rather than maintaining their own service registries
4. **Policy engines validate** catalog entities against organizational standards

### Catalog Entity Model

Each service must have a `catalog-info.yaml` with:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  description: Short description of the service
  annotations:
    github.com/project-slug: org/my-service
    backstage.io/techdocs-ref: dir:.
  tags:
    - java
    - spring-boot
    - team-platform
  links:
    - url: https://grafana.example.com/d/my-service
      title: Grafana Dashboard
      icon: dashboard
  lifecycle: production
spec:
  type: service
  owner: team-platform
  system: payment-system
  providesApis:
    - payment-api
  dependsOn:
    - component:database-postgres
    - resource:aws-s3-payments
```

### Ownership Model

- **Domain**: Top-level business area (e.g., "Payments", "User Management")
- **System**: Logical grouping of components within a domain (e.g., "Payment Processing")
- **Component**: Individual deployable service or library
- **API**: Exposed interface contract
- **Resource**: Infrastructure dependency (database, bucket, queue)

## Consequences

### Positive
- **Single source of truth**: All queries about "what exists" resolve to one place
- **Policy enforcement**: OPA and Kyverno can validate catalog entries against standards
- **Automated discovery**: Service catalog populates dashboards, alerting, and documentation
- **Ownership clarity**: Every component has an explicit owner; no ambiguity during incidents
- **Dependency visibility**: Graph of service dependencies enables impact analysis
- **Compliance**: Audit trail of service metadata changes via Git

### Negative
- **Mandatory registration**: Teams must maintain `catalog-info.yaml`; adds overhead per service
- **Catalog drift risk**: Metadata becomes stale if teams don't update after changes
- **Migration burden**: Existing services (150+) must be registered retroactively
- **Single point of failure**: Catalog availability becomes critical for platform operations

### Mitigations
- Backstage catalog refreshes metadata automatically from Git on a configurable interval
- Scorecard checks verify catalog completeness (see ADR-0003)
- Location entities batch-register services from team-owned repositories
- Catalog data stored in PostgreSQL with regular backups
