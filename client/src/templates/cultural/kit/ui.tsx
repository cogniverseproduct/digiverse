import React, { useEffect, useState } from 'react';
import { Menu, Play, X } from 'lucide-react';
import { art, type CulturalArtKind, type CulturalPaletteName } from './art';
import type { CDay, CDonation, CGuide, CMembership, CPhoto, CSponsor, CVideo } from './data';
import {
  EnquiryForm, Lightbox, SocialRow, SpReveal, mailto, mapsUrl, scrollToId, useActiveSection, useCountdown, useSportsFonts
} from '../../sports/kit/ui';

/** Shared, design-agnostic building blocks. They carry behaviour and accessibility; each design supplies the look through class names. */
export { EnquiryForm, Lightbox, SocialRow, SpReveal as Reveal, mailto, mapsUrl, scrollToId, useActiveSection, useCountdown, useSportsFonts as useCulturalFonts };

/** <img> that never shows a broken-image icon: swaps to generated artwork if the source fails. */
export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { seed?: string; kind?: CulturalArtKind; palette?: CulturalPaletteName }> = ({ src, alt = '', seed = 'img', kind = 'mesh', palette = 'vermilion', className, ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img src={failed || !src ? art(kind, seed, palette) : src} alt={alt} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} className={className} {...rest} />;
};

/** Visible only in the template library and the preview route; never on a generated client site. */
export const DemoBadge: React.FC<{ show?: boolean }> = ({ show }) => show ? (
  <div role="note" className="sp-noprint pointer-events-none fixed bottom-3 left-3 z-[60] rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-lg ring-1 ring-white/20">
    Sample content: fictional organisation
  </div>
) : null;

export interface NavCls { bar: string; inner?: string; link: string; active: string; mobileBtn?: string; mobilePanel: string; cta?: string }

/** Sticky navigation with scroll-spy and an accessible mobile menu. */
export const Nav: React.FC<{ brand: React.ReactNode; items: [string, string][]; cls: NavCls; cta?: [string, string]; rightSlot?: React.ReactNode }> = ({ brand, items, cls, cta, rightSlot }) => {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(items.map((i) => i[1]));
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const go = (id: string) => { setOpen(false); scrollToId(id); };
  return (
    <header className={cls.bar}>
      <div className={cls.inner || 'mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3'}>
        {brand}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map(([label, id]) => (
              <li key={id}><button type="button" onClick={() => go(id)} aria-current={active === id ? 'true' : undefined} className={`${cls.link} ${active === id ? cls.active : ''}`}>{label}</button></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {rightSlot}
          {cta && <button type="button" onClick={() => go(cta[1])} className={`hidden sm:inline-flex ${cls.cta || ''}`}>{cta[0]}</button>}
          <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`lg:hidden ${cls.mobileBtn || 'rounded-md p-2'}`}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className={`lg:hidden ${cls.mobilePanel}`}>
          <ul>{items.map(([label, id]) => <li key={id}><button type="button" onClick={() => go(id)} className="block w-full px-5 py-3 text-left">{label}</button></li>)}{cta && <li><button type="button" onClick={() => go(cta[1])} className="block w-full px-5 py-3 text-left font-semibold">{cta[0]}</button></li>}</ul>
        </nav>
      )}
    </header>
  );
};

/** Section title block with an optional eyebrow and ornament. */
export const Heading: React.FC<{ eyebrow?: string; title: string; native?: string; sub?: string; align?: 'left' | 'center'; cls?: { eyebrow?: string; title?: string; sub?: string }; ornament?: React.ReactNode }> = ({ eyebrow, title, native, sub, align = 'left', cls = {}, ornament }) => (
  <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
    {eyebrow && <p className={cls.eyebrow || 'text-[11px] font-bold uppercase tracking-[0.28em] opacity-70'}>{eyebrow}</p>}
    <h2 className={cls.title || 'mt-2 text-3xl font-bold sm:text-4xl'}>{title}{native && <span lang="bn" className="ml-3 text-[0.6em] font-normal opacity-60">{native}</span>}</h2>
    {ornament}
    {sub && <p className={cls.sub || 'mt-3 opacity-75'}>{sub}</p>}
  </div>
);

