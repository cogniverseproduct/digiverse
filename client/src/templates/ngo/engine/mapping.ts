import type { NgoMappingFile, NgoRule } from '../types';

/**
 * The engine binds any flat view object to a template; it only reads the two brand colours itself. Social & NGO and Event
 * views both satisfy this, so one engine serves both libraries.
 */
export interface BindView { primary: string; accent: string }

/**
 * Applies a template's mapping file to the template's own page, replacing its sample content with the client's data.
 *
 * Rules of the engine (all unit tested):
 *  - Only `textContent` and `setAttribute` are used. Client text is never parsed as HTML, so it cannot inject markup.
 *  - URLs are checked per attribute (href: http, https, mailto, tel, #anchor; src: http, https).
 *  - Nothing is invented: an empty value removes the element (or the ancestor the rule names) rather than leaving sample text.
 *  - After the rules run, everything the mapping did not claim is neutralised: unmapped photographs, forms, structured data,
 *    remote links, dead anchors and long unmapped sample text.
 * The template's own layout, typography, CSS and motion are untouched.
 */

const MARK = 'data-dv';
const KEEP = 'data-dv-keep';

// ---- value expressions ---------------------------------------------------------------------------

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) cur = cur[Number(part)];
    else if (typeof cur === 'object') cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return cur;
}

const toText = (v: unknown): string => {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ');
  return '';
};

/**
 * `cycle(path; a, b, c)` picks the (n-1)th word of the list, wrapping round, where `path` holds a whole number. Templates that
 * colour things by their own class names (track colours, for example) use it to give the Nth item the Nth class.
 */
const CYCLE = /^cycle\(\s*([\w.$]+)\s*;\s*([^)]*)\)$/;

const alternatives = (s: string, scope: unknown): string => {
  for (const raw of s.split('|')) {
    const t = raw.trim();
    if (!t) continue;
    if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
    const cy = CYCLE.exec(t);
    if (cy) {
      const n = Number(toText(getPath(scope, cy[1])));
      const words = cy[2].split(',').map((w) => w.trim()).filter(Boolean);
      if (Number.isInteger(n) && n >= 1 && words.length) return words[(n - 1) % words.length];
      continue;
    }
    const v = toText(getPath(scope, t));
    if (v) return v;
  }
  return '';
};

/** `a.b|c|"literal"` picks the first non-empty alternative; `{a} · {b}` interpolates and is empty only if every placeholder is. */
export function evalExpr(expr: string, scope: unknown): string {
  if (expr.includes('{')) {
    let any = false; let missing = false;
    const out = expr.replace(/\{([^{}]+)\}/g, (_m, inner: string) => { const v = alternatives(inner, scope); if (v) any = true; else missing = true; return v; });
    if (!any) return '';
    // A part the client left blank must not leave a dangling separator behind ("a@b.org · ").
    if (!missing) return out.trim();
    // Also tidy the gap a blank middle part leaves ("a ·  · b") and a separator hugging a bracket ("[Wed · ]").
    return out
      .replace(/([[(])[\s·|,;/–-]+/g, '$1')
      .replace(/[\s·|,;/–-]+([\])])/g, '$1')
      .replace(/(\s*[·|,;/–-]\s*)(?:[·|,;/–-]\s*)+/g, '$1')
      .replace(/^[\s·|,;/–-]+|[\s·|,;/–-]+$/g, '');
  }
  return alternatives(expr, scope);
}

// ---- safe URLs -----------------------------------------------------------------------------------

export function safeAttrUrl(attr: string, value: string): string {
  const v = value.trim();
  if (!v) return '';
  const a = attr.toLowerCase();
  if (a === 'href') {
    if (v.startsWith('#') && /^#[\w-]*$/.test(v)) return v;
    if (/^(mailto:|tel:)[^\s]+$/i.test(v)) return v;
    return /^https?:\/\/[^\s]+$/i.test(v) ? v : '';
  }
  if (a === 'src' || a === 'poster') return /^https?:\/\/[^\s]+$/i.test(v) ? v : '';
  return v;
}

const FORBIDDEN_ATTRS = /^(on\w+|srcdoc|style)$/i;

// ---- DOM helpers ---------------------------------------------------------------------------------

type El = Element;
const mark = (el: El) => el.setAttribute(MARK, '1');

function remove(el: El | null | undefined) { if (el && el.parentNode) el.parentNode.removeChild(el); }
function removeTarget(el: El, spec: string | true | undefined) {
  if (spec === undefined) return;
  remove(spec === true ? el : (el.closest(spec) as El | null));
}

function pick(root: ParentNode, sel: string, all?: boolean): El[] {
  if (sel === ':scope') return [root as unknown as El];
  return all ? Array.from(root.querySelectorAll(sel)) : ([root.querySelector(sel)].filter(Boolean) as El[]);
}

function setText(el: El, value: string) { el.textContent = value; mark(el); }

/** Sets only the element's own text, keeping child elements (an icon beside a label, a highlighted last word). */
function setTextNode(el: El, value: string, first = false) {
  const nodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3);
  const target = (first ? nodes : [...nodes].reverse()).find((n) => (n.nodeValue || '').trim()) || nodes[0];
  if (target) target.nodeValue = value;
  else el.appendChild(el.ownerDocument.createTextNode(value));
  mark(el);
}

