import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useActiveSection, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
const HEAD = 'Rajdhani, system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Cricket League Centre: ocean blue, data-first. A sticky section sidebar beside dense tables, scorecards and fixtures. */
export const CricketLeagueCentre: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'ocean', coverKind: 'cricket' }), [props]);
  const cyan = d.brand.accent || '#58D0E8';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const sections = useMemo(() => ([
    ['Overview', 'cl-overview'], d.has.standings && ['Points table', 'cl-table'], d.has.fixtures && ['Fixtures', 'cl-fixtures'], d.has.results && ['Results', 'cl-results'],
    d.has.bracket && ['Playoffs', 'cl-playoffs'], d.has.teams && ['Teams', 'cl-teams'], d.has.venues && ['Grounds', 'cl-grounds'], d.has.rules && ['Playing conditions', 'cl-rules'],
    d.has.news && ['News', 'cl-news'], d.has.gallery && ['Gallery', 'cl-gallery'], ['Contact', 'cl-contact']
  ].filter(Boolean) as [string, string][]), [d]);
  const active = useActiveSection(sections.map(([, id]) => id));
  const card = 'border border-white/10 bg-[#06263F]';
  const h2 = 'text-3xl font-bold uppercase tracking-wide';

  return (
    <div id="cl-top" className="sp-root min-h-screen bg-[#04182C] text-[#E3F8FF]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="border-b border-white/10 bg-[#031B34]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3"><img src={d.logo} alt="" className="h-10 w-10 object-contain" /><div className="min-w-0"><div className="truncate text-2xl font-bold uppercase leading-none" style={{ fontFamily: HEAD }}>{d.name}</div><div className="text-xs uppercase tracking-[0.25em] text-white/55">{[t.edition, d.sport].filter(Boolean).join(' · ')}</div></div></div>
        <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-1 overflow-x-auto border-t border-white/10 px-3 lg:hidden">{sections.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/70">{l}</button>)}</nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[13rem_1fr]">
        <aside className="hidden lg:block"><nav aria-label="Sections" className="sticky top-6 space-y-0.5 border-l border-white/10">{sections.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} aria-current={active === id ? 'true' : undefined} className="block w-full border-l-2 px-4 py-2 text-left text-sm font-semibold uppercase tracking-wider transition" style={active === id ? { borderColor: cyan, color: cyan, marginLeft: -1 } : { borderColor: 'transparent', color: 'rgba(255,255,255,.6)', marginLeft: -1 }}>{l}</button>)}</nav></aside>

        <main className="min-w-0 space-y-14">
          <section id="cl-overview" className="scroll-mt-6 relative overflow-hidden border border-white/10">
            <SmartImg src={d.cover} seed={d.name} kind="cricket" palette="ocean" alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover opacity-35" />
            <div className="relative p-6 sm:p-10"><h1 className="text-5xl font-bold uppercase leading-[0.95] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-4 max-w-2xl text-white/80">{d.description}</p>}
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">{([['Dates', fmtRange(t.start, t.end)], ['Format', t.format], ['Match format', t.matchFormat], ['Teams', d.teams.length ? String(d.teams.length) : '']] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l} className="border-l-2 pl-3" style={{ borderColor: cyan }}><dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">{l}</dt><dd className="text-xl font-bold" style={{ fontFamily: HEAD }}>{v}</dd></div>)}</dl></div>
          </section>

          {d.has.standings && <section id="cl-table" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Points table</h2><div className="mt-4 space-y-6">{d.standingGroups.map((g) => <div key={g.competition} className={`${card} p-3`}><h3 className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/55">{g.competition}</h3><StandingsTable rows={g.rows} showForm label={g.competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/50 border-b border-white/15', tr: 'border-b border-white/5', us: 'font-bold', points: 'text-base font-bold', chip: (f) => (f === 'W' ? 'bg-emerald-500 text-black' : f === 'L' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-black') }} /></div>)}</div></section>}

          {d.has.fixtures && <section id="cl-fixtures" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Fixtures</h2><div className={`${card} mt-4 overflow-x-auto`} role="region" aria-label="Fixtures" tabIndex={0}><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-white/15 text-[11px] uppercase tracking-widest text-white/50"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Match</th><th className="px-4 py-3">Ground</th><th className="px-4 py-3">Round</th></tr></thead><tbody>{d.fixtures.map((f) => <tr key={f.id} className="border-b border-white/5"><td className="whitespace-nowrap px-4 py-3 font-semibold" style={{ color: cyan }}>{fmtDay(f.date)} {fmtTime(f.date)}</td><td className="px-4 py-3 font-medium">{f.homeName} v {f.awayName}</td><td className="px-4 py-3 text-white/65">{f.venue}</td><td className="px-4 py-3 text-white/65">{f.round}</td></tr>)}</tbody></table></div></section>}

          {d.has.results && <section id="cl-results" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Results</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{d.results.slice(0, 6).map((f) => <article key={f.id} className={`${card} p-4`}><div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50"><span>{f.round || f.competition}</span><span>{fmtDate(f.date, { day: 'numeric', month: 'short' })}</span></div>{([[f.homeName, f.homeScore, 'home'], [f.awayName, f.awayScore, 'away']] as const).map(([n, r, side]) => <div key={side} className="mt-2 flex items-center justify-between gap-3"><span className="truncate font-semibold">{n}</span><span className="whitespace-nowrap text-2xl font-bold tabular-nums" style={{ fontFamily: HEAD }}>{r ?? '-'}</span></div>)}{f.summary && <p className="mt-3 border-t border-white/10 pt-2 text-xs" style={{ color: cyan }}>{f.summary}</p>}<span className="sr-only">Score {scoreText(f)}</span></article>)}</div></section>}

          {d.has.bracket && <section id="cl-playoffs" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Playoffs</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{d.stages.filter((s) => s.matches.length).map((s) => <div key={s.id} className={`${card} p-4`}><h3 className="text-sm font-bold uppercase tracking-[0.25em]">{s.name}</h3><ul className="mt-3 space-y-3">{s.matches.map((m) => <li key={m.id} className="border-t border-white/10 pt-3 text-sm"><div className="flex justify-between gap-3"><span className="truncate">{m.home || 'To be decided'}</span><b className="tabular-nums">{m.homeScore ?? ''}</b></div><div className="flex justify-between gap-3"><span className="truncate">{m.away || 'To be decided'}</span><b className="tabular-nums">{m.awayScore ?? ''}</b></div></li>)}</ul></div>)}</div></section>}

          {d.has.teams && <section id="cl-teams" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Teams</h2><ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">{d.teams.map((x) => <li key={x.id} className={`${card} flex items-center gap-3 p-4`}><span className="grid h-9 w-9 shrink-0 place-items-center text-sm font-bold text-[#031B34]" style={{ background: cyan, fontFamily: HEAD }}>{x.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 truncate font-semibold">{x.name}</span></li>)}</ul></section>}

          {d.has.venues && <section id="cl-grounds" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Grounds</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{d.venues.map((v) => <div key={v.id} className={`${card} p-5`}><h3 className="text-xl font-bold" style={{ fontFamily: HEAD }}>{v.name}</h3>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 underline">{v.address}</a>}{v.notes && <p className="mt-2 text-sm text-white/65">{v.notes}</p>}</div>)}</div></section>}

          {d.has.rules && <section id="cl-rules" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>Playing conditions</h2><ol className={`${card} mt-4 list-decimal space-y-2 p-6 pl-10 text-white/85`}>{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></section>}

          {d.has.news && <section id="cl-news" className="scroll-mt-6"><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>News</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className={`${card} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="cricket" palette="ocean" alt="" className="aspect-video w-full object-cover" /><div className="p-4"><div className="text-[11px] uppercase tracking-widest text-white/50">{fmtDate(n.date)}</div><h3 className="mt-1 font-semibold leading-snug">{n.title}</h3></div></article>)}</div></section>}
          {d.has.gallery && <section id="cl-gallery" className="scroll-mt-6"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="cricket" palette="ocean" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
          {d.has.sponsors && <section aria-label="Partners" className="border-y border-white/10 py-6"><ul className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-xl font-bold uppercase text-white/40" style={{ fontFamily: HEAD }}>{d.sponsors.map((s) => <li key={s.id}>{s.name}</li>)}</ul></section>}

          <section id="cl-contact" className="scroll-mt-6 grid gap-8 lg:grid-cols-2">
            <div><h2 className={h2} style={{ fontFamily: HEAD, color: cyan }}>League office</h2><div className="mt-4 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white/10" />}</div>
            <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Team entry', 'Fixtures', 'Media', 'Other']} buttonStyle={{ background: cyan }} cls={{ input: 'w-full border border-white/20 bg-[#06263F] px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/50 focus:outline-none', button: 'px-8 py-3 text-sm font-bold uppercase tracking-widest text-[#031B34]', note: 'text-sm text-white/70' }} />
          </section>
        </main>
      </div>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/45">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
