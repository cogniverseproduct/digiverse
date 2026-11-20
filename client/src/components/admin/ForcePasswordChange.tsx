import React, { useState } from 'react';
import { KeyRound, Loader2, AlertCircle, Eye, EyeOff, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/dv/Button';
import { fieldClass } from '../workspace/Dialog';
import { api } from '../../lib/api';
import type { User } from '../../types/admin';

interface Props {
  user: User;
  /** Called with the refreshed user once the new password is saved. */
  onChanged: (user: User) => void;
  onLogout: () => void;
}

const MIN_LENGTH = 12;

const PasswordField: React.FC<{
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}> = ({ id, label, hint, value, onChange, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-[12px] font-semibold text-dv-ink-2">
        {label}
        {hint && <span className="ml-1.5 font-normal text-dv-muted">{hint}</span>}
      </span>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`${fieldClass} pr-11`}
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
    </label>
  );
};

/**
 * Shown instead of the dashboard while the signed-in person is still using a password somebody
 * else chose for them (for example the owner who created their account for an ownership transfer).
 * The server also refuses every other request until this is done, so this screen is a convenience,
 * not the security boundary.
 */
export const ForcePasswordChange: React.FC<Props> = ({ user, onChanged, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!current) return setError('Enter the temporary password you were given.');
    if (next.length < MIN_LENGTH) return setError(`Your new password must contain at least ${MIN_LENGTH} characters.`);
    if (next === current) return setError('Choose a different password from the temporary one.');
    if (next !== confirm) return setError('The new password and its confirmation do not match.');

    setBusy(true);
    try {
      const res = await api.changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      const refreshed = res.user ?? (await api.getCurrentUser());
      onChanged({ ...(refreshed ?? user), mustChangePassword: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-dv-canvas px-4 py-10">
      <form
        onSubmit={submit}
        aria-label="Choose a new password"
        className="w-full max-w-md space-y-5 rounded-[28px] border border-dv-line bg-white p-7 shadow-dv-card"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dv-iris-50 text-dv-iris-600">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-dv-ink">Choose your own password</h1>
            <p className="mt-1 text-[13px] leading-6 text-dv-muted">
              Welcome, {user.name}. Your account was created with a temporary password that someone else knows.
              Set a private one to continue. Nothing else is available until you do.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <PasswordField id="force-current" label="Temporary password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField id="force-new" label="New password" hint={`(${MIN_LENGTH}+ characters)`} value={next} onChange={setNext} autoComplete="new-password" />
        <PasswordField id="force-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Save and continue
        </Button>

        <button
          type="button"
          onClick={onLogout}
          className="mx-auto flex items-center gap-1.5 text-[12px] font-semibold text-dv-muted hover:text-dv-ink"
        >
          <LogOut className="h-3.5 w-3.5" />Sign out instead
        </button>
      </form>
    </main>
  );
};

export default ForcePasswordChange;
