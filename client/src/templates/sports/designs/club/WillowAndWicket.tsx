import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtTime, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Work+Sans:wght@300;400;500;600&display=swap';
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Work Sans", system-ui, sans-serif';

/** Willow & Wicket: a pavilion-style cricket club: scorecard results, eleven team sheets, averages, honours board. */
export const WillowAndWicket: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'paper', coverKind: 'cricket' }), [props]);
  const green = d.brand.primary || '#14532D';
  const brass = d.brand.accent || '#B8892B';
  const [lb, setLb] = useState<number | null>(null);
  const [side, setSide] = useState(d.teams[0]?.id || '');
  const sideTeam = d.teams.find((t) => t.id === side);
  const sheet = d.players.filter((p) => !side || p.teamId === side);
  const nav = ([(d.has.fixtures || d.has.results) && ['Fixtures', 'ww-matches'], d.has.teams && ['The Sides', 'ww-sides'], d.has.players && ['Averages', 'ww-avg'], d.has.standings && ['League', 'ww-table'], d.has.history && ['History', 'ww-history'], d.has.news && ['News', 'ww-news'], ['Contact', 'ww-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-4xl font-semibold sm:text-5xl';
  const kicker = 'text-[11px] font-semibold uppercase tracking-[0.3em]';

  return (
    <div id="ww-top" className="sp-root min-h-screen bg-[#F5F1E8] text-[#1F2A1B]" style={{ fontFamily: SANS, fontWeight: 300 }}>
      <DemoBadge show={d.isDemo} />
      <header style={{ background: green }} className="text-[#F5F1E8]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 pb-6 pt-8 text-center">
          <img src={d.logo} alt={`${d.name} crest`} className="h-16 w-16 object-contain" />
          <h1 className="text-4xl font-semibold tracking-wide sm:text-6xl" style={{ fontFamily: SERIF }}>{d.name}</h1>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em]" style={{ color: brass }}><span className="h-px w-10" style={{ background: brass }} />{d.founded ? `Established ${d.founded}` : d.sport || 'Cricket club'}<span className="h-px w-10" style={{ background: brass }} /></div>
          {d.tagline && <p className="text-lg italic" style={{ fontFamily: SERIF }}>{d.tagline}</p>}
        </div>
        <nav aria-label="Sections" className="border-t border-white/15"><ul className="sp-no-scrollbar mx-auto flex max-w-6xl justify-start gap-6 overflow-x-auto px-5 sm:justify-center">{nav.map(([l, id]) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap py-3 text-[12px] uppercase tracking-[0.25em] text-white/80 hover:text-white">{l}</button></li>)}</ul></nav>
      </header>

      <section className="relative">
        <SmartImg src={d.cover} seed={d.name} kind="cricket" palette="paper" alt="" loading="eager" className="h-[46vh] min-h-[280px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F1E8] via-transparent to-transparent" />
      </section>
      {d.description && <SpReveal className="relative mx-auto -mt-10 max-w-3xl px-5 text-center"><p className="text-2xl leading-9" style={{ fontFamily: SERIF }}>{d.description}</p></SpReveal>}

      {(d.has.fixtures || d.has.results) && (
        <section id="ww-matches" className="scroll-mt-4 mx-auto max-w-6xl px-5 py-20">
          <SpReveal className="mb-10 text-center"><p className={kicker} style={{ color: brass }}>The season</p><h2 className={h2} style={{ fontFamily: SERIF }}>Fixture card & scorecards</h2></SpReveal>
          <div className="grid gap-10 lg:grid-cols-2">
            {d.has.fixtures && <div><h3 className="mb-4 border-b-2 pb-2 text-sm font-semibold uppercase tracking-[0.25em]" style={{ borderColor: green, color: green }}>Forthcoming</h3><ul className="divide-y divide-[#1F2A1B]/15">{d.fixtures.slice(0, 6).map((f) => <li key={f.id} className="grid grid-cols-[4.5rem_1fr] gap-4 py-4"><div className="text-center"><div className="text-3xl font-semibold leading-none" style={{ fontFamily: SERIF, color: green }}>{f.date?.getDate()}</div><div className="text-[10px] uppercase tracking-widest opacity-60">{fmtDate(f.date, { month: 'short', weekday: 'short' })}</div></div><div><div className="font-medium">{f.homeName} v {f.awayName}</div><div className="text-xs opacity-60">{[f.competition, f.venue, fmtTime(f.date)].filter(Boolean).join(' · ')}</div></div></li>)}</ul></div>}
            {d.has.results && <div><h3 className="mb-4 border-b-2 pb-2 text-sm font-semibold uppercase tracking-[0.25em]" style={{ borderColor: green, color: green }}>Scorecards</h3><ul className="space-y-4">{d.results.slice(0, 4).map((f) => <li key={f.id} className="border border-[#1F2A1B]/20 bg-white/60"><div className="flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-widest text-white" style={{ background: green }}><span>{f.competition || f.round}</span><span>{fmtDate(f.date)}</span></div><table className="w-full text-sm"><tbody>{([[f.homeName, f.homeScore], [f.awayName, f.awayScore]] as const).map(([n, r], i) => <tr key={i} className="border-b border-[#1F2A1B]/10 last:border-0"><td className="px-4 py-2 font-medium">{n}</td><td className="px-4 py-2 text-right text-lg font-semibold tabular-nums" style={{ fontFamily: SERIF }}>{r}</td></tr>)}</tbody></table>{f.summary && <p className="border-t border-[#1F2A1B]/10 px-4 py-2 text-xs italic opacity-70">{f.summary}</p>}</li>)}</ul></div>}
          </div>
        </section>
      )}

      {d.has.teams && (
        <section id="ww-sides" className="scroll-mt-4 bg-white/60 py-20"><div className="mx-auto max-w-6xl px-5">
          <SpReveal className="mb-8 text-center"><p className={kicker} style={{ color: brass }}>Team sheets</p><h2 className={h2} style={{ fontFamily: SERIF }}>The sides</h2></SpReveal>
          <div role="tablist" aria-label="Choose a side" className="mb-8 flex flex-wrap justify-center gap-2">{d.teams.map((t) => <button key={t.id} role="tab" aria-selected={side === t.id} type="button" onClick={() => setSide(t.id)} className="border px-5 py-2 text-xs uppercase tracking-[0.2em]" style={side === t.id ? { background: green, color: '#fff', borderColor: green } : { borderColor: '#1F2A1B33' }}>{t.name}</button>)}</div>
          {sideTeam && <p className="mb-6 text-center text-sm opacity-70">{[sideTeam.ageGroup, sideTeam.gender].filter(Boolean).join(' · ')}</p>}
          {sheet.length > 0 ? <ol className="mx-auto grid max-w-3xl gap-x-12 sm:grid-cols-2">{sheet.map((p, i) => <li key={p.id} className="flex items-baseline gap-3 border-b border-dotted border-[#1F2A1B]/30 py-2.5"><span className="w-6 text-right text-sm opacity-50">{i + 1}</span><span className="font-medium">{p.name}</span><span className="ml-auto text-xs italic opacity-60">{p.position}</span></li>)}</ol> : <p className="text-center text-sm opacity-60">Team sheet to be announced.</p>}
        </div></section>
      )}

      {d.has.players && d.players.some((p) => p.stats.length) && (
        <section id="ww-avg" className="scroll-mt-4 mx-auto max-w-4xl px-5 py-20">
          <SpReveal className="mb-8 text-center"><p className={kicker} style={{ color: brass }}>Season statistics</p><h2 className={h2} style={{ fontFamily: SERIF }}>Batting & bowling</h2></SpReveal>
          <div className="overflow-x-auto" role="region" aria-label="Player statistics" tabIndex={0}><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b-2 text-[11px] uppercase tracking-widest" style={{ borderColor: green }}><th className="py-2">Player</th><th>Matches</th><th>Runs</th><th>Wickets</th></tr></thead><tbody>{d.players.filter((p) => p.stats.length).map((p) => { const g = (l: string) => p.stats.find((s) => s.label === l)?.value ?? '–'; return <tr key={p.id} className="border-b border-[#1F2A1B]/10"><td className="py-2.5 font-medium">{p.name}</td><td>{g('Matches')}</td><td>{g('Runs')}</td><td>{g('Wickets')}</td></tr>; })}</tbody></table></div>
        </section>
      )}

      {d.has.standings && (
        <section id="ww-table" className="scroll-mt-4 mx-auto max-w-4xl px-5 pb-20">
          <SpReveal className="mb-8 text-center"><p className={kicker} style={{ color: brass }}>{d.standingGroups[0].competition}</p><h2 className={h2} style={{ fontFamily: SERIF }}>League table</h2></SpReveal>
          <StandingsTable rows={d.standings} showForm={false} label="League table" theme={{ th: 'border-b-2 text-[11px] uppercase tracking-widest', tr: 'border-b border-[#1F2A1B]/10', us: 'bg-[#14532D]/10 font-semibold', points: 'text-lg' }} />
        </section>
      )}

      {d.has.history && (
        <section id="ww-history" className="scroll-mt-4 py-20 text-[#F5F1E8]" style={{ background: green }}><div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.2fr_1fr]">
          <div><p className={kicker} style={{ color: brass }}>Our story</p><h2 className={h2} style={{ fontFamily: SERIF }}>History of the club</h2>{d.history && <p className="mt-5 text-lg leading-8 text-white/85">{d.history}</p>}{d.timeline.length > 0 && <ol className="mt-6 space-y-3">{d.timeline.map((t) => <li key={t.year + t.title} className="flex gap-4"><b className="w-14 shrink-0 text-xl" style={{ fontFamily: SERIF, color: brass }}>{t.year}</b><span><b className="font-medium">{t.title}</b>{t.description && <span className="block text-sm text-white/70">{t.description}</span>}</span></li>)}</ol>}</div>
          {d.clubAchievements.length > 0 && <aside className="border-2 p-6" style={{ borderColor: brass }}><h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: brass }}>Honours board</h3><ul className="mt-5 space-y-4 text-center" style={{ fontFamily: SERIF }}>{d.clubAchievements.map((a) => <li key={a} className="text-xl">{a}</li>)}</ul></aside>}
        </div></section>
      )}

      {d.has.news && (
        <section id="ww-news" className="scroll-mt-4 mx-auto max-w-6xl px-5 py-20">
          <SpReveal className="mb-8 text-center"><p className={kicker} style={{ color: brass }}>From the pavilion</p><h2 className={h2} style={{ fontFamily: SERIF }}>Club news</h2></SpReveal>
          <div className="grid gap-8 md:grid-cols-2">{d.news.slice(0, 4).map((n) => <article key={n.id} className="flex gap-5"><SmartImg src={n.image} seed={n.title} kind="cricket" palette="paper" alt="" className="h-28 w-28 shrink-0 object-cover" /><div><div className="text-[11px] uppercase tracking-widest opacity-60">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-1 text-2xl font-semibold leading-tight" style={{ fontFamily: SERIF }}>{n.title}</h3>{n.summary && <p className="mt-1 text-sm opacity-75">{n.summary}</p>}</div></article>)}</div>
        </section>
      )}

      {d.has.gallery && <section className="mx-auto max-w-6xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden border-4 border-white shadow"><SmartImg src={p.src} seed={p.id} kind="cricket" palette="paper" alt={p.caption} className="aspect-[4/3] w-full object-cover transition hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Sponsors" className="border-y border-[#1F2A1B]/15 py-8 text-center"><p className={`${kicker} mb-4`} style={{ color: brass }}>With thanks to our sponsors</p><ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 text-xl" style={{ fontFamily: SERIF }}>{d.sponsors.map((s) => <li key={s.id}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.name}</a> : s.name}</li>)}</ul></section>}

      <section id="ww-contact" className="scroll-mt-4 mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><p className={kicker} style={{ color: brass }}>Contact the secretary</p><h2 className={h2} style={{ fontFamily: SERIF }}>Find us</h2><div className="mt-5 space-y-1.5">{d.homeGround && <p className="text-lg" style={{ fontFamily: SERIF }}>{d.homeGround}</p>}{d.address && <p><a className="underline" href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer">{d.address}</a></p>}{d.email && <p><a className="underline" href={`mailto:${d.email}`}>{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-[#1F2A1B]/30 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: green }} cls={{ input: 'w-full border border-[#1F2A1B]/30 bg-white/70 px-4 py-3 text-sm focus:border-[#14532D] focus:outline-none', button: 'px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white', note: 'text-sm opacity-70' }} />
      </section>
      <footer className="py-6 text-center text-xs uppercase tracking-[0.25em] text-white/70" style={{ background: green }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
