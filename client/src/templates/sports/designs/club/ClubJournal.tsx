import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,500&family=Source+Serif+4:wght@400;600&display=swap';
const HEAD = 'Fraunces, Georgia, serif';
const BODY = '"Source Serif 4", Georgia, serif';

/** The Club Journal: a newspaper front page. Dated masthead, lead story with a fixtures column, ruled tables, team sheets. */
export const ClubJournal: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'paper', coverKind: 'pitch' }), [props]);
  const red = d.brand.accent || '#C21F3A';
  const [lb, setLb] = useState<number | null>(null);
  const lead = d.news[0];
  const rest = d.news.slice(1, 4);
  const rule = 'border-[#2A2418]';
  const kick = 'text-[11px] font-bold uppercase tracking-[0.25em]';
  const nav = ([d.has.news && ['News', 'cj-news'], d.has.standings && ['Table', 'cj-table'], d.has.players && ['Teams', 'cj-teams'], d.has.history && ['History', 'cj-history'], d.has.gallery && ['Photographs', 'cj-photos'], ['Contact', 'cj-contact']].filter(Boolean) as [string, string][]);
  const today = fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="cj-top" className="sp-root min-h-screen bg-[#F5F1E8] text-[#2A2418]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <div className="mx-auto max-w-6xl px-5">
        <div className={`flex items-center justify-between border-b ${rule} py-2 text-[11px] uppercase tracking-widest`}><span>{today}</span><span className="hidden sm:inline">{[d.location, d.founded ? `Est. ${d.founded}` : ''].filter(Boolean).join(' · ')}</span></div>
        <header className={`border-b-4 border-double ${rule} py-6 text-center`}>
          <button type="button" onClick={() => scrollToId('cj-top')} className="text-5xl font-black leading-none sm:text-7xl" style={{ fontFamily: HEAD }}>The {d.name} Journal</button>
          {d.tagline && <p className="mt-2 text-sm italic">{d.tagline}</p>}
        </header>
        <nav aria-label="Sections" className={`border-b ${rule}`}><ul className="sp-no-scrollbar flex justify-start gap-6 overflow-x-auto py-2.5 sm:justify-center">{nav.map(([l, id]) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.25em] hover:underline" style={{ textDecorationColor: red }}>{l}</button></li>)}</ul></nav>

        {/* Front page */}
        <section id="cj-news" className="scroll-mt-4 grid gap-8 py-10 lg:grid-cols-[2fr_1fr] lg:gap-0">
          <div className={`lg:border-r ${rule} lg:pr-8`}>
            {lead ? <article><div className={kick} style={{ color: red }}>{lead.category || 'Lead story'}</div><h2 className="mt-2 text-4xl font-black leading-[1.05] sm:text-6xl" style={{ fontFamily: HEAD }}>{lead.title}</h2><p className="mt-3 text-lg italic opacity-80">{lead.summary}</p><SmartImg src={lead.image || d.cover} seed={lead.title} kind="pitch" palette="paper" alt="" loading="eager" className="mt-5 aspect-[16/9] w-full object-cover grayscale-[40%]" /><p className="mt-5 first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8]" style={{ columnCount: 1 }}>{lead.content || d.description}</p></article>
              : <article><div className={kick} style={{ color: red }}>Welcome</div><h2 className="mt-2 text-4xl font-black leading-[1.05] sm:text-6xl" style={{ fontFamily: HEAD }}>{d.name}</h2><SmartImg src={d.cover} seed={d.name} kind="pitch" palette="paper" alt="" loading="eager" className="mt-5 aspect-[16/9] w-full object-cover" /><p className="mt-5 text-lg">{d.description}</p></article>}
            {rest.length > 0 && <div className={`mt-8 grid gap-6 border-t ${rule} pt-6 sm:grid-cols-3`}>{rest.map((n) => <article key={n.id}><div className={kick} style={{ color: red }}>{n.category}</div><h3 className="mt-1 text-xl font-bold leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3>{n.summary && <p className="mt-1 text-sm opacity-75">{n.summary}</p>}<div className="mt-1 text-[11px] uppercase tracking-widest opacity-50">{fmtDate(n.date)}</div></article>)}</div>}
          </div>
          <aside className="lg:pl-8">
            {(d.has.fixtures || d.has.results) && <div><h3 className={`border-b-2 ${rule} pb-1 ${kick}`}>Fixtures</h3><ul>{d.fixtures.slice(0, 4).map((f) => <li key={f.id} className={`border-b ${rule}/30 py-3 text-sm`}><b>{f.homeName} v {f.awayName}</b><div className="text-xs opacity-60">{fmtDate(f.date, { weekday: 'short', day: 'numeric', month: 'short' })} {fmtTime(f.date)}{f.venue ? ` · ${f.venue}` : ''}</div></li>)}</ul>
              <h3 className={`mt-8 border-b-2 ${rule} pb-1 ${kick}`}>Results</h3><ul>{d.results.slice(0, 4).map((f) => <li key={f.id} className={`flex items-baseline justify-between gap-3 border-b ${rule}/30 py-2.5 text-sm`}><span>{f.homeName} <b style={{ color: red }}>{scoreText(f)}</b> {f.awayName}</span></li>)}</ul></div>}
            {d.has.about && <p className="mt-8 border-t-4 border-double pt-4 text-sm italic leading-6" style={{ borderColor: '#2A2418' }}>{d.description}</p>}
          </aside>
        </section>

        {d.has.standings && <section id="cj-table" className={`scroll-mt-4 border-t-4 border-double ${rule} py-10`}><h2 className="mb-4 text-3xl font-black" style={{ fontFamily: HEAD }}>{d.standingGroups[0].competition}: the table</h2><StandingsTable rows={d.standings} showForm={false} label="League table" theme={{ th: `border-y-2 ${rule} text-[11px] uppercase tracking-widest`, tr: `border-b ${rule}/20`, us: 'font-bold', points: 'font-black' }} /></section>}

        {d.has.players && <section id="cj-teams" className={`scroll-mt-4 border-t-4 border-double ${rule} py-10`}><h2 className="mb-6 text-3xl font-black" style={{ fontFamily: HEAD }}>Team sheets</h2><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{(d.teams.length ? d.teams : [{ id: '', name: 'Squad' }]).map((t) => { const list = d.players.filter((p) => !t.id || p.teamId === t.id); return list.length ? <div key={t.id}><h3 className={`border-b-2 ${rule} pb-1 ${kick}`}>{t.name}</h3><ol className="mt-2">{list.map((p) => <li key={p.id} className={`flex items-baseline gap-2 border-b ${rule}/20 py-1.5 text-sm`}><span className="w-6 text-right font-bold" style={{ color: red }}>{p.number}</span><span>{p.name}</span><span className="ml-auto text-xs italic opacity-55">{p.position}</span></li>)}</ol></div> : null; })}</div></section>}

        {d.has.history && <section id="cj-history" className={`scroll-mt-4 border-t-4 border-double ${rule} py-10`}><h2 className="mb-5 text-3xl font-black" style={{ fontFamily: HEAD }}>From the archive</h2><div className="grid gap-8 md:grid-cols-[1.4fr_1fr]"><div className="text-lg leading-8 md:columns-2 md:gap-8">{d.history}{d.mission && <p className="mt-4"><b>Mission.</b> {d.mission}</p>}</div><ol className={`border-l ${rule} pl-5`}>{d.timeline.map((t) => <li key={t.year + t.title} className="mb-3"><b className="text-xl" style={{ fontFamily: HEAD, color: red }}>{t.year}</b> <span>{t.title}</span></li>)}{d.clubAchievements.map((a) => <li key={a} className="mb-1 text-sm italic">★ {a}</li>)}</ol></div></section>}

        {d.has.gallery && <section id="cj-photos" className={`scroll-mt-4 border-t-4 border-double ${rule} py-10`}><h2 className="mb-5 text-3xl font-black" style={{ fontFamily: HEAD }}>Photographs</h2><ul className="grid grid-cols-3 gap-2 md:grid-cols-6">{d.photos.slice(0, 12).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden border border-[#2A2418]/40"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="paper" alt={p.caption} className="aspect-square w-full object-cover grayscale transition hover:grayscale-0" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}

        {d.has.sponsors && <section aria-label="Advertisers" className={`border-t ${rule} py-5 text-center`}><span className={kick}>Advertisements: </span>{d.sponsors.map((s, i) => <span key={s.id} className="text-sm italic">{i ? ' · ' : ''}{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.name}</a> : s.name}</span>)}</section>}

        <section id="cj-contact" className={`scroll-mt-4 grid gap-8 border-t-4 border-double ${rule} py-10 md:grid-cols-2`}>
          <div><h2 className="text-3xl font-black" style={{ fontFamily: HEAD }}>Letters to the editor</h2><p className="mt-2 text-sm italic opacity-75">Write to the club, or visit us.</p><div className="mt-4 space-y-1">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass="inline-flex items-center gap-2 border border-[#2A2418]/50 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: red }} cls={{ input: 'w-full border border-[#2A2418]/50 bg-white/50 px-3 py-2.5 text-sm focus:border-[#2A2418] focus:outline-none', button: 'px-6 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-white', note: 'text-sm italic' }} />
        </section>
        <SpReveal as="footer" className={`border-t ${rule} py-5 text-center text-[11px] uppercase tracking-widest`}>© {new Date().getFullYear()} {d.name}</SpReveal>
      </div>
    </div>
  );
};
