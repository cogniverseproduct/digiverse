
import type { SportsWebsiteData, SportsSectionType } from './sports.js';
import type { CulturalWebsiteData, CulturalSectionType, CulturalArchetype } from './cultural.js';
import type { EventWebsiteData, EventSectionType, EventCategory } from './event.js';
import type { NGOWebsiteData, NGOSectionType, NGOArchetype } from './ngo.js';
import type { PortfolioWebsiteData, PortfolioArchetype } from './portfolio.js';
export * from './portfolio.js';

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

/**
 * The 30 supported visual design model identifiers.
 */
export type DesignModelId =
  | 'cultural_heritage'
  | 'cultural_festival'
  | 'cultural_art'
  | 'puja_classic'
  | 'puja_immersive'
  | 'puja_magazine'
  | 'sports_club'
  | 'sports_tournament'
  | 'sports_academy'
  | 'health_clinic'
  | 'health_fitness'
  | 'health_holistic'
  | 'ngo_impact'
  | 'ngo_campaign'
  | 'ngo_community'
  | 'edu_institution'
  | 'edu_academy'
  | 'edu_research'
  | 'pro_corporate'
  | 'pro_network'
  | 'pro_editorial'
  | 'hobby_gallery'
  | 'hobby_community'
  | 'hobby_journal'
  | 'community_resident'
  | 'community_local'
  | 'community_civic'
  | 'custom_editorial'
  | 'custom_visual'
  | 'custom_institutional';

export type DesignSelectionMode = 'template' | 'custom_ai';

/**
 * Professional Template Selection Metadata.
 * Persists the selected template ID, version, name, and archetype.
 */
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

/**
 * Stores the design model selected during requirement collection.
 */
export interface DesignSelection {
  mode: DesignSelectionMode;
  modelId?: DesignModelId;
  modelName?: string;
  customDesignPrompt?: string;
}

/**
 * Separate Google Drive folders for images and videos.
 * Folder IDs and URLs are backend integration data and must never
 * be exposed in public website HTML.
 */
export interface GoogleDriveFolderSelection {
  folderId?: string;
  folderUrl?: string;
}

export interface GoogleDriveMediaFolders {
  images?: GoogleDriveFolderSelection;
  videos?: GoogleDriveFolderSelection;
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
  culturalArchetype?: 'cultural_society' | 'puja_committee';
  eventCategory?: EventCategory;
  ngoArchetype?: NGOArchetype;
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

  /**
   * Legacy single-folder Google Drive field.
   * Retained for backward compatibility.
   */
  googleDriveUrl?: string;

  /**
   * New separate Google Drive image and video folder configuration.
   */
  googleDriveMediaFolders?: GoogleDriveMediaFolders;

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

  /**
   * Selected design model or custom design instructions.
   */
  designSelection?: DesignSelection;

  /**
   * Selected professional template metadata.
   */
  selectedTemplate?: SelectedTemplateMetadata;

  /**
   * Legacy design instruction field.
   * Retained for backward compatibility.
   */
  designInstructions?: string;

  /**
   * Optional structured sports information supplied by the client.
   * This is not automatically populated with fabricated data.
   */
  sportsData?: SportsWebsiteData;

  /**
   * Optional structured cultural website information supplied by the client.
   * Covers cultural societies, regional associations, and puja committees.
   */
  culturalData?: CulturalWebsiteData;

  /**
   * Optional structured event website information supplied by the client.
   * Covers all 7 categories: conference, festival, corporate, exhibition,
   * wedding, award ceremony, and product launch.
   */
  eventData?: EventWebsiteData;

  /**
   * Optional structured Social & NGO website information supplied by the client.
   * Covers grassroots NGOs, institutional foundations, and cause charities.
   */
  ngoData?: NGOWebsiteData;
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

  organizationCategory?: OrganizationCategory;
  culturalArchetype?: CulturalArchetype;
  eventCategory?: EventCategory;
  ngoArchetype?: NGOArchetype;
  heroCtaText?: string;
  heroCtaLink?: string;

