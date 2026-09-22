# Architecture

## Platform Context

**ops-tools** is one of seven Hardonia monorepos. It provides operations-layer tooling — continuity assurance for cyber-physical systems, Terraform drift inspection, and an internal developer platform with service catalog and golden paths.

## Position in the Hardonia Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hardonia Platform                        │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│  Consumer    │  API         │  Ops         │  Infra / AI         │
│  Surface     │  Surface     │  Surface     │  Core               │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│ consumer-tools│ api-tools   │ ops-tools    │ autopilot           │
│              │              │              │ agent-infra         │
│              │              │              │ agent-edge          │
│              │              │              │ model-tools         │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

| Layer | Repo | Purpose |
|-------|------|---------|
| Consumer Surface | **[consumer-tools](https://github.com/Hardonian/consumer-tools)** | Warranty tracking, review intelligence, inbox cleanup |
| API Surface | **[api-tools](https://github.com/Hardonian/api-tools)** | ComfyUI API gateway, webhook capture, changelog tracking |
| Ops Surface | **[ops-tools](https://github.com/Hardonian/ops-tools)** | Continuity assurance, Terraform drift, developer platform |
| Core | **[autopilot](https://github.com/Hardonian/autopilot)** | Autonomous agent orchestration |
| Core | **[agent-infra](https://github.com/Hardonian/agent-infra)** | Agent infrastructure and runtime |
| Core | **[agent-edge](https://github.com/Hardonian/agent-edge)** | Edge-deployed agent runtimes |
| Core | **[model-tools](https://github.com/Hardonian/model-tools)** | Model management, evaluation, deployment |

## Internal Architecture

```
ops-tools/
├── continuity/          # Continuity assurance reference API (Python, uv)
├── drift-inspector/     # Terraform drift: live infra vs tfstate (Python, uv)
├── golden-path/         # Internal dev platform: catalog, golden paths, scorecards (TypeScript)
└── README.md            # This file
```

Each component is self-contained with its own build system, dependencies, and documentation. The repo has no workspace root — components are independent.

## Cross-Repo Dependencies

- **api-tools/webhook-witness** — feeds event data into continuity assurance
- **api-tools/changelog-radar** — drift-inspector can correlate API changes with infra drift
- **autopilot** — golden-path service catalog includes autopilot service definitions
- **agent-infra** — golden-path tracks agent-infra service health
