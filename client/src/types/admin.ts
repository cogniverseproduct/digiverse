import type { SportsWebsiteData, SportsSectionType } from './sports';
import type { CulturalWebsiteData, CulturalSectionType } from './cultural';
import type { EventWebsiteData, EventSectionType, EventCategory } from './event';
import type { NGOWebsiteData, NGOSectionType, NGOArchetype } from './ngo';
import type { PortfolioWebsiteData, PortfolioArchetype } from './portfolio';
export * from './portfolio';

export type OrganizationCategory =
  | 'cultural'
  | 'puja_committee'
  | 'sports'
  | 'event'
  | 'health_wellness'
  | 'ngo_social'
  | 'ngo'
  | 'portfolio'
  | 'educational'
  | 'professional'
  | 'hobby_club'
  | 'community'
  | 'custom';

export type OrganizationType = OrganizationCategory;

export type TypographyStyle =
  | 'heritage'
  | 'athletic'
  | 'civic'
  | 'modern'
  | 'academic'
  | 'classic'
  | 'classical'
  | 'bilingual'
  | 'futuristic'
  | 'cinematic'
  | 'luxury'
  | 'editorial'
  | 'festive'
  | 'grassroots'
  | 'institutional'
  | 'humanist';

export type WebsiteLanguage = 'bilingual' | 'bengali' | 'english' | 'hindi';

export type DesignSelectionMode = 'template' | 'custom_ai';

export interface WebsiteDesignModel {
  id: string;
  name: string;
  description?: string;
  category: OrganizationCategory;
  sportsArchetype?: 'sports_club' | 'sports_tournament' | 'sports_academy';
  previewImageUrl?: string;
  previewUrl?: string;
}

export interface DesignSelection {
  mode: DesignSelectionMode;
  modelId?: string;
  modelName?: string;
  customDesignPrompt?: string;
}

export interface GoogleDriveFolderSelection {
  folderId?: string;
  folderUrl?: string;
}

export interface GoogleDriveMediaFolders {
  images?: GoogleDriveFolderSelection;
  videos?: GoogleDriveFolderSelection;
}

export interface SelectedTemplateMetadata {
  templateId: string;
  templateVersion: string;
  templateName: string;
  websiteCategory: 'cultural_society' | 'puja_committee' | string;
  selectedAt: string;
  designTokens?: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
    layoutPreset?: string;
  };
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface RequiredPages {
  home: boolean;
  about: boolean;
  events: boolean;
  committee: boolean;
  gallery: boolean;
  announcements?: boolean;
  donations?: boolean;
  contact: boolean;
  customPages?: string[];
}

export interface RequiredFunctionality {
  onlineInquiries: boolean;
  eventCalendar: boolean;
  photoGallery: boolean;
  youtubeVideoPlayer: boolean;
  googleDriveSync: boolean;
  donorWall?: boolean;
  memberDirectory?: boolean;
  bilingualToggle?: boolean;
}

export type ProjectStatus =
  | 'requirements_collected'
  | 'generating'
  | 'preview_ready'
  | 'awaiting_approval'
  | 'in_revision'
  | 'client_approved'
  | 'approved_for_deployment'
  | 'deployed'
  | 'deployment_failed';

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  tag?: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  department?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  iconType: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  url: string;
  category?: string;
}

export interface VideoItem {
  id: string;
  videoId: string;
  originalUrl: string;
  embedUrl: string;
  title: string;
  category: string;
  provider?: 'youtube' | 'google_drive';
  videoType?: 'video' | 'playlist' | 'shorts';
  thumbnailUrl?: string;
}

export interface ClientRequirements {
  organizationName: string;
  category: OrganizationCategory;
  sportsArchetype?: 'sports_club' | 'sports_tournament' | 'sports_academy';
  sportsData?: SportsWebsiteData;
  culturalArchetype?: 'cultural_society' | 'puja_committee';
  culturalData?: CulturalWebsiteData;
  eventCategory?: EventCategory;
  eventData?: EventWebsiteData;
  ngoArchetype?: NGOArchetype;
  ngoData?: NGOWebsiteData;
  portfolioArchetype?: PortfolioArchetype;
  portfolioData?: PortfolioWebsiteData;
  subcategory?: string;
  customCategoryName?: string;
  organizationType?: OrganizationType;

  contactPerson?: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;

  tagline: string;
  aboutText: string;

