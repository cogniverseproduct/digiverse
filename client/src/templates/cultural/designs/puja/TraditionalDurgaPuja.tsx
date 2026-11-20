import React, { useMemo } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DayTabs, DemoBadge, DonationBlock, EnquiryForm, GuideBlock, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';
import { art } from '../../kit/art';

const FONTS = 'https://fonts.googleapis.com/css2?family=Yatra+One&family=Hind+Siliguri:wght@400;500;600;700&display=swap';
const HEAD = '"Yatra One", Georgia, serif';
const BODY = '"Hind Siliguri", system-ui, sans-serif';

/** An alpona-style border drawn once and tiled. */
const border = (c: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='16'><g fill='none' stroke='${c}' stroke-width='1.6'><path d='M0 8 Q12 -2 24 8 T48 8'/><circle cx='12' cy='8' r='2.4' fill='${c}'/><circle cx='36' cy='8' r='2.4' fill='${c}'/></g></svg>`)}")`;

/** Traditional Durga Puja: sindoor red, gold and cream with alpona borders, a ritual timeline by day and a devotional, ceremonial tone. */
export const TraditionalDurgaPuja: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'vermilion', coverKind: 'alpona' }), [props]);
  const red = d.brand.primary || '#B3121B';
  const gold = d.brand.accent || '#E0A526';
  const items = ([d.has.theme && ['The Puja', 'td-theme'], d.has.schedule && ['Ritual schedule', 'td-schedule'], d.has.visitor && ['Visit', 'td-visit'], d.has.activities && ['Programmes', 'td-prog'], d.has.leadership && ['Committee', 'td-committee'], d.has.news && ['Notices', 'td-notices'], (d.has.gallery || d.has.videos) && ['Gallery', 'td-gallery'], d.has.donation && ['Contribute', 'td-give'], ['Contact', 'td-contact']].filter(Boolean) as [string, string][]);
  const bar = { backgroundImage: border(gold), backgroundRepeat: 'repeat-x', backgroundPosition: 'center' } as React.CSSProperties;
  const kick = 'text-[12px] font-semibold uppercase tracking-[0.3em]';

  return (
    <div id="td-top" className="sp-root min-h-screen bg-[#FFF6E5] text-[#3B1410]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <div className="h-4 w-full" style={{ ...bar, backgroundColor: red }} aria-hidden />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('td-top')} className="flex items-center gap-3 text-left"><Img src={d.logo} seed="logo" alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#E0A526]" /><span className="text-xl leading-tight" style={{ fontFamily: HEAD, color: red }}>{d.shortName}</span></button>}
        items={items}
        cls={{ bar: 'sticky top-0 z-40 border-b-2 border-[#E0A526]/60 bg-[#FFF6E5]/95 backdrop-blur', link: 'px-2.5 py-2 text-[13px] font-semibold hover:text-[#B3121B]', active: 'text-[#B3121B] underline decoration-2 underline-offset-8', mobilePanel: 'border-t border-[#E0A526]/50 bg-[#FFF6E5]' }}
      />

      <header className="relative isolate overflow-hidden text-center" style={{ background: `radial-gradient(circle at 50% 0%, ${red} 0%, #5C0A10 80%)` }}>
        <Img src={d.hasCover ? d.cover : art('mandala', d.name, 'vermilion')} seed="hero" kind="mandala" palette="vermilion" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
        <div className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-[#FFF6E5]">
          <Reveal>
            <p className={kick} style={{ color: gold }}>{[d.festival || 'Sharadotsav', d.edition].filter(Boolean).join(' · ')}</p>
            <h1 className="mt-5 text-[clamp(2.4rem,7.5vw,5rem)] leading-[1.08]" style={{ fontFamily: HEAD }}>{d.name}</h1>
            {d.nativeName && <p lang="bn" className="mt-2 text-2xl opacity-90">{d.nativeName}</p>}
            {d.theme && <p className="mx-auto mt-6 max-w-xl text-lg opacity-90">Theme: <b style={{ color: gold }}>{d.theme.name}</b></p>}
            {d.tagline && <p className="mx-auto mt-3 max-w-xl text-lg italic opacity-85">{d.tagline}</p>}
            <div className="mx-auto mt-6 h-4 max-w-xs" style={{ ...bar }} aria-hidden />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {d.has.schedule && <button type="button" onClick={() => scrollToId('td-schedule')} className="rounded-full px-7 py-3 text-sm font-bold text-[#3B1410]" style={{ background: gold }}>Ritual schedule</button>}
              {d.has.visitor && <button type="button" onClick={() => scrollToId('td-visit')} className="rounded-full border-2 px-7 py-3 text-sm font-bold" style={{ borderColor: gold, color: gold }}>Plan your visit</button>}
            </div>
          </Reveal>
        </div>
      </header>

      {d.has.theme && d.theme && (
        <section id="td-theme" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
          <Reveal className="text-center"><p className={kick} style={{ color: red }}>{d.theme.edition || 'This year'}</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>{d.theme.name}{d.theme.nativeName && <span lang="bn" className="ml-3 text-[.6em] opacity-70">{d.theme.nativeName}</span>}</h2></Reveal>
          <Reveal delay={80} className="mx-auto mt-6 max-w-3xl text-center text-lg leading-8"><p>{d.theme.concept}</p>{d.theme.story && <p className="mt-4 opacity-85">{d.theme.story}</p>}</Reveal>
          {[['Idol', d.theme.artisan], ['Pandal', d.theme.pandal], ['Lighting', d.theme.lighting]].some((r) => r[1]) && <dl className="mt-10 grid gap-4 sm:grid-cols-3">{([['Idol', d.theme.artisan], ['Pandal', d.theme.pandal], ['Lighting', d.theme.lighting]] as [string, string | undefined][]).filter((r) => r[1]).map(([k, v]) => <div key={k} className="rounded-2xl border-2 bg-white/60 p-5 text-center" style={{ borderColor: gold }}><dt className={kick} style={{ color: red }}>{k}</dt><dd className="mt-2">{v}</dd></div>)}</dl>}
          {d.theme.past.length > 0 && <div className="mt-12"><p className={`${kick} text-center`} style={{ color: red }}>Previous years</p><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.theme.past.map((p) => <li key={p.year} className="rounded-xl border bg-white/60 p-4" style={{ borderColor: `${gold}99` }}><b style={{ color: red }}>{p.year}</b> · {p.name}<p className="mt-1 text-sm opacity-75">{p.description}</p></li>)}</ul></div>}
        </section>
      )}

      {d.has.schedule && (
        <section id="td-schedule" className="scroll-mt-20 py-16" style={{ background: '#FBE7C0' }}>
          <div className="mx-auto max-w-4xl px-5"><Reveal className="text-center"><p className={kick} style={{ color: red }}>Pujo</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>Ritual schedule</h2></Reveal>
            <div className="mt-8"><DayTabs days={d.days} cls={{ tabs: 'sp-no-scrollbar flex gap-2 overflow-x-auto pb-2', tab: 'shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold', tabOn: 'bg-[#B3121B] text-white border-[#B3121B]', panel: 'mt-4 rounded-3xl border-2 bg-[#FFF6E5] p-6', ritual: 'flex gap-4 border-b border-dashed border-[#B3121B]/25 pb-2', time: 'w-24 shrink-0 font-bold text-[#B3121B]', key: 'rounded-lg bg-[#E0A526]/25 px-2', title: 'text-2xl text-[#B3121B]', meta: 'text-sm opacity-75' }} /></div></div>
        </section>
      )}

      {d.has.visitor && d.guide && <section id="td-visit" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16"><Reveal className="text-center"><p className={kick} style={{ color: red }}>Darshan</p><h2 className="mt-2 mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>Visiting the pandal</h2></Reveal><GuideBlock guide={d.guide} cls={{ cell: 'rounded-2xl border-2 bg-white/60 p-4', label: 'text-[11px] font-bold uppercase tracking-widest text-[#B3121B]' }} /></section>}

      {d.has.activities && <section id="td-prog" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"><Reveal className="text-center"><p className={kick} style={{ color: red }}>Sandhya</p><h2 className="mt-2 mb-10 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>Cultural evenings</h2></Reveal><ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{d.activities.map((a, i) => <Reveal as="li" key={a.id} delay={(i % 3) * 80} className="overflow-hidden rounded-3xl border-2 bg-white/70" style={{ borderColor: `${gold}aa` }}><Img src={a.image} seed={a.id} kind="diya" palette="marigold" alt="" className="aspect-[16/9] w-full object-cover" /><div className="p-5"><span className={kick} style={{ color: red }}>{a.category}</span><h3 className="mt-1 text-xl" style={{ fontFamily: HEAD }}>{a.title}</h3><p className="mt-2 text-sm leading-6 opacity-80">{a.description}</p><p className="mt-2 text-xs font-semibold opacity-65">{[a.schedule, a.venue].filter(Boolean).join(' · ')}</p></div></Reveal>)}</ul></section>}

      {d.has.leadership && <section id="td-committee" className="scroll-mt-20 py-16 text-[#FFF6E5]" style={{ background: red }}><div className="mx-auto max-w-5xl px-5"><Reveal className="text-center"><p className={kick} style={{ color: gold }}>Pujo samiti</p><h2 className="mt-2 mb-10 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Committee</h2></Reveal><ul className="grid grid-cols-2 gap-6 md:grid-cols-4">{d.leaders.map((l, i) => <Reveal as="li" key={l.id} delay={(i % 4) * 70} className="text-center"><Img src={l.photo} seed={l.id} kind="portrait" palette="saffron" alt={l.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-[#E0A526]" /><h3 className="mt-3 font-semibold">{l.name}</h3>{l.nativeName && <p lang="bn" className="text-sm opacity-80">{l.nativeName}</p>}<p className="text-sm" style={{ color: gold }}>{l.designation}</p></Reveal>)}</ul></div></section>}

      {d.has.news && <section id="td-notices" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-16"><Reveal className="text-center"><p className={kick} style={{ color: red }}>Biggyapon</p><h2 className="mt-2 mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>Notices</h2></Reveal><ul className="space-y-4">{d.news.slice(0, 5).map((n) => <li key={n.id} className="rounded-2xl border-l-8 bg-white/70 p-5" style={{ borderColor: gold }}><p className="text-xs font-semibold uppercase tracking-widest opacity-60">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-1 text-xl" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-1 opacity-85">{n.summary || n.content}</p></li>)}</ul></section>}

      {(d.has.gallery || d.has.videos) && <section id="td-gallery" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"><Reveal className="text-center"><h2 className="mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>Gallery</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="grid" kind="pandal" palette="vermilion" cls={{ item: 'overflow-hidden rounded-2xl border-2 bg-white p-1', caption: 'block p-2 text-xs' }} />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden rounded-2xl border-2 bg-white' }} /></div>}</section>}

      {d.has.donation && d.donation && <section id="td-give" className="scroll-mt-20 py-16" style={{ background: '#FBE7C0' }}><div className="mx-auto max-w-4xl px-5"><Reveal className="text-center"><p className={kick} style={{ color: red }}>Daan</p><h2 className="mt-2 mb-8 text-4xl sm:text-5xl" style={{ fontFamily: HEAD, color: red }}>{d.donation.title || 'Contribute'}</h2></Reveal><DonationBlock donation={d.donation} cls={{ cause: 'rounded-2xl border-2 bg-white/70 p-4' }} /></div></section>}

      {d.has.sponsors && <section aria-label="Sponsors" className="py-12"><div className="mx-auto max-w-5xl px-5"><Reveal className="text-center"><p className={`${kick} mb-6`} style={{ color: red }}>With the grace of our patrons</p></Reveal><SponsorTiers sponsors={d.sponsors} cls={{ item: 'rounded-full border-2 bg-white/70 px-5 py-2 text-sm font-semibold', wrap: 'flex flex-wrap items-center justify-center gap-3', tier: 'mb-3 text-center text-[11px] font-bold uppercase tracking-[0.25em] opacity-60' }} /></div></section>}

      <section id="td-contact" className="scroll-mt-20 py-16 text-[#FFF6E5]" style={{ background: '#3B0A0E' }}>
        <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2">
          <div><p className={kick} style={{ color: gold }}>Jogajog</p><h2 className="mt-2 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Contact the committee</h2><div className="mt-5 space-y-1.5">{d.contactPerson && <p>{d.contactPerson}</p>}{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full border border-[#E0A526]/60 px-4 py-2 text-sm hover:bg-white/10" />}</div>
          <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: gold, color: '#3B1410' }} cls={{ input: 'w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/55 focus:border-[#E0A526] focus:outline-none', button: 'rounded-full px-7 py-3 text-sm font-bold', note: 'text-sm' }} />
        </div>
        <div className="mx-auto mt-12 h-4 max-w-sm" style={{ ...bar }} aria-hidden />
        <p className="mt-4 text-center text-xs opacity-70">© {new Date().getFullYear()} {d.name}</p>
      </section>
    </div>
  );
};
