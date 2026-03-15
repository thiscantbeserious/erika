import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Appends a build-time content hash query param to blocking design CSS paths
 * so browsers always fetch fresh styles after a deployment.
 * Only affects the production build output — dev server is unchanged.
 */
function cssCacheBust(): Plugin {
  return {
    name: 'css-cache-bust',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /href="(\/design\/styles\/([^"]+\.css))"/g,
        (_match, fullPath: string, filename: string) => {
          try {
            const content = readFileSync(`./design/styles/${filename}`, 'utf-8');
            const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
            return `href="${fullPath}?v=${hash}"`;
          } catch {
            return `href="${fullPath}"`;
          }
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [vue(), cssCacheBust()],
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: Number(process.env.DEV_SERVER_PORT || 5173),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  test: {
    environment: 'happy-dom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts}',
      'packages/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'tests/visual/**',
      'node_modules/**',
    ],
    environmentMatchGlobs: [
      ['packages/**', 'node'],
      ['src/server/**', 'node'],
      ['tests/snapshots/backend/**', 'node'],
      ['tests/integration/**', 'node'],
    ],
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        '**/scripts/**',
        '**/migrations/**',
        'packages/vt-wasm/pkg/**',
        'tests/helpers/**',
        'src/server/routes/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
