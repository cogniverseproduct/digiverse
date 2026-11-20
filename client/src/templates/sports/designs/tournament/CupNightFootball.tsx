import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&display=swap';
const HEAVY = '"Archivo Black", Impact, sans-serif';
const SANS = 'Archivo, system-ui, sans-serif';

/** Cup Night Football: turf green, pitch lines and heavy type. Group-stage cards, match-night list, knockout bracket. */
export const CupNightFootball: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'turf', coverKind: 'pitch' }), [props]);
  const mint = d.brand.accent || '#8DE0A6';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const live = d.live;
  const nav = ([d.has.standings && ['Groups', 'cn-groups'], (d.has.fixtures || d.has.results) && ['Matches', 'cn-matches'], d.has.bracket && ['Knockout', 'cn-knockout'], d.has.teams && ['Teams', 'cn-teams'], d.has.gallery && ['Gallery', 'cn-gallery'], ['Contact', 'cn-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-4xl uppercase leading-none sm:text-6xl';

  return (
    <div id="cn-top" className="sp-root min-h-screen bg-[#062414] text-[#EFFFF4]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b-4 bg-[#062414]/95 backdrop-blur" style={{ borderColor: mint }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('cn-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-xl uppercase" style={{ fontFamily: HEAVY }}>{d.shortName}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="pitch" palette="turf" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55" />
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg,#062414cc,#062414 95%)' }} />
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-32">
          <SpReveal><p className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#062414]" style={{ background: mint }}>{[t.edition, fmtRange(t.start, t.end)].filter(Boolean).join(' · ') || 'Football cup'}</p>
            <h1 className="mt-5 text-[clamp(3rem,11vw,8rem)] uppercase leading-[0.9]" style={{ fontFamily: HEAVY }}>{d.name}</h1>
            {d.tagline && <p className="mt-4 max-w-2xl text-xl font-semibold text-white/80">{d.tagline}</p>}</SpReveal>
          {live && <div className="mt-8 inline-flex flex-wrap items-center gap-4 border-2 px-5 py-3" style={{ borderColor: '#ef4444' }} role="status"><span className="sp-pulse inline-block h-3 w-3 rounded-full bg-red-500" /><b className="text-sm uppercase tracking-widest text-red-300">Live</b><span className="font-semibold">{live.homeName} {scoreText(live)} {live.awayName}</span></div>}
          {d.next && !live && <div className="mt-8 inline-flex flex-wrap items-center gap-x-5 gap-y-1 border-l-8 bg-black/40 px-5 py-3" style={{ borderColor: mint }}><b className="text-xs uppercase tracking-[0.25em]" style={{ color: mint }}>Next match</b><span className="text-lg font-bold">{d.next.homeName} v {d.next.awayName}</span><span className="text-sm text-white/65">{fmtDay(d.next.date)} {fmtTime(d.next.date)}</span></div>}
        </div>
      </section>

      {d.has.standings && (
        <section id="cn-groups" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-16">
          <h2 className={h2} style={{ fontFamily: HEAVY }}>The <span style={{ color: mint }}>groups</span></h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">{d.standingGroups.map((g, i) => <SpReveal key={g.competition} delay={i * 80} className="border-2 border-white/15 bg-black/25"><div className="px-5 py-3 text-lg uppercase text-[#062414]" style={{ fontFamily: HEAVY, background: mint }}>{g.competition}</div><div className="p-3"><StandingsTable rows={g.rows} compact showForm={false} label={g.competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/50', tr: 'border-t border-white/10', us: 'font-bold', points: 'text-lg font-bold' }} /></div></SpReveal>)}</div>
        </section>
      )}

      {(d.has.fixtures || d.has.results) && (
        <section id="cn-matches" className="scroll-mt-16 border-y-4 border-white/10 bg-black/30 py-16"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
          {d.has.fixtures && <div><h2 className="text-4xl uppercase" style={{ fontFamily: HEAVY }}>Match nights</h2><ul className="mt-6 space-y-3">{d.fixtures.slice(0, 6).map((f) => <li key={f.id} className="flex items-stretch bg-white/[0.06]"><div className="flex w-20 shrink-0 flex-col items-center justify-center py-3 text-[#062414]" style={{ background: mint }}><span className="text-2xl leading-none" style={{ fontFamily: HEAVY }}>{f.date?.getDate()}</span><span className="text-[10px] font-bold uppercase">{fmtDate(f.date, { month: 'short' })}</span></div><div className="min-w-0 flex-1 px-4 py-3"><div className="truncate font-bold">{f.homeName} v {f.awayName}</div><div className="text-xs text-white/55">{[fmtTime(f.date), f.round, f.venue].filter(Boolean).join(' · ')}</div></div></li>)}</ul></div>}
          {d.has.results && <div><h2 className="text-4xl uppercase" style={{ fontFamily: HEAVY }}>Full time</h2><ul className="mt-6 space-y-3">{d.results.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 border-l-8 bg-white/[0.06] px-4 py-3" style={{ borderColor: mint }}><div className="min-w-0"><div className="truncate font-bold">{f.homeName} v {f.awayName}</div><div className="text-xs text-white/55">{[fmtDate(f.date, { day: 'numeric', month: 'short' }), f.round].filter(Boolean).join(' · ')}</div></div><div className="shrink-0 whitespace-nowrap text-3xl" style={{ fontFamily: HEAVY, color: mint }}>{scoreText(f)}</div></li>)}</ul></div>}
        </div></section>
      )}

      {d.has.bracket && <section id="cn-knockout" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-16"><h2 className={h2} style={{ fontFamily: HEAVY }}>Road to the <span style={{ color: mint }}>final</span></h2><div className="mt-8"><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-sm font-bold uppercase tracking-[0.25em]', match: 'border-2 border-white/20 bg-black/30', win: 'font-extrabold', score: 'font-extrabold' }} /></div></section>}

      {d.has.teams && <section id="cn-teams" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-16"><h2 className={h2} style={{ fontFamily: HEAVY }}>The teams</h2><ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{d.teams.map((x) => <li key={x.id} className="flex items-center gap-3 border-2 border-white/15 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center text-sm text-[#062414]" style={{ background: mint, fontFamily: HEAVY }}>{x.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 truncate font-bold">{x.name}</span></li>)}</ul></section>}

      {(d.has.venues || d.has.rules || t.prizeInfo) && <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 md:grid-cols-2">{d.has.venues && <div className="border-2 border-white/15 p-6"><h3 className="text-2xl uppercase" style={{ fontFamily: HEAVY }}>Grounds</h3><ul className="mt-4 space-y-3">{d.venues.map((v) => <li key={v.id}><div className="font-bold">{v.name}</div>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white/70">{v.address}</a>}</li>)}</ul></div>}{d.has.rules && <div className="border-2 border-white/15 p-6"><h3 className="text-2xl uppercase" style={{ fontFamily: HEAVY }}>Rules</h3><ol className="mt-4 list-decimal space-y-2 pl-5 text-white/85">{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>{t.prizeInfo && <p className="mt-4 text-sm font-bold" style={{ color: mint }}>Prizes: {t.prizeInfo}</p>}</div>}</section>}

      {d.has.news && <section className="mx-auto max-w-7xl px-5 pb-16"><h2 className={h2} style={{ fontFamily: HEAVY }}>Cup news</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className="overflow-hidden border-2 border-white/15"><SmartImg src={n.image} seed={n.title} kind="pitch" palette="turf" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-xs font-bold uppercase tracking-widest" style={{ color: mint }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-bold leading-snug">{n.title}</h3></div></article>)}</div></section>}
      {d.has.gallery && <section id="cn-gallery" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-16"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="turf" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <div className="sp-marquee-wrap overflow-hidden border-y-4 border-white/10 py-5" aria-label="Sponsors"><div className="sp-marquee" style={{ ['--sp-speed' as string]: '28s' }}>{[0, 1].map((k) => <div key={k} className="flex" {...(k ? { 'data-dup': true, 'aria-hidden': true } : {})}>{d.sponsors.map((s) => <span key={`${k}${s.id}`} className="mx-10 whitespace-nowrap text-2xl uppercase text-white/35" style={{ fontFamily: HEAVY }}>{s.name}</span>)}</div>)}</div></div>}

      <section id="cn-contact" className="scroll-mt-16 mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><h2 className={h2} style={{ fontFamily: HEAVY }}>Enter a <span style={{ color: mint }}>team</span></h2>{t.registrationInfo && <p className="mt-4 text-lg text-white/80">{t.registrationInfo}</p>}<div className="mt-5 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Register a team', 'Fixtures question', 'Sponsorship', 'Other']} buttonStyle={{ background: mint }} cls={{ input: 'w-full border-2 border-white/20 bg-black/30 px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/60 focus:outline-none', button: 'px-8 py-3 text-sm font-extrabold uppercase tracking-widest text-[#062414]', note: 'text-sm text-white/75' }} />
      </section>
      <footer className="border-t-4 border-white/10 py-6 text-center text-xs uppercase tracking-widest text-white/45">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
