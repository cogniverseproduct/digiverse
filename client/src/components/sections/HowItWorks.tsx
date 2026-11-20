import React from 'react';
import { Container } from '../layout/Container';
import {
  FileText,
  Palette,
  SlidersHorizontal,
  Eye,
  Rocket,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Layers3,
} from 'lucide-react';
import { GalleryTrack } from './ShowcaseTracks';

const steps = [
  {
    step: '01',
    title: 'Share Your Vision',
    subtitle: 'আপনার পরিচয়',
    desc: 'Tell us about your organization, its purpose, audience, brand identity and the pages you need.',
    icon: FileText,
    color: 'cyan',
    tag: 'DISCOVER',
  },
  {
    step: '02',
    title: 'Choose Your Direction',
    subtitle: 'ডিজাইনের সূচনা',
    desc: 'Explore website concepts designed around your organization type, from cultural societies to sports clubs.',
    icon: Palette,
    color: 'violet',
    tag: 'DESIGN',
  },
  {
    step: '03',
    title: 'Make It Yours',
    subtitle: 'নিজের মতো সাজান',
    desc: 'Customize layouts, colors, typography, images and content to reflect your organization’s personality.',
    icon: SlidersHorizontal,
    color: 'amber',
    tag: 'CUSTOMIZE',
  },
  {
    step: '04',
    title: 'Review & Approve',
    subtitle: 'পর্যালোচনা',
    desc: 'Review your complete website preview, share feedback and request the changes you need before approval.',
    icon: Eye,
    color: 'emerald',
    tag: 'REVIEW',
  },
  {
    step: '05',
    title: 'Go Live',
    subtitle: 'প্রকাশের মুহূর্ত',
    desc: 'Once approved, your website is published and ready to represent your organization online.',
    icon: Rocket,
    color: 'rose',
    tag: 'LAUNCH',
  },
];

const colorStyles: Record<
  string,
  { text: string; border: string; glow: string; gradient: string; line: string }
> = {
  cyan: {
    text: 'text-indigo-700',
    border: 'border-indigo-500/[0.24]',
    glow: 'bg-indigo-500/[0.11]',
    gradient: 'from-indigo-500 to-violet-600',
    line: 'bg-indigo-300',
  },
  violet: {
    text: 'text-violet-700',
    border: 'border-violet-500/[0.24]',
    glow: 'bg-violet-500/[0.11]',
    gradient: 'from-violet-400 to-purple-500',
    line: 'bg-violet-300',
  },
  amber: {
    text: 'text-amber-700',
    border: 'border-amber-500/[0.24]',
    glow: 'bg-amber-500/[0.11]',
    gradient: 'from-amber-300 to-orange-500',
    line: 'bg-amber-300',
  },
  emerald: {
    text: 'text-emerald-700',
    border: 'border-emerald-500/[0.24]',
    glow: 'bg-emerald-500/[0.11]',
    gradient: 'from-emerald-300 to-teal-500',
    line: 'bg-emerald-300',
  },
  rose: {
    text: 'text-rose-700',
    border: 'border-rose-500/[0.24]',
    glow: 'bg-rose-500/[0.11]',
    gradient: 'from-rose-400 to-pink-500',
    line: 'bg-rose-300',
  },
};

