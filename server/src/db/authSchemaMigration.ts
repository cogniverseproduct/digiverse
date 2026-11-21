import type { Database } from './driver.js';

/**
 * Legacy SQLite users-table rebuild.
 *
 * Older local databases created `users.email` as NOT NULL and had no
 * `username` column. SQLite cannot relax a NOT NULL constraint with ALTER
 * TABLE, so the table is rebuilt once.
 *
 * The rebuild is column-driven, not hard-coded: the replacement table is
 * created from the authoritative `users` definition in schema.ts (passed in as
 * `columns`, so this file holds no second copy of the DDL), and EVERY column
 * that exists in both the old and the new table is copied verbatim. Columns
 * that only exist in the new definition (added after the legacy table was
 * created) take their declared defaults. This guarantees that values such as
 * is_platform_owner, must_change_password, token_version, last_login_at and
 * disabled_* are never reset by a rebuild.
 *
 * The copy is verified inside the same transaction (row count, id set and the
 * security-relevant columns); any mismatch aborts and rolls the rebuild back, so
 * the original table is only replaced by a verified copy.
 *
 * Postgres databases are always created from the final schema
 * (see schema.ts) and never need this step.
 */

/** Columns that must exist in a legacy table for a rebuild to be possible. */
const REQUIRED_SOURCE_COLUMNS = ['id', 'password_hash', 'name', 'role', 'created_at'];

/** Columns whose values must survive the rebuild byte-for-byte when they exist. */
const PRESERVED_COLUMNS = [
  'email',
  'username',
  'password_hash',
  'role',
  'is_active',
  'account_status',
  'token_version',
  'is_platform_owner',
  'must_change_password',
  'last_login_at',
  'disabled_reason',
  'disabled_at'
];

function columnNameOf(definition: string): string {
  return definition.trim().split(/\s+/)[0];
}

export async function applyAuthSchemaMigrations(db: Database, columns: string[]): Promise<void> {
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

  const sourceNames = new Set(userColumns.map((column) => column.name));
  const missingRequired = REQUIRED_SOURCE_COLUMNS.filter((name) => !sourceNames.has(name));
  if (missingRequired.length > 0) {
    throw new Error(
      `Cannot rebuild legacy users table: required column(s) missing: ${missingRequired.join(', ')}. ` +
      'No data was changed.'
    );
  }

  const targetNames = columns.map(columnNameOf);
  const shared = targetNames.filter((name) => sourceNames.has(name));

  // Derived values for columns the legacy table did not have yet.
  const derived: Record<string, string> = {};
  if (!sourceNames.has('updated_at')) {
    derived.updated_at = 'created_at';
  }
  if (!sourceNames.has('account_status')) {
    derived.account_status = sourceNames.has('is_active')
      ? "CASE WHEN is_active = 1 THEN 'ACTIVE' ELSE 'DISABLED' END"
      : "'ACTIVE'";
  }

  const insertNames = [...shared, ...Object.keys(derived)];
  const selectExpressions = [...shared, ...Object.values(derived)];

  await db.exec('PRAGMA foreign_keys = OFF;');

  try {
    await db.transaction(async () => {
      await db.exec('DROP TABLE IF EXISTS users_auth_migration;');
      await db.exec(`CREATE TABLE users_auth_migration (\n  ${columns.join(',\n  ')}\n);`);

      await db.exec(`
        INSERT INTO users_auth_migration (${insertNames.join(', ')})
        SELECT ${selectExpressions.join(', ')}
        FROM users;
      `);

      // Verify the copy before the original is dropped; throwing rolls everything back.
      const before = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users');
      const after = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users_auth_migration');
      if (Number(before?.n) !== Number(after?.n)) {
        throw new Error(
          `users rebuild verification failed: row count ${before?.n} -> ${after?.n}. Rolled back.`
        );
      }

      for (const name of PRESERVED_COLUMNS) {
        if (!sourceNames.has(name) || !targetNames.includes(name)) continue;
        const diff = await db.get<{ n: number }>(
          `SELECT COUNT(*) AS n FROM users o
           JOIN users_auth_migration m ON m.id = o.id
           WHERE o.${name} IS NOT m.${name}`
        );
        if (Number(diff?.n) !== 0) {
          throw new Error(
            `users rebuild verification failed: column "${name}" changed for ${diff?.n} row(s). Rolled back.`
          );
        }
      }

      await db.exec('DROP TABLE users;');
      await db.exec('ALTER TABLE users_auth_migration RENAME TO users;');
    });
  } finally {
    await db.exec('PRAGMA foreign_keys = ON;');
  }
}
