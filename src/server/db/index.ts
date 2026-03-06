/**
 * Barrel export for the database layer.
 * Exports all public interfaces and the DatabaseFactory.
 * Concrete implementation classes are not re-exported here —
 * consumers should obtain instances through DatabaseFactory.
 */

export type { SessionAdapter } from './session_adapter.js';
export type { SectionAdapter, SectionRow, CreateSectionInput } from './section_adapter.js';
export type { StorageAdapter } from '../storage/storage_adapter.js';
export type { DatabaseAdapter, DatabaseContext } from './database_adapter.js';
export { DatabaseFactory } from './database_factory.js';
