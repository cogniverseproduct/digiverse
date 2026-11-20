import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Download, ExternalLink, GitBranch, Mail, MapPin, Send, Terminal } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialRow, scrollToId, useActiveSection, useFonts, useMailtoForm } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const HEAD = '"Space Grotesk", Inter, system-ui, sans-serif';

/**
 * Systems Engineer Blueprint — dark engineering canvas with a fixed side rail, a typed terminal intro,
 * a skills matrix, repository-style project cards and a commit-style career timeline.
 */
export const EngineerBlueprint: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'ui', palette: 'ocean', portraitPalette: 'slate' }), [props]);
  const [open, setOpen] = useState<string | null>(null);
  const { sent, submit } = useMailtoForm(d.email, `Portfolio enquiry for ${d.name}`);

  const sections = [
    { id: 'eb-top', label: 'intro', show: true },
    { id: 'eb-about', label: 'about', show: !!d.bio },
    { id: 'eb-stack', label: 'stack', show: d.has.skills },
    { id: 'eb-projects', label: 'projects', show: d.has.projects },
    { id: 'eb-experience', label: 'experience', show: d.has.experience },
    { id: 'eb-credentials', label: 'credentials', show: d.has.education || d.has.publications },
    { id: 'eb-contact', label: 'contact', show: true }
  ].filter((s) => s.show);
  const active = useActiveSection(sections.map((s) => s.id));

  const stats = [
    d.years ? { k: 'years', v: `${d.years}+` } : null,
    d.has.projects ? { k: 'projects', v: String(d.projects.length) } : null,
    d.has.skills ? { k: 'technologies', v: String(d.skills.length) } : null
  ].filter(Boolean) as { k: string; v: string }[];

  const panel = 'rounded-xl border border-[#1B2744] bg-[#0D1426]/80';

  return (
    <div id="eb-top" className="relative min-h-screen bg-[#070B16] text-[#D6E2FF]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(91,140,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(91,140,255,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_10%,black,transparent_70%)]" />

      {/* Side rail (desktop) */}
      <aside className="pf-noprint fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col justify-between border-r border-[#1B2744] bg-[#080D1B]/95 p-6 backdrop-blur lg:flex">
        <div>
          <button type="button" onClick={() => scrollToId('eb-top')} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A3A66] bg-[#0F1A33] text-[#3DD6A5]"><Terminal className="h-5 w-5" /></span>
            <span><span className="block text-sm font-semibold text-white" style={{ fontFamily: HEAD }}>{d.name}</span><span className="block text-[11px] text-[#7F90B8]" style={{ fontFamily: MONO }}>~/portfolio</span></span>
          </button>
          <nav aria-label="Sections" className="mt-10 space-y-1">
            {sections.map((s, i) => (
              <button key={s.id} type="button" onClick={() => scrollToId(s.id)} className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition ${active === s.id ? 'bg-[#13203F] text-[#3DD6A5]' : 'text-[#7F90B8] hover:bg-[#101A33] hover:text-white'}`} style={{ fontFamily: MONO }}>
                <span className="tabular-nums opacity-60">{String(i).padStart(2, '0')}</span>{s.label}
                {active === s.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#3DD6A5]" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-4">
          {d.available && <div className="flex items-center gap-2 text-[12px] text-[#3DD6A5]" style={{ fontFamily: MONO }}><span className="relative flex h-2 w-2"><span className="pf-ring absolute inline-flex h-full w-full rounded-full bg-[#3DD6A5]" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#3DD6A5]" /></span>{d.availabilityLabel}</div>}
          <SocialRow socials={d.socials} itemClass="flex h-9 w-9 items-center justify-center rounded-md border border-[#1B2744] text-[#7F90B8] transition hover:border-[#3DD6A5] hover:text-[#3DD6A5]" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="pf-noprint sticky top-0 z-30 border-b border-[#1B2744] bg-[#080D1B]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3"><span className="text-sm font-semibold text-white" style={{ fontFamily: HEAD }}>{d.name}</span><button type="button" onClick={() => scrollToId('eb-contact')} className="rounded-md bg-[#3DD6A5] px-3 py-1.5 text-xs font-semibold text-[#06231A]">{d.cta}</button></div>
        <nav aria-label="Sections" className="pf-no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {sections.map((s) => <button key={s.id} type="button" onClick={() => scrollToId(s.id)} className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${active === s.id ? 'bg-[#13203F] text-[#3DD6A5]' : 'text-[#7F90B8]'}`} style={{ fontFamily: MONO }}>{s.label}</button>)}
        </nav>
      </header>

      <main className="relative lg:pl-[248px]">
        <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
          {/* Hero */}
          <section className="grid gap-10 pb-16 pt-14 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
            <div>
              <PfReveal>
                <div className={`${panel} overflow-hidden`}>
                  <div className="flex items-center gap-1.5 border-b border-[#1B2744] bg-[#0A1122] px-4 py-2.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FFD43B]" /><span className="h-2.5 w-2.5 rounded-full bg-[#3DD6A5]" /><span className="ml-3 text-[11px] text-[#7F90B8]" style={{ fontFamily: MONO }}>bash — intro</span></div>
                  <div className="space-y-1.5 p-5 text-[13px] leading-6" style={{ fontFamily: MONO }}>
                    <div><span className="text-[#3DD6A5]">$</span> whoami</div>
                    <div className="text-white"><span className="pf-type" style={{ ['--pf-chars' as string]: `${d.name.length}ch`, ['--pf-steps' as string]: d.name.length }}>{d.name}</span><span className="pf-blink ml-0.5 text-[#3DD6A5]">▍</span></div>
                    {d.title && <div><span className="text-[#7F90B8]">role:</span> {d.title}</div>}
                    {d.location && <div><span className="text-[#7F90B8]">location:</span> {d.location}</div>}
                    {d.company && <div><span className="text-[#7F90B8]">at:</span> {d.company}</div>}
                    <div><span className="text-[#7F90B8]">status:</span> <span className={d.available ? 'text-[#3DD6A5]' : 'text-[#FFD43B]'}>● {d.availabilityLabel.toLowerCase()}</span></div>
                  </div>
                </div>
              </PfReveal>
              <PfReveal delay={120}><h1 className="mt-8 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl" style={{ fontFamily: HEAD }}>{d.title || d.name}</h1></PfReveal>
              {d.headline && <PfReveal delay={200}><p className="mt-5 max-w-xl text-[16px] leading-7 text-[#9FB0D6]">{d.headline}</p></PfReveal>}
              <PfReveal delay={280} className="mt-8 flex flex-wrap gap-3">
                {d.has.projects && <button type="button" onClick={() => scrollToId('eb-projects')} className="inline-flex items-center gap-2 rounded-md bg-[#3DD6A5] px-5 py-3 text-sm font-semibold text-[#06231A] transition hover:-translate-y-0.5 hover:bg-[#5BE3B8]" style={{ fontFamily: MONO }}>view_projects <ArrowUpRight className="h-4 w-4" /></button>}
                <button type="button" onClick={() => scrollToId('eb-contact')} className="inline-flex items-center gap-2 rounded-md border border-[#2A3A66] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#3DD6A5] hover:text-[#3DD6A5]" style={{ fontFamily: MONO }}>{d.cta.toLowerCase().replace(/\s+/g, '_')}</button>
              </PfReveal>
            </div>
            <PfReveal from="right" delay={150} className="relative">
              <div className={`${panel} relative aspect-[4/3] overflow-hidden`}>
                <SmartImg src={d.cover} seed={`${d.name}-cover`} alt="" className="h-full w-full object-cover opacity-90" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070B16] via-transparent to-transparent" />
                <div aria-hidden className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(0,0,0,0.5)_4px)]" />
                <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-px border-t border-[#1B2744] bg-[#1B2744]/60">
                  {stats.map((s) => <div key={s.k} className="bg-[#080D1B]/90 px-4 py-3"><div className="text-xl font-bold text-white" style={{ fontFamily: HEAD }}>{s.v}</div><div className="text-[10px] uppercase tracking-widest text-[#7F90B8]" style={{ fontFamily: MONO }}>{s.k}</div></div>)}
                </div>
              </div>
            </PfReveal>
          </section>

          {/* About */}
          {d.bio && (
            <section id="eb-about" className="scroll-mt-24 border-t border-[#1B2744] py-16">
              <SectionHead n="01" title="About" />
              <div className="mt-8 grid gap-10 md:grid-cols-[1.4fr_1fr]">
                <PfReveal><p className="text-[16px] leading-8 text-[#B5C3E4]">{d.bio}</p>{d.story && <p className="mt-4 text-[15px] leading-7 text-[#8DA0CC]">{d.story}</p>}</PfReveal>
                <PfReveal delay={100} from="right"><dl className={`${panel} divide-y divide-[#1B2744] text-[13px]`} style={{ fontFamily: MONO }}>
                  {[['name', d.name], ['role', d.role || d.title], ['company', d.company], ['location', d.location], ['email', d.email]].filter(([, v]) => v).map(([k, v]) => <div key={k as string} className="flex justify-between gap-4 px-4 py-3"><dt className="text-[#7F90B8]">{k}</dt><dd className="truncate text-right text-white">{v}</dd></div>)}
                </dl>
                  {d.interests.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{d.interests.map((t) => <span key={t} className="rounded border border-[#1B2744] px-2.5 py-1 text-[11px] text-[#9FB0D6]" style={{ fontFamily: MONO }}>#{t}</span>)}</div>}
                </PfReveal>
              </div>
            </section>
          )}

          {/* Stack */}
          {d.has.skills && (
            <section id="eb-stack" className="scroll-mt-24 border-t border-[#1B2744] py-16">
              <SectionHead n="02" title="Stack matrix" />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {d.skillGroups.map((g, gi) => (
                  <PfReveal key={g.name} delay={gi * 70} className={`${panel} p-5`}>
                    <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-widest text-[#3DD6A5]" style={{ fontFamily: MONO }}><span>{g.name}</span><span className="text-[#7F90B8]">{g.items.length}</span></div>
                    <ul className="space-y-3.5">
                      {g.items.map((s) => (
                        <li key={s.id}>
                          <div className="flex items-baseline justify-between text-[13px]"><span className="text-white">{s.name}</span><span className="text-[11px] text-[#7F90B8]" style={{ fontFamily: MONO }}>{s.level}{s.years ? ` · ${s.years}y` : ''}</span></div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#14203D]"><div className="h-full rounded-full bg-gradient-to-r from-[#3DD6A5] to-[#5B8CFF] transition-[width] duration-1000" style={{ width: `${Math.round(s.score * 100)}%` }} /></div>
                        </li>
                      ))}
                    </ul>
                  </PfReveal>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {d.has.projects && (
            <section id="eb-projects" className="scroll-mt-24 border-t border-[#1B2744] py-16">
              <SectionHead n="03" title="Projects" />
              <div className="mt-8 space-y-5">
                {d.projects.map((p, i) => (
                  <PfReveal key={p.id} delay={60}>
                    <article className={`${panel} group overflow-hidden transition duration-300 hover:border-[#3DD6A5]/60 hover:shadow-[0_0_0_1px_rgba(61,214,165,0.25),0_30px_60px_-30px_rgba(61,214,165,0.25)]`}>
                      <div className="grid md:grid-cols-[320px_1fr]">
                        <div className="relative aspect-[16/10] overflow-hidden bg-[#0A1122] md:aspect-auto"><SmartImg src={p.image} seed={p.title} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded bg-[#070B16]/80 px-2 py-1 text-[10px] text-[#3DD6A5]" style={{ fontFamily: MONO }}>#{String(i + 1).padStart(2, '0')}</span></div>
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold text-white" style={{ fontFamily: HEAD }}>{p.title}</h3>{p.year && <span className="shrink-0 text-xs text-[#7F90B8]" style={{ fontFamily: MONO }}>{p.year}</span>}</div>
                          {p.role && <div className="mt-1 text-[12px] text-[#3DD6A5]" style={{ fontFamily: MONO }}>{p.role}</div>}
                          <p className="mt-3 text-[14px] leading-6 text-[#9FB0D6]">{p.summary}</p>
                          {p.metrics.length > 0 && <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">{p.metrics.map((m) => <div key={m.label}><div className="text-base font-semibold text-white" style={{ fontFamily: HEAD }}>{m.value}</div><div className="text-[10px] uppercase tracking-widest text-[#7F90B8]" style={{ fontFamily: MONO }}>{m.label}</div></div>)}</div>}
                          {p.tech.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{p.tech.map((t) => <span key={t} className="rounded border border-[#1B2744] bg-[#0A1122] px-2 py-0.5 text-[11px] text-[#9FB0D6]" style={{ fontFamily: MONO }}>{t}</span>)}</div>}
                          <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px]">
                            {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-2 text-white hover:text-[#3DD6A5]"><ExternalLink className="h-3.5 w-3.5" />live</a>}
                            {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-2 text-white hover:text-[#3DD6A5]"><GitBranch className="h-3.5 w-3.5" />source</a>}
                            {p.description && p.description !== p.summary && <button type="button" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)} className="ml-auto py-2 text-[#7F90B8] hover:text-white" style={{ fontFamily: MONO }}>{open === p.id ? '− hide notes' : '+ architecture notes'}</button>}
                          </div>
                          {open === p.id && <p className="pf-fade mt-4 border-l-2 border-[#3DD6A5] pl-4 text-[14px] leading-7 text-[#B5C3E4]">{p.description}</p>}
                        </div>
                      </div>
                    </article>
                  </PfReveal>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {d.has.experience && (
            <section id="eb-experience" className="scroll-mt-24 border-t border-[#1B2744] py-16">
              <SectionHead n="04" title="Experience" />
              <ol className="relative mt-10 space-y-8 border-l border-[#1B2744] pl-8">
                {d.experience.map((e) => (
                  <PfReveal as="li" key={e.id} className="relative">
                    <span className={`absolute -left-[41px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#070B16] ${e.current ? 'bg-[#3DD6A5]' : 'bg-[#2A3A66]'}`} />
                    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-semibold text-white" style={{ fontFamily: HEAD }}>{e.role} <span className="text-[#7F90B8]">@ {e.company}</span></h3><span className="text-xs text-[#7F90B8]" style={{ fontFamily: MONO }}>{e.period}</span></div>
                    {e.description && <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9FB0D6]">{e.description}</p>}
                    {e.highlights.length > 0 && <ul className="mt-3 space-y-1.5 text-[13.5px] text-[#B5C3E4]">{e.highlights.map((h) => <li key={h} className="flex gap-2"><span className="text-[#3DD6A5]" style={{ fontFamily: MONO }}>+</span>{h}</li>)}</ul>}
                    {e.tech.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{e.tech.map((t) => <span key={t} className="rounded border border-[#1B2744] px-2 py-0.5 text-[11px] text-[#7F90B8]" style={{ fontFamily: MONO }}>{t}</span>)}</div>}
                  </PfReveal>
                ))}
              </ol>
            </section>
          )}

          {/* Credentials + résumé */}
          {(d.has.education || d.has.publications) && (
            <section id="eb-credentials" className="scroll-mt-24 border-t border-[#1B2744] py-16">
              <SectionHead n="05" title="Credentials" />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {d.education.map((e) => <PfReveal key={e.id} className={`${panel} p-5`}><div className="text-[11px] uppercase tracking-widest text-[#3DD6A5]" style={{ fontFamily: MONO }}>{e.year || 'education'}</div><div className="mt-1 font-semibold text-white">{e.degree}</div><div className="text-[13px] text-[#9FB0D6]">{e.institution}{e.honors ? ` · ${e.honors}` : ''}</div></PfReveal>)}
                {d.publications.map((p) => <PfReveal key={p.id} className={`${panel} p-5`}><div className="text-[11px] uppercase tracking-widest text-[#5B8CFF]" style={{ fontFamily: MONO }}>{p.type || 'publication'} · {p.year}</div><div className="mt-1 font-semibold text-white">{p.title}</div><div className="text-[13px] text-[#9FB0D6]">{p.venue}</div></PfReveal>)}
              </div>
              <button type="button" onClick={() => typeof window !== 'undefined' && window.print()} className="pf-noprint mt-8 inline-flex items-center gap-2 rounded-md border border-[#2A3A66] px-4 py-2.5 text-sm text-white transition hover:border-[#3DD6A5] hover:text-[#3DD6A5]" style={{ fontFamily: MONO }}><Download className="h-4 w-4" />save_resume.pdf</button>
            </section>
          )}

          {/* Contact */}
          <BackgroundBlock d={d} id="eb-background" theme={{ text: '#FFFFFF', muted: '#7F90B8', border: '#1B2744', accent: '#3DD6A5', font: HEAD }} show={{ education: false }} className="!px-0" />

          <section id="eb-contact" className="scroll-mt-24 border-t border-[#1B2744] py-16">
            <SectionHead n={String(sections.length - 1).padStart(2, '0')} title="Contact" />
            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
              <PfReveal>
                <p className="text-[16px] leading-8 text-[#B5C3E4]">{d.available ? 'Open to new projects and conversations. Send a message and it opens in your mail app.' : 'Send a message and it opens in your mail app.'}</p>
                <ul className="mt-6 space-y-3 text-[14px]">
                  {d.email && <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#3DD6A5]" /><a className="inline-block py-1 text-white hover:text-[#3DD6A5]" href={`mailto:${d.email}`}>{d.email}</a></li>}
                  {d.location && <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#3DD6A5]" />{d.location}</li>}
                </ul>
              </PfReveal>
              <PfReveal delay={100} from="right">
                <form onSubmit={submit} className={`${panel} space-y-4 p-6`} style={{ fontFamily: MONO }}>
                  {['name', 'email'].map((f) => <label key={f} className="block text-[11px] uppercase tracking-widest text-[#7F90B8]">{f}<input required type={f === 'email' ? 'email' : 'text'} name={f} className="mt-1.5 w-full rounded-md border border-[#1B2744] bg-[#080D1B] px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none transition focus:border-[#3DD6A5]" /></label>)}
                  <label className="block text-[11px] uppercase tracking-widest text-[#7F90B8]">message<textarea required name="message" rows={4} className="mt-1.5 w-full rounded-md border border-[#1B2744] bg-[#080D1B] px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none transition focus:border-[#3DD6A5]" /></label>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-[#3DD6A5] px-5 py-2.5 text-sm font-semibold text-[#06231A] transition hover:bg-[#5BE3B8]"><Send className="h-4 w-4" />send_message</button>
                  {sent && <p role="status" className="text-[12px] text-[#3DD6A5]">✓ Your mail app should open with the message ready to send.</p>}
                </form>
              </PfReveal>
            </div>
          </section>

          <footer className="border-t border-[#1B2744] pt-8 text-[12px] text-[#7F90B8]" style={{ fontFamily: MONO }}>© {new Date().getFullYear()} {d.name} · built with DigiVerse</footer>
        </div>
      </main>
    </div>
  );
};

const SectionHead: React.FC<{ n: string; title: string }> = ({ n, title }) => (
  <PfReveal className="flex items-baseline gap-4">
    <span className="text-sm text-[#3DD6A5]" style={{ fontFamily: MONO }}>{n}</span>
    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl" style={{ fontFamily: HEAD }}>{title}</h2>
    <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[#1B2744] to-transparent" />
  </PfReveal>
);

export default EngineerBlueprint;