function setImage(img: El, url: string, alt: string) {
  const safe = safeAttrUrl('src', url);
  img.removeAttribute('srcset'); img.removeAttribute('sizes');
  img.setAttribute('src', safe);
  img.setAttribute('alt', alt);
  img.removeAttribute('width'); img.removeAttribute('height');
  mark(img);
}

const KEY = /^(.*?)(?:@([\w-]+))?(?:!(.+))?$/;

function fillSlot(slot: El, item: Record<string, unknown> | string | number, index: number, fields: Record<string, string>, view: unknown, nested?: NgoRule[], pristine?: Document) {
  // A list of plain strings (values, regions) is exposed to the fields as `value`.
  const base = item !== null && typeof item === 'object' ? item : { value: String(item) };
  const scope = { ...base, $: view, $n: String(index + 1).padStart(2, '0') };
  for (const [key, expr] of Object.entries(fields)) {
    const m = KEY.exec(key);
    if (!m) continue;
    const sel = (m[1] || ':scope').trim() || ':scope';
    const attr = m[2];
    const anc = m[3];
    const target = sel === ':scope' ? slot : (slot.querySelector(sel) as El | null);
    if (!target) continue;
    const value = evalExpr(expr, scope);
    const gone = () => { if (anc === ':keep') return; remove(anc ? (target.closest(anc) as El | null) : target); };
    if (!value) { if (attr === 'alt') { /* alt follows its image */ } else gone(); continue; }
    if (attr === 'image') { setImage(target, value, ''); continue; }
    if (attr === 'text') { setTextNode(target, value); continue; }
    if (attr === 'alt') { target.setAttribute('alt', value); continue; }
    if (attr) {
      if (FORBIDDEN_ATTRS.test(attr)) continue;
      const safe = safeAttrUrl(attr, value);
      if (!safe) { gone(); continue; }
      target.setAttribute(attr, safe); mark(target); continue;
    }
    setText(target, value);
  }
  // Rules nested inside a slot (a day's time slots, a ticket's feature list) resolve inside that slot and read the slot's own item.
  // Their targets are resolved first, against the slot as the template shipped it, so removals never shift a later selector.
  if (nested?.length) {
    const resolved = nested.map((r) => ({ r, targets: pick(slot, r.sel, 'repeat' in r ? true : r.all) }));
    for (const { r, targets } of resolved) applyRule(slot.ownerDocument, r, scope, targets, slot, pristine);
  }
}

// ---- rules ---------------------------------------------------------------------------------------

