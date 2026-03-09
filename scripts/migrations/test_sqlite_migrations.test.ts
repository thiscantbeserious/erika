/**
 * Schema snapshot test for SQLite migrations.
 *
 * Auto-discovers migration files from src/server/db/sqlite/migrations/,
 * applies base schema + each migration sequentially on a single in-memory DB
 * (mirroring the production migration path), and snapshots the full schema
 * state after each step.
 *
 * The committed .snap file serves as the schema record — git diff shows
 * exactly what each migration changes.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'src/server/db/sqlite/migrations');

const BASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL UNIQUE,
  size_bytes INTEGER NOT NULL,
  marker_count INTEGER DEFAULT 0,
  uploaded_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_uploaded_at ON sessions(uploaded_at DESC);
`.trim();

// ---------------------------------------------------------------------------
// Schema capture
// ---------------------------------------------------------------------------

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface TableSchema {
  columns: ColumnInfo[];
  indexes: string[];
}

interface SchemaSnapshot {
  tables: Record<string, TableSchema>;
}

/** Returns all table names in the database, sorted alphabetically. */
function get_table_names(db: DatabaseType): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as Array<{ name: string }>;
  return rows.map((r) => r.name).sort();
}

/** Returns all index names for a given table, sorted alphabetically. */
function get_index_names(db: DatabaseType, table_name: string): string[] {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? ORDER BY name",
    )
    .all(table_name) as Array<{ name: string }>;
  return rows.map((r) => r.name).sort();
}

/** Returns column metadata for a table, sorted by column id. */
function get_columns(db: DatabaseType, table_name: string): ColumnInfo[] {
  const rows = db.pragma(`table_info(${table_name})`) as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>;
  return rows
    .sort((a, b) => a.cid - b.cid)
    .map(({ name, type, notnull, dflt_value, pk }) => ({
      name,
      type,
      notnull,
      dflt_value,
      pk,
    }));
}

/**
 * Captures the full schema state of the database.
 * Returns a deterministic object suitable for snapshot testing.
 */
function capture_schema(db: DatabaseType): SchemaSnapshot {
  const table_names = get_table_names(db);
  const tables: Record<string, TableSchema> = {};

  for (const table_name of table_names) {
    tables[table_name] = {
      columns: get_columns(db, table_name),
      indexes: get_index_names(db, table_name),
    };
  }

  return { tables };
}

// ---------------------------------------------------------------------------
// Migration discovery
// ---------------------------------------------------------------------------

interface MigrationModule {
  [key: string]: (db: DatabaseType) => void;
}

/** Discovers migration files matching /^\d{3}_.*\.ts$/ excluding .test.ts files. */
function discover_migration_files(): string[] {
  const entries = readdirSync(MIGRATIONS_DIR);
  return entries
    .filter((f) => /^\d{3}_.*\.ts$/.test(f) && !f.endsWith('.test.ts'))
    .sort();
}

/** Loads and returns the single exported migration function from a file. */
async function load_migration_fn(
  file_name: string,
): Promise<(db: DatabaseType) => void> {
  const file_path = join(MIGRATIONS_DIR, file_name);
  const mod = (await import(file_path)) as MigrationModule;
  const fn_keys = Object.keys(mod).filter((k) => typeof mod[k] === 'function');

  if (fn_keys.length !== 1) {
    throw new Error(
      `Migration ${file_name} must export exactly one function, found: ${fn_keys.join(', ')}`,
    );
  }

  return mod[fn_keys[0] as string] as (db: DatabaseType) => void;
}

// ---------------------------------------------------------------------------
// Schema logging
// ---------------------------------------------------------------------------

/** Logs a human-readable summary of the schema state after each step. */
function log_schema_summary(label: string, schema: SchemaSnapshot): void {
  const table_names = Object.keys(schema.tables).sort();
  const total_indexes = table_names.reduce(
    (sum, t) => sum + (schema.tables[t]?.indexes.length ?? 0),
    0,
  );
  console.log(`  ${label}: ${table_names.length} tables, ${total_indexes} indexes`);
  for (const t of table_names) {
    const cols = schema.tables[t]?.columns.map((c) => c.name).join(', ') ?? '';
    console.log(`    ${t}: [${cols}]`);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SQLite schema migrations', () => {
  const migration_files = discover_migration_files();
  const db = new Database(':memory:');

  console.log(`\nDiscovered ${migration_files.length} migrations:`);
  for (const f of migration_files) {
    console.log(`  - ${f}`);
  }

  afterAll(() => {
    db.close();
    console.log(`\n[OK] ${migration_files.length + 1} schema snapshots verified\n`);
  });

  it('step 0: base schema', () => {
    db.exec(BASE_SCHEMA);
    const schema = capture_schema(db);
    expect(schema).toMatchSnapshot();
    log_schema_summary('base schema', schema);
  });

  for (const [index, file_name] of migration_files.entries()) {
    it(`step ${index + 1}: ${file_name}`, async () => {
      const migrate = await load_migration_fn(file_name);
      migrate(db);
      const schema = capture_schema(db);
      expect(schema).toMatchSnapshot();
      log_schema_summary(`after ${file_name}`, schema);
    });
  }
});
