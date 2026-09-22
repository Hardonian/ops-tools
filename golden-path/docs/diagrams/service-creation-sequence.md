# Service Creation Sequence

Sequence diagram showing the flow from template selection to production deployment.

```mermaid
sequenceDiagram
    autonumber
    participant Dev as 👤 Developer
    participant UI as 🖥️ Backstage UI
    participant API as 🔌 Backstage API
    participant GitHub as 🐙 GitHub
    participant CI as 🔄 CI Pipeline
    participant ArgoCD as 📦 ArgoCD
    participant K8s as ☸️ Kubernetes
    participant OPA as 🛡️ OPA
    participant Catalog as 📚 Catalog

    Note over Dev,Catalog: Phase 1 — Template Selection & Scaffolding

    Dev->>UI: Select template from Create page
    UI->>API: POST /api/catalog/templates/{id}/execute
    API->>API: Validate template parameters
    
    API->>GitHub: Create repository from template
    GitHub-->>API: Repository created ✅
    
    API->>GitHub: Scaffold files (catalog-info.yaml, CI, Dockerfile)
    GitHub-->>API: Files pushed ✅
    
    API->>Catalog: Register catalog entity
    Catalog-->>API: Entity registered ✅
    
    API-->>UI: Scaffolding complete
    UI-->>Dev: Show link to new repository

    Note over Dev,Catalog: Phase 2 — Development & CI

    Dev->>GitHub: Push code changes
    GitHub->>CI: Trigger CI pipeline
    
    CI->>CI: Build & test
    CI->>OPA: Validate against policies
    OPA-->>CI: Policy check passed ✅
    
    CI->>GitHub: Create Docker image
    CI->>ArgoCD: Update deployment manifest
    CI-->>GitHub: CI passed ✅

    Note over Dev,Catalog: Phase 3 — Deployment to Dev

    ArgoCD->>K8s: Sync to dev namespace
    K8s->>OPA: Admission control check
    OPA-->>K8s: Policies validated ✅
    
    K8s->>K8s: Create pods, services
    K8s-->>ArgoCD: Deployment successful ✅
    
    ArgoCD->>Catalog: Update deployment status
    Catalog-->>ArgoCD: Status updated ✅

    Note over Dev,Catalog: Phase 4 — Validation & Promotion

    Dev->>UI: Check scorecard
    UI->>API: GET /api/catalog/entities/{name}/scorecard
    API->>Catalog: Fetch entity & run checks
    Catalog-->>API: Score: 92/100 ✅
    API-->>UI: Display scorecard
    UI-->>Dev: Score: 92/100 ✅

    Dev->>UI: Request staging deployment
    UI->>API: POST /api/promotion/request
    API->>API: Create approval request
    API-->>UI: Approval pending

    Note over Dev,Catalog: Phase 5 — Production Deployment

    Dev->>GitHub: Merge PR to main
    GitHub->>CI: Trigger production CI
    CI->>CI: Build, test, security scan
    CI->>GitHub: Create release tag
    CI-->>ArgoCD: Update production manifest
    
    ArgoCD->>K8s: Sync to production namespace
    K8s->>OPA: Admission control check
    OPA-->>K8s: Policies validated ✅
    
    K8s->>K8s: Rolling update
    K8s-->>ArgoCD: Deployment successful ✅
    
    ArgoCD->>Catalog: Update lifecycle to production
    Catalog-->>ArgoCD: Lifecycle updated ✅

    Note over Dev,Catalog: Service is now live in production 🎉
```

## Phase Details

### Phase 1: Template Selection & Scaffolding
- Developer selects template from Backstage UI
- Backstage API validates parameters against template schema
- Repository created on GitHub with all scaffolding
- Catalog entity automatically registered
- CI/CD pipelines pre-configured

### Phase 2: Development & CI
- Developer pushes code changes
- CI pipeline triggers automatically
- Build, lint, and test stages execute
- OPA validates against organizational policies
- Docker image built and pushed to registry

### Phase 3: Deployment to Dev
- ArgoCD detects manifest change
- Kyverno validates admission control policies
- Pods created in dev namespace
- Health checks verified
- Deployment status recorded in catalog

### Phase 4: Validation & Promotion
- Scorecard runs against the service
- All 10 production readiness checks evaluated
- Score ≥ 80 required for promotion
- Staging deployment requires approval

### Phase 5: Production Deployment
- PR merge triggers production deployment
- Full CI pipeline runs (build, test, security scan)
- ArgoCD syncs to production namespace
- Rolling update with zero downtime
- Service lifecycle updated to `production`
