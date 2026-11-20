/**
 * Turns one published client website into a standalone, deployable static
 * site: the prebuilt DigiVerse site bundle (static assets built once with the
 * client) plus a per-site index.html that embeds the site's sanitised data.
 *
 * Inputs are never arbitrary. Every deployed file is one of:
 *   - a file listed in the build-time bundle manifest (path-checked), or
 *   - a file generated here (index.html, vercel.json, robots.txt).
 * Client-supplied text only ever reaches the page as JSON inside a
 * <script type="application/json"> block with every "<" escaped, and as
 * escaped meta tags.
 *
 * The bundle comes from `server/scripts/build-site-bundle.mjs`
 * (`server/dist/site-bundle`), or from `client/dist` when running locally.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPublicAppUrl, getSiteBundleDirOverride } from '../../config.js';
import type { PublishedSite, SiteSeoSettings } from '../../db/publishedSiteRepository.js';
import { sanitizeWebsiteForPublic } from '../publicSiteSanitizer.js';
import { injectSiteMeta } from '../../routes/render.js';
import { sha1Hex } from './vercelClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 80 * 1024 * 1024;
export const MAX_FILES = 3000;
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._@~+\-/]*$/;
const TEMPLATE_FILE = 'site.html';
const DATA_SCRIPT_ID = 'dv-site-data';

export type ExportErrorCode =
  | 'BUNDLE_MISSING'
  | 'BUNDLE_INVALID'
  | 'EXPORT_TOO_LARGE'
  | 'MEDIA_ORIGIN_MISSING'
  | 'SITE_EMPTY';

export class ExportError extends Error {
  readonly code: ExportErrorCode;
  constructor(code: ExportErrorCode, message: string) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
  }
}

export interface BundleFile {
  /** Path inside the deployment, forward slashes, no leading slash. */
  path: string;
  sha1: string;
  size: number;
  /** Absolute path on disk (omitted for generated files). */
  absolutePath?: string;
}

export interface LoadedBundle {
  dir: string;
  template: string;
  files: BundleFile[];
}

export interface ExportedFile {
  path: string;
  size: number;
  sha1: string;
  /** Static asset read from disk at upload time. */
  absolutePath?: string;
  /** Small generated file, sent inline. */
  content?: Buffer;
}

export interface ExportedSite {
  files: ExportedFile[];
  bundleHash: string;
  fileCount: number;
  totalBytes: number;
}

/* ------------------------------------------------------------------ bundle */

let cachedBundle: { key: string; bundle: LoadedBundle } | null = null;

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

export function isSafeBundlePath(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    SAFE_PATH.test(value) &&
    !value.split('/').some((part) => part === '..' || part === '.' || part === '' || part.startsWith('.'))
  );
}

