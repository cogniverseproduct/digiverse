import React, { useState, useEffect } from 'react';
import { Button } from '../ui/dv/Button';
import {
  User,
  AuditLogItem,
  PlatformStats,
  PlatformCommercialOverview,
  AdminAccessRequest,
  AdminPasswordReset
} from '../../types/admin';
import { api, type SuperAdminDirectory } from '../../lib/api';
import SuperAdminProfile from './SuperAdminProfile';
import { AdminProfileModal } from './AdminProfileModal';
import {
  ShieldCheck,
  Users,
  Activity,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Mail,
  UserCircle,
  Inbox,
  KeyRound,
  X,
  AlertTriangle,
  Loader2,
  Globe,
  Building2,
  LayoutDashboard,
  ArrowRightLeft
} from 'lucide-react';
import { PublishedSitesPanel } from './PublishedSitesPanel';
import { WorkspaceShell, type WorkspaceNavSection } from '../workspace/WorkspaceShell';
import { Eyebrow } from '../ui/dv/Ambient';
import { SuperAdminOverview } from '../workspace/SuperAdminOverview';
import { AdminAccountsPanel, AccessRequestsPanel, PasswordResetsPanel, AuditTrailPanel, OrganizationsPanel } from '../workspace/SuperAdminPanels';
import { Dialog, CopyField, fieldClass } from '../workspace/Dialog';
import { SuperAdminAccountsPanel, type SuperAdminAccountsView } from '../workspace/SuperAdminAccountsPanel';
import { isValidEmail } from '../../lib/email';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
  onExitToPublic: () => void;
  onImpersonateSuccess?: (token: string, targetUser: User) => void;
}

type DashboardTab = 'overview' | 'admins' | 'organisations' | 'access-requests' | 'password-resets' | 'sites' | 'audit' | 'sa-accounts' | 'sa-create' | 'sa-transfer';

