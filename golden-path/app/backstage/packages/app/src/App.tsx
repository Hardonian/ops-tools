import { createApp } from '@backstage/app-defaults';
import { UnifiedTheme } from '@backstage/theme';

const app = createApp({
  bindRoutes({ bind }) {
    // Route bindings are configured here
    // Example: bind(catalogPlugin.externalRoutes, { ... });
  },
});

export default app.createRoot(
  <>
    <app.router>
      <app.route path="/" element={<app.rootComponent />} />
    </app.router>
  </>,
);
