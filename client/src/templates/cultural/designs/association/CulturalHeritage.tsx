import React, { useMemo } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { eventDateLine, DemoBadge, EnquiryForm, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, MembershipBlock, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap';
const HEAD = '"Cormorant Garamond", Georgia, serif';
const BODY = 'Lora, Georgia, serif';

/** Cultural Heritage: a formal, ivory-and-maroon society journal with a nameplate masthead, ruled sections and a roll of office-bearers. */
export const CulturalHeritage: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'ivory', coverKind: 'alpona' }), [props]);
  const maroon = d.brand.primary || '#7A1F2B';
  const gold = d.brand.accent || '#B8893C';
  const rule = 'border-[#3A2A1E]/40';
  const items = ([d.has.about && ['About', 'ch-about'], d.has.leadership && ['Council', 'ch-council'], d.has.activities && ['Programmes', 'ch-programmes'], d.has.events && ['Events', 'ch-events'], (d.has.gallery || d.has.videos) && ['Archive', 'ch-archive'], d.has.news && ['Notices', 'ch-news'], d.has.membership && ['Membership', 'ch-member'], ['Contact', 'ch-contact']].filter(Boolean) as [string, string][]);
  const h2 = 'text-4xl font-semibold leading-tight sm:text-5xl';
  const kick = 'text-[11px] font-bold uppercase tracking-[0.3em]';

  return (
    <div id="ch-top" className="sp-root min-h-screen bg-[#F7F0E1] text-[#2E1A0E]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <div className={`border-b ${rule} bg-[#F7F0E1] text-center text-[11px] uppercase tracking-[0.3em] py-2`}>{[d.established ? `Established ${d.established}` : '', d.place].filter(Boolean).join(' · ') || 'Cultural association'}</div>
      <Nav
        brand={<button type="button" onClick={() => scrollToId('ch-top')} className="flex items-center gap-3 text-left"><Img src={d.logo} seed="logo" alt="" className="h-11 w-11 rounded-full object-cover" /><span className="text-2xl font-bold leading-none" style={{ fontFamily: HEAD, color: maroon }}>{d.shortName}</span></button>}
        items={items}
        cls={{ bar: `sticky top-0 z-40 border-b-2 border-double ${rule} bg-[#F7F0E1]/95 backdrop-blur`, link: 'px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] hover:underline', active: 'underline', mobilePanel: `border-t ${rule} bg-[#F7F0E1]` }}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <Reveal>
          {d.festival && <p className={kick} style={{ color: gold }}>{d.festival}</p>}
          <h1 className="mt-3 text-5xl font-bold leading-[1.02] sm:text-7xl" style={{ fontFamily: HEAD, color: maroon }}>{d.name}</h1>
          {d.nativeName && <p lang="bn" className="mt-2 text-xl opacity-75">{d.nativeName}</p>}
          {d.tagline && <p className="mt-5 max-w-xl text-xl italic leading-8 opacity-85">{d.tagline}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {d.has.events && <button type="button" onClick={() => scrollToId('ch-events')} className="px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white" style={{ background: maroon }}>See what is on</button>}
            <button type="button" onClick={() => scrollToId('ch-contact')} className={`border-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em]`} style={{ borderColor: maroon, color: maroon }}>Get in touch</button>
          </div>
        </Reveal>
        <Reveal from="scale" delay={120}>
          <figure className="relative">
            <div className="absolute -inset-3 border-2" style={{ borderColor: gold }} aria-hidden />
            <Img src={d.cover} seed={d.name} kind="alpona" palette="ivory" alt="" loading="eager" className="relative aspect-[4/5] w-full object-cover sepia-[.15]" />
            {d.place && <figcaption className="mt-5 text-center text-xs uppercase tracking-[0.25em] opacity-70">{d.place}</figcaption>}
          </figure>
        </Reveal>
      </section>

      {d.stats.length > 0 && (
        <div className={`border-y-2 border-double ${rule}`}>
          <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-12 gap-y-4 px-5 py-6">{d.stats.slice(0, 4).map((s) => <li key={s.label} className="text-center"><span className="block text-4xl font-bold" style={{ fontFamily: HEAD, color: maroon }}>{s.value}</span><span className={`${kick} opacity-70`}>{s.label}</span></li>)}</ul>
        </div>
      )}

      {d.has.about && (
        <section id="ch-about" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-5 py-16 lg:grid-cols-[1fr_1.6fr]">
          <Reveal><p className={kick} style={{ color: gold }}>Our story</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>About the association</h2></Reveal>
          <Reveal delay={100}>
            <p className="text-lg leading-8 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-[#7A1F2B]">{d.description}</p>
            {d.history && <p className="mt-5 leading-8 opacity-85">{d.history}</p>}
            {d.has.mission && (
              <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                {d.mission && <div className={`border-t-2 pt-3 ${rule}`}><dt className={kick} style={{ color: maroon }}>Mission</dt><dd className="mt-2">{d.mission}</dd></div>}
                {d.vision && <div className={`border-t-2 pt-3 ${rule}`}><dt className={kick} style={{ color: maroon }}>Vision</dt><dd className="mt-2">{d.vision}</dd></div>}
              </dl>
            )}
            {d.values.length > 0 && <ul className="mt-6 flex flex-wrap gap-2">{d.values.map((v) => <li key={v} className="border px-3 py-1 text-sm italic" style={{ borderColor: gold }}>{v}</li>)}</ul>}
          </Reveal>
        </section>
      )}

      {d.has.leadership && (
        <section id="ch-council" className={`scroll-mt-20 border-y ${rule} bg-[#EFE4CB]/60 py-16`}>
          <div className="mx-auto max-w-4xl px-5">
            <Reveal className="text-center"><p className={kick} style={{ color: gold }}>The roll of office</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>Council &amp; office-bearers</h2></Reveal>
            <div className="mt-10 space-y-8">
              {d.leaderGroups.map((g) => (
                <Reveal key={g.group}>
                  <h3 className={`${kick} mb-3`} style={{ color: maroon }}>{g.group}</h3>
                  <ul>{g.items.map((l) => (
                    <li key={l.id} className="flex items-baseline gap-3 py-2">
                      <span className="text-xl font-semibold" style={{ fontFamily: HEAD }}>{l.name}{l.nativeName && <span lang="bn" className="ml-2 text-base opacity-60">{l.nativeName}</span>}</span>
                      <span className="mb-1 min-w-6 flex-1 border-b border-dotted border-[#3A2A1E]/50" aria-hidden />
                      <span className="text-sm italic opacity-80">{l.designation}</span>
                    </li>))}</ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {d.has.activities && (
        <section id="ch-programmes" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={kick} style={{ color: gold }}>What we do</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>Programmes</h2></Reveal>
          <ol className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {d.activities.map((a, i) => (
              <Reveal as="li" key={a.id} delay={(i % 2) * 90} className={`border-t-2 pt-4 ${rule}`}>
                <div className="flex items-start gap-4"><span className="text-5xl font-bold leading-none opacity-30" style={{ fontFamily: HEAD, color: maroon }}>{String(i + 1).padStart(2, '0')}</span>
                  <div><h3 className="text-2xl font-semibold" style={{ fontFamily: HEAD }}>{a.title}</h3><p className={`${kick} mt-1 opacity-60`}>{[a.category, a.schedule].filter(Boolean).join(' · ')}</p><p className="mt-2 leading-7 opacity-85">{a.description}</p>{a.venue && <p className="mt-1 text-sm italic opacity-70">{a.venue}</p>}</div></div>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {d.has.events && (
        <section id="ch-events" className="scroll-mt-20 py-16 text-[#F7F0E1]" style={{ background: maroon }}>
          <div className="mx-auto max-w-5xl px-5">
            <Reveal><p className={kick} style={{ color: '#F1D9A0' }}>Calendar</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>Events</h2></Reveal>
            <ul className="mt-8 divide-y divide-white/25 border-y border-white/25">
              {[...d.upcoming, ...d.past].map((e) => (
                <li key={e.id} className="grid gap-2 py-5 sm:grid-cols-[170px_1fr_auto] sm:items-baseline">
                  <span className="text-sm uppercase tracking-widest opacity-80">{eventDateLine(e, fmtDate)}</span>
                  <div><h3 className="text-2xl font-semibold" style={{ fontFamily: HEAD }}>{e.title}</h3><p className="mt-1 opacity-85">{e.description}</p>{e.venue && <p className="mt-1 text-sm italic opacity-75">{e.venue}</p>}</div>
                  {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="border border-white/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10">Register</a> : <span className="text-xs uppercase tracking-widest opacity-70">{e.status === 'completed' ? 'Held' : e.status}</span>}
                </li>))}
            </ul>
          </div>
        </section>
      )}

      {(d.has.gallery || d.has.videos) && (
        <section id="ch-archive" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={kick} style={{ color: gold }}>From the archive</p><h2 className={`mt-2 mb-8 ${h2}`} style={{ fontFamily: HEAD }}>{d.has.gallery ? 'Photographs' : 'Films'}</h2></Reveal>
          {d.has.gallery && <PhotoWall photos={d.photos} variant="masonry" kind="alpona" palette="ivory" cls={{ img: 'sepia-[.2] hover:sepia-0', item: `overflow-hidden border ${rule} bg-white p-1.5` }} />}
          {d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: `overflow-hidden border ${rule} bg-white`, title: 'p-3 text-sm italic' }} /></div>}
        </section>
      )}

      {d.has.news && (
        <section id="ch-news" className={`scroll-mt-20 border-t-2 border-double ${rule} py-16`}>
          <div className="mx-auto max-w-4xl px-5">
            <Reveal><p className={kick} style={{ color: gold }}>Bulletin</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>Notices &amp; news</h2></Reveal>
            <ul className="mt-8 space-y-6">{d.news.slice(0, 5).map((n) => <li key={n.id} className={`border-b pb-6 ${rule}`}><p className={`${kick} opacity-60`}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-1 text-2xl font-semibold" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-2 leading-7 opacity-85">{n.summary || n.content}</p></li>)}</ul>
          </div>
        </section>
      )}

      {d.has.membership && d.membership && (
        <section id="ch-member" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={kick} style={{ color: gold }}>Join us</p><h2 className={`mt-2 mb-8 ${h2}`} style={{ fontFamily: HEAD }}>Membership</h2></Reveal>
          <MembershipBlock membership={d.membership} cls={{ tier: `border-2 bg-white/60 p-6 ${rule}`, fee: 'mt-2 text-3xl font-bold' }} />
        </section>
      )}

      {d.has.sponsors && <section aria-label="Patrons" className={`border-t ${rule} py-12`}><div className="mx-auto max-w-5xl px-5"><p className={`${kick} mb-5 text-center`} style={{ color: gold }}>With the support of</p><SponsorTiers sponsors={d.sponsors} cls={{ item: 'border px-4 py-2 font-semibold', tier: `${kick} mb-3 opacity-60` }} /></div></section>}

      <section id="ch-contact" className="scroll-mt-20 py-16 text-[#F7F0E1]" style={{ background: '#2E1A0E' }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2">
          <div>
            <p className={kick} style={{ color: '#F1D9A0' }}>Correspondence</p><h2 className={`mt-2 ${h2}`} style={{ fontFamily: HEAD }}>Contact</h2>
            <div className="mt-5 space-y-1.5">
              {d.contactPerson && <p>{d.contactPerson}</p>}
              {d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}
              {d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}
              {d.phone && <p>{d.phone}</p>}
              {d.registration && <p className="pt-2 text-sm opacity-70">Registration: {d.registration}</p>}
            </div>
            {d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-white/40 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-white/10" />}
          </div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: gold, color: '#2E1A0E' }} cls={{ input: 'w-full border border-white/40 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/60 focus:border-white focus:outline-none', button: 'px-6 py-3 text-xs font-bold uppercase tracking-[0.25em]', note: 'text-sm italic' }} />
        </div>
        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.3em] opacity-60">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
