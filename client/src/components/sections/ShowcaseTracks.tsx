import React from 'react';
import {
  ArrowUpRight, Eye, Globe, History, Link2, Smartphone, Video, Wand2, Trophy, Landmark, CalendarDays, HeartHandshake, UserRound, ShieldCheck
} from 'lucide-react';
import { Container } from '../layout/Container';
import { Reveal } from '../ui/dv/Reveal';
import { Eyebrow } from '../ui/dv/Ambient';
import { SlidingRow } from '../workspace/SlidingRow';

/**
 * Home-page showcase: three auto-sliding tracks (different speeds and directions).
 *  1. Representative previews of the five website engines (real project imagery where it exists).
 *  2. Imagery from the project's own festival / sports library.
 *  3. Capabilities that exist in the product today.
 * Pure CSS motion via SlidingRow: pauses on hover/focus, frozen into a scrollable strip under
 * prefers-reduced-motion. Previews are representative, not live client sites.
 */

const Img: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt = '', className }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    draggable={false}
    className={className}
    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
  />
);

const Chrome: React.FC<{ children: React.ReactNode; tint?: string }> = ({ children, tint = 'from-[#FFE7ED] to-[#E3F7E6]' }) => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-[0_14px_34px_-18px_rgba(38,24,43,0.5)] ring-1 ring-black/5">
    <div className={`flex items-center gap-1.5 bg-gradient-to-r ${tint} px-3 py-2`}>
      <span className="h-2 w-2 rounded-full bg-[#FF9AAE]" />
      <span className="h-2 w-2 rounded-full bg-[#FFD9A0]" />
      <span className="h-2 w-2 rounded-full bg-[#8FD9A8]" />
      <span className="ml-2 h-2 w-20 rounded-full bg-white/80" />
    </div>
    {children}
  </div>
);

interface EnginePreview {
  key: string;
  name: string;
  blurb: string;
  icon: React.ElementType;
  chip: string;
  art: React.ReactNode;
}