  logoUrl?: string;
  coverImageUrl?: string;
  additionalBrandingImages?: string[];

  primaryColor: string;
  accentColor: string;
  typographyStyle: TypographyStyle;

  preferredLanguage?: WebsiteLanguage;
  websiteLanguage?: WebsiteLanguage;

  // Website design selection
  designSelection?: DesignSelection;

  /**
   * Dedicated Google Drive Gallery folder URL (validated and ingested strictly for photo gallery).
   */
  googleDriveGalleryUrl?: string;

  /**
   * Dedicated Google Drive Video file URL(s) (validated and ingested for video gallery / showcases).
   */
  googleDriveVideoUrl?: string;
  googleDriveVideoUrls?: string[];

  /**
   * Dedicated YouTube Playlist URLs.
   */
  youtubePlaylistUrls?: string[];

  // Google Drive media folders
  googleDriveMediaFolders?: GoogleDriveMediaFolders;

  // Legacy field retained for backward compatibility
  googleDriveUrl?: string;

  youtubeUrls?: string[];
  socialLinks?: SocialLinks;

  requiredPages?: RequiredPages;
  requiredFunctionality?: RequiredFunctionality;

  referenceWebsites?: string[];
  additionalRequirements?: string;

  enabledSections: {
    hero: boolean;
    events: boolean;
    about: boolean;
    committee: boolean;
    gallery: boolean;
    contact: boolean;
  };

  events: EventItem[];
  committee: CommitteeMember[];
  gallery: GalleryItem[];

  designInstructions?: string;
  selectedTemplate?: SelectedTemplateMetadata;
}

export interface PageRoute {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  enabled: boolean;
  sections: string[];
}

export interface WebsiteThemeConfig {
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  themePreset: string;
}

export interface WebsiteSectionConfig {
  id: string;
  type:
    | 'hero'
    | 'about'
    | 'events'
    | 'committee'
    | 'gallery'
    | 'videos'
    | 'donations'
    | 'announcements'
    | 'contact'
    | 'custom'
    | SportsSectionType
    | CulturalSectionType
    | EventSectionType
    | NGOSectionType
    | string;
  title: string;
  subtitle?: string;
  content?: string;
  layoutStyle?: string;
  order: number;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  content: string;
  priority: 'normal' | 'urgent';
}

export interface DonationsInfo {
  causeTitle: string;
  description: string;
  goalAmount?: number;
  collectedAmount?: number;
  bankDetails?: string;
  taxExemptStatus?: string;
}

export interface NavigationBarConfig {
  logoUrl?: string;
  brandName: string;
  links: { label: string; href: string }[];
  ctaButton?: { label: string; href: string };
}

export interface FooterConfig {
  copyrightText: string;
  contactInfo: { address?: string; email?: string; phone?: string };
  socialLinks?: SocialLinks;
  quickLinks: { label: string; href: string }[];
}

export interface ResponsiveConfig {
  mobileBreakpoint: string;
  containerMaxWidth: string;
  enableStickyNav: boolean;
}

export interface GeneratedWebsite {
  themeAccent: string;
  layoutPreset: 'split' | 'grid' | 'editorial';
  fontFamily: string;
  simulatedDomain: string;
  heroHeadline: string;
  heroDescription: string;
  heroImage?: string;
  metrics: { value: string; label: string }[];
  eventsTitle: string;
  eventsList: EventItem[];
  aboutContent: string;
  committeeTitle: string;
  committeeList: CommitteeMember[];
  galleryTitle: string;
  galleryList: GalleryItem[];
  galleryPhotos?: PhotoItem[];
  featuredVideos?: VideoItem[];
  additionalBrandingImages?: string[];
  selectedTemplate?: SelectedTemplateMetadata;

  themeConfig?: WebsiteThemeConfig;
  pages?: PageRoute[];
  sections?: WebsiteSectionConfig[];
  announcements?: AnnouncementItem[];
  donationsInfo?: DonationsInfo;
  navigationBar?: NavigationBarConfig;
  footerConfig?: FooterConfig;
  responsiveConfig?: ResponsiveConfig;
  sportsData?: SportsWebsiteData;
  culturalData?: CulturalWebsiteData;
  eventData?: EventWebsiteData;
  ngoData?: NGOWebsiteData;
  portfolioData?: PortfolioWebsiteData;
}

