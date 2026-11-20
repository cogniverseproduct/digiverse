/**
 * DigiVerse — Social & NGO Website Creation Engine Domain Models (Client-Side)
 *
 * This module defines data structures for all 3 Social & NGO archetypes:
 * 1. Grassroots Social Impact & Community NGO (Goonj parity)
 * 2. Institutional Foundation & Trust (Obama Foundation parity)
 * 3. Cause-Driven Visual Storytelling & Charity (charity: water parity)
 */

export type NGOArchetype =
  | 'grassroots_ngo'
  | 'institutional_foundation'
  | 'cause_charity';

export type NGOSectionType =
  | 'grassroots_hero'
  | 'foundation_hero'
  | 'charity_water_hero'
  | 'ngo_programs'
  | 'ngo_impact_stats'
  | 'ngo_campaigns'
  | 'ngo_causes'
  | 'ngo_leadership'
  | 'ngo_volunteering'
  | 'ngo_collection_centers'
  | 'ngo_donation'
  | 'ngo_stories'
  | 'ngo_reports'
  | 'ngo_partners'
  | 'ngo_faqs'
  | 'ngo_gallery'
  | 'ngo_contact';

export type NGOTypographyStyle =
  | 'grassroots'
  | 'institutional'
  | 'humanist'
  | 'editorial'
  | 'modern';

export interface NGOProfile {
  name: string;
  legalRegisteredName?: string;
  registrationNumber?: string;
  fcraRegistrationNumber?: string;
  foundedYear?: string;
  tagline: string;
  missionStatement: string;
  visionStatement: string;
  coreValues: string[];
  aboutDescription: string;
  taxExemptionNotice?: string;
  operationalRegions: string[];
  headquartersAddress: string;
  city?: string;
  country?: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;
  /** Public social profile links keyed by network (facebook, instagram, x, linkedin, youtube, whatsapp). */
  socialLinks?: Record<string, string>;
  /** Optional person to contact (shown only if the organisation enters it). */
  contactPerson?: string;
}

export interface NGOBrandingIdentity {
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  typographyStyle: NGOTypographyStyle;
  themePreset?: 'earth_grassroots' | 'presidential_navy' | 'clean_water_impact' | 'emerald_nature';
  heroStyle?: 'immersive_story' | 'impact_stats' | 'campaign_focus' | 'minimal_editorial';
  logoUrl?: string;
  coverImageUrl?: string;
  badgeText?: string;
}

export interface NGOProgram {
  id: string;
  title: string;
  slug?: string;
  category: string;
  shortSummary: string;
  fullDescription: string;
  beneficiaryGroup: string;
  locations: string[];
  outcomes: string[];
  imageUrl?: string;
  videoUrl?: string;
  status: 'active' | 'completed' | 'ongoing';
}

export interface NGOImpactStat {
  id: string;
  value: string;
  label: string;
  description?: string;
  iconName?: string;
  isVerified: boolean;
  verificationSource?: string;
}

export interface NGOCampaign {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  targetGoal?: number;
  achievedAmount?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'urgent' | 'completed';
  imageUrl?: string;
  donationCtaLabel?: string;
  donationCtaUrl?: string;
}

export interface NGOCausePillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  urgencyLevel: 'high' | 'ongoing';
}

export interface NGOPerson {
  id: string;
  name: string;
  role: string;
  tier: 'founder' | 'board' | 'executive' | 'advisor' | 'team';
  bio: string;
  photoUrl?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
  };
}

export interface NGOVolunteerOpportunity {
  id: string;
  roleName: string;
  department: string;
  location: string;
  commitment: string;
  requirements: string[];
}

export interface NGOVolunteerInfo {
  enabled: boolean;
  headline: string;
  description: string;
  opportunities: NGOVolunteerOpportunity[];
  applicationUrl?: string;
}

export interface NGOVolunteerApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  roleInterest: string;
  city: string;
  availability: string;
  skillsSummary?: string;
  createdAt: string;
}

export interface NGOCollectionCenter {
  id: string;
  centerName: string;
  city: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  timings: string;
  acceptedItems: string[];
}

export interface NGODonationTier {
  id: string;
  amount: number;
  currency: string;
  label: string;
  impactEquivalence: string;
  isPopular?: boolean;
}

export interface NGODonationModel {
  headline: string;
  subheadline?: string;
  donationTiers: NGODonationTier[];
  customAmountAllowed: boolean;
  taxDeductible: boolean;
  eightyGRegNumber?: string;
  fcraStatus?: string;
  modelProofNote?: string;
  directTransferDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    swiftCode?: string;
  };
  enquiryOnly: boolean;
  outboundDonationUrl?: string;
}

export interface NGODonationEnquiry {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount?: number;
  currency: string;
  panNumber?: string;
  frequency: 'one_time' | 'monthly';
  message?: string;
  createdAt: string;
}

export interface NGOStory {
  id: string;
  title: string;
  beneficiaryName: string;
  location: string;
  excerpt: string;
  fullStory: string;
  quote: string;
  photoUrl?: string;
  videoUrl?: string;
  date?: string;
}

export interface NGOReportDocument {
  id: string;
  title: string;
  financialYear: string;
  type: 'annual_report' | 'financial_statement' | 'impact_assessment' | 'fcra_return' | 'legal_certificate';
  fileUrl: string;
  fileSize?: string;
  publishDate: string;
}

export interface NGOPartner {
  id: string;
  name: string;
  tier: 'csr_partner' | 'institutional' | 'foundation' | 'community';
  logoUrl?: string;
  websiteUrl?: string;
  contributionSummary?: string;
}

export interface NGOFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface NGOMediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  caption?: string;
}

/** A dated announcement, news item, campaign/project update or event shown on the site. Informational only: no payments. */
export interface NGOUpdateItem {
  id: string;
  title: string;
  kind: 'announcement' | 'news' | 'campaign' | 'project' | 'event' | 'success_story';
  date?: string;
  summary: string;
  imageUrl?: string;
  linkUrl?: string;
}

/** Informational "how to support us" text. DigiVerse sites never collect payments. */
export interface NGOSupportInfo {
  headline?: string;
  text?: string;
}

export interface NGODataAvailability {
  programs: boolean;
  impactStats: boolean;
  campaigns: boolean;
  causes: boolean;
  leadership: boolean;
  volunteering: boolean;
  collectionCenters: boolean;
  donationModel: boolean;
  stories: boolean;
  reports: boolean;
  partners: boolean;
  faqs: boolean;
  gallery: boolean;
}

export interface NGOWebsiteData {
  schemaVersion: '1.0';
  archetype: NGOArchetype;
  profile: NGOProfile;
  branding: NGOBrandingIdentity;
  programs: NGOProgram[];
  impactStats: NGOImpactStat[];
  campaigns: NGOCampaign[];
  causes: NGOCausePillar[];
  leadership: NGOPerson[];
  volunteering: NGOVolunteerInfo;
  volunteerSubmissions: NGOVolunteerApplication[];
  collectionCenters: NGOCollectionCenter[];
  donationModel: NGODonationModel;
  donationEnquiries: NGODonationEnquiry[];
  stories: NGOStory[];
  reports: NGOReportDocument[];
  partners: NGOPartner[];
  faqs: NGOFAQItem[];
  gallery: NGOMediaItem[];
  /** Additive (library templates): announcements, news and updates. */
  updates?: NGOUpdateItem[];
  /** Additive (library templates): informational support text, never a payment form. */
  supportInfo?: NGOSupportInfo;
  dataAvailability: NGODataAvailability;
}