function candidateDirs(): string[] {
  return [
    getSiteBundleDirOverride(),
    path.resolve(__dirname, '../../site-bundle'), // compiled: server/dist/services/publishing -> server/dist/site-bundle
    path.resolve(__dirname, '../../../dist/site-bundle'), // tsx: server/src/services/publishing -> server/dist/site-bundle
    path.resolve(process.cwd(), 'server/dist/site-bundle'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../../../client/dist')
  ].filter((dir): dir is string => Boolean(dir));
}

/** Finds the prebuilt standalone bundle, or returns null when it has not been built. */
export async function loadSiteBundle(): Promise<LoadedBundle | null> {
  for (const dir of candidateDirs()) {
    if (!(await exists(path.join(dir, TEMPLATE_FILE)))) continue;

    const manifestPath = path.join(dir, 'manifest.json');
    const stat = await fs.stat(path.join(dir, TEMPLATE_FILE));
    const key = `${dir}:${stat.mtimeMs}`;
    if (cachedBundle?.key === key) return cachedBundle.bundle;

    const template = await fs.readFile(path.join(dir, TEMPLATE_FILE), 'utf8');
    const files: BundleFile[] = [];

    if (await exists(manifestPath)) {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (!Array.isArray(manifest?.files)) {
        throw new ExportError('BUNDLE_INVALID', 'The site bundle manifest is not valid.');
      }
      for (const item of manifest.files) {
        if (!isSafeBundlePath(String(item.path)) || !/^[0-9a-f]{40}$/.test(String(item.sha1))) {
          throw new ExportError('BUNDLE_INVALID', 'The site bundle manifest contains an unsafe entry.');
        }
        files.push({ path: item.path, sha1: item.sha1, size: Number(item.size), absolutePath: path.join(dir, 'files', item.path) });
      }
    } else {
      // Development fallback: compute the manifest straight from a built client folder.
      for (const rel of await walk(dir)) {
        if (rel === TEMPLATE_FILE || rel === 'index.html' || rel === 'manifest.json' || rel.endsWith('.map')) continue;
        if (!isSafeBundlePath(rel)) continue;
        const absolutePath = path.join(dir, rel);
        const data = await fs.readFile(absolutePath);
        files.push({ path: rel, sha1: sha1Hex(data), size: data.length, absolutePath });
      }
    }

    const bundle = { dir, template, files };
    cachedBundle = { key, bundle };
    return bundle;
  }
  return null;
}

/** Test hook. */
export function resetSiteBundleCache(): void {
  cachedBundle = null;
}

/* ----------------------------------------------------------------- payload */

/** Escapes JSON for safe embedding inside a <script type="application/json"> element. */
export function escapeJsonForHtml(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Rewrites DigiVerse-relative media URLs so the standalone site loads them from the DigiVerse origin. */
export function absolutizeMedia<T>(value: T, origin: string): { value: T; rewritten: number } {
  let rewritten = 0;
  const walkNode = (node: any): any => {
    if (typeof node === 'string') {
      if (node.startsWith('/api/media/')) {
        rewritten += 1;
        return `${origin}${node}`;
      }
      return node;
    }
    if (Array.isArray(node)) return node.map(walkNode);
    if (node && typeof node === 'object') {
      const next: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(node)) next[key] = walkNode(child);
      return next;
    }
    return node;
  };
  return { value: walkNode(value), rewritten };
}

function countRelativeMedia(node: unknown): number {
  let count = 0;
  const visit = (n: any): void => {
    if (typeof n === 'string') { if (n.startsWith('/api/media/')) count += 1; return; }
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (n && typeof n === 'object') Object.values(n).forEach(visit);
  };
  visit(node);
  return count;
}

export function buildSiteDataPayload(site: PublishedSite, canonicalUrl: string, origin: string | undefined) {
  const sanitized = sanitizeWebsiteForPublic(site.website);
  if (!sanitized || typeof sanitized !== 'object' || Object.keys(sanitized).length === 0) {
    throw new ExportError('SITE_EMPTY', 'The generated website is empty.');
  }

  let generatedWebsite: any = sanitized;
  if (countRelativeMedia(sanitized) > 0) {
    if (!origin) {
      throw new ExportError(
        'MEDIA_ORIGIN_MISSING',
        'Uploaded images are stored on this DigiVerse server. Set PUBLIC_APP_URL so the published site can load them.'
      );
    }
    generatedWebsite = absolutizeMedia(sanitized, origin).value;
  }

  return {
    success: true,
    standalone: true,
    slug: site.slug,
    organizationName: site.organizationName,
    category: site.category,
    generatedWebsite,
    seo: { ...site.seo, canonicalUrl },
    publishedAt: site.publishedAt
  };
}

/* ------------------------------------------------------------- generated files */

function siteVercelJson(): string {
  return JSON.stringify({
    cleanUrls: true,
    trailingSlash: false,
    rewrites: [{ source: '/(.*)', destination: '/index.html' }],
    headers: [
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  }, null, 2);
}

function robotsTxt(seo: SiteSeoSettings): string {
  return seo.noIndex ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n';
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The page deployed when a site is unpublished. Contains no client data except the (escaped) name. */
export function offlinePageHtml(organizationName: string): string {
  const name = escapeText(organizationName || 'This website');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${name} is offline</title>
<style>
  html,body{height:100%;margin:0}
  body{display:grid;place-items:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:center;padding:24px}
  h1{font-size:1.5rem;margin:0 0 .5rem} p{margin:0;color:#94a3b8}
</style>
</head>
<body><main><h1>${name}</h1><p>This website is currently offline.</p></main></body>
</html>
`;
}

function inline(pathName: string, text: string): ExportedFile {
  const content = Buffer.from(text, 'utf8');
  return { path: pathName, size: content.length, sha1: sha1Hex(content), content };
}

function hashFiles(files: ExportedFile[]): string {
  const hash = createHash('sha1');
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(`${file.path}:${file.sha1}\n`);
  }
  return hash.digest('hex');
}

function finalize(files: ExportedFile[]): ExportedSite {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (files.length > MAX_FILES || totalBytes > MAX_TOTAL_BYTES || files.some((f) => f.size > MAX_FILE_BYTES)) {
    throw new ExportError('EXPORT_TOO_LARGE', 'The website is too large to deploy.');
  }
  return { files, bundleHash: hashFiles(files), fileCount: files.length, totalBytes };
}

/* ------------------------------------------------------------------ exports */

export interface ExportInput {
  site: PublishedSite;
  /** Final public URL used for canonical tags (the deployment's production URL when known). */
  canonicalUrl: string;
  /** Public origin of DigiVerse, used to load uploaded media. */
  requestOrigin?: string;
  /** When false the bundle is not required (mock deployments never upload files). */
  requireBundle: boolean;
}

export async function exportSite(input: ExportInput): Promise<ExportedSite> {
  const origin = getPublicAppUrl() || input.requestOrigin;
  const payload = buildSiteDataPayload(input.site, input.canonicalUrl, origin);
  const json = escapeJsonForHtml(JSON.stringify(payload));
  if (Buffer.byteLength(json, 'utf8') > MAX_PAYLOAD_BYTES) {
    throw new ExportError('EXPORT_TOO_LARGE', 'The website content is too large to deploy.');
  }

  const bundle = await loadSiteBundle();
  if (!bundle && input.requireBundle) {
    throw new ExportError(
      'BUNDLE_MISSING',
      'The standalone site bundle has not been built. Run the DigiVerse build (npm run build in server) before publishing.'
    );
  }

  const template = bundle?.template ||
    '<!doctype html><html><head><title></title></head><body><div id="root"></div></body></html>';
  const withMeta = injectSiteMeta(template, input.site, input.canonicalUrl, origin || '');
  const dataScript = `<script id="${DATA_SCRIPT_ID}" type="application/json">${json}</script>`;
  const indexHtml = /<\/body>/i.test(withMeta)
    ? withMeta.replace(/<\/body>/i, `${dataScript}\n</body>`)
    : `${withMeta}\n${dataScript}`;

  const files: ExportedFile[] = [
    inline('index.html', indexHtml),
    inline('vercel.json', siteVercelJson()),
    inline('robots.txt', robotsTxt(input.site.seo))
  ];

  const taken = new Set(files.map((f) => f.path));
  for (const file of bundle?.files || []) {
    if (taken.has(file.path)) continue; // generated files always win
    files.push({ path: file.path, size: file.size, sha1: file.sha1, absolutePath: file.absolutePath });
  }

  return finalize(files);
}

export function exportOfflinePage(organizationName: string): ExportedSite {
  return finalize([
    inline('index.html', offlinePageHtml(organizationName)),
    inline('vercel.json', JSON.stringify({ cleanUrls: true, headers: [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] }, null, 2)),
    inline('robots.txt', 'User-agent: *\nDisallow: /\n')
  ]);
}
