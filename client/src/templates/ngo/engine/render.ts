import type { NgoMappingFile, NgoTemplateProps } from '../types';
import { normalizeNgo } from '../kit/data';
import { bindTemplate, type ParseHtml } from './mapping';

/**
 * How a template page is shown:
 *  - `original`: the upstream template exactly as published, with its own sample content (library preview).
 *  - `sample`:   the template bound to a fictional sample organisation (shows how a client's data lands).
 *  - `live`:     the template bound to the project's real data (Studio, Client Preview, published site).
 */
export type NgoRenderMode = 'original' | 'sample' | 'live';

export const bundleBase = (templateId: string) => `/ngo-templates/${templateId}/`;

const parseInBrowser: ParseHtml = (html) => new DOMParser().parseFromString(html, 'text/html');

interface Loaded { html: string; mapping: NgoMappingFile }
const cache = new Map<string, Promise<Loaded>>();

export function loadBundle(templateId: string, entry = 'index.html'): Promise<Loaded> {
  const key = `${templateId}/${entry}`;
  let p = cache.get(key);
  if (!p) {
    const base = bundleBase(templateId);
    p = Promise.all([
      fetch(base + entry).then((r) => { if (!r.ok) throw new Error(`Template page not found (${r.status}).`); return r.text(); }),
      fetch(base + 'mapping.json').then((r) => { if (!r.ok) throw new Error(`Template mapping not found (${r.status}).`); return r.json() as Promise<NgoMappingFile>; }),
    ]).then(([html, mapping]) => ({ html, mapping }));
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/**
 * Produces the finished page for the sandboxed frame. Binding happens before the page runs, so the template's own scripts
 * (menus, scroll scenes) see the final content. `original` mode returns the upstream page unchanged apart from a base URL.
 */
export function renderBundleHtml(loaded: Loaded, props: NgoTemplateProps, mode: NgoRenderMode, origin: string, parse: ParseHtml = parseInBrowser): string {
  if (mode === 'original') return loaded.html;
  const view = normalizeNgo({ ...props, isDemo: mode === 'sample' }, origin);
  return bindTemplate(loaded.html, loaded.mapping, view, parse);
}
