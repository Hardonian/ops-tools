import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Core
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));

// Catalog
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-scaffolder-glue'));

// Scaffolder
backend.add(import('@backstage/plugin-scaffolder-backend'));

// TechDocs
backend.add(import('@backstage/plugin-techdocs-backend'));

// Search
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// Auth & Permissions
backend.add(import('@backstage/plugin-permission-backend'));

// Events
backend.add(import('@backstage/plugin-events-backend'));

backend.start();
