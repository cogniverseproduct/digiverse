import React, { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, parseDate, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useCountdown, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
const SERIF = 'Oswald, "Arial Narrow", sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Championship Portal: navy and gold. A hero over a tabbed portal: one panel at a time for fixtures, results, tables, bracket and teams. */
export const ChampionshipPortal: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'clay', coverKind: 'stadium' }), [props]);
  const gold = d.brand.accent || '#E8743B';
  const t = d.tournament;
  const cd = useCountdown(t.start || d.next?.date || null);
  const [lb, setLb] = useState<number | null>(null);
  const tabs = useMemo(() => ([
    d.has.fixtures && ['fixtures', 'Fixtures'], d.has.results && ['results', 'Results'], d.has.standings && ['tables', 'Tables'], d.has.bracket && ['bracket', 'Knockout'],
    d.has.teams && ['teams', 'Teams'], d.has.venues && ['venues', 'Venues'], d.has.rules && ['rules', 'Rules']
  ].filter(Boolean) as [string, string][]), [d]);
  const [tab, setTab] = useState(tabs[0]?.[0] || '');
  const panel = 'border border-white/10 bg-white/[0.04]';
  const nav = ([tabs.length > 0 && ['Competition', 'cp-portal'], d.has.news && ['News', 'cp-news'], d.has.gallery && ['Gallery', 'cp-gallery'], d.has.sponsors && ['Partners', 'cp-partners'], ['Contact', 'cp-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="cp-top" className="sp-root min-h-screen bg-[#0E0D0C] text-[#F6F1EA]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0D0C]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('cp-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-lg font-semibold" style={{ fontFamily: SERIF }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-white/70 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="stadium" palette="clay" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-[#0E0D0C]" />
        <div className="mx-auto max-w-6xl px-5 py-20 text-center md:py-28">
          <SpReveal>
            <div className="mx-auto inline-flex items-center gap-2 border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ borderColor: gold, color: gold }}><Trophy className="h-3.5 w-3.5" />{[t.edition, d.sport].filter(Boolean).join(' · ') || 'Championship'}</div>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] sm:text-7xl" style={{ fontFamily: SERIF }}>{d.name}</h1>
            {d.tagline && <p className="mx-auto mt-4 max-w-2xl text-xl italic text-white/80" style={{ fontFamily: SERIF }}>{d.tagline}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/75">{fmtRange(t.start, t.end) && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" style={{ color: gold }} />{fmtRange(t.start, t.end)}</span>}{(t.location || d.location) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" style={{ color: gold }} />{t.location || d.location}</span>}</div>
          </SpReveal>
          {cd && !cd.done && <SpReveal delay={140} className="mx-auto mt-10 flex max-w-md justify-center gap-6" ><div role="timer" aria-label={t.start ? 'Time until the tournament starts' : 'Time until the next match'} className="flex gap-6 text-center">{[['Days', cd.d], ['Hours', cd.h], ['Min', cd.m]].map(([l, n]) => <div key={l as string}><div className="text-5xl font-bold tabular-nums" style={{ fontFamily: SERIF, color: gold }}>{String(n).padStart(2, '0')}</div><div className="text-[10px] uppercase tracking-[0.25em] text-white/55">{l}</div></div>)}</div></SpReveal>}
          <div className="mt-10 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => scrollToId('cp-portal')} className="px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#0E0D0C]" style={{ background: gold }}>Fixtures & tables</button>{t.registrationInfo && <button type="button" onClick={() => scrollToId('cp-contact')} className="border border-white/40 px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10">Register a team</button>}</div>
        </div>
      </section>

      {d.stats.length > 0 && <section className="border-y border-white/10 bg-white/[0.03]"><dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <div key={s.label} className="text-center"><dd className="text-4xl font-bold" style={{ fontFamily: SERIF, color: gold }}>{s.value}</dd><dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">{s.label}</dt></div>)}</dl></section>}

      {tabs.length > 0 && (
        <section id="cp-portal" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-6 text-4xl font-bold" style={{ fontFamily: SERIF }}>Competition centre</h2>
          <div role="tablist" aria-label="Competition sections" className="sp-no-scrollbar flex min-w-0 gap-1 overflow-x-auto border-b border-white/15">{tabs.map(([k, l]) => <button key={k} id={`cp-tab-${k}`} role="tab" aria-selected={tab === k} aria-controls={`cp-panel-${k}`} type="button" onClick={() => setTab(k)} className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-[0.2em]" style={tab === k ? { background: gold, color: '#0E0D0C' } : { color: 'rgba(255,255,255,.65)' }}>{l}</button>)}</div>
          <div role="tabpanel" id={`cp-panel-${tab}`} aria-labelledby={`cp-tab-${tab}`} className={`${panel} p-5 md:p-8`}>
            {tab === 'fixtures' && <ul className="divide-y divide-white/10">{d.fixtures.map((f) => <li key={f.id} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-6"><div className="text-sm font-semibold" style={{ color: gold }}>{fmtDay(f.date)} {fmtTime(f.date)}</div><div className="font-medium">{f.homeName} <span className="text-white/40">v</span> {f.awayName}</div><div className="text-xs text-white/55">{[f.round, f.venue].filter(Boolean).join(' · ')}</div></li>)}</ul>}
            {tab === 'results' && <ul className="divide-y divide-white/10">{d.results.map((f) => <li key={f.id} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-6"><div className="text-sm text-white/60">{fmtDate(f.date, { day: 'numeric', month: 'short' })}</div><div className="font-medium">{f.homeName} <b className="mx-1 px-2 py-0.5 text-sm" style={{ background: gold, color: '#0E0D0C' }}>{scoreText(f)}</b> {f.awayName}</div><div className="text-xs text-white/55">{f.round}</div></li>)}</ul>}
            {tab === 'tables' && <div className="grid gap-8 lg:grid-cols-2">{d.standingGroups.map((g) => <div key={g.competition}><h3 className="mb-3 text-sm font-bold uppercase tracking-[0.2em]" style={{ color: gold }}>{g.competition}</h3><StandingsTable rows={g.rows} showForm={false} label={g.competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/50 border-b border-white/20', tr: 'border-b border-white/10', us: 'font-bold', points: 'font-bold' }} /></div>)}</div>}
            {tab === 'bracket' && <Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-xs font-bold uppercase tracking-[0.25em]', match: 'border border-white/20 bg-[#1E1A17]', win: 'font-bold', score: 'font-bold' }} />}
            {tab === 'teams' && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{d.teams.map((x) => <li key={x.id} className="border border-white/10 p-4"><div className="font-semibold">{x.name}</div><div className="text-xs text-white/55">{[x.ageGroup, x.gender].filter(Boolean).join(' · ')}</div></li>)}</ul>}
            {tab === 'venues' && <ul className="grid gap-4 md:grid-cols-2">{d.venues.map((v) => <li key={v.id} className="border border-white/10 p-5"><div className="text-xl font-semibold" style={{ fontFamily: SERIF }}>{v.name}</div>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm underline">{v.address}</a>}{v.capacity && <div className="mt-2 text-xs text-white/55">Capacity {v.capacity.toLocaleString('en-GB')}</div>}{v.notes && <p className="mt-2 text-sm text-white/70">{v.notes}</p>}</li>)}</ul>}
            {tab === 'rules' && <ol className="space-y-3">{d.rules.map((r, i) => <li key={i} className="flex gap-4"><b className="w-8 shrink-0 text-2xl" style={{ fontFamily: SERIF, color: gold }}>{i + 1}</b><span className="text-white/85">{r}</span></li>)}</ol>}
          </div>
        </section>
      )}

      {(t.format || t.formatDescription || t.prizeInfo || t.registrationInfo || t.ticketInfo) && <section className="mx-auto max-w-6xl px-5 pb-20"><div className="grid gap-4 md:grid-cols-3">{([['Format', [t.format, t.formatDescription].filter(Boolean).join(': ')], ['Prizes', t.prizeInfo], ['Entry & tickets', [t.registrationInfo, t.ticketInfo].filter(Boolean).join(' ')]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <SpReveal key={l} className={`${panel} p-6`}><h3 className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>{l}</h3><p className="mt-3 text-white/80">{v}</p></SpReveal>)}</div></section>}

      {d.has.news && <section id="cp-news" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20"><h2 className="mb-6 text-4xl font-bold" style={{ fontFamily: SERIF }}>Latest news</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 80} className={`${panel} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="stadium" palette="clay" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: gold }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-2 text-xl font-semibold leading-snug" style={{ fontFamily: SERIF }}>{n.title}</h3>{n.summary && <p className="mt-2 text-sm text-white/65">{n.summary}</p>}</div></SpReveal>)}</div></section>}
      {d.has.gallery && <section id="cp-gallery" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="stadium" palette="clay" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section id="cp-partners" className="scroll-mt-16 border-y border-white/10 py-10"><p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">Official partners</p><ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-12 gap-y-4 px-5 text-2xl font-semibold text-white/45" style={{ fontFamily: SERIF }}>{d.sponsors.map((s) => <li key={s.id}>{s.name}</li>)}</ul></section>}

      <section id="cp-contact" className="scroll-mt-16 mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><h2 className="text-4xl font-bold" style={{ fontFamily: SERIF }}>Tournament office</h2><div className="mt-5 space-y-1.5 text-white/80">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{t.registrationDeadline && <p className="mt-4 text-sm" style={{ color: gold }}>Registration closes {fmtDate(parseDate(t.registrationDeadline) as Date | null) || t.registrationDeadline}</p>}{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Team registration', 'Media', 'Sponsorship', 'General']} buttonStyle={{ background: gold }} cls={{ input: 'w-full border border-white/20 bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/50 focus:outline-none', button: 'px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#0E0D0C]', note: 'text-sm text-white/70' }} />
      </section>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/45">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
