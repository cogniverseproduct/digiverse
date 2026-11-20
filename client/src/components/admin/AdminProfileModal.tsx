import React, { useState, useEffect } from 'react';
import {
  User,
  AdminUserProfile
} from '../../types/admin';
import { api } from '../../lib/api';
import {
  X,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  Clock,
  Briefcase,
  Activity,
  AlertTriangle,
  LogIn,
  Power,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Key
} from 'lucide-react';
import { Button } from '../ui/dv/Button';

interface AdminProfileModalProps {
  adminUser: User;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onImpersonateSuccess?: (impersonationToken: string, targetUser: User) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  adminUser,
  isOpen,
  onClose,
  onRefresh,
  onImpersonateSuccess
}) => {
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals for sensitive actions
  const [activeDialog, setActiveDialog] = useState<
    'none' | 'disable' | 'enable' | 'remove' | 'impersonate' | 'revoke'
  >('none');
  const [dialogReason, setDialogReason] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUserProfile(adminUser.id);
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Admin profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setActiveDialog('none');
      setDialogReason('');
      setSuperAdminPassword('');
      setSuccessNotice(null);
    }
  }, [isOpen, adminUser.id]);

  if (!isOpen) return null;

  const handleDisable = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.disableAdminUser(adminUser.id, dialogReason);
      setSuccessNotice(res.message);
      setActiveDialog('none');
      setDialogReason('');
      await loadProfile();
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disable Admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.enableAdminUser(adminUser.id);
      setSuccessNotice(res.message);
      setActiveDialog('none');
      await loadProfile();
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to enable Admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.removeAdminUser(adminUser.id, dialogReason);
      setSuccessNotice(res.message);
      setActiveDialog('none');
      setDialogReason('');
      await loadProfile();
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove Admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.revokeAdminSessions(adminUser.id);
      setSuccessNotice(res.message);
      setActiveDialog('none');
      await loadProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!superAdminPassword) {
      setError('Super Admin password re-authentication is required.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.impersonateAdminUser(
        adminUser.id,
        superAdminPassword,
        dialogReason
      );

      if (onImpersonateSuccess) {
        onImpersonateSuccess(res.token, res.user);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impersonation authentication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentStatus = profile?.user.accountStatus || (adminUser.isActive ? 'ACTIVE' : 'DISABLED');

  const statusPill =
    currentStatus === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : currentStatus === 'DISABLED'
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200';

  const initials = adminUser.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  const openDialog = (dialog: typeof activeDialog) => {
    setActiveDialog(dialog);
    setDialogReason('');
    setSuperAdminPassword('');
    setError(null);
    setSuccessNotice(null);
  };

  const fieldClass =
    'w-full rounded-xl border border-dv-line bg-white px-3.5 py-2.5 text-[13px] text-dv-ink placeholder:text-dv-muted/70 outline-none transition focus:border-dv-iris-400 focus:ring-4 focus:ring-dv-iris-100';

  const actions: {
    id: typeof activeDialog;
    show: boolean;
    icon: React.ElementType;
    title: string;
    text: string;
    tone: string;
  }[] = [
    {
      id: 'impersonate',
      show: currentStatus === 'ACTIVE',
      icon: LogIn,
      title: 'View as this Admin',
      text: 'Open their workspace for one hour after confirming your password. Recorded in the audit trail.',
      tone: 'bg-dv-iris-50 text-dv-iris-600'
    },
    {
      id: 'revoke',
      show: currentStatus === 'ACTIVE',
      icon: RefreshCw,
      title: 'Sign out everywhere',
      text: 'End all of their active sessions. They can sign in again with their password.',
      tone: 'bg-sky-50 text-sky-600'
    },
    {
      id: 'enable',
      show: currentStatus === 'DISABLED',
      icon: ShieldCheck,
      title: 'Enable account',
      text: 'Restore access. They sign in with their existing username and password.',
      tone: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'disable',
      show: currentStatus === 'ACTIVE',
      icon: Power,
      title: 'Disable account',
      text: 'Block sign-in immediately. Projects and records stay intact; you can enable it later.',
      tone: 'bg-amber-50 text-amber-600'
    },
    {
      id: 'remove',
      show: currentStatus !== 'REMOVED',
      icon: Trash2,
      title: 'Remove account',
      text: 'Permanently revoke access. Projects, history and audit records are kept.',
      tone: 'bg-rose-50 text-rose-600'
    }
  ];

  const confirmCopy: Record<Exclude<typeof activeDialog, 'none'>, { title: string; button: string; buttonClass: string; reasonPlaceholder?: string; onConfirm: () => void }> = {
    impersonate: { title: 'Confirm your password', button: 'Open Admin view', buttonClass: '', reasonPlaceholder: 'e.g. Helping with a client handover', onConfirm: handleImpersonate },
    revoke: { title: 'Sign this Admin out everywhere?', button: 'Sign out everywhere', buttonClass: 'bg-none bg-dv-ink shadow-none hover:bg-dv-ink-2', onConfirm: handleRevokeSessions },
    enable: { title: 'Enable this account?', button: 'Enable account', buttonClass: 'bg-none bg-emerald-600 shadow-none hover:bg-emerald-700', onConfirm: handleEnable },
    disable: { title: 'Disable this account?', button: 'Disable account', buttonClass: 'bg-none bg-amber-600 shadow-none hover:bg-amber-700', reasonPlaceholder: 'e.g. Security review, leave of absence', onConfirm: handleDisable },
    remove: { title: 'Remove this account?', button: 'Remove account', buttonClass: 'bg-none bg-rose-600 shadow-none hover:bg-rose-700', reasonPlaceholder: 'e.g. Role ended', onConfirm: handleRemove }
  };

  const confirm = activeDialog !== 'none' ? confirmCopy[activeDialog] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-dv-ink/35 backdrop-blur-sm animate-dv-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !actionLoading) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${adminUser.name}`}
        className="flex h-full w-full max-w-[520px] flex-col bg-dv-canvas shadow-dv-float animate-[dv-slide-in_0.35s_cubic-bezier(0.22,1,0.36,1)_both]"
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-dv-line bg-white px-6 pb-6 pt-6">
          <div aria-hidden className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-dv-iris-100 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-xl p-2 text-dv-muted transition hover:bg-dv-canvas hover:text-dv-ink"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl dv-prism-fill font-display text-lg font-bold text-white shadow-dv-glow">
              {initials || <UserIcon className="h-6 w-6" />}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold tracking-[-0.02em] text-dv-ink">{adminUser.name}</h2>
              <p className="truncate text-[13px] text-dv-muted">@{adminUser.username || 'no-username'} · {adminUser.email}</p>
              <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${statusPill}`}>
                {currentStatus === 'ACTIVE' ? 'Active' : currentStatus === 'DISABLED' ? 'Disabled' : 'Removed'}
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Calendar, label: 'Joined', value: adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { icon: Clock, label: 'Last sign-in', value: profile?.user.lastLoginAt ? new Date(profile.user.lastLoginAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Never' },
              { icon: Briefcase, label: 'Projects', value: String(profile?.assignedProjectsCount ?? (loading ? '…' : 0)) }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-dv-canvas px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-dv-muted"><Icon className="h-3.5 w-3.5" />{label}</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-dv-ink">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {successNotice && (
            <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {successNotice}
            </div>
          )}

          {profile?.user.disabledReason && currentStatus !== 'ACTIVE' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              <span className="font-semibold">Reason recorded:</span> {profile.user.disabledReason}
            </div>
          )}

          {/* Actions or confirmation */}
          {confirm ? (
            <section className="rounded-[22px] border border-dv-line bg-white p-5 shadow-dv-card animate-dv-pop">
              <h3 className="font-display text-base font-bold text-dv-ink">{confirm.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-dv-muted">
                {actions.find((a) => a.id === activeDialog)?.text}
              </p>

              <div className="mt-4 space-y-3">
                {activeDialog === 'impersonate' && (
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-dv-ink-2"><Key className="h-3.5 w-3.5" />Your Super Admin password</span>
                    <input
                      type="password"
                      autoFocus
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={fieldClass}
                    />
                  </label>
                )}
                {confirm.reasonPlaceholder && (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-dv-ink-2">Reason (optional)</span>
                    <input
                      type="text"
                      value={dialogReason}
                      onChange={(e) => setDialogReason(e.target.value)}
                      placeholder={confirm.reasonPlaceholder}
                      className={fieldClass}
                    />
                  </label>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setActiveDialog('none')} disabled={actionLoading}>Cancel</Button>
                <Button
                  onClick={confirm.onConfirm}
                  disabled={actionLoading || (activeDialog === 'impersonate' && !superAdminPassword)}
                  className={confirm.buttonClass}
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {confirm.button}
                </Button>
              </div>
            </section>
          ) : (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">
                <Shield className="h-3.5 w-3.5" /> Account actions
              </h3>
              {actions.filter((a) => a.show).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-dv-line p-5 text-center text-[13px] text-dv-muted">
                  This account has been removed. Its history remains available below.
                </p>
              ) : (
                <div className="overflow-hidden rounded-[22px] border border-dv-line bg-white shadow-dv-card">
                  {actions.filter((a) => a.show).map(({ id, icon: Icon, title, text, tone }, index) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openDialog(id)}
                      className={`group flex w-full items-start gap-3.5 px-5 py-4 text-left transition hover:bg-dv-canvas/70 ${index > 0 ? 'border-t border-dv-line' : ''}`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] font-semibold ${id === 'remove' ? 'text-rose-700' : 'text-dv-ink'}`}>{title}</span>
                        <span className="mt-0.5 block text-[12px] leading-5 text-dv-muted">{text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Activity */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">
              <Activity className="h-3.5 w-3.5" /> Recent activity
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-2xl bg-[linear-gradient(110deg,#fff_30%,#F2F0FF_50%,#fff_70%)] bg-[length:200%_100%] animate-dv-shimmer" />
                ))}
              </div>
            ) : profile?.recentActivity && profile.recentActivity.length > 0 ? (
              <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-dv-line">
                {profile.recentActivity.map((log) => (
                  <li key={log.id} className="relative flex items-start gap-3">
                    <span className="relative z-10 mt-1 h-[23px] w-[23px] shrink-0 rounded-full border-4 border-dv-canvas bg-dv-iris-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-dv-ink">
                        {log.action.charAt(0) + log.action.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-dv-muted">
                        {log.resourceType} · {new Date(log.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-2xl border border-dashed border-dv-line p-5 text-center text-[13px] text-dv-muted">No activity recorded for this account yet.</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};
