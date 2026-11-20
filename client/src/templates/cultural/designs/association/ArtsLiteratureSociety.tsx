import React, { useMemo, useState } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DemoBadge, EnquiryForm, Img, MembershipBlock, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;700&display=swap';
const HEAD = '"DM Serif Display", Georgia, serif';
const BODY = '"DM Sans", system-ui, sans-serif';

/** Arts & Literature Society: a magazine. Oversized headline, collage cover, filterable programme cards, contributors and an events calendar. */
export const ArtsLiteratureSociety: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'sand', coverKind: 'ink' }), [props]);
  const ink = d.brand.primary || '#1F2A44';
  const red = d.brand.accent || '#D2512B';
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => ['All', ...Array.from(new Set(d.activities.map((a) => a.category)))], [d.activities]);
  const shown = d.activities.filter((a) => cat === 'All' || a.category === cat);
  const items = ([d.has.activities && ['Programmes', 'al-prog'], d.has.events && ['Calendar', 'al-cal'], d.has.leadership && ['Contributors', 'al-people'], (d.has.gallery || d.has.videos) && ['Gallery', 'al-gallery'], d.has.news && ['Journal', 'al-news'], ['Contact', 'al-contact']].filter(Boolean) as [string, string][]);
  const label = 'text-[11px] font-bold uppercase tracking-[0.28em]';

  return (
    <div id="al-top" className="sp-root min-h-screen bg-[#FBF8F1] text-[#1B1B1F]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('al-top')} className="flex items-center gap-2 text-xl" style={{ fontFamily: HEAD, color: ink }}><span className="inline-block h-7 w-7 rounded-full" style={{ background: red }} aria-hidden />{d.shortName}</button>}
        items={items} cta={d.has.membership ? ['Become a member', 'al-member'] : undefined}
        cls={{ bar: 'sticky top-0 z-40 border-b border-[#1B1B1F]/10 bg-[#FBF8F1]/90 backdrop-blur', link: 'px-3 py-2 text-sm font-medium hover:text-[#D2512B]', active: 'text-[#D2512B]', cta: 'rounded-full bg-[#D2512B] px-4 py-2 text-sm font-bold text-white', mobilePanel: 'border-t border-[#1B1B1F]/10 bg-[#FBF8F1]' }}
      />

      <header className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-16 pt-12 lg:pt-20">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7 lg:pb-8">
            <p className={label} style={{ color: red }}>{[d.festival, d.place].filter(Boolean).join(' · ') || 'Arts · Letters · Community'}</p>
            <h1 className="mt-4 text-[clamp(2.8rem,9vw,7rem)] leading-[0.95]" style={{ fontFamily: HEAD, color: ink }}>{d.name}</h1>
            {d.tagline && <p className="mt-6 max-w-xl text-xl leading-8 opacity-80">{d.tagline}</p>}
            {d.has.about && <p className="mt-4 max-w-xl leading-7 opacity-70">{d.description.slice(0, 220)}{d.description.length > 220 ? '…' : ''}</p>}
            <div className="mt-8 flex gap-3"><button type="button" onClick={() => scrollToId(d.has.activities ? 'al-prog' : 'al-contact')} className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: ink }}>Explore the programme</button>{d.has.events && <button type="button" onClick={() => scrollToId('al-cal')} className="rounded-full border-2 px-6 py-3 text-sm font-bold" style={{ borderColor: ink, color: ink }}>What's on</button>}</div>
          </Reveal>
          <Reveal from="scale" delay={120} className="relative lg:col-span-5">
            <Img src={d.cover} seed="cover" kind="ink" palette="sand" alt="" loading="eager" className="aspect-[4/5] w-full rounded-[2rem] object-cover" />
            <Img src={d.photos[0]?.src} seed="b" kind="lotus" palette="indigo" alt="" className="absolute -bottom-6 -left-6 hidden h-40 w-40 rounded-3xl border-8 border-[#FBF8F1] object-cover shadow-xl sm:block" />
            <Img src={d.photos[1]?.src} seed="c" kind="textile" palette="rose" alt="" className="absolute -right-3 top-8 hidden h-28 w-28 rounded-full border-8 border-[#FBF8F1] object-cover shadow-xl sm:block" />
          </Reveal>
        </div>
      </header>

      {d.has.activities && (
        <section id="al-prog" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4"><Reveal><p className={label} style={{ color: red }}>Programmes</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: ink }}>Workshops, readings &amp; performances</h2></Reveal>
            <div role="group" aria-label="Filter programmes" className="flex flex-wrap gap-2">{cats.map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${cat === c ? 'text-white' : 'hover:bg-black/5'}`} style={cat === c ? { background: ink, borderColor: ink } : { borderColor: '#1B1B1F33' }}>{c}</button>)}</div></div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a, i) => (
              <Reveal as="li" key={a.id} delay={(i % 3) * 80} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
                <Img src={a.image} seed={a.id} kind={i % 2 ? 'textile' : 'ink'} palette={i % 3 === 0 ? 'rose' : i % 3 === 1 ? 'teal' : 'sand'} alt="" className="aspect-[16/10] w-full object-cover" />
                <div className="flex flex-1 flex-col p-5"><span className={label} style={{ color: red }}>{a.category}</span><h3 className="mt-2 text-2xl" style={{ fontFamily: HEAD, color: ink }}>{a.title}</h3><p className="mt-2 flex-1 text-sm leading-6 opacity-75">{a.description}</p><p className="mt-4 text-xs font-medium opacity-60">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></div>
              </Reveal>))}
          </ul>
        </section>
      )}

      {d.has.events && (
        <section id="al-cal" className="scroll-mt-20 py-16 text-white" style={{ background: ink }}>
          <div className="mx-auto max-w-6xl px-5">
            <Reveal><p className={label} style={{ color: '#F5B49E' }}>Calendar</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Upcoming &amp; recent</h2></Reveal>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {[...d.upcoming, ...d.past].slice(0, 8).map((e) => (
                <li key={e.id} className="flex gap-5 rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/15">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl text-center" style={{ background: red }}><span className="text-3xl font-bold leading-none">{e.date ? e.date.getDate() : '·'}</span><span className="text-xs uppercase tracking-widest">{e.date ? e.date.toLocaleDateString('en-GB', { month: 'short' }) : ''}</span></div>
                  <div className="min-w-0"><h3 className="text-xl" style={{ fontFamily: HEAD }}>{e.title}</h3><p className="mt-1 text-sm opacity-80">{[e.time, e.venue].filter(Boolean).join(' · ')}</p><p className="mt-2 text-sm opacity-70">{e.description}</p>{e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold underline">Register →</a>}</div>
                </li>))}
            </ul>
          </div>
        </section>
      )}

      {d.has.leadership && (
        <section id="al-people" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={label} style={{ color: red }}>The people</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: ink }}>Contributors &amp; committee</h2></Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {d.leaders.map((l, i) => (
              <Reveal as="li" key={l.id} delay={(i % 4) * 70} className="text-center">
                <Img src={l.photo} seed={l.id} kind="portrait" palette={i % 2 ? 'plum' : 'teal'} alt={l.name} className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-md sm:h-40 sm:w-40" />
                <h3 className="mt-4 text-lg" style={{ fontFamily: HEAD, color: ink }}>{l.name}</h3><p className="text-sm opacity-65">{l.designation}</p>{l.bio && <p className="mx-auto mt-2 max-w-[16rem] text-xs leading-5 opacity-60">{l.bio}</p>}
              </Reveal>))}
          </ul>
        </section>
      )}

      {(d.has.gallery || d.has.videos) && (
        <section id="al-gallery" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-14">
          <Reveal><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: ink }}>Gallery</h2></Reveal>
          {d.has.gallery && <PhotoWall photos={d.photos} variant="mosaic" limit={10} kind="ink" palette="sand" cls={{ item: 'overflow-hidden rounded-2xl' }} />}
          {d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-2xl bg-white ring-1 ring-black/5' }} /></div>}
        </section>
      )}

      {d.has.news && (
        <section id="al-news" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-14">
          <Reveal><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: ink }}>From the journal</h2></Reveal>
          <ol className="divide-y divide-black/10 border-y border-black/10">
            {d.news.slice(0, 5).map((n, i) => <li key={n.id} className="grid gap-4 py-6 sm:grid-cols-[4rem_1fr]"><span className="text-5xl leading-none opacity-25" style={{ fontFamily: HEAD }}>{i + 1}</span><div><p className="text-xs font-bold uppercase tracking-widest" style={{ color: red }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-1 text-2xl" style={{ fontFamily: HEAD, color: ink }}>{n.title}</h3><p className="mt-2 opacity-75">{n.summary || n.content}</p></div></li>)}
          </ol>
        </section>
      )}

      {d.has.membership && d.membership && <section id="al-member" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-14"><Reveal><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: ink }}>Membership</h2></Reveal><MembershipBlock membership={d.membership} cls={{ tier: 'rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5', fee: 'mt-2 text-3xl font-bold' }} /></section>}

      {d.has.sponsors && <section aria-label="Supporters" className="border-t border-black/10 py-12"><div className="mx-auto max-w-5xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full bg-white px-5 py-2 text-sm font-semibold ring-1 ring-black/10' }} /></div></section>}

      <section id="al-contact" className="scroll-mt-20 px-5 py-16" style={{ background: red }}>
        <div className="mx-auto grid max-w-5xl gap-10 text-white md:grid-cols-2">
          <div><h2 className="text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Write to us</h2>
            <div className="mt-5 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>
            {d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: ink }} cls={{ input: 'w-full rounded-2xl bg-white/95 px-4 py-3 text-sm text-[#1B1B1F] placeholder-black/45 focus:outline-none focus:ring-2 focus:ring-white', button: 'rounded-full px-7 py-3 text-sm font-bold text-white', note: 'text-sm' }} />
        </div>
        <p className="mt-12 text-center text-xs text-white/75">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
