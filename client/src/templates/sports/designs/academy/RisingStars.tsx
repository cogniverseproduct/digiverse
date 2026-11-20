import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { batchesByDay, fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap';
const HEAD = 'Fredoka, system-ui, sans-serif';
const SANS = 'Nunito, system-ui, sans-serif';
const COLORS = ['#F0457A', '#FF9A3C', '#2BB3A3', '#7A2E8E', '#3A86FF'];

/** Rising Stars: youth development. Bright, rounded and friendly; age-group cards, a parent-facing weekly view and a clear "try a session" path. */
export const RisingStars: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'sunrise', coverKind: 'action' }), [props]);
  const purple = d.brand.primary || '#7A2E8E';
  const orange = d.brand.accent || '#FF9A3C';
  const pink = '#F0457A';
  const [lb, setLb] = useState<number | null>(null);
  const week = batchesByDay(d.batches);
  const ages = d.ageGroups.length ? d.ageGroups : Array.from(new Set(d.programmes.map((p) => p.ageGroup).filter(Boolean)));
  const nav = ([ages.length > 0 && ['Age groups', 'rs-ages'], d.has.programmes && ['Programmes', 'rs-programmes'], d.has.batches && ['This week', 'rs-week'], d.has.staff && ['Coaches', 'rs-coaches'], d.has.admission && ['Join', 'rs-join'], ['Contact', 'rs-contact']].filter(Boolean) as [string, string][]);
  const pill = 'rounded-full px-4 py-1.5 text-sm font-bold';
  const h2 = 'text-4xl font-semibold sm:text-5xl';
  const card = 'rounded-[2rem] bg-white p-6 shadow-[0_8px_0_0_rgba(43,16,85,0.08)] ring-1 ring-[#2B1055]/10';

  return (
    <div id="rs-top" className="sp-root min-h-screen bg-[#FFF7EE] text-[#2B1055]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 bg-[#FFF7EE]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('rs-top')} className="flex items-center gap-2.5"><img src={d.logo} alt="" className="h-10 w-10 rounded-full object-contain" /><span className="text-xl font-semibold" style={{ fontFamily: HEAD }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar hidden min-w-0 gap-1 overflow-x-auto md:flex">{nav.filter(([, id]) => id !== 'rs-contact').map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold hover:bg-[#2B1055]/10">{l}</button>)}</nav>
          <button type="button" onClick={() => scrollToId('rs-contact')} className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow" style={{ background: pink }}>Try a session</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <SpReveal><span className={`${pill} inline-flex items-center gap-1.5`} style={{ background: `${orange}33`, color: '#9A4B00' }}><Star className="h-4 w-4" fill="currentColor" />{[d.sport, d.location].filter(Boolean).join(' · ') || 'Youth sport'}</span><h1 className="mt-5 text-5xl font-semibold leading-[1.05] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 max-w-lg text-lg font-semibold leading-8 text-[#2B1055]/75">{d.description}</p>}<div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId('rs-contact')} className="rounded-full px-8 py-3.5 text-base font-bold text-white shadow-lg" style={{ background: pink }}>Book a free trial</button>{ages.length > 0 && <button type="button" onClick={() => scrollToId('rs-ages')} className="rounded-full border-[3px] px-8 py-3 text-base font-bold" style={{ borderColor: purple, color: purple }}>Find your age group</button>}</div></SpReveal>
        <SpReveal from="scale" delay={100}><div className="relative"><SmartImg src={d.cover} seed={d.name} kind="action" palette="sunrise" alt="" loading="eager" className="aspect-square w-full rounded-[3rem] object-cover shadow-xl" /><span aria-hidden className="sp-float absolute -right-3 -top-3 grid h-16 w-16 place-items-center rounded-full text-white shadow-lg" style={{ background: purple }}><Star className="h-8 w-8" fill="currentColor" /></span></div></SpReveal>
      </section>

      {ages.length > 0 && <section id="rs-ages" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Pick an age group</h2><ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{ages.map((a, i) => <SpReveal as="li" key={a} delay={i * 60} className="rounded-[2rem] p-6 text-center text-white" style={{ background: COLORS[i % COLORS.length] }}><div className="text-4xl font-semibold" style={{ fontFamily: HEAD }}>{a}</div><div className="mt-1 text-sm font-bold opacity-90">{d.programmes.filter((p) => p.ageGroup === a).map((p) => p.title).join(' · ') || 'Training group'}</div></SpReveal>)}</ul></section>}

      {d.has.programmes && <section id="rs-programmes" className="scroll-mt-16 py-20" style={{ background: `${purple}12` }}><div className="mx-auto max-w-6xl px-5"><h2 className={h2} style={{ fontFamily: HEAD }}>What we do</h2><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{d.programmes.map((p, i) => <SpReveal key={p.id} delay={i * 60} className={card}><span className={pill} style={{ background: `${COLORS[i % COLORS.length]}26`, color: COLORS[i % COLORS.length] }}>{p.ageGroup}</span><h3 className="mt-3 text-2xl font-semibold" style={{ fontFamily: HEAD }}>{p.title}</h3><p className="mt-2 font-semibold leading-7 text-[#2B1055]/75">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{p.highlights.map((h) => <li key={h} className="rounded-full bg-[#FFF7EE] px-3 py-1 text-xs font-bold">{h}</li>)}</ul>}{(p.fee || p.duration) && <p className="mt-4 text-sm font-bold">{[p.duration, p.fee].filter(Boolean).join(' · ')}</p>}</SpReveal>)}</div></div></section>}

      {d.has.batches && <section id="rs-week" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Our week</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{week.map((g, i) => <div key={g.day} className={card}><div className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ background: COLORS[i % COLORS.length], fontFamily: HEAD }}>{g.day}</div><ul className="mt-3 space-y-2">{g.items.map((b) => <li key={b.id + g.day}><div className="font-bold">{b.name}</div><div className="text-sm font-semibold text-[#2B1055]/65">{[b.start && b.end ? `${b.start}–${b.end}` : b.start, b.ageGroup].filter(Boolean).join(' · ')}</div></li>)}</ul></div>)}</div></section>}

      {d.has.staff && <section id="rs-coaches" className="scroll-mt-16 py-20" style={{ background: `${orange}22` }}><div className="mx-auto max-w-6xl px-5"><h2 className={h2} style={{ fontFamily: HEAD }}>Meet the coaches</h2><ul className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">{d.staff.map((s) => <li key={s.id} className="text-center"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="sunrise" alt={s.name} className="mx-auto aspect-square w-full max-w-[12rem] rounded-full object-cover shadow-lg ring-4 ring-white" /><h3 className="mt-3 text-xl font-semibold" style={{ fontFamily: HEAD }}>{s.name}</h3><p className="text-sm font-bold text-[#2B1055]/65">{s.role}</p></li>)}</ul></div></section>}

      {d.has.facilities && <section className="mx-auto max-w-6xl px-5 py-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Where we play</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{d.facilities.map((f) => <div key={f.id} className={`${card} overflow-hidden p-0`}><SmartImg src={f.image} seed={f.name} kind="action" palette="sunrise" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><h3 className="text-xl font-semibold" style={{ fontFamily: HEAD }}>{f.name}</h3>{f.description && <p className="mt-1 text-sm font-semibold text-[#2B1055]/70">{f.description}</p>}</div></div>)}</div></section>}

      {d.has.admission && <section id="rs-join" className="scroll-mt-16 mx-auto max-w-5xl px-5 pb-20"><div className="rounded-[2.5rem] p-8 text-white md:p-12" style={{ background: purple }}><h2 className={h2} style={{ fontFamily: HEAD }}>How to join</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{([['1', 'Come and try', d.admission.trialInfo], ['2', 'Sign up', d.admission.process], ['3', 'Who can join', d.admission.eligibility]] as [string, string, string | undefined][]).filter(([, , v]) => v).map(([n, l, v]) => <div key={n} className="rounded-3xl bg-white/12 p-5"><span className="grid h-9 w-9 place-items-center rounded-full text-lg font-semibold text-[#2B1055]" style={{ background: orange, fontFamily: HEAD }}>{n}</span><div className="mt-3 text-lg font-semibold" style={{ fontFamily: HEAD }}>{l}</div><p className="mt-1 font-semibold text-white/85">{v}</p></div>)}</div>{(d.admission.feeSummary || d.admission.intakeDates) && <p className="mt-6 font-bold">{[d.admission.feeSummary, d.admission.intakeDates].filter(Boolean).join(' · ')}</p>}</div></section>}

      {d.has.achievements && <section className="mx-auto max-w-5xl px-5 pb-20"><h2 className={h2} style={{ fontFamily: HEAD }}>Proud moments</h2><ul className="mt-6 grid gap-3 md:grid-cols-2">{d.achievements.map((a) => <li key={a.id} className={`${card} flex items-center gap-4 py-4`}><Star className="h-6 w-6 shrink-0" style={{ color: orange }} fill="currentColor" /><span className="font-bold">{a.title}{a.year ? ` (${a.year})` : ''}</span></li>)}</ul></section>}
      {d.has.testimonials && <section className="mx-auto max-w-5xl px-5 pb-20"><div className="grid gap-5 md:grid-cols-2">{d.testimonials.slice(0, 2).map((q) => <figure key={q.id} className={card}><blockquote className="text-lg font-semibold leading-8">“{q.quote}”</blockquote><figcaption className="mt-3 text-sm font-bold" style={{ color: pink }}>{q.author}{q.role ? `, ${q.role}` : ''}</figcaption></figure>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-6xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-[2rem]"><SmartImg src={p.src} seed={p.id} kind="action" palette="sunrise" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.news && <section className="mx-auto max-w-6xl px-5 pb-20"><h2 className={h2} style={{ fontFamily: HEAD }}>News</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n) => <article key={n.id} className={`${card} overflow-hidden p-0`}><SmartImg src={n.image} seed={n.title} kind="action" palette="sunrise" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-xs font-bold uppercase" style={{ color: pink }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-lg font-semibold leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3></div></article>)}</div></section>}

      <section id="rs-contact" className="scroll-mt-16 px-5 pb-20"><div className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] p-8 md:p-12 lg:grid-cols-2" style={{ background: `${orange}2E` }}>
        <div><h2 className={h2} style={{ fontFamily: HEAD }}>Say hello!</h2><p className="mt-2 font-semibold text-[#2B1055]/75">Ask a question or book a free trial.</p><div className="mt-5 space-y-1.5 font-semibold">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-[#FFF7EE]" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Book a free trial', 'Age groups', 'Fees', 'Something else']} withPhone buttonStyle={{ background: pink }} cls={{ input: 'w-full rounded-2xl border-2 border-transparent bg-white px-4 py-3 text-sm font-semibold placeholder:text-[#2B1055]/45 focus:border-[#7A2E8E] focus:outline-none', button: 'rounded-full px-8 py-3 text-base font-bold text-white shadow-lg', note: 'text-sm font-bold' }} />
      </div></section>
      <footer className="pb-8 text-center text-sm font-semibold text-[#2B1055]/60">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
