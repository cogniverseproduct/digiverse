import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';
const SANS = '"IBM Plex Sans", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Fixtures & Results Desk: dark mint, monospace data. A filter bar (search, team, status) drives one dense table of every match. */
export const FixturesResultsDesk: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'mint', coverKind: 'court' }), [props]);
  const mint = d.brand.accent || '#7FE5CE';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'upcoming' | 'played'>('all');
  const [teamName, setTeamName] = useState('');
  const all = useMemo(() => [...d.fixtures, ...d.results].sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0)), [d.fixtures, d.results]);
  const teamNames = useMemo(() => Array.from(new Set(all.flatMap((f) => [f.homeName, f.awayName]))).sort(), [all]);
  const rows = all.filter((f) => (status === 'all' || (status === 'played' ? f.completed : !f.completed)) && (!teamName || f.homeName === teamName || f.awayName === teamName) && (!q || `${f.homeName} ${f.awayName} ${f.venue || ''} ${f.round || ''}`.toLowerCase().includes(q.toLowerCase())));
  const box = 'border border-white/10 bg-[#062B2B]';
  const nav = ([all.length > 0 && ['Desk', 'fd-desk'], d.has.standings && ['Tables', 'fd-tables'], d.has.bracket && ['Bracket', 'fd-bracket'], (d.has.venues || d.has.rules) && ['Info', 'fd-info'], d.has.news && ['News', 'fd-news'], ['Contact', 'fd-contact']].filter(Boolean) as [string, string][]);
  const inp = 'rounded-md border border-white/20 bg-[#041C1C] px-3 py-2 text-sm text-[#EAFFF9] placeholder:text-white/40 focus:border-white/60 focus:outline-none';

  return (
    <div id="fd-top" className="sp-root min-h-screen bg-[#041C1C] text-[#EAFFF9]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#041C1C]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('fd-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-8 w-8 object-contain" /><span className="font-semibold">{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto" style={{ fontFamily: MONO }}>{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs uppercase tracking-wider text-white/65 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 md:py-20 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div><p className="text-xs uppercase tracking-[0.3em]" style={{ color: mint, fontFamily: MONO }}>{[t.edition, d.sport, fmtRange(t.start, t.end)].filter(Boolean).join(' / ')}</p><h1 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">{d.tagline || d.name}</h1>{d.description && <p className="mt-4 max-w-2xl text-white/70">{d.description}</p>}</div>
          <dl className="grid grid-cols-3 gap-3" style={{ fontFamily: MONO }}>{[['Matches', all.length], ['Played', d.results.length], ['Teams', d.teams.length || teamNames.length]].map(([l, n]) => <div key={l as string} className={`${box} p-4`}><dd className="text-3xl font-medium" style={{ color: mint }}>{n}</dd><dt className="text-[11px] uppercase tracking-widest text-white/50">{l}</dt></div>)}</dl>
        </div>
      </section>

      {all.length > 0 && (
        <section id="fd-desk" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-14">
          <h2 className="text-2xl font-bold">Fixtures & results</h2>
          <form role="search" aria-label="Filter matches" onSubmit={(e) => e.preventDefault()} className="mt-5 grid gap-3 md:grid-cols-[1fr_14rem_auto]">
            <label className="relative block"><span className="sr-only">Search matches</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team, venue or round" className={`${inp} w-full pl-9`} /></label>
            <label className="block"><span className="sr-only">Team</span><select value={teamName} onChange={(e) => setTeamName(e.target.value)} className={`${inp} w-full`}><option value="">All teams</option>{teamNames.map((n) => <option key={n}>{n}</option>)}</select></label>
            <div role="group" aria-label="Status" className="flex rounded-md border border-white/20 p-0.5 text-sm">{(['all', 'upcoming', 'played'] as const).map((s) => <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className="rounded px-3 py-1.5 capitalize" style={status === s ? { background: mint, color: '#041C1C' } : { color: 'rgba(255,255,255,.7)' }}>{s}</button>)}</div>
          </form>
          <p className="mt-3 text-xs text-white/50" style={{ fontFamily: MONO }} role="status" aria-live="polite">{rows.length} of {all.length} matches</p>
          <div className={`${box} mt-3 overflow-x-auto`} role="region" aria-label="Matches" tabIndex={0}>
            <table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-white/15 text-[11px] uppercase tracking-widest text-white/50" style={{ fontFamily: MONO }}><th className="px-4 py-3">Date</th><th className="px-4 py-3">Home</th><th className="px-4 py-3 text-center">Score</th><th className="px-4 py-3">Away</th><th className="px-4 py-3">Round</th><th className="px-4 py-3">Venue</th></tr></thead>
              <tbody>{rows.map((f) => <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.04]"><td className="whitespace-nowrap px-4 py-2.5 text-white/70" style={{ fontFamily: MONO }}>{fmtDay(f.date)} {fmtTime(f.date)}</td><td className="px-4 py-2.5 font-medium">{f.homeName}</td><td className="whitespace-nowrap px-4 py-2.5 text-center text-base font-medium" style={{ fontFamily: MONO, color: f.completed ? mint : 'rgba(255,255,255,.4)' }}>{f.completed ? scoreText(f) : 'v'}</td><td className="px-4 py-2.5 font-medium">{f.awayName}</td><td className="px-4 py-2.5 text-white/60">{f.round}</td><td className="px-4 py-2.5 text-white/60">{f.venue}</td></tr>)}{!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/50">No matches match those filters.</td></tr>}</tbody></table>
          </div>
        </section>
      )}

      {d.has.standings && <section id="fd-tables" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-14"><h2 className="text-2xl font-bold">Tables</h2><div className="mt-5 grid gap-5 lg:grid-cols-2">{d.standingGroups.map((g) => <div key={g.competition} className={`${box} p-3`}><h3 className="px-3 py-2 text-xs uppercase tracking-widest" style={{ color: mint, fontFamily: MONO }}>{g.competition}</h3><StandingsTable rows={g.rows} showForm={false} label={g.competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/45 border-b border-white/15', tr: 'border-b border-white/5', td: 'font-mono', pos: 'font-mono', us: 'font-semibold', points: 'font-mono text-base' }} /></div>)}</div></section>}
      {d.has.bracket && <section id="fd-bracket" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-14"><h2 className="mb-5 text-2xl font-bold">Knockout bracket</h2><div className={`${box} p-5`}><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-[11px] uppercase tracking-[0.25em] text-white/55', match: 'rounded-md border border-white/20 bg-[#041C1C]', win: 'font-semibold', score: 'font-mono' }} /></div></section>}

      {(d.has.venues || d.has.rules || t.format) && <section id="fd-info" className="scroll-mt-16 mx-auto grid max-w-7xl gap-5 px-5 pb-14 md:grid-cols-3">{(t.format || t.formatDescription) && <div className={`${box} p-5`}><h3 className="text-xs uppercase tracking-widest" style={{ color: mint, fontFamily: MONO }}>Format</h3><p className="mt-3 text-white/85">{[t.format, t.formatDescription].filter(Boolean).join(': ')}</p>{t.matchFormat && <p className="mt-2 text-sm text-white/60">{t.matchFormat}</p>}</div>}{d.has.venues && <div className={`${box} p-5`}><h3 className="text-xs uppercase tracking-widest" style={{ color: mint, fontFamily: MONO }}>Venues</h3><ul className="mt-3 space-y-2">{d.venues.map((v) => <li key={v.id}><b>{v.name}</b>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="block text-sm underline text-white/70">{v.address}</a>}</li>)}</ul></div>}{d.has.rules && <div className={`${box} p-5`}><h3 className="text-xs uppercase tracking-widest" style={{ color: mint, fontFamily: MONO }}>Rules</h3><ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-white/85">{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></div>}</section>}

      {d.has.news && <section id="fd-news" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-14"><h2 className="mb-5 text-2xl font-bold">News</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className={`${box} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="court" palette="mint" alt="" className="aspect-video w-full object-cover" /><div className="p-4"><div className="text-[11px] uppercase tracking-widest text-white/45" style={{ fontFamily: MONO }}>{fmtDate(n.date)}</div><h3 className="mt-1 font-semibold leading-snug">{n.title}</h3></div></article>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-5 pb-14"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-md"><SmartImg src={p.src} seed={p.id} kind="court" palette="mint" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Partners" className="border-y border-white/10 py-6"><ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-2 px-5 text-sm uppercase tracking-widest text-white/40" style={{ fontFamily: MONO }}>{d.sponsors.map((s) => <li key={s.id}>{s.name}</li>)}</ul></section>}

      <section id="fd-contact" className="scroll-mt-16 mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2">
        <div><h2 className="text-2xl font-bold">Contact</h2><div className="mt-4 space-y-1.5 text-white/80">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: mint }} cls={{ input: `${inp} w-full`, button: 'rounded-md px-6 py-2.5 text-sm font-semibold text-[#041C1C]', note: 'text-sm text-white/70' }} />
      </section>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40" style={{ fontFamily: MONO }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
