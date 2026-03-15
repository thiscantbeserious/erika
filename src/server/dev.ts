/**
 * Dev entry point for @hono/vite-dev-server.
 *
 * Initializes the server runtime and exports the Hono app as a default export.
 * @hono/vite-dev-server expects a module with a default export that has a
 * fetch() method (i.e., a Hono app instance or similar fetch-based handler).
 *
 * Signal handlers are not registered here — the Vite process manages the lifecycle.
 * serveStatic is excluded — Vite serves static files itself in dev mode.
 */

import { init } from './bootstrap.js';
import { createApp } from './app.js';

const runtime = await init();
const app = createApp(runtime);

export default app;
