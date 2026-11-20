/**
 * Central runtime configuration.
 *
 * Every environment variable the server reads (other than JWT_SECRET, which
 * stays in the auth module) is resolved here so local development and a
 * future Vercel deployment use exactly the same code paths.
 *
 * Nothing in this file contains secrets or defaults that point at a real
 * domain. See docs/deployment/VERCEL.md and server/.env.example.
 */

import { isValidEmail } from './utils/email.js';

export type DatabaseDriverName = 'sqlite' | 'postgres' | 'pglite';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

function normalizeHostname(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/^\.+/, '')
    .toLowerCase();
}

/** Official DigiVerse contact identities (public contact, Super Admin setup, notifications). */
export const DEFAULT_PRIMARY_EMAIL = 'contact@cogniverse.co.in';
export const DEFAULT_SECONDARY_EMAIL = 'mrk@cogniverse.co.in';

function readEmailEnv(name: string, fallback: string): string {
  const value = readEnv(name)?.toLowerCase();
  return value && isValidEmail(value) ? value : fallback;
}

/**
 * The two official DigiVerse addresses. They are contact/notification addresses
 * only: configuring one never creates an account or grants a role.
 */
export function getPlatformEmails(): { primary: string; secondary: string } {
  return {
    primary: readEmailEnv('PLATFORM_PRIMARY_EMAIL', DEFAULT_PRIMARY_EMAIL),
    secondary: readEmailEnv('PLATFORM_SECONDARY_EMAIL', DEFAULT_SECONDARY_EMAIL)
  };
}

/** Identities that are no longer valid DigiVerse owner identities (never usable for first-run setup). */
export const RETIRED_PLATFORM_EMAILS: readonly string[] = ['cogniverse.digiverse@gmail.com'];

export function isRetiredPlatformEmail(email: string): boolean {
  return RETIRED_PLATFORM_EMAILS.includes(email.trim().toLowerCase());
}

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
}

/** SMTP settings, or null when SMTP is not configured (mail is then only logged). */
export function getMailConfig(): MailConfig | null {
  const host = readEnv('SMTP_HOST');
  const user = readEnv('SMTP_USER');
  const pass = readEnv('SMTP_PASS');
  if (!host || !user || !pass) return null;

  const port = Number(readEnv('SMTP_PORT')) || 587;
  const secureValue = readEnv('SMTP_SECURE');
  const { primary } = getPlatformEmails();
  return {
    host,
    port,
    secure: secureValue ? /^(1|true|yes|on)$/i.test(secureValue) : port === 465,
    user,
    pass,
    from: readEnv('MAIL_FROM') || primary,
    replyTo: readEnv('MAIL_REPLY_TO') || primary
  };
}

/** True when running inside a Vercel build or function. */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1' || Boolean(readEnv('VERCEL_ENV'));
}

export function getDatabaseDriverName(): DatabaseDriverName {
  const explicit = readEnv('DATABASE_DRIVER')?.toLowerCase();

  if (explicit === 'sqlite' || explicit === 'postgres' || explicit === 'pglite') {
    return explicit;
  }

  return readEnv('DATABASE_URL') ? 'postgres' : 'sqlite';
}

export function getDatabaseUrl(): string | undefined {
  return readEnv('DATABASE_URL');
}

/** Optional override for the local SQLite file (used by tests and scripts). */
export function getSqlitePathOverride(): string | undefined {
  return readEnv('SQLITE_PATH');
}

/**
 * Public base URL of the main DigiVerse application, e.g.
 * https://digiverse-yourname.vercel.app. When unset on Vercel, the
 * production URL that Vercel injects is used. When unset locally, the
 * request origin is used.
 */
export function getPublicAppUrl(): string | undefined {
  return (
    normalizeOrigin(readEnv('PUBLIC_APP_URL')) ||
    normalizeOrigin(readEnv('VERCEL_PROJECT_PRODUCTION_URL'))
  );
}

/**
 * Optional root domain for subdomain publishing, e.g. "sites.example.com"
 * makes a site reachable at https://<slug>.sites.example.com.
 * Requires a domain you own with a wildcard record pointing at Vercel.
 * Leave unset until a domain has been purchased.
 */
export function getSitesRootDomain(): string | undefined {
  return normalizeHostname(readEnv('SITES_ROOT_DOMAIN'));
}