export interface ClientProject {
  id: string;
  tenantId?: string;
  tenantSlug: string;
  requirements: ClientRequirements;
  generatedWebsite?: GeneratedWebsite;
  activeRevisionId?: string;
  approvedRevisionId?: string;
  status: ProjectStatus;
  approvalDetails?: {
    approvedBy: string;
    approvedByEmail?: string;
    approvedAt: string;
    notes?: string;
    revisionId?: string;
  };
  deploymentDetails?: {
    /** digiverse_shared = served by the single DigiVerse deployment (One Project - Many Sites). */
    platform: 'digiverse_shared' | 'vercel' | 'digiverse_edge' | 'mock';
    deployedUrl?: string;
    siteSlug?: string;
    publishedRevisionId?: string;
    suspendedAt?: string;
    deployedAt?: string;
    vercelDeploymentId?: string;
    customDomain?: string;
    deployedByAdminId?: string;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Technical checks only. Client approval, revision locks and payments do not gate publishing. */
export interface PublishingPreflightResult {
  isReadyToPublish: boolean;
  checks: {
    hasGeneratedWebsite: boolean;
    hasValidRouting: boolean;
    isSlugAvailable?: boolean;
    isBundleAvailable?: boolean;
  };
  blockers: string[];
  siteSlug?: string;
  siteUrl?: string;
}

export type PublishingMode = 'live' | 'mock' | 'not_configured';

/** The console states. `not_ready` means the site itself still needs something (see preflight blockers). */
export type PublishState = 'not_configured' | 'not_ready' | 'ready_to_publish' | 'queued' | 'building' | 'ready' | 'failed';

export interface DeploymentRecord {
  id: string;
  kind: 'publish' | 'offline';
  provider: 'vercel' | 'mock';
  /** True for local simulated deployments. They are NOT real Vercel deployments. */
  isSimulated: boolean;
  status: 'queued' | 'building' | 'ready' | 'failed' | 'canceled';
  url?: string;
  inspectorUrl?: string;
  providerDeploymentId?: string;
  revisionId?: string;
  siteSlug?: string;
  fileCount?: number;
  errorCode?: string;
  errorMessage?: string;
  triggeredByAdminId?: string;
  createdAt: string;
  readyAt?: string;
}

export interface PublishingStatus {
  mode: PublishingMode;
  state: PublishState;
  isSimulated: boolean;
  message: string;
  preflight: PublishingPreflightResult;
  hosting?: { provider: 'vercel' | 'mock'; productionUrl?: string; projectName?: string };
  liveUrl?: string;
  isLive: boolean;
  previousVersionLive: boolean;
  latestDeployment?: DeploymentRecord;
  customDomain?: string;
}

export interface PublishingConfig {
  mode: PublishingMode;
  vercelEnabled: boolean;
  tokenConfigured: boolean;
  teamConfigured: boolean;
  webhookSecretConfigured: boolean;
  mockMode: boolean;
  problems: string[];
  message: string;
}

export interface DeploymentLogLine {
  type: 'stdout' | 'stderr';
  level?: string;
  text: string;
  at?: number | string;
}

export interface SiteSeoSettings {
  title?: string;
  description?: string;
  ogImageUrl?: string;
  keywords?: string[];
  noIndex?: boolean;
  canonicalUrl?: string;
}

export type SiteDomainStatus =
  | 'awaiting_vercel_connection'
  | 'pending_verification'
  | 'misconfigured'
  | 'active'
  | 'error';

export interface SiteDomainDetails {
  verified?: boolean;
  misconfigured?: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason?: string }>;
  recommendedRecords?: Array<{ type: string; name: string; value: string }>;
  lastCheckedAt?: string;
  message?: string;
}

/** A client website served by the shared DigiVerse deployment. */
export interface PublishedSiteSummary {
  projectId: string;
  slug: string;
  status: 'live' | 'suspended';
  revisionId?: string;
  organizationName: string;
  category?: string;
  seo: SiteSeoSettings;
  customDomain?: string;
  domainStatus?: SiteDomainStatus;
  domainDetails?: SiteDomainDetails;
  publishedByAdminId?: string;
  publishedAt: string;
  updatedAt: string;
  url?: string;
  pathUrl?: string;
  hosting?: {
    platform: 'vercel' | 'mock' | 'digiverse_shared';
    simulated: boolean;
    deploymentStatus?: string;
    deploymentUpdatedAt?: string;
    url?: string;
  };
}

export interface SitesDeploymentConfig {
  runtime: 'vercel' | 'local';
  database: { driver: string; dialect: string };
  mediaStorage: 'local' | 'vercel_blob';
  publicAppUrl: string;
  routing: { pathPattern: string; sitesRootDomain: string | null; subdomainRoutingEnabled: boolean };
  customDomains: { vercelConnected: boolean };
  publishing?: PublishingConfig;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'REMOVED';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  name: string;
  isActive?: boolean;
  accountStatus?: AccountStatus;
  disabledReason?: string;
  disabledAt?: string;
  lastLoginAt?: string;
  tokenVersion?: number;
  /** True for the single Product Owner among the Super Admins. */
  isPlatformOwner?: boolean;
  /** True until the person replaces a password somebody else chose for them. */
  mustChangePassword?: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminAccessRequest {
  id: string;
  name: string;
  email: string;
  reason?: string;
  status: AccessRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  requestTokenHash?: string;
  setupTokenHash?: string;
  setupTokenExpiresAt?: string;
  accountCreatedAt?: string;
  createdUserId?: string;
}

export type PasswordResetStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'EXPIRED';

export interface AdminPasswordReset {
  id: string;
  adminId: string;
  adminEmail: string;
  adminUsername: string;
  reason?: string;
  status: PasswordResetStatus;
  resetTokenHash?: string;
  expiresAt?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  completedAt?: string;
}

export interface AdminUserProfile {
  user: User;
  assignedProjectsCount: number;
  recentActivity: AuditLogItem[];
  auditHistoryCount: number;
}

export interface ImpersonationState {
  active: boolean;
  impersonatedBy?: string;
  originalToken?: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeAdmins: number;
  disabledAdmins?: number;
  superAdmins: number;
  pendingAccessRequests?: number;
  pendingPasswordResets?: number;
  totalProjects: number;
  totalInquiries: number;
  latestAuditEvents: AuditLogItem[];
}

export interface DriveMediaItem {
  id: string;
  projectId: string;
  sourceId?: string;
  driveFileId: string;
  name: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  sizeBytes?: number;
  thumbnailUrl?: string;
  isApproved: boolean;
  sectionAssignment: 'hero' | 'events' | 'gallery' | 'unassigned';
  createdAt: string;
}

export interface YouTubeVideoItem {
  id: string;
  projectId: string;
  videoId: string;
  originalUrl: string;
  embedUrl: string;
  title: string;
  thumbnailUrl?: string;
  category: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
}

export interface MediaSourceInfo {
  id: string;
  projectId: string;
  sourceType: 'google_drive';
  folderId?: string;
  folderUrl?: string;
  status: 'connected' | 'error' | 'pending';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface PreviewToken {
  id: string;
  projectId: string;
  revisionId: string;
  token: string;
  isActive: boolean;
  viewCount?: number;
  lastViewedAt?: string;
  createdByAdminId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface ClientFeedback {
  id: string;
  projectId: string;
  revisionId: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  feedbackType: 'change_request' | 'approval' | 'rejection' | 'inquiry' | 'general';
  section?: string;
  rating?: number;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export interface CommercialScopeItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CommercialTransaction {
  id: string;
  commercialRecordId: string;
  projectId: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'cash' | 'other';
  transactionReference?: string;
  recordedByAdminId: string;
  notes?: string;
  createdAt: string;
}

export interface CommercialRecord {
  id: string;
  projectId: string;
  quotationNumber?: string;
  quotationAmount: number;
  currency: string;
  quotationStatus: 'draft' | 'sent' | 'accepted' | 'declined';
  scopeItems?: CommercialScopeItem[];
  paymentTerms?: string;
  validUntil?: string;
  paymentStatus: 'unquoted' | 'quotation_sent' | 'advance_paid' | 'fully_paid' | 'refunded';
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  invoiceStatus: 'unissued' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  amountPaid: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
  commercialStatus: 'proposal_stage' | 'negotiation' | 'contract_signed' | 'completed' | 'on_hold';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  transactions?: CommercialTransaction[];
}

export interface PlatformCommercialOverview {
  totalQuotedPipeline: number;
  totalRevenueCollected: number;
  totalOutstanding: number;
  totalInvoicesIssued: number;
  totalProjects: number;
  statusBreakdown: {
    commercialStatus: Record<string, number>;
    paymentStatus: Record<string, number>;
    quotationStatus: Record<string, number>;
  };
  recentTransactions: CommercialTransaction[];
}