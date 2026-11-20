import React, { useMemo, useState } from 'react';
import { Heart, Mail, Play, Sparkles, X } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialIcon, scrollToId, useFonts, mailto } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap';
const SANS = 'Sora, system-ui, sans-serif';

const PLATFORM_ORDER = ['youtube', 'instagram', 'tiktok', 'twitter', 'x', 'twitch', 'spotify', 'facebook', 'threads', 'website'];

/**
 * Creator Media Hub — a link-in-bio style home for content creators: a centered profile with a social
 * button stack, a video wall with an in-page player, a "latest content" grid, collaboration packages and
 * a brand-partner enquiry. Warm gradients, rounded everything, playful motion.
 */
export const CreatorMedia: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'mesh', palette: 'neon' }), [props]);
  const [play, setPlay] = useState<string | null>(null);
  const socials = [...d.socials].sort((a, b) => PLATFORM_ORDER.indexOf(a.key) - PLATFORM_ORDER.indexOf(b.key));
  const nav = [d.has.media && ['Watch', 'cm-watch'], d.has.projects && ['Latest', 'cm-latest'], d.has.services && ['Collaborate', 'cm-collab'], d.bio && ['About', 'cm-about'], ['Contact', 'cm-contact']].filter(Boolean) as [string, string][];
  const video = d.videos.find((v) => v.id === play);
  const card = 'rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur';

  return (
    <div id="cm-top" className="relative flow-root min-h-screen overflow-x-clip bg-[#14081F] text-white" style={{ fontFamily: SANS }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="pf-float absolute -left-24 top-0 h-96 w-96 rounded-full bg-[#F72585]/30 blur-[110px]" /><div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-[#4CC9F0]/25 blur-[110px]" /><div className="pf-float absolute left-1/3 top-[60%] h-80 w-80 rounded-full bg-[#7209B7]/35 blur-[110px]" /></div>

      <header className="pf-noprint sticky top-3 z-30 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-3xl items-center justify-between gap-2 rounded-full border border-white/15 bg-[#14081F]/70 px-3 py-2 backdrop-blur-xl">
        <button type="button" onClick={() => scrollToId('cm-top')} className="flex items-center gap-2 pl-1 text-sm font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F72585] to-[#7209B7] text-xs">{d.initials}</span><span className="hidden sm:inline">{d.name}</span></button>
        <nav aria-label="Sections" className="pf-no-scrollbar flex gap-0.5 overflow-x-auto text-[13px] font-semibold text-white/70">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">{l}</button>)}</nav>
        <button type="button" onClick={() => scrollToId('cm-contact')} className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#14081F] transition hover:scale-105">Work with me</button>
      </header>

      {/* Link-in-bio hero */}
      <section className="relative mx-auto max-w-2xl px-5 pb-12 pt-14 text-center">
        <PfReveal from="scale"><div className="relative mx-auto h-36 w-36"><span aria-hidden className="pf-gradient absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#F72585] via-[#FFB703] to-[#4CC9F0]" /><SmartImg src={d.avatar} seed={d.name} alt={`${d.name}`} loading="eager" className="relative h-full w-full rounded-full border-4 border-[#14081F] object-cover" />{d.available && <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#14081F] bg-[#06D6A0]"><Sparkles className="h-4 w-4 text-[#14081F]" /></span>}</div></PfReveal>
        <PfReveal delay={80}><h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">{d.name}</h1><p className="mt-2 text-[15px] font-semibold text-[#4CC9F0]">{d.title}</p></PfReveal>
        <PfReveal delay={140}><p className="mx-auto mt-4 max-w-lg text-[16px] leading-7 text-white/75">{d.headline}</p></PfReveal>
        <PfReveal delay={200} className="mt-7 grid grid-cols-3 gap-3">{d.stats.slice(0, 3).map((m, i) => <div key={m.label} className={`${card} px-3 py-4`}><div className="bg-gradient-to-r from-[#F72585] to-[#FFB703] bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl" style={i === 1 ? { backgroundImage: 'linear-gradient(90deg,#4CC9F0,#06D6A0)' } : undefined}>{m.value}</div><div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">{m.label}</div></div>)}</PfReveal>
        <PfReveal delay={260} className="mt-7 space-y-3">{socials.slice(0, 5).map((s, i) => <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" className={`group flex items-center justify-between rounded-2xl border border-white/15 px-5 py-4 font-bold transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] ${i === 0 ? 'bg-gradient-to-r from-[#F72585] to-[#7209B7] shadow-[0_15px_50px_-15px_rgba(247,37,133,.8)]' : 'bg-white/[0.06] hover:bg-white/10'}`}><span className="flex items-center gap-3"><SocialIcon k={s.key} className="h-5 w-5" />{s.key === 'youtube' ? 'Watch on YouTube' : `Follow on ${s.label}`}</span><span aria-hidden className="transition group-hover:translate-x-1">→</span></a>)}</PfReveal>
      </section>

      {/* Video wall */}
      {d.has.media && (
        <section id="cm-watch" className="scroll-mt-24 mx-auto max-w-4xl px-5 py-12">
          <PfReveal><h2 className="text-center text-3xl font-extrabold sm:text-4xl">Latest videos</h2></PfReveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">{d.videos.map((v, i) => <PfReveal key={v.id} delay={i * 80} from="scale"><button type="button" onClick={() => setPlay(v.id)} aria-label={`Play ${v.title}`} className={`group relative block w-full overflow-hidden ${card} p-2 text-left transition duration-300 hover:-translate-y-1`}><div className="relative aspect-video overflow-hidden rounded-[22px]"><SmartImg src={v.thumb} seed={v.title} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#14081F] shadow-2xl transition group-hover:scale-110"><Play className="h-6 w-6 translate-x-0.5 fill-current" /></span></span></div><div className="px-3 py-3 text-[15px] font-bold">{v.title}</div></button></PfReveal>)}</div>
        </section>
      )}
      {video && <div role="dialog" aria-modal="true" aria-label={video.title} className="pf-fade fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setPlay(null)}><button type="button" aria-label="Close video" onClick={() => setPlay(null)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button><div className="aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}><iframe title={video.title} src={`${video.embed}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" /></div></div>}

      {/* Latest content grid */}
      {d.has.projects && (
        <section id="cm-latest" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-12">
          <PfReveal><h2 className="text-center text-3xl font-extrabold sm:text-4xl">Top content</h2></PfReveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{d.projects.map((p, i) => <PfReveal key={p.id} delay={(i % 4) * 70} from="scale" className={i === 0 ? 'col-span-2 row-span-2' : ''}><article className={`group relative h-full overflow-hidden ${card}`}><SmartImg src={p.image} seed={p.title} alt={p.title} className={`w-full object-cover transition duration-500 group-hover:scale-110 ${i === 0 ? 'aspect-square md:h-full' : 'aspect-[4/5]'}`} /><div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4"><span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">{p.category}</span><h3 className={`mt-2 font-extrabold leading-tight ${i === 0 ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'}`}>{p.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-white/75"><Heart className="h-3 w-3 fill-[#F72585] text-[#F72585]" />{p.summary.split('·')[0]}</p></div></article></PfReveal>)}</div>
        </section>
      )}

      {/* Collaboration packages */}
      {d.has.services && (
        <section id="cm-collab" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-12">
          <PfReveal><h2 className="text-center text-3xl font-extrabold sm:text-4xl">Work with me</h2><p className="mx-auto mt-3 max-w-md text-center text-white/65">Honest, audience-first partnerships.</p></PfReveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">{d.services.map((s, i) => <PfReveal key={s.id} delay={i * 90}><article className={`${card} h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-[#F72585]/60`}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F72585] to-[#7209B7] text-lg font-extrabold">{i + 1}</span><h3 className="mt-4 text-xl font-extrabold">{s.title}</h3><p className="mt-2 text-[15px] leading-7 text-white/70">{s.description}</p><div className="mt-4 space-y-1 text-[13px] font-semibold text-[#4CC9F0]">{s.timeline && <div>⏱ {s.timeline}</div>}{s.price && <div>{s.price}</div>}</div></article></PfReveal>)}</div>
          {d.has.testimonials && <div className="mt-8 grid gap-5 md:grid-cols-2">{d.testimonials.map((t) => <PfReveal key={t.id}><figure className={`${card} p-6`}><blockquote className="text-[16px] leading-7">“{t.quote}”</blockquote><figcaption className="mt-3 text-sm font-bold text-[#FFB703]">{t.author}<span className="font-medium text-white/55">{t.role ? ` · ${t.role}` : ''}</span></figcaption></figure></PfReveal>)}</div>}
        </section>
      )}

      {/* About */}
      {d.bio && <section id="cm-about" className="scroll-mt-24 mx-auto max-w-2xl px-5 py-12 text-center"><PfReveal><h2 className="text-3xl font-extrabold sm:text-4xl">About me</h2><p className="mt-5 text-[17px] leading-8 text-white/80">{d.bio}</p>{d.interests.length > 0 && <div className="mt-6 flex flex-wrap justify-center gap-2">{d.interests.map((i) => <span key={i} className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold">#{i.replace(/\s+/g, '')}</span>)}</div>}</PfReveal></section>}

      {/* Contact */}
      <BackgroundBlock d={d} id="cm-background" theme={{ text: '#FFFFFF', muted: 'rgba(255,255,255,.62)', border: 'rgba(255,255,255,.12)', accent: '#F72585', font: SANS }} />

      <section id="cm-contact" className="scroll-mt-24 mx-auto max-w-2xl px-5 pb-20 pt-12 text-center">
        <PfReveal className="rounded-[36px] bg-gradient-to-br from-[#F72585] via-[#B5179E] to-[#7209B7] p-8 shadow-[0_30px_100px_-30px_rgba(247,37,133,.7)] sm:p-12"><h2 className="text-3xl font-extrabold sm:text-4xl">Let’s make something together</h2><p className="mx-auto mt-3 max-w-md text-white/85">{d.available ? d.availabilityLabel + '. ' : ''}Brands, studios and fellow creators: say hello.</p><a href={mailto(d.email, `Collaboration with ${d.name}`)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[#7209B7] transition hover:scale-105"><Mail className="h-4 w-4" />{d.cta}</a>{d.email && <p className="mt-4 text-sm text-white/75">{d.email}</p>}</PfReveal>
      </section>
      <footer className="px-5 pb-8 text-center text-xs text-white/40">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default CreatorMedia;
