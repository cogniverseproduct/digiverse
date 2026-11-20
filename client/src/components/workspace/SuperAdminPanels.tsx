import React, { useEffect, useMemo, useState } from 'react';
import {
  Check, X, Search, Settings2, Inbox, KeyRound, ShieldCheck, Clock, CheckCircle2, XCircle, UserPlus, Users, Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AdminAccessRequest, AdminPasswordReset, AuditLogItem, User } from '../../types/admin';
import { Button } from '../ui/dv/Button';
import { api, type OrganizationOwnershipRow } from '../../lib/api';
import { relativeTime } from './projectMeta';
import { InboxProcessRow, RecentAuditRow, TeamRow } from './DataRows';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

const Avatar: React.FC<{ name: string; tone?: 'iris' | 'coral' | 'muted' }> = ({ name, tone = 'iris' }) => (
  <span
    className={cn(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-bold',
      tone === 'coral' ? 'bg-gradient-to-br from-dv-coral to-dv-sun text-white'
        : tone === 'muted' ? 'bg-dv-mist text-dv-muted'
        : 'dv-prism-fill text-white'
    )}
  >
    {initials(name)}
  </span>
);

const Pill: React.FC<{ tone: 'emerald' | 'amber' | 'rose' | 'iris' | 'slate' | 'sky'; children: React.ReactNode; icon?: React.ElementType }> = ({ tone, children, icon: Icon }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    iris: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200',
    slate: 'bg-slate-50 text-slate-600 ring-slate-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200'
  };
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', tones[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
};

