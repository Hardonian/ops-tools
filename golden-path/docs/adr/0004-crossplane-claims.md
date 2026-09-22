# ADR-0004: Crossplane Claims for Infrastructure Provisioning

## Status

**Accepted** — June 2026

## Context

Infrastructure provisioning currently requires:
- **Manual tickets**: Teams file Jira tickets to platform team for database, queue, or bucket creation
- **Terraform sprawl**: Some teams maintain their own Terraform repos with inconsistent patterns
- **Cloud console access**: Teams sometimes provision directly in AWS console, bypassing controls
- **No self-service**: Average time from request to provisioned resource: 3-5 business days

Requirements for infrastructure provisioning:
- **Self-service**: Developers provision infrastructure without platform team involvement
- **Policy-gated**: All provisioning follows approved patterns and security standards
- **GitOps-compatible**: Infrastructure defined as code, stored in Git
- **Kubernetes-native**: Leverages existing K8s tooling and workflows
- **Cloud-agnostic**: Abstract underlying cloud provider for future flexibility

Options evaluated:
1. **Terraform + Atlantis** — Mature but not K8s-native; separate workflow from application deployment
2. **Pulumi** — Good but requires learning new language; team unfamiliarity
3. **Crossplane with Claims** — K8s-native, composable, CNCF project, supports our policy model
4. **Backstage + custom plugin** — Would require building provisioning logic from scratch

## Decision

We will use **Crossplane with XRD (Composite Resource Definition) Claims** as the infrastructure provisioning model.

### Claim-Based Model

Infrastructure is exposed to developers as **Claim** resources — simplified, opinionated interfaces:

```yaml
apiVersion: goldenpath.platform/v1alpha1
kind: DatabaseClaim
metadata:
  name: payments-db
  namespace: team-payments
spec:
  size: medium          # small | medium | large | xlarge
  engine: postgres       # postgres | mysql
  highAvailability: true
  backupRetention: 30d
  deletionPolicy: retain
```

Behind each Claim, a **Composition** handles the full implementation:

```yaml
apiVersion: goldenpath.platform/v1alpha1
kind: Composition
metadata:
  name: database-postgres
spec:
  compositeTypeRef:
    apiVersion: goldenpath.platform/v1alpha1
    kind: Database
  resources:
    - name: rds-instance
      base:
        apiVersion: rds.aws.crossplane.io/v1alpha1
        kind: DBInstance
        spec:
          forProvider:
            engine: postgres
            dbInstanceClass: db.t3.medium
            masterUsername: admin
            # ... encrypted, logged, tagged
    - name: security-group
      base:
        apiVersion: ec2.aws.crossplane.io/v1alpha1
        kind: SecurityGroup
    - name: subnet-group
      base:
        apiVersion: rds.aws.crossplane.io/v1alpha1
        kind: DBSubnetGroup
```

### Available Claims

| Claim Type | Resources Created | Parameters |
|-----------|-------------------|------------|
| `DatabaseClaim` | RDS instance, SG, subnet group, parameter group | size, engine, HA, retention |
| `QueueClaim` | SQS queue, DLQ, IAM policy, CloudWatch alarms | size, visibility timeout, retention |
| `BucketClaim` | S3 bucket, versioning, encryption, lifecycle rules | size class, encryption, lifecycle |
| `CacheClaim` | ElastiCache cluster, SG, subnet group | size, engine, eviction policy |
| `TopicClaim` | SNS topic, subscriptions, IAM policy | format, encryption, access policy |

### Integration with Backstage

Claims can be created through:
1. **Backstage Software Templates** — Form-based UI that generates Claim YAML
2. **`kubectl apply`** — Direct YAML application for advanced users
3. **GitOps (ArgoCD)** — Claims committed to Git, reconciled automatically

## Consequences

### Positive
- **Self-service**: Developers provision infrastructure in minutes, not days
- **Consistent patterns**: All databases, queues, buckets follow approved architecture
- **Policy enforcement**: OPA validates Claims against organizational standards before apply
- **Kubernetes-native**: Same workflow as application deployments (kubectl, GitOps)
- **Drift detection**: Crossplane continuously reconciles desired state
- **Abstraction**: Developers specify intent (size, engine), not implementation details

### Negative
- **Composition complexity**: Platform team must author and maintain Crossplane Compositions
- **Crossplane learning curve**: New technology for the platform team
- **Abstraction limits**: Claim parameters may not cover all use cases; escape hatch needed
- **Debugging**: Crossplane reconciler logs can be verbose; troubleshooting requires expertise
- **Cloud provider support**: Not all AWS/GCP/Azure resources have Crossplane providers

### Mitigations
- Start with high-value claims (Database, Bucket, Queue) before expanding
- Provide `custom` claim type as escape hatch for advanced use cases
- Document Composition development patterns and testing procedures
- Crossplane provider compatibility matrix maintained in platform docs
- Regular provider updates as part of platform release cycle
