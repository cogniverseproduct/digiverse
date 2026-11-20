import React, { useMemo, useState } from 'react';
import { Award, Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import type { SportsTemplateProps } from '../../types';
import { fmtDate, fmtDay, fmtTime, normalizeSports, scoreText, type NFixture } from '../../kit/data';
import { DemoBadge, EnquiryForm, Lightbox, SmartImg, SocialRow, SpReveal, StandingsTable, mapsUrl, scrollToId, useActiveSection, useCountdown, useSportsFonts } from '../../kit/ui';

const FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap';
const SERIF = '"Playfair Display", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

/**
 * Premier Elite Club: a formal, high-status club site. Centred crest masthead, a next-match hero with a live
 * countdown, a squad directory by position with large shirt numbers, a results ledger and honours cabinet.
 */
export const PremierEliteClub: React.FC<SportsTemplateProps> = (props) => {
  useSportsFonts(FONTS);
  const d = useMemo(() => normalizeSports(props, { art: 'royal', coverKind: 'stadium' }), [props]);
  const gold = d.brand.accent || '#F5C542';
  const navy = d.brand.primary || '#0A1A4A';
  const [lb, setLb] = useState<number | null>(null);
  const [tab, setTab] = useState<'fixtures' | 'results'>(d.fixtures.length || !d.results.length ? 'fixtures' : 'results');
  const cd = useCountdown(d.next?.date || null);

  const groups = useMemo(() => {
    const m = new Map<string, typeof d.players>();
    d.players.forEach((p) => m.set(p.position || 'Squad', [...(m.get(p.position || 'Squad') || []), p]));
    return [...m.entries()];
  }, [d.players]);

  const nav = ([
    (d.has.fixtures || d.has.results) && ['Fixtures', 'pe-matches'], d.has.standings && ['Table', 'pe-table'], d.has.players && ['Squad', 'pe-squad'],
    (d.has.history || d.has.staff) && ['The Club', 'pe-club'], d.has.news && ['News', 'pe-news'], d.has.gallery && ['Gallery', 'pe-gallery'], ['Contact', 'pe-contact']
  ].filter(Boolean) as [string, string][]);
  const active = useActiveSection(nav.map((n) => n[1]));
  const label = 'text-[11px] font-semibold uppercase tracking-[0.28em]';
  const matchRow = (f: NFixture) => (
    <li key={f.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/10 py-4">
      <div className="w-14 text-center"><div className="text-2xl font-bold leading-none" style={{ fontFamily: SERIF, color: gold }}>{f.date?.getDate() ?? '–'}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-white/60">{f.date ? fmtDate(f.date, { month: 'short' }) : ''}</div></div>
      <div className="min-w-0"><div className="truncate text-sm font-semibold sm:text-base">{f.homeName} <span className="mx-1 font-normal text-white/50">{f.hasScore ? scoreText(f) : 'v'}</span> {f.awayName}</div><div className="mt-0.5 truncate text-xs text-white/60">{[f.competition, f.round, f.venue, fmtTime(f.date)].filter(Boolean).join(' · ')}</div></div>
      {f.outcome ? <span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${f.outcome === 'W' ? 'bg-emerald-500 text-white' : f.outcome === 'D' ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white'}`}>{f.outcome}</span> : <span className="text-[11px] uppercase tracking-wider text-white/50">{f.status.replace('_', ' ')}</span>}
    </li>
  );

  return (
    <div id="pe-top" className="sp-root min-h-screen text-[#F3F6FF]" style={{ background: '#07102E', fontFamily: SANS }}>
      <DemoBadge show={d.isDemo} />
      {/* Masthead */}
      <header className="border-b border-white/10" style={{ background: navy }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2 text-[11px] text-white/70">
          <span className="truncate">{[d.homeGround, d.location].filter(Boolean).join(' · ')}</span>
          {d.socials.length > 0 && <SocialRow socials={d.socials} itemClass="flex h-6 w-6 items-center justify-center rounded-full hover:text-white" />}
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-4 pt-2">
          <button type="button" onClick={() => scrollToId('pe-top')} className="flex flex-col items-center gap-2">
            <img src={d.logo} alt={`${d.name} crest`} className="h-20 w-20 object-contain" />
            <span className="text-3xl font-bold tracking-wide sm:text-4xl" style={{ fontFamily: SERIF }}>{d.name}</span>
          </button>
        </div>
      </header>
      <nav aria-label="Sections" className="sticky top-0 z-30 border-b border-white/10 bg-[#07102E]/95 backdrop-blur">
        <ul className="sp-no-scrollbar mx-auto flex max-w-6xl justify-start gap-1 overflow-x-auto px-3 sm:justify-center">
          {nav.map(([l, id]) => <li key={id}><button type="button" onClick={() => scrollToId(id)} className={`relative px-4 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition hover:text-white ${active === id ? 'text-white' : 'text-white/60'}`}>{l}<span className="absolute inset-x-4 bottom-0 h-0.5 origin-left transition-transform" style={{ background: gold, transform: active === id ? 'scaleX(1)' : 'scaleX(0)' }} /></button></li>)}</ul>
      </nav>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <SmartImg src={d.cover} seed={d.name} kind="stadium" palette="royal" alt="" loading="eager" className="sp-kenburns absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07102E]/70 via-[#07102E]/70 to-[#07102E]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <SpReveal>
            {d.nickname && <p className={label} style={{ color: gold }}>{d.nickname}{d.founded ? ` · Est. ${d.founded}` : ''}</p>}
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-6xl" style={{ fontFamily: SERIF }}>{d.tagline || d.name}</h1>
            {d.description && <p className="mt-5 max-w-xl text-base leading-7 text-white/75">{d.description}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              {(d.has.fixtures || d.has.results) && <button type="button" onClick={() => scrollToId('pe-matches')} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#07102E]" style={{ background: gold }}>Fixtures & results</button>}
              <button type="button" onClick={() => scrollToId('pe-contact')} className="border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white/10">Contact the club</button>
            </div>
          </SpReveal>
          {d.next && (
            <SpReveal delay={120} from="right" className="border border-white/15 bg-[#0A1A4A]/80 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between"><span className={label} style={{ color: gold }}>Next match</span><span className="text-xs text-white/60">{d.next.competition || d.next.round}</span></div>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div className="text-lg font-bold sm:text-xl" style={{ fontFamily: SERIF }}>{d.next.homeName}</div>
                <div className="text-sm text-white/50">v</div>
                <div className="text-lg font-bold sm:text-xl" style={{ fontFamily: SERIF }}>{d.next.awayName}</div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtDay(d.next.date)}</span>
                {fmtTime(d.next.date) && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{fmtTime(d.next.date)}</span>}
                {d.next.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{d.next.venue}</span>}
              </div>
              {cd && !cd.done && (
                <div className="mt-6 grid grid-cols-4 gap-2 text-center" role="timer" aria-label="Time until kick-off">
                  {[['Days', cd.d], ['Hours', cd.h], ['Mins', cd.m], ['Secs', cd.s]].map(([l, v]) => <div key={l as string} className="border border-white/10 bg-black/20 py-3"><div className="text-2xl font-bold tabular-nums" style={{ fontFamily: SERIF, color: gold }}>{String(v).padStart(2, '0')}</div><div className="text-[10px] uppercase tracking-widest text-white/50">{l}</div></div>)}
                </div>
              )}
            </SpReveal>
          )}
        </div>
        {d.stats.length > 0 && (
          <div className="border-y border-white/10 bg-black/20"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 py-6 sm:grid-cols-4">
            {d.stats.slice(0, 4).map((s) => <div key={s.label} className="py-2 text-center"><div className="text-3xl font-bold" style={{ fontFamily: SERIF, color: gold }}>{s.value}</div><div className="text-[11px] uppercase tracking-[0.2em] text-white/60">{s.label}</div></div>)}
          </div></div>
        )}
      </section>

      {/* Fixtures & results */}
      {(d.has.fixtures || d.has.results) && (
        <section id="pe-matches" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20">
          <SpReveal className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className={label} style={{ color: gold }}>Matches</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>Fixtures & results</h2></div>
            <div role="tablist" aria-label="Fixtures or results" className="flex border border-white/20">{(['fixtures', 'results'] as const).filter((k) => d.has[k]).map((k) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${tab === k ? 'text-[#07102E]' : 'text-white/70'}`} style={tab === k ? { background: gold } : undefined}>{k}</button>)}</div>
          </SpReveal>
          <ul>{(tab === 'fixtures' ? d.fixtures : d.results).slice(0, 8).map(matchRow)}</ul>
        </section>
      )}

      {/* Table */}
      {d.has.standings && (
        <section id="pe-table" className="scroll-mt-16 bg-[#0A1A4A]/60 py-20"><div className="mx-auto max-w-6xl px-5">
          <SpReveal className="mb-8"><p className={label} style={{ color: gold }}>{d.standingGroups[0].competition}</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>League table</h2></SpReveal>
          <StandingsTable rows={d.standings} label={d.standingGroups[0].competition} theme={{ th: 'text-[11px] uppercase tracking-widest text-white/60 border-b border-white/20', tr: 'border-b border-white/10', us: 'bg-white/10 font-semibold', points: 'text-base', td: 'text-white/80' }} />
        </div></section>
      )}

      {/* Squad */}
      {d.has.players && (
        <section id="pe-squad" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20">
          <SpReveal className="mb-10"><p className={label} style={{ color: gold }}>The squad</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>Players</h2></SpReveal>
          {groups.map(([pos, list]) => (
            <div key={pos} className="mb-10">
              <h3 className="mb-4 border-b border-white/15 pb-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">{pos}</h3>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((p, i) => (
                  <SpReveal as="li" key={p.id} delay={i * 40} className="group relative overflow-hidden border border-white/10 bg-[#0A1A4A]">
                    <div className="relative aspect-[4/5] overflow-hidden"><SmartImg src={p.photo} seed={p.name} kind="portrait" palette="royal" alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute right-3 top-1 text-6xl font-bold opacity-90" style={{ fontFamily: SERIF, color: 'transparent', WebkitTextStroke: `1.5px ${gold}` }}>{p.number ?? ''}</span></div>
                    <div className="p-3"><div className="text-sm font-semibold">{p.name}</div><div className="text-[11px] uppercase tracking-widest text-white/55">{p.team}</div></div>
                  </SpReveal>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Club: management, honours, history */}
      {(d.has.history || d.has.staff) && (
        <section id="pe-club" className="scroll-mt-16 bg-[#0A1A4A]/60 py-20"><div className="mx-auto max-w-6xl px-5">
          <SpReveal className="mb-10"><p className={label} style={{ color: gold }}>The club</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>History, honours & people</h2></SpReveal>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              {d.history && <p className="text-base leading-7 text-white/80">{d.history}</p>}
              {(d.mission || d.vision) && <div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Mission', d.mission], ['Vision', d.vision]].filter(([, v]) => v).map(([k, v]) => <div key={k as string} className="border-l-2 pl-4" style={{ borderColor: gold }}><div className={label} style={{ color: gold }}>{k}</div><p className="mt-1 text-sm leading-6 text-white/75">{v}</p></div>)}</div>}
              {d.timeline.length > 0 && <ol className="mt-8 border-l border-white/20">{d.timeline.map((t) => <li key={t.year + t.title} className="relative pb-6 pl-6"><span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: gold }} /><div className="text-sm font-bold" style={{ color: gold }}>{t.year}</div><div className="font-semibold">{t.title}</div>{t.description && <p className="text-sm text-white/65">{t.description}</p>}</li>)}</ol>}
            </div>
            <div>
              {d.clubAchievements.length > 0 && <div className="mb-8 border border-white/15 bg-black/20 p-6"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: gold }}><Trophy className="h-4 w-4" />Honours</h3><ul className="space-y-2.5">{d.clubAchievements.map((a) => <li key={a} className="flex items-start gap-3 text-sm"><Award className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />{a}</li>)}</ul></div>}
              {d.has.staff && <ul className="grid grid-cols-2 gap-4">{d.staff.map((s) => <li key={s.id} className="flex items-center gap-3"><SmartImg src={s.photo} seed={s.name} kind="portrait" palette="royal" alt={s.name} className="h-14 w-14 rounded-full object-cover" /><div><div className="text-sm font-semibold">{s.name}</div><div className="text-[11px] uppercase tracking-widest text-white/55">{s.role}</div></div></li>)}</ul>}
            </div>
          </div>
        </div></section>
      )}

      {/* News */}
      {d.has.news && (
        <section id="pe-news" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20">
          <SpReveal className="mb-8"><p className={label} style={{ color: gold }}>Latest</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>Club news</h2></SpReveal>
          <div className="grid gap-6 md:grid-cols-3">{d.news.slice(0, 3).map((n, i) => (
            <SpReveal as="article" key={n.id} delay={i * 80} className="group overflow-hidden border border-white/10 bg-[#0A1A4A]">
              <div className="aspect-[16/10] overflow-hidden"><SmartImg src={n.image} seed={n.title} kind="action" palette="royal" alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>
              <div className="p-5"><div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: gold }}>{[n.category, fmtDate(n.date)].filter(Boolean).join(' · ')}</div><h3 className="mt-2 text-lg font-bold leading-snug" style={{ fontFamily: SERIF }}>{n.title}</h3>{n.summary && <p className="mt-2 line-clamp-3 text-sm text-white/65">{n.summary}</p>}</div>
            </SpReveal>))}</div>
        </section>
      )}

      {/* Gallery */}
      {d.has.gallery && (
        <section id="pe-gallery" className="scroll-mt-16 bg-[#0A1A4A]/60 py-20"><div className="mx-auto max-w-6xl px-5">
          <SpReveal className="mb-8"><p className={label} style={{ color: gold }}>Gallery</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>Moments</h2></SpReveal>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{d.photos.slice(0, 8).map((p, i) => <li key={p.id} className={i === 0 ? 'col-span-2 row-span-2' : ''}><button type="button" onClick={() => setLb(i)} className="group block h-full w-full overflow-hidden" aria-label={`Open photo: ${p.caption || i + 1}`}><SmartImg src={p.src} seed={p.id} kind="action" palette="royal" alt={p.caption} className="h-full min-h-[8rem] w-full object-cover transition duration-700 group-hover:scale-105" /></button></li>)}</ul>
          <Lightbox items={d.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
        </div></section>
      )}

      {/* Partners */}
      {d.has.sponsors && (
        <section aria-label="Partners" className="mx-auto max-w-6xl px-5 py-16">
          <p className={`${label} mb-6 text-center`} style={{ color: gold }}>Our partners</p>
          <ul className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-5">{d.sponsors.map((s) => <li key={s.id} className="flex min-h-[5rem] items-center justify-center bg-[#07102E] p-4 text-center">{s.logo ? <img src={s.logo} alt={s.name} className="max-h-10 object-contain" /> : (s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline">{s.name}</a> : <span className="text-sm font-semibold">{s.name}</span>)}{s.level && <span className="sr-only">{s.level}</span>}</li>)}</ul>
        </section>
      )}

      {/* Contact */}
      <section id="pe-contact" className="scroll-mt-16 border-t border-white/10 bg-[#0A1A4A] py-20"><div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2">
        <div><p className={label} style={{ color: gold }}>Contact</p><h2 className="mt-2 text-4xl font-bold" style={{ fontFamily: SERIF }}>Get in touch</h2>
          <dl className="mt-6 space-y-4 text-sm">
            {d.address && <div><dt className={label} style={{ color: gold }}>Visit</dt><dd className="mt-1 text-white/80">{d.address} <a href={mapsUrl(d.address)} target="_blank" rel="noopener noreferrer" className="underline">Map</a></dd></div>}
            {d.email && <div><dt className={label} style={{ color: gold }}>Email</dt><dd className="mt-1"><a href={`mailto:${d.email}`} className="text-white/80 hover:underline">{d.email}</a></dd></div>}
            {d.phone && <div><dt className={label} style={{ color: gold }}>Phone</dt><dd className="mt-1"><a href={`tel:${d.phone}`} className="text-white/80 hover:underline">{d.phone}</a></dd></div>}
          </dl>
          {d.socials.length > 0 && <SocialRow socials={d.socials} showLabel className="mt-6" itemClass="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-xs hover:bg-white/10" />}
        </div>
        <EnquiryForm email={d.email} subjectPrefix={`${d.name} enquiry`} button="Send message" buttonStyle={{ background: gold }} cls={{ input: 'w-full border border-white/20 bg-[#07102E] px-4 py-3 text-sm placeholder:text-white/40 focus:border-white/60 focus:outline-none', button: 'px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#07102E]', note: 'text-sm text-white/70' }} />
      </div></section>

      <footer className="border-t border-white/10 bg-[#050B22] py-8 text-center text-xs text-white/50">
        <img src={d.logo} alt="" className="mx-auto mb-3 h-10 w-10 object-contain opacity-80" />
        © {new Date().getFullYear()} {d.name}. All rights reserved.
      </footer>
    </div>
  );
};
