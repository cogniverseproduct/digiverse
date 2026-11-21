/**
 * Async database driver abstraction.
 *
 * - sqlite   : local development (node:sqlite, WAL). Default when no DATABASE_URL.
 * - postgres : production / Vercel (any Postgres, e.g. Neon free tier) via DATABASE_URL.
 * - pglite   : in-process Postgres (dev/test only) used to verify the Postgres
 *              code path locally without any cloud account.
 *
 * All SQL in the repositories uses `?` placeholders; they are rewritten to
 * `$1, $2, ...` for Postgres dialects.
 *
 * Transactions use AsyncLocalStorage so repository code inside
 * `db.transaction(async () => { ... })` transparently runs on the same
 * connection without having to pass a transaction handle around.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDatabaseDriverName,
  getDatabaseUrl,
  getSqlitePathOverride,
  isVercelRuntime,
  type DatabaseDriverName
} from '../config.js';

export type SqlParam = string | number | null | undefined | boolean;
export type Dialect = 'sqlite' | 'postgres';

export interface RunResult {
  changes: number;
}

export interface DbExecutor {
  readonly dialect: Dialect;
  readonly driverName: DatabaseDriverName;
  all<T = any>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T = any>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
  run(sql: string, params?: SqlParam[]): Promise<RunResult>;
  exec(sql: string): Promise<void>;
}

export interface Database extends DbExecutor {
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
  describe(): string;
}

function normalizeParams(params: SqlParam[] = []): (string | number | null)[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

/** Rewrites `?` placeholders to `$n`, skipping quoted strings. */
export function toPostgresPlaceholders(sql: string): string {
  let index = 0;
  let output = '';
  let quote: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (quote) {
      output += char;
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      output += char;
      continue;
    }

    if (char === '?') {
      index += 1;
      output += `$${index}`;
      continue;
    }

    output += char;
  }

  return output;
}

// ---------------------------------------------------------------------------
// SQLite (local development)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getDefaultSqlitePath(): string {
  return getSqlitePathOverride() || path.resolve(__dirname, '../../data/digiverse.db');
}

async function createSqliteDatabase(): Promise<Database> {
  if (isVercelRuntime()) {
    throw new Error(
      'SQLite cannot be used on Vercel because the function file system is not persistent. ' +
      'Set DATABASE_URL to a Postgres connection string (see docs/deployment/VERCEL.md).'
    );
  }

  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = getDefaultSqlitePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const raw = new DatabaseSync(dbPath);
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec('PRAGMA journal_mode = WAL;');
  raw.exec('PRAGMA busy_timeout = 10000;');

  const txContext = new AsyncLocalStorage<boolean>();
  let activeTransaction: Promise<void> | null = null;

  // node:sqlite is a single synchronous connection. While a transaction is
  // open (it may span awaits, e.g. bcrypt hashing), statements from other
  // requests wait so they never land inside someone else's transaction.
  async function waitForOtherTransactions(): Promise<void> {
    while (activeTransaction && !txContext.getStore()) {
      await activeTransaction.catch(() => undefined);
    }
  }

  const executor: Database = {
    dialect: 'sqlite',
    driverName: 'sqlite',

    async all<T>(sql: string, params?: SqlParam[]): Promise<T[]> {
      await waitForOtherTransactions();
      return raw.prepare(sql).all(...normalizeParams(params)) as T[];
    },

    async get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined> {
      await waitForOtherTransactions();
      return raw.prepare(sql).get(...normalizeParams(params)) as T | undefined;
    },

    async run(sql: string, params?: SqlParam[]): Promise<RunResult> {
      await waitForOtherTransactions();
      const result = raw.prepare(sql).run(...normalizeParams(params));
      return { changes: Number(result.changes) };
    },

    async exec(sql: string): Promise<void> {
      await waitForOtherTransactions();
      raw.exec(sql);
    },

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      if (txContext.getStore()) {
        return fn();
      }

      while (activeTransaction) {
        await activeTransaction.catch(() => undefined);
      }

      let release!: () => void;
      activeTransaction = new Promise<void>((resolve) => {
        release = resolve;
      });

      try {
        raw.exec('BEGIN IMMEDIATE;');
        try {
          const result = await txContext.run(true, fn);
          raw.exec('COMMIT;');
          return result;
        } catch (error) {
          try {
            raw.exec('ROLLBACK;');
          } catch {
            // Preserve the original error.
          }
          throw error;
        }
      } finally {
        activeTransaction = null;
        release();
      }
    },

    async close(): Promise<void> {
      raw.close();
    },

    describe(): string {
      return `SQLite (node:sqlite, WAL) at ${dbPath}`;
    }
  };

  return executor;
}

// ---------------------------------------------------------------------------
// Postgres (production) and PGlite (local Postgres verification)
// ---------------------------------------------------------------------------

