import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { batchesByDay, fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Anton&family=Roboto+Condensed:wght@400;500;700&display=swap';
const HEAVY = 'Anton, Impact, sans-serif';
const SANS = '"Roboto Condensed", system-ui, sans-serif';

/** Pitch Academy: football training. Dark turf green, heavy condensed type, a pitch-line pathway from the youngest group upward. */
export const PitchAcademy: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'turf', coverKind: 'pitch' }), [props]);
  const mint = d.brand.accent || '#8DE0A6';
  const [lb, setLb] = useState<number | null>(null);
  const path = useMemo(() => (d.ageGroups.length ? d.ageGroups : Array.from(new Set(d.programmes.map((p) => p.ageGroup).filter(Boolean)))), [d]);
  const week = batchesByDay(d.batches);
  const nav = ([d.has.programmes && ['Programmes', 'pi-programmes'], path.length > 0 && ['Pathway', 'pi-path'], d.has.staff && ['Coaches', 'pi-coaches'], d.has.batches && ['Sessions', 'pi-sessions'], d.has.facilities && ['Pitches', 'pi-pitches'], d.has.admission && ['Join', 'pi-join'], ['Contact', 'pi-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-5xl uppercase leading-none sm:text-7xl';

  return (
    <div id="pi-top" className="sp-root min-h-screen bg-[#06210F] text-[#EFFFF4]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 border-b-4 bg-[#06210F]/95 backdrop-blur" style={{ borderColor: mint }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('pi-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-2xl uppercase" style={{ fontFamily: HEAVY }}>{d.shortName}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="pitch" palette="turf" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55" />
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(90deg,#06210F 8%,#06210F99 55%,transparent)' }} />
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-36">
          <SpReveal><p className="inline-block px-3 py-1 text-sm font-bold uppercase tracking-[0.3em] text-[#06210F]" style={{ background: mint }}>{[d.sport, d.location].filter(Boolean).join(' · ') || 'Football academy'}</p><h1 className="mt-5 max-w-4xl text-[clamp(3.2rem,10vw,8rem)] uppercase leading-[0.92]" style={{ fontFamily: HEAVY }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 max-w-xl text-xl text-white/80">{d.description}</p>}<div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId('pi-contact')} className="px-8 py-3.5 text-lg font-bold uppercase tracking-widest text-[#06210F]" style={{ background: mint }}>Book a trial session</button></div></SpReveal>
        </div>
      </section>

      {path.length > 0 && (
        <section id="pi-path" className="scroll-mt-16 border-y-4 border-white/10 bg-black/30 py-16"><div className="mx-auto max-w-7xl px-5">
          <h2 className={h2} style={{ fontFamily: HEAVY }}>The <span style={{ color: mint }}>pathway</span></h2>
          <ol className="relative mt-10 grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">{path.map((a, i) => <li key={a} className="relative border-2 border-white/20 p-5"><span className="absolute -top-4 left-4 grid h-8 w-8 place-items-center text-lg text-[#06210F]" style={{ background: mint, fontFamily: HEAVY }}>{i + 1}</span><div className="mt-2 text-3xl uppercase" style={{ fontFamily: HEAVY }}>{a}</div><div className="text-sm text-white/60">{d.programmes.filter((p) => p.ageGroup === a).map((p) => p.title).join(' · ') || 'Training group'}</div></li>)}</ol>
        </div></section>
      )}

      {d.has.programmes && <section id="pi-programmes" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAVY }}>Programmes</h2><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{d.programmes.map((p, i) => <SpReveal key={p.id} delay={i * 70} className="border-2 border-white/15 bg-white/[0.04]"><div className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#06210F]" style={{ background: mint }}>{[p.ageGroup, p.duration].filter(Boolean).join(' · ')}</div><div className="p-6"><h3 className="text-3xl uppercase" style={{ fontFamily: HEAVY }}>{p.title}</h3><p className="mt-3 text-white/75">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-4 space-y-1.5 text-sm font-medium">{p.highlights.map((h) => <li key={h} style={{ color: mint }}>▸ <span className="text-white/90">{h}</span></li>)}</ul>}{p.fee && <p className="mt-5 text-lg font-bold">{p.fee}</p>}</div></SpReveal>)}</div></section>}

      {d.has.staff && <section id="pi-coaches" className="scroll-mt-16 border-y-4 border-white/10 bg-black/30 py-20"><div className="mx-auto max-w-7xl px-5"><h2 className={h2} style={{ fontFamily: HEAVY }}>Coaching <span style={{ color: mint }}>staff</span></h2><ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">{d.staff.map((s) => <li key={s.id} className="group relative overflow-hidden border-2 border-white/15"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="turf" alt={s.name} className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4"><div className="text-2xl uppercase leading-none" style={{ fontFamily: HEAVY }}>{s.name}</div><div className="text-xs font-bold uppercase tracking-widest" style={{ color: mint }}>{s.role}</div></div></li>)}</ul></div></section>}

      {d.has.batches && <section id="pi-sessions" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAVY }}>Training <span style={{ color: mint }}>week</span></h2><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{week.map((g) => <div key={g.day} className="border-2 border-white/15"><div className="px-5 py-2 text-3xl uppercase" style={{ fontFamily: HEAVY, background: 'rgba(255,255,255,.08)' }}>{g.day}</div><ul className="divide-y divide-white/10">{g.items.map((b) => <li key={b.id + g.day} className="px-5 py-3"><div className="font-bold">{b.name}</div><div className="text-sm text-white/60">{[b.start && b.end ? `${b.start}–${b.end}` : b.start, b.ageGroup, b.venue].filter(Boolean).join(' · ')}</div></li>)}</ul></div>)}</div></section>}

      {d.has.facilities && <section id="pi-pitches" className="scroll-mt-16 border-y-4 border-white/10 bg-black/30 py-20"><div className="mx-auto max-w-7xl px-5"><h2 className={h2} style={{ fontFamily: HEAVY }}>Where we <span style={{ color: mint }}>train</span></h2><div className="mt-10 grid gap-5 md:grid-cols-3">{d.facilities.map((f) => <div key={f.id} className="border-2 border-white/15"><SmartImg src={f.image} seed={f.name} kind="pitch" palette="turf" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><h3 className="text-2xl uppercase" style={{ fontFamily: HEAVY }}>{f.name}</h3>{f.description && <p className="mt-1 text-sm text-white/70">{f.description}</p>}</div></div>)}</div></div></section>}

      {d.has.admission && <section id="pi-join" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAVY }}>How to <span style={{ color: mint }}>join</span></h2><div className="mt-10 grid gap-5 md:grid-cols-3">{([['1 · Apply', d.admission.process], ['2 · Trial', d.admission.trialInfo], ['3 · Eligibility', d.admission.eligibility]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l} className="border-2 border-white/15 p-6"><h3 className="text-2xl uppercase" style={{ fontFamily: HEAVY, color: mint }}>{l}</h3><p className="mt-2 text-white/80">{v}</p></div>)}</div>{(d.admission.feeSummary || d.admission.intakeDates) && <p className="mt-6 text-lg font-bold">{[d.admission.feeSummary, d.admission.intakeDates && `Intake: ${d.admission.intakeDates}`].filter(Boolean).join(' · ')}</p>}</section>}

      {d.has.achievements && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className={h2} style={{ fontFamily: HEAVY }}>Honours</h2><ul className="mt-8 grid gap-4 md:grid-cols-2">{d.achievements.map((a) => <li key={a.id} className="flex items-center gap-5 border-2 border-white/15 p-5"><span className="text-4xl" style={{ fontFamily: HEAVY, color: mint }}>{a.year}</span><span className="font-bold">{a.title}</span></li>)}</ul></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden"><SmartImg src={p.src} seed={p.id} kind="pitch" palette="turf" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-7xl px-5 pb-20"><h2 className={h2} style={{ fontFamily: HEAVY }}>News</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className="border-2 border-white/15"><SmartImg src={n.image} seed={n.title} kind="pitch" palette="turf" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-xs font-bold uppercase tracking-widest" style={{ color: mint }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-bold leading-snug">{n.title}</h3></div></article>)}</div></section>}

      <section id="pi-contact" className="scroll-mt-16 border-t-4 py-20" style={{ borderColor: mint }}><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div><h2 className={h2} style={{ fontFamily: HEAVY }}>Get a <span style={{ color: mint }}>trial</span></h2><div className="mt-6 space-y-1.5 text-lg">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border-2 border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Book a trial', 'Programme question', 'Fees', 'Other']} withPhone buttonStyle={{ background: mint }} cls={{ input: 'w-full border-2 border-white/20 bg-black/30 px-4 py-3 text-base placeholder:text-white/40 focus:border-white/60 focus:outline-none', button: 'px-8 py-3 text-lg font-bold uppercase tracking-widest text-[#06210F]', note: 'text-base text-white/80' }} />
      </div></section>
      <footer className="border-t-4 border-white/10 py-6 text-center text-xs uppercase tracking-widest text-white/45">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
