#!/usr/bin/env python3
"""
Catalog Validation for golden-path-platform.

Reads all catalog-info.yaml files in catalog/ and examples/services/
and validates they have the required Backstage fields.

Required fields:
  - apiVersion
  - kind
  - metadata.name
  - metadata.annotations.backstage.io/owner

Usage:
    python3 scripts/validate-catalog.py

Exit 0 if all valid, exit 1 if any invalid.
"""

import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("❌ PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

SCAN_DIRS = [
    "catalog",
    "examples/services",
]

REQUIRED_FIELDS = [
    ("apiVersion", ["apiVersion"]),
    ("kind", ["kind"]),
    ("metadata.name", ["metadata", "name"]),
]

# These fields have alternative locations
REQUIRED_OWNERSHIP = [
    ["metadata", "annotations", "backstage.io/owner"],
    ["spec", "owner"],
]


def find_catalog_files(base_dir: str) -> list[Path]:
    """Find all catalog-info.yaml files under the scan directories."""
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


def get_nested(data: dict, keys: list[str]):
    """Safely get a nested value from a dict."""
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def validate_file(filepath: Path) -> list[str]:
    """Validate a single catalog-info.yaml file. Returns list of missing fields."""
    try:
        with open(filepath, "r") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML parse error: {e}"]

    if data is None or not isinstance(data, dict):
        return ["File is empty or not a valid YAML mapping"]

    errors = []
    for field_name, field_path in REQUIRED_FIELDS:
        value = get_nested(data, field_path)
        if not value:
            errors.append(f"missing required field: {field_name}")

    # Check ownership - either annotation or spec.owner
    owner_found = any(get_nested(data, path) for path in REQUIRED_OWNERSHIP)
    if not owner_found:
        errors.append("missing owner (need metadata.annotations.backstage.io/owner or spec.owner)")

    return errors


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    catalog_files = find_catalog_files(base_dir)

    if not catalog_files:
        print("⚠️  No catalog-info.yaml files found in catalog/ or examples/services/")
        print("   Nothing to validate.")
        sys.exit(0)

    total = len(catalog_files)
    valid = 0
    invalid = 0
    errors_found = False

    print(f"Validating {total} catalog-info.yaml file(s)...\n")

    for filepath in catalog_files:
        rel_path = filepath.relative_to(base_dir)
        errors = validate_file(filepath)

        if errors:
            invalid += 1
            errors_found = True
            print(f"❌ {rel_path}")
            for err in errors:
                print(f"   - {err}")
        else:
            valid += 1
            print(f"✅ {rel_path}")

    print(f"\nResults: {valid} valid, {invalid} invalid out of {total} file(s)")

    if errors_found:
        sys.exit(1)
    else:
        print("All catalog files are valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
