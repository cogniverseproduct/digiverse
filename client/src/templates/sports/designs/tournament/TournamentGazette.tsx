import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtRange, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap';
const HEAD = '"Playfair Display", Georgia, serif';
const BODY = '"Libre Baskerville", Georgia, serif';

/** Tournament Gazette: sepia printed programme. Roman-numeral pages, drop caps, programme of play and results on ruled columns. */
export const TournamentGazette: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'paper', coverKind: 'pitch' }), [props]);
  const red = d.brand.accent || '#C21F3A';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const rule = 'border-[#2A2418]';
  const kick = 'text-[11px] font-bold uppercase tracking-[0.3em]';
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const pages = useMemo(() => ([
    ['Welcome', 'tg-welcome', true], ['Programme of play', 'tg-programme', d.has.fixtures], ['Results', 'tg-results', d.has.results], ['The tables', 'tg-tables', d.has.standings],
    ['The draw', 'tg-draw', d.has.bracket], ['Teams', 'tg-teams', d.has.teams], ['Grounds & rules', 'tg-info', d.has.venues || d.has.rules], ['Reports', 'tg-news', d.has.news], ['Correspondence', 'tg-contact', true]
  ] as [string, string, boolean][]).filter(([, , on]) => on), [d]);
  const pg = (id: string) => roman[pages.findIndex(([, i]) => i === id)] || '';
  const Page: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => <section id={id} className={`scroll-mt-4 border-t-4 border-double ${rule} py-10`}><div className="mb-6 flex items-baseline justify-between gap-4"><h2 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: HEAD }}>{title}</h2><span className={kick} style={{ color: red }}>Page {pg(id)}</span></div>{children}</section>;

  return (
    <div id="tg-top" className="sp-root min-h-screen bg-[#F3EBDA] text-[#2A2418]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <div className="mx-auto max-w-5xl px-5">
        <div className={`flex items-center justify-between border-b ${rule} py-2 text-[11px] uppercase tracking-widest`}><span>{t.edition || 'Official programme'}</span><span>{fmtRange(t.start, t.end)}</span></div>
        <header className="py-8 text-center">
          <img src={d.logo} alt="" className="mx-auto h-14 w-14 object-contain" />
          <button type="button" onClick={() => scrollToId('tg-top')} className="mt-3 block w-full text-5xl font-black leading-none sm:text-7xl" style={{ fontFamily: HEAD }}>{d.name}</button>
          {d.tagline && <p className="mt-3 text-lg italic">{d.tagline}</p>}
          <p className={`${kick} mt-3`} style={{ color: red }}>{[d.sport, t.location || d.location, d.founded ? `Founded ${d.founded}` : ''].filter(Boolean).join(' · ')}</p>
        </header>
        <nav aria-label="Pages" className={`border-y-2 ${rule}`}><ul className="sp-no-scrollbar flex min-w-0 justify-start gap-6 overflow-x-auto py-2.5 sm:justify-center">{pages.map(([l, id]) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] hover:underline">{pg(id)}. {l}</button></li>)}</ul></nav>

        <section id="tg-welcome" className="scroll-mt-4 grid gap-8 py-10 md:grid-cols-[1.5fr_1fr]">
          <div><SmartImg src={d.cover} seed={d.name} kind="pitch" palette="paper" alt="" loading="eager" className="aspect-[16/9] w-full object-cover grayscale-[40%]" />{d.description && <p className="mt-5 text-lg leading-8 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-black first-letter:leading-[0.8]" style={{ textAlign: 'justify' }}>{d.description}</p>}</div>
          <aside className={`border-l ${rule} pl-6`}><h3 className={kick} style={{ color: red }}>At a glance</h3><dl className="mt-3 space-y-3">{([['Dates', fmtRange(t.start, t.end)], ['Format', t.format], ['Match format', t.matchFormat], ['Teams', d.teams.length ? String(d.teams.length) : ''], ['Prizes', t.prizeInfo], ['Admission', t.ticketInfo]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l}><dt className="text-[11px] uppercase tracking-widest opacity-60">{l}</dt><dd className="text-base font-bold" style={{ fontFamily: HEAD }}>{v}</dd></div>)}</dl>{t.registrationInfo && <p className="mt-4 text-sm italic">{t.registrationInfo}</p>}</aside>
        </section>

        {d.has.fixtures && <Page id="tg-programme" title="Programme of play"><ul>{d.fixtures.map((f) => <li key={f.id} className={`grid gap-1 border-b ${rule}/25 py-3 sm:grid-cols-[10rem_1fr_auto] sm:gap-6`}><span className="text-sm font-bold" style={{ color: red }}>{fmtDay(f.date)} {fmtTime(f.date)}</span><span className="font-bold">{f.homeName} <i className="font-normal">versus</i> {f.awayName}</span><span className="text-xs italic opacity-65">{[f.round, f.venue].filter(Boolean).join(', ')}</span></li>)}</ul></Page>}
        {d.has.results && <Page id="tg-results" title="Results"><ul className="grid gap-x-10 md:grid-cols-2">{d.results.map((f) => <li key={f.id} className={`flex items-baseline justify-between gap-4 border-b ${rule}/25 py-3`}><span className="min-w-0"><b>{f.homeName}</b> <i>v</i> <b>{f.awayName}</b><span className="block text-xs italic opacity-60">{fmtDate(f.date, { day: 'numeric', month: 'long' })}{f.round ? `, ${f.round}` : ''}</span></span><span className="shrink-0 whitespace-nowrap text-2xl font-black" style={{ fontFamily: HEAD, color: red }}>{scoreText(f)}</span></li>)}</ul></Page>}
        {d.has.standings && <Page id="tg-tables" title="The tables"><div className="grid gap-8 md:grid-cols-2">{d.standingGroups.map((g) => <div key={g.competition}><h3 className={`border-b-2 ${rule} pb-1 ${kick}`}>{g.competition}</h3><StandingsTable rows={g.rows} compact showForm={false} label={g.competition} theme={{ th: 'text-[10px] uppercase tracking-widest', tr: `border-b ${rule}/20`, us: 'font-bold', points: 'font-black' }} /></div>)}</div></Page>}
        {d.has.bracket && <Page id="tg-draw" title="The draw"><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-xs font-bold uppercase tracking-[0.3em]', match: `border-2 ${rule} bg-white/50`, win: 'font-black', score: 'font-black' }} /></Page>}
        {d.has.teams && <Page id="tg-teams" title="The competing sides"><ul className="columns-2 gap-10 md:columns-3">{d.teams.map((x, i) => <li key={x.id} className={`break-inside-avoid border-b ${rule}/25 py-2`}><span className="mr-2 text-sm font-bold" style={{ color: red }}>{i + 1}.</span>{x.name}</li>)}</ul></Page>}
        {(d.has.venues || d.has.rules) && <Page id="tg-info" title="Grounds & regulations"><div className="grid gap-10 md:grid-cols-2">{d.has.venues && <div><h3 className={`border-b-2 ${rule} pb-1 ${kick}`}>Grounds</h3><ul className="mt-3 space-y-3">{d.venues.map((v) => <li key={v.id}><b style={{ fontFamily: HEAD }} className="text-lg">{v.name}</b>{v.address && <div><a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="text-sm underline">{v.address}</a></div>}{v.notes && <p className="text-sm italic opacity-75">{v.notes}</p>}</li>)}</ul></div>}{d.has.rules && <div><h3 className={`border-b-2 ${rule} pb-1 ${kick}`}>Regulations</h3><ol className="mt-3 list-decimal space-y-2 pl-5">{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></div>}</div></Page>}
        {d.has.news && <Page id="tg-news" title="Reports"><div className="grid gap-8 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id}><SmartImg src={n.image} seed={n.title} kind="pitch" palette="paper" alt="" className="aspect-[4/3] w-full object-cover grayscale-[50%]" /><div className={`${kick} mt-3`} style={{ color: red }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-xl font-black leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3>{n.summary && <p className="mt-1 text-sm opacity-80">{n.summary}</p>}</article>)}</div></Page>}
        {d.has.gallery && <section className={`border-t ${rule} py-8`}><ul className="grid grid-cols-3 gap-2 md:grid-cols-6">{d.photos.slice(0, 12).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className={`block w-full overflow-hidden border ${rule}/40`}><SmartImg src={p.src} seed={p.id} kind="pitch" palette="paper" alt={p.caption} className="aspect-square w-full object-cover grayscale transition hover:grayscale-0" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
        {d.has.sponsors && <section aria-label="Sponsors" className={`border-y ${rule} py-4 text-center text-sm italic`}><span className={`${kick} not-italic`}>With thanks to: </span>{d.sponsors.map((s) => s.name).join(' · ')}</section>}

        <section id="tg-contact" className={`scroll-mt-4 grid gap-8 border-t-4 border-double ${rule} py-10 md:grid-cols-2`}>
          <div><div className="flex items-baseline justify-between"><h2 className="text-3xl font-black" style={{ fontFamily: HEAD }}>Correspondence</h2><span className={kick} style={{ color: red }}>Page {pg('tg-contact')}</span></div><div className="mt-4 space-y-1">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass={`inline-flex items-center gap-2 border ${rule}/50 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white/60`} />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Entry', 'Press', 'General']} buttonStyle={{ background: red }} cls={{ input: 'w-full border border-[#2A2418]/50 bg-white/50 px-3 py-2.5 text-sm focus:border-[#2A2418] focus:outline-none', button: 'px-6 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-white', note: 'text-sm italic' }} />
        </section>
        <footer className={`border-t ${rule} py-5 text-center text-[11px] uppercase tracking-widest`}>© {new Date().getFullYear()} {d.name}</footer>
      </div>
    </div>
  );
};
