/**
 * Bootstrap for the API integration suites that log in as the fixture accounts
 * `admin@digiverse.internal` / `superadmin@digiverse.internal`.
 *
 * Why: those accounts were once seeded automatically. The platform no longer
 * seeds anything (src/db/database.ts), so every suite failed in `before()` with
 * a non-200 login, and they defaulted to http://localhost:3001 (a developer's
 * real server). Now, unless TEST_API_URL is set, importing this module starts
 * the real app on a temporary database and creates the two accounts through the
 * repository with real bcrypt hashes. Production auth has no knowledge of them.
 *
 * IMPORT THIS FIRST in a test file: the environment must be prepared before
 * anything from ../src loads. Suites that run first-time setup themselves use
 * ./freshContext.js instead.
 */
import { startIsolated } from './isolatedApp.js';

export { getDatabase, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './isolatedApp.js';
export const baseUrl: string = await startIsolated(true);
