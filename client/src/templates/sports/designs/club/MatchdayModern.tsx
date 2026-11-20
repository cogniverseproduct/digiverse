import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText, type NFixture } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useCountdown, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600&display=swap';
const COND = '"Barlow Condensed", Impact, sans-serif';
const SANS = 'Barlow, system-ui, sans-serif';

/** Matchday Modern: black canvas, volt-lime accent, slashed hero, fixture ticker and horizontal player cards. */
export const MatchdayModern: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'volt', coverKind: 'action' }), [props]);
  const v = d.brand.accent || '#D6FF3D';
  const [lb, setLb] = useState<number | null>(null);
  const cd = useCountdown(d.next?.date || null);
  const ticker: NFixture[] = [...d.fixtures.slice(0, 4), ...d.results.slice(0, 4)];
  const nav = ([d.has.fixtures && ['Matchday', 'mm-matchday'], d.has.players && ['Players', 'mm-players'], (d.has.results || d.has.standings) && ['Results', 'mm-results'], d.has.news && ['Latest', 'mm-news'], d.has.gallery && ['Gallery', 'mm-gallery'], ['Contact', 'mm-contact']].filter(Boolean) as [string, string][]);
  const Item = ({ f }: { f: NFixture }) => <span className="mx-6 inline-flex items-center gap-3 whitespace-nowrap text-sm font-semibold uppercase tracking-wide" style={{ fontFamily: COND }}><span style={{ color: v }}>{f.completed ? 'FT' : fmtDate(f.date, { day: 'numeric', month: 'short' })}</span>{f.homeName} <b className="text-base">{f.hasScore ? scoreText(f) : 'v'}</b> {f.awayName}</span>;

  return (
    <div id="mm-top" className="sp-root min-h-screen bg-[#080D00] text-[#F2FFD0]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080D00]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('mm-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: COND }}>{d.shortName}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-white/70 hover:text-white" style={{ fontFamily: COND }}>{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[58%]" style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0 100%)' }}>
          <SmartImg src={d.cover} seed={d.name} kind="action" palette="volt" alt="" loading="eager" className="sp-kenburns h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080D00] via-transparent to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-28">
          <SpReveal className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: v, fontFamily: COND }}>{[d.sport, d.location].filter(Boolean).join(' · ')}</p>
            <h1 className="mt-3 text-6xl font-extrabold uppercase leading-[0.9] sm:text-8xl" style={{ fontFamily: COND }}>{(d.tagline || d.name).replace(/[.!?]+$/, "")}<span style={{ color: v }}>.</span></h1>
            {d.description && <p className="mt-6 max-w-xl text-lg text-white/70">{d.description}</p>}
          </SpReveal>
          {d.next && (
            <SpReveal delay={120} className="mt-10 inline-block max-w-full border-l-4 bg-black/60 p-5 backdrop-blur" style={{ borderColor: v }}>
              <div className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: v, fontFamily: COND }}>Next up · {fmtDay(d.next.date)} {fmtTime(d.next.date)}</div>
              <div className="mt-2 text-3xl font-bold uppercase sm:text-4xl" style={{ fontFamily: COND }}>{d.next.homeName} <span style={{ color: v }}>v</span> {d.next.awayName}</div>
              {cd && !cd.done && <div className="mt-3 flex gap-5 text-lg tabular-nums" style={{ fontFamily: COND }} role="timer">{[['d', cd.d], ['h', cd.h], ['m', cd.m], ['s', cd.s]].map(([l, n]) => <span key={l as string}><b className="text-3xl">{String(n).padStart(2, '0')}</b><span className="ml-0.5 text-white/50">{l}</span></span>)}</div>}
            </SpReveal>
          )}
        </div>
      </section>

      {ticker.length > 0 && <div className="sp-marquee-wrap overflow-hidden border-y border-white/10 py-3" style={{ background: v, color: '#080D00' }} aria-label="Fixtures and results ticker"><div className="sp-marquee" style={{ ['--sp-speed' as string]: '45s' }}>{[0, 1].map((k) => <div key={k} className="flex" {...(k ? { 'data-dup': true, 'aria-hidden': true } : {})}>{ticker.map((f) => <Item key={`${k}${f.id}`} f={f} />)}</div>)}</div></div>}

      {d.has.fixtures && (
        <section id="mm-matchday" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20">
          <h2 className="mb-8 text-5xl font-extrabold uppercase" style={{ fontFamily: COND }}>Matchday</h2>
          <ul className="grid gap-4 md:grid-cols-3">{d.fixtures.slice(0, 3).map((f, i) => <SpReveal as="li" key={f.id} delay={i * 80} className="relative overflow-hidden border border-white/15 bg-white/[0.03] p-6"><span className="absolute -right-2 -top-4 text-8xl font-extrabold text-white/[0.05]" style={{ fontFamily: COND }}>{f.date?.getDate()}</span><div className="text-xs font-bold uppercase tracking-widest" style={{ color: v, fontFamily: COND }}>{fmtDay(f.date)} · {fmtTime(f.date)}</div><div className="mt-4 text-2xl font-bold uppercase leading-tight" style={{ fontFamily: COND }}>{f.homeName}<br /><span className="text-white/40">v</span> {f.awayName}</div><div className="mt-4 text-xs text-white/60">{[f.competition, f.venue].filter(Boolean).join(' · ')}</div></SpReveal>)}</ul>
        </section>
      )}

      {d.has.players && (
        <section id="mm-players" className="scroll-mt-16 bg-white/[0.03] py-20"><div className="mx-auto max-w-7xl px-5">
          <h2 className="mb-8 text-5xl font-extrabold uppercase" style={{ fontFamily: COND }}>Players</h2>
          <ul className="sp-no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4">{d.players.map((p) => <li key={p.id} className="group relative w-56 shrink-0 snap-start overflow-hidden bg-black"><SmartImg src={p.photo} seed={p.name} kind="portrait" palette="volt" alt={p.name} className="aspect-[3/4] w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" /><span className="absolute left-3 top-1 text-7xl font-extrabold leading-none" style={{ fontFamily: COND, color: v }}>{p.number}</span><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4"><div className="text-xl font-bold uppercase leading-tight" style={{ fontFamily: COND }}>{p.name}</div><div className="text-xs uppercase tracking-widest text-white/60">{p.position}</div></div></li>)}</ul>
        </div></section>
      )}

      {(d.has.results || d.has.standings) && (
        <section id="mm-results" className="scroll-mt-16 mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 [&>*]:min-w-0">
          {d.has.results && <div><h2 className="mb-6 text-4xl font-extrabold uppercase" style={{ fontFamily: COND }}>Results</h2><ul>{d.results.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3 text-sm"><span className="min-w-0 truncate font-semibold">{f.homeName} <b style={{ color: v }}>{scoreText(f)}</b> {f.awayName}</span><span className="shrink-0 text-xs text-white/50">{fmtDate(f.date, { day: 'numeric', month: 'short' })}</span></li>)}</ul></div>}
          {d.has.standings && <div><h2 className="mb-6 text-4xl font-extrabold uppercase" style={{ fontFamily: COND }}>Table</h2><StandingsTable rows={d.standings} limit={8} showForm={false} label="League table" theme={{ th: 'text-xs uppercase tracking-widest text-white/50 border-b border-white/20', tr: 'border-b border-white/10', us: 'font-bold', points: 'text-lg' }} /></div>}
        </section>
      )}

      {d.has.news && (
        <section id="mm-news" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20">
          <h2 className="mb-8 text-5xl font-extrabold uppercase" style={{ fontFamily: COND }}>Latest</h2>
          <div className="grid auto-rows-[14rem] gap-4 md:grid-cols-4">{d.news.slice(0, 4).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 70} className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}><SmartImg src={n.image} seed={n.title} kind="action" palette="volt" alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><div className="text-xs font-bold uppercase tracking-widest" style={{ color: v, fontFamily: COND }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className={`mt-1 font-bold uppercase leading-tight ${i === 0 ? 'text-4xl' : 'text-xl'}`} style={{ fontFamily: COND }}>{n.title}</h3></div></SpReveal>)}</div>
        </section>
      )}

      {d.has.gallery && (
        <section id="mm-gallery" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20">
          <h2 className="mb-8 text-5xl font-extrabold uppercase" style={{ fontFamily: COND }}>Gallery</h2>
          <ul className="columns-2 gap-3 md:columns-4 [&>li]:mb-3">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="action" palette="volt" alt={p.caption} className={`w-full object-cover transition hover:scale-105 ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`} /></button></li>)}</ul>
          <Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
        </section>
      )}

      {d.has.sponsors && <div className="sp-marquee-wrap overflow-hidden border-y border-white/10 py-6" aria-label="Partners"><div className="sp-marquee" style={{ ['--sp-speed' as string]: '30s' }}>{[0, 1].map((k) => <div key={k} className="flex" {...(k ? { 'data-dup': true, 'aria-hidden': true } : {})}>{d.sponsors.map((s) => <span key={`${k}${s.id}`} className="mx-10 whitespace-nowrap text-3xl font-bold uppercase text-white/40" style={{ fontFamily: COND }}>{s.name}</span>)}</div>)}</div></div>}

      <section id="mm-contact" className="scroll-mt-16 mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2">
        <div><h2 className="text-6xl font-extrabold uppercase leading-none sm:text-7xl" style={{ fontFamily: COND }}>Get in<br /><span style={{ color: v }}>touch</span></h2>
          <div className="mt-8 space-y-2 text-lg">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{d.address}<ArrowUpRight className="h-4 w-4" /></a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p><a href={`tel:${d.phone}`}>{d.phone}</a></p>}</div>
          {d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:bg-white/10" />}
        </div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: v }} cls={{ input: 'w-full border border-white/25 bg-transparent px-4 py-3 text-base placeholder:text-white/40 focus:border-[#D6FF3D] focus:outline-none', button: 'px-8 py-3 text-lg font-bold uppercase tracking-wide text-black', note: 'text-sm text-white/70' }} />
      </section>
      <footer className="border-t border-white/10 py-6 text-center text-xs uppercase tracking-widest text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
