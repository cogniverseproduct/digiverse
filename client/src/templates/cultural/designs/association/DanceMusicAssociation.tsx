import React, { useMemo } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DemoBadge, EnquiryForm, Img, MembershipBlock, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCountdown, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Marcellus&family=Nunito+Sans:wght@400;600;700&display=swap';
const HEAD = 'Marcellus, Georgia, serif';
const BODY = '"Nunito Sans", system-ui, sans-serif';

const Count: React.FC<{ to: Date | null; accent: string }> = ({ to, accent }) => {
  const c = useCountdown(to);
  if (!c || c.done) return null;
  return <div role="timer" aria-label="Time to the next performance" className="mt-8 flex gap-3">{([['d', 'Days'], ['h', 'Hours'], ['m', 'Min'], ['s', 'Sec']] as const).map(([k, l]) => <div key={k} className="min-w-[4.2rem] rounded-xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/15"><span className="block text-3xl font-bold tabular-nums" style={{ color: accent }}>{String(c[k]).padStart(2, '0')}</span><span className="text-[10px] uppercase tracking-widest opacity-70">{l}</span></div>)}</div>;
};

/** Dance & Music Association: a dark stage. Curtains and a spotlight, a countdown to the next performance, programmes by discipline and a performance bill. */
export const DanceMusicAssociation: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'plum', coverKind: 'stage' }), [props]);
  const gold = d.brand.accent || '#F2A33A';
  const plum = d.brand.primary || '#2A0E3C';
  const disciplines = useMemo(() => Array.from(new Set(d.activities.map((a) => a.category))), [d.activities]);
  const items = ([d.has.events && ['Performances', 'dm-bill'], d.has.activities && ['Disciplines', 'dm-disc'], d.has.leadership && ['Faculty', 'dm-faculty'], d.has.videos && ['Reel', 'dm-reel'], d.has.gallery && ['Gallery', 'dm-gallery'], d.has.membership && ['Join', 'dm-join'], ['Contact', 'dm-contact']].filter(Boolean) as [string, string][]);
  const label = 'text-[11px] font-bold uppercase tracking-[0.32em]';

  return (
    <div id="dm-top" className="sp-root min-h-screen bg-[#120818] text-[#F6EEF8]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('dm-top')} className="flex items-center gap-3 text-xl" style={{ fontFamily: HEAD }}><Img src={d.logo} seed="logo" alt="" className="h-9 w-9 rounded-full object-cover ring-2" style={{ ['--tw-ring-color' as string]: gold }} />{d.shortName}</button>}
        items={items} cta={d.nextEvent ? ['Next show', 'dm-bill'] : undefined}
        cls={{ bar: 'sticky top-0 z-40 border-b border-white/10 bg-[#120818]/85 backdrop-blur', link: 'px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] opacity-80 hover:opacity-100', active: '!opacity-100 underline decoration-2 underline-offset-8', cta: 'rounded-full bg-[#F2A33A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#2A0E3C]', mobilePanel: 'border-t border-white/10 bg-[#120818]' }}
      />

      <header className="relative isolate overflow-hidden">
        <Img src={d.hasCover ? d.cover : undefined} seed={d.name} kind="stage" palette="plum" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(180deg, ${plum}cc 0%, #120818 96%)` }} aria-hidden />
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:pt-28">
          <Reveal><p className={label} style={{ color: gold }}>{[d.festival, d.established ? `Since ${d.established}` : '', d.place].filter(Boolean).join(' · ') || 'Dance · Music · Performance'}</p>
            <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.6rem,8vw,6.2rem)] leading-[1.02]" style={{ fontFamily: HEAD }}>{d.name}</h1>
            {d.tagline && <p className="mx-auto mt-6 max-w-2xl text-xl opacity-85">{d.tagline}</p>}</Reveal>
          {d.nextEvent && <Reveal delay={100} className="mx-auto mt-8 max-w-xl"><p className="text-sm opacity-75">Next: <b>{d.nextEvent.title}</b>{d.nextEvent.date ? ` · ${fmtDate(d.nextEvent.date)}` : ''}</p><div className="flex justify-center"><Count to={d.nextEvent.date} accent={gold} /></div></Reveal>}
          <div className="mt-10 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => scrollToId(d.has.events ? 'dm-bill' : 'dm-contact')} className="rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[0.25em] text-[#2A0E3C]" style={{ background: gold }}>{d.has.events ? 'View the bill' : 'Get in touch'}</button>{d.has.activities && <button type="button" onClick={() => scrollToId('dm-disc')} className="rounded-full border border-white/40 px-7 py-3 text-xs font-bold uppercase tracking-[0.25em] hover:bg-white/10">Our disciplines</button>}</div>
        </div>
      </header>

      {d.has.events && (
        <section id="dm-bill" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
          <Reveal className="text-center"><p className={label} style={{ color: gold }}>Performance bill</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>On stage</h2></Reveal>
          <ul className="mt-10 space-y-4">
            {[...d.upcoming, ...d.past.slice(0, 3)].map((e) => (
              <Reveal as="li" key={e.id} className={`relative grid gap-4 overflow-hidden rounded-2xl p-5 ring-1 ring-white/15 sm:grid-cols-[110px_1fr_auto] sm:items-center ${e.status === 'completed' ? 'opacity-60' : 'bg-white/[0.06]'}`}>
                <div className="text-center sm:border-r sm:border-dashed sm:border-white/25 sm:pr-4"><span className="block text-5xl leading-none" style={{ fontFamily: HEAD, color: gold }}>{e.date ? e.date.getDate() : '·'}</span><span className="text-xs uppercase tracking-widest opacity-75">{e.date ? e.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}</span></div>
                <div><h3 className="text-2xl" style={{ fontFamily: HEAD }}>{e.title}</h3><p className="mt-1 text-sm opacity-75">{[e.category, e.time, e.venue].filter(Boolean).join(' · ')}</p>{e.description && <p className="mt-2 text-sm opacity-70">{e.description}</p>}</div>
                {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-[#2A0E3C]" style={{ background: gold }}>Reserve</a> : <span className="text-center text-xs uppercase tracking-widest opacity-60">{e.status === 'completed' ? 'Performed' : e.status}</span>}
              </Reveal>))}
          </ul>
        </section>
      )}

      {d.has.activities && (
        <section id="dm-disc" className="scroll-mt-20 py-16" style={{ background: plum }}>
          <div className="mx-auto max-w-6xl px-5">
            <Reveal><p className={label} style={{ color: gold }}>Learn &amp; perform</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Disciplines</h2>{disciplines.length > 1 && <p className="mt-3 text-sm opacity-75">{disciplines.join(' · ')}</p>}</Reveal>
            <ul className="sp-no-scrollbar -mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-4">
              {d.activities.map((a, i) => (
                <li key={a.id} className="w-[19rem] shrink-0 snap-start overflow-hidden rounded-3xl bg-[#120818] ring-1 ring-white/15">
                  <Img src={a.image} seed={a.id} kind={i % 2 ? 'dhak' : 'stage'} palette={i % 2 ? 'marigold' : 'plum'} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-5"><span className={label} style={{ color: gold }}>{a.category}</span><h3 className="mt-2 text-2xl" style={{ fontFamily: HEAD }}>{a.title}</h3><p className="mt-2 text-sm leading-6 opacity-75">{a.description}</p><p className="mt-3 text-xs opacity-60">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></div>
                </li>))}
            </ul>
          </div>
        </section>
      )}

      {d.has.leadership && (
        <section id="dm-faculty" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={label} style={{ color: gold }}>The company</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Faculty &amp; committee</h2></Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {d.leaders.map((l, i) => (
              <Reveal as="li" key={l.id} delay={(i % 3) * 80} className="flex gap-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
                <Img src={l.photo} seed={l.id} kind="portrait" palette="plum" alt={l.name} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                <div><h3 className="text-xl" style={{ fontFamily: HEAD }}>{l.name}</h3><p className="text-sm" style={{ color: gold }}>{l.designation}</p>{l.bio && <p className="mt-1 text-xs leading-5 opacity-70">{l.bio}</p>}</div>
              </Reveal>))}
          </ul>
        </section>
      )}

      {d.has.videos && <section id="dm-reel" className="scroll-mt-20 border-y border-white/10 bg-black/30 py-16"><div className="mx-auto max-w-6xl px-5"><Reveal><p className={label} style={{ color: gold }}>Watch</p><h2 className="mb-8 mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Performance reel</h2></Reveal><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-2xl bg-[#1E0E29] ring-1 ring-white/10', title: 'p-3 text-sm opacity-85' }} /></div></section>}

      {d.has.gallery && <section id="dm-gallery" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"><Reveal><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>From the wings</h2></Reveal><PhotoWall photos={d.photos} variant="strip" kind="stage" palette="plum" cls={{ item: 'overflow-hidden rounded-2xl ring-1 ring-white/10', caption: 'block p-2 text-xs opacity-70' }} /></section>}

      {d.has.membership && d.membership && <section id="dm-join" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-14"><Reveal><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Join the association</h2></Reveal><MembershipBlock membership={d.membership} cls={{ tier: 'rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15', fee: 'mt-2 text-3xl font-bold text-[#F2A33A]' }} /></section>}

      {d.has.sponsors && <section aria-label="Patrons" className="border-t border-white/10 py-12"><div className="mx-auto max-w-5xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full bg-white/10 px-5 py-2 text-sm font-semibold ring-1 ring-white/15', tier: 'mb-3 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60' }} /></div></section>}

      <section id="dm-contact" className="scroll-mt-20 border-t border-white/10 py-16" style={{ background: plum }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2">
          <div><h2 className="text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Book a seat, join a class</h2>
            <div className="mt-5 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>
            {d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: gold, color: plum }} cls={{ input: 'w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/55 focus:border-white focus:outline-none', button: 'rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[0.25em]', note: 'text-sm' }} />
        </div>
        <p className="mt-12 text-center text-xs opacity-60">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
