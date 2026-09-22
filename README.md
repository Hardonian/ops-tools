# ops-tools

Unified ops tooling: continuity assurance, Terraform drift inspection, and developer platform.

## Repository Structure

```
ops-tools/
├── continuity/          # Continuity assurance reference API for cyber-physical systems
├── drift-inspector/     # Terraform drift inspector: compare live infra vs tfstate
└── golden-path/         # Internal developer platform: service catalog, golden paths, scorecards
```

## Components

### [continuity/](continuity/)
Continuity assurance reference API for cyber-physical systems. Python-based service with full CI/CD, Docker support, and SDK.

- **Stack:** Python, uv, Docker
- **Entry:** `cd continuity && make help`

### [drift-inspector/](drift-inspector/)
Terraform drift inspector that compares live infrastructure against Terraform state files. Reports divergences before they become incidents.

- **Stack:** Python, uv, Docker, Fly.io
- **Entry:** `cd drift-inspector && just --list`

### [golden-path/](golden-path/)
Internal developer platform reference implementation: service catalog, golden paths, and team scorecards.

- **Stack:** TypeScript, Make
- **Entry:** `cd golden-path && make help`

## Getting Started

Each subdirectory is self-contained with its own build system, dependencies, and documentation. See individual READMEs for setup instructions.

```bash
# Clone with all submodules
git clone https://github.com/Hardonian/ops-tools.git
cd ops-tools

# Work in any component
cd continuity/ && cat README.md
cd drift-inspector/ && cat README.md
cd golden-path/ && cat README.md
```

## Related Repos

### Hardonia Monorepos

| Repo | Purpose |
|------|---------|
| [autopilot](https://github.com/Hardonian/autopilot) | Autonomous agent orchestration |
| [agent-infra](https://github.com/Hardonian/agent-infra) | Agent infrastructure and runtime |
| [agent-edge](https://github.com/Hardonian/agent-edge) | Edge-deployed agent runtimes |
| [model-tools](https://github.com/Hardonian/model-tools) | Model management, evaluation, deployment |
| [consumer-tools](https://github.com/Hardonian/consumer-tools) | Warranty tracking, review intelligence, inbox cleanup |
| [api-tools](https://github.com/Hardonian/api-tools) | ComfyUI API gateway, webhook capture, changelog tracking |

### Commercial Repos

| Repo | Purpose |
|------|---------|
| [hardonia-store](https://github.com/Hardonian/hardonia-store) | Hardonia storefront |
| [comfyui-workflow-packs](https://github.com/Hardonian/comfyui-workflow-packs) | ComfyUI workflow packages |
| [content-repo](https://github.com/Hardonian/content-repo) | Content assets |
| [ai-prompt-templates](https://github.com/Hardonian/ai-prompt-templates) | AI prompt templates |
| [ai-ops-toolkit](https://github.com/Hardonian/ai-ops-toolkit) | AI operations toolkit |

## License

Each component retains its original license. See `LICENSE` files in each subdirectory.
