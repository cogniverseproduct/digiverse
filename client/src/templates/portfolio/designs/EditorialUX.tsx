import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600&display=swap';
const SERIF = '"Fraunces", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

/**
 * Editorial UX Portfolio — warm paper, oversized serif headlines, a masthead navigation, alternating
 * case-study spreads and pull-quote testimonials. Reads like a printed monograph.
 */
export const EditorialUX: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'ui', palette: 'sand', portraitPalette: 'sand' }), [props]);
  const [q, setQ] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const ink = '#1E1A14';
  const paper = '#F6F1E7';
  const rule = 'border-[#1E1A14]/15';
  const nav = [
    d.has.projects && ['Work', 'ux-work'], d.bio && ['About', 'ux-about'], d.has.experience && ['Experience', 'ux-exp'], d.has.testimonials && ['Kind words', 'ux-quotes'], ['Contact', 'ux-contact']
  ].filter(Boolean) as [string, string][];
  const quote = d.testimonials[q % Math.max(1, d.testimonials.length)];

  return (
    <div id="ux-top" className="min-h-screen" style={{ background: paper, color: ink, fontFamily: SANS }}>
      {/* Masthead */}
      <header className="pf-noprint sticky top-0 z-30 border-b backdrop-blur" style={{ background: `${paper}EE`, borderColor: 'rgba(30,26,20,.15)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button type="button" onClick={() => scrollToId('ux-top')} className="text-xl italic" style={{ fontFamily: SERIF }}>{d.name}</button>
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[13px] uppercase tracking-[0.14em] md:flex">
            {nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100">{l}</button>)}
          </nav>
          <button type="button" onClick={() => scrollToId('ux-contact')} className="rounded-full border px-4 py-2 text-[12px] uppercase tracking-[0.14em] transition hover:bg-[#1E1A14] hover:text-[#F6F1E7]" style={{ borderColor: ink }}>{d.cta}</button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 md:pt-24">
        <PfReveal className="mb-8 flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-[#1E1A14]/60"><span className="h-px w-10 bg-current" />{d.title}{d.location ? ` · ${d.location}` : ''}</PfReveal>
        <PfReveal delay={80}>
          <h1 className="text-[clamp(2.6rem,8vw,6.6rem)] font-light leading-[0.98] tracking-tight" style={{ fontFamily: SERIF }}>
            {d.headline || `${d.name} designs thoughtful products.`}
          </h1>
        </PfReveal>
        <div className="mt-12 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
          <PfReveal delay={160} from="scale" className="relative overflow-hidden rounded-[2px]"><SmartImg src={d.has.projects ? d.projects[0].image : d.cover} seed={d.name} alt="" className="aspect-[16/9] w-full object-cover" loading="eager" /></PfReveal>
          <PfReveal delay={240}>
            <p className="max-w-md text-[17px] leading-8 text-[#1E1A14]/75">{d.bio}</p>
            <div className="mt-6 flex items-center gap-5">
              {d.has.projects && <button type="button" onClick={() => scrollToId('ux-work')} className="group inline-flex items-center gap-2 border-b border-current pb-1 text-sm font-medium">Selected work <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>}
              {d.available && <span className="inline-flex items-center gap-2 text-[13px] text-[#1E1A14]/65"><span className="h-2 w-2 rounded-full bg-[#2F8F5B]" />{d.availabilityLabel}</span>}
            </div>
          </PfReveal>
        </div>
        <PfReveal delay={300} className={`mt-14 grid grid-cols-3 border-y ${rule} py-6 text-center`}>
          {d.stats.slice(0, 3).map((m) => <div key={m.label}><div className="text-3xl font-light sm:text-5xl" style={{ fontFamily: SERIF }}>{m.value}</div><div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#1E1A14]/55">{m.label}</div></div>)}
        </PfReveal>
      </section>

      {/* Work */}
      {d.has.projects && (
        <section id="ux-work" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <PfReveal className="mb-12 flex items-end justify-between"><h2 className="text-4xl font-light italic sm:text-6xl" style={{ fontFamily: SERIF }}>Selected work</h2><span className="text-sm text-[#1E1A14]/55">{String(d.projects.length).padStart(2, '0')} case studies</span></PfReveal>
          <div className="space-y-20 md:space-y-28">
            {d.projects.map((p, i) => (
              <article key={p.id} className={`grid items-center gap-8 md:grid-cols-12 ${i % 2 ? '' : ''}`}>
                <PfReveal from={i % 2 ? 'right' : 'left'} className={`group relative overflow-hidden md:col-span-7 ${i % 2 ? 'md:order-2' : ''}`}>
                  <SmartImg src={p.image} seed={p.title} alt={p.title} className="aspect-[4/3] w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.04]" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#F6F1E7] px-3 py-1 text-[11px] uppercase tracking-[0.14em]">{p.category}</span>
                </PfReveal>
                <PfReveal delay={120} className={`md:col-span-5 ${i % 2 ? 'md:order-1 md:pr-8' : 'md:pl-8'}`}>
                  <div className="text-[12px] uppercase tracking-[0.2em] text-[#1E1A14]/50">{String(i + 1).padStart(2, '0')}{p.year ? ` — ${p.year}` : ''}</div>
                  <h3 className="mt-3 text-3xl font-light leading-tight sm:text-4xl" style={{ fontFamily: SERIF }}>{p.title}</h3>
                  {p.subtitle && <div className="mt-1 italic text-[#1E1A14]/60" style={{ fontFamily: SERIF }}>{p.subtitle}</div>}
                  <p className="mt-5 text-[15px] leading-7 text-[#1E1A14]/75">{p.summary}</p>
                  {p.metrics.length > 0 && <div className={`mt-6 flex gap-8 border-t ${rule} pt-5`}>{p.metrics.map((m) => <div key={m.label}><div className="text-2xl" style={{ fontFamily: SERIF }}>{m.value}</div><div className="text-[11px] uppercase tracking-[0.16em] text-[#1E1A14]/55">{m.label}</div></div>)}</div>}
                  {p.tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2 text-[12px] text-[#1E1A14]/65">{p.tags.map((t) => <span key={t} className={`rounded-full border ${rule} px-3 py-1`}>{t}</span>)}</div>}
                  <div className="mt-6 flex items-center gap-5 text-sm">
                    {p.description && p.description !== p.summary && <button type="button" aria-expanded={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)} className="border-b border-current pb-0.5 font-medium">{openId === p.id ? 'Close story' : 'Read the story'}</button>}
                    {p.caseStudyUrl && <a href={p.caseStudyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium">Case study <ArrowUpRight className="h-4 w-4" /></a>}
                  </div>
                  {openId === p.id && <p className="pf-fade mt-5 border-l-2 border-[#1E1A14] pl-5 text-[15px] leading-7 text-[#1E1A14]/80">{p.description}</p>}
                </PfReveal>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {d.bio && (
        <section id="ux-about" className="scroll-mt-20 border-y" style={{ borderColor: 'rgba(30,26,20,.15)', background: '#EFE8DA' }}>
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[360px_1fr]">
            <PfReveal from="left"><SmartImg src={d.avatar} seed={d.name} alt={`Portrait of ${d.name}`} className="aspect-[4/5] w-full object-cover grayscale-[20%]" /></PfReveal>
            <PfReveal delay={100}>
              <h2 className="text-4xl font-light italic sm:text-5xl" style={{ fontFamily: SERIF }}>About</h2>
              <p className="mt-6 text-[19px] leading-9 text-[#1E1A14]/85" style={{ fontFamily: SERIF }}>{d.story || d.bio}</p>
              {d.has.skills && (
                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  {d.skillGroups.map((g) => <div key={g.name}><div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#1E1A14]/55">{g.name}</div><ul className={`divide-y ${'divide-[#1E1A14]/10'} border-y ${rule}`}>{g.items.map((s) => <li key={s.id} className="flex justify-between py-2.5 text-[15px]"><span>{s.name}</span><span className="text-[#1E1A14]/45">{s.level}</span></li>)}</ul></div>)}
                </div>
              )}
            </PfReveal>
          </div>
        </section>
      )}

      {/* Experience */}
      {d.has.experience && (
        <section id="ux-exp" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <PfReveal><h2 className="text-4xl font-light italic sm:text-5xl" style={{ fontFamily: SERIF }}>Experience</h2></PfReveal>
          <div className={`mt-10 border-t ${rule}`}>
            {d.experience.map((e) => (
              <PfReveal key={e.id} className={`grid gap-2 border-b ${rule} py-7 md:grid-cols-[180px_1fr_1.4fr] md:gap-8`}>
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#1E1A14]/55">{e.period}</div>
                <div><div className="text-xl" style={{ fontFamily: SERIF }}>{e.role}</div><div className="text-[#1E1A14]/60">{e.company}</div></div>
                <div className="text-[15px] leading-7 text-[#1E1A14]/75">{e.description}{e.highlights.length > 0 && <ul className="mt-2 list-disc pl-5">{e.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}</div>
              </PfReveal>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {d.has.testimonials && quote && (
        <section id="ux-quotes" className="scroll-mt-20 px-5 py-24 sm:px-8" style={{ background: ink, color: paper }}>
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-7xl leading-none opacity-40" style={{ fontFamily: SERIF }} aria-hidden>“</div>
            <blockquote key={quote.id} className="pf-fade -mt-4 text-3xl font-light leading-snug sm:text-4xl" style={{ fontFamily: SERIF }}>{quote.quote}</blockquote>
            <div className="mt-8 text-sm uppercase tracking-[0.18em] opacity-70">{quote.author}{quote.role ? ` — ${quote.role}` : ''}</div>
            {d.testimonials.length > 1 && <div className="mt-8 flex justify-center gap-3"><button type="button" aria-label="Previous quote" onClick={() => setQ((q - 1 + d.testimonials.length) % d.testimonials.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-current/40 hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button><button type="button" aria-label="Next quote" onClick={() => setQ((q + 1) % d.testimonials.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-current/40 hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button></div>}
          </div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="ux-background" theme={{ text: ink, muted: 'rgba(30,26,20,.6)', border: 'rgba(30,26,20,.12)', accent: '#2F8F5B', font: SERIF }} />

      <section id="ux-contact" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
        <PfReveal><p className="text-[12px] uppercase tracking-[0.22em] text-[#1E1A14]/55">{d.available ? d.availabilityLabel : 'Say hello'}</p></PfReveal>
        <PfReveal delay={80}><a href={mailto(d.email, `Hello ${d.firstName}`)} className="mt-6 inline-block break-all text-[clamp(1.8rem,6vw,4.4rem)] font-light italic underline decoration-1 underline-offset-[10px] transition hover:decoration-2" style={{ fontFamily: SERIF }}>{d.email || 'hello@example.com'}</a></PfReveal>
        <SocialRow socials={d.socials} className="mt-10 justify-center" showLabel itemClass="flex items-center gap-2 rounded-full border border-[#1E1A14]/20 px-4 py-2 text-[13px] transition hover:bg-[#1E1A14] hover:text-[#F6F1E7]" />
      </section>
      <footer className={`border-t ${rule} px-5 py-6 text-center text-[12px] text-[#1E1A14]/50`}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default EditorialUX;
