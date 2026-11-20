import React, { useMemo, useState } from 'react';
import { CalendarDays, HeartHandshake, MapPin, Users } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
const SANS = 'Poppins, system-ui, sans-serif';

/** Community Pitch: friendly grassroots club. Warm colours, rounded cards, join-us call to action, volunteers and events. */
export const CommunityPitch: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'sunrise', coverKind: 'pitch' }), [props]);
  const orange = d.brand.accent || '#F97316';
  const green = d.brand.primary || '#15803D';
  const [lb, setLb] = useState<number | null>(null);
  const nav = ([d.has.about && ['About', 'cp-about'], (d.has.fixtures || d.has.results) && ['Matches', 'cp-matches'], d.has.teams && ['Our teams', 'cp-teams'], d.has.news && ['News', 'cp-news'], d.has.gallery && ['Photos', 'cp-photos'], ['Join us', 'cp-join']].filter(Boolean) as [string, string][]);
  const card = 'rounded-3xl bg-white shadow-sm ring-1 ring-black/5';

  return (
    <div id="cp-top" className="sp-root min-h-screen bg-[#FFF8EE] text-[#2B2118]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 bg-[#FFF8EE]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('cp-top')} className="flex items-center gap-2.5 font-bold"><img src={d.logo} alt="" className="h-10 w-10 rounded-full object-contain" /><span className="text-lg">{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar hidden min-w-0 gap-1 overflow-x-auto md:flex">{nav.filter(([, id]) => id !== 'cp-join').map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium hover:bg-black/5">{l}</button>)}</nav>
          <button type="button" onClick={() => scrollToId('cp-join')} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow" style={{ background: orange }}>Join us</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <SpReveal>
          <p className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold" style={{ background: `${green}1A`, color: green }}><Users className="h-4 w-4" />{[d.sport, d.location].filter(Boolean).join(' · ') || 'Everyone welcome'}</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] sm:text-6xl">{d.tagline || `Welcome to ${d.name}`}</h1>
          {d.description && <p className="mt-5 max-w-lg text-lg leading-8 text-[#5C4B3B]">{d.description}</p>}
          <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId('cp-join')} className="rounded-full px-7 py-3.5 font-semibold text-white shadow-lg" style={{ background: orange }}>Come and play</button>{(d.has.fixtures || d.has.results) && <button type="button" onClick={() => scrollToId('cp-matches')} className="rounded-full border-2 border-[#2B2118]/20 px-7 py-3.5 font-semibold hover:bg-white">See matches</button>}</div>
        </SpReveal>
        <SpReveal from="scale" delay={120}><div className="relative"><SmartImg src={d.cover} seed={d.name} kind="pitch" palette="sunrise" alt="" loading="eager" className="aspect-[4/3] w-full rounded-[2.5rem] object-cover shadow-xl" /><div className="absolute -bottom-5 -left-3 rounded-2xl bg-white px-5 py-3 shadow-lg sm:-left-6"><div className="text-xs font-medium text-[#8A7660]">{d.founded ? 'Playing together since' : 'Open to all'}</div><div className="text-2xl font-extrabold" style={{ color: green }}>{d.founded || (d.teams.length ? `${d.teams.length} teams` : 'Join in')}</div></div></div></SpReveal>
      </section>

      {d.stats.length > 0 && <section className="mx-auto max-w-6xl px-5"><dl className="grid grid-cols-2 gap-4 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <div key={s.label} className={`${card} p-5 text-center`}><dd className="text-4xl font-extrabold" style={{ color: green }}>{s.value}</dd><dt className="mt-1 text-sm text-[#5C4B3B]">{s.label}</dt></div>)}</dl></section>}

      {d.has.about && (d.mission || d.history || d.values.length > 0) && (
        <section id="cp-about" className="scroll-mt-16 mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-3">
          <div className={`${card} p-7 md:col-span-2`}><h2 className="text-3xl font-extrabold">Who we are</h2>{d.history && <p className="mt-4 leading-7 text-[#5C4B3B]">{d.history}</p>}{d.mission && <p className="mt-4 leading-7"><b>Our mission:</b> {d.mission}</p>}</div>
          {d.values.length > 0 && <div className="rounded-3xl p-7 text-white" style={{ background: green }}><HeartHandshake className="h-8 w-8" /><h3 className="mt-3 text-xl font-bold">What we value</h3><ul className="mt-3 space-y-2">{d.values.map((v) => <li key={v}>· {v}</li>)}</ul></div>}
        </section>
      )}

      {(d.has.fixtures || d.has.results) && (
        <section id="cp-matches" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20">
          <h2 className="mb-6 text-3xl font-extrabold">Matches & events</h2>
          <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
            {d.fixtures.slice(0, 4).map((f) => <article key={f.id} className={`${card} flex items-center gap-4 p-5`}><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ background: orange }}><span className="text-xl font-extrabold leading-none">{f.date?.getDate()}</span><span className="text-[11px] uppercase">{fmtDate(f.date, { month: 'short' })}</span></div><div className="min-w-0"><div className="font-semibold">{f.homeName} v {f.awayName}</div><div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-[#5C4B3B]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDay(f.date)} {fmtTime(f.date)}</span>{f.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{f.venue}</span>}</div></div></article>)}
            {d.results.slice(0, 4).map((f) => <article key={f.id} className={`${card} flex items-center justify-between gap-4 p-5`}><div className="min-w-0"><div className="truncate font-semibold">{f.homeName} v {f.awayName}</div><div className="text-sm text-[#5C4B3B]">{fmtDate(f.date)}{f.competition ? ` · ${f.competition}` : ''}</div></div><div className="shrink-0 whitespace-nowrap rounded-2xl bg-[#FFF1DC] px-4 py-2 text-xl font-extrabold tabular-nums" style={{ color: green }}>{scoreText(f)}</div></article>)}
          </div>
        </section>
      )}

      {d.has.teams && <section id="cp-teams" className="scroll-mt-16 py-20" style={{ background: `${green}12` }}><div className="mx-auto max-w-6xl px-5"><h2 className="mb-6 text-3xl font-extrabold">Our teams</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{d.teams.map((t) => <div key={t.id} className={`${card} p-6`}><h3 className="text-xl font-bold">{t.name}</h3><p className="mt-1 text-sm text-[#5C4B3B]">{[t.sport, t.ageGroup, t.gender].filter(Boolean).join(' · ')}</p>{t.description && <p className="mt-3 text-sm">{t.description}</p>}</div>)}</div></div></section>}

      {d.has.news && <section id="cp-news" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20"><h2 className="mb-6 text-3xl font-extrabold">Club news</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 80} className={`${card} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="pitch" palette="sunrise" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-xs font-semibold uppercase tracking-wide" style={{ color: orange }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-1 text-lg font-bold leading-snug">{n.title}</h3>{n.summary && <p className="mt-2 text-sm text-[#5C4B3B]">{n.summary}</p>}</div></SpReveal>)}</div></section>}

      {d.has.gallery && <section id="cp-photos" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20"><h2 className="mb-6 text-3xl font-extrabold">Photos</h2><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-3xl"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="sunrise" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Supporters" className="mx-auto max-w-6xl px-5 pb-20 text-center"><h2 className="text-lg font-bold">Thank you to our supporters</h2><ul className="mt-4 flex flex-wrap justify-center gap-3">{d.sponsors.map((s) => <li key={s.id} className="rounded-full bg-white px-5 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name}</li>)}</ul></section>}

      <section id="cp-join" className="scroll-mt-16 px-5 pb-20"><div className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] p-8 text-white md:p-14 lg:grid-cols-2" style={{ background: green }}>
        <div><h2 className="text-4xl font-extrabold">Come and join in</h2><p className="mt-3 text-white/85">Players, volunteers, parents and supporters are all welcome. Drop us a line.</p><div className="mt-6 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['I want to play', 'I want to volunteer', 'Sponsorship', 'Something else']} buttonStyle={{ background: orange }} cls={{ input: 'w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-[#2B2118] placeholder:text-[#8A7660] focus:outline-none focus:ring-2 focus:ring-white', button: 'rounded-full px-8 py-3 text-sm font-semibold text-white', note: 'text-sm text-white' }} />
      </div></section>
      <footer className="pb-8 text-center text-sm text-[#8A7660]">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
