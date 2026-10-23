import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Dev server for the model exporter page (tools/export-models.mjs drives it with Playwright).
export default defineConfig({
  root: import.meta.dirname,
  server: { fs: { allow: [resolve(import.meta.dirname, '../..')] } },
  logLevel: 'warn',
});
