import React, { useMemo, useState } from 'react';
import { CalendarDays, HeartHandshake, Palette, Users } from 'lucide-react';
import type { CulturalTemplateProps } from '../../types';
import { DemoBadge, EnquiryForm, Img, MembershipBlock, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@400;500;600;700&display=swap';
const HEAD = 'Fredoka, system-ui, sans-serif';
const BODY = 'Quicksand, system-ui, sans-serif';

/** Community Cultural Association: warm and welcoming. Rounded cards, a clear "join us" path, an upcoming/past events toggle and a notice board. */
export const CommunityCulturalAssociation: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'teal', coverKind: 'textile' }), [props]);
  const teal = d.brand.primary || '#0F6E6B';
  const amber = d.brand.accent || '#F0A12B';
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const list = when === 'upcoming' ? d.upcoming : d.past;
  const items = ([d.has.activities && ['What we do', 'cc-do'], d.has.events && ['Events', 'cc-events'], d.has.leadership && ['Our team', 'cc-team'], d.has.news && ['Notice board', 'cc-board'], (d.has.gallery || d.has.videos) && ['Gallery', 'cc-gallery'], d.has.membership && ['Join us', 'cc-join'], ['Contact', 'cc-contact']].filter(Boolean) as [string, string][]);
  const icons = [Palette, Users, CalendarDays, HeartHandshake];
  const card = 'rounded-[1.75rem] bg-white shadow-[0_6px_24px_-12px_rgba(15,110,107,.35)] ring-1 ring-[#0F6E6B]/10';

  return (
    <div id="cc-top" className="sp-root min-h-screen bg-[#FFF8EC] text-[#1D3A39]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('cc-top')} className="flex items-center gap-2.5 text-xl font-semibold" style={{ fontFamily: HEAD, color: teal }}><Img src={d.logo} seed="logo" alt="" className="h-10 w-10 rounded-2xl object-cover" />{d.shortName}</button>}
        items={items} cta={[d.has.membership ? 'Become a member' : 'Say hello', d.has.membership ? 'cc-join' : 'cc-contact']}
        cls={{ bar: 'sticky top-0 z-40 bg-[#FFF8EC]/92 backdrop-blur shadow-[0_1px_0_rgba(15,110,107,.12)]', link: 'rounded-full px-3.5 py-2 text-sm font-semibold hover:bg-[#0F6E6B]/10', active: 'bg-[#0F6E6B]/10', cta: 'rounded-full bg-[#F0A12B] px-5 py-2 text-sm font-bold text-[#3A2400] shadow', mobilePanel: 'border-t border-[#0F6E6B]/15 bg-[#FFF8EC]' }}
      />

      <header className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <Reveal>
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: `${amber}33`, color: '#7A4B00' }}>{[d.festival, d.established ? `Since ${d.established}` : '', d.place].filter(Boolean).join(' · ') || 'Our community'}</span>
          <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.05]" style={{ fontFamily: HEAD, color: teal }}>{d.name}</h1>
          {d.tagline && <p className="mt-4 text-xl leading-8">{d.tagline}</p>}
          {d.has.about && <p className="mt-3 max-w-xl leading-7 opacity-80">{d.description.slice(0, 240)}{d.description.length > 240 ? '…' : ''}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => scrollToId(d.has.events ? 'cc-events' : 'cc-contact')} className="rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg" style={{ background: teal }}>{d.has.events ? 'See upcoming events' : 'Get in touch'}</button>
            {d.has.membership && <button type="button" onClick={() => scrollToId('cc-join')} className="rounded-full border-2 px-7 py-3.5 text-sm font-bold" style={{ borderColor: teal, color: teal }}>Join the association</button>}
          </div>
        </Reveal>
        <Reveal from="scale" delay={120} className="relative">
          <div className="absolute -right-4 -top-4 h-full w-full rounded-[3rem]" style={{ background: amber }} aria-hidden />
          <Img src={d.cover} seed="cover" kind="textile" palette="teal" alt="" loading="eager" className="relative aspect-[5/4] w-full rounded-[3rem] object-cover" />
        </Reveal>
      </header>

      {d.stats.length > 0 && <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4 px-5 pb-6">{d.stats.slice(0, 4).map((s) => <li key={s.label} className={`${card} min-w-[8.5rem] flex-1 px-5 py-4 text-center`}><span className="block text-3xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>{s.value}</span><span className="text-xs font-bold uppercase tracking-widest opacity-60">{s.label}</span></li>)}</ul>}

      {d.has.activities && (
        <section id="cc-do" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal className="text-center"><h2 className="text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>What we do together</h2></Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {d.activities.map((a, i) => { const Icon = icons[i % icons.length]; return (
              <Reveal as="li" key={a.id} delay={(i % 3) * 80} className={`${card} p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${amber}40`, color: teal }}><Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-2xl font-semibold" style={{ fontFamily: HEAD }}>{a.title}</h3>
                <p className="mt-2 leading-7 opacity-80">{a.description}</p>
                <p className="mt-3 text-sm font-semibold" style={{ color: teal }}>{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p>
                {a.registration && <span className="mt-3 inline-block rounded-full bg-[#0F6E6B]/10 px-3 py-1 text-xs font-bold">Registration needed</span>}
              </Reveal>); })}
          </ul>
        </section>
      )}

      {d.has.events && (
        <section id="cc-events" className="scroll-mt-20 py-16" style={{ background: `${teal}12` }}>
          <div className="mx-auto max-w-4xl px-5">
            <Reveal className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>Events</h2>
              <div role="group" aria-label="Show events" className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">{(['upcoming', 'past'] as const).map((w) => <button key={w} type="button" aria-pressed={when === w} onClick={() => setWhen(w)} className={`rounded-full px-5 py-2 text-sm font-bold capitalize ${when === w ? 'text-white' : ''}`} style={when === w ? { background: teal } : undefined}>{w} ({w === 'upcoming' ? d.upcoming.length : d.past.length})</button>)}</div></Reveal>
            {list.length === 0 ? <p className="mt-8 rounded-2xl bg-white p-6 text-center opacity-75">No {when} events listed right now.</p> : (
              <ul className="mt-8 space-y-4">{list.map((e) => (
                <li key={e.id} className={`${card} flex gap-5 p-5`}>
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ background: teal }}><span className="text-3xl font-semibold leading-none" style={{ fontFamily: HEAD }}>{e.date ? e.date.getDate() : '·'}</span><span className="text-xs uppercase tracking-widest">{e.date ? e.date.toLocaleDateString('en-GB', { month: 'short' }) : ''}</span></div>
                  <div><h3 className="text-xl font-semibold" style={{ fontFamily: HEAD }}>{e.title}</h3><p className="text-sm font-semibold opacity-70">{[e.time, e.venue].filter(Boolean).join(' · ')}</p><p className="mt-1 opacity-80">{e.description}</p>{e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold underline" style={{ color: teal }}>Register here</a>}</div>
                </li>))}</ul>)}
          </div>
        </section>
      )}

      {d.has.leadership && (
        <section id="cc-team" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal className="text-center"><h2 className="text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>Meet our team</h2></Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">{d.leaders.map((l, i) => (
            <Reveal as="li" key={l.id} delay={(i % 4) * 70} className={`${card} p-5 text-center`}>
              <Img src={l.photo} seed={l.id} kind="portrait" palette={i % 2 ? 'saffron' : 'teal'} alt={l.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#F0A12B]/50" />
              <h3 className="mt-3 text-lg font-semibold" style={{ fontFamily: HEAD }}>{l.name}</h3><p className="text-sm font-semibold" style={{ color: teal }}>{l.designation}</p>
            </Reveal>))}</ul>
        </section>
      )}

      {d.has.news && (
        <section id="cc-board" className="scroll-mt-20 py-16" style={{ background: `${amber}22` }}>
          <div className="mx-auto max-w-6xl px-5"><Reveal><h2 className="text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>Notice board</h2></Reveal>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">{d.news.slice(0, 6).map((n, i) => <li key={n.id} className="relative rounded-2xl bg-[#FFFDF6] p-5 shadow-md" style={{ transform: `rotate(${(i % 3 - 1) * 1.2}deg)` }}><span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full" style={{ background: teal }} aria-hidden /><p className="text-xs font-bold uppercase tracking-widest opacity-60">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-2 text-xl font-semibold" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-2 text-sm leading-6 opacity-80">{n.summary || n.content}</p></li>)}</ul></div>
        </section>
      )}

      {(d.has.gallery || d.has.videos) && <section id="cc-gallery" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"><Reveal><h2 className="mb-8 text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>{d.has.gallery ? 'Moments we shared' : 'Watch'}</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="grid" kind="textile" palette="teal" cls={{ item: 'overflow-hidden rounded-3xl shadow-md', caption: 'block bg-white p-2 text-xs' }} />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-3xl bg-white shadow-md' }} /></div>}</section>}

      {d.has.membership && d.membership && <section id="cc-join" className="scroll-mt-20 py-16" style={{ background: teal }}><div className="mx-auto max-w-5xl px-5 text-white"><Reveal><h2 className="mb-2 text-4xl font-semibold" style={{ fontFamily: HEAD }}>Join our association</h2><p className="mb-8 max-w-xl opacity-85">Becoming a member helps us keep our programmes going.</p></Reveal><MembershipBlock membership={d.membership} cls={{ tier: 'rounded-3xl bg-white p-6 text-[#1D3A39]', fee: 'mt-2 text-3xl font-semibold text-[#0F6E6B]', note: 'max-w-2xl text-sm opacity-90' }} /></div></section>}

      {d.has.sponsors && <section aria-label="Supporters" className="py-12"><div className="mx-auto max-w-5xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full bg-white px-5 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5' }} /></div></section>}

      <section id="cc-contact" className="mx-auto grid max-w-5xl scroll-mt-20 gap-10 px-5 py-16 md:grid-cols-2">
        <div><h2 className="text-4xl font-semibold" style={{ fontFamily: HEAD, color: teal }}>Come and say hello</h2><div className="mt-5 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: teal }} cls={{ input: 'w-full rounded-2xl border-2 border-[#0F6E6B]/20 bg-white px-4 py-3 text-sm focus:border-[#0F6E6B] focus:outline-none', button: 'rounded-full px-7 py-3 text-sm font-bold text-white', note: 'text-sm' }} />
      </section>
      <footer className="py-8 text-center text-xs opacity-60">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
