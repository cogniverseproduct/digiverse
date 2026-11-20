import React from 'react';
import { Container } from '../layout/Container';
import {
  Sparkles,
  Palette,
  Globe2,
  ShieldCheck,
  MonitorSmartphone,
  Building2,
  HeartPulse,
  Trophy,
  GraduationCap,
  HeartHandshake,
  ArrowUpRight,
  Check,
  Layers3,
  Languages,
  Eye,
  CalendarDays,
  Users,
  Image,
  Bell,
  Youtube,
  HardDrive,
  LayoutDashboard,
  MessageCircle,
  CreditCard,
  Handshake,
} from 'lucide-react';
import { EngineTrack } from './ShowcaseTracks';

const organizationTypes = [
  {
    icon: Building2,
    number: '01',
    title: 'Cultural Organizations',
    description:
      'Celebrate festivals, traditions, galleries, community activities and organizational identity through a rich digital presence.',
    accent: 'text-amber-700',
    iconBg: 'bg-amber-500/[0.11] border-amber-500/[0.24]',
  },
  {
    icon: Trophy,
    number: '02',
    title: 'Sports Clubs & Teams',
    description:
      'Present teams, player profiles, tournaments, fixtures and achievements with a sports-focused experience.',
    accent: 'text-indigo-700',
    iconBg: 'bg-indigo-500/[0.11] border-indigo-500/[0.24]',
  },
  {
    icon: GraduationCap,
    number: '03',
    title: 'Education & Institutions',
    description:
      'Showcase academic programs, campus facilities, institutional activities and important announcements.',
    accent: 'text-violet-700',
    iconBg: 'bg-violet-500/[0.11] border-violet-500/[0.24]',
  },
  {
    icon: HeartPulse,
    number: '04',
    title: 'Healthcare Organizations',
    description:
      'Build a clear digital presence for healthcare services, facilities, specialists and patient information.',
    accent: 'text-rose-700',
    iconBg: 'bg-rose-500/[0.11] border-rose-500/[0.24]',
  },
  {
    icon: HeartHandshake,
    number: '05',
    title: 'Social Welfare Groups',
    description:
      'Communicate social initiatives, community programs, volunteering opportunities and organizational missions.',
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-500/[0.11] border-emerald-500/[0.24]',
  },
];

const coreFeatures = [
  {
    icon: Sparkles,
    number: '01',
    title: 'Guided Website Creation',
    description:
      'Turn organizational requirements, content and brand assets into a structured website experience with a guided creation workflow.',
    tags: ['Requirements', 'Design direction', 'Content structure'],
    accent: 'text-indigo-700',
    glow: 'bg-indigo-500/[0.11]',
    iconBg: 'bg-indigo-500/[0.11] border-indigo-500/[0.24]',
  },
  {
    icon: Palette,
    number: '02',
    title: 'Organization-Specific Design',
    description:
      'Create a distinctive visual identity with layouts, typography, colors and page structures shaped around each organization.',
    tags: ['Custom identity', 'Visual layouts', 'Brand consistency'],
    accent: 'text-violet-700',
    glow: 'bg-violet-500/[0.11]',
    iconBg: 'bg-violet-500/[0.11] border-violet-500/[0.24]',
  },
  {
    icon: LayoutDashboard,
    number: '03',
    title: 'Centralized Management',
    description:
      'Bring website content and organizational information into a centralized management experience for assigned projects.',
    tags: ['Content management', 'Announcements', 'Activities'],
    accent: 'text-amber-700',
    glow: 'bg-amber-500/[0.11]',
    iconBg: 'bg-amber-500/[0.11] border-amber-500/[0.24]',
  },
  {
    icon: MonitorSmartphone,
    number: '04',
    title: 'Responsive Website Experience',
    description:
      'Present organizational information through adaptable layouts designed for desktop, tablet and mobile screens.',
    tags: ['Desktop', 'Tablet', 'Mobile'],
    accent: 'text-emerald-700',
    glow: 'bg-emerald-500/[0.11]',
    iconBg: 'bg-emerald-500/[0.11] border-emerald-500/[0.24]',
  },
];

const managementFeatures = [
  {
    icon: CalendarDays,
    title: 'Events & Schedules',
    description: 'Organize and present upcoming activities, programs and schedules.',
    accent: 'text-amber-700',
  },
  {
    icon: Users,
    title: 'Members & Committees',
    description: 'Structure member information and organizational leadership details.',
    accent: 'text-indigo-700',
  },
  {
    icon: Image,
    title: 'Media & Galleries',
    description: 'Bring images and visual stories together in organized galleries.',
    accent: 'text-violet-700',
  },
  {
    icon: Bell,
    title: 'Announcements',
    description: 'Keep visitors informed with important organizational updates.',
    accent: 'text-rose-700',
  },
  {
    icon: HardDrive,
    title: 'Google Drive Media',
    description: 'Support media and content workflows using Google Drive assets.',
    accent: 'text-emerald-700',
  },
  {
    icon: Youtube,
    title: 'YouTube Integration',
    description: 'Include relevant YouTube videos in the organization’s website experience.',
    accent: 'text-red-700',
  },
  {
    icon: MessageCircle,
    title: 'Community Communication',
    description: 'Support communication workflows and WhatsApp update experiences.',
    accent: 'text-green-700',
  },
  {
    icon: Handshake,
    title: 'Sponsors & Partnerships',
    description: 'Present sponsors, supporters and partnership information.',
    accent: 'text-orange-700',
  },
  {
    icon: CreditCard,
    title: 'Membership Workflows',
    description: 'Support membership and subscription-related organizational workflows.',
    accent: 'text-indigo-700',
  },
];

