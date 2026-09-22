# ADR-0001: Use Backstage as the Developer Portal

## Status

**Accepted** — June 2026

## Context

Our engineering organization has grown to 40+ teams maintaining hundreds of services. Developers face significant friction when:

- **Discovering existing services**: No centralized catalog; tribal knowledge dominates
- **Creating new services**: Each team scaffolds differently; no standard templates
- **Finding documentation**: Docs scattered across Confluence, GitHub wikis, Notion, and READMEs
- **Understanding service ownership**: Difficult to determine who owns what and how to get help
- **Tracking service health**: No unified view of service readiness, deployments, or dependencies

We evaluated several options:
1. **Internal tooling** — Build a custom portal. Too expensive to build and maintain given our team size.
2. **Backstage (Spotify OSS)** — Open-source, plugin-based, backed by CNCF, active community
3. **Port** — SaaS developer portal, vendor lock-in concerns, less customizable
4. **Cortex** — SaaS, good scorecards but limited self-service capabilities

Requirements for the chosen platform:
- Service catalog with ownership and metadata
- Software templates for standardized scaffolding
- TechDocs for centralized documentation
- Extensible plugin architecture
- Self-hosted with full data control
- Active open-source community and CNCF backing

## Decision

We will use **Backstage** as our internal developer portal, self-hosted on our Kubernetes cluster.

Key aspects of this decision:
- Backstage serves as the **primary interface** for developers interacting with the platform
- We will adopt the **Software Catalog**, **Software Templates**, and **TechDocs** core features
- We will extend Backstage with custom plugins as needed (e.g., scorecard integration, Crossplane claims UI)
- Backstage will be deployed via Helm charts with PostgreSQL as the backing store

## Consequences

### Positive
- **Plugin ecosystem**: 100+ community plugins available (Kubernetes, CI/CD, cost insights, security)
- **Single pane of glass**: One place to discover, create, and manage all services
- **TechDocs**: Docs-as-code model keeps documentation close to source
- **Software Templates**: Standardized scaffolding reduces time-to-first-deploy
- **CNCF backing**: Long-term viability with strong community and vendor support
- **Extensible**: TypeScript plugin architecture allows custom integrations

### Negative
- **TypeScript requirement**: Custom plugin development requires TypeScript expertise; onboarding needed
- **Self-hosted operational burden**: We own upgrades, security patches, and scaling
- **Frontend complexity**: React-based SPA requires frontend engineering effort for customization
- **Catalog hygiene**: Catalog accuracy depends on teams maintaining their `catalog-info.yaml` files
- **Initial setup effort**: Significant configuration required to integrate with existing tooling

### Risks
- Catalog drift if teams neglect metadata updates (mitigated by policy gates and scorecards)
- Backstage version upgrades may require plugin compatibility testing
- Large plugin footprint can impact performance if not managed carefully
