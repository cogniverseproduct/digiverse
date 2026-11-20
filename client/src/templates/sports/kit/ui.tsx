import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Facebook, Globe, Instagram, Linkedin, Mail, MessageCircle, Twitter, X, Youtube } from 'lucide-react';
import { art } from './art';
import type { NBatch, NBracketMatch, NSocial, NStage, NStandingRow } from './data';
import { batchesByDay } from './data';

/** Loads a Google Fonts stylesheet once (SIL OFL families only; see LICENSES.md). */
export function useSportsFonts(href: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[data-sp-font="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.setAttribute('data-sp-font', href);
    document.head.appendChild(l);
  }, [href]);
}

type RevealFrom = 'up' | 'left' | 'right' | 'scale' | 'fade';

/** Scroll-triggered reveal. Visible immediately without IntersectionObserver; static under reduced motion. */
export const SpReveal: React.FC<React.HTMLAttributes<HTMLElement> & { as?: keyof React.JSX.IntrinsicElements; from?: RevealFrom; delay?: number }> = ({ as = 'div', from = 'up', delay = 0, className = '', style, children, ...rest }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) { setShown(true); io.disconnect(); } }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} data-from={from} className={`sp-reveal ${shown ? 'is-in' : ''} ${className}`} style={{ ['--sp-d' as string]: `${delay}ms`, ...style }} {...rest}>
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
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: '-35% 0px -55% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

export const SocialIcon: React.FC<{ k: string; className?: string }> = ({ k, className = 'h-4 w-4' }) => {
  switch (k) {
    case 'facebook': return <Facebook className={className} />;
    case 'instagram': return <Instagram className={className} />;
    case 'youtube': return <Youtube className={className} />;
    case 'twitter':
    case 'x': return <Twitter className={className} />;
    case 'linkedin': return <Linkedin className={className} />;
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
export const SmartImg: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { seed?: string; kind?: Parameters<typeof art>[0]; palette?: Parameters<typeof art>[2] }> = ({ src, alt = '', seed = 'img', kind = 'mesh', palette = 'night', className, ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img src={failed || !src ? art(kind, seed, palette) : src} alt={alt} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} className={className} {...rest} />;
};

/** Visible only in the template library and the preview route; never on a generated client site. */
export const DemoBadge: React.FC<{ show?: boolean }> = ({ show }) => show ? (
  <div role="note" className="sp-noprint pointer-events-none fixed bottom-3 left-3 z-[60] rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-lg ring-1 ring-white/20">
    Sample content: fictional club, not real results
  </div>
) : null;

export function mailto(email: string | undefined, subject: string, body = ''): string {
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}` : '#';
}

/** Enquiry form that opens the visitor's mail client (no backend call, no data stored). */
export function useMailtoForm(email: string | undefined, subjectPrefix: string) {
  const [sent, setSent] = useState(false);
  const submit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '');
    const from = String(f.get('email') || '');
    const phone = String(f.get('phone') || '');
    const message = String(f.get('message') || '');
    const topic = String(f.get('topic') || '');
    if (email && typeof window !== 'undefined') {
      window.location.href = mailto(email, `${subjectPrefix}${topic ? ` – ${topic}` : ''} (${name})`, `${message}\n\n— ${name}${from ? ` <${from}>` : ''}${phone ? `, ${phone}` : ''}`);
    }
    setSent(true);
  }, [email, subjectPrefix]);
  return { sent, submit };
}

/** Counts down to a real date the admin entered; `done` flips once it has passed. */
export function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = target.getTime() - now;
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: false };
}

/** Accessible full-screen image viewer with keyboard navigation (arrows and Escape). */
export const Lightbox: React.FC<{ items: { src: string; caption?: string }[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }> = ({ items, index, onClose, onIndex }) => {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndex]);
  if (index === null || !items[index]) return null;
  const it = items[index];
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
      {items.length > 1 && <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }} className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>}
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={it.src} alt={it.caption || ''} className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain" />
        {it.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{it.caption}</figcaption>}
      </figure>
      {items.length > 1 && <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }} className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>}
    </div>
  );
};

/** W / D / L chips for a team's recent form. */
export const FormChips: React.FC<{ form: string[]; className?: string; chip?: (f: string) => string }> = ({ form, className = '', chip }) => (
  <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`Recent form ${form.join(' ')}`}>
    {form.slice(-5).map((f, i) => {
      const k = f.toUpperCase();
      const base = chip ? chip(k) : k === 'W' ? 'bg-emerald-500 text-white' : k === 'D' ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white';
      return <span key={i} className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${base}`}>{k}</span>;
    })}
  </span>
);

