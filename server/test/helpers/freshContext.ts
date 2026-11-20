/**
 * Like testContext.ts but the database starts EMPTY (no accounts), for suites
 * that perform the one-time `/api/auth/setup` themselves. Import it first.
 */
import { startIsolated } from './isolatedApp.js';

export { getDatabase, seedFixtureAccount, FIXTURE_ADMIN } from './isolatedApp.js';
export const baseUrl: string = await startIsolated(false);
