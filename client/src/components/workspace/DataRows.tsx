import React from 'react';
import { CheckCircle2, ClipboardList, Clock, Eye, Globe, History, KeyRound, ListChecks, Lock, Rocket, ScrollText, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AuditLogItem, PublishedSiteSummary, User } from '../../types/admin';
import { fillTo, SlidingRow } from './SlidingRow';
import { relativeTime } from './projectMeta';

const CARD = 'mr-5 w-[250px] shrink-0 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-dv-card backdrop-blur-md sm:w-[270px]';

const Block: React.FC<{ title: string; subtitle: string; label: string; seconds: number; reverse?: boolean; children: React.ReactNode }> = ({
  title,
  subtitle,
  label,
  seconds,
  reverse,
  children
}) => (
  <section className="space-y-1" aria-label={label}>
    <div className="px-1">
      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-dv-ink">{title}</h3>
      <p className="mt-0.5 text-[13px] text-dv-muted">{subtitle}</p>
    </div>
    <SlidingRow label={label} seconds={seconds} reverse={reverse}>
      {children}
    </SlidingRow>
  </section>
);

function initials(name: string): string {
  return (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}

/* ------------------------------------------------------------------ real-data rows */

/** Admin accounts: the people on the platform. */
export const TeamRow: React.FC<{ users: User[] }> = ({ users }) => {
  const people = users.filter((u) => (u.accountStatus || (u.isActive ? 'ACTIVE' : 'DISABLED')) !== 'REMOVED');
  if (people.length < 2) return null;
  return (
    <Block title="Your team" subtitle="Everyone with access to this platform." label="People with access" seconds={Math.max(40, people.length * 8)}>
      {fillTo(people).map((u, i) => {
        const status = u.accountStatus || (u.isActive ? 'ACTIVE' : 'DISABLED');
        return (
          <div key={`${u.id}-${i}`} className={CARD}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl dv-prism-fill font-display text-[13px] font-bold text-white">{initials(u.name)}</span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-dv-ink">{u.name}</div>
                <div className="text-[12px] text-dv-muted">{u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-semibold ring-1',
                  status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-50 text-slate-600 ring-slate-200'
                )}
              >
                {status === 'ACTIVE' ? 'Active' : 'Disabled'}
              </span>
              <span className="inline-flex items-center gap-1 text-dv-muted">
                <Clock className="h-3 w-3" />
                {u.lastLoginAt ? relativeTime(u.lastLoginAt) : 'Not signed in yet'}
              </span>
            </div>
          </div>
        );
      })}
    </Block>
  );
};

/** Audit trail: the latest recorded actions. */
export const RecentAuditRow: React.FC<{ logs: AuditLogItem[] }> = ({ logs }) => {
  const latest = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  if (latest.length < 3) return null;
  return (
    <Block title="Latest activity" subtitle="The most recent recorded actions." label="Latest audit activity" seconds={Math.max(40, latest.length * 7)} reverse>
      {fillTo(latest).map((log, i) => (
        <div key={`${log.id}-${i}`} className={CARD}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-dv-iris-50 text-dv-iris-600">
            <ScrollText className="h-4 w-4" />
          </span>
          <div className="mt-2.5 truncate text-[14px] font-semibold text-dv-ink">{log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</div>
          <div className="mt-0.5 truncate text-[12px] text-dv-muted">{log.userEmail}</div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-dv-muted">
            <span className="truncate">{log.resourceType}</span>
            <span>{relativeTime(log.createdAt)}</span>
          </div>
        </div>
      ))}
    </Block>
  );
};

/** Published websites: live sites, or the publishing basics when there are few. */
export const PublishedSitesRow: React.FC<{ sites: PublishedSiteSummary[] }> = ({ sites }) => {
  if (sites.length >= 3) {
    return (
      <Block title="Your websites" subtitle="Everything published from this workspace." label="Published websites" seconds={Math.max(40, sites.length * 8)}>
        {fillTo(sites).map((site, i) => (
          <div key={`${site.projectId}-${i}`} className={CARD}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <Globe className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-dv-ink">{site.organizationName}</div>
                <div className="truncate font-mono text-[11px] text-dv-muted">/live/{site.slug}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span className={cn('rounded-full px-2 py-0.5 font-semibold ring-1', site.status === 'live' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200')}>
                {site.status === 'live' ? 'Live' : 'Suspended'}
              </span>
              <span className="text-dv-muted">Updated {relativeTime(site.updatedAt)}</span>
            </div>
          </div>
        ))}
      </Block>
    );
  }
  return (
    <Block title="How publishing works" subtitle="What happens when you publish a site." label="Publishing basics" seconds={50}>
      {[
        { icon: Eye, title: 'Preview first', text: 'Check the site on desktop, tablet and phone.', tone: 'from-sky-500 to-cyan-500' },
        { icon: Rocket, title: 'Publish', text: 'The site goes live at its own address.', tone: 'from-violet-500 to-indigo-500' },
        { icon: Globe, title: 'SEO settings', text: 'Set the page title and description per site.', tone: 'from-emerald-500 to-teal-500' },
        { icon: History, title: 'Update any time', text: 'Republish to push a new version live.', tone: 'from-amber-500 to-orange-500' },
        { icon: XCircle, title: 'Unpublish', text: 'Take a site offline without deleting it.', tone: 'from-rose-500 to-pink-500' }
      ].map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.title} className={CARD}>
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', s.tone)}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="mt-3 font-display text-[15px] font-bold text-dv-ink">{s.title}</div>
            <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{s.text}</p>
          </div>
        );
      })}
    </Block>
  );
};

