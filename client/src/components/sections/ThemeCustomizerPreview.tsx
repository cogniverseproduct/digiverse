import React from 'react';
import { Container } from '../layout/Container';
import {
  Palette,
  ArrowUpRight,
  Building2,
  Trophy,
  GraduationCap,
  HeartPulse,
  HeartHandshake,
  BriefcaseBusiness,
  CalendarDays,
  Sparkles,
  Users,
  BookOpen,
  Stethoscope,
  HandHeart,
  Target,
  Globe2,
  Menu,
  ChevronRight,
  Star,
  Lightbulb,
} from 'lucide-react';

type Template = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  accentText: string;
  border: string;
  background: string;
  heading: string;
  eyebrow: string;
  sections: string[];
  visual: 'cultural' | 'sports' | 'education' | 'healthcare' | 'social' | 'association' | 'event' | 'club' | 'business';
};

// @dv-keep-start — template mockups represent generated websites; keep their own colours
const TEMPLATES: Template[] = [
  {
    id: 'cultural',
    name: 'Cultural Society',
    subtitle: 'Festivals • Heritage • Community',
    description:
      'A vibrant digital identity for cultural societies, Durga Puja committees and community festivals.',
    icon: Building2,
    accent: 'from-amber-400 to-orange-600',
    accentText: 'text-amber-300',
    border: 'border-amber-400/30',
    background: 'from-[#492319] via-[#301B20] to-[#111827]',
    eyebrow: 'CELEBRATING OUR HERITAGE',
    heading: 'Culture Connects Us All.',
    sections: ['Our Story', 'Festivals', 'Gallery'],
    visual: 'cultural',
  },
  {
    id: 'sports',
    name: 'Sports Club',
    subtitle: 'Teams • Matches • Tournaments',
    description:
      'A dynamic sports website with team profiles, match fixtures, tournaments and achievements.',
    icon: Trophy,
    accent: 'from-cyan-400 to-blue-600',
    accentText: 'text-cyan-300',
    border: 'border-cyan-400/30',
    background: 'from-[#082D48] via-[#102A43] to-[#101827]',
    eyebrow: 'BUILT FOR THE GAME',
    heading: 'Stronger Together. Better Every Game.',
    sections: ['Our Teams', 'Fixtures', 'Achievements'],
    visual: 'sports',
  },
  {
    id: 'education',
    name: 'Education',
    subtitle: 'Learning • Campus • Programs',
    description:
      'A structured academic website for schools, colleges, institutes and educational communities.',
    icon: GraduationCap,
    accent: 'from-blue-400 to-indigo-600',
    accentText: 'text-blue-300',
    border: 'border-blue-400/30',
    background: 'from-[#142B52] via-[#172746] to-[#101827]',
    eyebrow: 'LEARN WITHOUT LIMITS',
    heading: 'Discover. Learn. Achieve.',
    sections: ['Academics', 'Departments', 'Campus'],
    visual: 'education',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    subtitle: 'Doctors • Services • Patient Care',
    description:
      'A reassuring digital presence for clinics, healthcare providers and medical organizations.',
    icon: HeartPulse,
    accent: 'from-teal-400 to-emerald-600',
    accentText: 'text-teal-300',
    border: 'border-teal-400/30',
    background: 'from-[#0A393A] via-[#123A3B] to-[#101827]',
    eyebrow: 'CARE THAT MATTERS',
    heading: 'Your Health. Our Priority.',
    sections: ['Services', 'Care Team', 'Appointments'],
    visual: 'healthcare',
  },
  {
    id: 'social',
    name: 'Social Welfare',
    subtitle: 'Initiatives • Volunteers • Impact',
    description:
      'A people-first website for NGOs, social welfare groups and community initiatives.',
    icon: HeartHandshake,
    accent: 'from-emerald-400 to-green-600',
    accentText: 'text-emerald-300',
    border: 'border-emerald-400/30',
    background: 'from-[#123C2D] via-[#173B30] to-[#101827]',
    eyebrow: 'TOGETHER WE CAN',
    heading: 'Small Actions. Meaningful Change.',
    sections: ['Our Mission', 'Initiatives', 'Volunteer'],
    visual: 'social',
  },
  {
    id: 'association',
    name: 'Professional Association',
    subtitle: 'Members • Networking • Events',
    description:
      'A professional website for associations, member networks and industry organizations.',
    icon: BriefcaseBusiness,
    accent: 'from-violet-400 to-purple-700',
    accentText: 'text-violet-300',
    border: 'border-violet-400/30',
    background: 'from-[#281B48] via-[#24203D] to-[#101827]',
    eyebrow: 'CONNECT. COLLABORATE. GROW.',
    heading: 'Building Connections That Matter.',
    sections: ['About Us', 'Membership', 'Resources'],
    visual: 'association',
  },
  {
    id: 'event',
    name: 'Event Management',
    subtitle: 'Events • Tickets • Schedule',
    description:
      'A dedicated online presence for event organizers, ticketing information and event schedules.',
    icon: CalendarDays,
    accent: 'from-rose-400 to-pink-600',
    accentText: 'text-rose-300',
    border: 'border-rose-400/30',
    background: 'from-[#471B36] via-[#321C36] to-[#171827]',
    eyebrow: 'MAKE MOMENTS MATTER',
    heading: 'Make Every Event Memorable.',
    sections: ['Upcoming Events', 'Schedule', 'Event Info'],
    visual: 'event',
  },
  {
    id: 'club',
    name: 'Youth & E-Club',
    subtitle: 'Youth • Activities • Community',
    description:
      'A modern platform for youth clubs, student communities and activity groups.',
    icon: Sparkles,
    accent: 'from-orange-400 to-red-500',
    accentText: 'text-orange-300',
    border: 'border-orange-400/30',
    background: 'from-[#482718] via-[#34202B] to-[#171827]',
    eyebrow: 'THINK BIG. START NOW.',
    heading: 'Ideas Into Action.',
    sections: ['Our Community', 'Activities', 'Join Us'],
    visual: 'club',
  },
  {
    id: 'business',
    name: 'Business Organization',
    subtitle: 'Business • Services • Growth',
    description:
      'A professional digital identity for business organizations and service providers.',
    icon: BriefcaseBusiness,
    accent: 'from-sky-400 to-indigo-600',
    accentText: 'text-sky-300',
    border: 'border-sky-400/30',
    background: 'from-[#142B49] via-[#172641] to-[#101827]',
    eyebrow: 'A BETTER WAY FORWARD',
    heading: 'Built Around Your Vision.',
    sections: ['Our Services', 'Solutions', 'Contact'],
    visual: 'business',
  },
];

