import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, UserPlus, Users, Mail, KeyRound, Pencil, Ban, RotateCcw, ShieldOff, Crown, Clock, CheckCircle2,
  XCircle, AlertCircle, AlertTriangle, Loader2, ArrowRightLeft, Info, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/dv/Button';
import { Dialog, fieldClass } from './Dialog';
import { relativeTime } from './projectMeta';
import { api, setStoredToken, type SuperAdminAccount, type SuperAdminDirectory } from '../../lib/api';
import { isValidEmail } from '../../lib/email';

export type SuperAdminAccountsView = 'accounts' | 'create' | 'transfer';

interface Props {
  view: SuperAdminAccountsView;
  onViewChange: (view: SuperAdminAccountsView) => void;
  /** Called after any change so the dashboard can refresh its own data. */
  onChanged: () => void;
  /** Called when this session lost its Super Admin access (for example after being demoted). */
  onSessionEnded: () => void;
}

const REVOKE_PHRASE = 'REVOKE SUPER ADMIN';
const TRANSFER_PHRASE = 'TRANSFER OWNERSHIP';

type Dlg =
  | { kind: 'email' | 'details' | 'password' | 'deactivate' | 'activate' | 'revoke'; account: SuperAdminAccount }
  | null;

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const Pill: React.FC<{ tone: 'emerald' | 'amber' | 'rose' | 'iris' | 'slate'; icon?: React.ElementType; children: React.ReactNode }> = ({ tone, icon: Icon, children }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    iris: 'bg-dv-iris-50 text-dv-iris-700 ring-dv-iris-200',
    slate: 'bg-slate-50 text-slate-600 ring-slate-200'
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', tones[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
};

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <span className="mb-2 block text-[12px] font-semibold text-dv-ink-2">
    {children}
    {hint && <span className="ml-1.5 font-normal text-dv-muted">{hint}</span>}
  </span>
);

const PasswordInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  id?: string;
}> = ({ value, onChange, autoComplete = 'new-password', placeholder, id }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(fieldClass, 'pr-11')}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-dv-muted hover:text-dv-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const ErrorBox: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;

/** The confirmation every sensitive action asks for. */
const ReauthField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <label className="block rounded-xl border border-dv-line bg-dv-canvas p-3.5">
    <Label hint="(required for this action)">Your current password</Label>
    <PasswordInput value={value} onChange={onChange} autoComplete="current-password" id="sa-reauth" />
  </label>
);