/* ------------------------------------------------------------------ explanatory rows */

const ACCESS_STEPS = [
  { icon: ClipboardList, title: 'Someone asks', text: 'A person requests Admin access with a short reason.' },
  { icon: Eye, title: 'You review', text: 'Read the request before deciding anything.' },
  { icon: UserCheck, title: 'Approve', text: 'Approving lets them set their own password.' },
  { icon: XCircle, title: 'Or decline', text: 'Rejecting closes the request with no access given.' },
  { icon: ScrollText, title: 'It is recorded', text: 'Each decision is saved in the audit trail.' }
];
const RESET_STEPS = [
  { icon: KeyRound, title: 'Admin asks', text: 'An Admin who forgot their password requests a reset.' },
  { icon: Eye, title: 'You review', text: 'Check the request is genuine.' },
  { icon: CheckCircle2, title: 'Approve', text: 'Approving lets them choose a new password.' },
  { icon: XCircle, title: 'Or decline', text: 'Rejecting keeps their current password.' },
  { icon: ScrollText, title: 'It is recorded', text: 'Each decision is saved in the audit trail.' }
];

export const InboxProcessRow: React.FC<{ kind: 'access' | 'reset' }> = ({ kind }) => {
  const steps = kind === 'access' ? ACCESS_STEPS : RESET_STEPS;
  return (
    <Block
      title={kind === 'access' ? 'How access requests work' : 'How password resets work'}
      subtitle="Every request waits for your decision."
      label={kind === 'access' ? 'How access requests work' : 'How password resets work'}
      seconds={46}
      reverse
    >
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.title} className={CARD}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-3xl font-bold text-dv-ink/10">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="mt-3 font-display text-[15px] font-bold text-dv-ink">{s.title}</div>
            <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{s.text}</p>
          </div>
        );
      })}
    </Block>
  );
};

/** Profile and security: habits that keep the account safe. */
export const AccountSafetyRow: React.FC = () => (
  <Block title="Keeping your account safe" subtitle="Simple habits that protect the platform." label="Account safety tips" seconds={46}>
    {[
      { icon: Lock, title: 'Use a long password', text: 'At least 12 characters. A phrase you can remember works well.', tone: 'from-violet-500 to-indigo-500' },
      { icon: KeyRound, title: 'Do not reuse it', text: 'Use a password you have not used on any other site.', tone: 'from-fuchsia-500 to-rose-500' },
      { icon: ListChecks, title: 'Sign out on shared computers', text: 'Always sign out when you are done on a computer that is not yours.', tone: 'from-sky-500 to-cyan-500' },
      { icon: ScrollText, title: 'Actions are recorded', text: 'Sensitive actions go into the audit trail with your name.', tone: 'from-amber-500 to-orange-500' },
      { icon: ShieldCheck, title: 'Access can be revoked', text: 'The Super Admin can sign an account out instantly.', tone: 'from-emerald-500 to-teal-500' }
    ].map((s) => {
      const Icon = s.icon;
      return (
        <div key={s.title} className={CARD}>
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', s.tone)}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="mt-3 font-display text-[15px] font-bold text-dv-ink">{s.title}</div>
          <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{s.text}</p>
        </div>
      );
    })}
  </Block>
);
