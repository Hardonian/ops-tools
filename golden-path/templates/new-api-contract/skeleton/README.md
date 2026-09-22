# {{ component_name }} API

{{ description }}

## Overview

This repository contains the OpenAPI 3.0 contract for the {{ component_name }} API.

## API Specification

The API contract is defined in [openapi.yaml](openapi.yaml).

## Validation

```bash
# Validate the OpenAPI spec
npx @redocly/cli lint openapi.yaml
```

## Documentation

Generate interactive docs from the spec:

```bash
npx @redocly/cli build-docs openapi.yaml -o docs/api.html
```

## Owner

- **Owner**: {{ owner }}
- **System**: {{ system }}
