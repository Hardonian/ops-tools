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

## License

Each component retains its original license. See `LICENSE` files in each subdirectory.
