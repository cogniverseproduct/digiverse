/**
 * Database entry point.
 *
 * Importing this module registers the schema initializer, so the first call
 * to getDb() creates or upgrades the schema for whichever driver is active
 * (SQLite locally, Postgres on Vercel). See driver.ts and schema.ts.
 *
 * No demo data is seeded automatically.
 */

import './schema.js';

export { getDb, getDbUninitialized, closeDb } from './driver.js';
export type { Database, DbExecutor, SqlParam } from './driver.js';