export function getCorsOrigins(): string[] {
  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const extra = (readEnv('CORS_ORIGINS') || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  const appUrl = getPublicAppUrl();
  return Array.from(new Set([...defaults, ...extra, ...(appUrl ? [appUrl] : [])]));
}

/**
 * One-time setup key that allows the very first Super Admin to be created
 * from a non-local request (required on Vercel, where no request is local).
 */
export function getSetupKey(): string | undefined {
  const key = readEnv('SETUP_KEY');
  return key && key.length >= 24 ? key : undefined;
}

export type MediaStorageDriver = 'local' | 'vercel_blob';

export function getMediaStorageDriver(): MediaStorageDriver {
  return readEnv('BLOB_READ_WRITE_TOKEN') ? 'vercel_blob' : 'local';
}

/**
 * Maximum decoded upload size in bytes.
 * Vercel Functions reject request bodies above ~4.5 MB, and uploads are sent
 * as base64 JSON (about 33% larger), so the default on Vercel is 3 MB.
 */
export function getMaxUploadBytes(assetType: string): number {
  const configuredMb = Number(readEnv('MAX_UPLOAD_MB'));

  if (Number.isFinite(configuredMb) && configuredMb > 0) {
    return Math.floor(configuredMb * 1024 * 1024);
  }

  if (isVercelRuntime()) {
    return 3 * 1024 * 1024;
  }

  return assetType === 'logo' || assetType === 'hero'
    ? 10 * 1024 * 1024
    : 15 * 1024 * 1024;
}

export interface VercelDomainsConfig {
  token: string;
  /** The DigiVerse project itself (legacy shared-hosting domains). Per-site projects pass their own id. */
  projectId: string;
  teamId?: string;
}

/**
 * Reads the first defined variable. The plain VERCEL_* names are the primary
 * documented ones; the DIGIVERSE_VERCEL_* aliases exist because Vercel's own
 * dashboard may refuse user-defined variables starting with VERCEL_ and
 * because earlier DigiVerse releases used them.
 */
function readAny(...names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return undefined;
}

function readBool(value: string | undefined): boolean {
  return value !== undefined && ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Credentials for attaching custom domains. The token and team are the same
 * central DigiVerse Vercel credentials used for publishing; the project id is
 * only needed for legacy sites hosted by the shared DigiVerse project (a
 * dedicated site project passes its own id at call time).
 */
export function getVercelDomainsConfig(): VercelDomainsConfig | null {
  const token = readAny('VERCEL_TOKEN', 'DIGIVERSE_VERCEL_TOKEN', 'DIGIVERSE_VERCEL_API_TOKEN');
  const projectId = readAny('DIGIVERSE_VERCEL_PROJECT_ID') || readEnv('VERCEL_PROJECT_ID') || '';
  const teamId = readAny('VERCEL_TEAM_ID', 'DIGIVERSE_VERCEL_TEAM_ID');

  if (!token) {
    return null;
  }

  return { token, projectId, teamId };
}

export type PublishingMode = 'live' | 'mock' | 'not_configured';

export interface PublishingConfig {
  /** VERCEL_ENABLED=true was set. */
  enabled: boolean;
  /** Present on the server only. Never copy this into an API response or a log line. */
  token?: string;
  teamId?: string;
  /** Shared secret for the signed deployment webhook (optional). */
  webhookSecret?: string;
  /** PUBLISH_MOCK_MODE=true was set AND this is not a Vercel/production runtime. */
  mockMode: boolean;
  mockStepMs: number;
  mockOutcome: 'ready' | 'fail';
  mode: PublishingMode;
}

/**
 * Resolves how publishing works in this process:
 *   live            VERCEL_ENABLED=true and a token are present: real Vercel deployments.
 *   mock            VERCEL_ENABLED is off and PUBLISH_MOCK_MODE=true on a local, non-production
 *                   machine: simulated deployments that are always labelled as simulated.
 *   not_configured  anything else: publishing is disabled and the console says setup is pending.
 */
export function getPublishingConfig(): PublishingConfig {
  const enabled = readBool(readAny('VERCEL_ENABLED', 'DIGIVERSE_VERCEL_ENABLED'));
  const token = readAny('VERCEL_TOKEN', 'DIGIVERSE_VERCEL_TOKEN', 'DIGIVERSE_VERCEL_API_TOKEN');
  const teamId = readAny('VERCEL_TEAM_ID', 'DIGIVERSE_VERCEL_TEAM_ID');
  const webhookSecret = readAny('VERCEL_WEBHOOK_SECRET', 'DIGIVERSE_VERCEL_WEBHOOK_SECRET');
  const mockAllowed = !isVercelRuntime() && process.env.NODE_ENV !== 'production';
  const mockMode = mockAllowed && !enabled && readBool(readEnv('PUBLISH_MOCK_MODE'));
  const stepMs = Number(readEnv('PUBLISH_MOCK_STEP_MS'));
  const mode: PublishingMode = enabled && token ? 'live' : mockMode ? 'mock' : 'not_configured';

  return {
    enabled,
    token,
    teamId,
    webhookSecret,
    mockMode,
    mockStepMs: Number.isFinite(stepMs) && stepMs >= 0 ? stepMs : 1500,
    mockOutcome: readEnv('PUBLISH_MOCK_OUTCOME')?.toLowerCase() === 'fail' ? 'fail' : 'ready',
    mode
  };
}

/** Optional override for the directory that holds the prebuilt standalone site bundle. */
export function getSiteBundleDirOverride(): string | undefined {
  return readEnv('SITE_BUNDLE_DIR');
}

/**
 * Optional local file used by the SEO renderer instead of fetching
 * /index.html over HTTP (used by tests and local verification).
 */
export function getIndexHtmlPathOverride(): string | undefined {
  return readEnv('INDEX_HTML_PATH');
}