export interface TableTheme {
  wrap?: string; table?: string; th?: string; tr?: string; td?: string; us?: string; pos?: string; points?: string; name?: string;
  chip?: (f: string) => string;
}

/** League table. The look comes entirely from the `theme` classes the template passes in. */
export const StandingsTable: React.FC<{ rows: NStandingRow[]; theme?: TableTheme; showForm?: boolean; limit?: number; label?: string; compact?: boolean }> = ({ rows, theme = {}, showForm = true, limit, label = 'League table', compact = false }) => {
  const shown = limit ? rows.slice(0, limit) : rows;
  const hasGoals = !compact && shown.some((r) => typeof r.gf === 'number');
  const hasForm = showForm && !compact && shown.some((r) => r.form.length > 0);
  return (
    <div className={`relative overflow-x-auto ${theme.wrap || ""}`} role="region" aria-label={label} tabIndex={0}>
      <table className={`w-full ${compact ? '' : 'min-w-[520px]'} border-collapse text-left text-sm ${theme.table || ''}`}>
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className={theme.th || 'text-xs uppercase tracking-wider opacity-70'}>
            <th scope="col" className="px-3 py-2.5">#</th>
            <th scope="col" className="px-3 py-2.5">Team</th>
            <th scope="col" className="px-2 py-2.5 text-center">P</th>
            {!compact && <th scope="col" className="px-2 py-2.5 text-center">W</th>}
            {!compact && <th scope="col" className="px-2 py-2.5 text-center">D</th>}
            {!compact && <th scope="col" className="px-2 py-2.5 text-center">L</th>}
            {hasGoals && <th scope="col" className="px-2 py-2.5 text-center">GD</th>}
            <th scope="col" className="px-3 py-2.5 text-center">Pts</th>
            {hasForm && <th scope="col" className="px-3 py-2.5 text-center">Form</th>}
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={`${r.position}-${r.name}`} className={`${theme.tr || ''} ${r.isUs ? theme.us || 'font-semibold' : ''}`}>
              <td className={`px-3 py-2.5 tabular-nums ${theme.pos || ''}`}>{r.position}</td>
              <td className={`px-3 py-2.5 ${theme.name || 'font-medium'}`}>{r.name}</td>
              <td className={`px-2 py-2.5 text-center tabular-nums ${theme.td || ''}`}>{r.played}</td>
              {!compact && <td className={`px-2 py-2.5 text-center tabular-nums ${theme.td || ''}`}>{r.won}</td>}
              {!compact && <td className={`px-2 py-2.5 text-center tabular-nums ${theme.td || ''}`}>{r.drawn}</td>}
              {!compact && <td className={`px-2 py-2.5 text-center tabular-nums ${theme.td || ''}`}>{r.lost}</td>}
              {hasGoals && <td className={`px-2 py-2.5 text-center tabular-nums ${theme.td || ''}`}>{typeof r.gd === 'number' ? (r.gd > 0 ? `+${r.gd}` : r.gd) : ''}</td>}
              <td className={`px-3 py-2.5 text-center font-bold tabular-nums ${theme.points || ''}`}>{r.points}</td>
              {hasForm && <td className="px-3 py-2.5 text-center"><FormChips form={r.form} chip={theme.chip} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface BracketTheme {
  wrap?: string; stage?: string; stageTitle?: string; match?: string; row?: string; win?: string; score?: string; meta?: string; line?: string;
}

const matchWinner = (m: NBracketMatch): 'home' | 'away' | 'draw' | undefined =>
  m.winner || (typeof m.homeScore === 'number' && typeof m.awayScore === 'number' && m.status === 'completed' ? (m.homeScore > m.awayScore ? 'home' : m.homeScore < m.awayScore ? 'away' : 'draw') : undefined);

/** Knockout bracket: one column per stage, scrollable on small screens. Styling comes from `theme`. */
export const Bracket: React.FC<{ stages: NStage[]; theme?: BracketTheme; formatDate?: (d: Date | null) => string }> = ({ stages, theme = {}, formatDate }) => (
  <div className={`overflow-x-auto pb-3 ${theme.wrap || ''}`} role="region" aria-label="Knockout bracket" tabIndex={0}>
    <div className="flex min-w-max gap-6">
      {stages.filter((s) => s.matches.length > 0).map((s) => (
        <section key={s.id} aria-label={s.name} className={`flex w-64 shrink-0 flex-col justify-around gap-4 ${theme.stage || ''}`}>
          <h3 className={theme.stageTitle || 'text-xs font-bold uppercase tracking-widest opacity-70'}>{s.name}</h3>
          {s.matches.map((m) => {
            const w = matchWinner(m);
            return (
              <div key={m.id} className={theme.match || 'rounded-lg border border-current/20'}>
                {([['home', m.home, m.homeScore], ['away', m.away, m.awayScore]] as const).map(([side, nm, sc]) => (
                  <div key={side} className={`flex items-center justify-between gap-3 px-3 py-2 ${theme.row || ''} ${w === side ? theme.win || 'font-bold' : ''}`}>
                    <span className="truncate">{nm || 'To be decided'}</span>
                    <span className={`tabular-nums ${theme.score || ''}`}>{typeof sc === 'number' ? sc : ''}</span>
                  </div>
                ))}
                {(m.date || m.venue) && <div className={`px-3 pb-2 text-[11px] opacity-70 ${theme.meta || ''}`}>{[formatDate?.(m.date), m.venue].filter(Boolean).join(' · ')}</div>}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  </div>
);

export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** Enquiry form that hands the message to the visitor's mail app. The look comes from `cls`. */
export const EnquiryForm: React.FC<{
  email?: string; subjectPrefix: string; topics?: string[]; button?: string; withPhone?: boolean; messagePlaceholder?: string;
  cls: { form?: string; input: string; button: string; note?: string; label?: string };
  buttonStyle?: React.CSSProperties;
}> = ({ email, subjectPrefix, topics, button = 'Send message', withPhone, messagePlaceholder = 'How can we help?', cls, buttonStyle }) => {
  const { sent, submit } = useMailtoForm(email, subjectPrefix);
  if (!email) return null;
  const lab = cls.label || 'sr-only';
  return (
    <form onSubmit={submit} className={`space-y-3 ${cls.form || ""}`}>
      <div><label htmlFor="sp-enq-name" className={lab}>Your name</label><input id="sp-enq-name" name="name" required placeholder="Your name" autoComplete="name" className={cls.input} /></div>
      <div><label htmlFor="sp-enq-email" className={lab}>Your email</label><input id="sp-enq-email" name="email" type="email" required placeholder="Your email" autoComplete="email" className={cls.input} /></div>
      {withPhone && <div><label htmlFor="sp-enq-phone" className={lab}>Phone</label><input id="sp-enq-phone" name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" className={cls.input} /></div>}
      {topics && topics.length > 0 && (
        <div><label htmlFor="sp-enq-topic" className={lab}>Topic</label>
          <select id="sp-enq-topic" name="topic" className={cls.input} defaultValue={topics[0]}>{topics.map((t) => <option key={t}>{t}</option>)}</select></div>
      )}
      <div><label htmlFor="sp-enq-msg" className={lab}>Message</label><textarea id="sp-enq-msg" name="message" required rows={4} placeholder={messagePlaceholder} className={cls.input} /></div>
      <button type="submit" className={cls.button} style={buttonStyle}>{button}</button>
      {sent && <p role="status" className={cls.note || 'text-sm opacity-80'}>Your email app should open with the message ready to send.</p>}
    </form>
  );
};

export interface ScheduleTheme { wrap?: string; table?: string; th?: string; td?: string; cell?: string; name?: string; time?: string; empty?: string }

/** Weekly training matrix: a column per weekday that has sessions, a row per time slot. Scrolls on small screens. */
export const ScheduleGrid: React.FC<{ batches: NBatch[]; theme?: ScheduleTheme }> = ({ batches, theme = {} }) => {
  const byDay = batchesByDay(batches);
  if (!byDay.length) return null;
  const rows = Math.max(...byDay.map((g) => g.items.length));
  return (
    <div className={`relative overflow-x-auto ${theme.wrap || ""}`} role="region" aria-label="Weekly training schedule" tabIndex={0}>
      <table className={`w-full min-w-[560px] border-collapse text-left text-sm ${theme.table || ''}`}>
        <caption className="sr-only">Weekly training schedule</caption>
        <thead><tr>{byDay.map((g) => <th key={g.day} scope="col" className={`px-3 py-2.5 ${theme.th || 'text-xs uppercase tracking-widest'}`}>{g.day}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>{byDay.map((g) => { const b = g.items[r]; return (
              <td key={g.day} className={`align-top px-3 py-2 ${theme.td || ''}`}>
                {b ? <div className={theme.cell || 'rounded-md border border-current/20 p-2'}><div className={`font-semibold ${theme.name || ''}`}>{b.name}</div><div className={`text-xs ${theme.time || 'opacity-70'}`}>{[b.start && b.end ? `${b.start}–${b.end}` : b.start, b.ageGroup].filter(Boolean).join(' · ')}</div></div> : <span className={theme.empty || 'sr-only'}>No session</span>}
              </td>); })}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
