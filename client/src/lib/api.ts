import { 
  AuditLogItem,
  ClientProject, 
  ClientRequirements, 
  CommercialRecord,
  CommercialScopeItem,
  PlatformCommercialOverview,
  PublishingPreflightResult,
  PublishingConfig,
  PublishingStatus,
  PublishState,
  DeploymentRecord,
  DeploymentLogLine,
  PublishedSiteSummary,
  SiteSeoSettings,
  SitesDeploymentConfig,
  DriveMediaItem, 
  MediaSourceInfo, 
  PlatformStats,
  User, 
  UserRole,
  AdminAccessRequest,
  AdminPasswordReset,
  AdminUserProfile,
  YouTubeVideoItem 
} from '../types/admin';

const TOKEN_KEY = 'digiverse_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export interface SuperAdminAccount {
  id: string;
  name: string;
  username: string | null;
  email: string;
  accountStatus: string;
  isActive: boolean;
  isOwner: boolean;
  isSelf: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  disabledReason: string | null;
  mustChangePassword: boolean;
}

export interface SuperAdminTransfer {
  id: string;
  status: string;
  targetUserId: string;
  targetName: string;
  targetEmail: string;
  currentOwnerId: string;
  currentOwnerEmail: string;
  formerOwnerAccess: 'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN';
  expiresAt: string;
  createdAt: string;
}

export interface SuperAdminDirectory {
  accounts: SuperAdminAccount[];
  summary: { total: number; active: number; ownerId: string | null };
  transfer: SuperAdminTransfer | null;
  transferRole: 'OWNER' | 'TARGET' | 'OBSERVER' | null;
  you: { id: string; isOwner: boolean };
}

export interface OrganizationOwnershipRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  projectCount: number;
  createdAt: string;
  ownerState: 'active' | 'disabled' | 'missing' | 'unassigned';
  assignedAdmin: { id: string; name: string; email: string; role: string; isActive: boolean } | null;
  createdByAdmin: { id: string; name: string; email: string; role: string; isActive: boolean } | null;
}

