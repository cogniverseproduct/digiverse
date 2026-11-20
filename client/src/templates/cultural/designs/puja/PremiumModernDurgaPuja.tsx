import React, { useMemo, useState } from 'react';
import type { CulturalTemplateProps } from '../../types';
import { DemoBadge, DonationBlock, EnquiryForm, GuideBlock, Img, Nav, PhotoWall, Reveal, SocialRow, SponsorTiers, VideoGrid, mapsUrl, scrollToId, useCulturalFonts } from '../../kit/ui';
import { fmtDate, normalizeCultural } from '../../kit/data';

const FONTS = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,500;0,700;1,500&family=Manrope:wght@400;500;600;700&display=swap';
const HEAD = '"Bodoni Moda", Georgia, serif';
const BODY = 'Manrope, system-ui, sans-serif';

/** Premium Modern Durga Puja: cinematic and restrained. Near-black, champagne gold, huge type, a sticky day rail beside the schedule and a horizontal highlights reel. */
export const PremiumModernDurgaPuja: React.FC<CulturalTemplateProps> = (props) => {
  useCulturalFonts(FONTS);
  const d = useMemo(() => normalizeCultural(props, { art: 'night', coverKind: 'pandal' }), [props]);
  const gold = d.brand.accent || '#D9B26A';
  const crimson = d.brand.primary || '#8E1B2A';
  const [dayIx, setDayIx] = useState(0);
  const day = d.days[Math.min(dayIx, d.days.length - 1)];
  const reel = [...(d.theme?.images || []).map((i) => ({ src: i.src, title: i.caption })), ...(d.theme?.past || []).map((p) => ({ src: p.image || '', title: `${p.year} · ${p.name}` }))];
  const items = ([d.has.theme && ['Theme', 'pm-theme'], d.has.schedule && ['Schedule', 'pm-schedule'], d.has.visitor && ['Visit', 'pm-visit'], (d.has.gallery || d.has.videos) && ['Gallery', 'pm-gallery'], d.has.leadership && ['Committee', 'pm-committee'], d.has.donation && ['Support', 'pm-give'], ['Contact', 'pm-contact']].filter(Boolean) as [string, string][]);
  const kick = 'text-[11px] font-semibold uppercase tracking-[0.4em]';

  return (
    <div id="pm-top" className="sp-root min-h-screen bg-[#0B0B10] text-[#F3EEE4]" style={{ fontFamily: BODY }}>
      <DemoBadge show={d.isDemo} />
      <Nav
        brand={<button type="button" onClick={() => scrollToId('pm-top')} className="flex items-center gap-3 text-lg" style={{ fontFamily: HEAD }}><Img src={d.logo} seed="logo" alt="" className="h-9 w-9 rounded-full object-cover" /><span className="hidden sm:inline">{d.shortName}</span></button>}
        items={items} cta={d.has.schedule ? ['Schedule', 'pm-schedule'] : undefined}
        cls={{ bar: 'fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/80 to-transparent', link: 'px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-75 hover:opacity-100', active: '!opacity-100 text-[#D9B26A]', cta: 'border border-[#D9B26A] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B26A] hover:bg-[#D9B26A] hover:text-black', mobilePanel: 'bg-black/95' }}
      />

      <header className="relative isolate flex min-h-screen items-center justify-center overflow-hidden text-center">
        <Img src={d.hasCover ? d.cover : undefined} seed={d.name} kind="pandal" palette="night" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(11,11,16,.25) 0%, #0B0B10 85%)' }} aria-hidden />
        <Reveal className="px-5">
          <p className={kick} style={{ color: gold }}>{[d.festival || 'Durga Puja', d.edition].filter(Boolean).join('  ·  ')}</p>
          <h1 className="mx-auto mt-6 max-w-5xl text-[clamp(2.8rem,9vw,8rem)] font-medium leading-[0.98] tracking-tight" style={{ fontFamily: HEAD }}>{d.name}</h1>
          {d.theme && <p className="mt-6 text-lg italic opacity-85" style={{ fontFamily: HEAD }}>“{d.theme.name}”</p>}
          {d.tagline && !d.theme && <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">{d.tagline}</p>}
          <div className="mt-10 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => scrollToId(d.has.theme ? 'pm-theme' : d.has.schedule ? 'pm-schedule' : 'pm-contact')} className="px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-black" style={{ background: gold }}>Discover</button>{d.has.visitor && <button type="button" onClick={() => scrollToId('pm-visit')} className="border border-white/40 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-white/10">Plan your visit</button>}</div>
        </Reveal>
        <span className="absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-[#D9B26A]" aria-hidden />
      </header>

      {d.has.theme && d.theme && (
        <section id="pm-theme" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal><p className={kick} style={{ color: gold }}>This year's concept</p><h2 className="mt-4 text-5xl leading-[1.05] sm:text-6xl" style={{ fontFamily: HEAD }}>{d.theme.name}</h2>{d.theme.nativeName && <p lang="bn" className="mt-2 text-xl opacity-75">{d.theme.nativeName}</p>}</Reveal>
            <Reveal delay={100}><p className="text-xl leading-9 opacity-90">{d.theme.concept}</p>{d.theme.story && <p className="mt-5 leading-8 opacity-70">{d.theme.story}</p>}
              <dl className="mt-8 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">{([['Idol', d.theme.artisan], ['Pandal', d.theme.pandal], ['Lighting', d.theme.lighting]] as [string, string | undefined][]).filter((r) => r[1]).map(([k, v]) => <div key={k}><dt className={kick} style={{ color: gold }}>{k}</dt><dd className="mt-2 text-sm leading-6 opacity-80">{v}</dd></div>)}</dl></Reveal>
          </div>
          {reel.length > 0 && <ul className="sp-no-scrollbar -mx-5 mt-16 flex snap-x gap-4 overflow-x-auto px-5 pb-3" aria-label="Highlights">{reel.map((r, i) => <li key={`${r.title}-${i}`} className="w-72 shrink-0 snap-start sm:w-96"><Img src={r.src} seed={r.title} kind={i % 2 ? 'lotus' : 'pandal'} palette={i % 2 ? 'plum' : 'night'} alt={r.title} className="aspect-[4/5] w-full object-cover" /><p className="mt-3 text-sm opacity-75">{r.title}</p></li>)}</ul>}
        </section>
      )}

      {d.has.schedule && day && (
        <section id="pm-schedule" className="scroll-mt-10 border-y border-white/10 bg-[#101018] py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[16rem_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start"><Reveal><p className={kick} style={{ color: gold }}>Schedule</p><h2 className="mt-3 text-4xl" style={{ fontFamily: HEAD }}>Day by day</h2></Reveal>
              <div role="tablist" aria-label="Festival days" aria-orientation="vertical" className="sp-no-scrollbar mt-6 flex gap-2 overflow-x-auto lg:flex-col">{d.days.map((x, i) => <button key={x.id} role="tab" type="button" aria-selected={i === dayIx} onClick={() => setDayIx(i)} className={`shrink-0 border-l-2 px-4 py-3 text-left text-sm transition ${i === dayIx ? 'bg-white/[0.06] text-white' : 'border-white/15 opacity-65 hover:opacity-100'}`} style={i === dayIx ? { borderColor: gold } : undefined}><span className="block font-semibold">{x.name}</span><span className="text-xs opacity-65">{x.dateText}</span></button>)}</div></div>
            <div role="tabpanel"><div className="flex flex-wrap items-baseline gap-3"><h3 className="text-4xl" style={{ fontFamily: HEAD }}>{day.name}</h3>{day.nativeName && <span lang="bn" className="text-xl opacity-70">{day.nativeName}</span>}<span className="text-sm opacity-60">{[day.dateText, day.tithi].filter(Boolean).join(' · ')}</span></div>
              {day.rituals.length === 0 ? <p className="mt-6 opacity-65">Timings will be announced.</p> : <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">{day.rituals.map((r, i) => <li key={`${r.time}-${i}`} className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr]"><span className="text-xl font-medium" style={{ fontFamily: HEAD, color: r.key ? gold : undefined }}>{r.time}</span><div><b className={r.key ? '' : 'font-semibold'}>{r.name}{r.key && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest text-black" style={{ background: gold }}>Key ritual</span>}</b>{r.nativeName && <span lang="bn" className="ml-2 opacity-65">{r.nativeName}</span>}{r.description && <p className="mt-1 text-sm opacity-70">{r.description}</p>}</div></li>)}</ol>}</div>
          </div>
        </section>
      )}

      {d.has.visitor && d.guide && <section id="pm-visit" className="mx-auto max-w-5xl scroll-mt-10 px-5 py-24"><Reveal><p className={kick} style={{ color: gold }}>Visit</p><h2 className="mb-10 mt-3 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Plan your visit</h2></Reveal><GuideBlock guide={d.guide} cls={{ cell: 'border border-white/15 bg-white/[0.03] p-4', label: 'text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D9B26A]' }} /></section>}

      {(d.has.gallery || d.has.videos) && <section id="pm-gallery" className="scroll-mt-10 py-24"><div className="mx-auto max-w-7xl px-5"><Reveal><h2 className="mb-10 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Media</h2></Reveal>{d.has.gallery && <PhotoWall photos={d.photos} variant="mosaic" limit={10} kind="pandal" palette="night" />}{d.has.videos && <div className="mt-10"><VideoGrid videos={d.videos} cls={{ card: 'overflow-hidden bg-white/5 ring-1 ring-white/10', title: 'p-3 text-sm opacity-80' }} /></div>}</div></section>}

      {d.has.leadership && <section id="pm-committee" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-24"><Reveal><p className={kick} style={{ color: gold }}>Committee</p><h2 className="mb-10 mt-3 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>The people behind the Puja</h2></Reveal><ul className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{d.leaders.map((l) => <li key={l.id} className="flex items-center gap-4 bg-[#0B0B10] p-5"><Img src={l.photo} seed={l.id} kind="portrait" palette="night" alt={l.name} className="h-16 w-16 rounded-full object-cover grayscale" /><div><h3 className="font-semibold">{l.name}</h3><p className="text-sm opacity-65">{l.designation}</p></div></li>)}</ul></section>}

      {d.has.news && <section className="mx-auto max-w-4xl px-5 pb-20"><ul className="divide-y divide-white/10 border-y border-white/10">{d.news.slice(0, 4).map((n) => <li key={n.id} className="py-5"><p className={kick} style={{ color: gold }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</p><h3 className="mt-2 text-2xl" style={{ fontFamily: HEAD }}>{n.title}</h3><p className="mt-1 opacity-70">{n.summary || n.content}</p></li>)}</ul></section>}

      {d.has.donation && d.donation && <section id="pm-give" className="scroll-mt-10 py-24" style={{ background: `linear-gradient(135deg, ${crimson}, #3A0A12)` }}><div className="mx-auto max-w-4xl px-5"><Reveal><p className={kick} style={{ color: gold }}>Support</p><h2 className="mb-8 mt-3 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>{d.donation.title || 'Contribute to the Puja'}</h2></Reveal><DonationBlock donation={d.donation} cls={{ cause: 'border border-white/25 bg-black/20 p-4' }} /></div></section>}

      {d.has.sponsors && <section aria-label="Partners" className="border-y border-white/10 py-14"><div className="mx-auto max-w-6xl px-5"><SponsorTiers sponsors={d.sponsors} cls={{ item: 'border border-white/20 px-5 py-2.5 text-sm font-semibold tracking-wide', tier: 'mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] opacity-55', logo: 'h-9 w-auto max-w-[150px] object-contain brightness-0 invert' }} /></div></section>}

      <section id="pm-contact" className="mx-auto grid max-w-5xl scroll-mt-10 gap-12 px-5 py-24 md:grid-cols-2">
        <div><p className={kick} style={{ color: gold }}>Contact</p><h2 className="mt-3 text-4xl sm:text-5xl" style={{ fontFamily: HEAD }}>Get in touch</h2><div className="mt-6 space-y-1.5 opacity-90">{d.contactPerson && <p>{d.contactPerson}</p>}{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} buttonStyle={{ background: gold, color: '#000' }} cls={{ input: 'w-full border border-white/25 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/50 focus:border-[#D9B26A] focus:outline-none', button: 'px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em]', note: 'text-sm' }} />
      </section>
      <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.3em] opacity-55">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
