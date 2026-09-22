# Policy Gate Flow

How policies gate deployments across the platform.

```mermaid
flowchart TD
    subgraph Developer["👤 Developer"]
        A[Write Code] --> B[Push to GitHub]
    end

    subgraph CI["🔄 CI Pipeline"]
        B --> C[Build & Test]
        C --> D{OPA Catalog Validation}
        D -->|Pass| E[Create Docker Image]
        D -->|Fail| F[❌ Block Merge]
        F --> G[Fix Issues]
        G --> A
    end

    subgraph Git["🐙 GitHub"]
        E --> H[Create PR]
        H --> I[Code Review]
        I --> J{PR Approved?}
        J -->|No| G
        J -->|Yes| K[Merge to Main]
    end

    subgraph ArgoCD["📦 ArgoCD"]
        K --> L[Detect Manifest Change]
        L --> M[Sync to Dev Namespace]
    end

    subgraph KyvernoDev["🛡️ Kyverno - Dev"]
        M --> N{Admission Control}
        N -->|Pass| O[Deploy to Dev]
        N -->|Fail| P[❌ Block Deployment]
        P --> Q[Fix Policy Violations]
        Q --> A
    end

    subgraph Validation["📊 Validation"]
        O --> R[Run Scorecard]
        R --> S{Score ≥ 80?}
        S -->|No| T[Fix Scorecard Failures]
        T --> R
        S -->|Yes| U[Request Staging]
    end

    subgraph Approval["📋 Approval"]
        U --> V{Team Lead Approved?}
        V -->|No| W[Address Feedback]
        W --> U
        V -->|Yes| X[Deploy to Staging]
    end

    subgraph KyvernoStaging["🛡️ Kyverno - Staging"]
        X --> Y{Admission Control}
        Y -->|Pass| Z[Deploy to Staging]
        Y -->|Fail| AA[❌ Block Deployment]
        AA --> Q
    end

    subgraph Integration["🧪 Integration Testing"]
        Z --> AB[Integration Tests]
        AB --> AC{Tests Pass?}
        AC -->|No| AD[Fix Integration Issues]
        AD --> AB
        AC -->|Yes| AE[Request Production]
    end

    subgraph Production["🚀 Production"]
        AE --> AF{Production Approval}
        AF -->|No| AG[Address Concerns]
        AG --> AE
        AF -->|Yes| AH[Deploy to Production]
    end

    subgraph KyvernoProd["🛡️ Kyverno - Production"]
        AH --> AI{Admission Control}
        AI -->|Pass| AJ[✅ Deploy to Production]
        AI -->|Fail| AK[❌ Block Deployment]
        AK --> Q
    end

    subgraph Monitoring["📈 Monitoring"]
        AJ --> AL[Health Checks]
        AL --> AM{Healthy?}
        AM -->|Yes| AN[✅ Service Live]
        AM -->|No| AO[Rollback]
        AO --> A
    end

    style Developer fill:#e3f2fd
    style CI fill:#fff3e0
    style Git fill:#f3e5f5
    style ArgoCD fill:#e8f5e9
    style KyvernoDev fill:#fce4ec
    style Validation fill:#fff8e1
    style Approval fill:#e0f7fa
    style KyvernoStaging fill:#fce4ec
    style Integration fill:#f1f8e9
    style Production fill:#e8eaf6
    style KyvernoProd fill:#fce4ec
    style Monitoring fill:#e0f2f1
```

## Policy Enforcement Points

### Layer 1: OPA (Open Policy Agent)

**When**: During CI pipeline (shift-left)
**What**: Validates catalog entities, application configs, and deployment manifests

| Policy | Scope | Action |
|--------|-------|--------|
| `catalog.required-fields` | catalog-info.yaml | Block merge if missing |
| `catalog.ownership-required` | catalog-info.yaml | Block merge if invalid |
| `catalog.docs-required` | catalog-info.yaml | Block merge if missing |
| `catalog.scorecard-minimum` | scorecard | Block promotion if < 80 |
| `app.image-policy` | Dockerfile | Block if unapproved base |
| `app.secret-management` | config files | Block if hardcoded secrets |

### Layer 2: Kyverno (Kubernetes Admission Control)

**When**: At Kubernetes API server (runtime)
**What**: Validates Kubernetes resources before they're created/updated

| Policy | Scope | Action |
|--------|-------|--------|
| `require-labels` | Deployments, Services | Block if missing labels |
| `require-resource-limits` | Pods | Block if no limits set |
| `disallow-privileged` | Pods | Block privileged containers |
| `require-network-policy` | Namespaces | Block if no default deny |
| `enforce-image-registries` | Pods | Block unapproved registries |
| `require-cost-center-label` | Namespaces | Block if no billing tag |

### Policy Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `audit` | Log violations but allow | New policies, testing phase |
| `enforce` | Block on violation | Established policies |
| `dryrun` | Simulate enforcement | Policy development |

### Policy Violation Response

```
Violation Detected
    │
    ├─► CI Pipeline: Build fails, PR blocked
    │   └─► Developer sees error message with remediation steps
    │
    ├─► Kyverno: Admission denied
    │   └─► Deployment fails, error logged
    │   └─► Developer sees admission webhook error
    │
    └─► Scorecard: Score drops below threshold
        └─► Promotion blocked until score ≥ 80
        └─► Owner notified via dashboard
```

### Progressive Enforcement

1. **Phase 1 (Week 1-2)**: All new policies in `audit` mode
2. **Phase 2 (Week 3-4)**: Review violation data, tune policies
3. **Phase 3 (Week 5+)**: Switch to `enforce` mode
4. **Ongoing**: Monthly policy review, retire outdated policies
