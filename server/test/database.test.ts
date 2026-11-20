import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

describe('SQLite Database & Persistence', () => {
  const testDbDir = path.resolve(process.cwd(), 'test-data');
  const testDbPath = path.join(testDbDir, 'test_persistence.db');

  before(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  after(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDbDir)) {
      fs.rmdirSync(testDbDir);
    }
  });

  test('should create tables and persist records across database connection restarts', () => {
    // 1. First connection: create table & insert
    const db1 = new DatabaseSync(testDbPath);
    db1.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        tenant_slug TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL
      );
    `);

    const insertStmt = db1.prepare('INSERT INTO projects (id, tenant_slug, status, data_json) VALUES (?, ?, ?, ?)');
    insertStmt.run('proj_test_99', 'test-tenant', 'preview_ready', JSON.stringify({ name: 'Test Puja Samiti' }));
    db1.close();

    // 2. Second connection: reopen same database file and verify persistence
    const db2 = new DatabaseSync(testDbPath);
    const row = db2.prepare('SELECT * FROM projects WHERE id = ?').get('proj_test_99') as any;

    assert.ok(row, 'Project row should persist in SQLite file');
    assert.equal(row.id, 'proj_test_99');
    assert.equal(row.tenant_slug, 'test-tenant');
    assert.equal(row.status, 'preview_ready');

    const parsedData = JSON.parse(row.data_json);
    assert.equal(parsedData.name, 'Test Puja Samiti');

    db2.close();
  });

  test('should enforce primary key uniqueness and handle transactions', () => {
    const db = new DatabaseSync(testDbPath);
    const stmt = db.prepare('INSERT INTO projects (id, tenant_slug, status, data_json) VALUES (?, ?, ?, ?)');
    
    assert.throws(() => {
      stmt.run('proj_test_99', 'duplicate-slug', 'pending', '{}');
    }, /UNIQUE constraint failed/);

    db.close();
  });
});
