import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, MapPin, Menu, Send, Star, X } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialRow, scrollToId, useFonts, useMailtoForm } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';

const STEPS = [
  { t: 'Discover', d: 'A short call to understand your goals, audience and deadline. You get a fixed quote within 48 hours.' },
  { t: 'Design & build', d: 'Weekly check-ins with working previews, so there are no surprises at the end.' },
  { t: 'Launch & support', d: 'We go live together, then I stay on hand for tweaks and questions.' }
];

/**
 * Freelancer Services & Clients — a conversion-focused service site: sticky header with a call to
 * action, pricing-style service cards, a how-it-works strip, client proof, and a topic-aware enquiry form.
 */
export const FreelancerServices: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'ui', palette: 'ocean' }), [props]);
  const [menu, setMenu] = useState(false);
  const { sent, submit } = useMailtoForm(d.email, `Project enquiry for ${d.name}`);
  const nav = [d.has.services && ['Services', 'fl-services'], d.has.projects && ['Work', 'fl-work'], ['Process', 'fl-process'], d.has.testimonials && ['Clients', 'fl-clients'], ['Contact', 'fl-contact']].filter(Boolean) as [string, string][];
  const go = (id: string) => { setMenu(false); scrollToId(id); };
  const companies = [...new Set(d.testimonials.map((t) => t.role?.split(' · ').pop()).filter(Boolean))] as string[];
  const topics = d.has.services ? d.services.map((s) => s.title) : ['New project', 'Something else'];

  return (
    <div id="fl-top" className="min-h-screen bg-white text-[#0F172A]" style={{ fontFamily: SANS }}>
      {/* Sticky header with CTA */}
      <header className="pf-noprint sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <button type="button" onClick={() => go('fl-top')} className="flex items-center gap-2.5 font-extrabold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-sm text-white">{d.initials}</span><span>{d.name}</span></button>
          <nav aria-label="Sections" className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => go(id)} className="rounded-lg px-3.5 py-2 transition hover:bg-slate-100 hover:text-slate-900">{l}</button>)}</nav>
          <div className="flex items-center gap-2"><button type="button" onClick={() => go('fl-contact')} className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]">{d.cta}</button><button type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)} className="rounded-lg p-2 md:hidden">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        </div>
        {menu && <nav aria-label="Mobile sections" className="pf-fade border-t border-slate-200 bg-white px-5 py-2 md:hidden">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => go(id)} className="block w-full py-3 text-left font-semibold text-slate-700">{l}</button>)}</nav>}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EFF6FF] to-white">
        <div aria-hidden className="pf-float absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#BFDBFE]/50 blur-3xl" />
        <div aria-hidden className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-[#DDD6FE]/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.2fr_1fr] md:items-center md:pt-24">
          <div>
            {d.available && <PfReveal><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[13px] font-bold text-emerald-700"><span className="relative flex h-2 w-2"><span className="pf-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>{d.availabilityLabel}</span></PfReveal>}
            <PfReveal delay={80}><h1 className="mt-5 text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[1.04] tracking-tight">{d.title || d.name}</h1></PfReveal>
            <PfReveal delay={160}><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{d.headline}</p></PfReveal>
            <PfReveal delay={240} className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => go('fl-contact')} className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3.5 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5">{d.cta}<ArrowRight className="h-4 w-4" /></button>{d.has.projects && <button type="button" onClick={() => go('fl-work')} className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold transition hover:border-slate-400">See my work</button>}</PfReveal>
            <PfReveal delay={320} className="mt-10 grid max-w-md grid-cols-3 gap-4">{d.stats.slice(0, 3).map((m) => <div key={m.label}><div className="text-2xl font-extrabold sm:text-3xl">{m.value}</div><div className="text-[12px] font-semibold text-slate-500">{m.label}</div></div>)}</PfReveal>
          </div>
          <PfReveal from="scale" delay={150} className="relative">
            <div className="relative rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"><SmartImg src={d.avatar} seed={d.name} alt={`${d.name}`} loading="eager" className="aspect-[4/5] w-full rounded-2xl object-cover" /></div>
            <div className="pf-float absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl sm:-left-8"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Star className="h-5 w-5 fill-current" /></span><div><div className="text-sm font-extrabold">{d.testimonials.length ? `${(d.testimonials.reduce((a, t) => a + (t.rating || 5), 0) / d.testimonials.length).toFixed(1)} / 5 rating` : 'Trusted by clients'}</div><div className="text-xs text-slate-500">{d.has.testimonials ? `from ${d.testimonials.length} recent clients` : d.location}</div></div></div>
          </PfReveal>
        </div>
        {companies.length > 0 && <div className="relative mx-auto max-w-6xl px-5 pb-12"><div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-slate-200 pt-8 text-sm font-bold uppercase tracking-widest text-slate-400"><span className="text-[11px] font-semibold normal-case tracking-normal text-slate-500">Trusted by</span>{companies.map((c) => <span key={c}>{c}</span>)}</div></div>}
      </section>

      {/* Services */}
      {d.has.services && (
        <section id="fl-services" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-20">
          <PfReveal className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#2563EB]">Services</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Clear scope. Fixed price.</h2></PfReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {d.services.map((s, i) => (
              <PfReveal key={s.id} delay={i * 90}>
                <article className={`relative flex h-full flex-col rounded-3xl border p-7 transition duration-300 hover:-translate-y-1.5 ${s.featured ? 'border-[#2563EB] bg-[#0F172A] text-white shadow-2xl shadow-blue-900/25' : 'border-slate-200 bg-white hover:shadow-xl'}`}>
                  {s.featured && <span className="absolute -top-3 left-7 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-bold text-white">Most popular</span>}
                  <h3 className="text-xl font-extrabold">{s.title}</h3>
                  {s.price && <div className="mt-3 text-3xl font-extrabold">{s.price}</div>}
                  {s.timeline && <div className={`mt-1 inline-flex items-center gap-1.5 text-sm ${s.featured ? 'text-slate-300' : 'text-slate-500'}`}><Clock className="h-3.5 w-3.5" />{s.timeline}</div>}
                  <p className={`mt-4 text-[15px] leading-7 ${s.featured ? 'text-slate-300' : 'text-slate-600'}`}>{s.description}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">{s.deliverables.map((x) => <li key={x} className="flex items-start gap-2.5 text-sm font-medium"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${s.featured ? 'text-emerald-400' : 'text-emerald-600'}`} />{x}</li>)}</ul>
                  <button type="button" onClick={() => go('fl-contact')} className={`mt-7 rounded-xl py-3 text-sm font-bold transition ${s.featured ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>Get a quote</button>
                </article>
              </PfReveal>
            ))}
          </div>
        </section>
      )}

      {/* Work */}
      {d.has.projects && (
        <section id="fl-work" className="scroll-mt-20 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <PfReveal><p className="text-sm font-bold uppercase tracking-widest text-[#2563EB]">Recent work</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Projects that moved the needle</h2></PfReveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {d.projects.map((p, i) => (
                <PfReveal key={p.id} delay={(i % 2) * 90}>
                  <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-900/10">
                    <div className="overflow-hidden"><SmartImg src={p.image} seed={p.title} alt={p.title} className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105" /></div>
                    <div className="p-6"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>{p.category}</span><span>{p.year}</span></div><h3 className="mt-2 text-xl font-extrabold">{p.title}</h3><p className="mt-2 text-[15px] leading-7 text-slate-600">{p.summary}</p>{p.metrics.length > 0 && <div className="mt-4 flex gap-6">{p.metrics.map((m) => <div key={m.label} className="rounded-xl bg-emerald-50 px-3.5 py-2"><div className="text-lg font-extrabold text-emerald-700">{m.value}</div><div className="text-[11px] font-semibold text-emerald-700/80">{m.label}</div></div>)}</div>}</div>
                  </article>
                </PfReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      <section id="fl-process" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-20">
        <PfReveal className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#2563EB]">How it works</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Three simple steps</h2></PfReveal>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">{STEPS.map((s, i) => <PfReveal as="li" key={s.t} delay={i * 100} className="relative rounded-3xl border border-slate-200 p-7"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-lg font-extrabold text-white">{i + 1}</span><h3 className="mt-5 text-xl font-extrabold">{s.t}</h3><p className="mt-2 text-[15px] leading-7 text-slate-600">{s.d}</p></PfReveal>)}</ol>
      </section>

      {/* Testimonials */}
      {d.has.testimonials && (
        <section id="fl-clients" className="scroll-mt-20 bg-[#0F172A] py-20 text-white">
          <div className="mx-auto max-w-6xl px-5">
            <PfReveal><h2 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl">What clients say</h2></PfReveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">{d.testimonials.map((t, i) => <PfReveal key={t.id} delay={i * 90}><figure className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-7"><div className="flex gap-0.5 text-amber-400" aria-label={`${t.rating || 5} out of 5 stars`}>{Array.from({ length: Math.round(t.rating || 5) }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div><blockquote className="mt-4 flex-1 text-[15px] leading-7 text-slate-200">“{t.quote}”</blockquote><figcaption className="mt-5 text-sm"><b>{t.author}</b><div className="text-slate-400">{t.role}</div></figcaption></figure></PfReveal>)}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="fl-background" theme={{ text: '#0F172A', muted: '#64748B', border: '#E2E8F0', accent: '#2563EB', font: SANS }} />

      <section id="fl-contact" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] p-7 sm:p-12 md:grid-cols-[1fr_1.1fr]">
          <PfReveal><h2 className="text-4xl font-extrabold tracking-tight">Let’s talk about your project</h2><p className="mt-4 text-lg leading-8 text-slate-600">Tell me a little about what you need. {d.available ? d.availabilityLabel + '.' : ''} I reply within one working day.</p>{d.bio && <p className="mt-4 border-l-4 border-[#2563EB] pl-4 text-[15px] leading-7 text-slate-600">{d.bio}</p>}{d.email && <p className="mt-5 text-sm font-bold">Prefer email? <a href={`mailto:${d.email}`} className="text-[#2563EB] underline underline-offset-4">{d.email}</a></p>}{d.location &&<p className="mt-6 flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-[#2563EB]" />{d.location}</p>}<SocialRow socials={d.socials} className="mt-6" showLabel itemClass="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold transition hover:border-slate-500" /></PfReveal>
          <PfReveal delay={100}>
            <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5">
              {[['name', 'Your name', 'text'], ['email', 'Email', 'email']].map(([n, l, ty]) => <label key={n} className="block text-sm font-bold">{l}<input required name={n} type={ty} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" /></label>)}
              <label className="block text-sm font-bold">I’m interested in<select name="topic" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100">{topics.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="block text-sm font-bold">About the project<textarea required name="message" rows={4} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100" /></label>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 font-bold text-white transition hover:bg-[#1D4ED8]"><Send className="h-4 w-4" />Send enquiry</button>
              {sent && <p role="status" className="text-sm font-semibold text-emerald-600">✓ Thanks! Your mail app should open with the message ready to send.</p>}
            </form>
          </PfReveal>
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default FreelancerServices;
