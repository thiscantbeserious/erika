/**
 * Tests for SqliteDatabaseImpl.
 * Verifies initialize() returns working repositories and storage adapter,
 * and that the underlying database is correctly configured.
 */

// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SqliteDatabaseImpl } from './sqlite_database_impl.js';
import type { DatabaseContext } from '../database_adapter.js';

describe('SqliteDatabaseImpl', () => {
  let testDir: string;
  let ctx: DatabaseContext;

  beforeEach(async () => {
    testDir = mkdtempSync(join(tmpdir(), 'ragts-provider-test-'));
    const impl = new SqliteDatabaseImpl();
    ctx = await impl.initialize({ dataDir: testDir });
  });

  afterEach(() => {
    ctx.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should return a DatabaseContext with all required fields', () => {
      expect(ctx.sessionRepository).toBeDefined();
      expect(ctx.sectionRepository).toBeDefined();
      expect(ctx.storageAdapter).toBeDefined();
      expect(typeof ctx.close).toBe('function');
    });

    it('should return working sessionRepository (insert + query round-trip)', () => {
      const session = ctx.sessionRepository.create({
        filename: 'test.cast',
        filepath: 'sessions/test.cast',
        size_bytes: 1024,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      expect(session.id).toBeTruthy();

      const found = ctx.sessionRepository.findById(session.id);
      expect(found).not.toBeNull();
      expect(found!.filename).toBe('test.cast');
    });

    it('should return working sectionRepository (insert + query round-trip)', () => {
      const session = ctx.sessionRepository.create({
        filename: 'test.cast',
        filepath: 'sessions/test.cast',
        size_bytes: 1024,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      const section = ctx.sectionRepository.create({
        sessionId: session.id,
        type: 'marker',
        startEvent: 0,
        endEvent: 10,
        label: 'Setup',
        snapshot: null,
        startLine: null,
        endLine: null,
      });

      expect(section.id).toBeTruthy();

      const sections = ctx.sectionRepository.findBySessionId(session.id);
      expect(sections).toHaveLength(1);
      expect(sections[0].label).toBe('Setup');
    });

    it('should return working storageAdapter (save + read round-trip)', () => {
      const filepath = ctx.storageAdapter.save('test-id', 'cast content here');
      expect(filepath).toContain('test-id.cast');

      const content = ctx.storageAdapter.read('test-id');
      expect(content).toBe('cast content here');
    });

    it('should create the database file in dataDir', () => {
      expect(existsSync(join(testDir, 'ragts.db'))).toBe(true);
    });

    it('should support in-memory database via dbPath override', async () => {
      const inMemoryImpl = new SqliteDatabaseImpl();
      const inMemoryCtx = await inMemoryImpl.initialize({
        dataDir: testDir,
        dbPath: ':memory:',
      });

      const session = inMemoryCtx.sessionRepository.create({
        filename: 'mem.cast',
        filepath: 'sessions/mem.cast',
        size_bytes: 512,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      expect(session.id).toBeTruthy();
      inMemoryCtx.close();
    });
  });

  describe('close', () => {
    it('should allow calling close without throwing', () => {
      expect(() => ctx.close()).not.toThrow();
    });

    it('should prevent further database operations after close', () => {
      ctx.close();

      expect(() =>
        ctx.sessionRepository.findAll()
      ).toThrow();
    });
  });

  describe('schema verification via in-memory database', () => {
    let memCtx: DatabaseContext;

    beforeEach(async () => {
      const impl = new SqliteDatabaseImpl();
      memCtx = await impl.initialize({ dataDir: testDir, dbPath: ':memory:' });
    });

    afterEach(() => {
      memCtx.close();
    });

    it('should have sessions table with required columns', () => {
      // Verify schema by inserting and querying a session
      const session = memCtx.sessionRepository.create({
        filename: 'schema-test.cast',
        filepath: 'sessions/schema-test.cast',
        size_bytes: 100,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      expect(session.id).toBeTruthy();
      expect(session.filename).toBe('schema-test.cast');
      expect(session.size_bytes).toBe(100);
      expect(session.created_at).toBeTruthy();
    });

    it('should have sections table with required columns (migration 002)', () => {
      const session = memCtx.sessionRepository.create({
        filename: 'section-test.cast',
        filepath: 'sessions/section-test.cast',
        size_bytes: 100,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      const section = memCtx.sectionRepository.create({
        sessionId: session.id,
        type: 'detected',
        startEvent: 0,
        endEvent: null,
        label: null,
        snapshot: null,
        startLine: null,
        endLine: null,
      });

      expect(section.id).toBeTruthy();
      expect(section.start_line).toBeNull();
      expect(section.end_line).toBeNull();
    });

    it('should support snapshot column (migration 003)', () => {
      const session = memCtx.sessionRepository.create({
        filename: 'snap-test.cast',
        filepath: 'sessions/snap-test.cast',
        size_bytes: 100,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      const snapshot = JSON.stringify({ cursor: { x: 0, y: 0 } });
      memCtx.sessionRepository.updateSnapshot(session.id, snapshot);

      const found = memCtx.sessionRepository.findById(session.id);
      expect(found).not.toBeNull();
      expect((found as any).snapshot).toBe(snapshot);
    });

    it('should enforce foreign key constraints on sections', () => {
      // Deleting a session should cascade-delete its sections
      const session = memCtx.sessionRepository.create({
        filename: 'fk-test.cast',
        filepath: 'sessions/fk-test.cast',
        size_bytes: 100,
        marker_count: 0,
        uploaded_at: '2026-03-05T10:00:00Z',
      });

      memCtx.sectionRepository.create({
        sessionId: session.id,
        type: 'marker',
        startEvent: 0,
        endEvent: 5,
        label: 'test',
        snapshot: null,
        startLine: null,
        endLine: null,
      });

      memCtx.sessionRepository.deleteById(session.id);

      const sections = memCtx.sectionRepository.findBySessionId(session.id);
      expect(sections).toHaveLength(0);
    });
  });
});