/** `targets` were resolved against the untouched page, so removals made by earlier rules never shift later selectors. */
function applyRule(doc: Document, rule: NgoRule, view: unknown, targets: El[], root: ParentNode = doc, pristine?: Document) {
  if ('repeat' in rule) {
    const slots = targets;
    if (!slots.length) return;
    const raw = getPath(view, rule.repeat);
    const items = ((Array.isArray(raw) ? raw : []) as Array<Record<string, unknown> | string | number>).slice(rule.offset ?? 0);
    const min = rule.min ?? 1;
    if (items.length < min) {
      slots.forEach(remove);
      // A nested rule's `section` is looked up inside its own slot, so it can never remove something elsewhere on the page.
      if (rule.section) remove(root.querySelector(rule.section));
      return;
    }
    // Prototype mode: every slot is a fresh copy of one named element from the untouched page.
    const protoEl = rule.proto && pristine ? pristine.querySelector(rule.proto) : null;
    if (protoEl) {
      const use = items.slice(0, rule.max ?? items.length);
      const anchor = slots[0];
      const fresh = use.map(() => doc.importNode(protoEl, true) as El);
      fresh.forEach((f) => anchor.parentNode?.insertBefore(f, anchor));
      slots.forEach(remove);
      fresh.forEach((slot, i) => fillSlot(slot, use[i], i, rule.fields, view, rule.nested, pristine));
      return;
    }
    const cap = rule.grow ? items.length : Math.min(rule.max ?? slots.length, slots.length);
    const use = items.slice(0, cap);
    while (rule.grow && slots.length < use.length) {
      const last = slots[slots.length - 1];
      const clone = last.cloneNode(true) as El;
      last.parentNode?.insertBefore(clone, last.nextSibling);
      slots.push(clone);
    }
    slots.forEach((slot, i) => { if (i >= use.length) remove(slot); else fillSlot(slot, use[i], i, rule.fields, view, rule.nested, pristine); });
    return;
  }

  for (const el of targets) {
    if ('remove' in rule) {
      if (!rule.ifEmpty || !evalExpr(rule.ifEmpty, view)) remove(el);
    } else if ('lenVar' in rule) {
      const n = Math.min(60, Math.max(1, evalExpr(rule.of, view).length));
      if (/^--[\w-]+$/.test(rule.lenVar)) { el.setAttribute('style', `${rule.lenVar}:${n}`); mark(el); }
    } else if ('logo' in rule) {
      const url = safeAttrUrl('src', evalExpr(rule.logo, view));
      if (url) {
        const img = el.ownerDocument.createElement('img');
        img.setAttribute('src', url); img.setAttribute('alt', '');
        img.setAttribute('style', `height:${rule.height ?? 28}px;width:auto;margin-right:.5em;vertical-align:middle;object-fit:contain`);
        img.setAttribute(MARK, '1');
        el.insertBefore(img, el.firstChild);
      }
    } else if ('literal' in rule) {
      setText(el, rule.literal);
    } else if ('text' in rule) {
      const v0 = evalExpr(rule.text, view);
      const v = (rule.leadingSpace && v0 ? ' ' : '') + (rule.trailingSpace && v0 ? `${v0} ` : v0);
      if (v) { if (rule.textNode) setTextNode(el, v, rule.textNode === 'first'); else setText(el, v); } else if (rule.emptyRemove !== undefined) removeTarget(el, rule.emptyRemove); else remove(el);
    } else if ('image' in rule) {
      const v = evalExpr(rule.image, view);
      if (v && safeAttrUrl('src', v)) setImage(el, v, ''); else if (rule.emptyRemove) removeTarget(el, rule.emptyRemove); else remove(el);
    } else if ('attr' in rule) {
      if (FORBIDDEN_ATTRS.test(rule.attr)) continue;
      const v = safeAttrUrl(rule.attr, evalExpr(rule.value, view));
      if (v) { el.setAttribute(rule.attr, v); mark(el); } else if (rule.emptyRemove !== undefined) removeTarget(el, rule.emptyRemove); else el.removeAttribute(rule.attr);
    }
  }
}

// ---- neutralising what the mapping did not claim --------------------------------------------------

const OWN_TEXT_LIMIT = 40;

function ownText(el: El): string {
  let s = '';
  for (const n of Array.from(el.childNodes)) if (n.nodeType === 3) s += n.nodeValue || '';
  return s.replace(/\s+/g, ' ').trim();
}

