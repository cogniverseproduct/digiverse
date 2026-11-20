import React from 'react';
import { Container } from '../layout/Container';
import { Reveal } from '../ui/dv/Reveal';
import { Eyebrow } from '../ui/dv/Ambient';
import { Trophy, Landmark, CalendarDays, HeartHandshake, UserRound, ArrowUpRight, Boxes } from 'lucide-react';

/**
 * Home-page presentation of DigiVerse's five website-generation engines.
 * Purely presentational marketing content — it links to existing public pages
 * and does not touch or re-skin any engine.
 */
const ENGINES = [
  {
    icon: Landmark,
    name: 'Cultural Website Engine',
    blurb: 'Festivals, heritage, puja committees and cultural societies — rich storytelling with galleries and schedules.',
    art: 'from-[#F2C7C7] via-[#FFB7C5] to-[#FFE1E8]',
    img: '/images/festivals/durga-hero.jpg',
    accent: 'text-[#A92E55] bg-white/85 border-[#FFB7C5]',
    span: 'lg:col-span-7 lg:row-span-2',
    tall: true,
  },
  {
    icon: Trophy,
    name: 'Sports Website Engine',
    blurb: 'Teams, fixtures, tournaments and achievements for clubs and academies.',
    art: 'from-[#D5F3D8] via-[#BFEAC6] to-[#F4FCF5]',
    img: '/images/festivals/sports-meet.jpg',
    accent: 'text-[#1F6B43] bg-white/85 border-[#9BE0B4]',
    span: 'lg:col-span-5',
  },
  {
    icon: UserRound,
    name: 'Portfolio Engine',
    blurb: 'Personal portfolios for developers, designers, academics and creators.',
    art: 'from-[#FFE1E8] via-white to-[#D5F3D8]',
    img: '/images/festivals/classical-recital.jpg',
    accent: 'text-[#A92E55] bg-white/85 border-[#FFB7C5]',
    span: 'lg:col-span-5',
  },
  {
    icon: CalendarDays,
    name: 'Event Website Engine',
    blurb: 'Conferences, summits and celebrations with agendas, speakers and registrations.',
    art: 'from-[#FFB7C5] via-[#F2C7C7] to-[#FFF1F4]',
    img: '/images/festivals/pandal-lights.jpg',
    accent: 'text-[#A92E55] bg-white/85 border-[#FFB7C5]',
    span: 'lg:col-span-6',
  },
  {
    icon: HeartHandshake,
    name: 'Social & NGO Engine',
    blurb: 'Missions, initiatives, volunteers and impact for NGOs and welfare groups.',
    art: 'from-[#D5F3D8] via-[#E9F8EA] to-[#FFE1E8]',
    accent: 'text-[#1F6B43] bg-white/85 border-[#9BE0B4]',
    span: 'lg:col-span-6',
  },
];

export const EngineShowcase: React.FC = () => (
  <section className="dv-wash-green relative py-20 sm:py-28" aria-labelledby="engines-heading">
    <Container>
      <Reveal className="mx-auto max-w-3xl text-center">
        <Eyebrow icon={Boxes}>One platform · five engines</Eyebrow>
        <h2 id="engines-heading" className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-dv-ink sm:text-5xl">
          A purpose-built engine for{' '}
          <span className="font-editorial font-normal italic tracking-[-0.01em] dv-prism-text">every kind of story.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-dv-ink-2">
          Each engine understands its audience — the pages, content and visual language a sports club, a
          festival committee or a personal brand actually needs.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[230px] lg:grid-cols-12">
        {ENGINES.map((e, i) => {
          const Icon = e.icon;
          return (
            <Reveal
              key={e.name}
              delay={i * 70}
              className={`group relative isolate min-h-[230px] overflow-hidden rounded-[26px] border border-white/80 shadow-dv-card dv-lift ${e.span} ${
                i === 0 ? 'sm:col-span-2 lg:col-span-7' : ''
              }`}
            >
              {/* Designed engine artwork: gradient field + oversized glyph + wireframe sketch */}
              <div aria-hidden className={`absolute inset-0 -z-10 bg-gradient-to-br ${e.art}`} />
              <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" />
              <Icon aria-hidden strokeWidth={1} className={`absolute -z-10 text-white/70 transition-transform duration-[1.2s] ease-out group-hover:rotate-[-6deg] group-hover:scale-110 ${e.tall ? '-right-10 -top-6 h-80 w-80' : '-right-6 -top-6 h-44 w-44'}`} />
              <div aria-hidden className={`absolute right-5 -z-10 hidden w-[42%] rounded-xl border border-white/80 bg-white/70 p-2.5 shadow-[0_14px_30px_-16px_rgba(38,24,43,0.4)] backdrop-blur-sm sm:block ${e.tall ? 'bottom-28' : 'bottom-24 lg:hidden xl:block'}`}>
                <div className="mb-2 flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#FF9AAE]" /><span className="h-1.5 w-1.5 rounded-full bg-[#FFD9A0]" /><span className="h-1.5 w-1.5 rounded-full bg-[#8FD9A8]" /></div>
                {e.img && <img src={e.img} alt="" loading="lazy" decoding="async" className="mb-2 h-16 w-full rounded-lg object-cover" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />}
                <div className="h-1.5 w-3/4 rounded-full bg-[#26182B]/25" />
                <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-[#26182B]/15" />
                <div className="mt-2.5 grid grid-cols-3 gap-1"><span className="h-5 rounded bg-[#FFB7C5]/50" /><span className="h-5 rounded bg-[#D5F3D8]" /><span className="h-5 rounded bg-[#F2C7C7]/70" /></div>
              </div>
              <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-white/45 via-transparent to-transparent" />

              <div className="flex h-full flex-col justify-between p-5 sm:p-6">
                <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${e.accent}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {e.name.replace(' Website', '').replace(' Engine', '')}
                </span>

                <div>
                  <h3 className={`font-display font-bold tracking-[-0.03em] text-dv-ink ${e.tall ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
                    {e.name}
                  </h3>
                  <p className={`mt-2 max-w-md text-[14px] leading-6 text-dv-ink-2 ${e.tall ? '' : 'line-clamp-2'}`}>{e.blurb}</p>
                </div>
              </div>

              <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-dv-ink opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-10 flex justify-center">
        <a
          href="/templates"
          className="group inline-flex items-center gap-2 rounded-full border border-[#F2C7C7] bg-white px-5 py-2.5 text-sm font-semibold text-dv-ink shadow-dv-card transition-all hover:-translate-y-0.5 hover:border-[#FFB7C5]"
        >
          Browse website design concepts
          <ArrowUpRight className="h-4 w-4 text-dv-iris-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </Reveal>
    </Container>
  </section>
);

export default EngineShowcase;
