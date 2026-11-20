import React, { useMemo, useState } from 'react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap';
const HEAD = 'Outfit, system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';
const TINTS = ['#2563EB', '#E11D48', '#059669', '#D97706', '#7C3AED', '#0891B2'];

/** Multi-Sport Union: one club, several sports. A section per sport with its own colour, filterable fixtures and results. */
export const MultiSportUnion: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'royal', coverKind: 'action' }), [props]);
  const [lb, setLb] = useState<number | null>(null);
  const sports = useMemo(() => Array.from(new Set(d.teams.map((t) => t.sport).filter(Boolean) as string[])), [d.teams]);
  const [sel, setSel] = useState('All');
  const tint = (s: string) => TINTS[Math.max(0, sports.indexOf(s)) % TINTS.length];
  const sportOf = (teamId?: string) => d.teams.find((t) => t.id === teamId)?.sport || '';
  const inSel = (teamId?: string) => sel === 'All' || sportOf(teamId) === sel;
  const fx = d.fixtures.filter((f) => inSel(f.teamId));
  const rs = d.results.filter((f) => inSel(f.teamId));
  const nav = ([sports.length > 0 && ['Sports', 'ms-sports'], (d.has.fixtures || d.has.results) && ['Fixtures', 'ms-matches'], d.has.standings && ['Table', 'ms-table'], d.has.news && ['News', 'ms-news'], d.has.gallery && ['Gallery', 'ms-gallery'], ['Contact', 'ms-contact']].filter(Boolean) as [string, string][]);
  const base = d.brand.primary || '#1E2A5E';

  return (
    <div id="ms-top" className="sp-root min-h-screen bg-[#F4F6FB] text-[#12183A]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 text-white" style={{ background: base }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('ms-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="text-xl font-bold" style={{ fontFamily: HEAD }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-medium text-white/80 hover:text-white">{l}</button>)}</nav>
        </div>
        {sports.length > 0 && <div className="flex h-1.5">{sports.map((s) => <span key={s} className="flex-1" style={{ background: tint(s) }} />)}</div>}
      </header>

      <section className="relative isolate overflow-hidden text-white" style={{ background: base }}>
        <SmartImg src={d.cover} seed={d.name} kind="action" palette="royal" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <SpReveal><p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">{[d.location, d.founded ? `Since ${d.founded}` : ''].filter(Boolean).join(' · ')}</p><h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-[1.02] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>{d.description && <p className="mt-5 max-w-2xl text-lg text-white/80">{d.description}</p>}</SpReveal>
          {sports.length > 0 && <SpReveal delay={120} className="mt-8 flex flex-wrap gap-2">{sports.map((s) => <button key={s} type="button" onClick={() => { setSel(s); scrollToId('ms-matches'); }} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: tint(s) }}>{s}</button>)}</SpReveal>}
        </div>
      </section>

      {sports.length > 0 && (
        <section id="ms-sports" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20">
          <h2 className="mb-8 text-4xl font-extrabold" style={{ fontFamily: HEAD }}>Our sports</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{sports.map((s, i) => { const ts = d.teams.filter((t) => t.sport === s); const ps = d.players.filter((p) => sportOf(p.teamId) === s); return <SpReveal key={s} delay={i * 70} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"><div className="h-2" style={{ background: tint(s) }} /><div className="p-6"><h3 className="text-2xl font-bold" style={{ fontFamily: HEAD, color: tint(s) }}>{s}</h3><p className="mt-1 text-sm text-[#4B5278]">{ts.length} team{ts.length === 1 ? '' : 's'}{ps.length ? ` · ${ps.length} player${ps.length === 1 ? '' : 's'}` : ''}</p><ul className="mt-4 space-y-1.5 text-sm">{ts.map((t) => <li key={t.id} className="flex justify-between gap-3 border-b border-black/5 pb-1.5"><span className="font-medium">{t.name}</span><span className="text-[#4B5278]">{[t.ageGroup, t.gender].filter(Boolean).join(' · ')}</span></li>)}</ul></div></SpReveal>; })}</div>
        </section>
      )}

      {(d.has.fixtures || d.has.results) && (
        <section id="ms-matches" className="scroll-mt-16 bg-white py-20"><div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className="text-4xl font-extrabold" style={{ fontFamily: HEAD }}>Fixtures & results</h2>
            {sports.length > 1 && <div role="group" aria-label="Filter by sport" className="flex flex-wrap gap-2">{['All', ...sports].map((s) => <button key={s} type="button" aria-pressed={sel === s} onClick={() => setSel(s)} className="rounded-full border px-4 py-1.5 text-sm font-semibold" style={sel === s ? { background: s === 'All' ? base : tint(s), color: '#fff', borderColor: 'transparent' } : { borderColor: '#12183A22' }}>{s}</button>)}</div>}</div>
          <div className="grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4B5278]">Upcoming</h3><ul className="space-y-3">{fx.slice(0, 5).map((f) => <li key={f.id} className="flex items-center gap-4 rounded-xl border-l-4 bg-[#F4F6FB] p-4" style={{ borderColor: tint(sportOf(f.teamId)) }}><div className="w-16 shrink-0 text-center"><div className="text-2xl font-bold leading-none" style={{ fontFamily: HEAD }}>{f.date?.getDate()}</div><div className="text-[11px] uppercase text-[#4B5278]">{fmtDate(f.date, { month: 'short' })}</div></div><div className="min-w-0"><div className="font-semibold">{f.homeName} v {f.awayName}</div><div className="text-xs text-[#4B5278]">{[sportOf(f.teamId), fmtDay(f.date) + ' ' + fmtTime(f.date), f.venue].filter(Boolean).join(' · ')}</div></div></li>)}{!fx.length && <li className="text-sm text-[#4B5278]">No fixtures for this sport yet.</li>}</ul></div>
            <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4B5278]">Results</h3><ul className="space-y-3">{rs.slice(0, 5).map((f) => <li key={f.id} className="flex items-center justify-between gap-4 rounded-xl border-l-4 bg-[#F4F6FB] p-4" style={{ borderColor: tint(sportOf(f.teamId)) }}><div className="min-w-0"><div className="truncate font-semibold">{f.homeName} v {f.awayName}</div><div className="text-xs text-[#4B5278]">{[sportOf(f.teamId), fmtDate(f.date)].filter(Boolean).join(' · ')}</div></div><div className="text-2xl font-bold tabular-nums" style={{ fontFamily: HEAD }}>{scoreText(f)}</div></li>)}{!rs.length && <li className="text-sm text-[#4B5278]">No results for this sport yet.</li>}</ul></div>
          </div>
        </div></section>
      )}

      {d.has.standings && <section id="ms-table" className="scroll-mt-16 mx-auto max-w-5xl px-5 py-20"><h2 className="mb-6 text-4xl font-extrabold" style={{ fontFamily: HEAD }}>{d.standingGroups[0].competition}</h2><div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"><StandingsTable rows={d.standings} showForm={false} label="League table" theme={{ th: 'text-xs uppercase tracking-widest text-[#4B5278] border-b', tr: 'border-b border-black/5', us: 'font-bold bg-[#1E2A5E]/5', points: 'font-bold' }} /></div></section>}

      {d.has.news && <section id="ms-news" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20"><h2 className="mb-8 text-4xl font-extrabold" style={{ fontFamily: HEAD }}>Union news</h2><div className="grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 80} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"><SmartImg src={n.image} seed={n.title} kind="action" palette="royal" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-xs font-semibold uppercase tracking-wide text-[#4B5278]">{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-1 text-xl font-bold leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3>{n.summary && <p className="mt-2 text-sm text-[#4B5278]">{n.summary}</p>}</div></SpReveal>)}</div></section>}
      {d.has.gallery && <section id="ms-gallery" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-xl"><SmartImg src={p.src} seed={p.id} kind="action" palette="royal" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Partners" className="border-y border-black/10 bg-white py-8"><ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-12 gap-y-3 px-5">{d.sponsors.map((s) => <li key={s.id} className="text-xl font-bold text-[#12183A]/40" style={{ fontFamily: HEAD }}>{s.name}</li>)}</ul></section>}

      <section id="ms-contact" className="scroll-mt-16 mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><h2 className="text-4xl font-extrabold" style={{ fontFamily: HEAD }}>Get in touch</h2><div className="mt-5 space-y-1.5">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-[#EEF1FA]" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={sports.length ? ['General enquiry', ...sports.map((s) => `Joining: ${s}`)] : undefined} buttonStyle={{ background: base }} cls={{ input: 'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-[#1E2A5E] focus:outline-none', button: 'rounded-full px-8 py-3 text-sm font-semibold text-white', note: 'text-sm text-[#4B5278]' }} />
      </section>
      <footer className="py-6 text-center text-sm text-white/80" style={{ background: base }}>© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
