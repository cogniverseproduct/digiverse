import React, { useMemo } from 'react';
import { Award, Briefcase, Download, ExternalLink, GraduationCap, Mail, MapPin, Phone, Rocket, Sparkles } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { PfReveal, SmartImg, SocialRow, mailto, scrollToId, useActiveSection, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500&display=swap';
const HEAD = 'Outfit, system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

const H: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => <PfReveal className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] text-white">{icon}</span><h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: HEAD }}>{children}</h2></PfReveal>;

/**
 * Fresh Graduate Profile — a friendly résumé-first layout: a sticky profile card on the left, education
 * leading the story, then internships, projects, certifications and skills. Includes a print-ready CV.
 */
export const GraduateProfile: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'ui', palette: 'ocean' }), [props]);
  const certs = [
    ...d.recognition.map((r) => ({ id: r.id, title: r.title, venue: r.issuer, year: r.year, url: r.url, authors: [] as string[], type: r.kind === 'award' ? 'Award' : 'Certification' })),
    ...d.publications
  ];
  const sections = [
    { id: 'gp-edu', label: 'Education', show: d.has.education },
    { id: 'gp-exp', label: 'Experience', show: d.has.experience },
    { id: 'gp-proj', label: 'Projects', show: d.has.projects },
    { id: 'gp-cert', label: 'Certifications', show: certs.length > 0 },
    { id: 'gp-skills', label: 'Skills', show: d.has.skills },
    { id: 'gp-contact', label: 'Contact', show: true }
  ].filter((s) => s.show);
  const active = useActiveSection(sections.map((s) => s.id));
  const card = 'rounded-3xl border border-sky-100 bg-white shadow-[0_10px_40px_-20px_rgba(14,116,144,.25)]';

  return (
    <div id="gp-top" className="min-h-screen bg-gradient-to-b from-[#F0F9FF] via-white to-[#F5F3FF] text-[#0B1B2B]" style={{ fontFamily: SANS }}>
      <header className="pf-noprint sticky top-0 z-30 border-b border-sky-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <button type="button" onClick={() => scrollToId('gp-top')} className="text-lg font-bold" style={{ fontFamily: HEAD }}>{d.name}</button>
          <nav aria-label="Sections" className="pf-no-scrollbar hidden gap-1 overflow-x-auto text-sm font-medium text-slate-600 md:flex">{sections.map((s) => <button key={s.id} type="button" onClick={() => scrollToId(s.id)} className={`rounded-full px-3.5 py-1.5 transition ${active === s.id ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-100'}`}>{s.label}</button>)}</nav>
          {d.resumeUrl
            ? <a href={d.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0B1B2B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"><Download className="h-4 w-4" /><span className="hidden sm:inline">Download CV</span><span className="sm:hidden">CV</span></a>
            : <button type="button" onClick={() => typeof window !== 'undefined' && window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#0B1B2B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"><Download className="h-4 w-4" /><span className="hidden sm:inline">Download CV</span><span className="sm:hidden">CV</span></button>}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[320px_1fr]">
        {/* Sticky profile card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PfReveal from="left" className={`${card} overflow-hidden`}>
            <div className="h-24 bg-gradient-to-r from-[#0EA5E9] via-[#6366F1] to-[#A855F7]" />
            <div className="-mt-14 px-6 pb-6 text-center">
              <SmartImg src={d.avatar} seed={d.name} alt={`Portrait of ${d.name}`} loading="eager" className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg" />
              <h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: HEAD }}>{d.name}</h1>
              <p className="mt-1 text-[15px] font-medium text-sky-700">{d.title}</p>
              {d.available && <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700"><Sparkles className="h-3.5 w-3.5" />{d.availabilityLabel}</p>}
              <ul className="mt-5 space-y-2.5 text-left text-sm text-slate-600">
                {d.email && <li className="flex items-center gap-3"><Mail className="h-4 w-4 shrink-0 text-sky-600" /><a href={mailto(d.email, `Hello ${d.firstName}`)} className="truncate hover:text-sky-700">{d.email}</a></li>}
                {d.phone && <li className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-sky-600" />{d.phone}</li>}
                {d.location && <li className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-sky-600" />{d.location}</li>}
              </ul>
              <SocialRow socials={d.socials} className="mt-5 justify-center" itemClass="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700 transition hover:bg-sky-600 hover:text-white" />
            </div>
          </PfReveal>
          {d.stats.length > 0 && <PfReveal delay={120} className="mt-5 grid grid-cols-3 gap-3">{d.stats.map((m) => <div key={m.label} className={`${card} p-3 text-center`}><div className="text-xl font-bold text-sky-700" style={{ fontFamily: HEAD }}>{m.value}</div><div className="text-[11px] font-medium text-slate-500">{m.label}</div></div>)}</PfReveal>}
        </aside>

        {/* Main column */}
        <main className="min-w-0 space-y-14">
          <PfReveal className={`${card} p-7`}>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-sky-600">About me</p>
            <p className="mt-3 text-xl font-medium leading-9" style={{ fontFamily: HEAD }}>{d.headline}</p>
            {d.bio && <p className="mt-4 leading-8 text-slate-600">{d.bio}</p>}
            {d.interests.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{d.interests.map((i) => <span key={i} className="rounded-full bg-violet-50 px-3 py-1 text-[13px] font-medium text-violet-700">{i}</span>)}</div>}
          </PfReveal>

          {d.has.education && (
            <section id="gp-edu" className="scroll-mt-24">
              <H icon={<GraduationCap className="h-5 w-5" />}>Education</H>
              <div className="space-y-4">{d.education.map((e, i) => <PfReveal key={e.id} delay={i * 80} className={`${card} flex flex-col gap-1 p-6 sm:flex-row sm:items-start sm:justify-between`}><div><h3 className="text-lg font-bold" style={{ fontFamily: HEAD }}>{e.degree}</h3><p className="text-slate-600">{e.institution}</p>{e.honors && <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-[13px] font-semibold text-amber-700">{e.honors}</p>}</div><span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-[13px] font-semibold text-sky-700">{e.year}</span></PfReveal>)}</div>
            </section>
          )}

          {d.has.experience && (
            <section id="gp-exp" className="scroll-mt-24">
              <H icon={<Briefcase className="h-5 w-5" />}>Internships & experience</H>
              <div className="space-y-4">{d.experience.map((e, i) => <PfReveal key={e.id} delay={i * 80} className={`${card} p-6`}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-bold" style={{ fontFamily: HEAD }}>{e.role} <span className="font-medium text-slate-500">· {e.company}</span></h3><span className="text-[13px] font-semibold text-sky-700">{e.period}</span></div><p className="mt-2 leading-7 text-slate-600">{e.description}</p>{e.highlights.length > 0 && <ul className="mt-3 space-y-1.5">{e.highlights.map((h) => <li key={h} className="flex gap-2 text-[15px] text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />{h}</li>)}</ul>}{e.tech.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{e.tech.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-600">{t}</span>)}</div>}</PfReveal>)}</div>
            </section>
          )}

          {d.has.projects && (
            <section id="gp-proj" className="scroll-mt-24">
              <H icon={<Rocket className="h-5 w-5" />}>Projects</H>
              <div className="grid gap-5 sm:grid-cols-2">{d.projects.map((p, i) => <PfReveal key={p.id} delay={(i % 2) * 80}><article className={`${card} group h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl`}><div className="overflow-hidden"><SmartImg src={p.image} seed={p.title} alt={p.title} className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-center justify-between text-[12px] font-semibold text-sky-700"><span>{p.category}</span><span className="text-slate-400">{p.year}</span></div><h3 className="mt-1 text-lg font-bold" style={{ fontFamily: HEAD }}>{p.title}</h3><p className="mt-2 text-[15px] leading-7 text-slate-600">{p.summary}</p>{p.tech.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.tech.map((t) => <span key={t} className="rounded-md bg-sky-50 px-2 py-0.5 text-[12px] font-medium text-sky-700">{t}</span>)}</div>}{(p.sourceUrl || p.liveUrl) && <div className="mt-4 flex gap-4 text-sm font-semibold">{p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" />Live</a>}{p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" />Code</a>}</div>}</div></article></PfReveal>)}</div>
            </section>
          )}

          {certs.length > 0 && (
            <section id="gp-cert" className="scroll-mt-24">
              <H icon={<Award className="h-5 w-5" />}>Certifications & awards</H>
              <ul className="grid gap-4 sm:grid-cols-2">{certs.map((c, i) => <PfReveal as="li" key={c.id} delay={(i % 2) * 80} className={`${card} flex items-start gap-4 p-5`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Award className="h-5 w-5" /></span><div><div className="font-bold" style={{ fontFamily: HEAD }}>{c.title}</div><div className="text-[14px] text-slate-500">{[c.venue, c.year].filter(Boolean).join(' · ')}</div>{c.type && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{c.type}</span>}</div></PfReveal>)}</ul>
            </section>
          )}

          {d.has.skills && (
            <section id="gp-skills" className="scroll-mt-24">
              <H icon={<Sparkles className="h-5 w-5" />}>Skills</H>
              <div className="grid gap-5 sm:grid-cols-2">{d.skillGroups.map((g, i) => <PfReveal key={g.name} delay={i * 70} className={`${card} p-6`}><div className="mb-4 text-[13px] font-bold uppercase tracking-widest text-sky-600">{g.name}</div><ul className="space-y-3.5">{g.items.map((s) => <li key={s.id}><div className="flex justify-between text-sm font-medium"><span>{s.name}</span><span className="capitalize text-slate-400">{s.level}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sky-50"><div className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#6366F1]" style={{ width: `${Math.round(s.score * 100)}%` }} /></div></li>)}</ul></PfReveal>)}</div>
            </section>
          )}

          <section id="gp-contact" className="scroll-mt-24">
            <PfReveal className="rounded-3xl bg-gradient-to-br from-[#0EA5E9] via-[#6366F1] to-[#A855F7] p-8 text-center text-white sm:p-12"><h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: HEAD }}>Let’s connect</h2><p className="mx-auto mt-3 max-w-lg text-white/85">{d.available ? d.availabilityLabel + '. ' : ''}I’d love to hear about opportunities, internships and interesting problems.</p><a href={mailto(d.email, `Opportunity for ${d.name}`)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-sky-800 shadow-xl transition hover:-translate-y-0.5"><Mail className="h-4 w-4" />{d.cta}</a></PfReveal>
          </section>
        </main>
      </div>
      <footer className="border-t border-sky-100 px-5 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default GraduateProfile;