const SA_VIEW_BY_TAB: Record<string, SuperAdminAccountsView> = { 'sa-accounts': 'accounts', 'sa-create': 'create', 'sa-transfer': 'transfer' };
const SA_TAB_BY_VIEW: Record<SuperAdminAccountsView, DashboardTab> = { accounts: 'sa-accounts', create: 'sa-create', transfer: 'sa-transfer' };

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  user,
  onLogout,
  onExitToPublic,
  onImpersonateSuccess
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AdminAccessRequest[]>([]);
  const [passwordResets, setPasswordResets] = useState<AdminPasswordReset[]>([]);
  const [commercialOverview, setCommercialOverview] = useState<PlatformCommercialOverview | null>(null);
  const [superAdminDirectory, setSuperAdminDirectory] = useState<SuperAdminDirectory | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile modal states
  const [showProfile, setShowProfile] = useState(false);
  const [selectedAdminForProfile, setSelectedAdminForProfile] = useState<User | null>(null);

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ setupLink: string; setupToken: string } | null>(null);

  // Link Dialog states for approvals
  const [generatedLinkNotice, setGeneratedLinkNotice] = useState<{
    title: string;
    description: string;
    link: string;
    expiresIn: string;
  } | null>(null);

  // Rejection Dialog states
  const [rejectDialog, setRejectDialog] = useState<{
    type: 'access' | 'reset';
    id: string;
    label: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewData, usersData, logsData, accessData, resetData, commData, saData] =
        await Promise.all([
          api.getPlatformOverview(),
          api.getAdminUsers(),
          api.getAuditLogs(100),
          api.getAdminAccessRequests().catch(() => ({ requests: [] })),
          api.getAdminPasswordResets().catch(() => ({ requests: [] })),
          api.getPlatformCommercialOverview().catch(() => ({ overview: null })),
          api.getSuperAdmins().catch(() => null)
        ]);

      setSuperAdminDirectory(saData);

      setStats(overviewData.stats);
      setUsersList(usersData.users);
      setAuditLogs(logsData.logs);
      setAccessRequests(accessData.requests || []);
      setPasswordResets(resetData.requests || []);

      if (commData?.overview) {
        setCommercialOverview(commData.overview);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load platform administration telemetry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert('Unable to copy link to clipboard.');
    }
  };

  // Submit direct invite
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);

    const name = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();

    if (!name || !email) {
      setInviteError('Please provide both staff member name and email address.');
      setInviteLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setInviteError('Please enter a valid email address.');
      setInviteLoading(false);
      return;
    }

    try {
      const res = await api.createAdminUser({ name, email, password: '' });
      const setupLink = (res as any).setupLink || `/staff-portal?setupToken=${(res as any).setupToken}`;
      const setupToken = (res as any).setupToken || '';

      setInviteResult({ setupLink, setupToken });
      await loadData();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to generate Admin invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteError(null);
    setInviteResult(null);
  };

  // Approve access request
  const handleApproveAccessRequest = async (id: string, name: string) => {
    setError(null);
    try {
      const res = await api.approveAdminAccessRequest(id);
      const fullUrl = `${window.location.origin}${res.setupLink || `/staff-portal?setupToken=${res.setupToken}`}`;
      setGeneratedLinkNotice({
        title: `Admin Access Request Approved: ${name}`,
        description: 'A single-use, 48-hour account setup link has been generated. Provide this link to the applicant so they can establish their own username and confidential password.',
        link: fullUrl,
        expiresIn: '48 Hours'
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve access request.');
    }
  };

  // Reject access request
  const handleConfirmReject = async () => {
    if (!rejectDialog) return;
    setRejectLoading(true);
    setError(null);

    try {
      if (rejectDialog.type === 'access') {
        await api.rejectAdminAccessRequest(rejectDialog.id, rejectReason.trim() || undefined);
      } else {
        await api.rejectAdminPasswordReset(rejectDialog.id, rejectReason.trim() || undefined);
      }
      setRejectDialog(null);
      setRejectReason('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.');
    } finally {
      setRejectLoading(false);
    }
  };

  // Approve password reset
  const handleApprovePasswordReset = async (id: string, username: string) => {
    setError(null);
    try {
      const res = await api.approveAdminPasswordReset(id);
      const fullUrl = `${window.location.origin}${res.resetLink || `/staff-portal?resetToken=${res.resetToken}`}`;
      setGeneratedLinkNotice({
        title: `Password Reset Request Approved: @${username}`,
        description: 'A single-use, 24-hour password reset link has been generated. Provide this link to the Admin so they can securely establish their new password.',
        link: fullUrl,
        expiresIn: '24 Hours'
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve password reset.');
    }
  };

  const pendingAccessCount = accessRequests.filter((r) => r.status === 'PENDING').length;
  const pendingResetCount = passwordResets.filter((r) => r.status === 'PENDING').length;

  const TAB_META: Record<DashboardTab, { title: string; subtitle: string }> = {
    overview: { title: 'Platform overview', subtitle: 'Health, activity and governance across the whole DigiVerse platform.' },
    organisations: { title: 'Organisations', subtitle: 'Who owns each client organisation. Assign organisations whose owner is disabled or removed to an active Admin.' },
    admins: { title: 'Admin accounts', subtitle: 'Invite, review, disable or remove the people who operate DigiVerse.' },
    'access-requests': { title: 'Access requests', subtitle: 'People asking to join as Admins. Approving creates a single-use setup link.' },
    'password-resets': { title: 'Password resets', subtitle: 'Admins asking for a new password. Approving creates a 24-hour reset link.' },
    sites: { title: 'Published websites', subtitle: 'Every client website served by DigiVerse, with its address, domain and status.' },
    audit: { title: 'Audit trail', subtitle: 'A record of sensitive actions taken across the platform.' },
    'sa-accounts': { title: 'Super Admin accounts', subtitle: 'Everyone with Super Admin access. Change details, deactivate or revoke, always with your password.' },
    'sa-create': { title: 'Create a Super Admin', subtitle: 'Give another trusted person Super Admin access. Any valid email address works.' },
    'sa-transfer': { title: 'Transfer ownership', subtitle: 'Hand the Product Owner role to another Super Admin. It takes effect only when they accept.' }
  };

  const tabItem = (id: DashboardTab, label: string, icon: React.ElementType, extra: { count?: number; attention?: boolean } = {}) => ({
    id,
    label,
    icon,
    active: !showProfile && activeTab === id,
    onSelect: () => {
      setShowProfile(false);
      setActiveTab(id);
    },
    ...extra
  });

  const navSections: WorkspaceNavSection[] = [
    {
      label: 'Platform',
      items: [
        tabItem('overview', 'Overview', LayoutDashboard),
        tabItem('sites', 'Published websites', Globe),
        tabItem('audit', 'Audit trail', Activity)
      ]
    },
    {
      label: 'People',
      items: [
        tabItem('admins', 'Admin accounts', Users, { count: usersList.length }),
        tabItem('organisations', 'Organisations', Building2),
        tabItem('access-requests', 'Access requests', Inbox, { count: pendingAccessCount, attention: pendingAccessCount > 0 }),
        tabItem('password-resets', 'Password resets', KeyRound, { count: pendingResetCount, attention: pendingResetCount > 0 })
      ]
    },
    {
      label: 'Super Admin Account Management',
      items: [
        tabItem('sa-accounts', 'View Super Admins', ShieldCheck, { count: superAdminDirectory?.summary.total }),
        tabItem('sa-create', 'Create Super Admin', UserPlus),
        tabItem('sa-transfer', 'Transfer ownership', ArrowRightLeft, { attention: superAdminDirectory?.transferRole === 'TARGET' })
      ]
    }
  ];

  return (
    <>
      <WorkspaceShell
        roleLabel="Super Admin"
        roleTone="coral"
        userName={user.name}
        userHandle={user.username || user.email}
        sections={navSections}
        accountItems={[
          { id: 'profile', label: 'Profile & security', icon: UserCircle, active: showProfile, onSelect: () => setShowProfile(true) }
        ]}
        title={showProfile ? 'Profile & security' : TAB_META[activeTab].title}
        subtitle={showProfile ? 'Your identity, password and security.' : TAB_META[activeTab].subtitle}
        eyebrow={<Eyebrow icon={ShieldCheck}>Product owner console</Eyebrow>}
        onExitToPublic={onExitToPublic}
        onLogout={onLogout}
        actions={
          <>
            <button
              onClick={loadData}
              className="rounded-xl border border-dv-line bg-white p-2 text-dv-muted shadow-sm transition hover:text-dv-ink"
              aria-label="Refresh data"
              type="button"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button size="sm" onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite Admin</span>
            </Button>
          </>
        }
      >
        <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl border border-red-500/40 bg-red-50 text-red-700 text-xs flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-dv-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showProfile && (
          <SuperAdminProfile
            ownerName={user.name}
            ownerEmail={user.email}
            embedded
            onOpenAccountManagement={() => { setShowProfile(false); setActiveTab('sa-transfer'); }}
          />
        )}

        {/* ---------------- TAB 1: OVERVIEW ---------------- */}
        {!showProfile && activeTab === 'overview' && (
          <SuperAdminOverview
            ownerName={user.name}
            stats={stats}
            users={usersList}
            accessRequests={accessRequests}
            passwordResets={passwordResets}
            auditLogs={auditLogs}
            commercial={commercialOverview}
            loading={loading}
            onNavigate={setActiveTab}
            onInvite={() => setInviteModalOpen(true)}
          />
        )}

        {!showProfile && activeTab === 'admins' && (
          <AdminAccountsPanel
            users={usersList}
            currentUserId={user.id}
            loading={loading}
            onManage={(u) => setSelectedAdminForProfile(u)}
            onInvite={() => setInviteModalOpen(true)}
          />
        )}

        {!showProfile && activeTab === 'organisations' && <OrganizationsPanel />}

        {!showProfile && activeTab === 'access-requests' && (
          <AccessRequestsPanel
            requests={accessRequests}
            onApprove={handleApproveAccessRequest}
            onReject={(id, name) => setRejectDialog({ type: 'access', id, label: name })}
          />
        )}

        {!showProfile && activeTab === 'password-resets' && (
          <PasswordResetsPanel
            resets={passwordResets}
            onApprove={handleApprovePasswordReset}
            onReject={(id, username) => setRejectDialog({ type: 'reset', id, label: `@${username}` })}
          />
        )}

        {!showProfile && activeTab === 'sites' && <PublishedSitesPanel showHeader={false} />}

        {!showProfile && activeTab === 'audit' && <AuditTrailPanel logs={auditLogs} />}

        {!showProfile && SA_VIEW_BY_TAB[activeTab] && (
          <SuperAdminAccountsPanel
            view={SA_VIEW_BY_TAB[activeTab]}
            onViewChange={(view) => setActiveTab(SA_TAB_BY_VIEW[view])}
            onChanged={loadData}
            onSessionEnded={onLogout}
          />
        )}
        </div>
      </WorkspaceShell>

      {/* Admin Profile Modal */}
      {selectedAdminForProfile && (
        <AdminProfileModal
          adminUser={selectedAdminForProfile}
          isOpen={true}
          onClose={() => setSelectedAdminForProfile(null)}
          onRefresh={loadData}
          onImpersonateSuccess={onImpersonateSuccess}
        />
      )}

      {/* Generated setup / reset link */}
      <Dialog
        open={Boolean(generatedLinkNotice)}
        onClose={() => setGeneratedLinkNotice(null)}
        icon={CheckCircle2}
        tone="emerald"
        title={generatedLinkNotice?.title}
        description={generatedLinkNotice?.description}
        footer={<Button variant="secondary" onClick={() => setGeneratedLinkNotice(null)}>Done</Button>}
      >
        {generatedLinkNotice && (
          <div className="space-y-3">
            <CopyField
              label={`Single-use link · valid for ${generatedLinkNotice.expiresIn.toLowerCase()}`}
              value={generatedLinkNotice.link}
              copied={copiedLink}
              onCopy={() => handleCopyLink(generatedLinkNotice.link)}
            />
            <p className="text-[12px] leading-5 text-dv-muted">
              Emails are not sent automatically yet. Share this link with the person directly and privately.
            </p>
          </div>
        )}
      </Dialog>

      {/* Reject request */}
      <Dialog
        open={Boolean(rejectDialog)}
        onClose={() => {
          setRejectDialog(null);
          setRejectReason('');
        }}
        busy={rejectLoading}
        icon={AlertTriangle}
        tone="rose"
        size="sm"
        title={rejectDialog?.type === 'access' ? 'Reject access request?' : 'Reject password reset?'}
        description={
          rejectDialog ? (
            <>The request from <span className="font-semibold text-dv-ink">{rejectDialog.label}</span> will be declined. This cannot be undone.</>
          ) : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectDialog(null);
                setRejectReason('');
              }}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmReject} disabled={rejectLoading} className="bg-none bg-rose-600 shadow-none hover:bg-rose-700">
              {rejectLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject request
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold text-dv-ink-2">Reason (optional)</span>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="For example: duplicate request, details could not be verified"
            className={fieldClass}
          />
        </label>
      </Dialog>

      {/* Invite Admin */}
      <Dialog
        open={inviteModalOpen}
        onClose={closeInviteModal}
        busy={inviteLoading}
        icon={inviteResult ? CheckCircle2 : UserPlus}
        tone={inviteResult ? 'emerald' : 'iris'}
        title={inviteResult ? 'Invitation ready' : 'Invite an Admin'}
        description={
          inviteResult
            ? <>Share this link with <span className="font-semibold text-dv-ink">{inviteName}</span> ({inviteEmail}). They will choose their own username and password.</>
            : 'You never set or see staff passwords. The invitee receives a 48-hour link to create their own account.'
        }
        footer={
          inviteResult ? (
            <Button onClick={closeInviteModal}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={closeInviteModal} disabled={inviteLoading}>Cancel</Button>
              <Button type="submit" form="invite-admin-form" disabled={inviteLoading}>
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Create invitation link
              </Button>
            </>
          )
        }
      >
        {inviteError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {inviteError}
          </div>
        )}

        {inviteResult ? (
          <CopyField
            label="Setup link · valid for 48 hours"
            value={`${window.location.origin}${inviteResult.setupLink}`}
            copied={copiedLink}
            onCopy={() => handleCopyLink(`${window.location.origin}${inviteResult.setupLink}`)}
          />
        ) : (
          <form id="invite-admin-form" onSubmit={handleInviteSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-dv-ink-2">Full name</span>
              <input
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Ananya Sen"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-dv-ink-2">Email address</span>
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
                className={fieldClass}
              />
            </label>
          </form>
        )}
      </Dialog>
    </>
  );
};

export default SuperAdminDashboard;
