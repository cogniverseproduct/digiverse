import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap';
const SANS = '"DM Sans", system-ui, sans-serif';

/** Clean Sheet: minimal and professional. White space, hairline rules, one accent colour, no ornament. */
export const CleanSheet: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'mono', coverKind: 'pitch' }), [props]);
  const ink = d.brand.primary || '#111827';
  const acc = d.brand.accent || '#2563EB';
  const [lb, setLb] = useState<number | null>(null);
  const nav = ([(d.has.fixtures || d.has.results) && ['Matches', 'cs-matches'], d.has.standings && ['Table', 'cs-table'], d.has.players && ['Squad', 'cs-squad'], d.has.news && ['News', 'cs-news'], d.has.gallery && ['Gallery', 'cs-gallery'], ['Contact', 'cs-contact']].filter(Boolean) as [string, string][]);
  const label = 'text-xs font-semibold uppercase tracking-[0.2em] text-gray-500';

  return (
    <div id="cs-top" className="sp-root min-h-screen bg-white text-gray-900" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <button type="button" onClick={() => scrollToId('cs-top')} className="flex items-center gap-3 text-base font-bold"><img src={d.logo} alt="" className="h-7 w-7 object-contain" />{d.name}</button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-6 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-medium text-gray-500 hover:text-gray-900">{l}</button>)}</nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
        <p className={label}>{[d.sport, d.location].filter(Boolean).join(' · ')}</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl" style={{ color: ink }}>{d.tagline || d.name}</h1>
        {d.description && <p className="mt-6 max-w-2xl text-xl leading-8 text-gray-600">{d.description}</p>}
        {d.next && <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-gray-200 pt-6"><span className={label}>Next match</span><span className="text-lg font-semibold">{d.next.homeName} v {d.next.awayName}</span><span className="text-gray-500">{fmtDay(d.next.date)} · {fmtTime(d.next.date)}{d.next.venue ? ` · ${d.next.venue}` : ''}</span></div>}
      </section>

      <SmartImg src={d.cover} seed={d.name} kind="pitch" palette="mono" alt="" loading="eager" className="h-[40vh] min-h-[240px] w-full object-cover" />

      {(d.has.fixtures || d.has.results) && (
        <section id="cs-matches" className="scroll-mt-16 mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-2 [&>*]:min-w-0">
          {d.has.fixtures && <div><h2 className="text-3xl font-bold tracking-tight">Fixtures</h2><ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">{d.fixtures.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 py-4"><div><div className="font-semibold">{f.homeName} v {f.awayName}</div><div className="text-sm text-gray-500">{[f.competition, f.venue].filter(Boolean).join(' · ')}</div></div><div className="shrink-0 text-right text-sm"><div className="font-semibold" style={{ color: acc }}>{fmtDate(f.date, { day: 'numeric', month: 'short' })}</div><div className="text-gray-500">{fmtTime(f.date)}</div></div></li>)}</ul></div>}
          {d.has.results && <div><h2 className="text-3xl font-bold tracking-tight">Results</h2><ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">{d.results.slice(0, 6).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0 truncate font-medium">{f.homeName} v {f.awayName}</div><div className="shrink-0 text-lg font-bold tabular-nums" style={{ color: acc }}>{scoreText(f)}</div></li>)}</ul></div>}
        </section>
      )}

      {d.has.standings && <section id="cs-table" className="scroll-mt-16 mx-auto max-w-6xl px-6 pb-24"><h2 className="mb-6 text-3xl font-bold tracking-tight">{d.standingGroups[0].competition}</h2><StandingsTable rows={d.standings} showForm={false} label="League table" theme={{ th: 'border-b-2 border-gray-900 text-xs uppercase tracking-widest text-gray-500', tr: 'border-b border-gray-200', us: 'font-bold', points: 'font-bold' }} /></section>}

      {d.has.players && (
        <section id="cs-squad" className="scroll-mt-16 border-t border-gray-200 bg-gray-50 py-24"><div className="mx-auto max-w-6xl px-6"><h2 className="text-3xl font-bold tracking-tight">Squad</h2><ul className="mt-8 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">{d.players.map((p) => <li key={p.id} className="flex items-baseline gap-4 border-b border-gray-200 py-3"><span className="w-7 text-right text-sm font-semibold tabular-nums" style={{ color: acc }}>{p.number}</span><span className="font-medium">{p.name}</span><span className="ml-auto text-sm text-gray-500">{p.position}</span></li>)}</ul>
          {d.staff.length > 0 && <div className="mt-14"><h3 className={label}>Staff</h3><ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{d.staff.map((s) => <li key={s.id}><div className="font-semibold">{s.name}</div><div className="text-sm text-gray-500">{s.role}</div></li>)}</ul></div>}</div></section>
      )}

      {d.has.news && <section id="cs-news" className="scroll-mt-16 mx-auto max-w-6xl px-6 py-24"><h2 className="text-3xl font-bold tracking-tight">News</h2><div className="mt-8 grid gap-10 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id}><SmartImg src={n.image} seed={n.title} kind="pitch" palette="mono" alt="" className="aspect-[4/3] w-full object-cover" /><div className={`${label} mt-4`}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-2 text-xl font-semibold leading-snug">{n.title}</h3>{n.summary && <p className="mt-2 text-gray-600">{n.summary}</p>}</article>)}</div></section>}

      {d.has.history && <section className="border-t border-gray-200 py-24"><div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2"><div><h2 className="text-3xl font-bold tracking-tight">About the club</h2>{d.history && <p className="mt-5 text-lg leading-8 text-gray-600">{d.history}</p>}{(d.mission || d.vision) && <dl className="mt-6 space-y-4">{d.mission && <div><dt className={label}>Mission</dt><dd className="mt-1">{d.mission}</dd></div>}{d.vision && <div><dt className={label}>Vision</dt><dd className="mt-1">{d.vision}</dd></div>}</dl>}</div>{(d.timeline.length > 0 || d.clubAchievements.length > 0) && <ol className="divide-y divide-gray-200 border-y border-gray-200 self-start">{d.timeline.map((t) => <li key={t.year + t.title} className="flex gap-6 py-4"><b className="w-14 shrink-0" style={{ color: acc }}>{t.year}</b><span>{t.title}</span></li>)}{d.clubAchievements.map((a) => <li key={a} className="py-4">{a}</li>)}</ol>}</div></section>}

      {d.has.gallery && <section id="cs-gallery" className="scroll-mt-16 mx-auto max-w-6xl px-6 pb-24"><h2 className="mb-8 text-3xl font-bold tracking-tight">Gallery</h2><ul className="grid grid-cols-2 gap-4 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="mono" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Partners" className="border-y border-gray-200 py-10"><ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6">{d.sponsors.map((s) => <li key={s.id} className="text-lg font-semibold text-gray-400">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">{s.name}</a> : s.name}</li>)}</ul></section>}

      <section id="cs-contact" className="scroll-mt-16 mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <div><h2 className="text-3xl font-bold tracking-tight">Contact</h2><div className="mt-6 space-y-2">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline decoration-gray-300 underline-offset-4">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline decoration-gray-300 underline-offset-4">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-gray-900" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: ink }} cls={{ input: 'w-full border-b border-gray-300 bg-transparent px-0 py-3 text-base placeholder:text-gray-400 focus:border-gray-900 focus:outline-none', button: 'rounded-full px-8 py-3 text-sm font-semibold text-white', note: 'text-sm text-gray-600' }} />
      </section>
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
