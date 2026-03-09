/**
 * Migration integration test script.
 *
 * Creates a fresh in-memory SQLite database, runs all migrations in order
 * (identical to how the server initializes), then verifies that all expected
 * tables and indexes exist. Exits 0 on success, 1 on failure.
 *
 * Run with: npx tsx scripts/test_migrations.ts
 */

import Database from 'better-sqlite3';
import { migrate002Sections } from '../src/server/db/sqlite/migrations/002_sections.js';
import { migrate003UnifiedSnapshot } from '../src/server/db/sqlite/migrations/003_unified_snapshot.js';
import { migrate004PipelineJobsEvents } from '../src/server/db/sqlite/migrations/004_pipeline_jobs_events.js';

// ---------------------------------------------------------------------------
// Base schema (mirrors SqliteDatabaseImpl.BASE_SCHEMA)
// ---------------------------------------------------------------------------

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
// DB helpers
// ---------------------------------------------------------------------------

/** Returns true if a table exists in the schema. */
function tableExists(db: Database.Database, table: string): boolean {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table) !== undefined
  );
}

/** Returns index names for the given table (excludes internal sqlite_ indexes). */
function getIndexNames(db: Database.Database, table: string): string[] {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name NOT LIKE 'sqlite_%'"
    )
    .all(table) as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

/** Asserts that all required tables exist; logs pass/fail per table. */
function assertTables(db: Database.Database, tables: string[]): boolean {
  let ok = true;
  for (const table of tables) {
    if (tableExists(db, table)) {
      console.log(`  [PASS] table '${table}' exists`);
    } else {
      console.error(`  [FAIL] table '${table}' is missing`);
      ok = false;
    }
  }
  return ok;
}

/** Asserts that a specific index exists on its table; logs pass/fail. */
function assertIndex(db: Database.Database, table: string, index: string): boolean {
  const names = getIndexNames(db, table);
  if (names.includes(index)) {
    console.log(`  [PASS] index '${index}' on '${table}' exists`);
    return true;
  }
  console.error(`  [FAIL] index '${index}' on '${table}' is missing (found: ${names.join(', ') || 'none'})`);
  return false;
}

/** Asserts all required indexes; returns false if any is missing. */
function assertIndexes(db: Database.Database, checks: Array<{ table: string; index: string }>): boolean {
  return checks.reduce((ok, { table, index }) => assertIndex(db, table, index) && ok, true);
}

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

/** Opens an in-memory database and applies all migrations in order. */
function applyAllMigrations(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('\nRunning migrations on :memory: database...');

  db.exec(BASE_SCHEMA);
  console.log('  [OK] base schema applied (sessions table + idx_sessions_uploaded_at)');

  migrate002Sections(db);
  console.log('  [OK] migration 002: sections table + session processing columns');

  migrate003UnifiedSnapshot(db);
  console.log('  [OK] migration 003: unified snapshot columns');

  migrate004PipelineJobsEvents(db);
  console.log('  [OK] migration 004: jobs + events tables + pipeline indexes');

  return db;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

const REQUIRED_TABLES = ['sessions', 'sections', 'jobs', 'events'];

const REQUIRED_INDEXES = [
  { table: 'jobs', index: 'idx_jobs_session_id' },
  { table: 'jobs', index: 'idx_jobs_status' },
  { table: 'events', index: 'idx_events_session_id' },
];

/** Verifies schema has all expected tables and indexes. Returns true if all pass. */
function verifySchema(db: Database.Database): boolean {
  console.log('\nVerifying tables...');
  const tablesOk = assertTables(db, REQUIRED_TABLES);

  console.log('\nVerifying indexes...');
  const indexesOk = assertIndexes(db, REQUIRED_INDEXES);

  return tablesOk && indexesOk;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  const db = applyAllMigrations();
  const passed = verifySchema(db);
  db.close();

  if (passed) {
    console.log('\n[SUCCESS] All migration checks passed.\n');
    process.exit(0);
  } else {
    console.error('\n[FAILURE] One or more migration checks failed.\n');
    process.exit(1);
  }
} catch (err) {
  console.error('\n[ERROR] Migration run threw an exception:', err);
  process.exit(1);
}
