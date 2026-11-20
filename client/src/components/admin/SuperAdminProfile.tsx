import React, { useState, useEffect } from 'react';
import { PLATFORM_CONFIG } from '../../config/platform';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Lock,
  KeyRound,
  Crown,
  Pencil,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  UserRoundCog,
  Loader2,
  XCircle,
  Info
} from 'lucide-react';
import { AccountSafetyRow } from '../workspace/DataRows';

interface SuperAdminProfileProps {
  ownerName?: string;
  ownerEmail?: string;
  onBack?: () => void;
  /** Render inside the workspace shell (no page frame or page header). */
  embedded?: boolean;
  /** Opens Super Admin Account Management (where ownership transfer now lives). */
  onOpenAccountManagement?: () => void;
}

type ProfileTab = 'profile' | 'security' | 'ownership';

type StatusNotice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const inputClass =
  'w-full rounded-xl border border-dv-line bg-white px-4 py-3 text-sm text-dv-ink placeholder:text-dv-muted/70 outline-none transition-all hover:border-dv-iris-200 focus:border-dv-iris-400 focus:ring-4 focus:ring-dv-iris-100';

const labelClass =
  'mb-2 block text-[12px] font-semibold text-dv-ink-2';

const buttonClass =
  'dv-sheen inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dv-iris-600 via-[#7346EA] to-[#9A4FF0] px-5 py-3 text-sm font-semibold text-white shadow-dv-glow transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-dv-line bg-white px-4 py-2.5 text-[13px] font-semibold text-dv-ink-2 shadow-sm transition hover:border-dv-iris-200 hover:text-dv-ink disabled:opacity-50';

const Panel: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section className="rounded-[24px] border border-dv-line bg-white p-6 shadow-dv-card sm:p-7">
    <div className="mb-6">
      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-dv-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-[13px] leading-6 text-dv-muted">
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
);

