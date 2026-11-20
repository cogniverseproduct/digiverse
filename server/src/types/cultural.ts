/**
 * DigiVerse — Cultural Website Domain Model
 *
 * This module defines category-specific data structures for Cultural Societies,
 * Regional Associations, and Puja & Festival Organizing Committees.
 *
 * Design Benchmarks:
 * - Cultural Society: CultureSuite (https://www.culturesuite.co/) + Mera Samaj (https://merasamaj.co.in/)
 * - Puja Committee: Temple Hub (https://www.templehub.org/temple-website-design)
 *
 * Important:
 * - Deterministic Zero-Sample Principle: Empty datasets remain empty; no fabricated
 *   tithi schedules, dates, priests, or committee members.
 * - Bilingual cultural presentation (English + Bengali / regional native titles).
 */

export type CulturalWebsiteType = 'cultural_society' | 'puja_committee';
export type CulturalArchetype = CulturalWebsiteType;

export type FestivalType =
  | 'durga_puja'
  | 'kali_puja'
  | 'saraswati_puja'
  | 'lakshmi_puja'
  | 'jagaddhatri_puja'
  | 'ganesh_utsav'
  | 'basant_utsav'
  | 'general_festival';

export type CulturalRoleCategory =
  | 'executive'
  | 'advisory'
  | 'volunteer'
  | 'organizer'
  | 'religious';

export type CulturalActivityCategory =
  | 'music'
  | 'dance'
  | 'theatre'
  | 'literary'
  | 'arts'
  | 'workshop'
  | 'competition'
  | 'heritage'
  | 'community';

export type CulturalPageKey =
  | 'home'
  | 'about'
  | 'committee'
  | 'activities'
  | 'events'
  | 'schedule'
  | 'theme'
  | 'visitor-guide'
  | 'gallery'
  | 'videos'
  | 'announcements'
  | 'membership'
  | 'contribute'
  | 'sponsors'
  | 'contact';

export type CulturalSectionType =
  | 'cultural_hero'
  | 'cultural_story'
  | 'cultural_programmes'
  | 'cultural_events'
  | 'cultural_committee'
  | 'cultural_membership'
  | 'cultural_gallery'
  | 'cultural_sponsors'
  | 'cultural_contact'
  | 'puja_hero'
  | 'puja_theme'
  | 'puja_schedule'
  | 'puja_programmes'
  | 'puja_organizers'
  | 'puja_visitor_guide'
  | 'puja_donations'
  | 'puja_gallery'
  | 'puja_sponsors'
  | 'puja_contact';

export interface CulturalOrganizationProfile {
  name: string;
  nativeName?: string; // e.g. বাংলা নাম "সার্বজনীন দুর্গোৎসব ও সাংস্কৃতিক সমিতি"
  type: CulturalWebsiteType;
  establishedYear?: number;
  registrationNumber?: string;
  tagline?: string;
  description: string;
  history?: string;
  mission?: string;
  vision?: string;
  coreValues?: string[];
  headquarters: string;
  city: string;
  state: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  operatingArea?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
    twitter?: string;
  };
}

export interface CulturalBrandingIdentity {
  primaryLogoUrl?: string;
  alternativeLogoUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  typographyStyle: 'heritage' | 'classical' | 'modern' | 'bilingual';
  preferredTheme?: string; // e.g. 'durga-puja', 'cultural-heritage', 'basant-utsav'
  guidelinesUrl?: string;
}

export interface CulturalLeader {
  id: string;
  name: string;
  nativeName?: string;
  designation: string; // e.g. 'President', 'Secretary', 'Treasurer', 'Vice President', 'Purohit'
  roleCategory: CulturalRoleCategory;
  profileImageUrl?: string;
  bio?: string;
  phone?: string;
  email?: string;
  displayOrder: number;
}

export interface CulturalActivity {
  id: string;
  title: string;
  titleNative?: string;
  category: CulturalActivityCategory;
  description: string;
  schedule?: string;
  venue?: string;
  featuredImageUrl?: string;
  isUpcoming: boolean;
  registrationRequired?: boolean;
}