export interface DayCls { tabs: string; tab: string; tabOn: string; panel: string; ritual: string; time: string; key: string; title: string; meta: string }

/** Day-by-day ritual schedule: one tab per day, the rituals of the chosen day below. */
export const DayTabs: React.FC<{ days: CDay[]; cls: DayCls; layout?: 'tabs' | 'stack' }> = ({ days, cls, layout = 'tabs' }) => {
  const [i, setI] = useState(0);
  const day = days[Math.min(i, days.length - 1)];
  if (!days.length) return null;
  const body = (d: CDay) => (
    <div className={cls.panel}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className={cls.title}>{d.name}{d.nativeName && <span lang="bn" className="ml-2 text-[0.8em] opacity-70">{d.nativeName}</span>}</h3>
        <span className={cls.meta}>{[d.dateText, d.tithi].filter(Boolean).join(' · ')}</span>
      </div>
      {d.rituals.length === 0 ? <p className={cls.meta}>Timings will be announced.</p> : (
        <ol className="mt-3 space-y-2">
          {d.rituals.map((r, k) => (
            <li key={`${r.time}-${k}`} className={`${cls.ritual} ${r.key ? cls.key : ''}`}>
              <span className={cls.time}>{r.time}</span>
              <span><b>{r.name}</b>{r.nativeName && <span lang="bn" className="ml-2 opacity-70">{r.nativeName}</span>}{r.description && <span className="block text-[0.92em] opacity-75">{r.description}</span>}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
  if (layout === 'stack') return <div className="space-y-5">{days.map((d) => <div key={d.id}>{body(d)}</div>)}</div>;
  return (
    <div>
      <div role="tablist" aria-label="Festival days" className={cls.tabs}>
        {days.map((d, k) => <button key={d.id} role="tab" type="button" aria-selected={k === i} onClick={() => setI(k)} className={`${cls.tab} ${k === i ? cls.tabOn : ''}`}>{d.name}</button>)}
      </div>
      <div role="tabpanel">{body(day)}</div>
    </div>
  );
};

/** Click-to-load video grid. Nothing is requested from the video host until a visitor presses play (privacy-friendly nocookie embeds). */
export const VideoGrid: React.FC<{ videos: CVideo[]; cls?: { grid?: string; card?: string; title?: string; play?: string } }> = ({ videos, cls = {} }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  if (!videos.length) return null;
  return (
    <ul className={cls.grid || 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
      {videos.map((v) => (
        <li key={v.id} className={cls.card || 'overflow-hidden rounded-xl'}>
          <div className="relative aspect-video bg-black">
            {playing === v.id ? (
              <iframe title={v.title} src={`${v.embed}${v.embed.includes('?') ? '&' : '?'}autoplay=1`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
            ) : (
              <button type="button" onClick={() => setPlaying(v.id)} aria-label={`Play ${v.title}`} className="group absolute inset-0 block w-full">
                {v.thumb ? <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}
                <span className={cls.play || 'absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-105'}><Play className="h-6 w-6" /></span>
              </button>
            )}
          </div>
          <p className={cls.title || 'p-3 text-sm font-semibold'}>{v.title}</p>
        </li>
      ))}
    </ul>
  );
};

/** Photo wall with a keyboard-accessible lightbox. `variant` changes the arrangement; the look comes from `cls`. */
export const PhotoWall: React.FC<{ photos: CPhoto[]; variant?: 'grid' | 'masonry' | 'strip' | 'mosaic'; limit?: number; kind?: CulturalArtKind; palette?: CulturalPaletteName; cls?: { item?: string; img?: string; caption?: string; list?: string } }> = ({ photos, variant = 'grid', limit = 12, kind = 'alpona', palette = 'vermilion', cls = {} }) => {
  const [lb, setLb] = useState<number | null>(null);
  const shown = photos.slice(0, limit);
  const list = variant === 'masonry' ? 'columns-2 gap-3 md:columns-3 [&>li]:mb-3 [&>li]:break-inside-avoid'
    : variant === 'strip' ? 'sp-no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2 [&>li]:w-64 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-80'
    : variant === 'mosaic' ? 'grid auto-rows-[120px] grid-cols-2 gap-2 md:auto-rows-[150px] md:grid-cols-4 [&>li:nth-child(5n+1)]:col-span-2 [&>li:nth-child(5n+1)]:row-span-2 [&>li:nth-child(5n+4)]:row-span-2'
    : 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4';
  const fit = variant === 'mosaic' ? 'h-full w-full object-cover' : variant === 'masonry' ? 'w-full object-cover' : 'aspect-[4/3] w-full object-cover';
  return (
    <>
      <ul className={`${list} ${cls.list || ''}`}>
        {shown.map((p, i) => (
          <li key={p.id} className={cls.item || 'overflow-hidden'}>
            <button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}${p.caption ? `: ${p.caption}` : ''}`} className="group block h-full w-full text-left">
              <Img src={p.src} seed={p.id} kind={kind} palette={palette} alt={p.caption} className={`${fit} transition duration-500 group-hover:scale-[1.04] ${cls.img || ''}`} />
              {p.caption && variant !== 'mosaic' && <span className={cls.caption || 'block p-2 text-xs opacity-75'}>{p.caption}</span>}
            </button>
          </li>
        ))}
      </ul>
      <Lightbox items={photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
    </>
  );
};

const TIER_ORDER = ['title', 'principal', 'powered_by', 'associate', 'community'];
const TIER_LABEL: Record<string, string> = { title: 'Title partner', principal: 'Principal partners', powered_by: 'Powered by', associate: 'Associate partners', community: 'Community partners' };

/** Sponsors grouped by tier, largest first. Logos are shown when supplied, names otherwise. */
export const SponsorTiers: React.FC<{ sponsors: CSponsor[]; cls?: { tier?: string; wrap?: string; item?: string; logo?: string } }> = ({ sponsors, cls = {} }) => {
  const groups = TIER_ORDER.map((t) => ({ t, items: sponsors.filter((s) => s.tier === t) })).concat([{ t: 'other', items: sponsors.filter((s) => !TIER_ORDER.includes(s.tier)) }]).filter((g) => g.items.length);
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.t}>
          <p className={cls.tier || 'mb-3 text-[11px] font-bold uppercase tracking-[0.25em] opacity-65'}>{TIER_LABEL[g.t] || 'Supporters'}</p>
          <ul className={cls.wrap || 'flex flex-wrap items-center gap-3'}>
            {g.items.map((s) => {
              const inner = s.logo ? <img src={s.logo} alt={s.name} loading="lazy" className={cls.logo || 'h-10 w-auto max-w-[140px] object-contain'} onError={(e) => { (e.currentTarget as HTMLImageElement).replaceWith(document.createTextNode(s.name)); }} /> : <span>{s.name}</span>;
              return <li key={s.id} className={cls.item || 'rounded-lg border border-current/20 px-4 py-2 text-sm font-semibold'}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}</li>;
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

/** Practical visitor information for a puja pandal: location, hours, how to reach it, and safety notes. */
export const GuideBlock: React.FC<{ guide: CGuide; cls?: { wrap?: string; cell?: string; label?: string; list?: string } }> = ({ guide, cls = {} }) => {
  const rows: [string, string | undefined][] = [['Where', guide.location], ['Landmark', guide.landmark], ['Open', guide.hours], ['Metro', guide.metro], ['Railway', guide.railway], ['Bus', guide.bus], ['Parking', guide.parking], ['Passes', guide.vip], ['Emergency', guide.emergency]];
  const shown = rows.filter((r): r is [string, string] => Boolean(r[1]));
  return (
    <div className={cls.wrap || 'space-y-5'}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {shown.map(([k, v]) => <div key={k} className={cls.cell || 'rounded-lg border border-current/20 p-3'}><dt className={cls.label || 'text-[11px] font-bold uppercase tracking-widest opacity-60'}>{k}</dt><dd className="mt-1">{k === 'Where' ? <a className="underline" href={mapsUrl(v)} target="_blank" rel="noopener noreferrer">{v}</a> : v}</dd></div>)}
      </dl>
      {(guide.crowd.length > 0 || guide.safety.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {guide.crowd.length > 0 && <div><p className={cls.label || 'text-[11px] font-bold uppercase tracking-widest opacity-60'}>Visiting guidelines</p><ul className={cls.list || 'mt-2 list-disc space-y-1 pl-5'}>{guide.crowd.map((c) => <li key={c}>{c}</li>)}</ul></div>}
          {guide.safety.length > 0 && <div><p className={cls.label || 'text-[11px] font-bold uppercase tracking-widest opacity-60'}>Safety and access</p><ul className={cls.list || 'mt-2 list-disc space-y-1 pl-5'}>{guide.safety.map((c) => <li key={c}>{c}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
};

/** Donation appeal. Shows only what the committee entered and how to give; it never collects or processes payment. */
export const DonationBlock: React.FC<{ donation: CDonation; cls?: { wrap?: string; cause?: string; amount?: string; note?: string } }> = ({ donation, cls = {} }) => (
  <div className={cls.wrap || 'space-y-4'}>
    <p className="max-w-2xl text-lg">{donation.message}</p>
    {donation.causes.length > 0 && (
      <ul className="grid gap-3 sm:grid-cols-2">
        {donation.causes.map((c) => (
          <li key={c.id} className={cls.cause || 'rounded-lg border border-current/20 p-4'}>
            <b>{c.title}</b>
            <p className="mt-1 text-sm opacity-80">{c.description}</p>
            {c.amounts.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5">{c.amounts.map((a) => <span key={a} className={cls.amount || 'rounded-full border border-current/30 px-2.5 py-0.5 text-xs'}>₹{a.toLocaleString('en-IN')}</span>)}</p>}
          </li>
        ))}
      </ul>
    )}
    {donation.contact && <p><b>How to contribute: </b>{donation.contact}</p>}
    {donation.transparency && <p className={cls.note || 'text-sm opacity-75'}>{donation.transparency}</p>}
    {donation.taxNote && <p className={cls.note || 'text-sm opacity-75'}>{donation.taxNote}</p>}
  </div>
);

/** Membership tiers and guidelines, only when the association turned membership on. */
export const MembershipBlock: React.FC<{ membership: CMembership; cls?: { grid?: string; tier?: string; fee?: string; note?: string } }> = ({ membership, cls = {} }) => (
  <div className="space-y-4">
    {membership.tiers.length > 0 && (
      <ul className={cls.grid || 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
        {membership.tiers.map((t) => (
          <li key={t.name} className={cls.tier || 'rounded-xl border border-current/20 p-5'}>
            <b className="text-lg">{t.name}</b>
            {t.fee && <p className={cls.fee || 'mt-1 text-2xl font-bold'}>{t.fee}</p>}
            {t.benefits?.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-85">{t.benefits.map((b) => <li key={b}>{b}</li>)}</ul>}
          </li>
        ))}
      </ul>
    )}
    {membership.guidelines && <p className={cls.note || 'max-w-2xl text-sm opacity-80'}>{membership.guidelines}</p>}
  </div>
);

/** Formats an event's date line, including a range when it spans several days. */
export function eventDateLine(e: { date: Date | null; endDate: Date | null; time: string }, fmt: (d: Date | null, o?: Intl.DateTimeFormatOptions) => string): string {
  const a = fmt(e.date);
  const b = e.endDate && e.date && e.endDate.getTime() !== e.date.getTime() ? fmt(e.endDate) : '';
  return [b ? `${a} – ${b}` : a, e.time].filter(Boolean).join(' · ');
}
