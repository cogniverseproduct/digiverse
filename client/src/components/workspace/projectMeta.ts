import { Trophy, Landmark, CalendarDays, HeartHandshake, UserRound, Shapes } from 'lucide-react';
import type { ClientProject, ProjectStatus } from '../../types/admin';

/** The five generation engines plus a bucket for older generic projects. */
export type EngineKey = 'sports' | 'cultural' | 'event' | 'ngo' | 'portfolio' | 'other';

export const ENGINE_META: Record<EngineKey, {
  label: string;
  short: string;
  description: string;
  icon: React.ElementType;
  /** Tailwind classes for the engine's accent chip. */
  chip: string;
  /** Gradient used for engine art and accents. */
  gradient: string;
}> = {
  sports: {
    label: 'Sports Website Engine',
    short: 'Sports',
    description: 'Clubs, academies and tournaments — squads, fixtures, standings.',
    icon: Trophy,
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600'
  },
  cultural: {
    label: 'Cultural Website Engine',
    short: 'Cultural',
    description: 'Cultural societies and puja committees — festivals, heritage, programmes.',
    icon: Landmark,
    chip: 'bg-amber-50 text-amber-800 ring-amber-200',
    gradient: 'from-amber-400 via-orange-500 to-rose-600'
  },
  event: {
    label: 'Event Website Engine',
    short: 'Event',
    description: 'Conferences, festivals, weddings and launches — schedules and speakers.',
    icon: CalendarDays,
    chip: 'bg-violet-50 text-violet-700 ring-violet-200',
    gradient: 'from-fuchsia-500 via-violet-500 to-indigo-600'
  },
  ngo: {
    label: 'Social & NGO Engine',
    short: 'Social & NGO',
    description: 'Non-profits and community initiatives — programmes, impact, volunteers.',
    icon: HeartHandshake,
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600'
  },
  portfolio: {
    label: 'Portfolio Engine',
    short: 'Portfolio',
    description: 'Personal portfolios for developers, designers, photographers and more.',
    icon: UserRound,
    chip: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200',
    gradient: 'from-dv-iris-400 via-purple-500 to-dv-coral'
  },
  other: {
    label: 'General website',
    short: 'General',
    description: 'Projects created with the generic requirements form.',
    icon: Shapes,
    chip: 'bg-slate-50 text-slate-600 ring-slate-200',
    gradient: 'from-slate-400 via-slate-500 to-slate-700'
  }
};

export function engineForProject(project: ClientProject): EngineKey {
  const category = String(project.requirements.category || project.requirements.organizationType || '');
  if (category === 'sports') return 'sports';
  if (category === 'cultural' || category === 'puja_committee') return 'cultural';
  if (category === 'event') return 'event';
  if (category === 'ngo' || category === 'ngo_social') return 'ngo';
  if (category === 'portfolio') return 'portfolio';
  return 'other';
}

/** Delivery pipeline used on the overview and as project filters. */
export type PipelineStage = 'intake' | 'review' | 'revision' | 'approved' | 'live';

export const PIPELINE: { key: PipelineStage; label: string; description: string; dot: string; bar: string }[] = [
  { key: 'intake', label: 'Intake', description: 'Requirements collected', dot: 'bg-slate-400', bar: 'bg-slate-300' },
  { key: 'review', label: 'Client review', description: 'Preview ready to share', dot: 'bg-dv-iris-500', bar: 'bg-dv-iris-400' },
  { key: 'revision', label: 'In revision', description: 'Changes requested', dot: 'bg-amber-500', bar: 'bg-amber-400' },
  { key: 'approved', label: 'Approved', description: 'Ready to publish', dot: 'bg-sky-500', bar: 'bg-sky-400' },
  { key: 'live', label: 'Live', description: 'Published websites', dot: 'bg-emerald-500', bar: 'bg-emerald-400' }
];

export const STATUS_META: Record<ProjectStatus, { label: string; stage: PipelineStage; tone: string }> = {
  requirements_collected: { label: 'Requirements collected', stage: 'intake', tone: 'bg-slate-50 text-slate-600 ring-slate-200' },
  generating: { label: 'Generating', stage: 'intake', tone: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200' },
  preview_ready: { label: 'Preview ready', stage: 'review', tone: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200' },
  awaiting_approval: { label: 'Awaiting approval', stage: 'review', tone: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200' },
  in_revision: { label: 'In revision', stage: 'revision', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  client_approved: { label: 'Client approved', stage: 'approved', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  approved_for_deployment: { label: 'Ready to publish', stage: 'approved', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  deployed: { label: 'Live', stage: 'live', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  deployment_failed: { label: 'Publish failed', stage: 'approved', tone: 'bg-rose-50 text-rose-700 ring-rose-200' }
};

export function statusMeta(status: ProjectStatus) {
  return STATUS_META[status] || { label: status, stage: 'intake' as PipelineStage, tone: 'bg-slate-50 text-slate-600 ring-slate-200' };
}

export function relativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '';
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