export interface CulturalEvent {
  id: string;
  title: string;
  titleNative?: string;
  category: string;
  description: string;
  startDate: string;
  endDate?: string;
  time: string;
  venue: string;
  featuredImageUrl?: string;
  registrationUrl?: string;
  isFeatured?: boolean;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface PujaRitualScheduleItem {
  id: string;
  dayName: string; // e.g. 'Maha Shasthi', 'Maha Saptami', 'Maha Ashtami', 'Sandhi Puja', 'Maha Nabami', 'Vijaya Dashami'
  dayNameNative?: string; // e.g. 'মহা ষষ্ঠী', 'মহাসপ্তমী', 'মহাষ্টমী', 'সন্ধিপুজো', 'মহানবমী', 'বিজয়া দশমী'
  date: string;
  tithiInfo?: string; // Client-provided tithi info, never fabricated
  rituals: {
    time: string;
    name: string;
    nameNative?: string;
    description?: string;
    isKeyRitual?: boolean; // Highlighted ritual (Pushpanjali, Sandhi Puja, Bhog distribution)
  }[];
}

export interface PujaThemeDecoration {
  currentThemeName: string;
  currentThemeNameNative?: string;
  editionYear: string; // e.g. "2026 (28th Annual Edition)"
  themeConcept: string;
  themeStory?: string;
  idolArtisan?: string; // e.g. "Sculpted by Master Kumartuli Artisans"
  pandalArchitecture?: string; // e.g. "Terracotta Temple Architecture Replica"
  lightingConcept?: string; // e.g. "Chandannagar Dynamic Illumination"
  themeImages: {
    url: string;
    caption: string;
    category: 'pandal' | 'pratima' | 'lighting' | 'inauguration';
  }[];
  pastThemes?: {
    year: number;
    themeName: string;
    description: string;
    imageUrl?: string;
  }[];
}

export interface PujaVisitorGuide {
  pandalLocation: string;
  landmark?: string;
  nearestMetro?: string;
  nearestRailway?: string;
  nearestBusStop?: string;
  parkingInfo?: string;
  visitingHours: string;
  vipPassInfo?: string;
  crowdGuidelines: string[];
  safetyAccessibility: string[];
  emergencyContactPhone?: string;
}

export interface CulturalDonationInfo {
  campaignTitle: string;
  appealMessage: string;
  causes: {
    id: string;
    title: string;
    description: string;
    suggestedAmounts?: number[];
  }[];
  transparencyNote: string;
  contactForDonations: string;
  taxExemptionNote?: string;
}

export interface CulturalSponsor {
  id: string;
  name: string;
  tier: 'title' | 'principal' | 'powered_by' | 'associate' | 'community';
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
}

export interface CulturalNewsArticle {
  id: string;
  title: string;
  titleNative?: string;
  publishedAt: string;
  category: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  tags?: string[];
  isPublished: boolean;
}

export interface CulturalMediaItem {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  driveFileId?: string;
}

export interface CulturalMembershipInfo {
  enabled: boolean;
  membershipTypes?: {
    name: string;
    fee: string;
    benefits: string[];
  }[];
  guidelines?: string;
}

export interface CulturalWebsiteData {
  schemaVersion: '1.0';
  websiteType: CulturalWebsiteType;
  festivalType?: FestivalType;
  organization: CulturalOrganizationProfile;
  branding: CulturalBrandingIdentity;
  leadership: CulturalLeader[];
  activities: CulturalActivity[];
  events: CulturalEvent[];
  gallery: CulturalMediaItem[];
  sponsors: CulturalSponsor[];
  news: CulturalNewsArticle[];
  donationInfo?: CulturalDonationInfo;
  membershipInfo?: CulturalMembershipInfo;

  // Puja Committee Specific Modules:
  pujaSchedule?: PujaRitualScheduleItem[];
  pujaTheme?: PujaThemeDecoration;
  visitorGuide?: PujaVisitorGuide;

  dataAvailability: {
    leadership: boolean;
    activities: boolean;
    events: boolean;
    gallery: boolean;
    sponsors: boolean;
    news: boolean;
    pujaSchedule?: boolean;
    pujaTheme?: boolean;
    visitorGuide?: boolean;
    donationInfo?: boolean;
    membership?: boolean;
  };
}