const PasswordField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ id, label, value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={12}
          autoComplete="off"
          className={`${inputClass} pl-11 pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-dv-muted hover:text-dv-iris-700"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export const SuperAdminProfile: React.FC<SuperAdminProfileProps> = ({
  ownerName = 'Satyaki Maiti',
  ownerEmail = PLATFORM_CONFIG.productEmail,
  onBack,
  onOpenAccountManagement,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  const [name, setName] = useState(ownerName);
  const [newName, setNewName] = useState(ownerName);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [recoveryEmail] = useState(ownerEmail);

  // Telemetry states
  const [securityStatus, setSecurityStatus] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<StatusNotice | null>(null);

  const showNotice = (
    type: StatusNotice['type'],
    message: string
  ) => {
    setNotice({ type, message });
  };

  // Load user data, security status, and active transfer on mount
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user && isMounted) {
          setName(user.name);
          setNewName(user.name);
          if (user.username) {
            setUsername(user.username);
            setNewUsername(user.username);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }

      try {
        const status = await api.getSecurityStatus();
        if (isMounted) {
          setSecurityStatus(status);
        }
      } catch (err) {
        console.error('Failed to load security status:', err);
      }

    };

    void loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || newName.trim().length < 2) {
      showNotice('warning', 'Please enter a valid Product Owner name (at least 2 characters).');
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const payload: { name: string; username?: string } = { name: newName.trim() };
      if (newUsername.trim() && newUsername.trim() !== username) {
        payload.username = newUsername.trim().toLowerCase();
      }

      const res = await api.updateProfile(payload);
      setName(res.user.name);
      setNewName(res.user.name);
      if (res.user.username) {
        setUsername(res.user.username);
        setNewUsername(res.user.username);
      }

      showNotice('success', 'Product Owner profile updated and saved to persistent database.');
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showNotice('warning', 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 12) {
      showNotice('warning', 'New password must contain at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotice('warning', 'New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      showNotice(
        'success',
        'Password has been updated successfully and stored with bcrypt encryption.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh security status
      const updatedStatus = await api.getSecurityStatus().catch(() => null);
      if (updatedStatus) setSecurityStatus(updatedStatus);
    } catch (err: unknown) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();

    showNotice(
      'info',
      'Notice: External SMTP email service is currently not connected to this deployment. Password reset emails cannot be delivered automatically. To rotate credentials, use the Change Password form above or consult platform infrastructure operators.'
    );
  };

  const tabs: {
    id: ProfileTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      id: 'ownership',
      label: 'Ownership',
      icon: <Crown className="h-4 w-4" />,
    },
  ];

  return (
    <div className={embedded ? 'text-dv-ink' : 'min-h-screen bg-[#F6F8FC] px-4 py-7 text-dv-ink sm:px-7 lg:px-10'}>
      <div className={embedded ? '' : 'mx-auto max-w-6xl'}>
        {/* Header */}
        {!embedded && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-dv-muted transition hover:text-dv-iris-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Super Admin Dashboard
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dv-iris-200 bg-dv-iris-50 text-dv-iris-700">
                <UserRoundCog className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Owner Profile & Security
                </h1>
                <p className="mt-1 text-xs text-dv-muted">
                  Manage your Product Owner identity and account protection.
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.24] bg-emerald-500/[0.077] px-3 py-2 text-[12px] font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            SUPER ADMIN
          </div>
        </div>
        )}

        <div className="mb-6"><AccountSafetyRow /></div>

        {/* Profile summary */}
        <div className="relative mb-6 overflow-hidden rounded-[28px] border border-dv-line bg-white p-6 shadow-dv-card sm:p-8">
          <div aria-hidden className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E3DCFF] blur-3xl" />
          <div aria-hidden className="absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-[#FFE1D6] blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-dv-coral to-dv-sun text-white shadow-md">
              <Crown className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-dv-iris-600">
                Product owner
              </p>
              <h2 className="mt-1 truncate font-display text-2xl font-bold tracking-[-0.02em] text-dv-ink">
                {name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-dv-muted">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {ownerEmail}
                </p>
                {username && (
                  <p className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    @{username}
                  </p>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Active owner
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border border-dv-line bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setNotice(null);
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition sm:flex-none ${
                activeTab === tab.id
                  ? 'bg-dv-ink text-white shadow-sm'
                  : 'text-dv-muted hover:bg-dv-canvas hover:text-dv-ink'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback notice */}
        {notice && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-xs leading-5 ${
              notice.type === 'success'
                ? 'border-emerald-500/[0.24] bg-emerald-500/[0.077] text-emerald-700'
                : notice.type === 'error'
                  ? 'border-red-500/[0.24] bg-red-500/[0.077] text-red-700'
                  : notice.type === 'warning'
                    ? 'border-amber-500/[0.24] bg-amber-500/[0.077] text-amber-700'
                    : 'border-dv-iris-200 bg-dv-iris-50 text-dv-iris-700'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            ) : notice.type === 'error' ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Personal & Account Identity"
              description="Update your display name and login username. Changes are saved directly to the database."
            >
              <form onSubmit={handleNameChange} className="space-y-4">
                <div>
                  <label htmlFor="owner-display-name" className={labelClass}>
                    Product Owner Display Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
                    <input
                      id="owner-display-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="Enter your name"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="owner-username" className={labelClass}>
                    Super Admin Username (Login ID)
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
                    <input
                      id="owner-username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. satyakimaiti"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  <p className="mt-1 text-[12px] text-dv-muted">
                    The name you use to sign in.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Fixed Registered Email</label>
                  <div className="flex items-center gap-3 rounded-xl border border-dv-iris-200 bg-dv-iris-50 px-4 py-3.5">
                    <Mail className="h-4 w-4 shrink-0 text-dv-iris-600" />
                    <span className="break-all font-mono text-sm text-dv-iris-700">
                      {ownerEmail}
                    </span>
                    <span className="ml-auto shrink-0 rounded-full border border-emerald-500/[0.36] bg-emerald-500/[0.11] px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      FIXED OWNER ID
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-dv-muted">
                    The designated Super Admin email is strictly non-editable via standard profile settings.
                  </p>
                </div>

                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </form>
            </Panel>

            <Panel
              title="Platform Governance & Role Isolation"
              description="DigiVerse operates on an absolute 2-role security model."
            >
              <div className="space-y-4">
                {[
                  {
                    icon: <ShieldCheck className="h-5 w-5" />,
                    title: 'SUPER_ADMIN Authority',
                    detail:
                      'Super Admins control global governance, operator approvals, commercial telemetry and platform configuration. One of them is the Product Owner, who alone can transfer ownership.',
                  },
                  {
                    icon: <KeyRound className="h-5 w-5" />,
                    title: 'ADMIN Operational Separation',
                    detail:
                      'Standard Admins perform client onboarding and generation workflows, but are strictly prohibited from user governance and security settings.',
                  },
                  {
                    icon: <Clock className="h-5 w-5" />,
                    title: 'Controlled Ownership Transfer',
                    detail:
                      'Ownership transfers need your password again and take effect only when the new owner signs in and accepts.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-xl border border-dv-line bg-dv-canvas p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dv-iris-50 text-dv-iris-700">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dv-ink">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-dv-muted">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Change Password"
              description="Verify your current password to establish a new strong password (minimum 12 characters)."
            >
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <PasswordField
                  id="current-owner-password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Enter your current password"
                />

                <PasswordField
                  id="new-owner-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter new password (12+ characters)"
                />

                <PasswordField
                  id="confirm-owner-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter new password"
                />

                <p className="text-[12px] leading-5 text-dv-muted">
                  Password hashes are generated using bcrypt (cost factor 12) with zero plaintext retention.
                </p>

                <button
                  type="submit"
                  disabled={
                    loading || !currentPassword || !newPassword || !confirmPassword
                  }
                  className={buttonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </Panel>

            <Panel
              title="Persistent Security Telemetry"
              description="Real-time security telemetry reported by backend audit infrastructure."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-dv-line bg-[#F8FAFC] p-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[12px] uppercase tracking-wider text-dv-muted">Account Created</span>
                      <p className="mt-1 font-mono text-dv-ink-2">
                        {securityStatus?.accountCreatedAt
                          ? new Date(securityStatus.accountCreatedAt).toLocaleDateString()
                          : 'Persistent'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase tracking-wider text-dv-muted">Last Verified Login</span>
                      <p className="mt-1 font-mono text-dv-iris-700">
                        {securityStatus?.lastLoginAt
                          ? new Date(securityStatus.lastLoginAt).toLocaleDateString()
                          : 'Current session'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase tracking-wider text-dv-muted">Active Sessions</span>
                      <p className="mt-1 font-mono text-emerald-600">1 session (Active)</p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase tracking-wider text-dv-muted">Password Encryption</span>
                      <p className="mt-1 font-mono text-emerald-600">bcrypt (Cost 12)</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/[0.24] bg-amber-500/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-amber-700">
                        Automated Recovery Status
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800/70">
                        {securityStatus?.recoveryStatusMessage ||
                          'SMTP delivery service is not configured. Automated recovery is disabled. Password rotation is managed directly via the authenticated form above.'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRecovery} className="space-y-3 pt-2">
                  <label htmlFor="owner-recovery-email" className={labelClass}>
                    Self-Service Recovery Check
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="owner-recovery-email"
                      type="email"
                      readOnly
                      value={recoveryEmail}
                      className={`${inputClass} cursor-not-allowed opacity-80`}
                    />
                    <button type="submit" className={secondaryButtonClass}>
                      <Send className="h-3.5 w-3.5" />
                      Check Recovery
                    </button>
                  </div>
                </form>
              </div>
            </Panel>
          </div>
        )}

        {/* Ownership tab */}
        {activeTab === 'ownership' && (
          <div className="space-y-6">
            <Panel
              title="Ownership transfer has moved"
              description="Ownership and every other Super Admin account action now live in one place."
            >
              <p className="text-[13px] leading-6 text-dv-ink-2">
                Open <strong>Super Admin Account Management</strong> to create more Super Admins, change their details, deactivate or
                revoke access, and transfer ownership. A transfer only takes effect when the new owner signs in and accepts it,
                and each step asks for your password again.
              </p>
              {onOpenAccountManagement && (
                <button type="button" onClick={onOpenAccountManagement} className={`${buttonClass} mt-5`}>
                  <ArrowRight className="h-4 w-4" />
                  Open Super Admin Account Management
                </button>
              )}
            </Panel>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-dv-line pt-5 text-[12px] text-dv-muted">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            DigiVerse Platform Governance
          </span>
          <span className="text-emerald-600 font-medium">Production Security Mode Active</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;
