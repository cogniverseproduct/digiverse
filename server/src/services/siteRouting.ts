/**
 * URL and hostname routing for published client websites.
 *
 * One DigiVerse deployment serves every published site:
 *   - Path routing (always available):       https://<app>/live/<slug>
 *   - Subdomain routing (needs owned domain): https://<slug>.<SITES_ROOT_DOMAIN>
 *   - Custom domain (per site, optional):    https://www.client.org
 */

import { getPublicAppUrl, getSitesRootDomain } from '../config.js';

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Slugs that would collide with application routes. */
const RESERVED_SLUGS = new Set(['api', 'live', 'preview', 'admin', 'assets', 'images', 'www', 'app']);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 63)
    .replace(/-$/, '');
}

export function isValidSiteSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function normalizeSiteSlug(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('A site address (slug) is required.');
  }

  const slug = slugify(value.trim());

  if (!isValidSiteSlug(slug)) {
    throw new Error(
      'Site address must use 1–63 lowercase letters, numbers or hyphens and cannot be a reserved word.'
    );
  }

  return slug;
}

/**
 * Builds the public URL for a site. `requestOrigin` (e.g. http://localhost:5173)
 * is used only when PUBLIC_APP_URL / the Vercel production URL is unknown.
 */
export function buildSiteUrl(slug: string, requestOrigin?: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }

  const rootDomain = getSitesRootDomain();
  if (rootDomain) {
    return `https://${slug}.${rootDomain}`;
  }

  const base = getPublicAppUrl() || (requestOrigin ? requestOrigin.replace(/\/+$/, '') : '');
  return `${base}/live/${slug}`;
}

/** Returns the site slug when the hostname is <slug>.<SITES_ROOT_DOMAIN>. */
export function slugFromHostname(hostname: string): string | null {
  const rootDomain = getSitesRootDomain();
  if (!rootDomain) return null;

  const host = hostname.toLowerCase().replace(/:\d+$/, '');
  const suffix = `.${rootDomain}`;

  if (!host.endsWith(suffix)) return null;

  const label = host.slice(0, -suffix.length);
  return label && !label.includes('.') && isValidSiteSlug(label) ? label : null;
}
