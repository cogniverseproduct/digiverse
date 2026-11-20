import React, { useMemo } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DayTabs, DemoBadge, DonationBlock, EnquiryForm, GuideBlock, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&family=Spectral:ital,wght@0,400;0,500;0,700;1,400&display=swap';
const HEAD = '"Tiro Bangla", Georgia, serif';
const BODY = 'Spectral, Georgia, serif';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Heritage & Traditional Puja: a long-form story. Parchment, numbered chapters, a timeline of past years and archival, sepia photographs. */
export const HeritageTraditionalPuja: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'sand', coverKind: 'lattice' }), [props]);
  const clay = d.brand.primary || '#8C3B1E';
  const moss = d.brand.accent || '#2F4A3A';
  const chapters = ([
    (d.has.history || d.has.about || d.has.mission) && ['Our story', 'ht-story'],
    d.has.theme && ['This year', 'ht-theme'],
    d.has.schedule && ['The rituals', 'ht-rituals'],
    (d.has.gallery || d.has.videos) && ['Archive', 'ht-archive'],
    d.has.leadership && ['Custodians', 'ht-custodians'],
    d.has.visitor && ['Visiting', 'ht-visit'],
    d.has.donation && ['Offerings', 'ht-give']
  ].filter(Boolean) as [string, string][]);
  const items: [string, string][] = [...chapters, ['Contact', 'ht-contact']];
  const num = (id: string) => ROMAN[chapters.findIndex((c) => c[1] === id)] || '';
  const kick = 'text-[12px] font-bold uppercase tracking-[0.35em]';
  const h2 = 'mt-2 text-4xl leading-tight sm:text-5xl';

  return (
    <div id="ht-top" className="sp-root min-h-screen bg-[#EFE3C8] text-[#2B2118]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('ht-top')} className="flex items-center gap-3 text-lg" style={{ fontFamily: HEAD, color: clay }}><Img src={d.logo} seed="logo" alt="" className="h-10 w-10 rounded-full object-cover sepia-[.3]" />{d.shortName}</button>}
        items={items}
        cls={{ bar: 'sticky top-0 z-40 border-b border-[#8C3B1E]/30 bg-[#EFE3C8]/95 backdrop-blur', link: 'px-3 py-2 text-sm italic hover:text-[#8C3B1E]', active: 'font-bold not-italic text-[#8C3B1E]', mobilePanel: 'border-t border-[#8C3B1E]/30 bg-[#EFE3C8]' }}
      />

      <header className="mx-auto max-w-4xl px-5 pb-12 pt-16 text-center sm:pt-24">
        <Reveal>
          <p className={kick} style={{ color: clay }}>{[d.festival || 'Durga Puja', d.established ? `since ${d.established}` : '', d.edition].filter(Boolean).join(' · ')}</p>
          <h1 className="mt-6 text-[clamp(2.6rem,8vw,5.6rem)] leading-[1.05]" style={{ fontFamily: HEAD, color: moss }}>{d.name}</h1>
          {d.nativeName && <p lang="bn" className="mt-3 text-2xl italic opacity-75">{d.nativeName}</p>}
          {d.tagline && <p className="mx-auto mt-6 max-w-2xl text-xl italic leading-8 opacity-85">{d.tagline}</p>}
          <p className="mt-8 text-2xl tracking-[1em] opacity-40" aria-hidden>❦</p>
        </Reveal>
        <Reveal from="scale" delay={100}><Img src={d.cover} seed="cover" kind="lattice" palette="sand" alt="" loading="eager" className="mx-auto mt-6 aspect-[16/9] w-full border-8 border-white/70 object-cover shadow-xl sepia-[.35]" /></Reveal>
      </header>

      {chapters.length > 0 && <nav aria-label="Chapters" className="mx-auto mb-4 max-w-4xl px-5"><ol className="flex flex-wrap justify-center gap-x-6 gap-y-1 border-y border-[#8C3B1E]/30 py-3 text-sm italic">{chapters.map(([l, id], i) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className="hover:underline"><span style={{ color: clay }}>{ROMAN[i]}.</span> {l}</button></li>)}</ol></nav>}

      {(d.has.history || d.has.about || d.has.mission) && (
        <section id="ht-story" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16">
          <Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-story')}</p><h2 className={h2} style={{ fontFamily: HEAD, color: moss }}>Our story</h2></Reveal>
          <Reveal delay={80} className="mt-6 space-y-5 text-lg leading-9">
            {d.description && <p className="first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-[#8C3B1E]" style={{ fontFamily: BODY }}>{d.description}</p>}
            {d.history && <p>{d.history}</p>}
            {d.mission && <blockquote className="border-l-4 pl-5 italic" style={{ borderColor: clay }}>{d.mission}</blockquote>}
            {d.vision && <p className="opacity-85">{d.vision}</p>}
            {d.values.length > 0 && <ul className="flex flex-wrap gap-2 pt-1">{d.values.map((v) => <li key={v} className="border px-3 py-1 text-base italic" style={{ borderColor: `${clay}77` }}>{v}</li>)}</ul>}
          </Reveal>
        </section>
      )}

      {d.has.theme && d.theme && (
        <section id="ht-theme" className="scroll-mt-20 py-16 text-[#EFE3C8]" style={{ background: moss }}>
          <div className="mx-auto max-w-4xl px-5">
            <Reveal><p className={kick} style={{ color: '#E6C998' }}>Chapter {num('ht-theme')}</p><h2 className={h2} style={{ fontFamily: HEAD }}>{d.theme.name}</h2>{d.theme.nativeName && <p lang="bn" className="mt-1 text-xl opacity-80">{d.theme.nativeName}</p>}<p className="mt-2 text-sm italic opacity-70">{d.theme.edition}</p></Reveal>
            <Reveal delay={80} className="mt-6 space-y-4 text-lg leading-9"><p>{d.theme.concept}</p>{d.theme.story && <p className="opacity-85">{d.theme.story}</p>}</Reveal>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">{([['The idol', d.theme.artisan], ['The pandal', d.theme.pandal], ['The lights', d.theme.lighting]] as [string, string | undefined][]).filter((r) => r[1]).map(([k, v]) => <div key={k} className="border-t border-[#E6C998]/50 pt-3"><dt className={kick} style={{ color: '#E6C998' }}>{k}</dt><dd className="mt-2 text-base leading-7 opacity-90">{v}</dd></div>)}</dl>
            {d.theme.past.length > 0 && <ol className="mt-12 space-y-5 border-l border-[#E6C998]/50 pl-6">{d.theme.past.map((p) => <li key={p.year} className="relative"><span className="absolute -left-[1.85rem] top-2 h-3 w-3 rounded-full bg-[#E6C998]" aria-hidden /><b className="text-xl" style={{ fontFamily: HEAD, color: '#E6C998' }}>{p.year}</b> <span className="italic">{p.name}</span><p className="text-base opacity-80">{p.description}</p></li>)}</ol>}
          </div>
        </section>
      )}

      {d.has.schedule && <section id="ht-rituals" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16"><Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-rituals')}</p><h2 className={`${h2} mb-8`} style={{ fontFamily: HEAD, color: moss }}>The rituals, day by day</h2></Reveal><DayTabs days={d.days} layout="stack" cls={{ tabs: '', tab: '', tabOn: '', panel: 'border-t-2 border-[#8C3B1E]/40 pt-4', ritual: 'flex gap-5 py-1', time: 'w-24 shrink-0 italic text-[#8C3B1E]', key: 'font-bold', title: 'text-3xl text-[#2F4A3A]', meta: 'text-sm italic opacity-70' }} /></section>}

      {(d.has.gallery || d.has.videos) && <section id="ht-archive" className="scroll-mt-20 border-y border-[#8C3B1E]/30 bg-[#E6D6B3] py-16"><div className="mx-auto max-w-6xl px-5"><Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-archive')}</p><h2 className={`${h2} mb-8`} style={{ fontFamily: HEAD, color: moss }}>From the archive</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="masonry" kind="lattice" palette="sand" cls={{ item: 'bg-white p-2 shadow-md', img: 'sepia-[.55] hover:sepia-0', caption: 'block pt-2 text-center text-sm italic' }} />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'bg-white p-2 shadow-md', title: 'p-2 text-center text-sm italic' }} /></div>}</div></section>}

      {d.has.leadership && <section id="ht-custodians" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-16"><Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-custodians')}</p><h2 className={`${h2} mb-8`} style={{ fontFamily: HEAD, color: moss }}>The custodians</h2></Reveal><ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">{d.leaders.map((l) => <li key={l.id} className="flex items-center gap-4 border-b border-[#8C3B1E]/25 pb-4"><Img src={l.photo} seed={l.id} kind="portrait" palette="sand" alt={l.name} className="h-16 w-16 shrink-0 rounded-full object-cover sepia-[.5]" /><div><h3 className="text-xl" style={{ fontFamily: HEAD }}>{l.name}</h3><p className="text-sm italic opacity-75">{l.designation}</p></div></li>)}</ul></section>}

      {d.has.visitor && d.guide && <section id="ht-visit" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16"><Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-visit')}</p><h2 className={`${h2} mb-8`} style={{ fontFamily: HEAD, color: moss }}>Visiting the pandal</h2></Reveal><GuideBlock guide={d.guide} cls={{ cell: 'border border-[#8C3B1E]/35 bg-[#F6EDD8] p-4', label: 'text-[11px] font-bold uppercase tracking-[0.25em] text-[#8C3B1E]' }} /></section>}

      {d.has.news && <section className="mx-auto max-w-3xl px-5 pb-16"><h2 className="mb-6 text-3xl" style={{ fontFamily: HEAD, color: moss }}>Notices</h2><ul className="divide-y divide-[#8C3B1E]/25 border-y border-[#8C3B1E]/25">{d.news.slice(0, 4).map((n) => <li key={n.id} className="py-4"><p className="text-xs italic opacity-65">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="text-xl" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="opacity-85">{n.summary || n.content}</p></li>)}</ul></section>}

      {d.has.donation && d.donation && <section id="ht-give" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-16"><Reveal><p className={kick} style={{ color: clay }}>Chapter {num('ht-give')}</p><h2 className={`${h2} mb-6`} style={{ fontFamily: HEAD, color: moss }}>{d.donation.title || 'Offerings'}</h2></Reveal><DonationBlock donation={d.donation} cls={{ cause: 'border border-[#8C3B1E]/35 bg-[#F6EDD8] p-4' }} /></section>}

      {d.has.sponsors && <section aria-label="Patrons" className="border-t border-[#8C3B1E]/30 py-12"><div className="mx-auto max-w-4xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'border border-[#8C3B1E]/40 px-4 py-2 text-base italic', tier: 'mb-3 text-[11px] font-bold uppercase tracking-[0.3em] opacity-60' }} /></div></section>}

      <section id="ht-contact" className="scroll-mt-20 py-16 text-[#EFE3C8]" style={{ background: '#2B2118' }}>
        <div className="mx-auto grid max-w-4xl gap-10 px-5 md:grid-cols-2">
          <div><h2 className="text-4xl" style={{ fontFamily: HEAD }}>Write to the committee</h2><div className="mt-5 space-y-1.5">{d.contactPerson && <p>{d.contactPerson}</p>}{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}{d.registration && <p className="pt-2 text-sm opacity-65">Registration: {d.registration}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 border border-[#E6C998]/50 px-3 py-1.5 text-sm italic hover:bg-white/10" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: '#E6C998', color: '#2B2118' }} cls={{ input: 'w-full border border-[#E6C998]/50 bg-white/5 px-4 py-3 text-base text-white placeholder-white/50 focus:border-[#E6C998] focus:outline-none', button: 'px-7 py-3 text-sm font-bold uppercase tracking-[0.2em]', note: 'text-sm italic' }} />
        </div>
        <p className="mt-12 text-center text-xs italic opacity-60">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
