/**
 * Vercel Function entry point for the DigiVerse API.
 *
 * vercel.json rewrites every /api/* request (and /live/<slug> for SEO) to
 * this function. Express receives the original request path, so all routes
 * defined in server/src/app.ts work unchanged.
 *
 * server/dist is produced by `npm run build --prefix server` during the
 * Vercel build step (see vercel.json "buildCommand").
 */
import app from '../server/dist/app.js';

export default app;
