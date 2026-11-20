import React from 'react';
import { Container } from '../layout/Container';
import { Reveal } from '../ui/dv/Reveal';
import { PLATFORM_CONFIG } from '../../config/platform';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Globe, Layers3, MoveUpRight } from 'lucide-react';

interface CTASectionProps {
  onOpenDemo: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenDemo }) => {
  return (
    <section className="relative pb-24 pt-4 sm:pb-32">
      <Container>
        <Reveal className="relative isolate overflow-hidden rounded-[32px] bg-dv-ink px-6 py-14 text-center shadow-[0_40px_100px_-40px_rgba(18,18,42,0.6)] sm:rounded-[40px] sm:px-12 sm:py-20 lg:px-20 lg:py-24">
          {/* Prism light field */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-[#FFB7C5]/45 blur-[110px] animate-dv-drift" />
            <div className="absolute -bottom-40 -right-20 h-[440px] w-[440px] rounded-full bg-[#D5F3D8]/35 blur-[120px] animate-dv-drift [animation-delay:-9s]" />
            <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
            <svg className="absolute right-[-60px] top-[-60px] h-72 w-72 opacity-25" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="98" fill="none" stroke="white" strokeOpacity="0.4" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="white" strokeOpacity="0.3" />
              <circle cx="100" cy="100" r="42" fill="none" stroke="white" strokeOpacity="0.2" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB7C5]" />
              Your organization. Your digital identity.
            </span>

            <h2 className="mt-7 font-display text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl lg:text-[64px]">
              Ready to build your
              <span
                className="block pb-1 font-editorial font-normal italic tracking-[-0.01em] text-transparent"
                style={{ backgroundImage: 'linear-gradient(110deg,#FFB7C5,#D5F3D8)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
              >
                digital presence?
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-8 text-white/70 sm:text-base">
              Whether you manage a cultural society, sports club, educational institution, healthcare
              organization or community group, DigiVerse helps you create a professional digital home that
              reflects your identity.
            </p>

            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
              {['Custom Website Design', 'Organization Management', 'Guided Creation', 'Your Brand, Your Identity'].map((f) => (
                <span key={f} className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/75">
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenDemo}
                className="dv-sheen group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-[15px] font-semibold text-dv-ink shadow-[0_18px_40px_-16px_rgba(255,255,255,0.45)] transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
              >
                <Sparkles className="h-4 w-4 text-dv-iris-600" />
                Request a Demo
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <a
                href={`mailto:${PLATFORM_CONFIG.productEmail}?subject=DigiVerse%20Platform%20Inquiry`}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/[0.06] px-7 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/[0.12] sm:w-auto"
              >
                <Mail className="h-4 w-4 text-[#FFB7C5]" />
                Contact Our Team
                <MoveUpRight className="h-4 w-4 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="mt-12 border-t border-white/10 pt-8">
              <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-10">
                {[
                  { icon: ShieldCheck, label: 'Secure Organization Workspaces', c: 'text-emerald-300' },
                  { icon: Globe, label: 'Custom Domain Support', c: 'text-sky-300' },
                  { icon: Layers3, label: 'Flexible Multi-Page Websites', c: 'text-[#FFB7C5]' },
                ].map(({ icon: Icon, label, c }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-white/65">
                    <Icon className={`h-4 w-4 ${c}`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 font-bengali text-sm font-medium tracking-wide text-white/45">
              আপনার সংগঠন, আপনার পরিচয় — এবার ডিজিটাল দুনিয়ায়।
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
};
