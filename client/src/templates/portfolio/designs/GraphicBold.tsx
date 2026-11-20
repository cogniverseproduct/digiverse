import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Mail, Star } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, Lightbox, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;800&family=Space+Grotesk:wght@400;500;700&display=swap';
const DISPLAY = 'Unbounded, "Space Grotesk", sans-serif';
const SANS = '"Space Grotesk", system-ui, sans-serif';
const COLORS = ['#FFD400', '#FF3D81', '#2F6BFF', '#00C2A8', '#FF7A1A'];

/**
 * Bold Graphic Designer — neo-brutalist colour blocks, thick outlines, offset shadows, rotated stickers
 * and a never-ending marquee. Deliberately loud; every card sits on its own colour.
 */
export const GraphicBold: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'poster', palette: 'candy' }), [props]);
  const [cat, setCat] = useState('All');
  const [lb, setLb] = useState<number | null>(null);
  const cats = ['All', ...d.projectCategories];
  const list = d.projects.filter((p) => cat === 'All' || p.category === cat);
  const words = [...d.skills.map((s) => s.name), ...(d.skills.length ? [] : [d.title || 'Design'])];
  const marquee = words.length ? words : ['Design'];
  const border = 'border-[3px] border-black';
  const shadow = 'shadow-[6px_6px_0_0_#000]';

  return (
    <div id="gb-top" className="min-h-screen bg-[#FFF8E7] text-black" style={{ fontFamily: SANS }}>
      {/* Header: sticky pill bar */}
      <header className="pf-noprint sticky top-0 z-30 px-3 pt-3 sm:px-6">
        <div className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full ${border} bg-white px-4 py-2 ${shadow}`}>
          <button type="button" onClick={() => scrollToId('gb-top')} className="flex items-center gap-2 text-sm font-bold sm:text-base" style={{ fontFamily: DISPLAY }}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3D81] text-white">{d.initials}</span><span className="hidden sm:inline">{d.name}</span></button>
          <nav aria-label="Sections" className="hidden gap-1 text-sm font-bold md:flex">
            {[d.has.projects && ['Work', 'gb-work'], d.bio && ['About', 'gb-about'], d.has.testimonials && ['Love', 'gb-love'], ['Hire me', 'gb-contact']].filter(Boolean).map((x, i) => { const [l, id] = x as [string, string]; return <button key={id} type="button" onClick={() => scrollToId(id)} className="rounded-full px-4 py-1.5 transition hover:text-white" style={{ ['--h' as string]: COLORS[i % 5] }} onMouseEnter={(e) => (e.currentTarget.style.background = COLORS[i % 5])} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>{l}</button>; })}
          </nav>
          <button type="button" onClick={() => scrollToId('gb-contact')} className={`rounded-full ${border} bg-[#FFD400] px-4 py-1.5 text-sm font-bold transition hover:-translate-y-0.5`}>{d.cta.length > 18 ? 'Hire me' : d.cta}</button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-14 sm:px-6 md:pt-20">
        <div aria-hidden className="pf-float absolute -right-10 top-10 h-40 w-40 rounded-full border-[3px] border-black bg-[#00C2A8] sm:h-60 sm:w-60" />
        <div aria-hidden className="pf-tilt absolute left-[56%] top-[7%] hidden h-20 w-20 border-[3px] border-black bg-[#2F6BFF] md:block" />
        <div className="relative mx-auto max-w-6xl">
          <PfReveal><span className={`inline-flex items-center gap-2 rounded-full ${border} bg-[#FF3D81] px-4 py-1.5 text-sm font-bold text-white`}><Star className="h-4 w-4 fill-current" />{d.availabilityLabel}</span></PfReveal>
          <PfReveal delay={80}><h1 className="mt-6 text-[clamp(1.75rem,8vw,8rem)] font-extrabold uppercase leading-[0.9] tracking-tight" style={{ fontFamily: DISPLAY }}>
            {d.title ? d.title.split(/\s*&\s*|\s+/).slice(0, 3).map((w, i) => <span key={i} className="mr-[0.25em] inline-block" style={i === 1 ? { color: '#FF3D81', textShadow: '4px 4px 0 #000' } : undefined}>{w}</span>) : d.name}
          </h1></PfReveal>
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_340px] md:items-start">
            <PfReveal delay={160}><p className="max-w-2xl text-xl font-medium leading-8 sm:text-2xl sm:leading-9">{d.headline}</p>
              <div className="mt-8 flex flex-wrap gap-4"><button type="button" onClick={() => scrollToId('gb-work')} className={`rounded-xl ${border} bg-black px-6 py-3 font-bold text-white ${shadow} transition hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#FF3D81]`}>See the work</button><button type="button" onClick={() => scrollToId('gb-contact')} className={`rounded-xl ${border} bg-white px-6 py-3 font-bold ${shadow} transition hover:-translate-y-1`}>Say hi</button></div></PfReveal>
            <PfReveal delay={240} from="scale" className="relative"><SmartImg src={d.has.projects ? d.projects[0].image : d.cover} seed={d.name} alt="" loading="eager" className={`aspect-square w-full rounded-2xl ${border} object-cover ${shadow} rotate-2`} />
              <span className={`absolute -bottom-4 -left-4 rotate-[-8deg] rounded-xl ${border} bg-[#FFD400] px-4 py-2 text-sm font-extrabold`} style={{ fontFamily: DISPLAY }}>{d.stats[0] ? `${d.stats[0].value} ${d.stats[0].label}` : 'Hello!'}</span></PfReveal>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className={`pf-marquee-wrap overflow-hidden border-y-[3px] border-black bg-[#FFD400] py-4`} aria-hidden>
        <div className="pf-marquee" style={{ ['--pf-speed' as string]: '30s' }}>
          {[0, 1].map((n) => <div key={n} data-dup={n ? '' : undefined} className="flex shrink-0 items-center">{[...marquee, ...marquee].map((w, i) => <span key={i} className="mx-5 flex items-center gap-10 whitespace-nowrap text-2xl font-extrabold uppercase sm:text-4xl" style={{ fontFamily: DISPLAY }}>{w}<Star className="h-6 w-6 fill-black" /></span>)}</div>)}
        </div>
      </div>

      {/* Work */}
      {d.has.projects && (
        <section id="gb-work" className="scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <PfReveal className="flex flex-wrap items-end justify-between gap-5"><h2 className="text-5xl font-extrabold uppercase sm:text-7xl" style={{ fontFamily: DISPLAY }}>Work</h2>
              <div role="tablist" aria-label="Filter work" className="flex flex-wrap gap-2">{cats.map((c, i) => <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`rounded-full ${border} px-4 py-1.5 text-sm font-bold transition hover:-translate-y-0.5`} style={{ background: cat === c ? COLORS[i % 5] : '#fff' }}>{c}</button>)}</div></PfReveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => (
                <PfReveal key={p.id} delay={(i % 3) * 80} from="scale">
                  <article className={`group overflow-hidden rounded-2xl ${border} ${shadow} transition duration-300 hover:-translate-y-2 hover:rotate-[-1deg] hover:shadow-[10px_10px_0_0_#000]`} style={{ background: COLORS[i % 5] }}>
                    <button type="button" onClick={() => setLb(i)} aria-label={`Open ${p.title}`} className="block w-full overflow-hidden border-b-[3px] border-black"><SmartImg src={p.image} seed={p.title} alt={p.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-110" /></button>
                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase"><span className="rounded-full border-2 border-black bg-white px-2.5 py-0.5">{p.category}</span><span>{p.year}</span></div>
                      <h3 className="mt-3 text-xl font-extrabold leading-tight" style={{ fontFamily: DISPLAY }}>{p.title}</h3>
                      {p.subtitle && <div className="text-sm font-bold opacity-80">{p.subtitle}</div>}
                      <p className="mt-2 text-[15px] font-medium leading-6">{p.summary}</p>
                    </div>
                  </article>
                </PfReveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <Lightbox items={list.map((p) => ({ src: p.image, title: p.title, caption: p.subtitle }))} index={lb} onClose={() => setLb(null)} onIndex={setLb} />

      {/* About */}
      {d.bio && (
        <section id="gb-about" className="scroll-mt-20 border-y-[3px] border-black bg-[#2F6BFF] px-4 py-20 text-white sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[320px_1fr] md:items-center">
            <PfReveal from="left"><SmartImg src={d.avatar} seed={d.name} alt={`Portrait of ${d.name}`} className={`aspect-[4/5] w-full max-w-xs rounded-[40%_60%_55%_45%/50%_45%_55%_50%] ${border} bg-white object-cover ${shadow}`} /></PfReveal>
            <PfReveal delay={100}>
              <h2 className="text-4xl font-extrabold uppercase sm:text-6xl" style={{ fontFamily: DISPLAY }}>Hi, I’m {d.firstName}.</h2>
              <p className="mt-5 max-w-2xl text-xl leading-9">{d.bio}</p>
              {d.has.skills && <ul className="mt-6 flex flex-wrap gap-2">{d.skills.map((s, i) => <li key={s.id} className={`rounded-full ${border} px-4 py-1.5 text-sm font-bold text-black`} style={{ background: COLORS[i % 5] }}>{s.name}</li>)}</ul>}
              {d.has.experience && <ul className="mt-8 space-y-2 text-lg">{d.experience.map((e) => <li key={e.id} className="flex flex-wrap gap-x-3 border-b-2 border-white/40 pb-2"><b>{e.role}</b><span className="opacity-90">{e.company}</span><span className="ml-auto opacity-80">{e.period}</span></li>)}</ul>}
            </PfReveal>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {d.has.testimonials && (
        <section id="gb-love" className="scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl"><PfReveal><h2 className="text-5xl font-extrabold uppercase sm:text-7xl" style={{ fontFamily: DISPLAY }}>Kind words</h2></PfReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2">{d.testimonials.map((t, i) => <PfReveal key={t.id} delay={i * 80}><figure className={`rounded-2xl ${border} bg-white p-7 ${shadow}`}><blockquote className="text-xl font-medium leading-8">“{t.quote}”</blockquote><figcaption className="mt-5 text-sm font-bold">{t.author}{t.role ? ` · ${t.role}` : ''}</figcaption></figure></PfReveal>)}</div></div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="gb-background" theme={{ text: '#000', muted: 'rgba(0,0,0,.65)', border: '#000', accent: '#FF3D81', font: DISPLAY }} />

      <section id="gb-contact" className="scroll-mt-20 border-t-[3px] border-black bg-[#FF3D81] px-4 py-24 text-center sm:px-6">
        <PfReveal><h2 className="text-[clamp(2.4rem,9vw,7rem)] font-extrabold uppercase leading-[0.95] text-white" style={{ fontFamily: DISPLAY }}>Let’s make<br />something loud.</h2></PfReveal>
        <PfReveal delay={120}><a href={mailto(d.email, `Project enquiry for ${d.name}`)} className={`mt-10 inline-flex items-center gap-3 rounded-2xl ${border} bg-[#FFD400] px-8 py-4 text-lg font-extrabold ${shadow} transition hover:-translate-y-1`}><Mail className="h-5 w-5" />{d.email || 'hello@example.com'}<ArrowUpRight className="h-5 w-5" /></a></PfReveal>
        <SocialRow socials={d.socials} className="mt-10 justify-center" showLabel itemClass={`flex items-center gap-2 rounded-full ${border} bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5`} />
      </section>
      <footer className="bg-black px-4 py-5 text-center text-sm font-bold text-white">© {new Date().getFullYear()} {d.name}. Made with too much colour.</footer>
    </div>
  );
};

export default GraphicBold;
