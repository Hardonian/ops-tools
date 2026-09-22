# System Context Diagram

C4 Level 1: System context showing the Golden Path Platform and its interactions with users and external systems.

```mermaid
C4Context
    title Golden Path Platform - System Context

    Person(developer, "Developer", "Uses the platform to discover, create, and manage services")
    Person(sre, "SRE / Platform Engineer", "Manages platform infrastructure and policies")
    Person(leader, "Engineering Leader", "Views metrics, dashboards, and team health")

    System(goldenpath, "Golden Path Platform", "Internal developer portal providing self-service infrastructure, service catalog, and golden paths for service creation")

    System_Ext(github, "GitHub", "Source code, CI/CD pipelines, and repository management")
    System_Ext(k8s, "Kubernetes", "Container orchestration and workload deployment")
    System_Ext(aws, "AWS Cloud", "Cloud infrastructure: RDS, S3, SQS, ElastiCache, etc.")
    System_Ext(monitoring, "Monitoring Stack", "Grafana, Prometheus, PagerDuty, Datadog")
    System_Ext(vault, "HashiCorp Vault", "Secrets management and encryption keys")
    System_Ext(argocd, "ArgoCD", "GitOps-based continuous delivery")
    System_Ext(opa, "OPA / Kyverno", "Policy enforcement and admission control")

    Rel(developer, goldenpath, "Creates services, views catalog, provisions infra", "HTTPS")
    Rel(sre, goldenpath, "Manages policies, views platform health", "HTTPS")
    Rel(leader, goldenpath, "Views metrics and team dashboards", "HTTPS")

    Rel(goldenpath, github, "Triggers CI/CD, reads source code", "GitHub API")
    Rel(goldenpath, k8s, "Deploys workloads, enforces policies", "Kubernetes API")
    Rel(goldenpath, aws, "Provisions cloud resources via Crossplane", "AWS API")
    Rel(goldenpath, monitoring, "Sends metrics, creates dashboards", "Prometheus API")
    Rel(goldenpath, vault, "Stores and retrieves secrets", "Vault API")
    Rel(goldenpath, argocd, "Syncs GitOps deployments", "ArgoCD API")
    Rel(goldenpath, opa, "Evaluates policies against catalog", "Rego API")
```

## Description

The **Golden Path Platform** sits at the center of the developer experience:

- **Developers** interact with the platform through Backstage UI to discover services, create new ones from templates, provision infrastructure via claims, and view production readiness scores
- **SREs / Platform Engineers** manage the platform itself — policies, compositions, templates, and infrastructure
- **Engineering Leaders** use dashboards and scorecards to track team health and adoption metrics

The platform integrates with external systems:
- **GitHub** for source control, CI/CD pipelines, and repository management
- **Kubernetes** for container orchestration and workload deployment
- **AWS** for cloud infrastructure provisioned via Crossplane
- **Monitoring Stack** for observability, alerting, and incident management
- **Vault** for secrets management
- **ArgoCD** for GitOps-based continuous delivery
- **OPA / Kyverno** for policy enforcement at catalog and Kubernetes levels
