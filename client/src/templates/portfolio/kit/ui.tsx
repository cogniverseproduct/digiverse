import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Dribbble, Facebook, Github, Globe, Instagram, Linkedin, Mail, MessageCircle, Twitter, Youtube, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { art } from './art';
import type { NSocial, NormalizedPortfolio } from './data';

/** Loads a Google Fonts stylesheet once (OFL-licensed families only; see LICENSES.md). */
export function useFonts(href: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[data-pf-font="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.setAttribute('data-pf-font', href);
    document.head.appendChild(l);
  }, [href]);
}

type RevealFrom = 'up' | 'left' | 'right' | 'scale' | 'fade';

/** Scroll-triggered reveal. Falls back to visible without IntersectionObserver; static under reduced motion. */
export const PfReveal: React.FC<
  React.HTMLAttributes<HTMLElement> & { as?: keyof React.JSX.IntrinsicElements; from?: RevealFrom; delay?: number }
> = ({ as = 'div', from = 'up', delay = 0, className = '', style, children, ...rest }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); } }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} data-from={from} className={`pf-reveal ${shown ? 'is-in' : ''} ${className}`} style={{ ['--pf-d' as string]: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
};

export function scrollToId(id: string) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

/** Which section id is currently in view (for active nav states). */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] || '');
  const key = ids.join('|');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

export const SocialIcon: React.FC<{ k: string; className?: string }> = ({ k, className = 'h-4 w-4' }) => {
  switch (k) {
    case 'github': return <Github className={className} />;
    case 'linkedin': return <Linkedin className={className} />;
    case 'twitter':
    case 'x': return <Twitter className={className} />;
    case 'instagram': return <Instagram className={className} />;
    case 'youtube': return <Youtube className={className} />;
    case 'dribbble':
    case 'behance': return <Dribbble className={className} />;
    case 'facebook': return <Facebook className={className} />;
    case 'whatsapp': return <MessageCircle className={className} />;
    case 'email': return <Mail className={className} />;
    default: return <Globe className={className} />;
  }
};

export const SocialRow: React.FC<{ socials: NSocial[]; className?: string; itemClass?: string; showLabel?: boolean }> = ({ socials, className = '', itemClass = '', showLabel }) => (
  <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
    {socials.map((s) => (
      <li key={s.key}>
        <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={itemClass}>
          <SocialIcon k={s.key} />
          {showLabel && <span>{s.label}</span>}
        </a>
      </li>
    ))}
  </ul>
);