export const HowItWorks: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative isolate min-h-screen overflow-hidden bg-transparent py-20 text-dv-ink sm:py-24 lg:py-28"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-52 top-20 h-[520px] w-[520px] rounded-full bg-indigo-500/[0.08] blur-[150px]" />
        <div className="absolute -right-52 top-[35%] h-[560px] w-[560px] rounded-full bg-violet-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-0 left-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.06] blur-[140px]" />

        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:68px_68px]" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      <Container className="relative z-10">
        {/* Intro */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-500/[0.24] bg-indigo-500/[0.077] px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-700" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 sm:text-xs">
              The DigiVerse Journey
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.045em] text-dv-ink sm:text-5xl lg:text-6xl">
            From your vision
            <br />
            to your{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              digital presence.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
            Creating your organization’s digital identity should feel simple.
            DigiVerse takes you through a guided journey, from your first idea
            to a website that is ready to go live.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-900/[0.08] bg-slate-900/[0.02] px-4 py-2.5 text-xs text-slate-600">
              <Layers3 className="h-4 w-4 text-indigo-700" />
              5 clear stages
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-900/[0.08] bg-slate-900/[0.02] px-4 py-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Review before publishing
            </div>
          </div>
        </div>

        {/* Process heading */}
        <div className="mb-10 mt-20 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
              HOW THE PROCESS WORKS
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-dv-ink sm:text-3xl">
              Your journey, step by step.
            </h2>
          </div>

          <p className="max-w-sm text-xs leading-6 text-slate-500 sm:text-right">
            A structured process with room for your ideas, feedback and
            organization’s unique identity.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute bottom-10 left-[27px] top-10 w-px bg-gradient-to-b from-indigo-500/50 via-violet-400/40 to-rose-400/50 sm:hidden" />

          <div className="hidden lg:absolute lg:left-[10%] lg:right-[10%] lg:top-[39px] lg:block lg:h-px lg:bg-gradient-to-r lg:from-indigo-500/50 lg:via-violet-400/50 lg:to-rose-400/50" />

          <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-4">
            {steps.map((item) => {
              const Icon = item.icon;
              const style = colorStyles[item.color];

              return (
                <article
                  key={item.step}
                  className="group relative flex min-h-[310px] flex-col rounded-2xl border border-slate-900/[0.08] bg-[#FFFAFB]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-slate-900/[0.14] hover:bg-[#FFFFFF] hover:shadow-[0_22px_65px_rgba(15,15,40,0.08)]"
                >
                  {/* Step indicator */}
                  <div className="relative z-10 mb-8 flex items-center justify-between">
                    <div
                      className={`flex h-[58px] w-[58px] items-center justify-center rounded-2xl border ${style.border} ${style.glow} ${style.text} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.7} />
                    </div>

                    <span className="font-mono text-3xl font-bold tracking-tight text-dv-ink/[0.13] transition-colors group-hover:text-dv-ink/30">
                      {item.step}
                    </span>
                  </div>

                  {/* Stage label */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex rounded-md border ${style.border} ${style.glow} px-2.5 py-1 text-[9px] font-bold tracking-[0.16em] ${style.text}`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className={`mb-2 text-xs font-medium ${style.text}`}>
                      {item.subtitle}
                    </p>

                    <h3 className="text-lg font-semibold leading-snug text-dv-ink">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-xs leading-7 text-slate-500">
                      {item.desc}
                    </p>
                  </div>

                  {/* Card footer */}
                  {/* <div className="mt-7 flex items-center justify-between border-t border-slate-900/[0.08] pt-5">
                    <span className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Stage {item.step}
                    </span>

                   // <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${style.glow} ${style.text} transition-transform duration-300 group-hover:translate-x-1`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>  */}
                </article>
              );
            })}
          </div>
        </div>

        {/* Closing panel */}
        <div className="relative mt-16 overflow-hidden rounded-3xl border border-indigo-500/[0.18] bg-gradient-to-br from-[#FFFFFF] via-[#FFFAFB] to-[#FFFAFB] p-7 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/[0.11] blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-32 left-[35%] h-64 w-64 rounded-full bg-violet-500/[0.12] blur-[90px]" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-700" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                  Your identity. Your control.
                </span>
              </div>

              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-dv-ink sm:text-3xl">
                Every organization has a story.{" "}
                <br className="hidden sm:block" />
                <span className="text-indigo-700">
                  Let the world experience yours.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
                Your content, your identity and your vision remain at the
                center of every stage of the DigiVerse experience.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-900/[0.08] bg-slate-900/[0.028] px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/[0.11] text-indigo-700">
                <Rocket className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-dv-ink">
                  Ready when you are
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Your digital journey starts here
                </p>
              </div>

              <ArrowUpRight className="ml-2 h-5 w-5 text-indigo-700" />
            </div>
          </div>
        </div>
      </Container>

      <div className="mt-16 space-y-3 sm:mt-24">
        <GalleryTrack />
      </div>
    </section>
  );
};

export default HowItWorks;