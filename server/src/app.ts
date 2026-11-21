/**
 * DigiVerse Express application (no network listener).
 *
 * - Local development: server.ts imports this app and calls listen().
 * - Vercel: api/index.js imports this app and exports it as the handler
 *   for every /api/* request (see vercel.json).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/adminUsers.js';
import superAdminRoutes from './routes/superAdmins.js';
import tenantRoutes from './routes/tenants.js';
import projectRoutes from './routes/projects.js';
import mediaRoutes from './routes/media.js';
import previewRoutes from './routes/preview.js';
import commercialRoutes from './routes/commercial.js';
import liveRoutes from './routes/live.js';
import siteRoutes from './routes/sites.js';
import renderRoutes from './routes/render.js';
import publishingRoutes from './routes/publishing.js';
import vercelWebhookRoutes from './routes/vercelWebhook.js';
import { getDb } from './db/database.js';
import { repository } from './db/repository.js';
import { DemoInquiry } from './types/index.js';
import { getCorsOrigins, getMediaStorageDriver, getProductionConfigProblems, isVercelRuntime } from './config.js';

if (isVercelRuntime() || process.env.NODE_ENV === 'production') {
  for (const problem of getProductionConfigProblems()) {
    console.error(`[config] ${problem}`);
  }
}

const app = express();

// Behind Vercel's proxy, use X-Forwarded-* for protocol, host and client IP.
// Locally there is no proxy in front of Express, so req.ip stays the socket address.
if (isVercelRuntime()) {
  app.set('trust proxy', true);
}

app.disable('x-powered-by');

app.use(cors({
  origin: getCorsOrigins(),
  credentials: true
}));
// The Vercel webhook needs the raw request bytes to verify its signature, so it is mounted before the JSON parser.
app.use('/api/vercel/webhook', vercelWebhookRoutes);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Health Check with Database and Service Introspection
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'healthy';
  let engine = 'unknown';

  try {
    const db = await getDb();
    // Public endpoint: report only the engine family, never the SQLite file path or the Postgres host.
    engine = { sqlite: 'SQLite', postgres: 'PostgreSQL', pglite: 'PGlite' }[db.driverName] ?? 'unknown';
    await db.get('SELECT 1');
  } catch (err) {
    // The detail (which can name hosts or paths) goes to the server log, not to anonymous callers.
    console.error('[health] database check failed:', err instanceof Error ? err.message : err);
    dbStatus = 'unhealthy';
  }

  const driveMode = (process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_ACCESS_TOKEN)
    ? 'live_api'
    : 'development_mock_adapter';

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    service: 'Digiverse Platform Central API',
    version: '1.2.0',
    runtime: isVercelRuntime() ? 'vercel' : 'node',
    database: {
      engine,
      status: dbStatus
    },
    mediaStorage: getMediaStorageDriver(),
    integrations: {
      googleDrive: {
        mode: driveMode,
        proxyDelivery: 'enabled (/api/media/drive/proxy/:fileId)'
      },
      youtubeVideos: {
        mode: 'active_embed_validator',
        formatsSupported: ['watch?v=', 'youtu.be/', 'shorts/', 'playlist?list=']
      }
    },
    timestamp: new Date().toISOString()
  });
});

// POST /api/inquiries - Submit client demo request
app.post('/api/inquiries', async (req, res) => {
  const { name, organization, email, phone, organizationType, preferredLanguage, requirements: reqText } = req.body ?? {};

  if (!name || !organization || !email) {
    res.status(400).json({ error: 'Name, organization name, and email are required.' });
    return;
  }

  const newInquiry: DemoInquiry = {
    id: `inq_${Date.now()}`,
    name: String(name).trim(),
    organization: String(organization).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : undefined,
    organizationType: organizationType || 'cultural',
    preferredLanguage: preferredLanguage || 'bilingual',
    requirements: reqText ? String(reqText).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  await repository.saveInquiry(newInquiry);
  console.log(`[Digiverse Demo Request]: Persisted from ${newInquiry.name} (${newInquiry.organization})`);

  res.status(201).json({
    success: true,
    message: 'আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের দল শীঘ্রই আপনার সাথে যোগাযোগ করবে। (Your request has been successfully recorded. Our team will contact you shortly.)',
    inquiry: newInquiry
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admins', superAdminRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/commercial', commercialRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api', publishingRoutes);
app.use('/api/render', renderRoutes);

// On Vercel, vercel.json rewrites /live/<slug> to the API function while
// keeping the original path, so the SEO shell is also served from /live/.
// (Locally the Vite dev server answers /live/<slug> before it reaches here.)
app.get('/live/:slug', (req, res, next) => {
  req.url = `/live/${encodeURIComponent(String(req.params.slug))}`;
  renderRoutes(req, res, next);
});

// A hashed build asset that no longer exists (an old tab after a redeploy). vercel.json routes unknown
// /assets/* requests here so they get a real 404 instead of the SPA shell with a long-lived cache header.
app.use('/assets', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(404).type('text/plain').send('Asset not found');
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global Error Handler (Express 5 forwards rejected async handlers here)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Digiverse Server Error]:', err);

  if (res.headersSent) {
    return;
  }

  const status = (err as any)?.status === 413 || (err as any)?.type === 'entity.too.large' ? 413 : 500;
  res.status(status).json({
    error: status === 413 ? 'Request body is too large.' : 'Internal server error occurred.'
  });
});

export default app;
