# Runbook: {{ component_name }} API

## Overview

- **API**: {{ component_name }}
- **Owner**: {{ owner }}
- **Type**: OpenAPI Contract

## Alerts

| Alert Name | Severity | Description |
|-----------|----------|-------------|
| ContractBreaking | Critical | Breaking change detected in API contract |
| SchemaValidationFailure | Warning | Request/response validation failing |

## Escalation

1. **API owner**: Review contract changes
2. **Team lead**: If breaking changes are unavoidable
3. **Platform team**: If schema validation issues persist

## Recovery Steps

1. Validate contract: `npx @redocly/cli lint openapi.yaml`
2. Review breaking changes: `npx @redocly/cli lint openapi.yaml --skip-rule no-unused-components`
3. Update consumers: Coordinate with dependent services

## Useful Commands

```bash
# Validate API spec
npx @redocly/cli lint openapi.yaml

# Generate mock server
npx prism mock openapi.yaml

# Diff two versions
npx openapi-diff old.yaml new.yaml
```
