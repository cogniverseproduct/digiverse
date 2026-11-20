import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, normalizeSports } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap';
const SERIF = '"DM Serif Display", Georgia, serif';
const SANS = '"DM Sans", system-ui, sans-serif';

/** Learn & Play: minimal sports education. One calm reading column with generous space, a numbered contents list and a single accent. */
export const LearnAndPlay: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'mint', coverKind: 'court' }), [props]);
  const teal = d.brand.primary || '#0B5A56';
  const rose = d.brand.accent || '#F0457A';
  const [lb, setLb] = useState<number | null>(null);
  const toc = ([d.has.about && ['Our approach', 'lp-about'], d.has.programmes && ['What children learn', 'lp-learn'], d.has.batches && ['When we meet', 'lp-when'], d.has.staff && ['Who teaches', 'lp-who'], d.has.facilities && ['Where', 'lp-where'], d.has.admission && ['Joining', 'lp-join'], d.has.achievements && ['Milestones', 'lp-milestones'], d.has.news && ['Notes', 'lp-notes'], ['Contact', 'lp-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-3xl sm:text-4xl';
  const sec = 'scroll-mt-6 border-t border-[#0F2E2C]/15 py-14';
  const label = 'text-xs font-bold uppercase tracking-[0.25em]';

  return (
    <div id="lp-top" className="sp-root min-h-screen bg-[#F5FBF9] text-[#0F2E2C]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <div className="mx-auto max-w-2xl px-6">
        <header className="flex items-center justify-between py-6"><button type="button" onClick={() => scrollToId('lp-top')} className="flex items-center gap-3 font-semibold"><img src={d.logo} alt="" className="h-8 w-8 object-contain" />{d.name}</button><button type="button" onClick={() => scrollToId('lp-contact')} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: teal }}>Get in touch</button></header>

        <section className="pb-14 pt-10 sm:pt-16">
          <p className={label} style={{ color: rose }}>{[d.sport, d.location].filter(Boolean).join(' · ') || 'Sports education'}</p>
          <h1 className="mt-4 text-5xl leading-[1.08] sm:text-6xl" style={{ fontFamily: SERIF, color: teal }}>{d.tagline || d.name}</h1>
          {d.description && <p className="mt-6 text-xl leading-9 text-[#0F2E2C]/80">{d.description}</p>}
          <SmartImg src={d.cover} seed={d.name} kind="court" palette="mint" alt="" loading="eager" className="mt-10 aspect-[16/10] w-full rounded-2xl object-cover" />
        </section>

        <nav aria-label="Contents" className="rounded-2xl bg-white p-6 shadow-sm"><h2 className={label} style={{ color: teal }}>On this page</h2><ol className="mt-3 space-y-1.5">{toc.map(([l, id], i) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="flex w-full gap-3 py-1 text-left text-lg hover:underline"><span style={{ color: rose, fontFamily: SERIF }}>{i + 1}.</span>{l}</button></li>)}</ol></nav>

        {d.has.about && (d.philosophy || d.mission || d.history) && <section id="lp-about" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Our approach</h2><div className="mt-5 space-y-5 text-lg leading-9">{d.philosophy && <p>{d.philosophy}</p>}{d.mission && <p>{d.mission}</p>}{d.history && <p>{d.history}</p>}</div>{d.values.length > 0 && <ul className="mt-6 flex flex-wrap gap-2">{d.values.map((v) => <li key={v} className="rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ borderColor: teal, color: teal }}>{v}</li>)}</ul>}</section>}

        {d.has.programmes && <section id="lp-learn" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>What children learn</h2><div className="mt-6 space-y-10">{d.programmes.map((p) => <article key={p.id}><div className={label} style={{ color: rose }}>{[p.ageGroup, p.duration].filter(Boolean).join(' · ')}</div><h3 className="mt-1 text-2xl" style={{ fontFamily: SERIF }}>{p.title}</h3><p className="mt-2 text-lg leading-8 text-[#0F2E2C]/80">{p.description}</p>{p.highlights.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}{p.fee && <p className="mt-3 font-semibold">{p.fee}</p>}</article>)}</div></section>}

        {d.has.batches && <section id="lp-when" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>When we meet</h2><ul className="mt-6 divide-y divide-[#0F2E2C]/15">{d.batches.map((b) => <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"><div><div className="font-semibold">{b.name}</div><div className="text-sm text-[#0F2E2C]/65">{[b.ageGroup, b.venue].filter(Boolean).join(' · ')}</div></div><div className="text-right text-sm"><div className="font-semibold" style={{ color: teal }}>{b.days.join(', ')}</div><div>{b.start && b.end ? `${b.start}–${b.end}` : b.start}</div></div></li>)}</ul></section>}

        {d.has.staff && <section id="lp-who" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Who teaches</h2><ul className="mt-6 space-y-8">{d.staff.map((s) => <li key={s.id} className="flex gap-5"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="mint" alt={s.name} className="h-24 w-24 shrink-0 rounded-full object-cover" /><div><h3 className="text-xl" style={{ fontFamily: SERIF }}>{s.name}</h3><p className="text-sm font-semibold" style={{ color: rose }}>{s.role}</p>{s.bio && <p className="mt-1 leading-7 text-[#0F2E2C]/80">{s.bio}</p>}{s.qualifications.length > 0 && <p className="mt-1 text-sm text-[#0F2E2C]/65">{s.qualifications.join(' · ')}</p>}</div></li>)}</ul></section>}

        {d.has.facilities && <section id="lp-where" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Where</h2><ul className="mt-6 space-y-6">{d.facilities.map((f) => <li key={f.id}><h3 className="text-xl" style={{ fontFamily: SERIF }}>{f.name}</h3>{f.description && <p className="mt-1 leading-7 text-[#0F2E2C]/80">{f.description}</p>}</li>)}</ul>{d.address && <p className="mt-6"><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: teal }}>{d.address}</a></p>}</section>}

        {d.has.admission && <section id="lp-join" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Joining</h2><dl className="mt-6 space-y-6">{([['How to apply', d.admission.process], ['Who can join', d.admission.eligibility], ['Trial lessons', d.admission.trialInfo], ['Fees', d.admission.feeSummary], ['Start dates', d.admission.intakeDates]] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v]) => <div key={l}><dt className={label} style={{ color: rose }}>{l}</dt><dd className="mt-1 text-lg leading-8">{v}</dd></div>)}{d.admission.documents.length > 0 && <div><dt className={label} style={{ color: rose }}>Please bring</dt><dd className="mt-1 text-lg">{d.admission.documents.join(', ')}</dd></div>}</dl></section>}

        {d.has.achievements && <section id="lp-milestones" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Milestones</h2><ul className="mt-6 space-y-3 text-lg">{d.achievements.map((a) => <li key={a.id}><b style={{ color: rose }}>{a.year}</b> {a.title}</li>)}</ul></section>}
        {d.has.testimonials && <section className={sec}>{d.testimonials.slice(0, 2).map((q) => <figure key={q.id} className="mb-8"><blockquote className="text-2xl leading-10" style={{ fontFamily: SERIF, color: teal }}>“{q.quote}”</blockquote><figcaption className="mt-2 text-sm font-semibold">{q.author}{q.role ? `, ${q.role}` : ''}</figcaption></figure>)}</section>}
        {d.has.gallery && <section className={sec}><ul className="grid grid-cols-2 gap-3">{d.photos.slice(0, 6).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-xl"><SmartImg src={p.src} seed={p.id} kind="court" palette="mint" alt={p.caption} className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
        {d.has.news && <section id="lp-notes" className={sec}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Notes from the school</h2><ul className="mt-6 space-y-6">{d.news.slice(0, 3).map((n) => <li key={n.id}><div className={label} style={{ color: rose }}>{fmtDate(n.date)}</div><h3 className="mt-1 text-xl" style={{ fontFamily: SERIF }}>{n.title}</h3>{n.summary && <p className="mt-1 leading-7 text-[#0F2E2C]/80">{n.summary}</p>}</li>)}</ul></section>}

        <section id="lp-contact" className={`${sec} pb-20`}><h2 className={h2} style={{ fontFamily: SERIF, color: teal }}>Get in touch</h2><div className="mt-5 space-y-1.5 text-lg">{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-4" itemClass="inline-flex items-center gap-2 rounded-full border border-[#0F2E2C]/25 px-4 py-1.5 text-sm hover:bg-white" />}
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Arrange a trial lesson', 'Ask a question']} withPhone buttonStyle={{ background: teal }} cls={{ form: 'mt-8', input: 'w-full border-b-2 border-[#0F2E2C]/25 bg-transparent px-0 py-3 text-lg placeholder:text-[#0F2E2C]/45 focus:border-[#0B5A56] focus:outline-none', button: 'rounded-full px-8 py-3 text-base font-semibold text-white', note: 'text-base text-[#0F2E2C]/75' }} /></section>
        <footer className="border-t border-[#0F2E2C]/15 py-8 text-center text-sm text-[#0F2E2C]/60">© {new Date().getFullYear()} {d.name}</footer>
      </div>
    </div>
  );
};