const ENGINES: EnginePreview[] = [
  {
    key: 'sports',
    name: 'Sports Website Engine',
    blurb: 'Teams, fixtures, tournaments and achievements for clubs and academies.',
    icon: Trophy,
    chip: 'bg-[#D5F3D8] text-[#1F6B43]',
    art: (
      <div className="relative h-36 bg-[#D5F3D8]">
        <Img src="/images/festivals/sports-meet.jpg" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#26182B]/55 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between rounded-lg bg-white/90 px-2.5 py-1.5 backdrop-blur">
          <span className="h-3.5 w-3.5 rounded-full bg-[#3EA86C]" />
          <span className="text-[9px] font-bold tracking-widest text-[#786675]">FIXTURES</span>
          <span className="h-3.5 w-3.5 rounded-full bg-[#E8688A]" />
        </div>
      </div>
    ),
  },
  {
    key: 'cultural',
    name: 'Cultural Website Engine',
    blurb: 'Festivals, heritage, puja committees and cultural societies, with galleries and schedules.',
    icon: Landmark,
    chip: 'bg-[#FFE1E8] text-[#A92E55]',
    art: (
      <div className="relative h-36 bg-[#F2C7C7]">
        <Img src="/images/festivals/durga-hero.jpg" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#26182B]/70 via-[#26182B]/25 to-transparent" />
        <div className="absolute left-3 top-3 space-y-1.5">
          <div className="h-2 w-24 rounded-full bg-white/85" />
          <div className="h-1.5 w-16 rounded-full bg-white/55" />
        </div>
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="h-6 w-6 rounded-md bg-white/80" />)}
        </div>
      </div>
    ),
  },
  {
    key: 'event',
    name: 'Event Website Engine',
    blurb: 'Conferences, summits and celebrations with agendas, speakers and registrations.',
    icon: CalendarDays,
    chip: 'bg-[#FFE1E8] text-[#A92E55]',
    art: (
      <div className="relative h-36 bg-[#FFB7C5]">
        <Img src="/images/festivals/basant-utsav.jpg" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#26182B]/60 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-2.5 space-y-1">
          {[78, 58, 68].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1.5 rounded-full bg-white/85" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'ngo',
    name: 'Social & NGO Engine',
    blurb: 'Missions, initiatives, volunteers and impact for NGOs and welfare groups.',
    icon: HeartHandshake,
    chip: 'bg-[#D5F3D8] text-[#1F6B43]',
    art: (
      <div className="relative h-36 bg-gradient-to-br from-[#D5F3D8] via-white to-[#FFE1E8] p-3">
        <div className="h-2 w-24 rounded-full bg-[#3EA86C]/70" />
        <div className="mt-1.5 h-1.5 w-32 rounded-full bg-[#3EA86C]/35" />
        <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-1.5">
          {['bg-[#D5F3D8]', 'bg-[#FFE1E8]', 'bg-[#F2C7C7]'].map((c, i) => (
            <span key={i} className={`h-12 rounded-lg ${c} ring-1 ring-black/5`} />
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'portfolio',
    name: 'Portfolio Engine',
    blurb: 'Personal portfolios for developers, designers, academics and creators.',
    icon: UserRound,
    chip: 'bg-[#F2C7C7] text-[#86244A]',
    art: (
      <div className="relative h-36 bg-gradient-to-br from-[#FFE1E8] via-white to-[#D5F3D8] p-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FFB7C5] to-[#D5F3D8] ring-2 ring-white" />
          <div className="space-y-1.5">
            <div className="h-2 w-20 rounded-full bg-[#26182B]/70" />
            <div className="h-1.5 w-14 rounded-full bg-[#26182B]/30" />
          </div>
        </div>
        <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-1.5">
          {['alpona-art', 'kumartuli-clay', 'classical-recital'].map((n) => (
            <div key={n} className="h-12 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
              <Img src={`/images/festivals/${n}.jpg`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const GALLERY = [
  ['durga-hero', 'Durga Puja'],
  ['alpona-art', 'Alpona art'],
  ['sports-meet', 'Sports meet'],
  ['classical-recital', 'Classical recital'],
  ['pandal-lights', 'Pandal lights'],
  ['dhunuchi-dance', 'Dhunuchi dance'],
  ['basant-utsav', 'Basant Utsav'],
  ['kumartuli-clay', 'Kumartuli clay'],
  ['saraswati-puja', 'Saraswati Puja'],
  ['lakshmi-puja', 'Lakshmi Puja'],
  ['kali-puja', 'Kali Puja'],
];

const CAPABILITIES = [
  { icon: Smartphone, title: 'Responsive layouts', text: 'Every site adapts to desktop, tablet and phone screens.', tone: 'from-[#FFB7C5] to-[#F58FA7]' },
  { icon: Eye, title: 'Device previews', text: 'Check each screen size before anything goes live.', tone: 'from-[#9BE0B4] to-[#58BE86]' },
  { icon: Link2, title: 'Private review links', text: 'Share a preview so your client can comment and approve.', tone: 'from-[#F2C7C7] to-[#E8688A]' },
  { icon: History, title: 'Version comparison', text: 'Keep design variations, compare them and roll back.', tone: 'from-[#D5F3D8] to-[#7BD3A0]' },
  { icon: Globe, title: 'Own address and SEO', text: 'Each published site gets its own address and search settings.', tone: 'from-[#FFB7C5] to-[#E8688A]' },
  { icon: Video, title: 'Drive and YouTube media', text: 'Link Google Drive folders and YouTube videos or playlists.', tone: 'from-[#9BE0B4] to-[#3EA86C]' },
  { icon: ShieldCheck, title: 'Review before publishing', text: 'Nothing goes live until you have approved it.', tone: 'from-[#F2C7C7] to-[#D6728F]' },
];

const EngineCard: React.FC<{ e: EnginePreview }> = ({ e }) => {
  const Icon = e.icon;
  return (
    <a
      href="/templates"
      className="dv-lift dv-border-glow group mr-5 block w-[272px] shrink-0 rounded-[26px] bg-white/75 p-3.5 shadow-dv-card backdrop-blur-md sm:w-[300px]"
    >
      <div className="transition duration-500 group-hover:scale-[1.025]">
        <Chrome>{e.art}</Chrome>
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-2 px-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.chip}`}>
          <Icon className="h-3.5 w-3.5" />
          {e.name.replace(' Website', '').replace(' Engine', '')}
        </span>
        <ArrowUpRight className="h-4 w-4 text-dv-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-dv-iris-600" />
      </div>
      <h3 className="mt-2 px-1 font-display text-[16px] font-bold tracking-[-0.01em] text-dv-ink">{e.name}</h3>
      <p className="mt-1 line-clamp-2 px-1 text-[12.5px] leading-5 text-dv-muted">{e.blurb}</p>
    </a>
  );
};

export const EngineTrack: React.FC = () => (
  <SlidingRow label="Website engine previews" seconds={70}>
    {ENGINES.map((e) => <EngineCard key={e.key} e={e} />)}
  </SlidingRow>
);

export const GalleryTrack: React.FC = () => (
    <SlidingRow label="Imagery from DigiVerse website templates" seconds={55} reverse>
      {GALLERY.map(([file, label], i) => (
        <figure
          key={file}
          className="mr-5 w-[170px] shrink-0 sm:w-[196px]"
          style={{ transform: `rotate(${i % 2 ? 1.6 : -1.6}deg) translateY(${i % 3 === 0 ? 6 : 0}px)` }}
        >
          <div className="animate-dv-float rounded-2xl bg-white p-2 shadow-[0_16px_36px_-20px_rgba(214,90,126,0.55)] ring-1 ring-[#F2C7C7]/70" style={{ animationDelay: `${-i * 0.9}s` }}>
            <div className="h-[118px] overflow-hidden rounded-xl bg-gradient-to-br from-[#FFE1E8] to-[#D5F3D8] sm:h-[138px]">
              <Img src={`/images/festivals/${file}.jpg`} className="h-full w-full object-cover" />
            </div>
            <figcaption className="px-1 pb-0.5 pt-2 text-[12px] font-semibold text-dv-ink-2">{label}</figcaption>
          </div>
        </figure>
      ))}
    </SlidingRow>
);

export const CapabilityTrack: React.FC = () => (
    <SlidingRow label="What every DigiVerse website includes" seconds={62}>
      {CAPABILITIES.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.title} className="mr-5 w-[250px] shrink-0 rounded-[22px] border border-white/80 bg-white/70 p-4 shadow-dv-card backdrop-blur-md sm:w-[270px]">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${c.tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="mt-3 font-display text-[15px] font-bold tracking-[-0.01em] text-dv-ink">{c.title}</div>
            <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{c.text}</p>
          </div>
        );
      })}
    </SlidingRow>
);

export const ShowcaseTracks: React.FC = () => (
  <section className="dv-wash-pink relative py-16 sm:py-24" aria-labelledby="showcase-heading">
    <Container>
      <Reveal className="mx-auto max-w-3xl text-center">
        <Eyebrow icon={Wand2}>See what DigiVerse builds</Eyebrow>
        <h2 id="showcase-heading" className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-dv-ink sm:text-5xl">
          Five engines, shaped around{' '}
          <span className="font-editorial font-normal italic tracking-[-0.01em] dv-prism-text">your story.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-dv-ink-2">
          A look at the kinds of websites each engine creates. These are representative previews; your own site is
          built from your organization&rsquo;s details.
        </p>
      </Reveal>
    </Container>

    <div className="mt-12 space-y-3">
      <EngineTrack />

      <GalleryTrack />

      <CapabilityTrack />
    </div>
  </section>
);

export default ShowcaseTracks;
