
import React, { useEffect, useState } from 'react';
import { api, setStoredToken } from '../../lib/api';
import { User } from '../../types/admin';
import { PLATFORM_CONFIG } from '../../config/platform';
import { isValidEmail } from '../../lib/email';
import { DvLogo, DvMark } from '../ui/dv/DvLogo';
import {
  Lock,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  Users,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type LoginRole = 'SUPER_ADMIN' | 'ADMIN';
type Screen =
  | 'roles'
  | 'login'
  | 'owner-setup'
  | 'verification-preview'
  | 'recovery'
  | 'admin-request'
  | 'admin-request-status'
  | 'admin-create-account'
  | 'admin-forgot-password'
  | 'admin-reset-password';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [screen, setScreen] = useState<Screen>('roles');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Admin access request workflow
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestToken, setRequestToken] = useState('');

  // Password reset workflow
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotReason, setForgotReason] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [requestStatus, setRequestStatus] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | null
  >(null);

  const [adminUsername, setAdminUsername] = useState('');

  const [setupRequired, setSetupRequired] = useState(false);
  const [setupStatusLoaded, setSetupStatusLoaded] = useState(false);

  const [setupOwnerName, setSetupOwnerName] = useState('Satyaki Maiti');
  const [setupUsername, setSetupUsername] = useState('');
  // One-time key required only when setup is performed remotely (e.g. on Vercel).
  const [setupKey, setSetupKey] = useState('');
  const [setupKeyRequired, setSetupKeyRequired] = useState(false);
  // 'NONE' = no Super Admin yet (first-time setup). 'ACTIVE' = normal login. 'INACTIVE_ONLY' = an owner account exists but is disabled.
  const [superAdminState, setSuperAdminState] = useState<'ACTIVE' | 'NONE' | 'INACTIVE_ONLY' | null>(null);
  const [setupEmail, setSetupEmail] = useState<string>(PLATFORM_CONFIG.productEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

    // Poll Admin access request status until it is approved or rejected.
  useEffect(() => {
    if (
      !isOpen ||
      screen !== 'admin-request-status' ||
      !requestToken
    ) {
      return;
    }

    let isActive = true;

    const checkRequestStatus = async () => {
      try {
        const response =
          await api.getAdminAccessRequestStatus(requestToken);

        if (!isActive) return;

        const status = response.request.status;
        setRequestStatus(status);

        if (status === 'APPROVED') {
          setNotice(
            'Your request has been approved. Create your Admin account now.'
          );
          setScreen('admin-create-account');
        } else if (status === 'REJECTED') {
          setNotice(
            'Your Admin access request was rejected by the Super Admin.'
          );
        }
      } catch (err: unknown) {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to check your request status.'
          );
        }
      }
    };

    void checkRequestStatus();

    const intervalId = window.setInterval(() => {
      void checkRequestStatus();
    }, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isOpen, screen, requestToken]);

  // Check URL query parameters for setupToken or resetToken links
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const params = new URLSearchParams(window.location.search);
      const setupTok = params.get('setupToken');
      const resetTok = params.get('resetToken');

      if (setupTok) {
        setSelectedRole('ADMIN');
        setRequestToken(setupTok);
        setScreen('admin-create-account');
      } else if (resetTok) {
        setSelectedRole('ADMIN');
        setResetToken(resetTok);
        setScreen('admin-reset-password');
      }

      // Keep single-use tokens out of the address bar and browser history.
      if ((setupTok || resetTok) && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedRole(null);
    setScreen('roles');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setNotice(null);
    setRequestName('');
    setRequestEmail('');
    setRequestReason('');
    setRequestToken('');
    setRequestStatus(null);
    setAdminUsername('');
    setForgotIdentifier('');
    setForgotReason('');
    setResetToken('');
    setSetupOwnerName('Satyaki Maiti');
    setSetupUsername('');
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const checkSetupStatus = async (): Promise<{ setupRequired: boolean; state: 'ACTIVE' | 'NONE' | 'INACTIVE_ONLY' | null } | null> => {
    setSetupStatusLoaded(false);

    try {
      const response = await fetch('/api/auth/setup/status');

      if (!response.ok) {
        throw new Error('Unable to check initial account setup status.');
      }

      const data = await response.json();
      const state = (data.superAdminState as 'ACTIVE' | 'NONE' | 'INACTIVE_ONLY' | undefined) ?? null;
      setSetupRequired(Boolean(data.setupRequired));
      setSuperAdminState(state);
      setSetupKeyRequired(Boolean(data.requiresSetupKey));
      if (data.defaultName) {
        setSetupOwnerName(data.defaultName);
      }
      if (typeof data.email === 'string' && data.email) {
        setSetupEmail(data.email);
      }
      return { setupRequired: Boolean(data.setupRequired), state };
    } catch (err) {
      setSetupRequired(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check account setup status.'
      );
      return null;
    } finally {
      setSetupStatusLoaded(true);
    }
  };

  const handleRoleSelect = async (role: LoginRole) => {
    setSelectedRole(role);
    setScreen('login');
    setEmail('');
    setPassword('');
    setError(null);
    setNotice(null);

    if (role === 'SUPER_ADMIN') {
      const status = await checkSetupStatus();
      if (status?.setupRequired && status.state === 'NONE') {
        // No Super Admin exists yet: go straight to the one-time First-Time Setup page.
        setScreen('owner-setup');
        setPassword('');
        setConfirmPassword('');
      }
    } else {
      setSetupRequired(false);
      setSetupStatusLoaded(true);
    }
  };

  const handleBack = () => {
    setError(null);
    setNotice(null);

    if (screen === 'admin-forgot-password' || screen === 'admin-reset-password') {
      setScreen('login');
      return;
    }

    if (screen === 'admin-request-status') {
      setScreen('admin-request');
      return;
    }

    if (screen === 'admin-create-account') {
      setScreen('login');
      return;
    }

    if (screen === 'admin-request') {
      setScreen('login');
      return;
    }

    if (screen === 'owner-setup') {
      setScreen('login');
      setPassword('');
      setConfirmPassword('');
      return;
    }

    if (screen === 'login') {
      setScreen('roles');
      setSelectedRole(null);
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Please select your account type first.');
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await api.login(email.trim(), password);

      if (data.user.role !== selectedRole) {
        api.logout();
        setError(
          `This account is not registered as ${
            selectedRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'
          }. Please select the correct login type.`
        );
        return;
      }

      onLoginSuccess(data.user);
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };
  // Submit Admin Access Request
  const handleAdminRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const cleanName = requestName.trim();
    const cleanEmail = requestEmail.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.submitAdminAccessRequest({
        name: cleanName,
        email: cleanEmail,
        reason: requestReason.trim() || undefined
      });

      setRequestToken(result.requestToken);
      setRequestStatus('PENDING');
      setNotice(
        'Your Admin access request has been submitted. Please wait for Super Admin approval.'
      );

      setScreen('admin-request-status');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your access request.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Create Admin account after Super Admin approval (Applicant sets their own password >= 12 chars)
  const handleAdminAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const cleanUsername = adminUsername.trim().toLowerCase();
    const activeToken = requestToken.trim();

    if (!activeToken) {
      setError('A valid account setup token is required.');
      return;
    }

    if (!cleanUsername) {
      setError('Please enter your Admin username.');
      return;
    }

    if (password.length < 12) {
      setError('Password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.completeAdminAccountSetup({
        setupToken: activeToken,
        name: requestName.trim() || undefined,
        username: cleanUsername,
        password,
        confirmPassword,
      });

      setNotice(
        result.message || 'Your Admin account has been created. You can now sign in with your credentials.'
      );

      setSelectedRole('ADMIN');
      setEmail(cleanUsername);
      setPassword('');
      setConfirmPassword('');
      setAdminUsername('');
      setRequestToken('');
      setRequestStatus(null);
      setScreen('login');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your Admin account.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Reset Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!forgotIdentifier.trim()) {
      setError('Please enter your Admin username or registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestAdminPasswordReset(
        forgotIdentifier.trim(),
        forgotReason.trim() || undefined
      );

      setNotice(res.message);
      setForgotIdentifier('');
      setForgotReason('');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit password reset request.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Complete Password Reset via token
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!resetToken.trim()) {
      setError('A valid 64-character password reset token is required.');
      return;
    }

    if (password.length < 12) {
      setError('New password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeAdminPasswordReset({
        resetToken: resetToken.trim(),
        password,
        confirmPassword
      });

      setNotice(res.message);
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      setScreen('login');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // One-time Super Admin setup. No OTP or email verification.
  const handleOwnerSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const cleanName = setupOwnerName.trim();
    const cleanUsername = setupUsername.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError('Please enter a valid Product Owner profile name (at least 2 characters).');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must contain at least 3 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens.');
      return;
    }

    const cleanSetupEmail = setupEmail.trim().toLowerCase();
    if (!isValidEmail(cleanSetupEmail)) {
      setError('Please enter a valid email address for the Super Admin account.');
      return;
    }

    if (password.length < 12) {
      setError('Password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      // Recheck on the server before attempting one-time setup.
      const statusResponse = await fetch('/api/auth/setup/status');

      if (!statusResponse.ok) {
        throw new Error('Unable to verify initial setup status.');
      }

      const statusData = await statusResponse.json();

      if (!statusData.setupRequired) {
        setSetupRequired(false);
        setScreen('login');
        throw new Error(
          'A Super Admin account already exists. Please sign in instead.'
        );
      }

      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
          email: cleanSetupEmail,
          password,
          confirmPassword,
          ...(setupKeyRequired ? { setupKey: setupKey.trim() } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Super Admin account setup failed.');
      }

      if (!data.token || !data.user) {
        throw new Error('Setup response did not contain valid login details.');
      }

      setStoredToken(data.token);

      setSetupRequired(false);
      setSuperAdminState('ACTIVE');
      setSetupStatusLoaded(true);

      onLoginSuccess(data.user);
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create the Super Admin account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-dv-line bg-white px-4 py-3 text-sm text-dv-ink placeholder:text-dv-muted/70 outline-none transition-all duration-200 hover:border-dv-iris-200 focus:border-dv-iris-400 focus:ring-4 focus:ring-dv-iris-100';

  const labelClass =
    'mb-2 block text-[12px] font-semibold text-dv-ink-2';

  const primaryButtonClass =
    'dv-sheen flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dv-iris-600 via-[#7346EA] to-[#9A4FF0] px-5 py-3.5 text-sm font-semibold text-white shadow-dv-glow transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';

  const secondaryButtonClass =
    'inline-flex items-center gap-2 text-[13px] font-semibold text-dv-muted transition hover:text-dv-iris-700';

  const renderPasswordInput = (
    id: string,
    value: string,
    setter: (value: string) => void,
    visible: boolean,
    toggle: () => void,
    placeholder: string,
    _autoComplete: string = 'off'
  ) => (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />

      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required
        autoComplete="off"
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-11 pr-12`}
      />

      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-dv-muted transition-colors hover:text-dv-iris-700"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );

    const getHeading = () => {
    if (screen === 'roles') return 'Welcome to DigiVerse';
    if (screen === 'owner-setup') return 'Create Product Owner Account';
    if (screen === 'admin-request') return 'Request Admin Access';
    if (screen === 'admin-request-status') return 'Request Status';
    if (screen === 'admin-create-account') return 'Create Admin Account';
    if (screen === 'admin-forgot-password') return 'Request Password Change';
    if (screen === 'admin-reset-password') return 'Reset Admin Password';

    return selectedRole === 'SUPER_ADMIN'
      ? 'Super Admin Login'
      : 'Admin Login';
  };

  const getSubheading = () => {
    if (screen === 'roles') {
      return 'Choose your account type to access your workspace.';
    }

    if (screen === 'owner-setup') {
      return 'Create the first and only initial Product Owner account.';
    }

        if (screen === 'admin-request') {
      return 'Submit your details for Admin access approval.';
    }

    if (screen === 'admin-request-status') {
      return 'Your access request is being reviewed.';
    }

    if (screen === 'admin-create-account') {
      return 'Set up your approved Admin account credentials.';
    }

    if (screen === 'admin-forgot-password') {
      return 'Submit a password reset request to the Super Admin.';
    }

    if (screen === 'admin-reset-password') {
      return 'Enter your single-use reset token and choose a new password.';
    }

    return selectedRole === 'SUPER_ADMIN'
      ? 'Access your complete product owner workspace.'
      : 'Access your assigned client and project workspace.';
  };

  const stepLabel =
    screen === 'roles' ? 'Staff sign-in'
    : screen === 'login' ? (selectedRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin')
    : screen === 'owner-setup' ? 'First-time setup'
    : screen === 'admin-request' || screen === 'admin-request-status' ? 'Access request'
    : screen === 'admin-create-account' ? 'Account setup'
    : 'Password help';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-dv-ink/40 p-4 backdrop-blur-md animate-dv-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-access-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative my-auto grid w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-dv-float ring-1 ring-dv-line animate-dv-pop md:grid-cols-[0.92fr_1.08fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden bg-dv-ink p-10 text-white md:flex md:flex-col">
          <div aria-hidden className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-dv-iris-500/45 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-dv-coral/35 blur-3xl" />
          <div aria-hidden className="absolute inset-0 opacity-[0.08] dv-grid-lines" />

          <div className="relative flex items-center gap-2.5">
            <DvMark className="h-10 w-10" />
            <span className="font-display text-[22px] font-bold tracking-[-0.03em]">
              Digi<span className="text-[#C9BCFF]">Verse</span>
            </span>
          </div>

          <div className="relative mt-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/50">Staff workspace</p>
            <h3 className="mt-4 font-display text-[34px] font-bold leading-[1.08] tracking-[-0.035em]">
              Websites &amp; portfolios,{' '}
              <span className="font-editorial text-[1.1em] font-normal italic text-[#FFC2AE]">crafted</span>{' '}
              for every identity.
            </h3>
            <ul className="mt-8 space-y-4 text-[14px] text-white/75">
              {[
                'Five engines for sports, cultural, event, NGO and portfolio sites',
                'Share previews and collect client approval in one place',
                'Publish every website from a single workspace'
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9FE8DD]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Floating preview cards */}
          <div aria-hidden className="relative mt-auto h-40">
            <div className="absolute bottom-2 left-0 h-28 w-44 -rotate-6 rounded-2xl bg-white/95 p-3 shadow-2xl animate-dv-float">
              <div className="h-12 rounded-lg bg-gradient-to-br from-dv-iris-400 via-purple-500 to-dv-coral" />
              <div className="mt-2.5 h-2 w-24 rounded-full bg-dv-ink/70" />
              <div className="mt-1.5 h-1.5 w-32 rounded-full bg-dv-ink/15" />
            </div>
            <div className="absolute bottom-6 left-36 h-28 w-44 rotate-[5deg] rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-3 shadow-2xl animate-dv-float-slow">
              <div className="mt-8 h-2 w-20 rounded-full bg-white/85" />
              <div className="mt-1.5 h-1.5 w-28 rounded-full bg-white/50" />
            </div>
          </div>

          <div className="relative mt-6 flex items-center gap-2 text-[12px] text-white/50">
            <ShieldCheck className="h-4 w-4 text-[#9FE8DD]" />
            Restricted to authorised DigiVerse staff
          </div>
        </aside>

        {/* Form column */}
        <div className="relative max-h-[calc(100vh-2rem)] overflow-y-auto p-7 sm:p-10">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="absolute right-5 top-5 z-10 rounded-xl p-2 text-dv-muted transition hover:bg-dv-canvas hover:text-dv-ink disabled:opacity-40"
            aria-label="Close staff sign-in"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-8 md:hidden">
            <DvLogo />
          </div>

          <div className="mb-7 pr-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-dv-iris-50 px-3 py-1 text-[11px] font-semibold text-dv-iris-700 ring-1 ring-dv-iris-100">
              <span className="h-1.5 w-1.5 rounded-full bg-dv-coral" />
              {stepLabel}
            </span>
            <h2 id="staff-access-title" className="mt-4 font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-dv-ink sm:text-[32px]">
              {getHeading()}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-dv-muted">
              {getSubheading()}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] leading-5 text-rose-700 animate-dv-pop"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-dv-iris-200 bg-dv-iris-50 p-4 text-[13px] leading-5 text-dv-iris-800 animate-dv-pop"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {screen === 'roles' && (
            <div className="space-y-3">
              {([
                {
                  role: 'SUPER_ADMIN' as const,
                  title: 'Super Admin',
                  description: 'Product owner. Manages staff, access and the platform.',
                  icon: ShieldCheck,
                  tile: 'from-dv-iris-500 via-purple-500 to-dv-coral'
                },
                {
                  role: 'ADMIN' as const,
                  title: 'Admin',
                  description: 'Works with clients, builds websites and portfolios, and publishes them.',
                  icon: Users,
                  tile: 'from-emerald-400 via-teal-500 to-cyan-600'
                }
              ]).map(({ role, title, description, icon: Icon, tile }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="dv-lift group flex w-full items-center gap-4 rounded-2xl border border-dv-line bg-white p-5 text-left shadow-dv-card"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tile} text-white shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-dv-ink">{title}</span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-dv-muted">{description}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-dv-muted transition-transform group-hover:translate-x-1 group-hover:text-dv-iris-600" />
                </button>
              ))}

              <p className="pt-4 text-center text-[12px] leading-5 text-dv-muted">
                New Admin accounts and password changes are approved by the Super Admin.
              </p>
            </div>
          )}

          {screen === 'login' && (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={`${secondaryButtonClass} mb-6`}
              >
                <ArrowLeft className="h-4 w-4" />
                Change account type
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="staff-email" className={labelClass}>
                    {selectedRole === 'SUPER_ADMIN' ? 'Super Admin Username or Email' : 'Admin Username'}
                  </label>

                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
                    <input
                      id="staff-email"
                      type="text"
                      required
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                       selectedRole === 'SUPER_ADMIN' ? 'Enter your username or email' : 'Enter your username'
                      }
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="staff-password" className={labelClass}>
                    Password
                  </label>

                  {renderPasswordInput(
                    'staff-password',
                    password,
                    setPassword,
                    showPassword,
                    () => setShowPassword((previous) => !previous),
                    'Enter your password',
                    'current-password'
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Sign In to Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {selectedRole === 'SUPER_ADMIN' && setupStatusLoaded && superAdminState !== 'NONE' && (
                <details
                  open={Boolean(error)}
                  className="mt-5 rounded-xl border border-dv-line bg-white/70 p-3 text-[12px] leading-5 text-dv-muted"
                >
                  <summary className="cursor-pointer font-semibold text-dv-ink-2">
                    Can&apos;t sign in? Recovery options
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p>
                      Sign in with your Super Admin <strong>username or email</strong>. A Super Admin account cannot be created or reset from this page: recovery is done on the server by whoever controls it.
                    </p>
                    <p>
                      In the <code>server</code> folder run <code className="rounded bg-dv-iris-50 px-1">npm run auth:recover-super-admin</code> to see what is wrong, then add <code className="rounded bg-dv-iris-50 px-1">-- --reset-password --apply</code> to choose a new password.
                    </p>
                  </div>
                </details>
              )}

              {selectedRole === 'SUPER_ADMIN' && (
                <div className="mt-6 space-y-3 border-t border-dv-line pt-5">
                  {!setupStatusLoaded ? (
                    <p className="text-center text-xs text-dv-muted">
                      Checking initial setup status...
                    </p>
                  ) : setupRequired ? (
                    <>
                    {superAdminState === 'INACTIVE_ONLY' && (
                      <p className="text-center text-[11px] leading-5 text-amber-700">
                        A Super Admin account exists but is disabled. Recover it on the server first; create a new one only if that is not possible.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setScreen('owner-setup');
                        setEmail(PLATFORM_CONFIG.productEmail);
                        setPassword('');
                        setConfirmPassword('');
                        setError(null);
                        setNotice(null);
                      }}
                      className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-dv-iris-700 transition hover:text-dv-iris-700"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      First-Time Product Owner Setup
                    </button>
                    </>
                  ) : (
                    <p className="text-center text-[11px] leading-5 text-dv-muted">
                      Super Admin accounts are not created from this page. The one-time setup is already completed.
                    </p>
                  )}
                </div>
              )}

              {selectedRole === 'ADMIN' && (
                <div className="mt-6 border-t border-dv-line pt-5 space-y-3 text-center">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreen('admin-forgot-password');
                        setForgotIdentifier('');
                        setForgotReason('');
                        setError(null);
                        setNotice(null);
                      }}
                      className="text-[13px] font-semibold text-dv-iris-700 transition hover:text-dv-iris-800"
                    >
                      Forgot Password / Request Password Change
                    </button>
                  </div>

                  <div>
                    <p className="text-xs leading-6 text-dv-muted">
                      Need staff access?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setScreen('admin-request');
                          setRequestName('');
                          setRequestEmail('');
                          setRequestReason('');
                          setError(null);
                          setNotice(null);
                        }}
                        className="ml-1 font-semibold text-dv-iris-700 transition hover:text-dv-iris-800"
                      >
                        Request Admin Access
                        <ArrowRight className="ml-1 inline h-3 w-3" />
                      </button>
                    </p>
                  </div>

                  <p className="text-[10px] leading-5 text-dv-muted">
                    New Admin accounts and password changes require Super Admin approval.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Admin Access Request Form */}
{screen === 'admin-request' && (
  <>
    <button
      type="button"
      onClick={handleBack}
      disabled={loading}
      className={`${secondaryButtonClass} mb-6`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Admin Login
    </button>

    <div className="mb-5 rounded-xl border border-emerald-500/[0.24] bg-emerald-500/[0.066] p-4">
      <div className="flex items-start gap-2.5 text-xs leading-5 text-emerald-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Submit an access request to the DigiVerse Super Admin.
          You can create your Admin account after approval.
        </span>
      </div>
    </div>

    <form
      onSubmit={handleAdminRequestSubmit}
      className="space-y-5"
    >
      <div>
        <label htmlFor="request-name" className={labelClass}>
          Your Full Name
        </label>

        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />

          <input
            id="request-name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            placeholder="Enter your full name"
            className={`${inputClass} pl-11`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="request-email" className={labelClass}>
          Your Email Address
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />

          <input
            id="request-email"
            type="email"
            required
            autoComplete="email"
            value={requestEmail}
            onChange={(e) => setRequestEmail(e.target.value)}
            placeholder="Enter your email address"
            className={`${inputClass} pl-11`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="request-reason" className={labelClass}>
          Reason for Request (Optional)
        </label>
        <textarea
          id="request-reason"
          rows={3}
          maxLength={500}
          value={requestReason}
          onChange={(e) => setRequestReason(e.target.value)}
          placeholder="E.g. Client onboarding operator, cultural website content management"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={
          loading ||
          requestName.trim().length < 2 ||
          !requestEmail.trim()
        }
        className={primaryButtonClass}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting Request...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Request Admin Access
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>

    <p className="mt-5 text-center text-[10px] leading-5 text-dv-muted">
      Your request will be reviewed by the DigiVerse Super Admin.
      Once approved, you will establish your own password.
    </p>
  </>
)}

          {/* Admin Access Request Status */}
          {screen === 'admin-request-status' && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={`${secondaryButtonClass} mb-2`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Request Form
              </button>

              <div className="rounded-xl border border-dv-iris-200 bg-dv-iris-50 p-5 text-center">
                {requestStatus === 'PENDING' ? (
                  <>
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-dv-iris-700" />
                    <h3 className="font-bold text-dv-ink">
                      Waiting for Super Admin Approval
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-dv-muted">
                      Your request is pending. This page checks for updates
                      automatically.
                    </p>
                  </>
                ) : requestStatus === 'REJECTED' ? (
                  <>
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
                    <h3 className="font-bold text-dv-ink">
                      Request Rejected
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-dv-muted">
                      Your access request was not approved. Please contact
                      the DigiVerse Super Admin.
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-dv-iris-700" />
                    <h3 className="font-bold text-dv-ink">
                      Checking Request Status
                    </h3>
                  </>
                )}
              </div>

              <p className="text-center text-[10px] text-dv-muted">
                Applicant: {requestName}
              </p>
            </div>
          )}

          {/* Create Admin Account After Approval */}
          {screen === 'admin-create-account' && (
            <>
              <div className="mb-5 rounded-xl border border-emerald-500/[0.24] bg-emerald-500/[0.066] p-4">
                <div className="flex items-start gap-2.5 text-xs leading-5 text-emerald-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Your access request is approved. Create your Admin
                    username and password to continue.
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleAdminAccountSubmit}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="admin-account-name" className={labelClass}>
                    Full Name
                  </label>
                  <input
                    id="admin-account-name"
                    type="text"
                    readOnly
                    value={requestName}
                    className={`${inputClass} cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label htmlFor="admin-account-username" className={labelClass}>
                    Create Admin Username
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
                    <input
                      id="admin-account-username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={50}
                      autoComplete="username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Choose your username"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-account-password" className={labelClass}>
                    Create Password
                  </label>
                  {renderPasswordInput(
                    'admin-account-password',
                    password,
                    setPassword,
                    showPassword,
                    () => setShowPassword((previous) => !previous),
                    'Create a password (12+ characters)',
                    'new-password'
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admin-account-confirm-password"
                    className={labelClass}
                  >
                    Confirm Password
                  </label>
                  {renderPasswordInput(
                    'admin-account-confirm-password',
                    confirmPassword,
                    setConfirmPassword,
                    showConfirmPassword,
                    () => setShowConfirmPassword((previous) => !previous),
                    'Re-enter your password',
                    'new-password'
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !adminUsername.trim() ||
                    password.length < 12 ||
                    !confirmPassword
                  }
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Admin Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Create Admin Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Admin Forgot Password / Request Password Change */}
          {screen === 'admin-forgot-password' && (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={`${secondaryButtonClass} mb-6`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Login
              </button>

              <div className="mb-5 rounded-xl border border-amber-500/[0.24] bg-amber-500/[0.066] p-4">
                <div className="flex items-start gap-2.5 text-xs leading-5 text-amber-700">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Submit a password change request. The Super Admin reviews and approves your request, after which you will establish your new password.
                  </span>
                </div>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-identifier" className={labelClass}>
                    Admin Username or Registered Email
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
                    <input
                      id="forgot-identifier"
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Enter your username or email"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-reason" className={labelClass}>
                    Reason for Password Change (Optional)
                  </label>
                  <textarea
                    id="forgot-reason"
                    rows={3}
                    maxLength={500}
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    placeholder="E.g. Forgot password, quarterly credential rotation"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotIdentifier.trim()}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Submit Password Reset Request
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-dv-line pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setScreen('admin-reset-password');
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-xs text-dv-muted transition hover:text-dv-iris-700"
                >
                  Already have an approved Reset Token? Click here &rarr;
                </button>
              </div>
            </>
          )}

          {/* Admin Reset Password via Token */}
          {screen === 'admin-reset-password' && (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={`${secondaryButtonClass} mb-6`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Login
              </button>

              <div className="mb-5 rounded-xl border border-dv-iris-200 bg-dv-iris-50 p-4">
                <div className="flex items-start gap-2.5 text-xs leading-5 text-dv-iris-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Enter the single-use 64-character reset token generated upon Super Admin approval to create your new password.
                  </span>
                </div>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-token-input" className={labelClass}>
                    Password Reset Token
                  </label>
                  <input
                    id="reset-token-input"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter 64-character reset token"
                    className={`${inputClass} font-mono text-xs`}
                  />
                </div>

                <div>
                  <label htmlFor="reset-new-password" className={labelClass}>
                    New Password
                  </label>
                  {renderPasswordInput(
                    'reset-new-password',
                    password,
                    setPassword,
                    showPassword,
                    () => setShowPassword((prev) => !prev),
                    'Enter new password (12+ characters)',
                    'new-password'
                  )}
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className={labelClass}>
                    Confirm New Password
                  </label>
                  {renderPasswordInput(
                    'reset-confirm-password',
                    confirmPassword,
                    setConfirmPassword,
                    showConfirmPassword,
                    () => setShowConfirmPassword((prev) => !prev),
                    'Confirm new password',
                    'new-password'
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !resetToken.trim() || password.length < 12 || !confirmPassword}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Establish New Password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {screen === 'owner-setup' && (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className={`${secondaryButtonClass} mb-6`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Super Admin Login
              </button>

              <div className="mb-5 rounded-xl border border-amber-500/[0.24] bg-amber-500/[0.066] p-3">
                <div className="flex items-start gap-2 text-xs leading-5 text-amber-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    One-time initial setup. Only the first Product Owner
                    account can be created. No email verification or OTP is
                    required.
                  </span>
                </div>
              </div>

              <form onSubmit={handleOwnerSetup} className="space-y-4">

                <div>
                  <label htmlFor="owner-name" className={labelClass}>
                    Product Owner Name
                  </label>

                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
                    <input
                      id="owner-name"
                      type="text"
                      required
                      autoComplete="off"
                      value={setupOwnerName}
                      onChange={(e) => setSetupOwnerName(e.target.value)}
                      placeholder="Satyaki Maiti"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="owner-email" className={labelClass}>
                    Super Admin Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
                    <input
                      id="owner-email"
                      type="email"
                      required
                      autoComplete="off"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder={PLATFORM_CONFIG.productEmail}
                      className={`${inputClass} pl-11`}
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] text-dv-muted">
                    The official DigiVerse owner email is {PLATFORM_CONFIG.productEmail}. It becomes your sign-in email; any valid address is accepted.
                  </p>
                </div>

                <div>
                  <label htmlFor="owner-username" className={labelClass}>
                    New Super Admin Username
                  </label>

                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
                    <input
                      id="owner-username"
                      type="text"
                      required
                      autoComplete="off"
                      value={setupUsername}
                      onChange={(e) => setSetupUsername(e.target.value)}
                      placeholder="e.g. satyakimaiti"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-dv-muted">
                    Your unique username for logging into the Super Admin workspace.
                  </p>
                </div>

                {setupKeyRequired && (
                  <div>
                    <label htmlFor="owner-setup-key" className={labelClass}>
                      One-time Setup Key
                    </label>
                    <input
                      id="owner-setup-key"
                      type="password"
                      required
                      autoComplete="off"
                      value={setupKey}
                      onChange={(e) => setSetupKey(e.target.value)}
                      placeholder="SETUP_KEY from the server environment"
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-[11px] text-dv-muted">
                      Required because this setup is not running on the server machine itself. Use the SETUP_KEY value configured in the hosting environment.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="owner-password" className={labelClass}>
                    Create Password
                  </label>

                  {renderPasswordInput(
                    'owner-password',
                    password,
                    setPassword,
                    showPassword,
                    () => setShowPassword((previous) => !previous),
                    'Create a strong password (at least 12 characters)',
                    'new-password'
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-confirm-password"
                    className={labelClass}
                  >
                    Confirm Password
                  </label>

                  {renderPasswordInput(
                    'owner-confirm-password',
                    confirmPassword,
                    setConfirmPassword,
                    showConfirmPassword,
                    () => setShowConfirmPassword((previous) => !previous),
                    'Re-enter your password',
                    'new-password'
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Product Owner...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Create Super Admin Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[10px] leading-5 text-dv-muted">
                Secure one-time setup. Your account is created directly by
                the DigiVerse backend.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
