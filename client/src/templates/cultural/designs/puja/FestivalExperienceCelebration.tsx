import React, { useMemo } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DayTabs, DemoBadge, DonationBlock, EnquiryForm, GuideBlock, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCountdown, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Work+Sans:wght@400;500;600&display=swap';
const HEAD = 'Rubik, system-ui, sans-serif';
const BODY = '"Work Sans", system-ui, sans-serif';

const Clock: React.FC<{ to: Date | null }> = ({ to }) => {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  return <div role="timer" aria-label="Countdown to the festival" className="mt-7 flex gap-3">{([['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']] as const).map(([k, l]) => <div key={k} className="min-w-[4.4rem] rounded-2xl bg-white/15 px-3 py-3 text-center backdrop-blur"><span className="block text-3xl font-extrabold tabular-nums sm:text-4xl" style={{ fontFamily: HEAD }}>{String(c[k]).padStart(2, '0')}</span><span className="text-[10px] uppercase tracking-widest opacity-80">{l}</span></div>)}</div>;
};

/** Festival Experience & Celebration: immersive and celebratory. Full-bleed imagery bands, a live countdown, a scrolling strip of the festival's highlights and a big timetable. */
export const FestivalExperienceCelebration: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'indigo', coverKind: 'skyline' }), [props]);
  const sun = d.brand.accent || '#FFB400';
  const pink = d.brand.primary || '#E5338A';
  const start = d.days.find((x) => x.date)?.date || d.nextEvent?.date || null;
  const strip = [...d.days.map((x) => x.name), ...d.events.map((e) => e.title), ...d.activities.map((a) => a.title)].slice(0, 12);
  const band = (i: number) => d.photos[i]?.src;
  const items = ([d.has.schedule && ['Timetable', 'fe-time'], d.has.activities && ['Programmes', 'fe-prog'], d.has.events && ['Events', 'fe-events'], d.has.visitor && ['Visit', 'fe-visit'], (d.has.gallery || d.has.videos) && ['Gallery', 'fe-gallery'], d.has.donation && ['Give', 'fe-give'], ['Contact', 'fe-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="fe-top" className="sp-root min-h-screen bg-[#14123A] text-white" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('fe-top')} className="flex items-center gap-2.5 text-lg font-extrabold" style={{ fontFamily: HEAD }}><Img src={d.logo} seed="logo" alt="" className="h-9 w-9 rounded-xl object-cover" /><span className="hidden sm:inline">{d.shortName}</span></button>}
        items={items} cta={d.has.schedule ? ['Timetable', 'fe-time'] : undefined}
        cls={{ bar: 'sticky top-0 z-40 bg-[#14123A]/85 backdrop-blur-md', link: 'rounded-full px-3 py-2 text-sm font-semibold opacity-75 hover:bg-white/10 hover:opacity-100', active: '!opacity-100 bg-white/10', cta: 'rounded-full bg-[#FFB400] px-5 py-2 text-sm font-extrabold text-[#14123A]', mobilePanel: 'bg-[#14123A]' }}
      />

      <header className="relative isolate overflow-hidden">
        <Img src={d.hasCover ? d.cover : undefined} seed={d.name} kind="skyline" palette="night" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(120deg, #14123Acc 0%, ${pink}55 60%, #FFB40033 100%)` }} aria-hidden />
        <div className="mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center px-5 py-24">
          <Reveal>
            <span className="inline-block rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.25em] text-[#14123A]" style={{ background: sun }}>{[d.festival || 'Festival', d.edition].filter(Boolean).join(' · ')}</span>
            <h1 className="mt-6 max-w-4xl text-[clamp(2.6rem,8.5vw,6.8rem)] font-extrabold leading-[0.98] tracking-tight" style={{ fontFamily: HEAD }}>{d.name}</h1>
            {d.tagline && <p className="mt-5 max-w-2xl text-xl opacity-90">{d.tagline}</p>}
            {d.theme && <p className="mt-3 text-lg font-semibold" style={{ color: sun }}>Theme · {d.theme.name}</p>}
            <Clock to={start} />
            <div className="mt-9 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId(d.has.schedule ? 'fe-time' : 'fe-contact')} className="rounded-full px-8 py-4 text-base font-extrabold text-[#14123A]" style={{ background: sun }}>{d.has.schedule ? 'See the timetable' : 'Contact us'}</button>{d.has.visitor && <button type="button" onClick={() => scrollToId('fe-visit')} className="rounded-full border-2 border-white/70 px-8 py-4 text-base font-bold hover:bg-white/10">Plan your visit</button>}</div>
          </Reveal>
        </div>
      </header>

      {strip.length > 0 && <div className="sp-marquee-wrap overflow-hidden py-4" style={{ background: sun }} aria-hidden><div className="sp-marquee" style={{ ['--sp-speed' as string]: '45s' }}>{[0, 1].map((n) => <div key={n} className="flex shrink-0 items-center">{strip.map((m, i) => <span key={`${n}-${i}`} className="mx-5 whitespace-nowrap text-xl font-extrabold uppercase text-[#14123A]" style={{ fontFamily: HEAD }}>{m}<span className="mx-5 opacity-45">●</span></span>)}</div>)}</div></div>}

      {d.has.schedule && (
        <section id="fe-time" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
          <Reveal><h2 className="text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: HEAD }}>The timetable</h2><p className="mt-2 opacity-70">Every ritual, every day.</p></Reveal>
          <div className="mt-8"><DayTabs days={d.days} cls={{ tabs: 'sp-no-scrollbar flex gap-2 overflow-x-auto pb-2', tab: 'shrink-0 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold hover:bg-white/20', tabOn: '!bg-[#FFB400] !text-[#14123A]', panel: 'mt-4 rounded-[2rem] bg-white/[0.07] p-6 ring-1 ring-white/15 sm:p-8', ritual: 'flex gap-5 rounded-2xl px-3 py-2', time: 'w-28 shrink-0 text-lg font-extrabold text-[#FFB400]', key: 'bg-[#E5338A]/25', title: 'text-3xl font-extrabold', meta: 'text-sm opacity-70' }} /></div>
        </section>
      )}

      {band(0) && d.has.gallery && <div className="relative h-[46vh] overflow-hidden" aria-hidden><Img src={band(0)} seed="band1" kind="pandal" palette="night" alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-[#14123A]/35" /></div>}

      {d.has.activities && (
        <section id="fe-prog" className="scroll-mt-20 py-20" style={{ background: '#1C1A52' }}>
          <div className="mx-auto max-w-6xl px-5"><Reveal><h2 className="text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: HEAD }}>Cultural programmes</h2></Reveal>
            <ul className="mt-10 grid gap-5 md:grid-cols-2">{d.activities.map((a, i) => <Reveal as="li" key={a.id} delay={(i % 2) * 90} className="group relative overflow-hidden rounded-[2rem]"><Img src={a.image} seed={a.id} kind={i % 2 ? 'diya' : 'dhak'} palette={i % 2 ? 'marigold' : 'plum'} alt="" className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#14123A] via-[#14123A]/60 to-transparent p-6"><span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: sun }}>{a.category}</span><h3 className="mt-1 text-3xl font-extrabold leading-tight" style={{ fontFamily: HEAD }}>{a.title}</h3><p className="mt-1 text-sm opacity-85">{a.description}</p><p className="mt-2 text-xs opacity-70">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></div></Reveal>)}</ul></div>
        </section>
      )}

      {d.has.events && (
        <section id="fe-events" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
          <Reveal><h2 className="text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: HEAD }}>Happening</h2></Reveal>
          <ul className="mt-8 space-y-3">{[...d.upcoming, ...d.past.slice(0, 3)].map((e) => <li key={e.id} className="flex items-center gap-5 rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5"><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-[#14123A]" style={{ background: e.status === 'completed' ? '#9A98C8' : sun }}><span className="text-2xl font-extrabold leading-none" style={{ fontFamily: HEAD }}>{e.date ? e.date.getDate() : '·'}</span><span className="text-[10px] font-bold uppercase">{e.date ? e.date.toLocaleDateString('en-GB', { month: 'short' }) : ''}</span></div><div className="min-w-0"><h3 className="text-xl font-bold">{e.title}</h3><p className="text-sm opacity-70">{[e.time, e.venue].filter(Boolean).join(' · ')}</p></div></li>)}</ul>
        </section>
      )}

      {d.has.visitor && d.guide && <section id="fe-visit" className="scroll-mt-20 py-20" style={{ background: `${pink}22` }}><div className="mx-auto max-w-5xl px-5"><Reveal><h2 className="mb-8 text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: HEAD }}>Visit the festival</h2></Reveal><GuideBlock guide={d.guide} cls={{ cell: 'rounded-3xl bg-white/[0.08] p-4 ring-1 ring-white/15', label: 'text-[11px] font-extrabold uppercase tracking-widest text-[#FFB400]' }} /></div></section>}

      {(d.has.gallery || d.has.videos) && <section id="fe-gallery" className="scroll-mt-20 py-20"><div className="mx-auto max-w-7xl px-5"><Reveal><h2 className="mb-8 text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: HEAD }}>Gallery</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="mosaic" limit={10} kind="skyline" palette="night" cls={{ item: 'overflow-hidden rounded-3xl' }} />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10', title: 'p-3 text-sm font-semibold' }} /></div>}</div></section>}

      {d.has.donation && d.donation && <section id="fe-give" className="scroll-mt-20 py-20 text-[#14123A]" style={{ background: sun }}><div className="mx-auto max-w-4xl px-5"><Reveal><h2 className="mb-6 text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>{d.donation.title || 'Support the festival'}</h2></Reveal><DonationBlock donation={d.donation} cls={{ cause: 'rounded-2xl bg-white/45 p-4', amount: 'rounded-full border border-[#14123A]/40 px-2.5 py-0.5 text-xs font-bold' }} /></div></section>}

      {d.leaders.length > 0 && <section className="mx-auto max-w-6xl px-5 py-16"><Reveal><h2 className="mb-6 text-3xl font-extrabold" style={{ fontFamily: HEAD }}>Organising committee</h2></Reveal><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.leaders.map((l) => <li key={l.id} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10"><h3 className="font-bold">{l.name}</h3><p className="text-sm" style={{ color: sun }}>{l.designation}</p></li>)}</ul></section>}

      {d.has.news && <section className="mx-auto max-w-4xl px-5 pb-16"><ul className="space-y-3">{d.news.slice(0, 4).map((n) => <li key={n.id} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10"><p className="text-xs font-bold uppercase tracking-widest opacity-60">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-1 text-xl font-bold" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-1 opacity-80">{n.summary || n.content}</p></li>)}</ul></section>}

      {d.has.sponsors && <section aria-label="Partners" className="border-y border-white/10 py-14"><div className="mx-auto max-w-6xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/15', tier: 'mb-3 text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-60', logo: 'h-9 w-auto max-w-[150px] object-contain brightness-0 invert' }} /></div></section>}

      <section id="fe-contact" className="scroll-mt-20 py-20" style={{ background: `linear-gradient(135deg, ${pink}, #5B1B8E)` }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2">
          <div><h2 className="text-5xl font-extrabold leading-none sm:text-6xl" style={{ fontFamily: HEAD }}>Come celebrate with us.</h2><div className="mt-6 space-y-1.5">{d.contactPerson && <p>{d.contactPerson}</p>}{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold hover:bg-white/30" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: sun, color: '#14123A' }} cls={{ input: 'w-full rounded-2xl bg-white/15 px-4 py-3 text-sm text-white placeholder-white/65 ring-1 ring-white/25 focus:outline-none focus:ring-2 focus:ring-white', button: 'rounded-full px-8 py-3.5 text-sm font-extrabold', note: 'text-sm' }} />
        </div>
        <p className="mt-12 text-center text-xs opacity-80">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
