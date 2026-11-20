import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, ScheduleGrid, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap';
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Premier Academy: a premium private academy. Cream and navy with brass accents, split hero, programme tiers and an admissions block. */
export const PremierAcademy: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'paper', coverKind: 'pitch' }), [props]);
  const navy = d.brand.primary || '#0A1A4A';
  const brass = d.brand.accent || '#B8892B';
  const [lb, setLb] = useState<number | null>(null);
  const nav = ([d.has.about && ['Philosophy', 'pa-about'], d.has.programmes && ['Programmes', 'pa-programmes'], d.has.staff && ['Coaches', 'pa-coaches'], d.has.facilities && ['Facilities', 'pa-facilities'], d.has.batches && ['Schedule', 'pa-schedule'], d.has.admission && ['Admissions', 'pa-admissions'], ['Enquire', 'pa-contact']].filter(Boolean) as [string, string][]);
  const kick = 'text-[11px] font-semibold uppercase tracking-[0.3em]';
  const h2 = 'text-4xl font-semibold sm:text-5xl';

  return (
    <div id="pa-top" className="sp-root min-h-screen bg-[#FBF8F1] text-[#14213D]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b border-[#14213D]/10 bg-[#FBF8F1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <button type="button" onClick={() => scrollToId('pa-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-xl font-semibold" style={{ fontFamily: SERIF }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-6 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-[#14213D]/65 hover:text-[#14213D]">{l}</button>)}</nav>
        </div>
      </header>

      <section className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 lg:px-16 lg:py-28" style={{ background: navy, color: '#FBF8F1' }}>
          <SpReveal><p className={kick} style={{ color: brass }}>{[d.sport, d.location, d.founded ? `Est. ${d.founded}` : ''].filter(Boolean).join(' · ')}</p><h1 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl" style={{ fontFamily: SERIF }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">{d.description}</p>}<div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId('pa-contact')} className="px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1A4A]" style={{ background: brass }}>Book a trial</button>{d.has.programmes && <button type="button" onClick={() => scrollToId('pa-programmes')} className="border border-white/40 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white/10">View programmes</button>}</div></SpReveal>
        </div>
        <SmartImg src={d.cover} seed={d.name} kind="pitch" palette="paper" alt="" loading="eager" className="h-72 w-full object-cover lg:h-auto" />
      </section>

      {d.stats.length > 0 && <section className="border-b border-[#14213D]/10"><dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <div key={s.label} className="text-center"><dd className="text-5xl font-semibold" style={{ fontFamily: SERIF, color: brass }}>{s.value}</dd><dt className="mt-1 text-[11px] uppercase tracking-[0.25em] opacity-60">{s.label}</dt></div>)}</dl></section>}

      {d.has.about && (d.philosophy || d.mission || d.history) && <section id="pa-about" className="scroll-mt-16 mx-auto max-w-4xl px-6 py-24 text-center"><p className={kick} style={{ color: brass }}>Our philosophy</p><h2 className={`${h2} mt-3`} style={{ fontFamily: SERIF }}>{d.philosophy || d.mission}</h2>{d.history && <p className="mt-6 text-lg leading-8 opacity-80">{d.history}</p>}{d.values.length > 0 && <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm uppercase tracking-[0.2em]" style={{ color: brass }}>{d.values.map((v) => <li key={v}>{v}</li>)}</ul>}</section>}

      {d.has.programmes && (
        <section id="pa-programmes" className="scroll-mt-16 bg-white py-24"><div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center"><p className={kick} style={{ color: brass }}>Pathways</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Programmes</h2></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{d.programmes.map((p, i) => <SpReveal key={p.id} delay={i * 70} className="flex flex-col border border-[#14213D]/15 p-8"><div className={kick} style={{ color: brass }}>{[p.ageGroup, p.duration].filter(Boolean).join(' · ')}</div><h3 className="mt-3 text-3xl font-semibold" style={{ fontFamily: SERIF }}>{p.title}</h3><p className="mt-3 text-sm leading-6 opacity-75">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-5 space-y-2 text-sm">{p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brass }} />{h}</li>)}</ul>}{(p.fee || p.coach) && <div className="mt-auto border-t border-[#14213D]/10 pt-4 text-sm">{p.fee && <div className="font-semibold">{p.fee}</div>}{p.coach && <div className="opacity-65">Led by {p.coach}</div>}</div>}</SpReveal>)}</div>
        </div></section>
      )}

      {d.has.staff && <section id="pa-coaches" className="scroll-mt-16 mx-auto max-w-7xl px-6 py-24"><div className="mb-12 text-center"><p className={kick} style={{ color: brass }}>The team</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Our coaches</h2></div><ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{d.staff.map((s) => <li key={s.id} className="text-center"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="paper" alt={s.name} className="mx-auto aspect-square w-full max-w-[14rem] object-cover" /><h3 className="mt-4 text-2xl font-semibold" style={{ fontFamily: SERIF }}>{s.name}</h3><p className="text-xs uppercase tracking-[0.2em]" style={{ color: brass }}>{s.role}</p>{s.qualifications.length > 0 && <p className="mt-2 text-sm opacity-65">{s.qualifications.join(' · ')}</p>}</li>)}</ul></section>}

      {d.has.facilities && <section id="pa-facilities" className="scroll-mt-16 py-24 text-[#FBF8F1]" style={{ background: navy }}><div className="mx-auto max-w-7xl px-6"><div className="mb-12 text-center"><p className={kick} style={{ color: brass }}>Where we train</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Facilities</h2></div><div className="grid gap-6 md:grid-cols-3">{d.facilities.map((f) => <div key={f.id}><SmartImg src={f.image} seed={f.name} kind="stadium" palette="royal" alt="" className="aspect-[4/3] w-full object-cover" /><h3 className="mt-4 text-2xl font-semibold" style={{ fontFamily: SERIF }}>{f.name}</h3>{f.description && <p className="mt-1 text-sm text-white/70">{f.description}</p>}</div>)}</div></div></section>}

      {d.has.batches && <section id="pa-schedule" className="scroll-mt-16 mx-auto max-w-7xl px-6 py-24"><div className="mb-10 text-center"><p className={kick} style={{ color: brass }}>Week at a glance</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Training schedule</h2></div><ScheduleGrid batches={d.batches} theme={{ th: 'border-b-2 border-[#14213D] text-xs uppercase tracking-[0.2em]', cell: 'border-l-2 bg-white p-3 shadow-sm', name: 'text-[#14213D]' }} /></section>}

      {d.has.admission && <section id="pa-admissions" className="scroll-mt-16 bg-white py-24"><div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.2fr]"><div><p className={kick} style={{ color: brass }}>Joining us</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Admissions</h2>{d.admission.intakeDates && <p className="mt-4 text-lg"><b>Intake:</b> {d.admission.intakeDates}</p>}{d.admission.feeSummary && <p className="mt-2 text-lg"><b>Fees:</b> {d.admission.feeSummary}</p>}</div><dl className="space-y-6">{([['How to apply', d.admission.process], ['Who can join', d.admission.eligibility], ['Trials', d.admission.trialInfo]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l} className="border-l-2 pl-5" style={{ borderColor: brass }}><dt className={kick} style={{ color: brass }}>{l}</dt><dd className="mt-1 leading-7">{v}</dd></div>)}{d.admission.documents.length > 0 && <div className="border-l-2 pl-5" style={{ borderColor: brass }}><dt className={kick} style={{ color: brass }}>Documents</dt><dd className="mt-1"><ul className="list-disc pl-5">{d.admission.documents.map((x) => <li key={x}>{x}</li>)}</ul></dd></div>}</dl></div></section>}

      {d.has.achievements && <section className="mx-auto max-w-5xl px-6 py-24"><h2 className={`${h2} mb-8 text-center`} style={{ fontFamily: SERIF }}>Achievements</h2><ul className="divide-y divide-[#14213D]/15 border-y border-[#14213D]/15">{d.achievements.map((a) => <li key={a.id} className="flex gap-6 py-4"><b className="w-16 shrink-0 text-2xl" style={{ fontFamily: SERIF, color: brass }}>{a.year}</b><div><div className="font-semibold">{a.title}</div>{a.description && <div className="text-sm opacity-70">{a.description}</div>}</div></li>)}</ul></section>}
      {d.has.testimonials && <section className="py-20 text-[#FBF8F1]" style={{ background: navy }}><div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">{d.testimonials.slice(0, 2).map((q) => <figure key={q.id}><blockquote className="text-2xl italic leading-9" style={{ fontFamily: SERIF }}>“{q.quote}”</blockquote><figcaption className="mt-4 text-xs uppercase tracking-[0.25em]" style={{ color: brass }}>{q.author}{q.role ? `, ${q.role}` : ''}</figcaption></figure>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-6 py-24"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="paper" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-7xl px-6 pb-24"><h2 className={`${h2} mb-8 text-center`} style={{ fontFamily: SERIF }}>Academy news</h2><div className="grid gap-8 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id}><SmartImg src={n.image} seed={n.title} kind="pitch" palette="paper" alt="" className="aspect-[4/3] w-full object-cover" /><div className={`${kick} mt-3`} style={{ color: brass }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-2xl font-semibold leading-snug" style={{ fontFamily: SERIF }}>{n.title}</h3></article>)}</div></section>}

      <section id="pa-contact" className="scroll-mt-16 py-24 text-[#FBF8F1]" style={{ background: navy }}><div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
        <div><p className={kick} style={{ color: brass }}>Get started</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Book a trial or ask a question</h2><div className="mt-6 space-y-2 text-white/85">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Book a trial', 'Programme information', 'Fees and admissions', 'Other']} withPhone buttonStyle={{ background: brass }} cls={{ input: 'w-full border border-white/25 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none', button: 'px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A1A4A]', note: 'text-sm text-white/80' }} />
      </div></section>
      <footer className="py-6 text-center text-xs uppercase tracking-[0.25em] opacity-55">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
