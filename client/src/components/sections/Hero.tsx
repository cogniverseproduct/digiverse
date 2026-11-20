import React, { useEffect, useRef } from 'react';
import { Container } from '../layout/Container';
import { Ambient, Eyebrow } from '../ui/dv/Ambient';
import {
  ArrowRight,
  Sparkles,
  Globe,
  ShieldCheck,
  Layers3,
  Palette,
  ArrowUpRight,
  Trophy,
  Landmark,
  CalendarDays,
  HeartHandshake,
  UserRound,
  Wand2,
  Github,
  Linkedin,
  Dribbble,
} from 'lucide-react';

interface HeroProps {
  onOpenDemo: () => void;
}

/** The five website-generation engines DigiVerse ships with (names only — engines untouched). */
const ENGINES = [
  { icon: Trophy, label: 'Sports' },
  { icon: Landmark, label: 'Cultural' },
  { icon: CalendarDays, label: 'Events' },
  { icon: HeartHandshake, label: 'Social & NGO' },
  { icon: UserRound, label: 'Portfolio' },
];

/** Pointer parallax for the 3D stage — transform only, rAF-throttled, off for touch & reduced motion. */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (reduce || !fine) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
        el.style.setProperty('--px', `${(x * 18).toFixed(1)}px`);
        el.style.setProperty('--py', `${(y * 14).toFixed(1)}px`);
      });
    };
    const onLeave = () => {
      ['--rx', '--ry', '--px', '--py'].forEach((p) => el.style.setProperty(p, p.startsWith('--r') ? '0deg' : '0px'));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return ref;
}

