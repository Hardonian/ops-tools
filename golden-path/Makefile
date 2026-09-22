# ============================================
# golden-path-platform Makefile
# ============================================
SHELL := /bin/bash
.DEFAULT_GOAL := help

# ---- Setup & Dev ----
.PHONY: setup dev build clean

setup: ## Install Backstage dependencies
	cd app/backstage && yarn install

dev: ## Start Backstage dev server
	cd app/backstage && yarn dev

build: ## Build Backstage app
	cd app/backstage && yarn build

clean: ## Remove node_modules and build artifacts
	rm -rf app/backstage/node_modules app/backstage/dist

# ---- Catalog Validation ----
.PHONY: catalog-validate

catalog-validate: ## Validate catalog-info.yaml files
	python3 scripts/validate-catalog.py

# ---- Production Readiness Scorecard ----
.PHONY: scorecard

scorecard: ## Run production readiness scorecard
	python3 scripts/scorecard.py

# ---- Policy Testing ----
.PHONY: policy-test

policy-test: ## Run OPA policy tests (skips if OPA not installed)
	@if command -v opa >/dev/null 2>&1; then \
		opa test policies/opa/ -v; \
	else \
		echo "⚠️  OPA not installed — skipping policy tests."; \
		echo "   Install: https://www.openpolicyagent.org/docs/latest/#installation"; \
	fi

# ---- Help ----
.PHONY: help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