function Segmented<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-dv-line bg-dv-canvas p-1" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition',
            value === option.value ? 'bg-white text-dv-ink shadow-sm' : 'text-dv-muted hover:text-dv-ink'
          )}
        >
          {option.label}
          {typeof option.count === 'number' && (
            <span className={cn('rounded-full px-1.5 text-[10px]', value === option.value ? 'bg-dv-ink/[0.06]' : 'bg-transparent')}>{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <label className="relative block w-full sm:max-w-xs">
    <span className="sr-only">{placeholder}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-dv-line bg-white py-2 pl-9 pr-3 text-[13px] text-dv-ink placeholder:text-dv-muted/70 focus:border-dv-iris-300 focus:outline-none focus:ring-4 focus:ring-dv-iris-100"
    />
  </label>
);

const EmptyState: React.FC<{ icon: React.ElementType; title: string; text: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="rounded-[24px] border border-dashed border-dv-line bg-white/60 px-6 py-14 text-center">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-dv-mist text-dv-muted">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-4 font-display text-base font-bold text-dv-ink">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-[13px] text-dv-muted">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ---------------------------------------------------------------------------
// Admin accounts
// ---------------------------------------------------------------------------

type AccountFilter = 'all' | 'ACTIVE' | 'DISABLED' | 'REMOVED';

export const AdminAccountsPanel: React.FC<{
  users: User[];
  currentUserId: string;
  loading: boolean;
  onManage: (user: User) => void;
  onInvite: () => void;
}> = ({ users, currentUserId, loading, onManage, onInvite }) => {
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [query, setQuery] = useState('');

  const statusOf = (u: User): Exclude<AccountFilter, 'all'> => (u.accountStatus || (u.isActive ? 'ACTIVE' : 'DISABLED')) as Exclude<AccountFilter, 'all'>;

  const counts = useMemo(() => {
    const result: Record<AccountFilter, number> = { all: users.length, ACTIVE: 0, DISABLED: 0, REMOVED: 0 };
    users.forEach((u) => { result[statusOf(u)] += 1; });
    return result;
  }, [users]);

  const visible = users
    .filter((u) => filter === 'all' || statusOf(u) === filter)
    .filter((u) => {
      const q = query.trim().toLowerCase();
      return !q || [u.name, u.username, u.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    })
    .sort((a, b) => (a.role === 'SUPER_ADMIN' ? -1 : b.role === 'SUPER_ADMIN' ? 1 : a.name.localeCompare(b.name)));

  return (
    <div className="space-y-5">
      <TeamRow users={users} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<AccountFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'ACTIVE', label: 'Active', count: counts.ACTIVE },
            { value: 'DISABLED', label: 'Disabled', count: counts.DISABLED },
            { value: 'REMOVED', label: 'Removed', count: counts.REMOVED }
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Search name, username or email" />
      </div>

      {!loading && visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={users.length ? 'No accounts match' : 'No staff accounts yet'}
          text={users.length ? 'Try another filter or search.' : 'Invite your first Admin. They choose their own username and password.'}
          action={!users.length ? <Button onClick={onInvite}><UserPlus className="h-4 w-4" />Invite an Admin</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-dv-line bg-white shadow-dv-card">
          <ul className="divide-y divide-dv-line">
            {visible.map((u) => {
              const status = statusOf(u);
              const isSelf = u.id === currentUserId;
              const isOwner = u.role === 'SUPER_ADMIN';
              return (
                <li key={u.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-dv-canvas/60 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <Avatar name={u.name} tone={isOwner ? 'coral' : status === 'ACTIVE' ? 'iris' : 'muted'} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-dv-ink">{u.name}</span>
                        {isSelf && <Pill tone="iris">You</Pill>}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-dv-muted">
                        @{u.username || 'no-username'} · {u.email || 'no email'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:w-[260px]">
                    <Pill tone={isOwner ? 'amber' : 'sky'} icon={isOwner ? ShieldCheck : undefined}>{isOwner ? 'Super Admin' : 'Admin'}</Pill>
                    {status === 'ACTIVE' && <Pill tone="emerald" icon={CheckCircle2}>Active</Pill>}
                    {status === 'DISABLED' && <Pill tone="amber" icon={XCircle}>Disabled</Pill>}
                    {status === 'REMOVED' && <Pill tone="rose" icon={XCircle}>Removed</Pill>}
                  </div>

                  <div className="text-[12px] text-dv-muted sm:w-[150px]">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{u.lastLoginAt ? relativeTime(u.lastLoginAt) : 'Never signed in'}</div>
                    <div className="mt-0.5">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>

                  <div className="sm:w-[120px] sm:text-right">
                    {isSelf || isOwner ? (
                      <span className="text-[12px] text-dv-muted">{isSelf ? 'Signed in' : u.isPlatformOwner ? 'Owner' : 'Super Admin'}</span>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => onManage(u)}>
                        <Settings2 className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Request inboxes (access + password reset)
// ---------------------------------------------------------------------------

type InboxFilter = 'pending' | 'resolved';

interface InboxItem {
  id: string;
  title: string;
  subtitle: string;
  reason?: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'EXPIRED';
  resolution: string;
  resolvedTone: 'emerald' | 'rose' | 'iris' | 'slate';
  resolvedLabel: string;
}

const RequestInbox: React.FC<{
  items: InboxItem[];
  kind: 'access' | 'reset';
  onApprove: (id: string, title: string) => void;
  onReject: (id: string, title: string) => void;
}> = ({ items, kind, onApprove, onReject }) => {
  const [filter, setFilter] = useState<InboxFilter>('pending');
  const pending = items.filter((i) => i.status === 'PENDING');
  const resolved = items.filter((i) => i.status !== 'PENDING');
  const visible = (filter === 'pending' ? pending : resolved).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const Icon = kind === 'access' ? Inbox : KeyRound;

  return (
    <div className="space-y-5">
      <InboxProcessRow kind={kind} />
      <Segmented<InboxFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pending', label: 'Waiting for you', count: pending.length },
          { value: 'resolved', label: 'History', count: resolved.length }
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={filter === 'pending' ? CheckCircle2 : Icon}
          title={filter === 'pending' ? 'Nothing waiting' : 'No history yet'}
          text={
            filter === 'pending'
              ? kind === 'access'
                ? 'New Admin access requests from the staff sign-in page will appear here.'
                : 'Password reset requests from Admins will appear here.'
              : 'Approved and rejected requests will be listed here.'
          }
        />
      ) : filter === 'pending' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((item) => (
            <article key={item.id} className="flex flex-col rounded-[24px] border border-dv-line bg-white p-5 shadow-dv-card animate-dv-rise">
              <div className="flex items-start gap-3.5">
                <Avatar name={item.title.replace(/^@/, '')} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-dv-ink">{item.title}</div>
                  <div className="truncate text-[12px] text-dv-muted">{item.subtitle}</div>
                </div>
                <span className="shrink-0 text-[11px] text-dv-muted">{relativeTime(item.createdAt)}</span>
              </div>

              <div className="mt-4 flex-1 rounded-2xl bg-dv-canvas px-4 py-3 text-[13px] leading-6 text-dv-ink-2">
                {item.reason ? <>“{item.reason}”</> : <span className="text-dv-muted">No reason given.</span>}
              </div>

              <p className="mt-3 text-[12px] text-dv-muted">
                {kind === 'access'
                  ? 'Approving creates a single-use setup link valid for 48 hours.'
                  : 'Approving creates a single-use reset link valid for 24 hours.'}
              </p>

              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => onApprove(item.id, item.title)} className="flex-1">
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onReject(item.id, item.title)} className="flex-1 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-dv-line bg-white shadow-dv-card">
          <ul className="divide-y divide-dv-line">
            {visible.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={item.title.replace(/^@/, '')} tone="muted" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-dv-ink">{item.title}</div>
                    <div className="truncate text-[12px] text-dv-muted">{item.subtitle} · requested {formatDate(item.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-[12px] text-dv-muted">{item.resolution}</span>
                  <Pill tone={item.resolvedTone}>{item.resolvedLabel}</Pill>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const AccessRequestsPanel: React.FC<{
  requests: AdminAccessRequest[];
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
}> = ({ requests, onApprove, onReject }) => (
  <RequestInbox
    kind="access"
    onApprove={onApprove}
    onReject={onReject}
    items={requests.map((r) => ({
      id: r.id,
      title: r.name,
      subtitle: r.email,
      reason: r.reason,
      createdAt: r.createdAt,
      status: r.status,
      resolution: r.status === 'APPROVED' ? (r.accountCreatedAt ? 'Account created' : 'Waiting for the applicant to finish setup') : 'Request declined',
      resolvedTone: r.status === 'APPROVED' ? (r.accountCreatedAt ? 'emerald' : 'iris') : 'rose',
      resolvedLabel: r.status === 'APPROVED' ? (r.accountCreatedAt ? 'Joined' : 'Approved') : 'Rejected'
    }))}
  />
);

export const PasswordResetsPanel: React.FC<{
  resets: AdminPasswordReset[];
  onApprove: (id: string, username: string) => void;
  onReject: (id: string, username: string) => void;
}> = ({ resets, onApprove, onReject }) => (
  <RequestInbox
    kind="reset"
    onApprove={(id) => onApprove(id, resets.find((r) => r.id === id)?.adminUsername || '')}
    onReject={(id) => onReject(id, resets.find((r) => r.id === id)?.adminUsername || '')}
    items={resets.map((r) => ({
      id: r.id,
      title: `@${r.adminUsername}`,
      subtitle: r.adminEmail,
      reason: r.reason,
      createdAt: r.createdAt,
      status: r.status,
      resolution:
        r.status === 'COMPLETED' ? 'Password updated'
        : r.status === 'APPROVED' ? 'Waiting for the Admin to use the link'
        : r.status === 'EXPIRED' ? 'Link expired'
        : 'Request declined',
      resolvedTone: r.status === 'COMPLETED' ? 'emerald' : r.status === 'APPROVED' ? 'iris' : r.status === 'EXPIRED' ? 'slate' : 'rose',
      resolvedLabel: r.status === 'COMPLETED' ? 'Completed' : r.status === 'APPROVED' ? 'Approved' : r.status === 'EXPIRED' ? 'Expired' : 'Rejected'
    }))}
  />
);

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

function humanizeAction(action: string): string {
  const text = action.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Organisations: who owns each client organisation, and hand-over of orphaned ones
// ---------------------------------------------------------------------------

type OwnerFilter = 'all' | 'attention';

const OWNER_BADGE: Record<OrganizationOwnershipRow['ownerState'], { label: string; tone: string }> = {
  active: { label: 'Active owner', tone: 'bg-emerald-50 text-emerald-700' },
  disabled: { label: 'Owner disabled', tone: 'bg-amber-50 text-amber-700' },
  missing: { label: 'Owner removed', tone: 'bg-red-50 text-red-700' },
  unassigned: { label: 'No owner', tone: 'bg-red-50 text-red-700' }
};

export const OrganizationsPanel: React.FC = () => {
  const [rows, setRows] = useState<OrganizationOwnershipRow[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<OwnerFilter>('all');
  const [query, setQuery] = useState('');
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [bulkTarget, setBulkTarget] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    try {
      const data = await api.getOrganizationOwnership();
      setRows(data.organizations);
      setAdmins(data.admins);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Could not load organisations.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const orphaned = rows.filter((r) => r.ownerState !== 'active');
  const visible = rows
    .filter((r) => filter === 'all' || r.ownerState !== 'active')
    .filter((r) => {
      const q = query.trim().toLowerCase();
      return !q || [r.name, r.slug, r.assignedAdmin?.name, r.assignedAdmin?.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });

  const adminLabel = (a: { name: string; email: string }) => `${a.name} (${a.email})`;

  const assignOne = async (row: OrganizationOwnershipRow) => {
    const to = choice[row.id];
    const target = admins.find((a) => a.id === to);
    if (!target) return;
    if (!window.confirm(`Assign “${row.name}” and its ${row.projectCount} project(s) to ${adminLabel(target)}? Only this Admin (and Super Admins) will be able to open it.`)) return;
    setBusy(row.id); setNotice(''); setError('');
    try {
      await api.reassignOrganization(row.id, to);
      setNotice(`“${row.name}” is now assigned to ${target.name}.`);
      setChoice((c) => ({ ...c, [row.id]: '' }));
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not assign the organisation.');
    } finally { setBusy(''); }
  };

  const assignOrphaned = async () => {
    const target = admins.find((a) => a.id === bulkTarget);
    if (!target || orphaned.length === 0) return;
    if (!window.confirm(`Assign ${orphaned.length} organisation(s) that have no active owner to ${adminLabel(target)}? Organisations with an active owner are not changed.`)) return;
    setBusy('bulk'); setNotice(''); setError('');
    try {
      const r = await api.reassignOrganizations('orphaned', bulkTarget);
      setNotice(`${r.moved} organisation(s) assigned to ${target.name}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not assign the organisations.');
    } finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      {orphaned.length > 0 && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
          <p className="text-[14px] font-semibold text-dv-ink">{orphaned.length} organisation{orphaned.length === 1 ? ' has' : 's have'} no active owner</p>
          <p className="mt-1 text-[13px] text-dv-ink-2">
            Their owner was disabled, removed or never set, so no Admin can open them or create a website under their name. Assign them to an active Admin to restore access. Nothing is deleted or changed except the owner.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={bulkTarget}
              onChange={(e) => setBulkTarget(e.target.value)}
              aria-label="Admin to receive the organisations"
              className="min-w-0 flex-1 rounded-xl border border-dv-line bg-white px-3 py-2.5 text-[13px] text-dv-ink"
            >
              <option value="">Choose an active Admin…</option>
              {admins.map((a) => <option key={a.id} value={a.id}>{adminLabel(a)}</option>)}
            </select>
            <Button size="sm" disabled={!bulkTarget || busy === 'bulk'} onClick={assignOrphaned}>
              Assign all {orphaned.length} to this Admin
            </Button>
          </div>
          {admins.length === 0 && <p className="mt-2 text-[12px] text-amber-800">There is no active Admin yet. Invite one from Admin accounts first.</p>}
        </div>
      )}

      {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<OwnerFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All (${rows.length})` },
            { value: 'attention', label: `Needs an owner (${orphaned.length})` }
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Search organisation or owner" />
      </div>

      {loading ? (
        <p className="text-[13px] text-dv-muted">Loading organisations…</p>
      ) : visible.length === 0 ? (
        <EmptyState icon={Building2} title="No organisations" text={rows.length ? 'Nothing matches this filter.' : 'Organisations appear here when an Admin creates a website for a client.'} />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-dv-line bg-white shadow-dv-card">
          <ul className="divide-y divide-dv-line">
            {visible.map((row) => {
              const badge = OWNER_BADGE[row.ownerState];
              return (
                <li key={row.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-dv-ink">{row.name}</p>
                    <p className="truncate text-[12px] text-dv-muted">/{row.slug} · {row.category} · {row.projectCount} project{row.projectCount === 1 ? '' : 's'}</p>
                  </div>
                  <div className="min-w-0 lg:w-64">
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold', badge.tone)}>{badge.label}</span>
                    <p className="mt-1 truncate text-[12px] text-dv-ink-2">{row.assignedAdmin ? adminLabel(row.assignedAdmin) : 'Not assigned to anyone'}</p>
                  </div>
                  <div className="flex items-center gap-2 lg:w-[22rem]">
                    <select
                      value={choice[row.id] || ''}
                      onChange={(e) => setChoice((c) => ({ ...c, [row.id]: e.target.value }))}
                      aria-label={`Assign ${row.name} to`}
                      className="min-w-0 flex-1 rounded-xl border border-dv-line bg-white px-3 py-2 text-[13px] text-dv-ink"
                    >
                      <option value="">Assign to…</option>
                      {admins.filter((a) => a.id !== row.assignedAdmin?.id).map((a) => <option key={a.id} value={a.id}>{adminLabel(a)}</option>)}
                    </select>
                    <Button size="sm" variant="secondary" disabled={!choice[row.id] || busy === row.id} onClick={() => assignOne(row)}>Assign</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

type AuditFilter = 'all' | 'SUPER_ADMIN' | 'ADMIN';

export const AuditTrailPanel: React.FC<{ logs: AuditLogItem[] }> = ({ logs }) => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<AuditFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = logs
    .filter((log) => role === 'all' || log.userRole === role)
    .filter((log) => {
      const q = query.trim().toLowerCase();
      return !q || [log.action, log.userEmail, log.resourceType, log.resourceId].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });

  const groups = filtered.reduce<{ label: string; items: AuditLogItem[] }[]>((acc, log) => {
    const label = dayLabel(log.createdAt);
    const group = acc.find((g) => g.label === label);
    if (group) group.items.push(log);
    else acc.push({ label, items: [log] });
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      <RecentAuditRow logs={logs} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<AuditFilter>
          value={role}
          onChange={setRole}
          options={[
            { value: 'all', label: 'Everyone' },
            { value: 'SUPER_ADMIN', label: 'Super Admin' },
            { value: 'ADMIN', label: 'Admins' }
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Search action, person or resource" />
      </div>

      <p className="text-[12px] text-dv-muted">Showing {filtered.length} of the latest {logs.length} events.</p>

      {groups.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No events" text={logs.length ? 'Nothing matches this filter.' : 'Sensitive actions will be recorded here.'} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">{group.label}</h4>
              <div className="overflow-hidden rounded-[24px] border border-dv-line bg-white shadow-dv-card">
                <ul className="divide-y divide-dv-line">
                  {group.items.map((log) => {
                    const isOpen = expanded === log.id;
                    const hasDetails = log.details && Object.keys(log.details).length > 0;
                    return (
                      <li key={log.id}>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : log.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-dv-canvas/60"
                        >
                          <span className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            log.userRole === 'SUPER_ADMIN' ? 'bg-dv-coral/10 text-dv-coral' : 'bg-dv-iris-50 text-dv-iris-600'
                          )}>
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-dv-ink">{humanizeAction(log.action)}</span>
                            <span className="block truncate text-[12px] text-dv-muted">
                              {log.userEmail} · {log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ''}
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-[12px] text-dv-muted sm:block">
                            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-dv-line bg-dv-canvas/50 px-5 py-4 text-[12px] animate-dv-fade">
                            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                              <div><dt className="text-dv-muted">When</dt><dd className="text-dv-ink">{formatDate(log.createdAt)}</dd></div>
                              <div><dt className="text-dv-muted">Role</dt><dd className="text-dv-ink">{log.userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</dd></div>
                              <div><dt className="text-dv-muted">IP address</dt><dd className="font-mono text-dv-ink">{log.ipAddress || '—'}</dd></div>
                              <div><dt className="text-dv-muted">Action code</dt><dd className="font-mono text-dv-ink">{log.action}</dd></div>
                            </dl>
                            {hasDetails && (
                              <pre className="mt-3 max-h-52 overflow-auto rounded-xl bg-white p-3 font-mono text-[11px] leading-5 text-dv-ink-2 ring-1 ring-dv-line">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
