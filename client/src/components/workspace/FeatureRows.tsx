import React from 'react';
import { ArrowLeftRight, Eye, Globe, History, KeyRound, Link2, LogOut, ScrollText, ShieldCheck, Smartphone, UserCheck, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SlidingRow } from './SlidingRow';

interface FeatureCard {
  icon: React.ElementType;
  title: string;
  text: string;
  tone: string;
}

const Card: React.FC<{ item: FeatureCard }> = ({ item }) => {
  const Icon = item.icon;
  return (
    <div className="mr-5 w-[250px] shrink-0 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-dv-card backdrop-blur-md sm:w-[270px]">
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', item.tone)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="mt-3 font-display text-[15px] font-bold tracking-[-0.01em] text-dv-ink">{item.title}</div>
      <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{item.text}</p>
    </div>
  );
};

const Section: React.FC<{ title: string; subtitle: string; label: string; seconds: number; reverse?: boolean; items: FeatureCard[] }> = ({
  title,
  subtitle,
  label,
  seconds,
  reverse,
  items
}) => (
  <section className="space-y-1" aria-label={label}>
    <div className="px-1">
      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-dv-ink">{title}</h3>
      <p className="mt-0.5 text-[13px] text-dv-muted">{subtitle}</p>
    </div>
    <SlidingRow label={label} seconds={seconds} reverse={reverse}>
      {items.map((item) => (
        <Card key={item.title} item={item} />
      ))}
    </SlidingRow>
  </section>
);

const INCLUDED: FeatureCard[] = [
  { icon: Smartphone, title: 'Responsive layout', text: 'Each site adapts to desktop, tablet and phone screens.', tone: 'from-violet-500 to-indigo-500' },
  { icon: Eye, title: 'Device previews', text: 'Check desktop, tablet and mobile before anything goes live.', tone: 'from-sky-500 to-cyan-500' },
  { icon: Link2, title: 'Private preview links', text: 'Share a read-only link so the client can comment and approve.', tone: 'from-fuchsia-500 to-rose-500' },
  { icon: History, title: 'Versions you can compare', text: 'Keep design variations, compare them and roll back.', tone: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Own address and SEO', text: 'Every site gets its own address, title and description.', tone: 'from-emerald-500 to-teal-500' },
  { icon: Video, title: 'Drive and YouTube media', text: 'Link Google Drive folders and YouTube videos or playlists.', tone: 'from-rose-500 to-pink-500' }
];

const SAFEGUARDS: FeatureCard[] = [
  { icon: KeyRound, title: 'One-time setup key', text: 'First-run Super Admin setup is refused once an owner exists.', tone: 'from-violet-500 to-indigo-500' },
  { icon: LogOut, title: 'Instant sign-out', text: 'Revoke any Admin’s sessions immediately, without waiting for expiry.', tone: 'from-rose-500 to-orange-500' },
  { icon: ScrollText, title: 'Audit trail', text: 'Sensitive actions are recorded with who did them and when.', tone: 'from-sky-500 to-cyan-500' },
  { icon: UserCheck, title: 'Reviewed access', text: 'New Admin access requests wait for your approval.', tone: 'from-emerald-500 to-teal-500' },
  { icon: ArrowLeftRight, title: 'Confirmed ownership transfer', text: 'Handing over the platform needs the new owner to accept.', tone: 'from-amber-500 to-orange-500' },
  { icon: ShieldCheck, title: 'Password reset review', text: 'Admin password resets come to you before they take effect.', tone: 'from-fuchsia-500 to-purple-500' }
];

export const IncludedFeaturesRow: React.FC = () => (
  <Section
    title="Included with every website"
    subtitle="Whichever engine you pick, these come built in."
    label="Features included with every website"
    seconds={50}
    reverse
    items={INCLUDED}
  />
);

export const SafeguardsRow: React.FC = () => (
  <Section
    title="How the platform protects itself"
    subtitle="Controls that are already active."
    label="Platform safeguards"
    seconds={52}
    items={SAFEGUARDS}
  />
);