export const api = {
  // --- ADMIN ACCESS REQUEST WORKFLOW ---

  async submitAdminAccessRequest(payload: {
    name: string;
    email: string;
    reason?: string;
  }): Promise<{
    message: string;
    request: {
      id: string;
      name: string;
      email: string;
      reason?: string;
      status: string;
      createdAt: string;
    };
    requestToken: string;
  }> {
    const response = await fetch('/api/admin/access-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Unable to submit access request.');
    }

    return data;
  },

  async getAdminAccessRequestStatus(token: string): Promise<{
    request: {
      id: string;
      name: string;
      email: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      reviewedAt?: string;
      accountCreated: boolean;
    };
  }> {
    const response = await fetch('/api/admin/access-requests/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requestToken: token, setupToken: token })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Unable to retrieve request status.');
    }

    return data;
  },

  async completeAdminAccountSetup(payload: {
    setupToken: string;
    name?: string;
    username: string;
    password: string;
    confirmPassword: string;
  }): Promise<{
    message: string;
    user: User;
  }> {
    const response = await fetch('/api/admin/access-requests/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Unable to create Admin account.');
    }

    return data;
  },

  async completeAdminAccessRequest(payload: {
    requestToken: string;
    name: string;
    username: string;
    password: string;
    confirmPassword: string;
  }): Promise<{
    message: string;
    user: User;
  }> {
    return this.completeAdminAccountSetup({
      setupToken: payload.requestToken,
      name: payload.name,
      username: payload.username,
      password: payload.password,
      confirmPassword: payload.confirmPassword
    });
  },

  async getAdminAccessRequests(): Promise<{ requests: AdminAccessRequest[] }> {
    return fetchWithAuth('/api/admin/access-requests');
  },

  async approveAdminAccessRequest(id: string): Promise<{
    message: string;
    requestId: string;
    status: string;
    setupToken?: string;
    setupLink?: string;
  }> {
    return fetchWithAuth(`/api/admin/access-requests/${id}/approve`, {
      method: 'POST'
    });
  },

  async rejectAdminAccessRequest(id: string, reason?: string): Promise<{
    message: string;
    requestId: string;
    status: string;
  }> {
    return fetchWithAuth(`/api/admin/access-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // --- ADMIN PASSWORD RESET WORKFLOW ---

  async requestAdminPasswordReset(identifier: string, reason?: string): Promise<{
    message: string;
    requestId?: string;
  }> {
    const res = await fetch('/api/admin/password-resets/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, reason })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Unable to submit password reset request.');
    }

    return data;
  },

  async completeAdminPasswordReset(payload: {
    resetToken: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    const res = await fetch('/api/admin/password-resets/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Unable to update password.');
    }

    return data;
  },

  async getAdminPasswordResets(): Promise<{ requests: AdminPasswordReset[] }> {
    return fetchWithAuth('/api/admin/password-resets');
  },

  async approveAdminPasswordReset(id: string): Promise<{
    message: string;
    requestId: string;
    status: string;
    resetToken?: string;
    resetLink?: string;
  }> {
    return fetchWithAuth(`/api/admin/password-resets/${id}/approve`, {
      method: 'POST'
    });
  },

  async rejectAdminPasswordReset(id: string, reason?: string): Promise<{
    message: string;
    requestId: string;
    status: string;
  }> {
    return fetchWithAuth(`/api/admin/password-resets/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // --- ADMIN USER MANAGEMENT & PROFILE ---

  async getAdminUserProfile(id: string): Promise<AdminUserProfile> {
    return fetchWithAuth(`/api/admin/users/${id}/profile`);
  },

  async disableAdminUser(id: string, reason?: string): Promise<{
    message: string;
    userId: string;
    accountStatus: string;
  }> {
    return fetchWithAuth(`/api/admin/users/${id}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async enableAdminUser(id: string): Promise<{
    message: string;
    userId: string;
    accountStatus: string;
  }> {
    return fetchWithAuth(`/api/admin/users/${id}/enable`, {
      method: 'POST'
    });
  },

  async removeAdminUser(id: string, reason?: string): Promise<{
    message: string;
    userId: string;
    accountStatus: string;
  }> {
    return fetchWithAuth(`/api/admin/users/${id}/remove`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async revokeAdminSessions(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/admin/users/${id}/revoke-sessions`, {
      method: 'POST'
    });
  },

  async impersonateAdminUser(id: string, superAdminPassword: string, reason?: string): Promise<{
    message: string;
    token: string;
    user: User;
    impersonation: { active: boolean; impersonatedBy: string; expiresIn: string };
  }> {
    return fetchWithAuth(`/api/admin/users/${id}/impersonate`, {
      method: 'POST',
      body: JSON.stringify({ superAdminPassword, reason })
    });
  },

  async exitImpersonation(): Promise<{ message: string }> {
    return fetchWithAuth('/api/admin/impersonate/exit', {
      method: 'POST'
    });
  },
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed. Please verify credentials.');
    }

    const data = await res.json();
    setStoredToken(data.token);
    return data;
  },

  async updateProfile(payload: { name?: string; username?: string }): Promise<{ message: string; user: User }> {
    return fetchWithAuth('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string; token?: string; user?: User }> {
    const result = await fetchWithAuth('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Changing the password signs every session out; the server hands back a fresh token so this one survives.
    if (result?.token) setStoredToken(result.token);
    return result;
  },

  async getSecurityStatus(): Promise<{
    accountCreatedAt: string;
    lastLoginAt: string;
    passwordUpdatedAt: string;
    activeSessionsCount: number;
    recoveryEmailConfigured: boolean;
    recoveryStatusMessage: string;
  }> {
    return fetchWithAuth('/api/auth/security-status');
  },

  // ---- Super Admin Account Management (/api/super-admins) -------------------

  async getSuperAdmins(): Promise<SuperAdminDirectory> {
    return fetchWithAuth('/api/super-admins');
  },

  async createSuperAdmin(payload: {
    name: string;
    email: string;
    username?: string;
    password: string;
    confirmPassword: string;
    status: 'ACTIVE' | 'DISABLED';
    currentPassword: string;
  }): Promise<{ message: string; account: SuperAdminAccount }> {
    return fetchWithAuth('/api/super-admins', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateSuperAdminDetails(id: string, payload: {
    name?: string;
    email?: string;
    username?: string;
    currentPassword: string;
  }): Promise<{ message: string; account: SuperAdminAccount }> {
    return fetchWithAuth(`/api/super-admins/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  async changeSuperAdminPassword(id: string, payload: {
    newPassword: string;
    confirmPassword: string;
    currentPassword: string;
  }): Promise<{ message: string; account: SuperAdminAccount; token?: string }> {
    return fetchWithAuth(`/api/super-admins/${id}/password`, { method: 'POST', body: JSON.stringify(payload) });
  },

  async setSuperAdminStatus(id: string, payload: {
    status: 'ACTIVE' | 'DISABLED';
    reason?: string;
    currentPassword: string;
  }): Promise<{ message: string; account: SuperAdminAccount }> {
    return fetchWithAuth(`/api/super-admins/${id}/status`, { method: 'POST', body: JSON.stringify(payload) });
  },

  async revokeSuperAdmin(id: string, payload: {
    confirmationPhrase: string;
    currentPassword: string;
  }): Promise<{ message: string }> {
    return fetchWithAuth(`/api/super-admins/${id}/revoke`, { method: 'POST', body: JSON.stringify(payload) });
  },

  async startOwnershipTransfer(payload: {
    currentPassword: string;
    confirmationPhrase: string;
    targetUserId?: string;
    newAccount?: { name: string; email: string; username?: string; password: string; confirmPassword: string };
    formerOwnerAccess: 'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN';
  }): Promise<{ message: string; transfer: SuperAdminTransfer }> {
    return fetchWithAuth('/api/super-admins/transfer', { method: 'POST', body: JSON.stringify(payload) });
  },

  async acceptOwnershipTransfer(payload: {
    transferId: string;
    currentPassword: string;
  }): Promise<{ message: string; formerOwnerAccess: string }> {
    return fetchWithAuth('/api/super-admins/transfer/accept', { method: 'POST', body: JSON.stringify(payload) });
  },

  async cancelOwnershipTransfer(): Promise<{ message: string }> {
    return fetchWithAuth('/api/super-admins/transfer/cancel', { method: 'POST', body: JSON.stringify({}) });
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getStoredToken();
    if (!token) return null;

    try {
      const data = await fetchWithAuth('/api/auth/me');
      return data.user;
    } catch {
      clearStoredToken();
      return null;
    }
  },

  logout(): void {
    clearStoredToken();
  },

  async getProjects(): Promise<ClientProject[]> {
    const data = await fetchWithAuth('/api/projects');
    return data.projects;
  },

  async getProject(id: string): Promise<ClientProject> {
    const data = await fetchWithAuth(`/api/projects/${id}`);
    return data.project;
  },

  async createProject(requirements: ClientRequirements): Promise<ClientProject> {
    const data = await fetchWithAuth('/api/projects', {
      method: 'POST',
      body: JSON.stringify(requirements)
    });
    return data.project;
  },

  async updateProject(projectId: string, updates: Partial<ClientRequirements>): Promise<ClientProject> {
    const data = await fetchWithAuth(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.project;
  },

  async generateWebsite(projectId: string): Promise<ClientProject> {
    const data = await fetchWithAuth(`/api/projects/${projectId}/generate`, {
      method: 'POST'
    });
    return data.project;
  },

  async customizeWebsite(projectId: string, updates: Record<string, any>): Promise<ClientProject> {
    const data = await fetchWithAuth(`/api/projects/${projectId}/customize`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return data.project;
  },

  async saveSportsData(projectId: string, sportsData: any): Promise<{ project: ClientProject; sportsData: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/sports-data`, {
      method: 'PATCH',
      body: JSON.stringify({ sportsData })
    });
  },

  async saveCulturalData(projectId: string, culturalData: any): Promise<{ project: ClientProject; culturalData: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/cultural-data`, {
      method: 'PATCH',
      body: JSON.stringify({ culturalData })
    });
  },

  async saveEventData(projectId: string, eventData: any): Promise<{ project: ClientProject; eventData: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/event-data`, {
      method: 'PATCH',
      body: JSON.stringify({ eventData })
    });
  },

  async saveNGOData(projectId: string, ngoData: any): Promise<{ project: ClientProject; ngoData: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/ngo-data`, {
      method: 'PATCH',
      body: JSON.stringify({ ngoData })
    });
  },

  async submitVolunteerApplication(projectId: string, application: any): Promise<{ message: string; submission: any }> {
    const res = await fetch(`/api/projects/${projectId}/volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Volunteer application failed' }));
      throw new Error(err.error || 'Volunteer application failed');
    }
    return res.json();
  },

  async submitDonationEnquiry(projectId: string, enquiry: any): Promise<{ message: string; enquiry: any }> {
    const res = await fetch(`/api/projects/${projectId}/donation-enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiry)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Donation enquiry failed' }));
      throw new Error(err.error || 'Donation enquiry failed');
    }
    return res.json();
  },

  async submitRSVP(projectId: string, rsvp: any): Promise<{ message: string; submission: any }> {
    const res = await fetch(`/api/projects/${projectId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvp)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'RSVP submission failed' }));
      throw new Error(err.error || 'RSVP submission failed');
    }
    return res.json();
  },

  async regenerateSection(projectId: string, section: string): Promise<{ project: ClientProject; regeneratedSection: string }> {
    return fetchWithAuth(`/api/projects/${projectId}/regenerate-section`, {
      method: 'POST',
      body: JSON.stringify({ section })
    });
  },

  async getVariations(projectId: string): Promise<{ variations: any[]; activeRevisionId?: string }> {
    return fetchWithAuth(`/api/projects/${projectId}/variations`);
  },

  async createVariation(projectId: string, data: { variationLabel?: string; layoutPreset?: string; themeAccent?: string; changelogNotes?: string }): Promise<{ message: string; variation: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/variations`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async activateVariation(projectId: string, revisionId: string): Promise<{ message: string; activeRevisionId: string; project: ClientProject }> {
    return fetchWithAuth(`/api/projects/${projectId}/variations/${revisionId}/activate`, {
      method: 'POST'
    });
  },

  async deployProject(projectId: string): Promise<{ result: any; project: ClientProject }> {
    const data = await fetchWithAuth(`/api/projects/${projectId}/deploy`, {
      method: 'POST'
    });
    return data;
  },

  // --- GOOGLE DRIVE MEDIA INTEGRATIONS ---
  async connectDriveSource(projectId: string, folderUrl: string): Promise<{ 
    success: boolean; 
    source: MediaSourceInfo; 
    items: DriveMediaItem[]; 
    isMock: boolean; 
    message: string 
  }> {
    return fetchWithAuth('/api/media/drive/connect', {
      method: 'POST',
      body: JSON.stringify({ projectId, folderUrl })
    });
  },

  async syncDriveMedia(projectId: string): Promise<{ 
    success: boolean; 
    source: MediaSourceInfo; 
    items: DriveMediaItem[]; 
    isMock: boolean; 
    message: string;
    error?: string;
  }> {
    return fetchWithAuth('/api/media/drive/sync', {
      method: 'POST',
      body: JSON.stringify({ projectId })
    });
  },

  async getDriveMedia(projectId: string): Promise<{ 
    items: DriveMediaItem[]; 
    source?: MediaSourceInfo 
  }> {
    return fetchWithAuth(`/api/media/drive/items/${projectId}`);
  },

  async updateDriveMedia(id: string, sectionAssignment: string, isApproved: boolean): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/media/drive/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ sectionAssignment, isApproved })
    });
  },

  // --- YOUTUBE VIDEO INTEGRATIONS ---
  async addYouTubeVideo(projectId: string, url: string, title?: string, category?: string): Promise<{ 
    video: YouTubeVideoItem; 
    message: string 
  }> {
    return fetchWithAuth('/api/media/youtube', {
      method: 'POST',
      body: JSON.stringify({ projectId, url, title, category })
    });
  },

  async getYouTubeVideos(projectId: string): Promise<{ videos: YouTubeVideoItem[] }> {
    return fetchWithAuth(`/api/media/youtube/${projectId}`);
  },

  async deleteYouTubeVideo(id: string, projectId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/media/youtube/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ projectId })
    });
  },

  // --- SUPER ADMIN MANAGEMENT & AUDITING ---
  async getAdminUsers(): Promise<{ users: User[] }> {
    return fetchWithAuth('/api/admin/users');
  },

  async createAdminUser(data: { name: string; email: string; password: string; role?: UserRole }): Promise<{ message: string; user: User }> {
    return fetchWithAuth('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<{ message: string; userId: string; isActive: boolean }> {
    return fetchWithAuth(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  },

  async getAuditLogs(limit = 100): Promise<{ logs: AuditLogItem[] }> {
    return fetchWithAuth(`/api/admin/audit-logs?limit=${limit}`);
  },

  async getPlatformOverview(): Promise<{ stats: PlatformStats }> {
    return fetchWithAuth('/api/admin/overview');
  },

  // --- ASSET UPLOAD & CLIENT MANAGEMENT ---
  async uploadAsset(fileData: string, filename: string, assetType = 'general', mimeType = 'image/jpeg'): Promise<{ url: string; filename: string; sizeBytes?: number }> {
    return fetchWithAuth('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify({ fileData, filename, assetType, mimeType })
    });
  },

  async uploadFileAsset(file: File, assetType: 'logo' | 'hero' | 'branding' | 'general' = 'general'): Promise<{ url: string; filename: string; sizeBytes?: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await api.uploadAsset(
            reader.result as string,
            file.name,
            assetType,
            file.type || 'image/jpeg'
          );
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsDataURL(file);
    });
  },

  async registerDriveVideo(projectId: string, videoUrl: string, title?: string): Promise<{ success: boolean; item: any; message: string }> {
    return fetchWithAuth('/api/media/drive/video', {
      method: 'POST',
      body: JSON.stringify({ projectId, videoUrl, title })
    });
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async getTenants(myOnly = false): Promise<{ tenants: any[] }> {
    return fetchWithAuth(`/api/tenants?myOnly=${myOnly ? 'true' : 'false'}`);
  },

  // --- ORGANISATION OWNERSHIP ---
  async checkOrganizationName(name: string): Promise<{ status: 'available' | 'yours' | 'unavailable'; slug: string; message?: string }> {
    return fetchWithAuth(`/api/projects/name-check?name=${encodeURIComponent(name)}`);
  },

  async getOrganizationOwnership(): Promise<{ organizations: OrganizationOwnershipRow[]; admins: { id: string; name: string; email: string }[] }> {
    return fetchWithAuth('/api/tenants/ownership');
  },

  async reassignOrganization(tenantId: string, assignedAdminId: string): Promise<void> {
    await fetchWithAuth(`/api/tenants/${tenantId}`, { method: 'PATCH', body: JSON.stringify({ assignedAdminId }) });
  },

  async reassignOrganizations(fromAdminId: string, toAdminId: string): Promise<{ moved: number }> {
    return fetchWithAuth('/api/tenants/reassign', { method: 'POST', body: JSON.stringify({ fromAdminId, toAdminId }) });
  },

  // --- PHASE 7: CLIENT PREVIEW & FEEDBACK ---
  async getProjectPreviewTokens(projectId: string): Promise<{ tokens: any[] }> {
    return fetchWithAuth(`/api/projects/${projectId}/preview-tokens`);
  },

  async generatePreviewToken(projectId: string, expiresInHours = 168, revisionId?: string): Promise<{ token: any; previewUrl: string }> {
    return fetchWithAuth(`/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      body: JSON.stringify({ expiresInHours, revisionId })
    });
  },

  async revokePreviewToken(projectId: string, tokenId: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/projects/${projectId}/preview-tokens/${tokenId}/revoke`, {
      method: 'POST'
    });
  },

  async getProjectFeedback(projectId: string): Promise<{ feedback: any[]; approvalDetails?: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/feedback`);
  },

  async resolveFeedback(projectId: string, feedbackId: string, resolved = true): Promise<{ message: string; resolved: boolean }> {
    return fetchWithAuth(`/api/projects/${projectId}/feedback/${feedbackId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved })
    });
  },

  // Public Token-Authenticated Endpoints (No Admin JWT required)
  async getPublicPreview(token: string): Promise<any> {
    const res = await fetch(`/api/preview/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load preview.' }));
      throw new Error(err.error || `Preview error (${res.status})`);
    }
    return res.json();
  },

  async submitPublicFeedback(token: string, feedback: {
    authorName: string;
    authorEmail?: string;
    authorRole?: string;
    feedbackType?: string;
    section?: string;
    rating?: number;
    message: string;
  }): Promise<any> {
    const res = await fetch(`/api/preview/${token}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit feedback.' }));
      throw new Error(err.error || `Submission error (${res.status})`);
    }
    return res.json();
  },

  // --- PHASE 8: REVISION & VERSION MANAGEMENT ---
  async getRevisions(projectId: string): Promise<{
    projectId: string;
    activeRevisionId?: string;
    approvedRevisionId?: string;
    projectStatus: string;
    revisions: any[];
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions`);
  },

  async getRevision(projectId: string, revisionId: string): Promise<{ revision: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions/${revisionId}`);
  },

  async compareRevisions(projectId: string, baseRevisionId: string, targetRevisionId: string): Promise<{ diff: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions/compare?baseRevisionId=${baseRevisionId}&targetRevisionId=${targetRevisionId}`);
  },

  async rollbackRevision(projectId: string, revisionId: string): Promise<{ success: boolean; message: string; project: any; activeRevisionId: string }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions/${revisionId}/rollback`, {
      method: 'POST'
    });
  },

  async updateRevisionMetadata(projectId: string, revisionId: string, updates: { changelogNotes?: string; variationLabel?: string }): Promise<{ success: boolean; revision: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions/${revisionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async getApprovedRevision(projectId: string): Promise<{ hasApprovedRevision: boolean; approvedRevisionId?: string; approvalDetails?: any; approvedRevision?: any }> {
    return fetchWithAuth(`/api/projects/${projectId}/revisions/approved`);
  },

  // --- PHASE 9: COMMERCIAL, BILLING & QUOTATIONS ---
  async getCommercialRecord(projectId: string): Promise<{
    commercialRecord: CommercialRecord;
    clearance: {
      isClearedForDelivery: boolean;
      clearanceStatus: 'cleared' | 'advance_cleared' | 'payment_pending' | 'on_hold';
      clearanceMessage: string;
    };
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/commercial`);
  },

  async saveQuotation(projectId: string, payload: {
    quotationNumber?: string;
    quotationAmount?: number;
    currency?: string;
    quotationStatus?: 'draft' | 'sent' | 'accepted' | 'declined';
    scopeItems?: CommercialScopeItem[];
    paymentTerms?: string;
    validUntil?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    commercialRecord: CommercialRecord;
    clearance: any;
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/quotation`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async issueInvoice(projectId: string, payload: {
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    invoiceStatus?: 'unissued' | 'issued' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    commercialRecord: CommercialRecord;
    clearance: any;
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/invoice`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async recordPayment(projectId: string, payload: {
    amount: number;
    currency?: string;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    commercialRecord: CommercialRecord;
    clearance: any;
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateCommercialStatus(projectId: string, commercialStatus: string, notes?: string): Promise<{
    success: boolean;
    message: string;
    commercialRecord: CommercialRecord;
    clearance: any;
  }> {
    return fetchWithAuth(`/api/projects/${projectId}/commercial-status`, {
      method: 'PATCH',
      body: JSON.stringify({ commercialStatus, notes })
    });
  },

  async getPlatformCommercialOverview(): Promise<{ overview: PlatformCommercialOverview }> {
    return fetchWithAuth('/api/commercial/overview');
  },

  // --- PHASE 10: CLIENT APPROVAL & PUBLISHING WORKFLOW ---
  async getPublishingPreflight(projectId: string, siteSlug?: string): Promise<PublishingPreflightResult> {
    const query = siteSlug ? `?siteSlug=${encodeURIComponent(siteSlug)}` : '';
    return fetchWithAuth(`/api/projects/${projectId}/publishing/preflight${query}`);
  },

  // Publishing Console (centralized Vercel publishing). Secrets never reach the browser.
  async getPublishingConfig(): Promise<PublishingConfig> {
    return fetchWithAuth('/api/publishing/config');
  },

  async getPublishingStatus(projectId: string, siteSlug?: string): Promise<PublishingStatus> {
    const query = siteSlug ? `?siteSlug=${encodeURIComponent(siteSlug)}` : '';
    return fetchWithAuth(`/api/projects/${projectId}/publishing/status${query}`);
  },

  async publishProject(projectId: string, options: {
    siteSlug?: string;
    seo?: SiteSeoSettings;
    customDomain?: string;
  } = {}): Promise<PublishActionResult> {
    return fetchWithAuth(`/api/projects/${projectId}/publishing/publish`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  },

  async redeployProject(projectId: string): Promise<PublishActionResult> {
    return fetchWithAuth(`/api/projects/${projectId}/publishing/redeploy`, { method: 'POST', body: JSON.stringify({}) });
  },

  async unpublishProject(projectId: string, reason?: string): Promise<PublishActionResult> {
    return fetchWithAuth(`/api/projects/${projectId}/publishing/unpublish`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async getDeployments(projectId: string): Promise<{ deployments: DeploymentRecord[] }> {
    return fetchWithAuth(`/api/projects/${projectId}/publishing/deployments`);
  },

  async getDeploymentLogs(projectId: string, deploymentId: string): Promise<{ simulated: boolean; lines: DeploymentLogLine[] }> {
    return fetchWithAuth(`/api/projects/${projectId}/publishing/deployments/${encodeURIComponent(deploymentId)}/logs`);
  },

  async getLiveWebsite(slug: string): Promise<LiveWebsitePayload> {
    const res = await fetch(`/api/live/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to retrieve live website' }));
      throw new Error(err.error || `Live website unavailable (${res.status})`);
    }
    return res.json();
  },

  /** Resolves a site from a subdomain or custom-domain hostname. */
  async getLiveWebsiteByHost(host: string): Promise<LiveWebsitePayload> {
    const res = await fetch(`/api/live/by-host/${encodeURIComponent(host)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to retrieve live website' }));
      throw new Error(err.error || `Live website unavailable (${res.status})`);
    }
    return res.json();
  },

  // --- CENTRAL PUBLISHING MANAGEMENT (One Project - Many Sites) ---

  async getSitesConfig(): Promise<SitesDeploymentConfig> {
    return fetchWithAuth('/api/sites/config');
  },

  async listPublishedSites(): Promise<PublishedSiteSummary[]> {
    const data = await fetchWithAuth('/api/sites');
    return data.sites;
  },

  async getPublishedSite(projectId: string): Promise<PublishedSiteSummary | null> {
    try {
      const data = await fetchWithAuth(`/api/sites/${projectId}`);
      return data.site;
    } catch {
      return null;
    }
  },

  async updateSiteSeo(projectId: string, seo: SiteSeoSettings): Promise<{ message: string; seo: SiteSeoSettings }> {
    return fetchWithAuth(`/api/sites/${projectId}/seo`, {
      method: 'PATCH',
      body: JSON.stringify({ seo })
    });
  },

  async connectSiteDomain(projectId: string, domain: string): Promise<{ message: string; site: PublishedSiteSummary }> {
    return fetchWithAuth(`/api/sites/${projectId}/domain`, {
      method: 'POST',
      body: JSON.stringify({ domain })
    });
  },

  async refreshSiteDomain(projectId: string): Promise<{ message: string; site: PublishedSiteSummary }> {
    return fetchWithAuth(`/api/sites/${projectId}/domain/refresh`, { method: 'POST' });
  },

  async removeSiteDomain(projectId: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/sites/${projectId}/domain`, { method: 'DELETE' });
  }
};

export interface PublishActionResult {
  success: boolean;
  message: string;
  state: PublishState;
  deployment?: DeploymentRecord;
  status: PublishingStatus;
  deployedUrl?: string;
  project: ClientProject;
}

export interface LiveWebsitePayload {
  success: boolean;
  slug: string;
  organizationName: string;
  category: string;
  generatedWebsite: any;
  seo?: SiteSeoSettings;
  deploymentDetails: any;
  publishedAt: string;
}
