import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useCountdown, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap';
const DISPLAY = '"Bebas Neue", Impact, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Floodlight Night: a dark stadium experience: floodlit hero, glass matchday dashboard, results timeline, spotlight carousel. */
export const FloodlightNight: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'night', coverKind: 'stadium' }), [props]);
  const blue = d.brand.accent || '#3A6BFF';
  const [spot, setSpot] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  const cd = useCountdown(d.next?.date || null);
  const p = d.players[spot % Math.max(d.players.length, 1)];
  const glass = 'rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md';
  const nav = ([(d.has.fixtures || d.has.results) && ['Matchday', 'fn-centre'], d.has.results && ['Results', 'fn-results'], d.has.players && ['Players', 'fn-players'], d.has.news && ['News', 'fn-news'], d.has.gallery && ['Gallery', 'fn-gallery'], ['Contact', 'fn-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="fn-top" className="sp-root min-h-screen bg-[#050A18] text-[#E8EEFF]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="fixed inset-x-0 top-0 z-30 mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-full border border-white/10 bg-[#050A18]/60 px-4 py-2 backdrop-blur-xl sm:mx-6 lg:mx-auto">
        <button type="button" onClick={() => scrollToId('fn-top')} className="flex items-center gap-2"><img src={d.logo} alt="" className="h-8 w-8 object-contain" /><span className="text-xl tracking-wider" style={{ fontFamily: DISPLAY }}>{d.shortName}</span></button>
        <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-1 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white">{l}</button>)}</nav>
      </header>

      <section className="relative isolate flex min-h-screen items-end overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="stadium" palette="night" alt="" loading="eager" className="sp-kenburns absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050A18] via-[#050A18]/40 to-[#050A18]/60" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={{ background: `radial-gradient(60% 50% at 50% 0%, ${blue}55, transparent 70%)` }} />
        <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-32">
          <SpReveal><p className="text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: blue }}>{[d.sport, d.location].filter(Boolean).join(' · ') || 'Matchday'}</p>
            <h1 className="mt-3 text-[clamp(3.5rem,12vw,9.5rem)] uppercase leading-[0.88]" style={{ fontFamily: DISPLAY, textShadow: `0 0 60px ${blue}88` }}>{d.name}</h1>
            {d.tagline && <p className="mt-4 max-w-xl text-lg text-white/75">{d.tagline}</p>}</SpReveal>
          {d.next && <SpReveal delay={150} className={`${glass} mt-10 inline-flex max-w-full flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4`}><div><div className="text-[11px] uppercase tracking-[0.3em] text-white/50">Next match</div><div className="text-3xl uppercase" style={{ fontFamily: DISPLAY }}>{d.next.homeName} v {d.next.awayName}</div><div className="text-xs text-white/60">{fmtDay(d.next.date)} {fmtTime(d.next.date)}{d.next.venue ? ` · ${d.next.venue}` : ''}</div></div>{cd && !cd.done && <div className="flex gap-4 text-center" role="timer" aria-label="Time until kick-off">{[['D', cd.d], ['H', cd.h], ['M', cd.m]].map(([l, n]) => <div key={l as string}><div className="text-4xl tabular-nums" style={{ fontFamily: DISPLAY, color: blue }}>{String(n).padStart(2, '0')}</div><div className="text-[10px] tracking-widest text-white/50">{l}</div></div>)}</div>}</SpReveal>}
        </div>
      </section>

      {(d.has.fixtures || d.has.results || d.has.standings) && (
        <section id="fn-centre" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-8 text-5xl uppercase" style={{ fontFamily: DISPLAY }}>Matchday centre</h2>
          <div className="grid gap-5 lg:grid-cols-3">
            <SpReveal className={`${glass} p-6`}><h3 className="text-xs uppercase tracking-[0.3em]" style={{ color: blue }}>Coming up</h3><ul className="mt-4 space-y-4">{d.fixtures.slice(0, 3).map((f) => <li key={f.id} className="border-b border-white/10 pb-3 last:border-0"><div className="text-sm font-semibold">{f.homeName} v {f.awayName}</div><div className="mt-0.5 flex items-center gap-1 text-xs text-white/55"><MapPin className="h-3 w-3" />{fmtDay(f.date)} · {f.venue}</div></li>)}{!d.fixtures.length && <li className="text-sm text-white/50">No fixtures announced yet.</li>}</ul></SpReveal>
            <SpReveal delay={80} className={`${glass} p-6`}><h3 className="text-xs uppercase tracking-[0.3em]" style={{ color: blue }}>Last result</h3>{d.results[0] ? <div className="mt-4 text-center"><div className="text-sm text-white/60">{d.results[0].competition}</div><div className="mt-3 text-6xl tabular-nums" style={{ fontFamily: DISPLAY }}>{scoreText(d.results[0])}</div><div className="mt-2 text-sm font-semibold">{d.results[0].homeName} v {d.results[0].awayName}</div>{d.results[0].summary && <p className="mt-2 text-xs text-white/55">{d.results[0].summary}</p>}</div> : <p className="mt-4 text-sm text-white/50">No results yet.</p>}</SpReveal>
            <SpReveal delay={160} className={`${glass} p-6`}><h3 className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: blue }}>{d.standingGroups[0]?.competition || 'Table'}</h3>{d.has.standings ? <StandingsTable rows={d.standings} limit={5} compact showForm={false} label="League table, top five" theme={{ th: 'text-[10px] uppercase tracking-widest text-white/45', tr: 'border-t border-white/10', us: 'font-bold text-white', td: 'text-white/70', points: 'text-base' }} /> : <p className="text-sm text-white/50">Table not available.</p>}</SpReveal>
          </div>
        </section>
      )}

      {d.has.results && (
        <section id="fn-results" className="scroll-mt-20 mx-auto max-w-6xl px-5 pb-20">
          <h2 className="mb-8 text-5xl uppercase" style={{ fontFamily: DISPLAY }}>Results</h2>
          <ol className="relative border-l border-white/15 pl-8">{d.results.slice(0, 6).map((f) => <li key={f.id} className="relative pb-8"><span className="absolute -left-[41px] top-1 h-3 w-3 rounded-full ring-4 ring-[#050A18]" style={{ background: f.outcome === 'L' ? '#f43f5e' : f.outcome === 'D' ? '#fbbf24' : '#34d399' }} /><div className="text-xs uppercase tracking-widest text-white/50">{fmtDate(f.date)} · {f.competition}</div><div className="mt-1 flex items-baseline gap-3 text-2xl uppercase" style={{ fontFamily: DISPLAY }}><span>{f.homeName}</span><span style={{ color: blue }}>{scoreText(f)}</span><span>{f.awayName}</span></div>{f.summary && <p className="text-sm text-white/55">{f.summary}</p>}</li>)}</ol>
        </section>
      )}

      {d.has.players && p && (
        <section id="fn-players" className="scroll-mt-20 mx-auto max-w-6xl px-5 pb-20">
          <h2 className="mb-8 text-5xl uppercase" style={{ fontFamily: DISPLAY }}>Spotlight</h2>
          <div className={`${glass} grid overflow-hidden md:grid-cols-2`}>
            <div className="relative aspect-[4/3] md:aspect-auto"><SmartImg src={p.photo} seed={p.name} kind="portrait" palette="night" alt={p.name} className="absolute inset-0 h-full w-full object-cover" /><span className="absolute bottom-0 left-4 text-[10rem] leading-none text-white/15" style={{ fontFamily: DISPLAY }}>{p.number}</span></div>
            <div className="flex flex-col justify-center p-8"><div className="text-xs uppercase tracking-[0.3em]" style={{ color: blue }}>{p.position}</div><h3 className="mt-2 text-6xl uppercase leading-none" style={{ fontFamily: DISPLAY }}>{p.name}</h3><div className="mt-1 text-sm text-white/55">{p.team}</div>{p.stats.length > 0 && <dl className="mt-6 grid grid-cols-3 gap-4">{p.stats.slice(0, 3).map((s) => <div key={s.label}><dd className="text-4xl tabular-nums" style={{ fontFamily: DISPLAY }}>{s.value}</dd><dt className="text-[11px] uppercase tracking-widest text-white/50">{s.label}</dt></div>)}</dl>}
              <div className="mt-8 flex items-center gap-3"><button type="button" aria-label="Previous player" onClick={() => setSpot((spot - 1 + d.players.length) % d.players.length)} className="rounded-full border border-white/20 p-2 hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button><button type="button" aria-label="Next player" onClick={() => setSpot((spot + 1) % d.players.length)} className="rounded-full border border-white/20 p-2 hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button><span className="text-xs text-white/50">{(spot % d.players.length) + 1} / {d.players.length}</span></div></div>
          </div>
        </section>
      )}

      {d.has.news && <section id="fn-news" className="scroll-mt-20 mx-auto max-w-6xl px-5 pb-20"><h2 className="mb-8 text-5xl uppercase" style={{ fontFamily: DISPLAY }}>Latest news</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 80} className={`${glass} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="stadium" palette="night" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-[11px] uppercase tracking-widest" style={{ color: blue }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-2 text-2xl uppercase leading-tight" style={{ fontFamily: DISPLAY }}>{n.title}</h3>{n.summary && <p className="mt-2 text-sm text-white/60">{n.summary}</p>}</div></SpReveal>)}</div></section>}
      {d.has.gallery && <section id="fn-gallery" className="scroll-mt-20 mx-auto max-w-6xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((ph, i) => <li key={ph.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-xl"><SmartImg src={ph.src} seed={ph.id} kind="stadium" palette="night" alt={ph.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-110" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <div className="sp-marquee-wrap overflow-hidden border-y border-white/10 py-6" aria-label="Partners"><div className="sp-marquee" style={{ ['--sp-speed' as string]: '34s' }}>{[0, 1].map((k) => <div key={k} className="flex" {...(k ? { 'data-dup': true, 'aria-hidden': true } : {})}>{d.sponsors.map((s) => <span key={`${k}${s.id}`} className="mx-10 whitespace-nowrap text-3xl uppercase text-white/35" style={{ fontFamily: DISPLAY }}>{s.name}</span>)}</div>)}</div></div>}

      <section id="fn-contact" className="scroll-mt-20 mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-2">
        <div><h2 className="text-6xl uppercase" style={{ fontFamily: DISPLAY }}>Contact</h2><div className="mt-5 space-y-1.5 text-white/80">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: blue }} cls={{ input: 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none', button: 'rounded-full px-7 py-3 text-sm font-semibold text-white', note: 'text-sm text-white/70' }} />
      </section>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