/** <img> that never shows a broken-image icon: swaps to generated artwork if the source fails. */
export const SmartImg: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { seed?: string }> = ({ src, alt = '', seed = 'img', className, ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <img
      src={failed || !src ? art('mesh', seed, 'dusk') : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};

export function mailto(email: string | undefined, subject: string, body = ''): string {
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}` : '#';
}

/** Contact form that opens the visitor's mail client (no backend, no data stored). */
export function useMailtoForm(email: string | undefined, subjectPrefix: string) {
  const [sent, setSent] = useState(false);
  const submit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '');
    const from = String(f.get('email') || '');
    const message = String(f.get('message') || '');
    const topic = String(f.get('topic') || '');
    if (email && typeof window !== 'undefined') {
      window.location.href = mailto(email, `${subjectPrefix}${topic ? ` – ${topic}` : ''} (${name})`, `${message}\n\n— ${name} <${from}>`);
    }
    setSent(true);
  }, [email, subjectPrefix]);
  return { sent, submit };
}

/** Accessible full-screen image viewer with keyboard navigation (←/→/Esc). */
export const Lightbox: React.FC<{
  items: { src: string; title: string; caption?: string }[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
  tone?: 'dark' | 'light';
}> = ({ items, index, onClose, onIndex, tone = 'dark' }) => {
  useEffect(() => {
    if (index === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [index, items.length, onClose, onIndex]);
  if (index === null || !items[index]) return null;
  const it = items[index];
  const dark = tone === 'dark';
  const btn = `absolute flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`;
  return (
    <div role="dialog" aria-modal="true" aria-label={it.title} className={`fixed inset-0 z-[80] flex items-center justify-center p-4 pf-fade ${dark ? 'bg-black/92' : 'bg-white/96'}`} onClick={onClose}>
      <button type="button" aria-label="Close" onClick={onClose} className={`${btn} right-4 top-4`}><X className="h-5 w-5" /></button>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }} className={`${btn} left-3 top-1/2 -translate-y-1/2`}><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }} className={`${btn} right-3 top-1/2 -translate-y-1/2`}><ChevronRight className="h-5 w-5" /></button>
        </>
      )}
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={it.src} alt={it.title} className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain" />
        <figcaption className={`mt-3 flex items-center justify-between gap-4 text-sm ${dark ? 'text-white/80' : 'text-black/70'}`}>
          <span className="font-medium">{it.title}{it.caption ? ` · ${it.caption}` : ''}</span>
          <span className="tabular-nums opacity-70">{index + 1} / {items.length}</span>
        </figcaption>
      </figure>
    </div>
  );
};

export const ExtLink: React.FC<{ href?: string; className?: string; children: React.ReactNode }> = ({ href, className, children }) =>
  href ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></a> : null;

/* ------------------------------------------------------------------ Background */

export interface BackgroundTheme {
  /** Main text, secondary text, divider and accent colours (any CSS colour). */
  text: string; muted: string; border: string; accent: string;
  /** Optional section background and heading font. */
  bg?: string; font?: string;
}

/**
 * Education, certifications, awards and the CV link, in the template's own colours. Shared by the templates
 * that have no education section of their own, so what the Admin collects in the intake always appears.
 * Renders nothing when there is nothing to show.
 */
export const BackgroundBlock: React.FC<{
  d: NormalizedPortfolio; id: string; theme: BackgroundTheme;
  show?: { education?: boolean; recognition?: boolean; resume?: boolean };
  heading?: string; className?: string;
}> = ({ d, id, theme, show = {}, heading = 'Background', className = '' }) => {
  const education = show.education !== false && d.education.length > 0;
  const recognition = show.recognition !== false && d.recognition.length > 0;
  const resume = show.resume !== false && !!d.resumeUrl;
  if (!education && !recognition && !resume) return null;
  const col = (title: string, children: React.ReactNode) => (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>{title}</h3>
      <ul className="mt-3 divide-y" style={{ borderColor: theme.border }}>{children}</ul>
    </div>
  );
  const item = (key: string, title: string, meta: string, extra?: string, url?: string) => (
    <li key={key} className="py-3" style={{ borderColor: theme.border }}>
      <div className="text-[15px] font-semibold leading-snug" style={{ color: theme.text }}>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{title}</a> : title}
      </div>
      {meta && <div className="text-xs" style={{ color: theme.muted }}>{meta}</div>}
      {extra && <div className="mt-1 text-xs leading-relaxed" style={{ color: theme.muted }}>{extra}</div>}
    </li>
  );
  return (
    <section id={id} className={`scroll-mt-20 px-5 py-16 sm:px-8 ${className}`} style={{ background: theme.bg }} aria-label={heading}>
      <div className="mx-auto max-w-5xl">
        <PfReveal>
          <h2 className="text-2xl font-semibold sm:text-3xl" style={{ color: theme.text, fontFamily: theme.font }}>{heading}</h2>
        </PfReveal>
        <PfReveal delay={80} className="mt-8 grid gap-10 md:grid-cols-2">
          {education && col('Education', d.education.map((e) => item(e.id, e.degree, [e.institution, e.year].filter(Boolean).join(' · '), e.honors)))}
          {recognition && col('Certifications & awards', d.recognition.map((r) => item(r.id, r.title, [r.issuer, r.year].filter(Boolean).join(' · '), r.description, r.url)))}
        </PfReveal>
        {resume && (
          <PfReveal delay={120} className="mt-8">
            <a href={d.resumeUrl} target="_blank" rel="noopener noreferrer" className="pf-noprint inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition hover:opacity-80" style={{ color: theme.text, borderColor: theme.accent }}>
              Download CV <ArrowUpRight className="h-4 w-4" />
            </a>
          </PfReveal>
        )}
      </div>
    </section>
  );
};