export const SuperAdminAccountsPanel: React.FC<Props> = ({ view, onViewChange, onChanged, onSessionEnded }) => {
  const [directory, setDirectory] = useState<SuperAdminDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDirectory(await api.getSuperAdmins());
      setLoadError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Super Admin accounts.';
      if (/revoked|sign in again|privileges|Access denied|deactivated|removed/i.test(message)) {
        onSessionEnded();
        return;
      }
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [onSessionEnded]);

  useEffect(() => { void load(); }, [load]);

  const refreshAll = async () => {
    await load();
    onChanged();
  };

  const iAmOwner = Boolean(directory?.you.isOwner);

  // ---------------------------------------------------------------- dialogs
  const [dialog, setDialog] = useState<Dlg>(null);
  const [busy, setBusy] = useState(false);
  const [dlgError, setDlgError] = useState<string | null>(null);
  const [fEmail, setFEmail] = useState('');
  const [fName, setFName] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fNewPassword, setFNewPassword] = useState('');
  const [fConfirm, setFConfirm] = useState('');
  const [fReauth, setFReauth] = useState('');
  const [fReason, setFReason] = useState('');
  const [fPhrase, setFPhrase] = useState('');

  const openDialog = (kind: NonNullable<Dlg>['kind'], account: SuperAdminAccount) => {
    setDlgError(null);
    setFEmail(account.email);
    setFName(account.name);
    setFUsername(account.username ?? '');
    setFNewPassword('');
    setFConfirm('');
    setFReauth('');
    setFReason('');
    setFPhrase('');
    setDialog({ kind, account });
  };

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setFReauth('');
    setFNewPassword('');
    setFConfirm('');
  };

  const run = async (action: () => Promise<string | void>) => {
    setBusy(true);
    setDlgError(null);
    try {
      const message = await action();
      setDialog(null);
      setFReauth('');
      setFNewPassword('');
      setFConfirm('');
      if (message) setFlash(message);
      await refreshAll();
    } catch (err) {
      setDlgError(err instanceof Error ? err.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitDialog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dialog) return;
    const { kind, account } = dialog;

    if (!fReauth) { setDlgError('Enter your current password to confirm.'); return; }

    if (kind === 'email' || kind === 'details') {
      const next: { name?: string; email?: string; username?: string } = {};
      const email = fEmail.trim().toLowerCase();
      if (!isValidEmail(email)) { setDlgError('Please enter a valid email address.'); return; }
      if (email !== account.email.toLowerCase()) next.email = email;
      if (kind === 'details') {
        if (fName.trim().length < 2) { setDlgError('Full name must be at least 2 characters.'); return; }
        if (fName.trim() !== account.name) next.name = fName.trim();
        if (fUsername.trim() !== (account.username ?? '')) next.username = fUsername.trim();
      }
      if (!Object.keys(next).length) { setDlgError('Nothing has changed.'); return; }
      await run(async () => (await api.updateSuperAdminDetails(account.id, { ...next, currentPassword: fReauth })).message);
      return;
    }

    if (kind === 'password') {
      const wantsPassword = fNewPassword.length > 0 || fConfirm.length > 0;
      const wantsName = fName.trim() !== account.name;
      if (!wantsPassword && !wantsName) { setDlgError('Change the name, set a new password, or both.'); return; }
      if (wantsName && fName.trim().length < 2) { setDlgError('Full name must be at least 2 characters.'); return; }
      if (wantsPassword) {
        if (fNewPassword.length < 12) { setDlgError('The new password must contain at least 12 characters.'); return; }
        if (fNewPassword !== fConfirm) { setDlgError('The new password and its confirmation do not match.'); return; }
      }
      await run(async () => {
        const parts: string[] = [];
        if (wantsName) parts.push((await api.updateSuperAdminDetails(account.id, { name: fName.trim(), currentPassword: fReauth })).message);
        if (wantsPassword) {
          const res = await api.changeSuperAdminPassword(account.id, { newPassword: fNewPassword, confirmPassword: fConfirm, currentPassword: fReauth });
          if (res.token) setStoredToken(res.token); // keep your own session after changing your own password
          parts.push(res.message);
        }
        return parts.join(' ');
      });
      return;
    }

    if (kind === 'deactivate' || kind === 'activate') {
      await run(async () => (await api.setSuperAdminStatus(account.id, {
        status: kind === 'deactivate' ? 'DISABLED' : 'ACTIVE', reason: fReason.trim() || undefined, currentPassword: fReauth
      })).message);
      return;
    }

    if (kind === 'revoke') {
      if (fPhrase !== REVOKE_PHRASE) { setDlgError(`Type ${REVOKE_PHRASE} exactly to confirm.`); return; }
      await run(async () => (await api.revokeSuperAdmin(account.id, { confirmationPhrase: fPhrase, currentPassword: fReauth })).message);
    }
  };

  // ---------------------------------------------------------------- create form
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cUsername, setCUsername] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cConfirm, setCConfirm] = useState('');
  const [cStatus, setCStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [cReauth, setCReauth] = useState('');
  const [cBusy, setCBusy] = useState(false);
  const [cError, setCError] = useState<string | null>(null);

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCError(null);
    if (cName.trim().length < 2) return setCError('Full name must be at least 2 characters.');
    if (!isValidEmail(cEmail.trim())) return setCError('Please enter a valid email address.');
    if (cUsername.trim() && !/^[a-zA-Z0-9_-]{3,32}$/.test(cUsername.trim())) return setCError('Username must be 3-32 letters, numbers, underscores or hyphens.');
    if (cPassword.length < 12) return setCError('Password must contain at least 12 characters.');
    if (cPassword !== cConfirm) return setCError('Password and confirmation do not match.');
    if (!cReauth) return setCError('Enter your current password to confirm.');

    setCBusy(true);
    try {
      const res = await api.createSuperAdmin({
        name: cName.trim(), email: cEmail.trim(), username: cUsername.trim() || undefined,
        password: cPassword, confirmPassword: cConfirm, status: cStatus, currentPassword: cReauth
      });
      setFlash(`${res.account.name} (${res.account.email}) is now a Super Admin${res.account.isActive ? '' : ' (inactive)'}. Share the temporary password with them privately; they must choose their own at first sign-in.`);
      setCName(''); setCEmail(''); setCUsername(''); setCPassword(''); setCConfirm(''); setCReauth(''); setCStatus('ACTIVE');
      await refreshAll();
      onViewChange('accounts');
    } catch (err) {
      setCError(err instanceof Error ? err.message : 'Could not create the account.');
    } finally {
      setCBusy(false);
    }
  };

  // ---------------------------------------------------------------- transfer
  const [tMode, setTMode] = useState<'existing' | 'new'>('existing');
  const [tTarget, setTTarget] = useState('');
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tUsername, setTUsername] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tConfirm, setTConfirm] = useState('');
  const [tAccess, setTAccess] = useState<'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN'>('KEEP_SUPER_ADMIN');
  const [tPhrase, setTPhrase] = useState('');
  const [tReauth, setTReauth] = useState('');
  const [tBusy, setTBusy] = useState(false);
  const [tError, setTError] = useState<string | null>(null);
  const [acceptReauth, setAcceptReauth] = useState('');

  const candidates = useMemo(() => (directory?.accounts ?? []).filter((a) => !a.isSelf && a.isActive), [directory]);

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setTError(null);
    if (tMode === 'existing' && !tTarget) return setTError('Choose the Super Admin who will become the owner.');
    if (tMode === 'new') {
      if (tName.trim().length < 2) return setTError('Enter the new owner\'s full name.');
      if (!isValidEmail(tEmail.trim())) return setTError('Enter a valid email address for the new owner.');
      if (tPassword.length < 12) return setTError('The new account password must contain at least 12 characters.');
      if (tPassword !== tConfirm) return setTError('Password and confirmation do not match.');
    }
    if (tPhrase !== TRANSFER_PHRASE) return setTError(`Type ${TRANSFER_PHRASE} exactly to confirm.`);
    if (!tReauth) return setTError('Enter your current password to confirm.');

    setTBusy(true);
    try {
      const res = await api.startOwnershipTransfer({
        currentPassword: tReauth,
        confirmationPhrase: tPhrase,
        formerOwnerAccess: tAccess,
        ...(tMode === 'existing'
          ? { targetUserId: tTarget }
          : { newAccount: { name: tName.trim(), email: tEmail.trim(), username: tUsername.trim() || undefined, password: tPassword, confirmPassword: tConfirm } })
      });
      setFlash(res.message);
      setTPhrase(''); setTReauth(''); setTPassword(''); setTConfirm('');
      await refreshAll();
    } catch (err) {
      setTError(err instanceof Error ? err.message : 'Could not start the transfer.');
    } finally {
      setTBusy(false);
    }
  };

  const [tAction, setTAction] = useState<'accept' | 'cancel' | null>(null);
  const [tActionError, setTActionError] = useState<string | null>(null);

  const acceptTransfer = async () => {
    if (!directory?.transfer) return;
    if (!acceptReauth) return setTActionError('Enter your current password to accept.');
    setTAction('accept');
    setTActionError(null);
    try {
      const res = await api.acceptOwnershipTransfer({ transferId: directory.transfer.id, currentPassword: acceptReauth });
      setAcceptReauth('');
      setFlash(res.message);
      await refreshAll();
    } catch (err) {
      setTActionError(err instanceof Error ? err.message : 'Could not accept the transfer.');
    } finally {
      setTAction(null);
    }
  };

  const cancelTransfer = async () => {
    setTAction('cancel');
    setTActionError(null);
    try {
      setFlash((await api.cancelOwnershipTransfer()).message);
      await refreshAll();
    } catch (err) {
      setTActionError(err instanceof Error ? err.message : 'Could not cancel the transfer.');
    } finally {
      setTAction(null);
    }
  };

  // ---------------------------------------------------------------- render helpers
  const protectedFromMe = (a: SuperAdminAccount) => a.isOwner && !a.isSelf;

  const accountsList = (
    <div className="space-y-4">
      {directory && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Super Admins', value: directory.summary.total, icon: Users },
            { label: 'Active', value: directory.summary.active, icon: CheckCircle2 },
            { label: 'Product Owner', value: directory.accounts.find((a) => a.isOwner)?.name ?? 'None', icon: Crown }
          ].map((card) => (
            <div key={card.label} className="flex items-center gap-3 rounded-2xl border border-dv-line bg-white p-4 shadow-dv-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-dv-iris-50 text-dv-iris-600"><card.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="truncate font-display text-lg font-bold text-dv-ink">{card.value}</div>
                <div className="text-[12px] text-dv-muted">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-dv-line bg-white shadow-dv-card">
        <ul className="divide-y divide-dv-line">
          {(directory?.accounts ?? []).map((a) => {
            const lockedOwner = protectedFromMe(a);
            const noRemove = a.isOwner || a.isSelf;
            return (
              <li key={a.id} className="p-5" data-testid={`sa-row-${a.id}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <span className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-bold',
                      a.isActive ? 'bg-gradient-to-br from-dv-coral to-dv-sun text-white' : 'bg-dv-mist text-dv-muted'
                    )}>{initials(a.name)}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-dv-ink">{a.name}</span>
                        {a.isOwner && <Pill tone="amber" icon={Crown}>Product Owner</Pill>}
                        {a.isSelf && <Pill tone="iris">You</Pill>}
                        {a.isActive ? <Pill tone="emerald" icon={CheckCircle2}>Active</Pill> : <Pill tone="rose" icon={XCircle}>Inactive</Pill>}
                        {a.mustChangePassword && <Pill tone="amber" icon={KeyRound}>Must set own password</Pill>}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-dv-muted">
                        {a.username ? `@${a.username} · ` : ''}{a.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-dv-muted">
                        <Clock className="h-3 w-3" />
                        {a.lastLoginAt ? `Signed in ${relativeTime(a.lastLoginAt)}` : 'Never signed in'}
                        {!a.isActive && a.disabledReason ? ` · ${a.disabledReason}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[460px] lg:justify-end">
                    <Button size="sm" variant="secondary" disabled={lockedOwner} title={lockedOwner ? 'Only the Product Owner can change this account.' : undefined} onClick={() => openDialog('email', a)}>
                      <Mail className="h-3.5 w-3.5" />Change email
                    </Button>
                    <Button size="sm" variant="secondary" disabled={lockedOwner} title={lockedOwner ? 'Only the Product Owner can change this account.' : undefined} onClick={() => openDialog('password', a)}>
                      <KeyRound className="h-3.5 w-3.5" />Name &amp; password
                    </Button>
                    <Button size="sm" variant="secondary" disabled={lockedOwner} title={lockedOwner ? 'Only the Product Owner can change this account.' : undefined} onClick={() => openDialog('details', a)}>
                      <Pencil className="h-3.5 w-3.5" />Edit details
                    </Button>
                    {a.isActive ? (
                      <Button size="sm" variant="secondary" disabled={noRemove}
                        title={a.isOwner ? 'The Product Owner cannot be deactivated. Transfer ownership first.' : a.isSelf ? 'Ask another Super Admin to deactivate your account.' : undefined}
                        onClick={() => openDialog('deactivate', a)}>
                        <Ban className="h-3.5 w-3.5" />Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => openDialog('activate', a)}>
                        <RotateCcw className="h-3.5 w-3.5" />Reactivate
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" disabled={noRemove} className="text-rose-700 hover:bg-rose-50"
                      title={a.isOwner ? 'The Product Owner cannot be revoked. Transfer ownership first.' : a.isSelf ? 'Ask another Super Admin to revoke your access.' : undefined}
                      onClick={() => openDialog('revoke', a)}>
                      <ShieldOff className="h-3.5 w-3.5" />Revoke access
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="flex items-start gap-2 text-[12px] leading-5 text-dv-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Deactivating signs the person out and blocks sign-in until reactivated. Revoking removes Super Admin rights but keeps them as an ordinary Admin.
        The last active Super Admin can never be removed.
      </p>
    </div>
  );

  const createForm = (
    <form onSubmit={submitCreate} className="max-w-2xl space-y-5 rounded-[24px] border border-dv-line bg-white p-6 shadow-dv-card" aria-label="Create new Super Admin account">
      <div>
        <h3 className="font-display text-lg font-bold text-dv-ink">Create New Super Admin Account</h3>
        <p className="mt-1 text-[13px] leading-6 text-dv-muted">
          The new Super Admin can manage the platform and other Admins, but is not the Product Owner. Any valid email address works (Gmail, Outlook, Yahoo, your own domain). The password you set is temporary: they must replace it with their own the first time they sign in.
        </p>
      </div>
      <ErrorBox message={cError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><Label>Full name</Label><input id="sa-create-name" value={cName} onChange={(e) => setCName(e.target.value)} className={fieldClass} placeholder="e.g. Ananya Sen" /></label>
        <label className="block"><Label>Email address</Label><input id="sa-create-email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={fieldClass} placeholder="name@example.com" /></label>
        <label className="block"><Label hint="(optional)">Username</Label><input id="sa-create-username" value={cUsername} onChange={(e) => setCUsername(e.target.value)} className={fieldClass} placeholder="they can also sign in with email" /></label>
        <label className="block">
          <Label>Account status</Label>
          <select id="sa-create-status" value={cStatus} onChange={(e) => setCStatus(e.target.value as 'ACTIVE' | 'DISABLED')} className={fieldClass}>
            <option value="ACTIVE">Active: can sign in now</option>
            <option value="DISABLED">Inactive: create but block sign-in</option>
          </select>
        </label>
        <label className="block"><Label hint="(12+ characters, temporary)">Temporary password</Label><PasswordInput id="sa-create-password" value={cPassword} onChange={setCPassword} /></label>
        <label className="block"><Label>Confirm temporary password</Label><PasswordInput id="sa-create-confirm" value={cConfirm} onChange={setCConfirm} /></label>
      </div>
      <label className="block rounded-xl border border-dv-line bg-dv-canvas p-3.5">
        <Label hint="(required for this action)">Your current password</Label>
        <PasswordInput id="sa-create-reauth" value={cReauth} onChange={setCReauth} autoComplete="current-password" />
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={cBusy}>
          {cBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create Super Admin
        </Button>
      </div>
    </form>
  );

  const transfer = directory?.transfer ?? null;
  const transferPanel = (
    <div className="max-w-3xl space-y-5">
      {transfer ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50/60 p-6" data-testid="transfer-pending">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="mt-0.5 h-5 w-5 text-amber-700" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-dv-ink">Ownership transfer pending</h3>
              <p className="mt-1 text-[13px] leading-6 text-dv-ink-2">
                Ownership moves to <strong>{transfer.targetName}</strong> ({transfer.targetEmail}) only when they sign in and accept.
                Expires {new Date(transfer.expiresAt).toLocaleString()}.
                {transfer.formerOwnerAccess === 'DEMOTE_TO_ADMIN'
                  ? ' The current owner becomes an ordinary Admin afterwards.'
                  : ' The current owner stays a Super Admin afterwards.'}
              </p>

              {directory?.transferRole === 'TARGET' && (
                <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-[13px] font-semibold text-dv-ink">You have been asked to become the Product Owner.</p>
                  <label className="block"><Label hint="(confirms it is you)">Your current password</Label>
                    <PasswordInput id="sa-accept-reauth" value={acceptReauth} onChange={setAcceptReauth} autoComplete="current-password" />
                  </label>
                  {tActionError && <ErrorBox message={tActionError} />}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={acceptTransfer} disabled={tAction !== null}>
                      {tAction === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                      Accept ownership
                    </Button>
                    <Button variant="secondary" onClick={cancelTransfer} disabled={tAction !== null}>Decline</Button>
                  </div>
                </div>
              )}

              {directory?.transferRole === 'OWNER' && (
                <div className="mt-4">
                  {tActionError && <ErrorBox message={tActionError} />}
                  <Button variant="secondary" onClick={cancelTransfer} disabled={tAction !== null}>
                    {tAction === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel transfer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : iAmOwner ? (
        <form onSubmit={submitTransfer} className="space-y-5 rounded-[24px] border border-dv-line bg-white p-6 shadow-dv-card" aria-label="Transfer ownership">
          <div>
            <h3 className="font-display text-lg font-bold text-dv-ink">Transfer Super Admin Ownership</h3>
            <p className="mt-1 text-[13px] leading-6 text-dv-muted">
              Choose who becomes the Product Owner. Nothing changes until that person signs in and accepts.
            </p>
          </div>
          <ErrorBox message={tError} />

          <div className="inline-flex rounded-xl border border-dv-line bg-dv-canvas p-1 text-[13px] font-semibold">
            {(['existing', 'new'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setTMode(mode)}
                className={cn('rounded-lg px-3.5 py-2 transition', tMode === mode ? 'bg-white text-dv-ink shadow-sm' : 'text-dv-muted hover:text-dv-ink')}>
                {mode === 'existing' ? 'An existing Super Admin' : 'Create a new account'}
              </button>
            ))}
          </div>

          {tMode === 'existing' ? (
            <label className="block">
              <Label>New owner</Label>
              <select id="sa-transfer-target" value={tTarget} onChange={(e) => setTTarget(e.target.value)} className={fieldClass}>
                <option value="">{candidates.length ? 'Select a Super Admin' : 'No other active Super Admin: create a new account instead'}</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><Label>Full name</Label><input id="sa-transfer-name" value={tName} onChange={(e) => setTName(e.target.value)} className={fieldClass} /></label>
              <label className="block"><Label>Email address</Label><input id="sa-transfer-email" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} className={fieldClass} /></label>
              <label className="block"><Label hint="(optional)">Username</Label><input id="sa-transfer-username" value={tUsername} onChange={(e) => setTUsername(e.target.value)} className={fieldClass} /></label>
              <span className="hidden sm:block" />
              <label className="block"><Label hint="(temporary: they must replace it at first sign-in)">Temporary password</Label><PasswordInput id="sa-transfer-password" value={tPassword} onChange={setTPassword} /></label>
              <label className="block"><Label>Confirm temporary password</Label><PasswordInput id="sa-transfer-confirm" value={tConfirm} onChange={setTConfirm} /></label>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="mb-1 text-[12px] font-semibold text-dv-ink-2">After the transfer, your account</legend>
            {([
              ['KEEP_SUPER_ADMIN', 'Stays a Super Admin (recommended: you keep access and cannot be locked out)'],
              ['DEMOTE_TO_ADMIN', 'Becomes an ordinary Admin']
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-start gap-2.5 text-[13px] text-dv-ink-2">
                <input type="radio" name="former-access" checked={tAccess === value} onChange={() => setTAccess(value)} className="mt-1" />
                {label}
              </label>
            ))}
          </fieldset>

          <label className="block">
            <Label>Type <span className="font-mono text-dv-ink">{TRANSFER_PHRASE}</span> to confirm</Label>
            <input id="sa-transfer-phrase" value={tPhrase} onChange={(e) => setTPhrase(e.target.value)} className={fieldClass} autoComplete="off" />
          </label>
          <label className="block rounded-xl border border-dv-line bg-dv-canvas p-3.5">
            <Label hint="(required for this action)">Your current password</Label>
            <PasswordInput id="sa-transfer-reauth" value={tReauth} onChange={setTReauth} autoComplete="current-password" />
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={tBusy}>
              {tBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
              Start ownership transfer
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-[24px] border border-dv-line bg-white p-6 shadow-dv-card">
          <h3 className="font-display text-lg font-bold text-dv-ink">Transfer Super Admin Ownership</h3>
          <p className="mt-2 text-[13px] leading-6 text-dv-muted">
            Only the Product Owner can start an ownership transfer. If one is addressed to you, it will appear here for you to accept.
          </p>
        </div>
      )}

      <div className="rounded-[24px] border border-dv-line bg-white p-6 shadow-dv-card">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-dv-ink"><ShieldCheck className="h-4 w-4 text-emerald-600" />Safeguards and recovery</h3>
        <ul className="mt-3 space-y-2 text-[13px] leading-6 text-dv-ink-2">
          <li>The new owner must sign in with their own account and password to accept; until then nothing changes. An account you create here (a new Super Admin or a new owner) starts with a temporary password that they must replace at first sign-in; for a new owner that happens before they can accept.</li>
          <li>Every step asks for the acting Super Admin&apos;s password again and is recorded in the audit trail.</li>
          <li>By default the previous owner stays a Super Admin, so a mistaken transfer never locks anyone out.</li>
          <li>If access is ever lost, whoever controls the server can restore ownership with{' '}
            <code className="rounded bg-dv-iris-50 px-1.5 py-0.5 text-[12px]">npm run auth:recover-super-admin -- --make-owner --user &lt;username&gt; --apply</code>.
          </li>
        </ul>
      </div>
    </div>
  );

  // ---------------------------------------------------------------- dialog content
  const dlgMeta = (() => {
    if (!dialog) return null;
    const who = <span className="font-semibold text-dv-ink">{dialog.account.name}</span>;
    switch (dialog.kind) {
      case 'email': return { title: 'Change email address', icon: Mail, tone: 'iris' as const, submit: 'Save email', description: <>Sign-in email for {who}. Their id, password and history stay exactly as they are.</> };
      case 'details': return { title: 'Edit account details', icon: Pencil, tone: 'iris' as const, submit: 'Save details', description: <>Name, username and email for {who}. Password and history are not touched.</> };
      case 'password': return { title: 'Change name & password', icon: KeyRound, tone: 'iris' as const, submit: 'Save changes', description: <>Update the name and/or set a new password for {who}. A new password signs them out everywhere.</> };
      case 'deactivate': return { title: 'Deactivate Super Admin?', icon: Ban, tone: 'amber' as const, submit: 'Deactivate', description: <>{who} will be signed out at once and cannot sign in until reactivated.</> };
      case 'activate': return { title: 'Reactivate Super Admin?', icon: RotateCcw, tone: 'emerald' as const, submit: 'Reactivate', description: <>{who} will be able to sign in again.</> };
      case 'revoke': return { title: 'Revoke Super Admin access?', icon: AlertTriangle, tone: 'rose' as const, submit: 'Revoke access', description: <>{who} stays in the system as an ordinary Admin and loses all Super Admin rights. They are signed out now.</> };
    }
  })();

  const protectedHeader = view === 'accounts' ? 'View Super Admin Accounts' : view === 'create' ? 'Create New Super Admin' : 'Transfer Ownership';

  return (
    <div className="space-y-5" aria-label={protectedHeader}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Super Admin Account Management">
        {([
          ['accounts', 'View accounts'],
          ['create', 'Create new Super Admin'],
          ['transfer', 'Transfer ownership']
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => onViewChange(id)}
            className={cn('rounded-xl px-3.5 py-2 text-[13px] font-semibold transition',
              view === id ? 'bg-dv-ink text-white shadow-sm' : 'border border-dv-line bg-white text-dv-muted hover:text-dv-ink')}>
            {label}
            {id === 'transfer' && directory?.transferRole === 'TARGET' && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-dv-coral align-middle" />}
          </button>
        ))}
      </div>

      {flash && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          <span className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{flash}</span>
          <button type="button" onClick={() => setFlash(null)} className="text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">×</button>
        </div>
      )}
      {loadError && <ErrorBox message={loadError} />}
      {loading && !directory && (
        <div className="flex items-center gap-2 text-[13px] text-dv-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading Super Admin accounts...</div>
      )}

      {directory && view === 'accounts' && accountsList}
      {directory && view === 'create' && createForm}
      {directory && view === 'transfer' && transferPanel}

      <Dialog
        open={Boolean(dialog)}
        onClose={closeDialog}
        busy={busy}
        icon={dlgMeta?.icon}
        tone={dlgMeta?.tone}
        title={dlgMeta?.title}
        description={dlgMeta?.description}
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={busy}>Cancel</Button>
            <Button type="submit" form="sa-dialog-form" disabled={busy} className={dialog?.kind === 'revoke' ? 'bg-none bg-rose-600 shadow-none hover:bg-rose-700' : undefined}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {dlgMeta?.submit}
            </Button>
          </>
        }
      >
        {dialog && (
          <form id="sa-dialog-form" onSubmit={submitDialog} className="space-y-4">
            <ErrorBox message={dlgError} />

            {(dialog.kind === 'email' || dialog.kind === 'details') && (
              <label className="block"><Label>Email address</Label>
                <input id="sa-dlg-email" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className={fieldClass} />
              </label>
            )}
            {(dialog.kind === 'details' || dialog.kind === 'password') && (
              <label className="block"><Label>Full name</Label>
                <input id="sa-dlg-name" value={fName} onChange={(e) => setFName(e.target.value)} className={fieldClass} />
              </label>
            )}
            {dialog.kind === 'details' && (
              <label className="block"><Label hint="(3-32 letters, numbers, _ or -)">Username</Label>
                <input id="sa-dlg-username" value={fUsername} onChange={(e) => setFUsername(e.target.value)} className={fieldClass} />
              </label>
            )}
            {dialog.kind === 'password' && (
              <>
                <label className="block"><Label hint="(leave empty to keep the current one)">New password</Label>
                  <PasswordInput id="sa-dlg-newpw" value={fNewPassword} onChange={setFNewPassword} />
                </label>
                <label className="block"><Label>Confirm new password</Label>
                  <PasswordInput id="sa-dlg-confirmpw" value={fConfirm} onChange={setFConfirm} />
                </label>
              </>
            )}
            {dialog.kind === 'deactivate' && (
              <label className="block"><Label hint="(optional)">Reason</Label>
                <input id="sa-dlg-reason" value={fReason} onChange={(e) => setFReason(e.target.value)} className={fieldClass} placeholder="For example: on leave" />
              </label>
            )}
            {dialog.kind === 'revoke' && (
              <label className="block"><Label>Type <span className="font-mono text-dv-ink">{REVOKE_PHRASE}</span> to confirm</Label>
                <input id="sa-dlg-phrase" value={fPhrase} onChange={(e) => setFPhrase(e.target.value)} className={fieldClass} autoComplete="off" />
              </label>
            )}

            <ReauthField value={fReauth} onChange={setFReauth} />
          </form>
        )}
      </Dialog>

    </div>
  );
};

export default SuperAdminAccountsPanel;
