import type { EventMappingFile, EventTemplateProps } from '../types';
import { normalizeEvent } from '../kit/data';
import { bindTemplate, type ParseHtml } from '../../ngo/engine/mapping';

/**
 * How an event template page is shown:
 *  - `original`: the upstream template exactly as published, with its own sample content (library preview).
 *  - `sample`:   the template bound to a fictional sample event (shows how a client's data lands).
 *  - `live`:     the template bound to the project's real data (Studio, Client Preview, published site).
 * The binder is the same one the Social & NGO library uses; only the view and the bundle folder differ.
 */
export type EventRenderMode = 'original' | 'sample' | 'live';

export const eventBundleBase = (templateId: string) => `/event-templates/${templateId}/`;

const parseInBrowser: ParseHtml = (html) => new DOMParser().parseFromString(html, 'text/html');

interface Loaded { html: string; mapping: EventMappingFile }
const cache = new Map<string, Promise<Loaded>>();

export function loadEventBundle(templateId: string, entry = 'index.html'): Promise<Loaded> {
  const key = `${templateId}/${entry}`;
  let p = cache.get(key);
  if (!p) {
    const base = eventBundleBase(templateId);
    p = Promise.all([
      fetch(base + entry).then((r) => { if (!r.ok) throw new Error(`Template page not found (${r.status}).`); return r.text(); }),
      fetch(base + 'mapping.json').then((r) => { if (!r.ok) throw new Error(`Template mapping not found (${r.status}).`); return r.json() as Promise<EventMappingFile>; }),
    ]).then(([html, mapping]) => ({ html, mapping }));
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/**
 * Produces the finished page for the sandboxed frame. Binding happens before the page runs, so the template's own scripts
 * (countdowns, tabs, menus) see the final content. `original` mode returns the upstream page unchanged.
 */
export function renderEventBundleHtml(loaded: Loaded, props: EventTemplateProps, mode: EventRenderMode, origin: string, parse: ParseHtml = parseInBrowser): string {
  if (mode === 'original') return loaded.html;
  const view = normalizeEvent({ ...props, isDemo: mode === 'sample' }, origin);
  return bindTemplate(loaded.html, loaded.mapping, view, parse);
}
