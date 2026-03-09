/**
 * Event bus module exports.
 * Consumers should depend on the EventBus interface, not the concrete implementation.
 */

export type { EventBus, EventHandler, AnyEventHandler } from './event-bus.js';
export { EmitterEventBus } from './emitter-event-bus.js';
