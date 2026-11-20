import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Copy, ExternalLink, FileText, GitBranch, Mail, Quote } from 'lucide-react';
import type { PortfolioTemplateProps } from '../types';
import { normalizePortfolio } from '../kit/data';
import { BackgroundBlock, PfReveal, SmartImg, SocialRow, mailto, scrollToId, useActiveSection, useFonts } from '../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap';
const SANS = '"IBM Plex Sans", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SERIF = '"IBM Plex Serif", Georgia, serif';

/** Animated neural-network motif drawn as inline SVG (CSS-animated, no libraries). */
const NeuralNet: React.FC = () => {
  const layers = [3, 5, 5, 2];
  const W = 520, H = 360;
  const pos = layers.map((n, li) => Array.from({ length: n }, (_, i) => ({ x: 50 + li * ((W - 100) / (layers.length - 1)), y: H / 2 + (i - (n - 1) / 2) * 56 })));
  const lines: React.ReactNode[] = [];
  pos.forEach((layer, li) => {
    const next = pos[li + 1];
    if (!next) return;
    layer.forEach((a, ai) => next.forEach((b, bi) => lines.push(<line key={`${li}-${ai}-${bi}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2DD4BF" strokeOpacity={0.14 + ((ai + bi) % 3) * 0.08} strokeWidth="1" className="pf-flow" style={{ ['--pf-t' as string]: `${3 + ((ai * 3 + bi) % 4)}s` }} />)));
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Animated neural network diagram" className="h-auto w-full">
      {lines}
      {pos.flat().map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="15" fill="#0B1220" stroke="#2DD4BF" strokeOpacity=".5" /><circle cx={p.x} cy={p.y} r="5" fill={i % 3 === 0 ? '#38BDF8' : '#2DD4BF'} className="pf-blink" style={{ animationDelay: `${(i % 7) * 0.3}s`, animationDuration: `${2 + (i % 4) * 0.6}s` }} /></g>)}
    </svg>
  );
};

/**
 * Data & AI Research Lab — a research-group homepage: tabbed publications with abstracts and copyable
 * BibTeX, project "notebook" cards, an animated neural-network hero and scholarly metrics.
 */
export const DataAILab: React.FC<PortfolioTemplateProps> = (props) => {
  useFonts(FONTS);
  const d = useMemo(() => normalizePortfolio(props, { art: 'chart', palette: 'slate' }), [props]);
  const types = ['All', ...new Set(d.publications.map((p) => p.type).filter(Boolean) as string[])];
  const [type, setType] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const pubs = d.publications.filter((p) => type === 'All' || p.type === type);
  const links = [d.has.publications && ['Publications', 'ai-pubs'], d.has.projects && ['Projects', 'ai-proj'], d.has.skills && ['Methods', 'ai-skills'], (d.has.experience || d.has.education) && ['CV', 'ai-cv'], ['Contact', 'ai-contact']].filter(Boolean) as [string, string][];
  const active = useActiveSection(['ai-top', ...links.map(([, id]) => id)]);
  const panel = 'rounded-xl border border-[#1E2B45] bg-[#0E1729]';
  const copy = (id: string, text: string) => { try { void navigator.clipboard?.writeText(text); } catch { /* clipboard unavailable */ } setCopied(id); setTimeout(() => setCopied(null), 1600); };

  return (
    <div id="ai-top" className="min-h-screen bg-[#070D1A] text-[#CBD5E1]" style={{ fontFamily: SANS }}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_80%_0%,rgba(45,212,191,.12),transparent_70%)]" />
      {/* Top tab bar */}
      <header className="pf-noprint sticky top-0 z-30 border-b border-[#1E2B45] bg-[#070D1A]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('ai-top')} className="flex items-center gap-2.5 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2DD4BF] text-[#042F2A]" style={{ fontFamily: MONO }}>{d.initials}</span><span className="text-sm font-semibold">{d.name}</span></button>
          <nav aria-label="Sections" className="pf-no-scrollbar flex gap-1 overflow-x-auto text-[13px]">{links.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className={`shrink-0 rounded-md px-3 py-1.5 transition ${active === id ? 'bg-[#13223D] text-[#2DD4BF]' : 'text-slate-400 hover:text-white'}`}>{l}</button>)}</nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20">
        <div>
          <PfReveal><p className="text-[12px] text-[#2DD4BF]" style={{ fontFamily: MONO }}>{d.company || 'Research'} · {d.location}</p></PfReveal>
          <PfReveal delay={80}><h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">{d.name}</h1></PfReveal>
          <PfReveal delay={140}><p className="mt-3 text-xl text-[#38BDF8]">{d.title}</p></PfReveal>
          <PfReveal delay={200}><p className="mt-5 max-w-xl text-[17px] leading-8 text-slate-300">{d.headline}</p></PfReveal>
          <PfReveal delay={260} className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => scrollToId(d.has.publications ? 'ai-pubs' : 'ai-contact')} className="inline-flex items-center gap-2 rounded-md bg-[#2DD4BF] px-5 py-3 text-sm font-semibold text-[#042F2A] transition hover:bg-[#5EEAD4]"><BookOpen className="h-4 w-4" />{d.has.publications ? 'Read publications' : d.cta}</button><button type="button" onClick={() => scrollToId('ai-contact')} className="rounded-md border border-[#2A3B5E] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#2DD4BF]">{d.cta}</button></PfReveal>
          {d.stats.length > 0 && <PfReveal delay={320} className="mt-10 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#1E2B45] bg-[#1E2B45]">{d.stats.slice(0, 3).map((m) => <div key={m.label} className="bg-[#0B1322] px-4 py-3"><div className="text-2xl font-semibold text-white" style={{ fontFamily: MONO }}>{m.value}</div><div className="text-[11px] uppercase tracking-widest text-slate-500">{m.label}</div></div>)}</PfReveal>}
        </div>
        <PfReveal from="scale" delay={150}><div className={`${panel} p-4`}><NeuralNet /><div className="mt-2 flex flex-wrap gap-2 px-1 pb-1">{d.interests.map((i) => <span key={i} className="rounded border border-[#1E2B45] px-2 py-1 text-[11px] text-[#2DD4BF]" style={{ fontFamily: MONO }}>{i}</span>)}</div></div></PfReveal>
      </section>

      {/* Bio strip */}
      {d.bio && <section className="mx-auto max-w-6xl px-5 pb-16"><PfReveal className={`${panel} grid gap-6 p-6 sm:grid-cols-[120px_1fr] sm:p-8`}><SmartImg src={d.avatar} seed={d.name} alt={`Portrait of ${d.name}`} className="h-28 w-28 rounded-lg object-cover" /><p className="text-[17px] leading-8 text-slate-300" style={{ fontFamily: SERIF }}>{d.bio}</p></PfReveal></section>}

      {/* Publications */}
      {d.has.publications && (
        <section id="ai-pubs" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-14">
          <PfReveal className="flex flex-wrap items-end justify-between gap-4"><h2 className="text-3xl font-semibold text-white">Publications</h2><div role="tablist" aria-label="Filter publications" className="flex gap-1 rounded-lg border border-[#1E2B45] p-1 text-[12px]">{types.map((t) => <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setType(t)} className={`rounded-md px-3 py-1.5 transition ${type === t ? 'bg-[#13223D] text-[#2DD4BF]' : 'text-slate-400 hover:text-white'}`} style={{ fontFamily: MONO }}>{t}</button>)}</div></PfReveal>
          <ol className="mt-8 space-y-4">
            {pubs.map((p, i) => (
              <PfReveal as="li" key={p.id} delay={i * 60} className={`${panel} p-5 transition hover:border-[#2DD4BF]/50`}>
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[11px] text-[#2DD4BF]" style={{ fontFamily: MONO }}><FileText className="h-3.5 w-3.5" />{p.type} · {p.venue} · {p.year}</div><h3 className="mt-2 text-lg font-medium leading-snug text-white">{p.title}</h3>{p.authors.length > 0 && <p className="mt-1 text-sm text-slate-400">{p.authors.join(', ')}</p>}</div>{p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title}`} className="rounded-md border border-[#2A3B5E] p-2 text-slate-300 hover:border-[#2DD4BF] hover:text-[#2DD4BF]"><ExternalLink className="h-4 w-4" /></a>}</div>
                {(p.abstract || p.bibtex) && <div className="mt-4 flex gap-2 text-[12px]" style={{ fontFamily: MONO }}>{p.abstract && <button type="button" aria-expanded={open === `a-${p.id}`} onClick={() => setOpen(open === `a-${p.id}` ? null : `a-${p.id}`)} className="rounded border border-[#2A3B5E] px-2.5 py-1 hover:border-[#2DD4BF] hover:text-[#2DD4BF]">abstract</button>}{p.bibtex && <button type="button" aria-expanded={open === `b-${p.id}`} onClick={() => setOpen(open === `b-${p.id}` ? null : `b-${p.id}`)} className="rounded border border-[#2A3B5E] px-2.5 py-1 hover:border-[#2DD4BF] hover:text-[#2DD4BF]">bibtex</button>}</div>}
                {open === `a-${p.id}` && <p className="pf-fade mt-3 border-l-2 border-[#2DD4BF] pl-4 text-[15px] leading-7 text-slate-300" style={{ fontFamily: SERIF }}>{p.abstract}</p>}
                {open === `b-${p.id}` && p.bibtex && <div className="pf-fade relative mt-3"><pre className="overflow-x-auto rounded-lg bg-[#050A14] p-4 text-[12px] leading-6 text-slate-300" style={{ fontFamily: MONO }}>{p.bibtex}</pre><button type="button" onClick={() => copy(p.id, p.bibtex!)} aria-label="Copy BibTeX" className="absolute right-2 top-2 flex items-center gap-1 rounded bg-[#13223D] px-2 py-1 text-[11px] text-[#2DD4BF]">{copied === p.id ? <><Check className="h-3 w-3" />copied</> : <><Copy className="h-3 w-3" />copy</>}</button></div>}
              </PfReveal>
            ))}
          </ol>
        </section>
      )}

      {/* Projects as notebooks */}
      {d.has.projects && (
        <section id="ai-proj" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-14">
          <PfReveal><h2 className="text-3xl font-semibold text-white">Projects & open source</h2></PfReveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">{d.projects.map((p, i) => <PfReveal key={p.id} delay={i * 90}><article className={`${panel} group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[#2DD4BF]/50`}><div className="relative overflow-hidden"><SmartImg src={p.image} seed={p.title} alt={p.title} className="aspect-[16/10] w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded bg-[#070D1A]/85 px-2 py-1 text-[10px] text-[#2DD4BF]" style={{ fontFamily: MONO }}>{p.category}</span></div><div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-medium text-white">{p.title}</h3><p className="mt-2 flex-1 text-[14.5px] leading-7 text-slate-400">{p.summary}</p>{p.tech.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.tech.map((t) => <span key={t} className="rounded border border-[#1E2B45] px-2 py-0.5 text-[11px] text-slate-300" style={{ fontFamily: MONO }}>{t}</span>)}</div>}<div className="mt-4 flex items-center gap-4 text-sm">{p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-200 hover:text-[#2DD4BF]"><GitBranch className="h-4 w-4" />code</a>}{p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-200 hover:text-[#2DD4BF]"><ExternalLink className="h-4 w-4" />demo</a>}{p.metrics[0] && <span className="ml-auto text-[#38BDF8]" style={{ fontFamily: MONO }}>★ {p.metrics[0].value}</span>}</div></div></article></PfReveal>)}</div>
        </section>
      )}

      {/* Methods */}
      {d.has.skills && (
        <section id="ai-skills" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-14">
          <PfReveal><h2 className="text-3xl font-semibold text-white">Methods & tools</h2></PfReveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2">{d.skillGroups.map((g, gi) => <PfReveal key={g.name} delay={gi * 80} className={`${panel} p-6`}><div className="mb-4 text-[12px] uppercase tracking-widest text-[#2DD4BF]" style={{ fontFamily: MONO }}>{g.name}</div><ul className="space-y-3">{g.items.map((s) => <li key={s.id} className="grid grid-cols-[1fr_120px] items-center gap-4 text-sm"><span className="text-slate-200">{s.name}{s.years ? <span className="text-slate-500"> · {s.years}y</span> : null}</span><span className="flex gap-1" aria-label={`${s.level}`}>{Array.from({ length: 5 }).map((_, k) => <span key={k} className={`h-2 flex-1 rounded-sm ${k < Math.round(s.score * 5) ? 'bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8]' : 'bg-[#1E2B45]'}`} />)}</span></li>)}</ul></PfReveal>)}</div>
        </section>
      )}

      {/* CV */}
      {(d.has.experience || d.has.education) && (
        <section id="ai-cv" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-14">
          <PfReveal><h2 className="text-3xl font-semibold text-white">Curriculum vitae</h2></PfReveal>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">{d.experience.map((e) => <PfReveal key={e.id} className={`${panel} p-5`}><div className="text-[11px] text-[#2DD4BF]" style={{ fontFamily: MONO }}>{e.period}</div><div className="mt-1 font-medium text-white">{e.role}</div><div className="text-sm text-slate-400">{e.company}</div><p className="mt-2 text-[14px] leading-6 text-slate-400">{e.description}</p>{e.highlights.map((h) => <p key={h} className="mt-1 flex gap-2 text-[14px] text-slate-300"><span className="text-[#2DD4BF]">›</span>{h}</p>)}</PfReveal>)}</div>
            <div className="space-y-4">{d.education.map((e) => <PfReveal key={e.id} className={`${panel} p-5`}><div className="text-[11px] text-[#38BDF8]" style={{ fontFamily: MONO }}>{e.year}</div><div className="mt-1 font-medium text-white">{e.degree}</div><div className="text-sm text-slate-400">{e.institution}</div></PfReveal>)}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      <BackgroundBlock d={d} id="ai-background" theme={{ text: '#FFFFFF', muted: '#64748B', border: '#1E2B45', accent: '#2DD4BF' }} show={{ education: false }} />

      <section id="ai-contact" className="scroll-mt-16 mx-auto max-w-6xl px-5 pb-20 pt-10">
        <PfReveal className={`${panel} relative overflow-hidden p-8 text-center sm:p-12`}><Quote aria-hidden className="absolute -right-4 -top-4 h-32 w-32 text-[#2DD4BF]/5" /><h2 className="text-3xl font-semibold text-white sm:text-4xl">Interested in collaborating?</h2><p className="mx-auto mt-3 max-w-xl text-slate-400">{d.available ? d.availabilityLabel + '. ' : ''}I’m always glad to discuss research collaborations, applied projects and open datasets.</p><a href={mailto(d.email, `Collaboration with ${d.name}`)} className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#2DD4BF] px-6 py-3 text-sm font-semibold text-[#042F2A] transition hover:bg-[#5EEAD4]"><Mail className="h-4 w-4" />{d.email || d.cta}</a><SocialRow socials={d.socials} className="mt-6 justify-center" showLabel itemClass="flex items-center gap-2 rounded-md border border-[#2A3B5E] px-3.5 py-2 text-[13px] text-slate-300 transition hover:border-[#2DD4BF] hover:text-[#2DD4BF]" /></PfReveal>
      </section>
      <footer className="border-t border-[#1E2B45] px-5 py-6 text-center text-[12px] text-slate-500" style={{ fontFamily: MONO }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};

export default DataAILab;