const Img: React.FC<{ src: string; className?: string }> = ({ src, className }) => (
  <img
    src={src}
    alt=""
    loading="lazy"
    decoding="async"
    className={className}
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
);

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  const stageRef = useParallax<HTMLDivElement>();

  return (
    <section id="home" className="relative isolate overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-14 lg:pt-16">
      <Ambient variant="hero" />

      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* ---------- Message ---------- */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="animate-dv-rise">
              <Eyebrow icon={Wand2}>Website &amp; portfolio studio</Eyebrow>
            </div>

            <h1 className="mt-7 animate-dv-rise font-display text-[44px] font-bold leading-[1.02] tracking-[-0.045em] text-dv-ink [animation-delay:80ms] sm:text-6xl xl:text-[74px]">
              Websites &amp; portfolios,
              <br />
              crafted around{' '}
              <span className="relative inline-block font-editorial text-[1.08em] font-normal italic tracking-[-0.02em]">
                <span className="dv-prism-text pr-1">who you are.</span>
                <svg aria-hidden viewBox="0 0 300 18" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none">
                  <path d="M3 13C70 4 160 2 297 9" stroke="url(#dvUnderline)" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="dvUnderline" x1="0" x2="1">
                      <stop offset="0" stopColor="#FFB7C5" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#5CC48A" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-xl animate-dv-rise text-[16px] leading-8 text-dv-ink-2 [animation-delay:160ms] sm:text-[17px]">
              Create a distinctive digital presence for your cultural society, sports club, puja committee,
              event, NGO or personal brand. Designed around your identity, not another generic template.
            </p>

            <div className="mt-9 flex animate-dv-rise flex-col gap-3 [animation-delay:240ms] sm:flex-row">
              <button
                type="button"
                onClick={onOpenDemo}
                className="dv-sheen group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#B8335C] via-[#C94872] to-[#D9658A] px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_32px_-12px_rgba(214,90,126,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-16px_rgba(214,90,126,0.85)]"
              >
                <Sparkles className="h-4 w-4" />
                Request a Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="/how-it-works"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-[#F2C7C7] bg-white/80 px-7 py-4 text-[15px] font-semibold text-dv-ink shadow-[0_1px_2px_rgba(38,24,43,0.05)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFB7C5] hover:bg-white"
              >
                Explore the Platform
                <ArrowUpRight className="h-4 w-4 text-dv-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* Engines strip */}
            <div className="mt-12 animate-dv-rise [animation-delay:320ms]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dv-muted">
                Five specialised creation engines
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {ENGINES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-dv-line bg-white/80 py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-dv-ink-2 shadow-[0_1px_2px_rgba(18,18,42,0.04)] backdrop-blur"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dv-iris-50 text-dv-iris-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---------- 3D product stage ---------- */}
          <div className="relative lg:col-span-6 xl:col-span-7">
            <div
              ref={stageRef}
              className="relative mx-auto max-w-[680px] animate-dv-fade [animation-delay:200ms] [perspective:1600px]"
              style={{ ['--rx' as string]: '0deg', ['--ry' as string]: '0deg', ['--px' as string]: '0px', ['--py' as string]: '0px' }}
            >
              {/* Glow plate */}
              <div aria-hidden className="absolute -inset-6 rounded-[44px] bg-gradient-to-br from-[#FFB7C5]/60 via-white/0 to-[#D5F3D8]/80 blur-2xl" />

              <div
                className="relative transition-transform duration-500 ease-out [transform-style:preserve-3d]"
                style={{ transform: 'rotateX(calc(4deg + var(--rx))) rotateY(calc(-9deg + var(--ry)))' }}
              >
                {/* Website preview window */}
                <div className="overflow-hidden rounded-[22px] border border-white bg-white shadow-dv-float">
                  <div className="flex h-11 items-center gap-3 border-b border-dv-line bg-[#FFF6F8] px-4">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF8A80]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FFD27A]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#7FDCA4]" />
                    </div>
                    <div className="mx-auto flex h-6 w-[58%] items-center justify-center gap-1.5 rounded-lg border border-dv-line bg-white text-[10px] text-dv-muted">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      your-community.digiverse.live
                    </div>
                    <Globe className="h-3.5 w-3.5 text-dv-muted" />
                  </div>

                  <div className="relative h-[330px] overflow-hidden bg-gradient-to-br from-[#2B1A1A] to-[#3A2416] sm:h-[400px]">
                    <Img src="/images/festivals/durga-hero.jpg" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F0C]/90 via-[#1A0F0C]/55 to-transparent" />

                    <div className="relative flex items-center justify-between px-5 py-4 sm:px-7">
                      <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#FFD9A8]">Your Organization</span>
                      <div className="hidden gap-4 text-[10px] font-medium text-white/75 sm:flex">
                        <span>About</span>
                        <span>Activities</span>
                        <span>Gallery</span>
                        <span>Contact</span>
                      </div>
                    </div>

                    <div className="relative px-5 pt-10 sm:px-8 sm:pt-14">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#FFE3BF] backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB36B]" /> A new beginning
                      </span>
                      <p className="mt-4 max-w-[300px] font-editorial text-[34px] leading-[1.02] text-white sm:text-[44px]">
                        A digital identity <em className="text-[#FFC48A]">worth remembering.</em>
                      </p>
                      <div className="mt-6 flex gap-2">
                        <span className="rounded-lg bg-white px-3.5 py-2 text-[10px] font-bold text-[#2B1A1A]">Discover More</span>
                        <span className="rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-[10px] font-semibold text-white backdrop-blur">Gallery</span>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-px bg-white/10 backdrop-blur-md">
                      {['Identity', 'Experience', 'Design'].map((k, i) => (
                        <div key={k} className="bg-[#1A0F0C]/60 px-4 py-3 sm:px-6">
                          <p className="text-[8px] uppercase tracking-[0.18em] text-white/50">{k}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-white">{['Your brand', 'Your content', 'Your vision'][i]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating portfolio card */}
                <div
                  className="absolute -bottom-24 -left-4 w-[220px] sm:-left-12 sm:w-[250px]"
                  style={{ transform: 'translate3d(calc(var(--px) * -1), calc(var(--py) * -1), 60px)' }}
                >
                  <div className="animate-dv-float-slow rounded-2xl border border-white bg-white/95 p-3.5 shadow-dv-float backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB7C5] via-[#F2C7C7] to-[#D5F3D8] font-display text-sm font-bold text-dv-ink">
                        AR
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-dv-ink">Your Name</p>
                        <p className="truncate text-[10.5px] text-dv-muted">Product Designer · Portfolio</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <div className="h-12 overflow-hidden rounded-lg bg-[#FFE1E8]">
                        <Img src="/images/festivals/alpona-art.jpg" className="h-full w-full object-cover" />
                      </div>
                      <div className="h-12 overflow-hidden rounded-lg bg-[#F2C7C7]">
                        <Img src="/images/festivals/kumartuli-clay.jpg" className="h-full w-full object-cover" />
                      </div>
                      <div className="h-12 overflow-hidden rounded-lg bg-[#D5F3D8]">
                        <Img src="/images/festivals/classical-recital.jpg" className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-1.5 text-dv-muted">
                        <Github className="h-3.5 w-3.5" />
                        <Linkedin className="h-3.5 w-3.5" />
                        <Dribbble className="h-3.5 w-3.5" />
                      </div>
                      <span className="rounded-md bg-dv-ink px-2 py-1 text-[9px] font-semibold text-white">Hire me</span>
                    </div>
                  </div>
                </div>

                {/* Floating generation chip */}
                <div
                  className="absolute -right-2 -top-7 w-[230px] sm:-right-8"
                  style={{ transform: 'translate3d(var(--px), var(--py), 80px)' }}
                >
                  <div className="animate-dv-float rounded-2xl border border-white bg-white/95 p-3.5 shadow-dv-float backdrop-blur">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D9658A] to-[#F58FA7] text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[12px] font-bold text-dv-ink">Shaping your website</p>
                        <p className="text-[10px] text-dv-muted">Layout · Palette · Content</p>
                      </div>
                    </div>
                    <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-dv-iris-50">
                      <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-dv-iris-500 to-dv-coral animate-dv-progress" />
                    </div>
                  </div>
                </div>

                {/* Floating palette chip */}
                <div
                  className="absolute -right-3 bottom-16 hidden items-center gap-2.5 rounded-2xl border border-white bg-white/95 px-3.5 py-3 shadow-dv-float backdrop-blur sm:flex md:-right-10"
                  style={{ transform: 'translate3d(calc(var(--px) * 0.6), calc(var(--py) * 0.6), 40px)' }}
                >
                  <Palette className="h-4 w-4 text-dv-iris-600" />
                  <div className="flex -space-x-1.5">
                    {['#F2C7C7', '#FFB7C5', '#D5F3D8', '#FFFFFF'].map((c) => (
                      <span key={c} className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-dv-ink-2">Your palette</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capability ribbon */}
        <div className="mt-24 grid animate-dv-rise grid-cols-1 gap-3 [animation-delay:420ms] sm:grid-cols-3">
          {[
            { icon: Layers3, title: 'Multi-page websites', desc: 'Structured pages shaped for your organization' },
            { icon: Palette, title: 'Your visual identity', desc: 'Colours, typography and layout that feel like you' },
            { icon: ShieldCheck, title: 'Review before publishing', desc: 'Preview, give feedback and approve with confidence' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5 rounded-2xl border border-white/80 bg-white/60 p-4 backdrop-blur">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-dv-iris-600 shadow-dv-card">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-dv-ink">{title}</p>
                <p className="mt-0.5 text-[13px] leading-6 text-dv-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Hero;
