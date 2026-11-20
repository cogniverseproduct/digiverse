export type OrganizationType = 'cultural' | 'sports' | 'community';

export type LayoutPreset = 'split' | 'grid' | 'editorial';

export type ThemeAccent = 'crimson-gold' | 'neon-cyan' | 'forest-emerald' | 'royal-violet';

export interface CommitteeMember {
  name: string;
  role: string;
  department?: string;
  image?: string;
}

export interface ScheduleItem {
  date: string;
  title: string;
  time: string;
  venue: string;
  category: string;
  tag?: string;
}

export interface HighlightMetric {
  value: string;
  label: string;
}

export interface OrganizationData {
  id: string;
  type: OrganizationType;
  name: string;
  tagline: string;
  categoryBadge: string;
  simulatedDomain: string;
  primaryColor: string;
  accentColor: string;
  themeAccentDefault: ThemeAccent;
  bannerImage: string;
  heroHeadline: string;
  heroDescription: string;
  metrics: HighlightMetric[];
  aboutText: string;
  scheduleTitle: string;
  scheduleItems: ScheduleItem[];
  leadershipTitle: string;
  leadership: CommitteeMember[];
  galleryTitle: string;
  galleryImages: { title: string; subtitle: string; iconType: string }[];
}
