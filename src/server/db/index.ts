/**
 * Barrel export for the database layer.
 * Exports all public interfaces and the SQLite provider.
 * Concrete repository classes are intentionally not re-exported here —
 * consumers should obtain repositories through SqliteDatabaseProvider.
 */

export type { SessionRepository } from './session-repository.js';
export type { SectionRepository, SectionRow, CreateSectionInput } from './section-repository.js';
export type { StorageAdapter } from '../storage/storage-adapter.js';
export type { DatabaseProvider, DatabaseContext } from './database-provider.js';
export { SqliteDatabaseProvider } from './sqlite-database-provider.js';
