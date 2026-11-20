import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, Lightbox, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600&family=Barlow:wght@300;400;500&display=swap';
const COND = '"Barlow Condensed", "Barlow", sans-serif';
const SANS = 'Barlow, system-ui, sans-serif';

/**
 * Architecture Minimal — a white gallery with hairline rules, a vertical wordmark rail, a hover-preview
 * project index, full-bleed project spreads and a drag-to-compare slider. Almost no colour.
 */
export const ArchitectMinimal: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'elevation', palette: 'sand', portraitPalette: 'sand' }), [props]);
  const [hover, setHover] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  const [cmp, setCmp] = useState(50);
  const cmpRef = useRef<HTMLDivElement>(null);
  const rule = 'border-[#111]/15';
  const nav = [d.has.projects && ['Projects', 'am-projects'], d.bio && ['Studio', 'am-studio'], d.has.skills && ['Services', 'am-services'], d.has.experience && ['Journal', 'am-journal'], ['Contact', 'am-contact']].filter(Boolean) as [string, string][];
  const first = d.projects[0];
  const second = d.projects[1] || first;
  const preview = d.projects[hover] || first;

  return (
    <div id="am-top" className="min-h-screen bg-white text-[#111]" style={{ fontFamily: SANS, fontWeight: 300 }}>
      {/* Vertical wordmark rail (desktop) */}
      <div aria-hidden className="pf-noprint pointer-events-none fixed inset-y-0 left-0 z-20 hidden w-14 items-center justify-center border-r border-[#111]/10 bg-white lg:flex"><span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.5em] [writing-mode:vertical-rl] rotate-180" style={{ fontFamily: COND }}>{d.name} — {d.title}</span></div>

      <header className="pf-noprint sticky top-0 z-30 border-b border-[#111]/10 bg-white/95 backdrop-blur lg:pl-14">
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-10">
          <button type="button" onClick={() => scrollToId('am-top')} className="text-2xl font-medium uppercase tracking-[0.18em]" style={{ fontFamily: COND }}>{d.name}</button>
          <nav aria-label="Sections" className="pf-no-scrollbar flex gap-6 overflow-x-auto text-[13px] uppercase tracking-[0.22em]">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="shrink-0 py-2 text-[#111]/60 transition hover:text-[#111]">{l}</button>)}</nav>
        </div>
      </header>

      <main className="lg:pl-14">
        {/* Hero: statement + full-bleed image */}
        <section className="px-5 pb-10 pt-12 sm:px-10 md:pt-20">
          <PfReveal><p className="text-[12px] uppercase tracking-[0.4em] text-[#111]/50">{d.title}{d.location ? ` — ${d.location}` : ''}</p></PfReveal>
          <PfReveal delay={80}><h1 className="mt-6 max-w-5xl text-[clamp(2.6rem,8vw,7rem)] font-light uppercase leading-[0.95] tracking-tight" style={{ fontFamily: COND }}>{d.headline || d.name}</h1></PfReveal>
        </section>
        <PfReveal from="fade" className="relative"><SmartImg src={first?.image || d.cover} seed={d.name} alt={first?.title || ''} loading="eager" className="h-[60svh] min-h-[320px] w-full object-cover md:h-[78svh]" />
          {first && <div className="absolute bottom-0 left-0 bg-white px-5 py-3 text-[12px] uppercase tracking-[0.3em] sm:px-10"><b className="font-medium">{first.title}</b> · {first.category} · {first.year}</div>}
        </PfReveal>
        {d.stats.length > 0 && <PfReveal className={`grid grid-cols-3 border-b ${rule} px-5 py-6 text-center sm:px-10`}>{d.stats.slice(0, 3).map((m) => <div key={m.label}><div className="text-4xl font-light sm:text-6xl" style={{ fontFamily: COND }}>{m.value}</div><div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#111]/50">{m.label}</div></div>)}</PfReveal>}

        {/* Project index with hover preview */}
        {d.has.projects && (
          <section id="am-projects" className="scroll-mt-20 px-5 py-20 sm:px-10">
            <PfReveal className="mb-10 flex items-baseline justify-between"><h2 className="text-5xl font-light uppercase tracking-tight sm:text-7xl" style={{ fontFamily: COND }}>Projects</h2><span className="text-[12px] uppercase tracking-[0.3em] text-[#111]/50">{String(d.projects.length).padStart(2, '0')} selected</span></PfReveal>
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
              <ul className={`border-t ${rule}`}>
                {d.projects.map((p, i) => (
                  <PfReveal as="li" key={p.id} delay={i * 50}>
                    <button type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setLb(i)} className={`group flex w-full items-baseline gap-5 border-b ${rule} py-5 text-left transition-all duration-300 ${hover === i ? 'pl-4' : ''}`}>
                      <span className="w-8 text-[12px] tracking-widest text-[#111]/40">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1"><span className="block text-3xl font-light uppercase tracking-wide sm:text-4xl" style={{ fontFamily: COND }}>{p.title}</span><span className="mt-1 block text-[13px] text-[#111]/55">{p.summary}</span></span>
                      <span className="hidden text-right text-[12px] uppercase tracking-[0.25em] text-[#111]/50 sm:block">{p.category}<br />{p.year}</span>
                      <ArrowUpRight className="h-5 w-5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                    </button>
                  </PfReveal>
                ))}
              </ul>
              <div className="relative hidden lg:block"><div className="sticky top-28 overflow-hidden bg-[#F2EFE9]"><SmartImg key={preview?.id} src={preview?.image} seed={preview?.title || 'p'} alt={preview?.title || ''} className="pf-fade aspect-[4/5] w-full object-cover" /></div></div>
            </div>
          </section>
        )}
        <Lightbox tone="light" items={d.projects.map((p) => ({ src: p.image, title: p.title, caption: `${p.category} · ${p.year || ''}` }))} index={lb} onClose={() => setLb(null)} onIndex={setLb} />

        {/* Full-width spreads */}
        {d.projects.slice(1, 4).map((p, i) => (
          <PfReveal key={p.id} from="fade" className="relative">
            <SmartImg src={p.image} seed={p.title} alt={p.title} className="h-[56svh] min-h-[280px] w-full object-cover md:h-[72svh]" />
            <div className={`mx-5 -mt-12 max-w-md bg-white p-6 sm:mx-10 ${i % 2 ? 'ml-auto' : ''}`}><div className="text-[11px] uppercase tracking-[0.3em] text-[#111]/45">{p.category} · {p.year}</div><h3 className="mt-2 text-3xl font-light uppercase" style={{ fontFamily: COND }}>{p.title}</h3><p className="mt-2 text-[15px] leading-7 text-[#111]/65">{p.summary}</p>{p.metrics[0] && <div className="mt-3 text-[13px] uppercase tracking-[0.2em]">{p.metrics[0].label}: <b className="font-medium">{p.metrics[0].value}</b></div>}</div>
          </PfReveal>
        ))}

        {/* Compare slider */}
        {d.projects.length > 1 && first && second && (
          <section className="px-5 py-24 sm:px-10">
            <PfReveal><p className="text-[12px] uppercase tracking-[0.4em] text-[#111]/50">Compare</p><h2 className="mt-3 text-4xl font-light uppercase sm:text-6xl" style={{ fontFamily: COND }}>{first.title} / {second.title}</h2></PfReveal>
            <PfReveal delay={100} className="mt-8"><div ref={cmpRef} className="relative aspect-[16/10] select-none overflow-hidden bg-[#F2EFE9]">
              <SmartImg src={second.image} seed={second.title} alt={second.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - cmp}% 0 0)` }}><SmartImg src={first.image} seed={first.title} alt={first.title} className="h-full w-full object-cover" /></div>
              <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)]" style={{ left: `${cmp}%` }}><span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs shadow-lg">⇆</span></div>
              <input type="range" min={0} max={100} value={cmp} onChange={(e) => setCmp(Number(e.target.value))} aria-label="Compare the two projects" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
            </div></PfReveal>
          </section>
        )}

        {/* Studio */}
        {d.bio && (
          <section id="am-studio" className={`scroll-mt-20 border-t ${rule} px-5 py-24 sm:px-10`}>
            <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
              <PfReveal from="left"><SmartImg src={d.avatar} seed={d.name} alt={`Portrait of ${d.name}`} className="aspect-[4/5] w-full max-w-sm object-cover grayscale" /></PfReveal>
              <PfReveal delay={100}><p className="text-[12px] uppercase tracking-[0.4em] text-[#111]/50">The studio</p><p className="mt-6 text-2xl font-light leading-10 sm:text-3xl sm:leading-[3rem]">{d.bio}</p>{d.story && <p className="mt-6 max-w-2xl text-[17px] leading-8 text-[#111]/65">{d.story}</p>}{d.interests.length > 0 && <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[13px] uppercase tracking-[0.25em] text-[#111]/55">{d.interests.map((i) => <li key={i}>{i}</li>)}</ul>}</PfReveal>
            </div>
          </section>
        )}

        {/* Services */}
        {d.has.skills && (
          <section id="am-services" className={`scroll-mt-20 border-t ${rule} px-5 py-20 sm:px-10`}>
            <PfReveal><h2 className="text-4xl font-light uppercase sm:text-6xl" style={{ fontFamily: COND }}>Services</h2></PfReveal>
            <div className={`mt-10 grid gap-x-10 border-t ${rule} md:grid-cols-2`}>{d.skills.map((s, i) => <PfReveal key={s.id} delay={(i % 2) * 60} className={`flex items-baseline justify-between border-b ${rule} py-4`}><span className="text-xl uppercase tracking-wide" style={{ fontFamily: COND }}>{s.name}</span><span className="text-[12px] uppercase tracking-[0.25em] text-[#111]/45">{s.category}</span></PfReveal>)}</div>
          </section>
        )}

        {/* Journal / practice history + recognition */}
        {(d.has.experience || d.has.testimonials) && (
          <section id="am-journal" className={`scroll-mt-20 border-t ${rule} px-5 py-20 sm:px-10`}>
            <div className="grid gap-14 md:grid-cols-2">
              {d.has.experience && <div><h2 className="text-4xl font-light uppercase" style={{ fontFamily: COND }}>Practice</h2><ul className={`mt-8 border-t ${rule}`}>{d.experience.map((e) => <PfReveal as="li" key={e.id} className={`border-b ${rule} py-5`}><div className="flex justify-between text-[12px] uppercase tracking-[0.25em] text-[#111]/50"><span>{e.period}</span></div><div className="mt-1 text-2xl font-light uppercase" style={{ fontFamily: COND }}>{e.role}, {e.company}</div><p className="mt-1 text-[15px] text-[#111]/60">{e.description}</p></PfReveal>)}</ul></div>}
              {d.has.testimonials && <div><h2 className="text-4xl font-light uppercase" style={{ fontFamily: COND }}>Clients</h2>{d.testimonials.map((t) => <PfReveal key={t.id} className="mt-8"><blockquote className="text-2xl font-light leading-10">“{t.quote}”</blockquote><div className="mt-3 text-[12px] uppercase tracking-[0.25em] text-[#111]/50">{t.author}{t.role ? ` — ${t.role}` : ''}</div></PfReveal>)}</div>}
            </div>
          </section>
        )}

        {/* Contact */}
        <BackgroundBlock d={d} id="am-background" theme={{ text: '#111', muted: 'rgba(17,17,17,.55)', border: 'rgba(17,17,17,.12)', accent: '#111', font: COND }} />

        <section id="am-contact" className="scroll-mt-20 bg-[#111] px-5 py-28 text-white sm:px-10">
          <PfReveal><p className="text-[12px] uppercase tracking-[0.4em] text-white/50">{d.available ? d.availabilityLabel : 'Enquiries'}</p></PfReveal>
          <PfReveal delay={80}><a href={mailto(d.email, `Project enquiry for ${d.name}`)} className="mt-6 block break-all text-[clamp(2rem,7vw,6rem)] font-light uppercase leading-none underline decoration-1 underline-offset-[12px] transition hover:decoration-2" style={{ fontFamily: COND }}>{d.email || 'studio@example.com'}</a></PfReveal>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 text-[13px] uppercase tracking-[0.25em] text-white/60"><div>{d.location}</div><SocialRow socials={d.socials} showLabel itemClass="flex items-center gap-2 py-2 transition hover:text-white" /></div>
        </section>
        <footer className="bg-[#111] px-5 pb-8 text-[11px] uppercase tracking-[0.3em] text-white/35 sm:px-10">© {new Date().getFullYear()} {d.name}</footer>
      </main>
    </div>
  );
};

export default ArchitectMinimal;
