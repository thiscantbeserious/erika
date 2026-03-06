/**
 * Factory for creating DatabaseAdapter instances by type.
 * Decouples the application entry point from concrete implementations.
 * Add a new case here when a new database backend (e.g. PostgreSQL) is introduced.
 */

import type { DatabaseAdapter } from './database_adapter.js';

export class DatabaseFactory {
  /**
   * Create a DatabaseAdapter for the given backend type.
   *
   * @param type - Backend identifier. Defaults to 'sqlite'.
   *   Currently supported: 'sqlite'.
   * @throws Error if the type is unknown.
   */
  async create(type: string = 'sqlite'): Promise<DatabaseAdapter> {
    if (type === 'sqlite') {
      const { SqliteDatabaseImpl } = await import('./sqlite/sqlite_database_impl.js');
      return new SqliteDatabaseImpl();
    }
    throw new Error(`Unknown database type: ${type}`);
  }
}
