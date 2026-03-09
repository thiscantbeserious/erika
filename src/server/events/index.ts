/**
 * Event bus and event log module exports.
 * Consumers should depend on the EventBus and EventLogAdapter interfaces, not concrete implementations.
 */

export type { EventBus, EventHandler, AnyEventHandler } from './event_bus.js';
export { EmitterEventBus } from './emitter_event_bus.js';
export type { EventLogAdapter, EventLogEntry } from './event_log_adapter.js';
export { SqliteEventLogImpl } from './sqlite_event_log_impl.js';
