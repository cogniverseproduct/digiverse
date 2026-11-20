/**
 * Server-side SEO shell for published client websites.
 *
 * The DigiVerse frontend is a single-page app, so crawlers and link-preview
 * bots would otherwise see the generic DigiVerse <title>. On Vercel,
 * vercel.json rewrites /live/<slug> to /api/render/live/<slug>; this route
 * returns the normal index.html with the site's own title, description,
 * canonical URL, robots and Open Graph tags injected. The React app then
 * boots exactly as before.
 *
 * Locally (Vite dev server) /live/<slug> is served by Vite directly and the
 * client sets the same tags at runtime (LiveWebsitePortal).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Router, Request, Response } from 'express';
import { publishedSiteRepository, type PublishedSite } from '../db/publishedSiteRepository.js';
import { buildSiteUrl, slugFromHostname } from '../services/siteRouting.js';
import { getIndexHtmlPathOverride } from '../config.js';
import { requestOrigin } from '../services/requestOrigin.js';

const router = Router();

let cachedShell: { html: string; fetchedAt: number } | null = null;
const SHELL_TTL_MS = 5 * 60 * 1000;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


async function loadShell(req: Request): Promise<string> {
  if (cachedShell && Date.now() - cachedShell.fetchedAt < SHELL_TTL_MS) {
    return cachedShell.html;
  }

  // Prefer a file on disk: INDEX_HTML_PATH, or the built client bundled into
  // the Vercel function via vercel.json "includeFiles".
  const candidates = [
    getIndexHtmlPathOverride(),
    path.resolve(process.cwd(), 'client/dist/index.html')
  ].filter((candidate): candidate is string => Boolean(candidate));

  let html: string | undefined;

  for (const candidate of candidates) {
    try {
      html = await fs.readFile(candidate, 'utf8');
      break;
    } catch {
      // Try the next candidate.
    }
  }

  if (!html) {
    // index.html is a static file of the same deployment, served before rewrites.
    const response = await fetch(`${requestOrigin(req)}/index.html`, {
      headers: { 'x-digiverse-shell': '1' }
    });
    if (!response.ok) {
      throw new Error(`Unable to load application shell (HTTP ${response.status}).`);
    }
    html = await response.text();
  }

  cachedShell = { html, fetchedAt: Date.now() };
  return html;
}

function absoluteUrl(value: string | undefined, origin: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return undefined;
}

/** Injects site-specific SEO tags into the application shell. */
export function injectSiteMeta(shell: string, site: PublishedSite, canonicalUrl: string, origin: string): string {
  const title = site.seo.title || site.organizationName;
  const description = site.seo.description || '';
  const image = absoluteUrl(site.seo.ogImageUrl, origin);

  const tags = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta name="robots" content="${site.seo.noIndex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    site.seo.keywords?.length
      ? `<meta name="keywords" content="${escapeHtml(site.seo.keywords.join(', '))}" />`
      : ''
  ]
    .filter(Boolean)
    .join('\n    ');

  let html = shell
    // Drop the DigiVerse marketing description so the site's own one wins.
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '');

  html = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    : html.replace(/<head>/i, `<head>\n    <title>${escapeHtml(title)}</title>`);

  return html.replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

async function renderSite(site: PublishedSite | null, req: Request, res: Response): Promise<void> {
  let shell: string;

  try {
    shell = await loadShell(req);
  } catch (error) {
    console.error('[SEO Render Error]:', error);
    res.status(502).type('text/plain').send('Website shell unavailable. Please retry shortly.');
    return;
  }

  if (!site || site.status !== 'live') {
    // Let the SPA render its own "not published" state, but with a 404 status.
    res.status(404).type('html').send(shell);
    return;
  }

  const origin = requestOrigin(req);
  const canonical = buildSiteUrl(site.slug, origin, site.domainStatus === 'active' ? site.customDomain : undefined);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.type('html').send(injectSiteMeta(shell, site, canonical, origin));
}

/** GET /api/render/live/:slug (rewritten from /live/:slug on Vercel). */
router.get('/live/:slug', async (req: Request, res: Response): Promise<void> => {
  const site = await publishedSiteRepository.getBySlug(String(req.params.slug));
  await renderSite(site, req, res);
});

/**
 * GET /api/render/host
 * For subdomain or custom-domain requests (enabled later via a host-based
 * rewrite in vercel.json, see docs/deployment/VERCEL.md).
 */
router.get('/host', async (req: Request, res: Response): Promise<void> => {
  const host = String(req.hostname || '')
    .toLowerCase()
    .replace(/:\d+$/, '');

  const slug = slugFromHostname(host);
  const site = slug
    ? await publishedSiteRepository.getBySlug(slug)
    : await publishedSiteRepository.getByCustomDomain(host);

  await renderSite(site && (slug || site.domainStatus === 'active') ? site : null, req, res);
});

export default router;
