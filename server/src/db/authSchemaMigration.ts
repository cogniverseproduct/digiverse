import type { Database } from './driver.js';

/**
 * Legacy SQLite users-table rebuild.
 *
 * Older local databases created `users.email` as NOT NULL and had no
 * `username` column. SQLite cannot relax a NOT NULL constraint with ALTER
 * TABLE, so the table is rebuilt once, preserving every existing record.
 *
 * Postgres databases are always created from the final schema
 * (see schema.ts) and never need this step.
 */
export async function applyAuthSchemaMigrations(db: Database): Promise<void> {
  if (db.dialect !== 'sqlite') {
    return;
  }

  const userColumns = await db.all<{ name: string; notnull: number }>(
    'PRAGMA table_info(users)'
  );

  const hasUsername = userColumns.some((column) => column.name === 'username');
  const emailColumn = userColumns.find((column) => column.name === 'email');
  const emailIsRequired = Boolean(emailColumn?.notnull);

  if (hasUsername && !emailIsRequired) {
    return;
  }

  const columnNames = new Set(userColumns.map((column) => column.name));
  const pick = (name: string, fallback: string) => (columnNames.has(name) ? name : fallback);

  await db.exec('PRAGMA foreign_keys = OFF;');

  try {
    await db.transaction(async () => {
      await db.exec(`
        CREATE TABLE users_auth_migration (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          username TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'ADMIN',
          is_active INTEGER NOT NULL DEFAULT 1,
          account_status TEXT NOT NULL DEFAULT 'ACTIVE',
          disabled_reason TEXT,
          disabled_at TEXT,
          last_login_at TEXT,
          token_version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      await db.exec(`
        INSERT INTO users_auth_migration (
          id, email, username, password_hash, name, role, is_active,
          account_status, created_at, updated_at
        )
        SELECT
          id,
          email,
          ${pick('username', 'NULL')},
          password_hash,
          name,
          role,
          ${pick('is_active', '1')},
          CASE WHEN ${pick('is_active', '1')} = 1 THEN 'ACTIVE' ELSE 'DISABLED' END,
          created_at,
          ${pick('updated_at', 'created_at')}
        FROM users;
      `);

      await db.exec('DROP TABLE users;');
      await db.exec('ALTER TABLE users_auth_migration RENAME TO users;');
    });
  } finally {
    await db.exec('PRAGMA foreign_keys = ON;');
  }
}
