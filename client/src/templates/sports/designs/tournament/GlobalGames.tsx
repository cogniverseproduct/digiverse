import React, { useMemo, useState } from 'react';
import { CalendarDays, Globe2, MapPin } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtRange, fmtTime, groupByDay, normalizeSports, scoreText } from '../../kit/data';
import { Bracket, DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap';
const HEAD = 'Sora, system-ui, sans-serif';
const SANS = 'Inter, system-ui, sans-serif';

/** Global Games: sunrise gradient, day-by-day schedule. The main view is a strip of days, each with its sessions and results. */
export const GlobalGames: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'sunrise', coverKind: 'track' }), [props]);
  const orange = d.brand.accent || '#FF9A3C';
  const t = d.tournament;
  const [lb, setLb] = useState<number | null>(null);
  const days = useMemo(() => groupByDay([...d.results, ...d.fixtures].map((f) => f)), [d.results, d.fixtures]);
  const [dayKey, setDayKey] = useState(() => (days.find((x) => x.items.some((i) => !i.completed)) || days[0])?.key || '');
  const day = days.find((x) => x.key === dayKey) || days[0];
  const grad = 'linear-gradient(135deg,#2B1055 0%,#7A2E8E 55%,#FF9A3C 130%)';
  const nav = ([days.length > 0 && ['Schedule', 'gg-schedule'], d.has.standings && ['Standings', 'gg-standings'], d.has.bracket && ['Medal rounds', 'gg-medal'], d.has.teams && ['Teams', 'gg-teams'], d.has.venues && ['Venues', 'gg-venues'], d.has.news && ['News', 'gg-news'], ['Contact', 'gg-contact']].filter(Boolean) as [string, string][]);

  return (
    <div id="gg-top" className="sp-root min-h-screen bg-[#140A2B] text-[#FFF4E8]" style={{ fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      <header className="sticky top-0 z-30 bg-[#140A2B]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <button type="button" onClick={() => scrollToId('gg-top')} className="flex items-center gap-3"><img src={d.logo} alt="" className="h-9 w-9 object-contain" /><span className="font-bold" style={{ fontFamily: HEAD }}>{d.name}</span></button>
          <nav aria-label="Sections" className="sp-no-scrollbar flex min-w-0 gap-5 overflow-x-auto">{nav.map(([l, id]) => <button key={id} type="button" onClick={() => scrollToId(id)} className="whitespace-nowrap text-sm font-medium text-white/70 hover:text-white">{l}</button>)}</nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden" style={{ background: grad }}>
        <SmartImg src={d.cover} seed={d.name} kind="track" palette="sunrise" alt="" loading="eager" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 mix-blend-overlay" />
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-32">
          <SpReveal><p className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]"><Globe2 className="h-4 w-4" />{[t.edition, d.sport].filter(Boolean).join(' · ') || 'International competition'}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[1.02] sm:text-7xl" style={{ fontFamily: HEAD }}>{d.tagline || d.name}</h1>
            <p className="mt-3 text-xl font-semibold text-white/90" style={{ fontFamily: HEAD }}>{d.name}</p></SpReveal>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">{fmtRange(t.start, t.end) && <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2"><CalendarDays className="h-4 w-4" />{fmtRange(t.start, t.end)}</span>}{(t.location || d.location) && <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2"><MapPin className="h-4 w-4" />Host: {t.location || d.location}</span>}{d.teams.length > 0 && <span className="rounded-full bg-black/30 px-4 py-2">{d.teams.length} participating teams</span>}</div>
          {d.description && <p className="mt-6 max-w-2xl text-lg text-white/90">{d.description}</p>}
        </div>
      </section>

      {days.length > 0 && day && (
        <section id="gg-schedule" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Day by day</h2>
          <div role="tablist" aria-label="Choose a day" className="sp-no-scrollbar mt-8 flex min-w-0 gap-3 overflow-x-auto pb-2">{days.map((x) => <button key={x.key} role="tab" aria-selected={x.key === day.key} type="button" onClick={() => setDayKey(x.key)} className="shrink-0 rounded-2xl border px-5 py-3 text-center" style={x.key === day.key ? { background: orange, color: '#2B1055', borderColor: orange } : { borderColor: 'rgba(255,255,255,.2)' }}><div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{fmtDate(x.date, { weekday: 'short' }) || 'TBC'}</div><div className="text-2xl font-extrabold leading-none" style={{ fontFamily: HEAD }}>{x.date?.getDate() ?? '·'}</div><div className="text-[11px] uppercase opacity-80">{fmtDate(x.date, { month: 'short' })}</div></button>)}</div>
          <ul role="tabpanel" className="mt-6 grid gap-4 md:grid-cols-2">{day.items.map((f) => <li key={f.id} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5"><div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/55"><span>{fmtTime(f.date) || 'Time TBC'}</span><span>{[f.round, f.venue].filter(Boolean).join(' · ')}</span></div><div className="mt-3 flex items-center justify-between gap-4"><div className="min-w-0 text-lg font-bold" style={{ fontFamily: HEAD }}><div className="truncate">{f.homeName}</div><div className="truncate">{f.awayName}</div></div>{f.completed && <div className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-3xl font-extrabold tabular-nums" style={{ background: grad }}>{scoreText(f)}</div>}</div></li>)}</ul>
        </section>
      )}

      {d.has.standings && <section id="gg-standings" className="scroll-mt-16 bg-black/20 py-20"><div className="mx-auto max-w-7xl px-5"><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Standings</h2><div className="mt-8 grid gap-6 lg:grid-cols-2">{d.standingGroups.map((g) => <div key={g.competition} className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><h3 className="px-2 pb-2 text-sm font-bold uppercase tracking-widest" style={{ color: orange }}>{g.competition}</h3><StandingsTable rows={g.rows} showForm={false} label={g.competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/50 border-b border-white/15', tr: 'border-b border-white/10', us: 'font-bold', points: 'font-bold' }} /></div>)}</div></div></section>}

      {d.has.bracket && <section id="gg-medal" className="scroll-mt-16 mx-auto max-w-7xl px-5 py-20"><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Medal rounds</h2><div className="mt-8"><Bracket stages={d.stages} formatDate={(x) => fmtDate(x, { day: 'numeric', month: 'short' })} theme={{ stageTitle: 'text-xs font-bold uppercase tracking-[0.25em]', match: 'rounded-2xl border border-white/20 bg-white/[0.07]', win: 'font-extrabold', score: 'font-extrabold' }} /></div></section>}

      {d.has.teams && <section id="gg-teams" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20"><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Teams</h2><ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{d.teams.map((x) => <li key={x.id} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-[#2B1055]" style={{ background: orange, fontFamily: HEAD }}>{x.name.slice(0, 3).toUpperCase()}</span><span className="min-w-0 truncate font-semibold">{x.name}</span></li>)}</ul></section>}

      {d.has.venues && <section id="gg-venues" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20"><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Venues</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{d.venues.map((v) => <div key={v.id} className="rounded-2xl border border-white/15 bg-white/[0.05] p-5"><h3 className="text-xl font-bold" style={{ fontFamily: HEAD }}>{v.name}</h3>{v.address && <a href={mapsUrl(v.address)} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm underline text-white/75">{v.address}</a>}{v.capacity && <p className="mt-2 text-xs text-white/55">Capacity {v.capacity.toLocaleString('en-GB')}</p>}{v.notes && <p className="mt-2 text-sm text-white/70">{v.notes}</p>}</div>)}</div></section>}

      {(d.has.rules || t.format || t.prizeInfo) && <section className="mx-auto max-w-7xl px-5 pb-20"><div className="grid gap-6 md:grid-cols-2">{(t.format || t.formatDescription) && <div className="rounded-2xl border border-white/15 p-6"><h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: orange }}>Format</h3><p className="mt-3 text-white/85">{[t.format, t.formatDescription].filter(Boolean).join(': ')}</p>{t.prizeInfo && <p className="mt-3 text-sm text-white/70">Awards: {t.prizeInfo}</p>}</div>}{d.has.rules && <div className="rounded-2xl border border-white/15 p-6"><h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: orange }}>Rules</h3><ol className="mt-3 list-decimal space-y-1.5 pl-5 text-white/85">{d.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></div>}</div></section>}

      {d.has.news && <section id="gg-news" className="scroll-mt-16 mx-auto max-w-7xl px-5 pb-20"><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>News</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => <SpReveal as="article" key={n.id} delay={i * 80} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05]"><SmartImg src={n.image} seed={n.title} kind="track" palette="sunrise" alt="" className="aspect-video w-full object-cover" /><div className="p-5"><div className="text-[11px] uppercase tracking-widest" style={{ color: orange }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-1 text-lg font-bold leading-snug" style={{ fontFamily: HEAD }}>{n.title}</h3></div></SpReveal>)}</div></section>}
      {d.has.gallery && <section className="mx-auto max-w-7xl px-5 pb-20"><ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id}><button type="button" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`} className="block w-full overflow-hidden rounded-2xl"><SmartImg src={p.src} seed={p.id} kind="track" palette="sunrise" alt={p.caption} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" /></button></li>)}</ul><Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} /></section>}
      {d.has.sponsors && <section aria-label="Partners" className="border-y border-white/10 py-8"><ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-12 gap-y-3 px-5 text-xl font-bold text-white/40" style={{ fontFamily: HEAD }}>{d.sponsors.map((s) => <li key={s.id}>{s.name}</li>)}</ul></section>}

      <section id="gg-contact" className="scroll-mt-16 mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2">
        <div><h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: HEAD }}>Contact the organisers</h2><div className="mt-5 space-y-1.5 text-white/85">{d.address && <p><a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">{d.address}</a></p>}{d.email && <p><a href={`mailto:${d.email}`} className="underline">{d.email}</a></p>}{d.phone && <p>{d.phone}</p>}</div>{d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-5" itemClass="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs hover:bg-white/10" />}</div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} topics={['Delegation / team', 'Media accreditation', 'Volunteering', 'General']} buttonStyle={{ background: orange }} cls={{ input: 'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm placeholder:text-white/45 focus:border-white/50 focus:outline-none', button: 'rounded-full px-8 py-3 text-sm font-bold text-[#2B1055]', note: 'text-sm text-white/75' }} />
      </section>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/45">© {new Date().getFullYear()} {d.name}</footer>
    </div>
  );
};