const VisualContent: React.FC<{ template: Template }> = ({ template }) => {
  switch (template.visual) {
    case 'cultural':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 overflow-hidden rounded-lg bg-gradient-to-br from-amber-500/40 via-orange-900/40 to-rose-950/60 p-3">
            <div className="flex h-full flex-col justify-end">
              <span className="text-[8px] font-bold uppercase tracking-widest text-amber-200">
                FESTIVAL MOMENTS
              </span>
              <div className="mt-2 h-1 w-14 rounded bg-amber-300/70" />
              <div className="mt-2 h-1 w-10 rounded bg-white/30" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-gradient-to-br from-rose-400/30 to-red-950/70 p-2">
              <span className="text-[8px] text-white/80">Heritage</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-950/70 p-2">
              <span className="text-[8px] text-white/80">Community</span>
            </div>
          </div>
        </div>
      );

    case 'sports':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-cyan-500/30 via-blue-900/50 to-slate-950 p-3">
            <Trophy className="h-7 w-7 text-cyan-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-cyan-200">TEAM SPIRIT</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 flex-col justify-end rounded-lg bg-blue-500/20 p-2">
              <Target className="h-4 w-4 text-cyan-200" />
              <span className="mt-1 text-[8px] text-white/80">Matches</span>
            </div>
            <div className="flex flex-1 flex-col justify-end rounded-lg bg-indigo-500/20 p-2">
              <Star className="h-4 w-4 text-blue-200" />
              <span className="mt-1 text-[8px] text-white/80">Achievements</span>
            </div>
          </div>
        </div>
      );

    case 'education':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-blue-400/30 via-indigo-900/50 to-slate-950 p-3">
            <BookOpen className="h-7 w-7 text-blue-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-blue-200">CAMPUS LIFE</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-indigo-400/20 p-2">
              <span className="text-[8px] text-white/80">Academics</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-blue-400/20 p-2">
              <span className="text-[8px] text-white/80">Programs</span>
            </div>
          </div>
        </div>
      );

    case 'healthcare':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-teal-400/30 via-emerald-900/50 to-slate-950 p-3">
            <Stethoscope className="h-7 w-7 text-teal-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-teal-200">PATIENT CARE</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-teal-400/20 p-2">
              <span className="text-[8px] text-white/80">Services</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-emerald-400/20 p-2">
              <span className="text-[8px] text-white/80">Care team</span>
            </div>
          </div>
        </div>
      );

    case 'social':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-emerald-400/30 via-green-900/50 to-slate-950 p-3">
            <HandHeart className="h-7 w-7 text-emerald-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-emerald-200">COMMUNITY FIRST</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-green-400/20 p-2">
              <span className="text-[8px] text-white/80">Initiatives</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-emerald-400/20 p-2">
              <span className="text-[8px] text-white/80">Volunteers</span>
            </div>
          </div>
        </div>
      );

    case 'association':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-violet-400/30 via-purple-900/50 to-slate-950 p-3">
            <Users className="h-7 w-7 text-violet-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-violet-200">MEMBER NETWORK</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-violet-400/20 p-2">
              <span className="text-[8px] text-white/80">Members</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-purple-400/20 p-2">
              <span className="text-[8px] text-white/80">Networking</span>
            </div>
          </div>
        </div>
      );

    case 'event':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-rose-400/30 via-pink-900/50 to-slate-950 p-3">
            <CalendarDays className="h-7 w-7 text-rose-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-rose-200">UPCOMING MOMENTS</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-rose-400/20 p-2">
              <span className="text-[8px] text-white/80">Schedule</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-pink-400/20 p-2">
              <span className="text-[8px] text-white/80">Events</span>
            </div>
          </div>
        </div>
      );

    case 'club':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-orange-400/30 via-red-900/50 to-slate-950 p-3">
            <Lightbulb className="h-7 w-7 text-orange-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-orange-200">CREATE TOGETHER</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-orange-400/20 p-2">
              <span className="text-[8px] text-white/80">Activities</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-red-400/20 p-2">
              <span className="text-[8px] text-white/80">Community</span>
            </div>
          </div>
        </div>
      );

    case 'business':
      return (
        <div className="grid h-full grid-cols-5 gap-1.5">
          <div className="col-span-3 flex flex-col justify-between rounded-lg bg-gradient-to-br from-sky-400/30 via-blue-900/50 to-slate-950 p-3">
            <BriefcaseBusiness className="h-7 w-7 text-sky-200" />
            <div>
              <div className="text-[8px] font-bold tracking-widest text-sky-200">BUSINESS SOLUTIONS</div>
              <div className="mt-2 h-1 w-16 rounded bg-white/50" />
              <div className="mt-2 h-1 w-10 rounded bg-white/20" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex flex-1 items-end rounded-lg bg-sky-400/20 p-2">
              <span className="text-[8px] text-white/80">Services</span>
            </div>
            <div className="flex flex-1 items-end rounded-lg bg-indigo-400/20 p-2">
              <span className="text-[8px] text-white/80">Solutions</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

const MiniWebsite: React.FC<{ template: Template }> = ({ template }) => {
  const Icon = template.icon;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1220]">
      {/* Browser bar */}
      <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-[#111A29] px-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>

        <div className="mx-auto flex h-5 w-[55%] items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04]">
          <span className="text-[8px] text-slate-500">your-organization.com</span>
        </div>
      </div>

      {/* Website preview */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${template.background} p-4 sm:p-5`}>
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${template.accent}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              <span className="text-[9px] font-bold tracking-wider text-white">
                YOUR ORGANIZATION
              </span>
            </div>

            <Menu className="h-4 w-4 text-white/70" />
          </div>

          <div className="mt-5">
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/60">
              {template.eyebrow}
            </span>

            <h4 className="mt-2 max-w-[260px] text-xl font-black leading-tight text-white sm:text-2xl">
              {template.heading}
            </h4>

            <div className="mt-4 flex gap-2">
              <span className={`rounded-md bg-gradient-to-r ${template.accent} px-3 py-1.5 text-[8px] font-bold text-white`}>
                Explore
              </span>
              <span className="rounded-md border border-white/40 px-3 py-1.5 text-[8px] font-medium text-white">
                About Us
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-2.5">
            <VisualContent template={template} />
          </div>
        </div>
      </div>

      {/* Preview content sections */}
      <div className="border-t border-white/10 bg-[#0E1725] p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold text-white">
            {template.sections[0]}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            Explore <ChevronRight className="h-3 w-3" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {template.sections.map((section) => (
            <div
              key={section}
              className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2"
            >
              <div className={`mb-2 h-1 w-5 rounded bg-gradient-to-r ${template.accent}`} />
              <div className="text-[8px] leading-tight text-white/70">
                {section}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// @dv-keep-end

export const ThemeCustomizerPreview: React.FC = () => {
  return (
    <section className="relative isolate overflow-hidden bg-[#F3F5FA] py-20 sm:py-24 lg:py-28">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-500/[0.09] blur-[130px]" />
        <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-indigo-500/[0.08] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <Container className="relative z-10">
        {/* Page heading */}
        <div className="mx-auto mb-16 max-w-4xl space-y-5 text-center sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/[0.24] bg-violet-500/[0.077] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 sm:text-xs">
            <Palette className="h-4 w-4" />
            DigiVerse Design Collection
          </div>

          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-dv-ink sm:text-5xl lg:text-6xl">
            A design that reflects
            <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-600 bg-clip-text text-transparent">
              who you are.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
            Explore distinct website design concepts created around the
            identity, purpose and audience of different organizations.
          </p>

          <p className="font-bengali text-sm font-medium text-indigo-700/80">
            প্রতিটি প্রতিষ্ঠানের জন্য আলাদা পরিচয়, আলাদা ডিজাইন।
          </p>
        </div>

        {/* Collection heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">
              Explore the collection
            </span>

            <h3 className="mt-2 text-2xl font-bold text-dv-ink sm:text-3xl">
              Website Templates
            </h3>

            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm">
              Select a category to explore its visual direction and website
              structure.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-slate-900/[0.08] bg-slate-900/[0.022] px-4 py-2 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-indigo-300" />
            <span className="text-xs font-semibold text-slate-600">
              {TEMPLATES.length} Design Concepts
            </span>
          </div>
        </div>

        {/* Template gallery */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template, index) => {
            const Icon = template.icon;

            return (
              <article
                key={template.id}
                className={`group overflow-hidden rounded-[22px] border border-slate-900/[0.08] bg-[#F9FAFD] p-3 transition-all duration-500 hover:-translate-y-1.5 hover:border-slate-900/[0.14] hover:shadow-2xl hover:shadow-slate-900/[0.09] ${template.border}`}
              >
                <MiniWebsite template={template} />

                <div className="px-2 pb-2 pt-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${template.accent} shadow-lg`}>
                      <Icon className="h-5 w-5 text-dv-ink" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-dv-ink sm:text-base">
                          {template.name}
                        </h4>
                        <ArrowUpRight className={`h-4 w-4 shrink-0 ${template.accentText} transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1`} />
                      </div>

                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                        {template.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 min-h-[60px] text-xs leading-6 text-slate-500">
                    {template.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-900/[0.08] pt-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Palette className="h-3.5 w-3.5" />
                      Category-specific design
                    </div>

                    <span className={`flex items-center gap-1 text-[10px] font-bold ${template.accentText}`}>
                      {String(index + 1).padStart(2, '0')}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Closing message */}
        <div className="relative mt-16 overflow-hidden rounded-[28px] border border-violet-500/[0.18] bg-gradient-to-r from-[#FEFEFF] via-[#FFFFFF] to-[#FFFFFF] px-6 py-9 text-center sm:mt-20 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/[0.11] blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/[0.11] blur-[100px]" />

          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-center gap-2 text-indigo-700">
              <Globe2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Your vision, your digital identity
              </span>
            </div>

            <h3 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-dv-ink sm:text-3xl">
              Every organization deserves
              <span className="block bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                a website of its own.
              </span>
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Discover a design direction that communicates your purpose and
              gives your community a distinctive online presence.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ThemeCustomizerPreview;