const platformPrinciples = [
  {
    icon: Languages,
    title: 'Multilingual Experiences',
    description:
      'Present organizational information in English, Bengali and other languages.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected Access',
    description:
      'Designed around controlled access and separation of organization data.',
  },
  {
    icon: Globe2,
    title: 'Digital Presence',
    description:
      'Give every organization a dedicated digital space for its identity and activities.',
  },
];

export const PlatformAdvantages: React.FC = () => {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden border-t border-slate-900/[0.08] bg-[#FFF1F4] py-20 sm:py-24 lg:py-28"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-indigo-500/[0.08] blur-[150px]" />
        <div className="absolute -left-40 top-[35%] h-[480px] w-[480px] rounded-full bg-violet-500/[0.08] blur-[150px]" />
        <div className="absolute bottom-0 right-[25%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <Container className="relative z-10">
        {/* Hero heading */}
        <div className="mx-auto mb-16 max-w-4xl text-center sm:mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/[0.24] bg-indigo-500/[0.077] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Sparkles className="h-4 w-4" />
            The DigiVerse Platform
          </div>

          <h2 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-dv-ink sm:text-5xl lg:text-6xl">
            Everything your
            <span className="block bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              organization needs.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
            From creating a distinctive website to organizing your digital
            presence, DigiVerse brings your organization's identity, content
            and community experience together.
          </p>

          <p className="mt-5 font-bengali text-sm font-medium text-indigo-700/80">
            আপনার সংগঠন, আপনার পরিচয়, এক নতুন ডিজিটাল অভিজ্ঞতা।
          </p>
        </div>

        {/* Main feature cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Featured AI card */}
          <div className="group relative overflow-hidden rounded-[28px] border border-indigo-500/[0.24] bg-gradient-to-br from-[#FFFFFF] via-[#FFFAFB] to-[#FFF1F4] p-6 shadow-2xl shadow-slate-900/[0.06] transition-all duration-500 hover:border-indigo-500/[0.48] sm:p-9 lg:col-span-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/[0.11] blur-[100px]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/[0.24] bg-indigo-500/[0.11] text-indigo-700">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <span className="rounded-full border border-indigo-500/[0.24] bg-indigo-500/[0.088] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Guided Workflow
                  </span>
                </div>

                <h3 className="max-w-xl text-2xl font-bold leading-tight text-dv-ink sm:text-3xl lg:text-4xl">
                  From your requirements to a website that feels like yours.
                </h3>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
                  Shape your digital presence through a guided workflow
                  that brings requirements, design direction and organization
                  content into one structured creation process.
                </p>
              </div>

              {/* Workflow visual */}
              <div className="rounded-2xl border border-slate-900/[0.08] bg-[#EAF8EC]/80 p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-600">
                    Website creation journey
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Creation workflow
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    {
                      number: '01',
                      label: 'Requirements',
                      detail: 'Understand',
                    },
                    {
                      number: '02',
                      label: 'Design & Build',
                      detail: 'Create',
                    },
                    {
                      number: '03',
                      label: 'Review',
                      detail: 'Refine',
                    },
                  ].map((step, index) => (
                    <div key={step.number} className="relative">
                      <div className="h-full rounded-xl border border-slate-900/[0.08] bg-slate-900/[0.022] p-3 sm:p-4">
                        <span className="mb-3 block text-[10px] font-bold text-indigo-700">
                          {step.number}
                        </span>
                        <span className="block text-[11px] font-bold text-dv-ink sm:text-sm">
                          {step.label}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {step.detail}
                        </span>
                      </div>

                      {index < 2 && (
                        <ArrowUpRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-indigo-700 sm:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-900/[0.08] pt-5 text-xs font-semibold text-indigo-700">
                <Check className="h-4 w-4 shrink-0" />
                <span>Designed around your organization's identity</span>
                <ArrowUpRight className="ml-auto h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Brand identity card */}
          <div className="group relative overflow-hidden rounded-[28px] border border-violet-500/[0.24] bg-gradient-to-br from-[#FFFFFF] via-[#FFFAFB] to-[#FFF1F4] p-6 transition-all duration-500 hover:border-violet-500/[0.48] sm:p-8 lg:col-span-5">
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/[0.132] blur-[100px]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/[0.24] bg-violet-500/[0.11] text-violet-700">
                  <Palette className="h-7 w-7" />
                </div>

                <h3 className="text-2xl font-bold leading-tight text-dv-ink sm:text-3xl">
                  Not another generic template.
                  <span className="mt-1 block text-violet-700">
                    Your own identity.
                  </span>
                </h3>

                <p className="mt-5 text-sm leading-7 text-slate-500">
                  Every organization has its own story. Create a visual
                  experience that reflects its character, audience and purpose.
                </p>
              </div>

              {/* Visual design preview */}
              <div className="rounded-2xl border border-slate-900/[0.08] bg-[#FFF1F4]/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Visual identity
                  </span>
                  <Layers3 className="h-4 w-4 text-violet-700" />
                </div>

                <div className="mb-5 grid grid-cols-4 gap-2">
                  <div className="h-12 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600" />
                  <div className="h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <div className="h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600" />
                  <div className="h-12 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600" />
                </div>

                <div className="space-y-3">
                  <div className="h-2 w-4/5 rounded-full bg-slate-900/[0.08]" />
                  <div className="h-2 w-3/5 rounded-full bg-slate-900/[0.055]" />
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-7 w-20 rounded-lg bg-violet-500/[0.2]" />
                    <div className="h-7 w-16 rounded-lg bg-slate-900/[0.033]" />
                  </div>
                </div>

                <p className="mt-5 text-[10px] text-slate-500">
                  Colors · Typography · Layout · Brand direction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core capabilities */}
        <div className="mt-24 sm:mt-28">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                Core capabilities
              </span>
              <h3 className="mt-3 text-2xl font-bold text-dv-ink sm:text-3xl">
                The foundation of your digital presence.
              </h3>
            </div>

            <p className="max-w-md text-sm leading-7 text-slate-500">
              A connected set of capabilities to help organizations present
              their identity and manage their digital experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.number}
                  className="group relative overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-[#FFF1F4] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/[0.14] hover:bg-[#FFFAFB] sm:p-7"
                >
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full ${feature.glow} blur-[80px]`}
                  />

                  <div className="relative z-10">
                    <div className="mb-6 flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feature.iconBg} ${feature.accent}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <span className="text-xs font-bold tracking-widest text-slate-400">
                        {feature.number}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-dv-ink sm:text-xl">
                      {feature.title}
                    </h4>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {feature.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-900/[0.08] bg-slate-900/[0.022] px-3 py-1.5 text-[10px] font-medium text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Management ecosystem */}
        <div className="mt-24 sm:mt-28">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">
              Connected organization experience
            </span>

            <h3 className="mt-3 text-2xl font-bold text-dv-ink sm:text-3xl">
              More than just a website.
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Bring the important parts of your organization's digital
              presence into one connected experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {managementFeatures.map((feature,) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-900/[0.08] bg-slate-900/[0.02] p-5 transition-all duration-300 hover:border-slate-900/[0.14] hover:bg-slate-900/[0.03]"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/[0.028] ${feature.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-dv-ink">
                        {feature.title}
                      </h4>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-700" />
                    </div>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organization categories */}
        <div className="mt-24 border-t border-slate-900/[0.08] pt-16 sm:mt-28 sm:pt-20">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                Built for different communities
              </span>

              <h3 className="mt-3 text-2xl font-bold text-dv-ink sm:text-3xl">
                One platform. Different identities.
              </h3>
            </div>

            <p className="max-w-md text-sm leading-7 text-slate-500">
              Different organizations need different experiences. DigiVerse
              is designed to adapt to the purpose of each community.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {organizationTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.number}
                  className="group rounded-2xl border border-slate-900/[0.08] bg-[#FFF1F4] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/[0.14] hover:bg-[#FFFAFB]"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${item.iconBg} ${item.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="text-[10px] font-bold tracking-widest text-slate-400">
                      {item.number}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-dv-ink">
                    {item.title}
                  </h4>

                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform principles */}
        <div className="mt-24 grid grid-cols-1 gap-4 border-t border-slate-900/[0.08] pt-14 sm:grid-cols-3 sm:pt-16">
          {platformPrinciples.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-900/[0.08] bg-slate-900/[0.02] p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/[0.088] text-indigo-700">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-dv-ink">
                    {item.title}
                  </h4>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing statement */}
        <div className="relative mt-16 overflow-hidden rounded-[28px] border border-indigo-500/[0.18] bg-gradient-to-r from-[#FFFFFF] via-[#FFFAFB] to-[#FFFFFF] px-6 py-10 text-center sm:mt-20 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.11] blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-violet-500/[0.132] blur-[90px]" />

          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-center gap-2 text-indigo-700">
              <Eye className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
                Your organization, digitally reimagined
              </span>
            </div>

            <h3 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-dv-ink sm:text-3xl lg:text-4xl">
              Your community deserves
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                its own digital identity.
              </span>
            </h3>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600">
              Build a digital home that reflects your organization's identity,
              communicates its purpose and brings its community closer.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <Globe2 className="h-4 w-4" />
              Welcome to DigiVerse
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Container>

      <div className="mt-16 space-y-3 sm:mt-24">
        <EngineTrack />
      </div>
    </section>
  );
};