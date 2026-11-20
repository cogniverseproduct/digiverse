import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useCountdown, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
const SANS = '"Space Grotesk", system-ui, sans-serif';

/** Bracket Board: violet dashboard. The bracket is the centrepiece; live/next, standings and schedule sit in compact panels. */
export const BracketBoard: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'violet', coverKind: 'court' }), [props]);
  const lilac = d.brand.accent || '#C09BFF';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const [feed, setFeed] = useState<'upcoming' | 'results'>(d.has.fixtures ? 'upcoming' : 'results');
  const cd = useCountdown(d.next?.date || null);
  const panel = 'rounded-2xl border border-white/10 bg-white/[0.05] p-5';
  const title = 'text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50';
  const nav = ([d.has.bracket && ['Bracket', 'bb-bracket'], (d.has.fixtures || d.has.results) && ['Schedule', 'bb-schedule'], d.has.standings && ['Standings', 'bb-standings'], d.has.news && ['News', 'bb-news'], d.has.gallery && ['Gallery', 'bb-gallery'], ['Contact', 'bb-contact']].filter(Boolean) as [string, string][]);
  const feedList = feed === 'upcoming' ? d.fixtures : d.results;

  return (
    <div id="bb-top" className="sp-root min-h-screen bg-[#0E0722] text-[#F1E8FF]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0722]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('bb-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-8 w-8 object-contain" /><span className="font-bold">{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-1 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
        <section className="relative isolate overflow-hidden rounded-3xl border border-white/10">
          <SmartImg src={d.cover} seed={d.name} kind="court" palette="violet" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0E0722] via-[#0E0722]/70 to-transparent" />
          <div className="grid gap-6 p-7 md:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: lilac }}>{[t.edition, d.sport, fmtRange(t.start, t.end)].filter(Boolean).join(' · ')}</p><h1 className="mt-3 text-5xl font-bold leading-[1.02] sm:text-7xl">{d.tagline || d.name}</h1>{d.description && <p className="mt-4 max-w-xl text-white/75">{d.description}</p>}</div>
            {d.live ? <div className={`${panel} bg-black/40`} role="status"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300"><span className="sp-pulse inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />Live now</div><div className="mt-3 text-lg font-semibold">{d.live.homeName}</div><div className="my-1 text-4xl font-bold tabular-nums" style={{ color: lilac }}>{scoreText(d.live)}</div><div className="text-lg font-semibold">{d.live.awayName}</div></div>
              : d.next ? <div className={`${panel} bg-black/40`}><div className={title}>Next match</div><div className="mt-2 text-xl font-bold">{d.next.homeName} <span className="text-white/40">v</span> {d.next.awayName}</div><div className="mt-1 text-sm text-white/60">{fmtDay(d.next.date)} {fmtTime(d.next.date)}</div>{cd && !cd.done && <div className="mt-3 flex gap-4 tabular-nums" role="timer">{[['d', cd.d], ['h', cd.h], ['m', cd.m]].map(([l, n]) => <span key={l as string}><b className="text-3xl" style={{ color: lilac }}>{String(n).padStart(2, '0')}</b><span className="ml-0.5 text-xs text-white/50">{l}</span></span>)}</div>}</div> : null}
          </div>
        </section>

        {d.has.bracket && <section id="bb-bracket" className={`${panel} scroll-mt-20`}><h2 className={`${title} mb-4`}>Knockout bracket</h2><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-xs font-semibold uppercase tracking-[0.25em]', match: 'rounded-xl border border-white/15 bg-white/[0.06]', win: 'font-bold', score: 'font-bold' }} /></section>}

        <div className="grid gap-5 lg:grid-cols-3">
          {(d.has.fixtures || d.has.results) && <section id="bb-schedule" className={`${panel} scroll-mt-20 lg:col-span-2`}>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className={title}>Schedule</h2><div role="group" aria-label="Schedule view" className="flex rounded-lg border border-white/15 p-0.5 text-xs">{([['upcoming', 'Upcoming', d.has.fixtures], ['results', 'Results', d.has.results]] as const).filter(([, , on]) => on).map(([k, l]) => <button key={k} type="button" aria-pressed={feed === k} onClick={() => setFeed(k)} className="rounded-md px-3 py-1 font-semibold" style={feed === k ? { background: lilac, color: '#160A33' } : { color: 'rgba(255,255,255,.65)' }}>{l}</button>)}</div></div>
            <ul className="divide-y divide-white/10">{feedList.slice(0, 8).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><div className="truncate font-semibold">{f.homeName} <span className="text-white/40">v</span> {f.awayName}</div><div className="text-xs text-white/50">{[fmtDay(f.date), fmtTime(f.date), f.round, f.venue].filter(Boolean).join(' · ')}</div></div>{f.completed && <div className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1 text-lg font-bold tabular-nums" style={{ background: `${lilac}26`, color: lilac }}>{scoreText(f)}</div>}</li>)}</ul>
          </section>}
          {d.has.standings && <section id="bb-standings" className={`${panel} scroll-mt-20 ${d.has.fixtures || d.has.results ? '' : 'lg:col-span-3'}`}><h2 className={`${title} mb-3`}>{d.standingGroups[0].competition}</h2><StandingsTable rows={d.standingGroups[0].rows} compact limit={6} showForm={false} label="Standings" theme={{ th: 'text-[10px] uppercase tracking-widest text-white/45', tr: 'border-t border-white/10', us: 'font-bold', points: 'font-bold' }} />{d.standingGroups.length > 1 && <p className="mt-3 text-xs text-white/50">+ {d.standingGroups.length - 1} more group{d.standingGroups.length > 2 ? 's' : ''} in the full table</p>}</section>}
        </div>

        {d.has.standings && d.standingGroups.length > 1 && <section className={panel}><h2 className={`${title} mb-4`}>All groups</h2><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{d.standingGroups.slice(1).map((g) => <div key={g.competition}><h3 className="mb-2 text-sm font-semibold" style={{ color: lilac }}>{g.competition}</h3><StandingsTable rows={g.rows} compact showForm={false} label={g.competition} theme={{ th: 'text-[10px] uppercase tracking-widest text-white/45', tr: 'border-t border-white/10', us: 'font-bold', points: 'font-bold' }} /></div>)}</div></section>}

        {(d.has.venues || d.has.rules || d.has.teams) && <div className="grid gap-5 md:grid-cols-3">{d.has.teams && <section className={panel}><h2 className={`${title} mb-3`}>Teams ({d.teams.length})</h2><ul className="flex flex-wrap gap-2">{d.teams.map((x) => <li key={x.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">{x.name}</li>)}</ul></section>}{d.has.venues && <section className={panel}><h2 className={`${title} mb-3`}>Venues</h2><ul className="space-y-2 text-sm">{d.venues.map((v) => <li key={v.id}><b>{v.name}</b>{v.address && <> · <a className="underline" href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer">map</a></>}</li>)}</ul></section>}{d.has.rules && <section className={panel}><h2 className={`${title} mb-3`}>Rules</h2><ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">{d.rules.slice(0, 6).map((r, i) => <li key={i}>{r}</li>)}</ol></section>}</div>}

        {d.has.news && <section id="bb-news" className="scroll-mt-20"><h2 className={`${title} mb-3`}>News</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className={`${panel} p-0 overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="court" palette="violet" alt="" className="aspect-video w-full object-cover" /><div className="p-4"><div className="text-[11px] uppercase tracking-widest text-white/45">{fmtDate(n.date)}</div><h3 className="mt-1 font-semibold leading-snug">{n.title}</h3></div></article>)}</div></section>}
        {d.has.gallery && <section id="bb-gallery" className="scroll-mt-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-2xl"><SmartImg src={p.src} seed={p.id} kind="court" palette="violet" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
        {d.has.sponsors && <section aria-label="Partners" className={`${panel} flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-lg font-bold text-white/40`}>{d.sponsors.map((s) => <span key={s.id}>{s.name}</span>)}</section>}

        <section id="bb-contact" className={`${panel} scroll-mt-20 grid gap-8 p-7 lg:grid-cols-2`}>
          <div><h2 className="text-3xl font-bold">Get in touch</h2><div className="mt-4 space-y-1.5 text-white/80">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: lilac }} cls={{ input: 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none', button: 'rounded-xl px-7 py-3 text-sm font-bold text-[#160A33]', note: 'text-sm text-white/70' }} />
        </section>
      </main>
      <footer className="py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
