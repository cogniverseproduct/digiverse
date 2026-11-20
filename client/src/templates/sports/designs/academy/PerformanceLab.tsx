import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, ScheduleGrid, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap';
const HEAD = '"Chakra Petch", system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Performance Lab: athletic training. Near-black, electric blue, tiled programmes and a matrix schedule; reads like a training dashboard. */
export const PerformanceLab: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'night', coverKind: 'track' }), [props]);
  const blue = d.brand.accent || '#3A6BFF';
  const [lb, setLb] = useState<number | null>(null);
  const tile = 'border border-white/10 bg-white/[0.04]';
  const lab = 'text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50';
  const nav = ([d.has.programmes && ['Programmes', 'pl-programmes'], d.has.batches && ['Schedule', 'pl-schedule'], d.has.staff && ['Coaches', 'pl-coaches'], d.has.facilities && ['Facilities', 'pl-facilities'], d.has.admission && ['Apply', 'pl-apply'], ['Contact', 'pl-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="pl-top" className="sp-root min-h-screen bg-[#050A18] text-[#E8EEFF]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050A18]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('pl-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-8 w-8 object-contain" /><span className="text-lg font-bold uppercase tracking-wider" style={{ fontFamily: HEAD }}>{d.shortName}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-white/65 hover:text-white" style={{ fontFamily: HEAD }}>{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="track" palette="night" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `radial-gradient(70% 60% at 80% 20%, ${blue}44, transparent 70%), linear-gradient(180deg, transparent 40%, #050A18)` }} />
        <div className="mx-auto max-w-7xl px-5 py-24 md:py-36">
          <SpReveal><p className={lab} style={{ color: blue }}>{[d.sport, d.location].filter(Boolean).join(' / ') || 'Athletic performance'}</p><h1 className="mt-4 max-w-4xl text-5xl font-bold uppercase leading-[1] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 max-w-xl text-lg text-white/70">{d.description}</p>}<button type="button" onClick={() => scrollToId('pl-contact')} className="mt-8 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white" style={{ background: blue, fontFamily: HEAD }}>Book an assessment</button></SpReveal>
          {d.stats.length > 0 && <dl className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <div key={s.label} className="bg-[#050A18] p-5"><dd className="text-4xl font-bold tabular-nums" style={{ fontFamily: HEAD, color: blue }}>{s.value}</dd><dt className={`${lab} mt-1`}>{s.label}</dt></div>)}</dl>}
        </div>
      </section>

      {d.has.programmes && <section id="pl-programmes" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Programmes</h2><div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{d.programmes.map((p, i) => <SpReveal key={p.id} delay={i * 50} className="border border-white/10 bg-[#050A18] p-7"><div className="flex items-center justify-between"><span className={lab}>{String(i + 1).padStart(2, '0')}</span><span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: blue }}>{p.ageGroup}</span></div><h3 className="mt-4 text-2xl font-bold uppercase" style={{ fontFamily: HEAD }}>{p.title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-4 space-y-1 text-sm">{p.highlights.map((h) => <li key={h} className="flex gap-2"><span style={{ color: blue }}>+</span>{h}</li>)}</ul>}<div className="mt-5 border-t border-white/10 pt-3 text-xs uppercase tracking-widest text-white/50">{[p.duration, p.fee].filter(Boolean).join(' · ')}</div></SpReveal>)}</div></section>}

      {d.has.batches && <section id="pl-schedule" className="scroll-mt-16 border-y border-white/10 bg-white/[0.02] py-20"><div className="mx-auto max-w-7xl px-5"><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Training matrix</h2><div className="mt-8"><ScheduleGrid batches={d.batches} theme={{ th: 'border-b border-white/20 text-[11px] uppercase tracking-[0.3em] text-white/50', cell: 'border border-white/10 border-l-2 bg-white/[0.04] p-3', name: 'text-white', time: 'text-white/55' }} /></div></div></section>}

      {d.has.staff && <section id="pl-coaches" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Performance team</h2><ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{d.staff.map((s) => <li key={s.id} className="border border-white/10 bg-[#050A18] p-5"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="night" alt={s.name} className="aspect-square w-full object-cover grayscale transition duration-500 hover:grayscale-0" /><h3 className="mt-4 text-xl font-bold uppercase" style={{ fontFamily: HEAD }}>{s.name}</h3><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: blue }}>{s.role}</p>{s.qualifications.length > 0 && <p className="mt-2 text-xs text-white/55">{s.qualifications.join(' · ')}</p>}</li>)}</ul></section>}

      {d.has.facilities && <section id="pl-facilities" className="scroll-mt-16 border-y border-white/10 bg-white/[0.02] py-20"><div className="mx-auto max-w-7xl px-5"><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Facilities</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{d.facilities.map((f) => <div key={f.id} className={tile}><SmartImg src={f.image} seed={f.name} kind="track" palette="night" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><h3 className="text-xl font-bold uppercase" style={{ fontFamily: HEAD }}>{f.name}</h3>{f.description && <p className="mt-1 text-sm text-white/65">{f.description}</p>}</div></div>)}</div></div></section>}

      {d.has.admission && <section id="pl-apply" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Apply</h2><dl className="mt-10 grid gap-3 md:grid-cols-3">{([['Process', d.admission.process], ['Eligibility', d.admission.eligibility], ['Assessment', d.admission.trialInfo], ['Fees', d.admission.feeSummary], ['Intake', d.admission.intakeDates]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l} className="border border-white/10 bg-[#050A18] p-6"><dt className={lab} style={{ color: blue }}>{l}</dt><dd className="mt-2 text-white/85">{v}</dd></div>)}</dl></section>}

      {d.has.achievements && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className="text-3xl font-bold uppercase" style={{ fontFamily: HEAD }}>Results</h2><ul className="mt-6 grid gap-3 md:grid-cols-2">{d.achievements.map((a) => <li key={a.id} className="flex items-baseline gap-4 border border-white/10 bg-[#050A18] p-5"><b className="text-2xl tabular-nums" style={{ fontFamily: HEAD, color: blue }}>{a.year}</b><span>{a.title}</span></li>)}</ul></section>}
      {d.has.testimonials && <section className="mx-auto max-w-7xl px-5 pb-20"><div className="grid gap-5 md:grid-cols-2">{d.testimonials.slice(0, 2).map((q) => <figure key={q.id} className={`${tile} p-7`}><blockquote className="text-lg leading-8">“{q.quote}”</blockquote><figcaption className={`${lab} mt-4`}>{q.author}{q.role ? ` · ${q.role}` : ''}</figcaption></figure>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="track" palette="night" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-110" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className="text-3xl font-bold uppercase" style={{ fontFamily: HEAD }}>Lab notes</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className={`${tile} overflow-hidden`}><SmartImg src={n.image} seed={n.title} kind="track" palette="night" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className={lab}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-bold leading-snug">{n.title}</h3></div></article>)}</div></section>}

      <section id="pl-contact" className="scroll-mt-16 border-t border-white/10 py-20"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div><h2 className="text-4xl font-bold uppercase sm:text-5xl" style={{ fontFamily: HEAD }}>Start here</h2><div className="mt-6 space-y-1.5 text-white/80">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Book an assessment', 'Programme question', 'Fees', 'Other']} withPhone buttonStyle={{ background: blue }} cls={{ input: 'w-full border border-white/20 bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/50 focus:outline-none', button: 'px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white', note: 'text-sm text-white/70' }} />
      </div></section>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
