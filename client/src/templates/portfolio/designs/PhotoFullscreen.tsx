import React, { useMemo, useState } from 'react';
import { ArrowDown, Mail, Menu, X } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, Lightbox, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300&family=Jost:wght@300;400;500&display=swap';
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Jost, system-ui, sans-serif';

/**
 * Full-Screen Photography — a black gallery wall. Edge-to-edge hero with a slow zoom, floating
 * transparent navigation, a filterable masonry grid and an immersive lightbox.
 */
export const PhotoFullscreen: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'landscape', palette: 'dusk' }), [props]);
  const photos = d.photos.length ? d.photos : d.projects.map((p, i) => ({ id: p.id, src: p.image, title: p.title, category: p.category, ratio: [1.5, 0.75, 1.33, 1][i % 4] }));
  const cats = ['All', ...new Set(photos.map((p) => p.category))];
  const [cat, setCat] = useState('All');
  const [lb, setLb] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const shown = photos.filter((p) => cat === 'All' || p.category === cat);
  const hero = photos[0]?.src || d.cover;
  const links = [photos.length > 0 && ['Portfolio', 'ph-work'], d.bio && ['About', 'ph-about'], d.has.services && ['Prints & Commissions', 'ph-services'], ['Contact', 'ph-contact']].filter(Boolean) as [string, string][];
  const go = (id: string) => { setMenu(false); scrollToId(id); };

  return (
    <div id="ph-top" className="min-h-screen bg-black text-[#EDE9E3]" style={{ fontFamily: SANS, fontWeight: 300 }}>
      {/* Floating transparent navigation */}
      <header className="pf-noprint absolute inset-x-0 top-0 z-30">
        <div className="flex items-center justify-between px-5 py-6 sm:px-10">
          <button type="button" onClick={() => go('ph-top')} className="text-2xl tracking-[0.28em] uppercase" style={{ fontFamily: SERIF, fontWeight: 500 }}>{d.name}</button>
          <nav aria-label="Sections" className="hidden items-center gap-10 text-[12px] uppercase tracking-[0.3em] md:flex">
            {links.map(([l, id]) => <button key={id} type="button" onClick={() => go(id)} className="opacity-80 transition hover:opacity-100">{l}</button>)}
          </nav>
          <button type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)} className="md:hidden">{menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
        {menu && <nav aria-label="Mobile sections" className="pf-fade mx-4 space-y-1 rounded-lg bg-black/90 p-4 text-sm uppercase tracking-[0.25em] backdrop-blur md:hidden">{links.map(([l, id]) => <button key={id} type="button" onClick={() => go(id)} className="block w-full py-3 text-left">{l}</button>)}</nav>}
      </header>

      {/* Full-viewport hero */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <SmartImg src={hero} seed={d.name} alt="" loading="eager" className="pf-kenburns absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />
        <div className="relative z-10 w-full px-5 pb-16 sm:px-10 sm:pb-20">
          <PfReveal><p className="text-[12px] uppercase tracking-[0.4em] text-white/70">{d.title}</p></PfReveal>
          <PfReveal delay={100}><h1 className="mt-4 max-w-4xl text-[clamp(2.6rem,8vw,6.5rem)] font-light italic leading-[0.95]" style={{ fontFamily: SERIF }}>{d.headline || d.name}</h1></PfReveal>
          <PfReveal delay={200} className="mt-10 flex items-center gap-6 text-[12px] uppercase tracking-[0.3em]">
            <button type="button" onClick={() => go('ph-work')} className="inline-flex items-center gap-3 border-b border-white/70 pb-2 transition hover:border-white">View portfolio <ArrowDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" /></button>
            {d.location && <span className="hidden text-white/60 sm:inline">{d.location}</span>}
          </PfReveal>
        </div>
      </section>

      {/* Masonry gallery */}
      {photos.length > 0 && (
        <section id="ph-work" className="scroll-mt-4 px-3 py-20 sm:px-8">
          <PfReveal className="mx-auto mb-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 px-2">
            <h2 className="text-4xl font-light italic sm:text-5xl" style={{ fontFamily: SERIF }}>Portfolio</h2>
            <div role="tablist" aria-label="Filter gallery" className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.25em]">
              {cats.map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`pb-1 transition ${cat === c ? 'border-b border-white text-white' : 'text-white/50 hover:text-white'}`}>{c}</button>)}
            </div>
          </PfReveal>
          <div className="mx-auto max-w-7xl columns-1 gap-3 sm:columns-2 lg:columns-3">
            {shown.map((p, i) => (
              <PfReveal key={p.id} delay={(i % 3) * 80} from="scale" className="mb-3 break-inside-avoid">
                <button type="button" onClick={() => setLb(i)} aria-label={`Open ${p.title}`} className="group relative block w-full overflow-hidden bg-[#111]">
                  <SmartImg src={p.src} seed={p.title} alt={p.title} style={{ aspectRatio: String(p.ratio) }} className="w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.05]" />
                  <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="text-left"><span className="block text-xl italic" style={{ fontFamily: SERIF }}>{p.title}</span><span className="text-[11px] uppercase tracking-[0.25em] text-white/70">{p.category}</span></span>
                  </span>
                </button>
              </PfReveal>
            ))}
          </div>
        </section>
      )}
      <Lightbox items={shown.map((p) => ({ src: p.src, title: p.title, caption: p.category }))} index={lb} onClose={() => setLb(null)} onIndex={setLb} />

      {/* About */}
      {d.bio && (
        <section id="ph-about" className="scroll-mt-4 border-t border-white/10 px-5 py-24 sm:px-10">
          <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center">
            <PfReveal from="left"><SmartImg src={d.avatar} seed={d.name} alt={`${d.name}, photographer`} className="mx-auto aspect-[4/5] w-full max-w-md object-cover grayscale" /></PfReveal>
            <PfReveal delay={100}>
              <p className="text-[12px] uppercase tracking-[0.4em] text-white/50">The photographer</p>
              <h2 className="mt-4 text-4xl font-light italic sm:text-5xl" style={{ fontFamily: SERIF }}>{d.name}</h2>
              <p className="mt-6 text-[17px] leading-8 text-white/75">{d.bio}</p>
              {d.story && <p className="mt-4 text-[17px] italic leading-8 text-white/60" style={{ fontFamily: SERIF }}>{d.story}</p>}
              {d.has.skills && <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.22em] text-white/60">{d.skills.map((s) => <li key={s.id}>{s.name}</li>)}</ul>}
              {d.stats.length > 0 && <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">{d.stats.map((m) => <div key={m.label}><dt className="text-[11px] uppercase tracking-[0.25em] text-white/45">{m.label}</dt><dd className="mt-1 text-3xl italic" style={{ fontFamily: SERIF }}>{m.value}</dd></div>)}</dl>}
            </PfReveal>
          </div>
        </section>
      )}

      {/* Services */}
      {d.has.services && (
        <section id="ph-services" className="scroll-mt-4 border-t border-white/10 px-5 py-24 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <PfReveal><h2 className="text-center text-4xl font-light italic sm:text-5xl" style={{ fontFamily: SERIF }}>Prints & commissions</h2></PfReveal>
            <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {d.services.map((s) => <PfReveal as="li" key={s.id} className="flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:justify-between"><div><h3 className="text-2xl italic" style={{ fontFamily: SERIF }}>{s.title}</h3><p className="mt-1 max-w-xl text-white/60">{s.description}</p></div>{s.price && <div className="shrink-0 text-[12px] uppercase tracking-[0.25em] text-white/80">{s.price}</div>}</PfReveal>)}
            </ul>
          </div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="ph-background" theme={{ text: '#FFFFFF', muted: 'rgba(255,255,255,.55)', border: 'rgba(255,255,255,.1)', accent: '#EDE9E3', font: SERIF }} />

      <section id="ph-contact" className="scroll-mt-4 border-t border-white/10 px-5 py-28 text-center sm:px-10">
        <PfReveal><p className="text-[12px] uppercase tracking-[0.4em] text-white/50">{d.available ? d.availabilityLabel : 'Enquiries'}</p></PfReveal>
        <PfReveal delay={100}><h2 className="mt-5 text-[clamp(2rem,6vw,4.5rem)] font-light italic leading-tight" style={{ fontFamily: SERIF }}>Let’s make something worth looking at.</h2></PfReveal>
        <PfReveal delay={180}><a href={mailto(d.email, `Photography enquiry for ${d.name}`)} className="mt-10 inline-flex items-center gap-3 border border-white/40 px-8 py-4 text-[12px] uppercase tracking-[0.3em] transition hover:bg-white hover:text-black"><Mail className="h-4 w-4" />{d.cta}</a></PfReveal>
        <SocialRow socials={d.socials} className="mt-10 justify-center" showLabel itemClass="flex items-center gap-2 px-3 py-2 text-[12px] uppercase tracking-[0.25em] text-white/60 transition hover:text-white" />
      </section>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-[11px] uppercase tracking-[0.3em] text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default PhotoFullscreen;
