#!/usr/bin/env python3
"""
Production Readiness Scorecard for golden-path-platform.

Scans catalog-info.yaml files in catalog/ and examples/services/
and checks each entity for production readiness criteria.

Usage:
    python3 scripts/scorecard.py

Exit 0 if all entities pass, exit 1 if any fail.
"""

import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("❌ PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# Directories to scan for catalog-info.yaml files
SCAN_DIRS = [
    "catalog",
    "examples/services",
]


def check_owner(data):
    """Owner defined via spec.owner or annotation."""
    return bool(
        data.get("spec", {}).get("owner")
        or data.get("metadata", {}).get("annotations", {}).get("backstage.io/owner")
    )


def check_system(data):
    """System defined for Component and API types only."""
    kind = data.get("kind", "")
    if kind not in ("Component", "API"):
        return True  # Not applicable for Group, Domain, Resource, System
    return bool(data.get("spec", {}).get("system"))


def check_api_contract(data):
    """API contract present for services (not workers or API specs)."""
    kind = data.get("kind", "")
    name = data.get("metadata", {}).get("name", "")
    comp_type = data.get("spec", {}).get("type", "")
    if kind not in ("Component",):
        return True  # Not applicable for non-component types
    # Worker services don't need API contracts
    if "worker" in name.lower():
        return True
    # OpenAPI spec components ARE the contract
    if comp_type == "openapi":
        return True
    return bool(
        data.get("spec", {}).get("providesApis")
        or data.get("spec", {}).get("apis")
    )


def check_lifecycle(data):
    """Lifecycle defined."""
    return bool(data.get("spec", {}).get("lifecycle"))


def check_data_classification(data):
    """Data classification or tags present."""
    return bool(
        data.get("metadata", {}).get("annotations", {}).get("backstage.io/data-classification")
        or data.get("metadata", {}).get("tags")
    )


# Production readiness checks:
# (check_name, description, check_function)
CHECKS = [
    ("owner", "Owner defined", check_owner),
    ("system", "System defined", check_system),
    ("api_contract", "API contract present", check_api_contract),
    ("lifecycle", "Lifecycle defined", check_lifecycle),
    ("data_classification", "Data classification / tags declared", check_data_classification),
]


def find_catalog_files(base_dir: str) -> list[Path]:
    """Find all catalog-info.yaml files under the given directories."""
    files = []
    for scan_dir in SCAN_DIRS:
        full = Path(base_dir) / scan_dir
        if not full.is_dir():
            continue
        # Scan for catalog-info.yaml in subdirectories (examples)
        for yaml_file in sorted(full.rglob("catalog-info.yaml")):
            files.append(yaml_file)
        # Scan for all YAML files in catalog/ directory directly
        if scan_dir == "catalog":
            for yaml_file in sorted(full.glob("*.yaml")):
                if yaml_file.name != "info.yaml":  # Skip the location index
                    files.append(yaml_file)
    return files


def parse_yaml(filepath: Path) -> dict | None:
    """Parse a YAML file and return the dict, or None on error."""
    try:
        with open(filepath, "r") as f:
            data = yaml.safe_load(f)
            return data if isinstance(data, dict) else None
    except yaml.YAMLError as e:
        print(f"⚠️  YAML parse error in {filepath}: {e}", file=sys.stderr)
        return None


def get_entity_name(data: dict) -> str:
    """Extract a human-readable entity name from parsed YAML."""
    kind = data.get("kind", "Unknown")
    name = data.get("metadata", {}).get("name", "unnamed")
    return f"{kind}/{name}"


def run_scorecard(base_dir: str) -> tuple[list[str], list[str], dict[str, list[str]]]:
    """
    Run all checks against all discovered catalog entities.

    Returns:
        (passed, failed, details)
        - passed: list of entity names that passed all checks
        - failed: list of entity names that failed any check
        - details: entity_name -> list of failed check names
    """
    catalog_files = find_catalog_files(base_dir)
    passed = []
    failed = []
    details = {}

    if not catalog_files:
        print("⚠️  No catalog-info.yaml files found in catalog/ or examples/services/")
        return passed, failed, details

    for f in catalog_files:
        data = parse_yaml(f)
        if data is None:
            continue

        entity_name = get_entity_name(data)
        entity_failures = []

        for check_name, _description, check_fn in CHECKS:
            try:
                if not check_fn(data):
                    entity_failures.append(check_name)
            except Exception:
                entity_failures.append(check_name)

        if entity_failures:
            failed.append(entity_name)
            details[entity_name] = entity_failures
        else:
            passed.append(entity_name)

    return passed, failed, details


def generate_markdown_report(
    passed: list[str], failed: list[str], details: dict[str, list[str]], total_checks: int
) -> str:
    """Generate a markdown report with a table of results."""
    lines = [
        "# Production Readiness Scorecard",
        "",
        "## Summary",
        "",
        f"- **Entities scanned:** {len(passed) + len(failed)}",
        f"- **Passed all checks:** {len(passed)}",
        f"- **Failed one or more checks:** {len(failed)}",
        f"- **Total checks per entity:** {total_checks}",
        "",
    ]

    if failed:
        lines.append("## ❌ Failed Entities")
        lines.append("")
        for entity in failed:
            fail_list = details.get(entity, [])
            lines.append(f"### {entity}")
            lines.append("")
            for check in fail_list:
                lines.append(f"- {check}")
            lines.append("")

    if passed:
        lines.append("## ✅ Passed Entities")
        lines.append("")
        for entity in passed:
            lines.append(f"- {entity}")
        lines.append("")

    # Detailed table
    all_entities = passed + failed
    if all_entities:
        lines.append("## Detailed Results")
        lines.append("")
        header = "| Entity | " + " | ".join(c[0] for c in CHECKS) + " |"
        separator = "|" + "|".join(["---"] * (len(CHECKS) + 1)) + "|"
        lines.append(header)
        lines.append(separator)

        for entity in sorted(all_entities):
            row = f"| {entity} "
            entity_fails = set(details.get(entity, []))
            for check_name, _desc, _fn in CHECKS:
                if check_name in entity_fails:
                    row += "| ❌ "
                else:
                    row += "| ✅ "
            row += "|"
            lines.append(row)
        lines.append("")

    return "\n".join(lines)


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    passed, failed, details = run_scorecard(base_dir)
    report = generate_markdown_report(passed, failed, details, len(CHECKS))
    print(report)

    if failed:
        print(f"\n❌ Scorecard FAILED — {len(failed)} entity/entities did not pass all checks.")
        sys.exit(1)
    else:
        print(f"\n✅ Scorecard PASSED — all {len(passed)} entity/entities passed all {len(CHECKS)} checks.")
        sys.exit(0)


if __name__ == "__main__":
    main()
