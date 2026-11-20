import React, { useMemo, useState } from 'react';
import { Moon, Play, Sun } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useActiveSection, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=Manrope:wght@300;400;500;600&display=swap';
const DISPLAY = 'Syne, Manrope, sans-serif';
const SANS = 'Manrope, system-ui, sans-serif';

/**
 * Immersive 3D & Motion — a stage-like dark canvas (with a light mode toggle). A CSS-3D ring of work
 * rotates in the hero, projects live in a snap-scrolling reel, and a pill navigation floats over it all.
 * Pure CSS transforms: no WebGL or 3D libraries.
 */
export const MotionImmersive: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'orb', palette: 'neon' }), [props]);
  const [light, setLight] = useState(false);
  const [vid, setVid] = useState(false);
  const ids = ['mi-top', ...(d.has.projects ? ['mi-reel'] : []), ...(d.has.media ? ['mi-show'] : []), ...(d.bio ? ['mi-about'] : []), 'mi-contact'];
  const active = useActiveSection(ids);
  const t = light
    ? { bg: '#F4F2FF', fg: '#14102B', mute: 'rgba(20,16,43,.62)', card: '#FFFFFF', line: 'rgba(20,16,43,.12)', glow: 'rgba(124,58,237,.25)' }
    : { bg: '#07060F', fg: '#F2EEFF', mute: 'rgba(242,238,255,.62)', card: '#12101F', line: 'rgba(242,238,255,.12)', glow: 'rgba(168,85,247,.35)' };
  const ring = (d.projects.length ? d.projects : []).slice(0, 8);
  const n = Math.max(ring.length, 1);
  const nav = [d.has.projects && ['Reel', 'mi-reel'], d.has.media && ['Showreel', 'mi-show'], d.bio && ['About', 'mi-about'], ['Contact', 'mi-contact']].filter(Boolean) as [string, string][];

  return (
    <div id="mi-top" className="relative min-h-screen overflow-x-clip transition-colors duration-500" style={{ background: t.bg, color: t.fg, fontFamily: SANS }}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px]" style={{ background: `radial-gradient(60% 50% at 50% 0%, ${t.glow}, transparent 70%)` }} />

      {/* Floating pill navigation */}
      <header className="pf-noprint fixed inset-x-0 top-4 z-40 flex justify-center px-3">
        <div className="flex max-w-full items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-xl" style={{ background: light ? 'rgba(255,255,255,.75)' : 'rgba(18,16,31,.7)', borderColor: t.line }}>
          <button type="button" onClick={() => scrollToId('mi-top')} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ fontFamily: DISPLAY }}>{d.firstName}</button>
          <nav aria-label="Sections" className="pf-no-scrollbar flex items-center gap-0.5 overflow-x-auto">
            {nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="rounded-full px-3 py-1.5 text-[13px] transition" style={{ background: active === id ? (light ? '#14102B' : '#F2EEFF') : 'transparent', color: active === id ? (light ? '#F4F2FF' : '#07060F') : t.mute }}>{l}</button>)}
          </nav>
          <button type="button" aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} aria-pressed={light} onClick={() => setLight(!light)} className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border" style={{ borderColor: t.line }}>{light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
        </div>
      </header>

      {/* Hero with CSS 3D ring */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-start px-5 pb-10 pt-28 text-center sm:pt-32">
        <PfReveal><p className="text-[12px] font-semibold uppercase tracking-[0.35em]" style={{ color: t.mute }}>{d.title}</p></PfReveal>
        <PfReveal delay={80}><h1 className="mt-4 max-w-5xl bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#22D3EE] bg-clip-text text-[clamp(2.4rem,7vw,6rem)] font-extrabold leading-[0.98] text-transparent pf-gradient" style={{ fontFamily: DISPLAY }}>{d.name}</h1></PfReveal>
        <PfReveal delay={160}><p className="mx-auto mt-5 max-w-xl text-lg leading-8" style={{ color: t.mute }}>{d.headline}</p></PfReveal>

        <PfReveal delay={260} className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
          {d.has.projects && <button type="button" onClick={() => scrollToId('mi-reel')} className="rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,.8)] transition hover:scale-105">Watch the reel</button>}
          <button type="button" onClick={() => scrollToId('mi-contact')} className="rounded-full border px-7 py-3 text-sm font-semibold transition hover:scale-105" style={{ borderColor: t.line }}>{d.cta}</button>
        </PfReveal>
        <div aria-hidden className="relative z-0 -mt-2 h-[220px] w-full max-w-[1000px] sm:h-[280px]" style={{ perspective: '1400px' }}>
          <div className="pf-spin3d absolute left-1/2 top-[22%] h-[150px] w-[110px] -translate-x-1/2 -translate-y-1/2 sm:h-[220px] sm:w-[170px]">
            {ring.map((p, i) => (
              <div key={p.id} className="absolute inset-0 overflow-hidden rounded-xl border shadow-2xl" style={{ transform: `rotateY(${(360 / n) * i}deg) translateZ(var(--pf-z, 230px))`, borderColor: t.line }}>
                <SmartImg src={p.image} seed={p.title} alt="" className="h-full w-full object-cover" loading="eager" />
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Stats ribbon */}
      {d.stats.length > 0 && (
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-5 pb-20 text-center">
          {d.stats.map((m) => <PfReveal key={m.label}><div className="text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: DISPLAY }}>{m.value}</div><div className="mt-1 text-[11px] uppercase tracking-[0.22em]" style={{ color: t.mute }}>{m.label}</div></PfReveal>)}
        </div>
      )}

      {/* Project reel — horizontal snap scroll */}
      {d.has.projects && (
        <section id="mi-reel" className="scroll-mt-4 py-16">
          <PfReveal className="mx-auto flex max-w-6xl items-end justify-between px-5"><h2 className="text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: DISPLAY }}>The reel</h2><span className="hidden text-sm sm:block" style={{ color: t.mute }}>Scroll sideways →</span></PfReveal>
          <div className="pf-no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-[max(1.25rem,calc((100vw-72rem)/2))]" tabIndex={0} aria-label="Project reel">
            {d.projects.map((p, i) => (
              <article key={p.id} className="group relative w-[78vw] max-w-[440px] shrink-0 snap-center overflow-hidden rounded-3xl border transition duration-500 hover:-translate-y-2" style={{ background: t.card, borderColor: t.line, boxShadow: `0 30px 80px -40px ${t.glow}` }}>
                <div className="relative aspect-[4/5] overflow-hidden"><SmartImg src={p.image} seed={p.title} alt={p.title} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-110" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">{p.category}</span>
                  <span className="absolute right-4 top-4 text-sm font-bold text-white/70">{String(i + 1).padStart(2, '0')}</span>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white"><h3 className="text-2xl font-bold" style={{ fontFamily: DISPLAY }}>{p.title}</h3>{p.subtitle && <div className="text-sm text-white/75">{p.subtitle}</div>}</div>
                </div>
                <div className="p-5"><p className="text-[15px] leading-7" style={{ color: t.mute }}>{p.summary}</p>{p.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((tg) => <span key={tg} className="rounded-full border px-2.5 py-0.5 text-[11px]" style={{ borderColor: t.line }}>{tg}</span>)}</div>}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Showreel */}
      {d.has.media && (
        <section id="mi-show" className="scroll-mt-4 mx-auto max-w-5xl px-5 py-16">
          <PfReveal><h2 className="text-center text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: DISPLAY }}>Showreel</h2></PfReveal>
          <PfReveal delay={100} from="scale" className="mt-10 overflow-hidden rounded-3xl border" style={{ borderColor: t.line, boxShadow: `0 40px 100px -40px ${t.glow}` }}>
            <div className="relative aspect-video bg-black">
              {vid ? <iframe title={d.videos[0].title} src={`${d.videos[0].embed}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" /> : (
                <button type="button" onClick={() => setVid(true)} aria-label="Play showreel" className="group absolute inset-0"><SmartImg src={d.videos[0].thumb} seed="reel" alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transition group-hover:scale-110"><Play className="h-8 w-8 translate-x-0.5 fill-current" /></span></span></button>
              )}
            </div>
          </PfReveal>
        </section>
      )}

      {/* About + tools */}
      {d.bio && (
        <section id="mi-about" className="scroll-mt-4 mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
            <PfReveal><h2 className="text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: DISPLAY }}>About</h2><p className="mt-6 text-xl leading-9" style={{ color: t.mute }}>{d.bio}</p>
              {d.has.experience && <ul className="mt-8 space-y-4">{d.experience.map((e) => <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: t.line }}><span><b>{e.role}</b> <span style={{ color: t.mute }}>· {e.company}</span></span><span className="text-sm" style={{ color: t.mute }}>{e.period}</span></li>)}</ul>}</PfReveal>
            <PfReveal delay={120} from="right"><div className="rounded-3xl border p-6" style={{ background: t.card, borderColor: t.line }}>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: t.mute }}>Toolkit</div>
              <ul className="space-y-4">{d.skills.map((s) => <li key={s.id}><div className="flex justify-between text-sm"><span>{s.name}</span><span style={{ color: t.mute }}>{s.level}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: t.line }}><div className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#22D3EE]" style={{ width: `${Math.round(s.score * 100)}%` }} /></div></li>)}</ul></div></PfReveal>
          </div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="mi-background" theme={{ text: t.fg, muted: t.mute, border: t.line, accent: '#A855F7', font: DISPLAY }} />

      <section id="mi-contact" className="scroll-mt-4 px-5 pb-24 pt-16 text-center">
        <PfReveal><h2 className="mx-auto max-w-3xl text-[clamp(2rem,7vw,5rem)] font-extrabold leading-[1.02]" style={{ fontFamily: DISPLAY }}>Have a world that needs building?</h2></PfReveal>
        <PfReveal delay={120}><a href={mailto(d.email, `Project enquiry for ${d.name}`)} className="mt-9 inline-block rounded-full bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#22D3EE] px-9 py-4 text-sm font-bold text-white shadow-[0_20px_60px_-15px_rgba(168,85,247,.8)] transition hover:scale-105">{d.cta} →</a></PfReveal>
        <SocialRow socials={d.socials} className="mt-10 justify-center" showLabel itemClass="flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:scale-105" />
        <p className="mt-14 text-xs" style={{ color: t.mute }}>© {new Date().getFullYear()} {d.name}</p>
      </section>

      <style>{`#mi-top{--pf-z:150px}@media(min-width:640px){#mi-top{--pf-z:230px}}@media(prefers-reduced-motion:reduce){#mi-top .pf-gradient{animation:none}}`}</style>
    </div>
  );
};

export default MotionImmersive;