export function neutralise(doc: Document, mapping: NgoMappingFile) {
  const html = doc.documentElement;
  (mapping.keep || []).forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.setAttribute(KEEP, '1')));
  // Decorative artwork the template itself ships and licenses (illustrations, icons) is part of its design and is kept.
  (mapping.keepImages || []).forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.setAttribute(MARK, '1')));

  // Structured data, social cards, canonical and preload hints describe the sample organisation.
  doc.querySelectorAll('script[type="application/ld+json"], link[rel="canonical"], link[rel="alternate"], link[rel="preload"], link[rel="prefetch"], link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]').forEach(remove);
  // No third-party script may run inside a client site.
  doc.querySelectorAll('script[src]').forEach(remove);
  // Photographs, video and embeds the mapping did not set are the sample organisation's.
  doc.querySelectorAll('img, picture, source, video, audio, iframe, object, embed').forEach((el) => { if (!el.hasAttribute(MARK)) remove(el); });
  // Forms would collect data DigiVerse does not store, and some are donation forms.
  doc.querySelectorAll('form').forEach(remove);
  // Remote background images in inline styles.
  doc.querySelectorAll('[style]').forEach((el) => {
    const s = el.getAttribute('style') || '';
    if (/url\(\s*['"]?https?:/i.test(s)) el.setAttribute('style', s.replace(/background(-image)?\s*:[^;]*url\([^)]*\)[^;]*;?/gi, ''));
  });
  // Links the mapping did not set must not point at the sample organisation's addresses.
  doc.querySelectorAll('a[href]').forEach((a) => {
    if (a.hasAttribute(MARK)) return;
    const h = a.getAttribute('href') || '';
    if (/^(https?:|mailto:|tel:)/i.test(h)) a.removeAttribute('href');
  });
  // An outside link must open in its own tab; otherwise it would replace the whole site inside this frame.
  doc.querySelectorAll('a[href^="http"]').forEach((a) => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); });
  // Anchors whose section no longer exists.
  doc.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = (a.getAttribute('href') || '').slice(1);
    if (id && !doc.getElementById(id)) { const li = a.closest('li'); remove(li || a); }
  });
  // Long sample prose the mapping never touched.
  Array.from(doc.body.querySelectorAll('*')).forEach((el) => {
    if (!el.isConnected || el.hasAttribute(MARK) || el.hasAttribute(KEEP) || el.closest(`[${KEEP}]`)) return;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) return;
    if (ownText(el).length > OWN_TEXT_LIMIT) remove(el);
  });
  // Empty shells left behind by removals are harmless, but a section with no visible content must go.
  doc.body.querySelectorAll('section').forEach((s) => {
    if (!s.hasAttribute(KEEP) && !(s.textContent || '').trim() && !s.querySelector('img,svg,iframe,video')) remove(s);
  });
  html.setAttribute('data-dv-live', '');
}

/** Overrides only the colour variables a template declares in `brandVars`, and only with valid #rrggbb values. */
export function applyBrand(doc: Document, mapping: NgoMappingFile, view: BindView) {
  const decl: string[] = [];
  for (const [cssVar, which] of Object.entries(mapping.brandVars || {})) {
    const c = which === 'primary' ? view.primary : view.accent;
    if (/^--[\w-]+$/.test(cssVar) && /^#[0-9a-fA-F]{6}$/.test(c)) decl.push(`${cssVar}:${c}`);
  }
  if (!decl.length) return;
  const style = doc.createElement('style');
  style.setAttribute('data-dv-brand', '');
  style.textContent = `:root{${decl.join(';')}}`;
  doc.head.appendChild(style);
}

export type ParseHtml = (html: string) => Document;

/** Parses the template page, applies the mapping and neutralises the rest. Returns the finished HTML document. */
/**
 * A section the client has no content for is removed, and so must every in-page link that pointed to it. The link (and its list item)
 * goes, then any container the mapping lists is removed when no link is left in it, so no empty menu heading remains.
 */
function pruneDanglingLinks(doc: Document, mapping: NgoMappingFile) {
  const root = doc as unknown as ParentNode;
  const ids = new Set<string>();
  root.querySelectorAll('[id]').forEach((el) => ids.add(el.getAttribute('id') || ''));
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = (a.getAttribute('href') || '').slice(1);
    if (!id || ids.has(id)) return;
    const li = a.closest('li');
    remove((li && !li.querySelector('a:not([href="#' + id + '"])') ? li : a) as El);
  });
  for (const sel of mapping.pruneEmpty || []) {
    root.querySelectorAll(sel).forEach((c) => { if (!c.querySelector('img, video, iframe, source') && !(c.textContent || '').trim()) remove(c as El); });
  }
  for (const sel of mapping.pruneIfNoLinks || []) {
    root.querySelectorAll(sel).forEach((c) => { if (!c.querySelector('a[href]')) remove(c as El); });
  }
}

export function bindTemplate(html: string, mapping: NgoMappingFile, view: BindView, parse: ParseHtml): string {
  const doc = parse(html);
  // A second, untouched copy is only needed by mappings that build slots from a prototype.
  const pristine = JSON.stringify(mapping.rules).includes('"proto"') ? parse(html) : undefined;
  const resolved = mapping.rules.map((rule) => ({ rule, targets: pick(doc as unknown as ParentNode, rule.sel, 'repeat' in rule ? true : rule.all) }));
  for (const { rule, targets } of resolved) applyRule(doc, rule, view, targets, doc, pristine);
  pruneDanglingLinks(doc, mapping);
  applyBrand(doc, mapping, view);
  neutralise(doc, mapping);
  return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
}

/** Text a visitor can read in the finished document (used by the sample-content gate). */
export function visibleText(htmlDoc: string, parse: ParseHtml): string {
  const doc = parse(htmlDoc);
  doc.querySelectorAll('script, style, noscript, template').forEach(remove);
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
