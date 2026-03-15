/**
 * Production entry point.
 *
 * Bootstraps the server runtime, wires the app factory, and starts
 * @hono/node-server. Registers signal handlers for graceful shutdown
 * and serves the built frontend via serveStatic (production only).
 * serveStatic from @hono/node-server/serve-static is Node-specific —
 * it must NOT be imported in app.ts or dev.ts.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { init } from './bootstrap.js';
import { createApp } from './app.js';
import { logger } from './logger.js';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as { name: string };

const runtime = await init();
const app = createApp(runtime);

// Serve frontend in production — single-container deployment
app.use('/*', serveStatic({ root: './dist/client' }));
// SPA fallback: serve index.html for Vue Router history mode routes
app.get('*', serveStatic({ root: './dist/client', path: 'index.html' }));

const port = runtime.config.port;

logger.info({ port, name: pkg.name }, `Starting ${pkg.name} server`);

const server = serve(
  { fetch: app.fetch, port },
  (info) => {
    logger.info({ port: info.port }, `Server running at http://localhost:${info.port}`);
  },
);

/** Graceful shutdown: stop HTTP server, orchestrator, then DB. */
function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await runtime.orchestrator.stop();
    await runtime.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
