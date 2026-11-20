import React from 'react';
import {
  ArrowRight, Inbox, KeyRound, Users, FolderKanban, ShieldCheck, Activity, UserPlus, CheckCircle2, IndianRupee
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type {
  AdminAccessRequest, AdminPasswordReset, AuditLogItem, PlatformCommercialOverview, PlatformStats, User
} from '../../types/admin';
import { Button } from '../ui/dv/Button';
import { greeting, relativeTime } from './projectMeta';
import { SafeguardsRow } from './FeatureRows';

type Tab = 'overview' | 'admins' | 'access-requests' | 'password-resets' | 'sites' | 'audit';

interface SuperAdminOverviewProps {
  ownerName: string;
  stats: PlatformStats | null;
  users: User[];
  accessRequests: AdminAccessRequest[];
  passwordResets: AdminPasswordReset[];
  auditLogs: AuditLogItem[];
  commercial: PlatformCommercialOverview | null;
  loading: boolean;
  onNavigate: (tab: Tab) => void;
  onInvite: () => void;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ElementType;
  tone: string;
  onClick?: () => void;
  attention?: boolean;
}> = ({ label, value, hint, icon: Icon, tone, onClick, attention }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'relative overflow-hidden rounded-[22px] border bg-white p-5 text-left shadow-dv-card',
        attention ? 'border-dv-coral/40' : 'border-dv-line',
        onClick && 'dv-lift'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-semibold text-dv-ink-2">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-display text-[32px] font-bold leading-none tracking-tight text-dv-ink">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-dv-muted">
        {attention && <span className="h-1.5 w-1.5 rounded-full bg-dv-coral" />}
        {hint}
      </div>
    </Tag>
  );
};

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  ownerName,
  stats,
  users,
  accessRequests,
  passwordResets,
  auditLogs,
  commercial,
  loading,
  onNavigate,
  onInvite
}) => {
  const pendingAccess = accessRequests.filter((r) => r.status === 'PENDING');
  const pendingResets = passwordResets.filter((r) => r.status === 'PENDING');
  const decisions = [
    ...pendingAccess.map((r) => ({ id: r.id, kind: 'access' as const, title: r.name, detail: r.email, at: r.createdAt })),
    ...pendingResets.map((r) => ({ id: r.id, kind: 'reset' as const, title: `@${r.adminUsername}`, detail: r.adminEmail, at: r.createdAt }))
  ].sort((a, b) => b.at.localeCompare(a.at));

  const admins = users.filter((u) => u.role === 'ADMIN');
  const activeAdmins = admins.filter((u) => u.accountStatus === 'ACTIVE' || (u.isActive && !u.accountStatus));
  const firstName = ownerName.split(/\s+/)[0] || ownerName;
  const recentEvents = auditLogs.slice(0, 7);

  const collected = commercial?.totalRevenueCollected ?? 0;
  const quoted = commercial?.totalQuotedPipeline ?? 0;
  const collectedShare = quoted > 0 ? Math.min(100, (collected / quoted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <section className="relative overflow-hidden rounded-[28px] border border-dv-line bg-dv-ink p-7 text-white shadow-dv-float sm:p-9">
        <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-dv-iris-500/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-dv-coral/30 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.07] dv-grid-lines" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">{greeting()}, {firstName}</p>
            <h2 className="mt-3 max-w-xl font-display text-[30px] font-bold leading-tight tracking-[-0.03em] sm:text-[36px]">
              {decisions.length > 0
                ? <>You have <span className="text-[#FFB59E]">{decisions.length} decision{decisions.length === 1 ? '' : 's'}</span> waiting.</>
                : <>Everything is <span className="text-[#9FE8DD]">running smoothly</span>.</>}
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-white/70">
              {activeAdmins.length} active Admin{activeAdmins.length === 1 ? '' : 's'} operating {stats?.totalProjects ?? 0} client project{(stats?.totalProjects ?? 0) === 1 ? '' : 's'}.
              You govern access, security and the platform; Admins handle client delivery.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button size="lg" onClick={onInvite} className="bg-none bg-white text-dv-ink shadow-none hover:bg-white">
              <UserPlus className="h-4 w-4" />
              Invite an Admin
            </Button>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              <Activity className="h-4 w-4" />
              Audit trail
            </button>
          </div>
        </div>
      </section>

      <SafeguardsRow />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Active Admins"
          value={loading ? '–' : activeAdmins.length}
          hint={`${admins.length - activeAdmins.length} disabled or removed`}
          icon={Users}
          tone="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigate('admins')}
        />
        <Kpi
          label="Access requests"
          value={loading ? '–' : pendingAccess.length}
          hint={pendingAccess.length ? 'Waiting for your review' : 'No pending requests'}
          icon={Inbox}
          tone="bg-dv-iris-50 text-dv-iris-600"
          onClick={() => onNavigate('access-requests')}
          attention={pendingAccess.length > 0}
        />
        <Kpi
          label="Password resets"
          value={loading ? '–' : pendingResets.length}
          hint={pendingResets.length ? 'Waiting for your review' : 'No pending requests'}
          icon={KeyRound}
          tone="bg-amber-50 text-amber-600"
          onClick={() => onNavigate('password-resets')}
          attention={pendingResets.length > 0}
        />
        <Kpi
          label="Client projects"
          value={loading ? '–' : stats?.totalProjects ?? 0}
          hint="Across all Admins"
          icon={FolderKanban}
          tone="bg-sky-50 text-sky-600"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Decisions */}
        <section className="rounded-[26px] border border-dv-line bg-white p-6 shadow-dv-card lg:col-span-2">
          <h3 className="font-display text-lg font-bold text-dv-ink">Needs your decision</h3>
          <p className="mt-1 text-[13px] text-dv-muted">Access and password requests from staff.</p>

          {decisions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-dv-line p-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
              <p className="mt-2 text-[13px] font-semibold text-dv-ink">Inbox zero</p>
              <p className="mt-1 text-[12px] text-dv-muted">New requests from staff will appear here.</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {decisions.slice(0, 6).map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.kind === 'access' ? 'access-requests' : 'password-resets')}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dv-line p-3 text-left transition hover:border-dv-iris-200 hover:bg-dv-canvas"
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.kind === 'access' ? 'bg-dv-iris-50 text-dv-iris-600' : 'bg-amber-50 text-amber-600')}>
                      {item.kind === 'access' ? <Inbox className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-dv-ink">{item.title}</span>
                      <span className="block truncate text-[11px] text-dv-muted">
                        {item.kind === 'access' ? 'Wants Admin access' : 'Asked for a password reset'} · {relativeTime(item.at)}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-dv-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-[26px] border border-dv-line bg-white p-6 shadow-dv-card lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-dv-ink">Recent activity</h3>
              <p className="mt-1 text-[13px] text-dv-muted">The latest sensitive actions recorded in the audit trail.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-dv-iris-600 hover:text-dv-iris-700"
            >
              Full trail <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {recentEvents.length === 0 ? (
            <p className="mt-6 text-[13px] text-dv-muted">No activity recorded yet.</p>
          ) : (
            <ol className="relative mt-5 space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-dv-line">
              {recentEvents.map((event) => (
                <li key={event.id} className="relative flex items-start gap-3">
                  <span className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                    event.userRole === 'SUPER_ADMIN' ? 'bg-dv-coral/15 text-dv-coral' : 'bg-dv-iris-50 text-dv-iris-600'
                  )}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-[13px] font-semibold text-dv-ink">{humanizeAction(event.action)}</div>
                    <div className="truncate text-[11px] text-dv-muted">
                      {event.userEmail || event.userId} · {event.resourceType} · {relativeTime(event.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Commercial summary (internal records only) */}
      {commercial && (
        <section className="rounded-[26px] border border-dv-line bg-white p-6 shadow-dv-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-dv-ink">Commercial records</h3>
              <p className="mt-1 text-[13px] text-dv-muted">Internal quotation and payment records kept by Admins. Amounts in INR.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <IndianRupee className="h-3 w-3" /> {commercial.totalInvoicesIssued} invoice{commercial.totalInvoicesIssued === 1 ? '' : 's'} issued
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Quoted', value: quoted },
                { label: 'Collected', value: collected },
                { label: 'Outstanding', value: commercial.totalOutstanding }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-dv-canvas p-4">
                  <div className="text-[11px] font-semibold text-dv-muted">{item.label}</div>
                  <div className="mt-1 truncate font-display text-lg font-bold text-dv-ink">{inr.format(item.value)}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-dv-ink-2">Collected of quoted</span>
                <span className="font-semibold text-dv-ink">{collectedShare.toFixed(0)}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-dv-mist">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${collectedShare}%` }} />
              </div>
              <p className="mt-2 text-[12px] text-dv-muted">
                Across {commercial.totalProjects} project record{commercial.totalProjects === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
