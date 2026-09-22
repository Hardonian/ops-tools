# Catalog Ownership Model

Domain > System > Component hierarchy with ownership relationships.

```mermaid
graph TB
    subgraph Domains["🏢 Domains"]
        D1["Domain: Payments<br/>Owner: VP Engineering"]
        D2["Domain: User Management<br/>Owner: VP Engineering"]
        D3["Domain: Analytics<br/>Owner: VP Data"]
    end

    subgraph Systems["📦 Systems"]
        S1["System: Payment Processing<br/>Owner: team-payments"]
        S2["System: Fraud Detection<br/>Owner: team-security"]
        S3["System: User Auth<br/>Owner: team-platform"]
        S4["System: User Profiles<br/>Owner: team-platform"]
        S5["System: Data Pipeline<br/>Owner: team-data"]
    end

    subgraph Components["🔧 Components"]
        C1["Component: payment-api<br/>Owner: team-payments"]
        C2["Component: payment-processor<br/>Owner: team-payments"]
        C3["Component: payment-webhook<br/>Owner: team-payments"]
        C4["Component: fraud-engine<br/>Owner: team-security"]
        C5["Component: fraud-scoring<br/>Owner: team-security"]
        C6["Component: auth-service<br/>Owner: team-platform"]
        C7["Component: user-service<br/>Owner: team-platform"]
        C8["Component: profile-api<br/>Owner: team-platform"]
        C9["Component: data-collector<br/>Owner: team-data"]
        C10["Component: data-transformer<br/>Owner: team-data"]
    end

    subgraph APIs["🔌 APIs"]
        A1["API: payment-api-v1<br/>Owner: team-payments"]
        A2["API: auth-api-v1<br/>Owner: team-platform"]
        A3["API: user-api-v1<br/>Owner: team-platform"]
    end

    subgraph Resources["🗄️ Resources"]
        R1["Resource: payment-db<br/>Type: PostgreSQL"]
        R2["Resource: user-db<br/>Type: PostgreSQL"]
        R3["Resource: events-queue<br/>Type: SQS"]
        R4["Resource: data-lake<br/>Type: S3"]
    end

    %% Domain to System relationships
    D1 --> S1
    D1 --> S2
    D2 --> S3
    D2 --> S4
    D3 --> S5

    %% System to Component relationships
    S1 --> C1
    S1 --> C2
    S1 --> C3
    S2 --> C4
    S2 --> C5
    S3 --> C6
    S4 --> C7
    S4 --> C8
    S5 --> C9
    S5 --> C10

    %% Component to API relationships
    C1 --> A1
    C6 --> A2
    C7 --> A3

    %% Component to Resource relationships
    C2 --> R1
    C7 --> R2
    C1 --> R3
    C9 --> R4

    %% Dependency relationships
    C4 -.->|depends on| C1
    C5 -.->|depends on| C1
    C3 -.->|depends on| C2
    C8 -.->|depends on| C7

    style Domains fill:#e3f2fd,stroke:#1565c0
    style Systems fill:#e8f5e9,stroke:#2e7d32
    style Components fill:#fff3e0,stroke:#ef6c00
    style APIs fill:#fce4ec,stroke:#c62828
    style Resources fill:#f3e5f5,stroke:#6a1b9a
```

## Ownership Model Description

### Hierarchy

```
Domain (Business Area)
  └── System (Logical Grouping)
       └── Component (Deployable Service)
            ├── API (Exposed Interface)
            ├── Resource (Infrastructure Dependency)
            └── Library (Shared Code)
```

### Entity Types

| Entity | Purpose | Example |
|--------|---------|---------|
| **Domain** | Top-level business area | Payments, User Management, Analytics |
| **System** | Logical grouping within a domain | Payment Processing, User Auth |
| **Component** | Individual deployable service | payment-api, auth-service |
| **API** | Exposed interface contract | payment-api-v1 |
| **Resource** | Infrastructure dependency | PostgreSQL database, S3 bucket |
| **Library** | Shared code package | @goldenpath/utils |

### Ownership Rules

1. **Every entity must have an owner** — No orphaned components
2. **Owner must be a Group entity** — Teams, not individuals
3. **Ownership is explicit** — Defined in `catalog-info.yaml`
4. **Ownership is verifiable** — Scorecard checks owner is valid

### Ownership YAML

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-api
spec:
  owner: team-payments           # Must be a registered Group
  system: payment-system         # Must be a registered System
  providesApis:
    - payment-api-v1             # Must be registered API entities
  dependsOn:
    - component:payment-processor
    - resource:payment-db
```

### Dependency Graph

```
payment-api ──depends on──▶ payment-processor ──depends on──▶ payment-db
      │
      └──provides──▶ payment-api-v1

fraud-engine ──depends on──▶ payment-api
fraud-scoring ──depends on──▶ payment-api

payment-webhook ──depends on──▶ payment-processor
```

### Impact Analysis

When a component changes, the dependency graph enables:
- **Blast radius calculation** — How many services are affected?
- **Owner notification** — Who needs to be alerted?
- **Change assessment** — What APIs are impacted?
- **Rollback planning** — What needs to be reverted?
