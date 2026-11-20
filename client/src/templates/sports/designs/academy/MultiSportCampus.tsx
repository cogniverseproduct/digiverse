import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap';
const HEAD = 'Outfit, system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';
const shade = (hex: string, k: number) => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); const f = (v: number) => Math.round(v * (1 - k)); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/** Multi-Sport Campus: a large training centre. Ocean blue, a sport tab strip that filters programmes and sessions, and a facilities grid. */
export const MultiSportCampus: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'ocean', coverKind: 'track' }), [props]);
  const deep = d.brand.primary || '#031B34';
  const cyan = d.brand.accent || '#0A8FBF';
  /** The accent darkened so it stays readable as text and as a button fill on light surfaces. */
  const ink = shade(cyan, 0.45);
  const [lb, setLb] = useState<number | null>(null);
  const sports = useMemo(() => Array.from(new Set(d.programmes.map((p) => p.sport).filter(Boolean))), [d.programmes]);
  const [sel, setSel] = useState('All');
  const progs = d.programmes.filter((p) => sel === 'All' || p.sport === sel);
  const progNames = new Set(progs.map((p) => p.title));
  const batches = d.batches.filter((b) => sel === 'All' || !b.programme || progNames.has(b.programme));
  const nav = ([d.has.programmes && ['Programmes', 'mc-programmes'], d.has.facilities && ['Facilities', 'mc-facilities'], d.has.batches && ['Timetable', 'mc-timetable'], d.has.staff && ['Coaches', 'mc-coaches'], d.has.admission && ['Admission', 'mc-admission'], ['Contact', 'mc-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-4xl font-extrabold sm:text-5xl';
  const lab = 'text-xs font-bold uppercase tracking-[0.25em]';

  return (
    <div id="mc-top" className="sp-root min-h-screen bg-[#F2FAFF] text-[#06283D]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 text-white" style={{ background: deep }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('mc-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-xl font-bold" style={{ fontFamily: HEAD }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-medium text-white/75 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden text-white" style={{ background: deep }}>
        <SmartImg src={d.cover} seed={d.name} kind="track" palette="ocean" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `linear-gradient(120deg, ${deep} 25%, transparent)` }} />
        <div className="mx-auto max-w-7xl px-5 py-24 md:py-32"><SpReveal><p className={lab} style={{ color: '#7FD4F0' }}>{[d.location, d.founded ? `Since ${d.founded}` : ''].filter(Boolean).join(' · ')}</p><h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.02] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 max-w-2xl text-lg text-white/80">{d.description}</p>}</SpReveal>
          {sports.length > 0 && <div className="mt-8 flex flex-wrap gap-2" aria-label="Sports offered">{sports.map((s) => <button key={s} type="button" onClick={() => { setSel(s); scrollToId('mc-programmes'); }} className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25">{s}</button>)}</div>}</div>
      </section>

      {d.stats.length > 0 && <section className="bg-white shadow-sm"><dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <div key={s.label}><dd className="text-4xl font-extrabold" style={{ fontFamily: HEAD, color: ink }}>{s.value}</dd><dt className="text-sm text-[#06283D]/65">{s.label}</dt></div>)}</dl></section>}

      {d.has.programmes && (
        <section id="mc-programmes" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20">
          <h2 className={h2} style={{ fontFamily: HEAD }}>Programmes</h2>
          {sports.length > 1 && <div role="tablist" aria-label="Filter by sport" className="sp-no-scrollbar mt-6 flex min-w-0 gap-2 overflow-x-auto pb-1">{['All', ...sports].map((s) => <button key={s} role="tab" aria-selected={sel === s} type="button" onClick={() => setSel(s)} className="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold" style={sel === s ? { background: ink, color: '#fff', borderColor: ink } : { borderColor: '#06283D33' }}>{s}</button>)}</div>}
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{progs.map((p, i) => <SpReveal key={p.id} delay={i * 50} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#06283D]/10"><div className="flex items-center justify-between"><span className={lab} style={{ color: ink }}>{p.sport}</span><span className="text-xs font-semibold text-[#06283D]/60">{p.ageGroup}</span></div><h3 className="mt-3 text-2xl font-bold" style={{ fontFamily: HEAD }}>{p.title}</h3><p className="mt-2 text-sm leading-6 text-[#06283D]/75">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{p.highlights.map((h) => <li key={h} className="rounded-full bg-[#F2FAFF] px-3 py-1 text-xs font-medium">{h}</li>)}</ul>}<div className="mt-auto flex justify-between pt-5 text-sm"><span className="text-[#06283D]/65">{p.duration}</span>{p.fee && <b>{p.fee}</b>}</div></SpReveal>)}{!progs.length && <p className="text-[#06283D]/65">No programmes for this sport yet.</p>}</div>
        </section>
      )}

      {d.has.facilities && <section id="mc-facilities" className="scroll-mt-16 py-20 text-white" style={{ background: deep }}><div className="mx-auto max-w-7xl px-5"><h2 className={h2} style={{ fontFamily: HEAD }}>Facilities</h2><div className="mt-10 grid auto-rows-[15rem] gap-4 md:grid-cols-3">{d.facilities.map((f, i) => <div key={f.id} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'md:col-span-2' : ''}`}><SmartImg src={f.image} seed={f.name} kind="track" palette="ocean" alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><h3 className="text-xl font-bold" style={{ fontFamily: HEAD }}>{f.name}</h3>{f.description && <p className="text-sm text-white/75">{f.description}</p>}</div></div>)}</div></div></section>}

      {d.has.batches && <section id="mc-timetable" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Timetable{sel !== 'All' ? `: ${sel}` : ''}</h2><div className="relative mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-[#06283D]/10" role="region" aria-label="Timetable" tabIndex={0}><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-widest text-[#06283D]/60"><th className="px-5 py-3">Session</th><th className="px-5 py-3">Days</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Age</th><th className="px-5 py-3">Venue</th></tr></thead><tbody>{batches.map((b) => <tr key={b.id} className="border-b border-[#06283D]/10"><td className="px-5 py-3 font-semibold">{b.name}</td><td className="px-5 py-3">{b.days.join(', ')}</td><td className="whitespace-nowrap px-5 py-3" style={{ color: ink }}>{b.start && b.end ? `${b.start}–${b.end}` : b.start}</td><td className="px-5 py-3">{b.ageGroup}</td><td className="px-5 py-3">{b.venue}</td></tr>)}{!batches.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#06283D]/60">No sessions for this sport yet.</td></tr>}</tbody></table></div></section>}

      {d.has.staff && <section id="mc-coaches" className="scroll-mt-16 bg-white py-20"><div className="mx-auto max-w-7xl px-5"><h2 className={h2} style={{ fontFamily: HEAD }}>Coaches</h2><ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{d.staff.map((s) => <li key={s.id}><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="ocean" alt={s.name} className="aspect-[4/5] w-full rounded-2xl object-cover" /><h3 className="mt-3 text-lg font-bold" style={{ fontFamily: HEAD }}>{s.name}</h3><p className="text-sm font-semibold" style={{ color: ink }}>{s.role}</p>{s.qualifications.length > 0 && <p className="mt-1 text-xs text-[#06283D]/65">{s.qualifications.join(' · ')}</p>}</li>)}</ul></div></section>}

      {d.has.admission && <section id="mc-admission" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Admission</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{([['How to apply', d.admission.process], ['Who can join', d.admission.eligibility], ['Trial sessions', d.admission.trialInfo], ['Fees', d.admission.feeSummary], ['Intake', d.admission.intakeDates]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#06283D]/10"><h3 className={lab} style={{ color: ink }}>{l}</h3><p className="mt-2 leading-7">{v}</p></div>)}</div></section>}

      {d.has.achievements && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className="text-3xl font-extrabold" style={{ fontFamily: HEAD }}>Highlights</h2><ul className="mt-6 grid gap-4 md:grid-cols-3">{d.achievements.map((a) => <li key={a.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#06283D]/10"><b className="text-2xl" style={{ fontFamily: HEAD, color: ink }}>{a.year}</b><p className="mt-1 font-semibold">{a.title}</p></li>)}</ul></section>}
      {d.has.testimonials && <section className="mx-auto max-w-7xl px-5 pb-20"><div className="grid gap-5 md:grid-cols-2">{d.testimonials.slice(0, 2).map((q) => <figure key={q.id} className="rounded-2xl p-7 text-white" style={{ background: deep }}><blockquote className="text-lg leading-8">“{q.quote}”</blockquote><figcaption className="mt-3 text-sm text-white/70">{q.author}{q.role ? `, ${q.role}` : ''}</figcaption></figure>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-xl"><SmartImg src={p.src} seed={p.id} kind="track" palette="ocean" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className="text-3xl font-extrabold" style={{ fontFamily: HEAD }}>Campus news</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#06283D]/10"><SmartImg src={n.image} seed={n.title} kind="track" palette="ocean" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className={lab} style={{ color: ink }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-bold leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3></div></article>)}</div></section>}

      <section id="mc-contact" className="scroll-mt-16 py-20 text-white" style={{ background: deep }}><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div><h2 className={h2} style={{ fontFamily: HEAD }}>Visit the campus</h2><div className="mt-6 space-y-1.5 text-white/85">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={sports.length ? ['General enquiry', ...sports.map((s) => `Trial: ${s}`)] : ['General enquiry', 'Book a trial']} withPhone buttonStyle={{ background: ink }} cls={{ input: 'w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none', button: 'rounded-full px-8 py-3 text-sm font-bold text-white', note: 'text-sm text-white/80' }} />
      </div></section>
      <footer className="py-6 text-center text-xs text-white/70" style={{ background: deep }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