interface PgLikeClient {
  query(sql: string, params: (string | number | null)[]): Promise<{ rows: any[]; rowCount?: number | null; affectedRows?: number }>;
}

function buildPostgresExecutor(
  driverName: DatabaseDriverName,
  defaultClient: PgLikeClient,
  runTransaction: <T>(fn: (client: PgLikeClient) => Promise<T>) => Promise<T>,
  close: () => Promise<void>,
  description: string
): Database {
  const txContext = new AsyncLocalStorage<PgLikeClient>();

  function currentClient(): PgLikeClient {
    return txContext.getStore() || defaultClient;
  }

  async function query(sql: string, params?: SqlParam[]) {
    return currentClient().query(toPostgresPlaceholders(sql), normalizeParams(params));
  }

  return {
    dialect: 'postgres',
    driverName,

    async all<T>(sql: string, params?: SqlParam[]): Promise<T[]> {
      const result = await query(sql, params);
      return result.rows as T[];
    },

    async get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined> {
      const result = await query(sql, params);
      return result.rows[0] as T | undefined;
    },

    async run(sql: string, params?: SqlParam[]): Promise<RunResult> {
      const result = await query(sql, params);
      return { changes: Number(result.rowCount ?? result.affectedRows ?? 0) };
    },

    async exec(sql: string): Promise<void> {
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await currentClient().query(statement, []);
      }
    },

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      const existing = txContext.getStore();
      if (existing) {
        return fn();
      }

      return runTransaction((client) => txContext.run(client, fn));
    },

    close,

    describe(): string {
      return description;
    }
  };
}

async function createPostgresDatabase(): Promise<Database> {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres.');
  }

  const pg = await import('pg');
  const Pool = pg.default?.Pool ?? (pg as any).Pool;

  // Serverless functions run many short-lived instances; keep each pool small
  // and rely on the provider's connection pooler (e.g. Neon "-pooler" host).
  const pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || (isVercelRuntime() ? 3 : 10)),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
  });

  let host = 'postgres';
  try {
    host = new URL(connectionString).hostname;
  } catch {
    // Keep the generic description.
  }

  return buildPostgresExecutor(
    'postgres',
    pool,
    async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    async () => {
      await pool.end();
    },
    `PostgreSQL at ${host}`
  );
}

async function createPgliteDatabase(): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  const dataDir = process.env.PGLITE_DATA_DIR?.trim();
  const instance = dataDir ? new PGlite(dataDir) : new PGlite();

  const asClient = (target: { query: (sql: string, params: any[]) => Promise<any> }): PgLikeClient => ({
    query: (sql, params) => target.query(sql, params)
  });

  return buildPostgresExecutor(
    'pglite',
    asClient(instance),
    (fn) => instance.transaction((tx) => fn(asClient(tx))),
    async () => {
      await instance.close();
    },
    dataDir ? `PGlite (in-process Postgres) at ${dataDir}` : 'PGlite (in-memory Postgres)'
  );
}

// ---------------------------------------------------------------------------
// Singleton access
// ---------------------------------------------------------------------------

let databasePromise: Promise<Database> | null = null;
let readyPromise: Promise<Database> | null = null;
let initializer: ((db: Database) => Promise<void>) | null = null;

/** Registers the schema initializer (set by schema.ts) that runs once per process. */
export function setDatabaseInitializer(fn: (db: Database) => Promise<void>): void {
  initializer = fn;
}

function openDatabase(): Promise<Database> {
  if (!databasePromise) {
    const driver = getDatabaseDriverName();
    databasePromise =
      driver === 'postgres'
        ? createPostgresDatabase()
        : driver === 'pglite'
          ? createPgliteDatabase()
          : createSqliteDatabase();

    databasePromise.catch(() => {
      databasePromise = null;
    });
  }

  return databasePromise;
}

/**
 * Opens the database WITHOUT creating or upgrading the schema. For maintenance scripts whose
 * dry-run / diagnose modes must not alter the database, and whose backups must capture the
 * database before the application's schema upgrade runs. A later getDb() call still initializes it.
 */
export async function getDbUninitialized(): Promise<Database> {
  return openDatabase();
}

/**
 * Returns the initialized database (schema created/migrated on first use).
 */
export async function getDb(): Promise<Database> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const db = await openDatabase();
      if (initializer) {
        await initializer(db);
      }
      return db;
    })();

    readyPromise.catch(() => {
      readyPromise = null;
    });
  }

  return readyPromise;
}

/** Closes the current database connection (tests and scripts). */
export async function closeDb(): Promise<void> {
  if (databasePromise) {
    const db = await databasePromise.catch(() => null);
    databasePromise = null;
    readyPromise = null;
    if (db) await db.close();
  }
}