  // Extended Information Architecture & Layout Structure:
  themeConfig?: WebsiteThemeConfig;
  pages?: PageRoute[];
  sections?: WebsiteSectionConfig[];
  announcements?: AnnouncementItem[];
  donationsInfo?: DonationsInfo;
  navigationBar?: NavigationBarConfig;
  footerConfig?: FooterConfig;
  responsiveConfig?: ResponsiveConfig;

  /**
   * Category-specific sports website data.
   * Used by sports templates, pages and components.
   */
  sportsData?: SportsWebsiteData;

  /**
   * Category-specific cultural website data.
   * Used by cultural societies and puja committee templates.
   */
  culturalData?: CulturalWebsiteData;

  /**
   * Category-specific event website data.
   * Used by event templates across all 7 categories.
   */
  eventData?: EventWebsiteData;

  /**
   * Category-specific Social & NGO website data.
   * Used by grassroots NGOs, institutional foundations, and cause charities.
   */
  ngoData?: NGOWebsiteData;

  /**
   * Category-specific Portfolio website data.
   * Used by developer, designer, photographer, 3D artist, academic, and personal brand templates.
   */
  portfolioData?: PortfolioWebsiteData;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  websiteLanguage: string;
  createdByAdminId: string;
  assignedAdminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRevision {
  id: string;
  projectId: string;
  versionNumber: number;
  variationLabel: string;
  websiteData: GeneratedWebsite;
  isApproved: boolean;
  createdByAdminId: string;
  changelogNotes?: string;
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
    /**
     * digiverse_shared: served by the single DigiVerse deployment
     * (One Project - Many Sites). Older values are kept for existing records.
     */
    platform: 'digiverse_shared' | 'vercel' | 'digiverse_edge' | 'mock';
    deployedUrl?: string;
    siteSlug?: string;
    publishedRevisionId?: string;
    deployedAt?: string;
    vercelDeploymentId?: string;
    edgeDeploymentId?: string;
    suspendedAt?: string;
    suspensionReason?: string;
    customDomain?: string;
    deployedByAdminId?: string;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Technical checks before a website is deployed. Approval, revision locks and
 * payment status are deliberately NOT part of publishing.
 */
export interface PublishingPreflightResult {
  isReadyToPublish: boolean;
  checks: {
    hasGeneratedWebsite: boolean;
    hasValidRouting: boolean;
    isSlugAvailable?: boolean;
    /** Live mode only: the standalone site bundle was built and can be uploaded. */
    isBundleAvailable?: boolean;
  };
  blockers: string[];
  /** Slug and URL the site will be published under. */
  siteSlug?: string;
  siteUrl?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'REMOVED';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  accountStatus?: AccountStatus;
  disabledReason?: string;
  disabledAt?: string;
  lastLoginAt?: string;
  tokenVersion?: number;
  /** True for the single Product Owner among the Super Admins. */
  isPlatformOwner?: boolean;
  /** True until the person replaces a password somebody else chose for them. */
  mustChangePassword?: boolean;
  createdAt: string;
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

export type OwnershipTransferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface OwnershipTransfer {
  id: string;
  currentOwnerId: string;
  currentOwnerEmail: string;
  targetName: string;
  targetEmail: string;
  transferToken: string;
  status: OwnershipTransferStatus;
  candidateUsername?: string;
  candidatePasswordHash?: string;
  /** Account-based transfers: the existing Super Admin who must sign in and accept. */
  targetUserId?: string;
  formerOwnerAccess?: 'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN';
  expiresAt: string;
  acceptedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
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

export interface DemoInquiry {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone?: string;
  organizationType: string;
  preferredLanguage: string;
  requirements?: string;
  createdAt: string;
}

export interface MediaSource {
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
  sectionAssignment: 'hero' | 'events' | 'gallery' | 'video' | 'unassigned';
  createdAt: string;
}

export interface YouTubeVideo {
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
  videoType?: 'video' | 'playlist' | 'shorts';
  createdAt: string;
}
