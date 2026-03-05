/**
 * SQLite implementation of DatabaseProvider.
 * Encapsulates DB initialization, migrations, and repository construction.
 */

import { join } from 'path';
import { initDatabase } from './database.js';
import { SqliteSessionRepository } from './sqlite-session-repository.js';
import { SqliteSectionRepository } from './sqlite-section-repository.js';
import { FsStorageAdapter } from '../storage/fs-storage-adapter.js';
import type { DatabaseProvider, DatabaseContext } from './database-provider.js';

/**
 * SQLite-backed database provider.
 * Delegates DB initialization to initDatabase(), then wires up all repositories.
 * The database file is placed at `<dataDir>/ragts.db`.
 */
export class SqliteDatabaseProvider implements DatabaseProvider {
  /**
   * Initialize the SQLite persistence layer.
   * Creates the database at `<dataDir>/ragts.db`, runs migrations,
   * and constructs all repositories and the storage adapter.
   */
  async initialize(config: { dataDir: string }): Promise<DatabaseContext> {
    const dbPath = join(config.dataDir, 'ragts.db');
    const db = initDatabase(dbPath);

    const sessionRepository = new SqliteSessionRepository(db);
    const sectionRepository = new SqliteSectionRepository(db);
    const storageAdapter = new FsStorageAdapter(config.dataDir);

    return {
      sessionRepository,
      sectionRepository,
      storageAdapter,
      close: () => db.close(),
    };
  }
}
