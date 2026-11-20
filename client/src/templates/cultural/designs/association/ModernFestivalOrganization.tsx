import React, { useMemo, useState } from 'react';
import type { CulturalTemplateProps } from '../../types';
import type { CEvent } from '../../kit/data';
import { DemoBadge, EnquiryForm, Img, MembershipBlock, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600&display=swap';
const HEAD = '"Space Grotesk", system-ui, sans-serif';
const BODY = 'Inter, system-ui, sans-serif';

/** Modern Festival & Cultural Organization: loud and kinetic. Giant type, a marquee of the programme, counters and a lineup split into day tabs. */
export const ModernFestivalOrganization: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'night', coverKind: 'skyline' }), [props]);
  const hot = d.brand.primary || '#FF4D2E';
  const sun = d.brand.accent || '#FFD23F';
  const days = useMemo(() => {
    const m = new Map<string, { label: string; items: CEvent[] }>();
    d.events.forEach((e) => { const k = e.date ? e.date.toDateString() : 'tba'; const g = m.get(k) || { label: e.date ? fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'short' }) : 'Date to be announced', items: [] }; g.items.push(e); m.set(k, g); });
    return Array.from(m.values());
  }, [d.events]);
  const [day, setDay] = useState(0);
  const marquee = [...d.events.map((e) => e.title), ...d.activities.map((a) => a.title)].slice(0, 10);
  const items = ([d.has.events && ['Lineup', 'mf-line'], d.has.activities && ['Programme', 'mf-prog'], d.has.gallery && ['Highlights', 'mf-gallery'], d.has.videos && ['Watch', 'mf-watch'], d.has.sponsors && ['Partners', 'mf-partners'], d.has.membership && ['Join', 'mf-join'], ['Contact', 'mf-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="mf-top" className="sp-root min-h-screen bg-[#0A0A0F] text-white" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('mf-top')} className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight" style={{ fontFamily: HEAD }}><span className="inline-block h-3 w-3 rotate-45" style={{ background: hot }} aria-hidden />{d.shortName}</button>}
        items={items} cta={d.has.events ? ['Lineup', 'mf-line'] : undefined}
        cls={{ bar: 'sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-md', link: 'px-3 py-2 text-xs font-bold uppercase tracking-widest opacity-70 hover:opacity-100', active: '!opacity-100', cta: 'bg-[#FFD23F] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black', mobilePanel: 'border-t border-white/10 bg-[#0A0A0F]' }}
      />

      <header className="relative isolate flex min-h-[88vh] items-end overflow-hidden">
        <Img src={d.hasCover ? d.cover : undefined} seed={d.name} kind="skyline" palette="night" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/60 to-[#0A0A0F]/20" aria-hidden />
        <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-32">
          <Reveal><p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: sun }}>{[d.festival, d.nextEvent?.date ? fmtDate(d.nextEvent.date, { day: 'numeric', month: 'long', year: 'numeric' }) : '', d.place].filter(Boolean).join(' / ') || 'Festival of culture'}</p>
            <h1 className="mt-4 text-[clamp(3rem,12vw,10rem)] font-bold uppercase leading-[0.88] tracking-tighter" style={{ fontFamily: HEAD }}>{d.name}</h1>
            {d.tagline && <p className="mt-6 max-w-2xl text-xl opacity-85">{d.tagline}</p>}
            <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId(d.has.events ? 'mf-line' : 'mf-contact')} className="px-8 py-4 text-sm font-bold uppercase tracking-widest text-black" style={{ background: sun }}>{d.has.events ? 'See the lineup' : 'Contact us'}</button>{d.has.activities && <button type="button" onClick={() => scrollToId('mf-prog')} className="border-2 border-white/60 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/10">Programme</button>}</div></Reveal>
        </div>
      </header>

      {marquee.length > 0 && <div className="sp-marquee-wrap overflow-hidden border-y border-white/10 py-4" style={{ background: hot }} aria-hidden><div className="sp-marquee" style={{ ['--sp-speed' as string]: '38s' }}>{[0, 1].map((n) => <div key={n} className="flex shrink-0 items-center">{marquee.map((m, i) => <span key={`${n}-${i}`} className="mx-6 whitespace-nowrap text-2xl font-bold uppercase tracking-tight text-black" style={{ fontFamily: HEAD }}>{m} <span className="mx-6 opacity-50">✦</span></span>)}</div>)}</div></div>}

      {d.stats.length > 0 && <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 px-0 md:grid-cols-4">{d.stats.slice(0, 4).map((s) => <li key={s.label} className="bg-[#0A0A0F] px-6 py-10"><span className="block text-5xl font-bold tracking-tighter sm:text-6xl" style={{ fontFamily: HEAD, color: sun }}>{s.value}</span><span className="mt-2 block text-xs font-bold uppercase tracking-[0.25em] opacity-60">{s.label}</span></li>)}</ul>}

      {d.has.events && (
        <section id="mf-line" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
          <Reveal><p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: hot }}>The lineup</p><h2 className="mt-2 text-5xl font-bold uppercase tracking-tighter sm:text-7xl" style={{ fontFamily: HEAD }}>Day by day</h2></Reveal>
          {days.length > 1 && <div role="tablist" aria-label="Festival days" className="sp-no-scrollbar mt-8 flex gap-2 overflow-x-auto">{days.map((g, i) => <button key={g.label} role="tab" type="button" aria-selected={i === day} onClick={() => setDay(i)} className={`shrink-0 border-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition ${i === day ? 'text-black' : 'border-white/30 hover:border-white'}`} style={i === day ? { background: sun, borderColor: sun } : undefined}>{g.label}</button>)}</div>}
          <ul role="tabpanel" className="mt-6 divide-y divide-white/15 border-y border-white/15">
            {(days[Math.min(day, days.length - 1)]?.items || []).map((e) => (
              <li key={e.id} className="grid gap-3 py-6 md:grid-cols-[9rem_1fr_auto] md:items-center">
                <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: HEAD, color: sun }}>{e.time || 'All day'}</span>
                <div><h3 className="text-2xl font-bold uppercase tracking-tight" style={{ fontFamily: HEAD }}>{e.title}</h3><p className="mt-1 text-sm opacity-75">{[e.category, e.venue].filter(Boolean).join(' · ')}</p>{e.description && <p className="mt-2 max-w-2xl opacity-70">{e.description}</p>}</div>
                {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-black" style={{ background: sun }}>Register</a> : <span />}
              </li>))}
          </ul>
        </section>
      )}

      {d.has.activities && (
        <section id="mf-prog" className="scroll-mt-20 border-y border-white/10 bg-white/[0.03] py-20">
          <div className="mx-auto max-w-7xl px-5"><Reveal><h2 className="text-5xl font-bold uppercase tracking-tighter sm:text-7xl" style={{ fontFamily: HEAD }}>Programme</h2></Reveal>
            <ul className="mt-10 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">{d.activities.map((a, i) => <Reveal as="li" key={a.id} delay={(i % 3) * 70} className="bg-[#0A0A0F] p-7"><span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: hot }}>{String(i + 1).padStart(2, '0')} · {a.category}</span><h3 className="mt-3 text-3xl font-bold uppercase leading-none tracking-tight" style={{ fontFamily: HEAD }}>{a.title}</h3><p className="mt-3 text-sm leading-6 opacity-70">{a.description}</p><p className="mt-4 text-xs opacity-55">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></Reveal>)}</ul></div>
        </section>
      )}

      {d.has.gallery && <section id="mf-gallery" className="scroll-mt-20 py-20"><div className="mx-auto max-w-7xl px-5"><Reveal><h2 className="mb-8 text-5xl font-bold uppercase tracking-tighter sm:text-7xl" style={{ fontFamily: HEAD }}>Highlights</h2></Reveal><PhotoWall photos={d.photos} variant="mosaic" limit={10} kind="skyline" palette="night" cls={{ item: 'overflow-hidden' }} /></div></section>}
      {d.has.videos && <section id="mf-watch" className="scroll-mt-20 pb-20"><div className="mx-auto max-w-7xl px-5"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden bg-white/5 ring-1 ring-white/10', title: 'p-3 text-sm font-bold uppercase tracking-wide' }} /></div></section>}

      {d.has.sponsors && <section id="mf-partners" className="scroll-mt-20 border-y border-white/10 py-16"><div className="mx-auto max-w-7xl px-5"><Reveal><h2 className="mb-8 text-3xl font-bold uppercase tracking-tighter" style={{ fontFamily: HEAD }}>Partners</h2></Reveal><SponsorTiers sponsors={d.sponsors} cls={{ item: 'border border-white/25 px-5 py-3 text-sm font-bold uppercase tracking-wider', tier: 'mb-3 text-[11px] font-bold uppercase tracking-[0.3em] opacity-55', logo: 'h-10 w-auto max-w-[150px] object-contain brightness-0 invert' }} /></div></section>}

      {d.has.membership && d.membership && <section id="mf-join" className="scroll-mt-20 py-20"><div className="mx-auto max-w-6xl px-5"><Reveal><h2 className="mb-8 text-5xl font-bold uppercase tracking-tighter" style={{ fontFamily: HEAD }}>Join us</h2></Reveal><MembershipBlock membership={d.membership} cls={{ tier: 'border border-white/20 bg-white/[0.04] p-6', fee: 'mt-2 text-4xl font-bold', note: 'max-w-2xl text-sm opacity-75' }} /></div></section>}

      <section id="mf-contact" className="scroll-mt-20 py-20 text-black" style={{ background: sun }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div><h2 className="text-5xl font-bold uppercase leading-none tracking-tighter sm:text-7xl" style={{ fontFamily: HEAD }}>Be there.</h2><div className="mt-6 space-y-1.5 font-medium">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: '#0A0A0F' }} cls={{ input: 'w-full border-2 border-black bg-white/60 px-4 py-3 text-sm placeholder-black/50 focus:bg-white focus:outline-none', button: 'px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white', note: 'text-sm font-medium' }} />
        </div>
        <p className="mt-12 text-center text-xs font-bold uppercase tracking-[0.3em] opacity-70">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
