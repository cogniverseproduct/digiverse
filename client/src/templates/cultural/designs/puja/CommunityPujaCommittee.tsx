import React, { useMemo, useState } from 'react';
import { Bus, Clock, MapPin, Sparkles } from 'lucide-react';
import type { CulturalTemplateProps } from '../../types';
import { DayTabs, DemoBadge, DonationBlock, EnquiryForm, GuideBlock, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mailto, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;600;700;800&family=Mukta:wght@400;500;600;700&display=swap';
const HEAD = '"Baloo Da 2", system-ui, sans-serif';
const BODY = 'Mukta, system-ui, sans-serif';

/** Community Puja Committee: participation first. Quick-answer cards (when, where, how to help), a programme calendar, notices, and volunteer and donor paths. */
export const CommunityPujaCommittee: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'marigold', coverKind: 'diya' }), [props]);
  const orange = d.brand.primary || '#E4572E';
  const green = d.brand.accent || '#2E8B57';
  const [tab, setTab] = useState<'schedule' | 'programmes'>(d.has.schedule ? 'schedule' : 'programmes');
  const first = d.days[0];
  const quick = ([
    d.has.schedule && first && [Clock, 'Puja begins', [first.name, first.dateText].filter(Boolean).join(' · '), 'cp-program'],
    d.guide?.hours && [Clock, 'Open for darshan', d.guide.hours, 'cp-visit'],
    d.guide?.location && [MapPin, 'Where', d.guide.location, 'cp-visit'],
    (d.guide?.metro || d.guide?.bus || d.guide?.railway) && [Bus, 'Getting there', [d.guide?.metro, d.guide?.railway, d.guide?.bus].filter(Boolean).join(' · '), 'cp-visit']
  ].filter(Boolean) as [React.ElementType, string, string, string][]).slice(0, 4);
  const items = ([(d.has.schedule || d.has.activities) && ['Programme', 'cp-program'], d.has.visitor && ['Visit us', 'cp-visit'], d.has.news && ['Announcements', 'cp-news'], (d.has.gallery || d.has.videos) && [d.has.gallery ? 'Photos' : 'Videos', 'cp-photos'], d.has.leadership && ['Our team', 'cp-team'], ['Volunteer', 'cp-help'], ['Contact', 'cp-contact']].filter(Boolean) as [string, string][]);
  const card = 'rounded-3xl bg-white shadow-[0_8px_26px_-14px_rgba(228,87,46,.5)] ring-1 ring-[#E4572E]/10';

  return (
    <div id="cp-top" className="sp-root min-h-screen bg-[#FFF9F0] text-[#33241C]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('cp-top')} className="flex items-center gap-2.5 text-xl font-bold" style={{ fontFamily: HEAD, color: orange }}><Img src={d.logo} seed="logo" alt="" className="h-10 w-10 rounded-2xl object-cover" />{d.shortName}</button>}
        items={items} cta={d.has.donation ? ['Donate', 'cp-give'] : ['Volunteer', 'cp-help']}
        cls={{ bar: 'sticky top-0 z-40 bg-[#FFF9F0]/95 shadow-sm backdrop-blur', link: 'rounded-full px-3 py-2 text-[15px] font-semibold hover:bg-[#E4572E]/10', active: 'bg-[#E4572E]/10 text-[#E4572E]', cta: 'rounded-full bg-[#2E8B57] px-5 py-2 text-sm font-bold text-white shadow', mobilePanel: 'border-t bg-[#FFF9F0]' }}
      />

      <header className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${orange}, #F29A2E)` }}>
        <Img src={d.hasCover ? d.cover : undefined} seed={d.name} kind="diya" palette="marigold" alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-multiply" />
        <div className="relative mx-auto max-w-5xl px-5 pb-28 pt-16 text-center text-white">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest"><Sparkles className="h-3.5 w-3.5" />{[d.festival || 'Community Puja', d.edition].filter(Boolean).join(' · ')}</span>
            <h1 className="mt-5 text-[clamp(2.4rem,7vw,5rem)] font-extrabold leading-[1.05]" style={{ fontFamily: HEAD }}>{d.name}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl opacity-95">{d.tagline || (d.has.about ? d.description.slice(0, 160) : '')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => scrollToId('cp-help')} className="rounded-full bg-white px-7 py-3.5 text-base font-bold shadow-lg" style={{ color: orange }}>Be part of the puja</button>{d.has.visitor && <button type="button" onClick={() => scrollToId('cp-visit')} className="rounded-full border-2 border-white px-7 py-3.5 text-base font-bold hover:bg-white/15">Plan your visit</button>}</div>
          </Reveal>
        </div>
      </header>

      {quick.length > 0 && <ul className="relative z-10 mx-auto -mt-14 grid max-w-5xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-4">{quick.map(([Icon, title, text, id]) => <li key={title}><button type="button" onClick={() => scrollToId(id)} className={`${card} flex h-full w-full flex-col p-5 text-left transition hover:-translate-y-1`}><span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: green }}><Icon className="h-5 w-5" /></span><span className="mt-3 text-xs font-bold uppercase tracking-widest opacity-60">{title}</span><span className="mt-1 font-semibold leading-snug">{text}</span></button></li>)}</ul>}

      {(d.has.schedule || d.has.activities) && (
        <section id="cp-program" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4"><h2 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: orange }}>Programme</h2>
            {d.has.schedule && d.has.activities && <div role="group" aria-label="Programme view" className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">{([['schedule', 'Puja rituals'], ['programmes', 'Cultural programmes']] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm font-bold ${tab === k ? 'text-white' : ''}`} style={tab === k ? { background: orange } : undefined}>{l}</button>)}</div>}</Reveal>
          <div className="mt-8">
            {tab === 'schedule' && d.has.schedule ? <DayTabs days={d.days} cls={{ tabs: 'sp-no-scrollbar flex gap-2 overflow-x-auto pb-2', tab: 'shrink-0 rounded-full border-2 border-[#E4572E]/30 bg-white px-4 py-2 text-sm font-bold', tabOn: '!bg-[#E4572E] !border-[#E4572E] text-white', panel: `${card} mt-4 p-6`, ritual: 'flex gap-4 rounded-xl px-2 py-1.5', time: 'w-24 shrink-0 font-bold text-[#2E8B57]', key: 'bg-[#F29A2E]/20', title: 'text-2xl font-bold', meta: 'text-sm opacity-70' }} /> : (
              <ul className="grid gap-5 sm:grid-cols-2">{d.activities.map((a, i) => <Reveal as="li" key={a.id} delay={(i % 2) * 80} className={`${card} overflow-hidden`}><Img src={a.image} seed={a.id} kind="dhak" palette="marigold" alt="" className="aspect-[16/8] w-full object-cover" /><div className="p-5"><span className="rounded-full bg-[#2E8B57]/12 px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ color: green }}>{a.category}</span><h3 className="mt-3 text-2xl font-bold" style={{ fontFamily: HEAD }}>{a.title}</h3><p className="mt-1 opacity-80">{a.description}</p><p className="mt-2 text-sm font-semibold opacity-70">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></div></Reveal>)}</ul>)}
          </div>
        </section>
      )}

      {d.has.visitor && d.guide && <section id="cp-visit" className="scroll-mt-20 py-20" style={{ background: `${green}14` }}><div className="mx-auto max-w-5xl px-5"><Reveal><h2 className="mb-8 text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: green }}>Visiting us</h2></Reveal><GuideBlock guide={d.guide} cls={{ cell: `${card} p-4`, label: 'text-xs font-bold uppercase tracking-widest text-[#2E8B57]' }} /></div></section>}

      {d.has.news && <section id="cp-news" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20"><Reveal><h2 className="mb-8 text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: orange }}>Announcements</h2></Reveal><ul className="space-y-4">{d.news.slice(0, 5).map((n) => <li key={n.id} className={`${card} flex gap-4 p-5`}><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: green }} aria-hidden /><div><p className="text-xs font-bold uppercase tracking-widest opacity-55">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="text-xl font-bold" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-1 opacity-80">{n.summary || n.content}</p></div></li>)}</ul></section>}

      {(d.has.gallery || d.has.videos) && <section id="cp-photos" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20"><Reveal><h2 className="mb-8 text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: orange }}>{d.has.gallery ? 'Photo wall' : 'Videos'}</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="masonry" kind="diya" palette="marigold" cls={{ item: 'overflow-hidden rounded-3xl shadow-md' }} />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-3xl bg-white shadow-md' }} /></div>}</section>}

      {d.has.leadership && <section id="cp-team" className="scroll-mt-20 py-20" style={{ background: `${orange}12` }}><div className="mx-auto max-w-6xl px-5"><Reveal><h2 className="mb-8 text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: orange }}>The people who make it happen</h2></Reveal><ul className="grid grid-cols-2 gap-5 md:grid-cols-4">{d.leaders.map((l, i) => <Reveal as="li" key={l.id} delay={(i % 4) * 60} className={`${card} p-5 text-center`}><Img src={l.photo} seed={l.id} kind="portrait" palette="saffron" alt={l.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#2E8B57]/30" /><h3 className="mt-3 font-bold" style={{ fontFamily: HEAD }}>{l.name}</h3><p className="text-sm font-semibold" style={{ color: green }}>{l.designation}</p></Reveal>)}</ul></div></section>}

      <section id="cp-help" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
        <Reveal><h2 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD, color: green }}>Join in</h2><p className="mt-2 max-w-xl opacity-80">The puja is run by neighbours. There is always something to do, from decorations to bhog to crowd care.</p></Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className={`${card} p-6`}><h3 className="text-2xl font-bold" style={{ fontFamily: HEAD }}>Volunteer</h3><p className="mt-2 opacity-80">Tell the committee what you can help with.</p>{d.email ? <a href={mailto(d.email, `Volunteering for ${d.name}`, 'Hello, I would like to volunteer. I can help with: ')} className="mt-4 inline-block rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: green }}>Email the volunteer desk</a> : d.phone ? <p className="mt-4 font-semibold">Call {d.phone}</p> : null}</div>
          {d.has.donation && d.donation ? <div id="cp-give" className={`${card} scroll-mt-24 p-6`}><h3 className="text-2xl font-bold" style={{ fontFamily: HEAD }}>{d.donation.title || 'Contribute'}</h3><div className="mt-3"><DonationBlock donation={d.donation} cls={{ cause: 'rounded-2xl bg-[#FFF9F0] p-3', wrap: 'space-y-3 text-sm' }} /></div></div> : <div className={`${card} p-6`}><h3 className="text-2xl font-bold" style={{ fontFamily: HEAD }}>Spread the word</h3><p className="mt-2 opacity-80">Share this page with friends and neighbours so everyone knows when to come.</p></div>}
        </div>
      </section>

      {d.has.sponsors && <section aria-label="Sponsors" className="pb-16"><div className="mx-auto max-w-5xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full bg-white px-5 py-2 text-sm font-bold shadow-sm ring-1 ring-black/5' }} /></div></section>}

      <section id="cp-contact" className="scroll-mt-20 py-16 text-white" style={{ background: green }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2">
          <div><h2 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: HEAD }}>Say hello</h2><div className="mt-5 space-y-1.5">{d.contactPerson && <p>{d.contactPerson}</p>}{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: orange }} cls={{ input: 'w-full rounded-2xl bg-white px-4 py-3 text-sm text-[#33241C] placeholder-black/45 focus:outline-none focus:ring-2 focus:ring-white', button: 'rounded-full px-7 py-3 text-sm font-bold text-white', note: 'text-sm' }} />
        </div>
        <p className="mt-10 text-center text-xs opacity-80">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
