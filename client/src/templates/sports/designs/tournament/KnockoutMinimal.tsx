import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
const SANS = 'Inter, system-ui, sans-serif';

/** Knockout Minimal: white, black and one red. The bracket is the first thing after a one-line header; everything else is quiet. */
export const KnockoutMinimal: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'mono', coverKind: 'pitch' }), [props]);
  const red = d.brand.accent || '#C21F3A';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const nav = ([d.has.bracket && ['Bracket', 'km-bracket'], (d.has.fixtures || d.has.results) && ['Matches', 'km-matches'], d.has.standings && ['Groups', 'km-groups'], (d.has.rules || d.has.venues) && ['Info', 'km-info'], ['Contact', 'km-contact']].filter(Boolean) as [string, string][]);
  const label = 'text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500';

  return (
    <div id="km-top" className="sp-root min-h-screen bg-white text-neutral-900" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b-2 border-neutral-900 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <button type="button" onClick={() => scrollToId('km-top')} className="flex items-center gap-2.5 font-extrabold"><img src={d.logo} alt="" className="h-7 w-7 object-contain" />{d.name}</button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-6 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-semibold text-neutral-500 hover:text-neutral-900">{l}</button>)}</nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-20">
        <p className={label}>{[t.edition, d.sport, fmtRange(t.start, t.end), t.location || d.location].filter(Boolean).join(' · ')}</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">{(d.tagline || d.name).replace(/[.!?]+$/, "")}<span style={{ color: red }}>.</span></h1>
        {d.description && <p className="mt-5 max-w-2xl text-lg text-neutral-600">{d.description}</p>}
      </section>

      {d.has.bracket
        ? <section id="km-bracket" className="scroll-mt-16 border-y-2 border-neutral-900 bg-neutral-50 py-12"><div className="mx-auto max-w-6xl px-6"><h2 className="mb-6 text-3xl font-extrabold tracking-tight">Bracket</h2><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500', match: 'border-2 border-neutral-900 bg-white', row: 'text-sm', win: 'font-extrabold', score: 'font-extrabold' }} /></div></section>
        : <div className="mx-auto max-w-6xl px-6"><p className="border-y-2 border-neutral-900 py-6 text-neutral-500">The knockout bracket will appear here once it is published.</p></div>}

      {(d.has.fixtures || d.has.results) && (
        <section id="km-matches" className="scroll-mt-16 mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-2">
          {d.has.fixtures && <div><h2 className="text-3xl font-extrabold tracking-tight">Next up</h2><ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">{d.fixtures.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><div className="truncate font-semibold">{f.homeName} v {f.awayName}</div><div className="text-sm text-neutral-500">{[f.round, f.venue].filter(Boolean).join(' · ')}</div></div><div className="shrink-0 text-right text-sm"><div className="font-bold" style={{ color: red }}>{fmtDay(f.date)}</div><div className="text-neutral-500">{fmtTime(f.date)}</div></div></li>)}</ul></div>}
          {d.has.results && <div><h2 className="text-3xl font-extrabold tracking-tight">Results</h2><ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">{d.results.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0 truncate font-medium">{f.homeName} v {f.awayName}</div><div className="shrink-0 whitespace-nowrap text-xl font-extrabold tabular-nums">{scoreText(f)}</div></li>)}</ul></div>}
        </section>
      )}

      {d.has.standings && <section id="km-groups" className="scroll-mt-16 border-t border-neutral-200 bg-neutral-50 py-20"><div className="mx-auto max-w-6xl px-6"><h2 className="mb-8 text-3xl font-extrabold tracking-tight">Groups</h2><div className="grid gap-10 md:grid-cols-2">{d.standingGroups.map((g) => <div key={g.competition}><h3 className={`${label} mb-2`}>{g.competition}</h3><StandingsTable rows={g.rows} compact showForm={false} label={g.competition} theme={{ th: 'border-b-2 border-neutral-900 text-[11px] uppercase tracking-widest text-neutral-500', tr: 'border-b border-neutral-200', us: 'font-bold', points: 'font-extrabold' }} /></div>)}</div></div></section>}

      {(d.has.rules || d.has.venues || t.registrationInfo || t.prizeInfo) && <section id="km-info" className="scroll-mt-16 mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-3">{d.has.rules && <div className="md:col-span-1"><h2 className="text-2xl font-extrabold">Rules</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-neutral-700">{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></div>}{d.has.venues && <div><h2 className="text-2xl font-extrabold">Venue</h2><ul className="mt-4 space-y-3">{d.venues.map((v) => <li key={v.id}><div className="font-semibold">{v.name}</div>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="text-sm underline text-neutral-600">{v.address}</a>}</li>)}</ul></div>}{(t.registrationInfo || t.prizeInfo) && <div><h2 className="text-2xl font-extrabold">Entry</h2>{t.registrationInfo && <p className="mt-4 text-neutral-700">{t.registrationInfo}</p>}{t.prizeInfo && <p className="mt-3 font-semibold" style={{ color: red }}>Prize: {t.prizeInfo}</p>}</div>}</section>}

      {d.has.news && <section className="mx-auto max-w-6xl px-6 pb-20"><h2 className="mb-6 text-3xl font-extrabold tracking-tight">News</h2><div className="grid gap-8 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id}><SmartImg src={n.image} seed={n.title} kind="pitch" palette="mono" alt="" className="aspect-[4/3] w-full object-cover" /><div className={`${label} mt-3`}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-bold leading-snug">{n.title}</h3></article>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-6xl px-6 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="mono" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Partners" className="border-y border-neutral-200 py-8"><ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-12 gap-y-3 px-6 text-lg font-bold text-neutral-400">{d.sponsors.map((s) => <li key={s.id}>{s.name}</li>)}</ul></section>}

      <section id="km-contact" className="scroll-mt-16 mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div><h2 className="text-3xl font-extrabold tracking-tight">Contact</h2><div className="mt-5 space-y-2">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline decoration-neutral-300 underline-offset-4">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline decoration-neutral-300 underline-offset-4">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border-2 border-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-neutral-900 hover:text-white" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: red }} cls={{ input: 'w-full border-b-2 border-neutral-300 bg-transparent px-0 py-3 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none', button: 'px-8 py-3 text-sm font-bold text-white', note: 'text-sm text-neutral-600' }} />
      </section>
      <footer className="border-t-2 border-neutral-900 py-6 text-center text-sm text-neutral-500">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
