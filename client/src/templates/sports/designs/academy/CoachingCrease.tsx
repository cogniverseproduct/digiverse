import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, ScheduleGrid, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@300;400;500;600&display=swap';
const SERIF = '"Libre Baskerville", Georgia, serif';
const SANS = '"Work Sans", system-ui, sans-serif';

/** Coaching Crease: a cricket coaching school. Warm cream, bottle green and clay, coach profile cards and a weekly net-session schedule. */
export const CoachingCrease: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'clay', coverKind: 'cricket' }), [props]);
  const green = d.brand.primary || '#14532D';
  const clay = d.brand.accent || '#C9632B';
  const [lb, setLb] = useState<number | null>(null);
  const nav = ([d.has.about && ['About', 'cc-about'], d.has.programmes && ['Courses', 'cc-courses'], d.has.staff && ['Coaches', 'cc-coaches'], d.has.batches && ['Net sessions', 'cc-nets'], d.has.facilities && ['Facilities', 'cc-facilities'], d.has.admission && ['Enrol', 'cc-enrol'], ['Contact', 'cc-contact']].filter(Boolean) as [string, string][]);
  const kick = 'text-[11px] font-semibold uppercase tracking-[0.28em]';
  const h2 = 'text-3xl font-bold sm:text-4xl';

  return (
    <div id="cc-top" className="sp-root min-h-screen bg-[#FAF6EC] text-[#2A2418]" style={{ fontFamily: SANS, fontWeight: 300 }}>
      <DemoBadge show={d.isDemo} />
      <header className="border-b border-[#2A2418]/10 bg-[#FAF6EC]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 pt-6 text-center">
          <img src={d.logo} alt="" className="h-14 w-14 object-contain" />
          <button type="button" onClick={() => scrollToId('cc-top')} className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: SERIF }}>{d.name}</button>
          <p className={kick} style={{ color: clay }}>{[d.sport, d.location].filter(Boolean).join(' · ')}</p>
        </div>
        <nav aria-label="Sections"><ul className="sp-no-scrollbar mx-auto flex min-w-0 max-w-6xl justify-start gap-6 overflow-x-auto px-5 sm:justify-center">{nav.map(([l, id]) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap py-3 text-xs font-medium uppercase tracking-[0.2em] text-[#2A2418]/70 hover:text-[#2A2418]">{l}</button></li>)}</ul></nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <SpReveal><h1 className="text-4xl font-bold leading-[1.15] sm:text-6xl" style={{ fontFamily: SERIF }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 text-lg leading-8 text-[#2A2418]/80">{d.description}</p>}<div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId('cc-contact')} className="px-7 py-3 text-sm font-semibold text-white" style={{ background: clay }}>Book a net session</button>{d.has.programmes && <button type="button" onClick={() => scrollToId('cc-courses')} className="border px-7 py-3 text-sm font-semibold" style={{ borderColor: green, color: green }}>See courses</button>}</div></SpReveal>
        <SpReveal from="scale" delay={100}><SmartImg src={d.cover} seed={d.name} kind="cricket" palette="clay" alt="" loading="eager" className="aspect-[4/3] w-full rounded-t-[8rem] object-cover" /></SpReveal>
      </section>

      {d.has.about && (d.philosophy || d.mission || d.history) && <section id="cc-about" className="scroll-mt-4 py-16 text-[#FAF6EC]" style={{ background: green }}><div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.4fr]"><div><p className={kick} style={{ color: '#F3C69B' }}>Our approach</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Coaching with patience</h2></div><div className="space-y-4 text-lg leading-8 text-white/85">{d.philosophy && <p>{d.philosophy}</p>}{d.history && <p>{d.history}</p>}{d.values.length > 0 && <ul className="flex flex-wrap gap-2 pt-2">{d.values.map((v) => <li key={v} className="border border-white/30 px-3 py-1 text-xs uppercase tracking-widest">{v}</li>)}</ul>}</div></div></section>}

      {d.has.programmes && <section id="cc-courses" className="scroll-mt-4 mx-auto max-w-6xl px-5 py-20"><p className={kick} style={{ color: clay }}>What we teach</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Courses</h2><div className="mt-10 grid gap-6 md:grid-cols-2">{d.programmes.map((p, i) => <SpReveal key={p.id} delay={i * 60} className="border-l-4 bg-white p-7 shadow-sm" style={{ borderColor: clay }}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-2xl font-bold" style={{ fontFamily: SERIF }}>{p.title}</h3><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: green }}>{p.ageGroup}</span></div><p className="mt-3 leading-7 text-[#2A2418]/80">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">{p.highlights.map((h) => <li key={h}>· {h}</li>)}</ul>}<div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-[#2A2418]/10 pt-3 text-sm"><span>{p.duration}</span>{p.fee && <b>{p.fee}</b>}</div></SpReveal>)}</div></section>}

      {d.has.staff && <section id="cc-coaches" className="scroll-mt-4 bg-white py-20"><div className="mx-auto max-w-6xl px-5"><p className={kick} style={{ color: clay }}>The coaching team</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Meet your coaches</h2><ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{d.staff.map((s) => <li key={s.id}><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="clay" alt={s.name} className="aspect-[4/5] w-full object-cover" /><h3 className="mt-4 text-xl font-bold" style={{ fontFamily: SERIF }}>{s.name}</h3><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: clay }}>{s.role}</p>{s.qualifications.length > 0 && <p className="mt-2 text-sm text-[#2A2418]/70">{s.qualifications.join(' · ')}</p>}{s.bio && <p className="mt-2 text-sm leading-6 text-[#2A2418]/75">{s.bio}</p>}</li>)}</ul></div></section>}

      {d.has.batches && <section id="cc-nets" className="scroll-mt-4 mx-auto max-w-6xl px-5 py-20"><p className={kick} style={{ color: clay }}>Weekly timetable</p><h2 className={`${h2} mt-2`} style={{ fontFamily: SERIF }}>Net sessions</h2><div className="mt-8"><ScheduleGrid batches={d.batches} theme={{ th: 'border-b-2 text-xs font-semibold uppercase tracking-[0.2em]', cell: 'border-t-4 bg-white p-3 shadow-sm', name: 'text-[#14532D]' }} /></div></section>}

      {d.has.facilities && <section id="cc-facilities" className="scroll-mt-4 py-20" style={{ background: `${clay}14` }}><div className="mx-auto max-w-6xl px-5"><h2 className={h2} style={{ fontFamily: SERIF }}>Grounds & facilities</h2><div className="mt-8 grid gap-6 md:grid-cols-3">{d.facilities.map((f) => <div key={f.id} className="bg-white shadow-sm"><SmartImg src={f.image} seed={f.name} kind="cricket" palette="clay" alt="" className="aspect-[4/3] w-full object-cover" /><div className="p-5"><h3 className="text-xl font-bold" style={{ fontFamily: SERIF }}>{f.name}</h3>{f.description && <p className="mt-1 text-sm text-[#2A2418]/75">{f.description}</p>}</div></div>)}</div></div></section>}

      {d.has.admission && <section id="cc-enrol" className="scroll-mt-4 mx-auto max-w-4xl px-5 py-20"><h2 className={h2} style={{ fontFamily: SERIF }}>How to enrol</h2><ol className="mt-8 space-y-6">{([['Apply', d.admission.process], ['Who can join', d.admission.eligibility], ['Trial', d.admission.trialInfo], ['Fees', d.admission.feeSummary], ['Intake dates', d.admission.intakeDates]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v], i) => <li key={l} className="flex gap-5"><span className="grid h-10 w-10 shrink-0 place-items-center text-lg font-bold text-white" style={{ background: green, fontFamily: SERIF }}>{i + 1}</span><div><div className="font-semibold">{l}</div><p className="text-[#2A2418]/80">{v}</p></div></li>)}</ol>{d.admission.documents.length > 0 && <p className="mt-6 text-sm"><b>Bring:</b> {d.admission.documents.join(', ')}.</p>}</section>}

      {d.has.achievements && <section className="mx-auto max-w-4xl px-5 pb-20"><h2 className={`${h2} mb-6`} style={{ fontFamily: SERIF }}>Achievements</h2><ul className="divide-y divide-[#2A2418]/15 border-y border-[#2A2418]/15">{d.achievements.map((a) => <li key={a.id} className="flex gap-5 py-3"><b className="w-14 shrink-0" style={{ color: clay }}>{a.year}</b><span>{a.title}</span></li>)}</ul></section>}
      {d.has.testimonials && <section className="py-16 text-[#FAF6EC]" style={{ background: green }}><div className="mx-auto grid max-w-5xl gap-8 px-5 md:grid-cols-2">{d.testimonials.slice(0, 2).map((q) => <figure key={q.id}><blockquote className="text-xl italic leading-8" style={{ fontFamily: SERIF }}>“{q.quote}”</blockquote><figcaption className="mt-3 text-xs uppercase tracking-[0.25em] text-[#F3C69B]">{q.author}{q.role ? `, ${q.role}` : ''}</figcaption></figure>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-6xl px-5 py-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden border-4 border-white shadow"><SmartImg src={p.src} seed={p.id} kind="cricket" palette="clay" alt={p.caption} className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-6xl px-5 pb-20"><h2 className={`${h2} mb-6`} style={{ fontFamily: SERIF }}>From the nets</h2><div className="grid gap-6 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id}><SmartImg src={n.image} seed={n.title} kind="cricket" palette="clay" alt="" className="aspect-video w-full object-cover" /><div className={`${kick} mt-3`} style={{ color: clay }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-xl font-bold leading-snug" style={{ fontFamily: SERIF }}>{n.title}</h3></article>)}</div></section>}

      <section id="cc-contact" className="scroll-mt-4 mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><h2 className={h2} style={{ fontFamily: SERIF }}>Visit or write to us</h2><div className="mt-5 space-y-1.5 text-lg">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-[#2A2418]/30 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Book a net session', 'Course information', 'Fees', 'Other']} withPhone buttonStyle={{ background: clay }} cls={{ input: 'w-full border border-[#2A2418]/30 bg-white px-4 py-3 text-sm focus:border-[#14532D] focus:outline-none', button: 'px-8 py-3 text-sm font-semibold text-white', note: 'text-sm text-[#2A2418]/75' }} />
      </section>
      <footer className="py-6 text-center text-xs uppercase tracking-[0.25em] text-[#FAF6EC]/80" style={{ background: green }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
