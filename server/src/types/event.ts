/**
 * DigiVerse — Event Website Creation Engine Domain Models
 *
 * This module defines data structures for all 7 event categories:
 * 1. Conference & Seminar (Relate Conference & Web Summit parity)
 * 2. Festival & Concert (Outside Festival & Summer Dance parity)
 * 3. Corporate & Business Events (Dreamforce & Credit Summer Event parity)
 * 4. Exhibition & Trade Fair (The Other Art Fair & Art Basel parity)
 * 5. Wedding & Private Events (Zola & Wix Events parity)
 * 6. Award Ceremony & Special Events (Cannes Lions & The Webby Awards parity)
 * 7. Launch & Product Reveal (Apple Events & Apple iPhone parity)
 *
 * Deterministic Zero-Sample Principle:
 * - Empty collections remain empty. Never fabricate fake speakers, artists,
 *   sessions, or sponsor logos.
 */

export type EventCategory =
  | 'conference_seminar'
  | 'festival_concert'
  | 'corporate_business'
  | 'exhibition_trade'
  | 'wedding_private'
  | 'award_ceremony'
  | 'launch_reveal';

export type EventSectionType =
  | 'conference_hero'
  | 'festival_hero'
  | 'corporate_hero'
  | 'exhibition_hero'
  | 'wedding_hero'
  | 'award_hero'
  | 'launch_hero'
  | 'event_speakers'
  | 'event_agenda'
  | 'event_tickets'
  | 'event_exhibitors'
  | 'event_floorplan'
  | 'event_awards'
  | 'event_wedding_story'
  | 'event_wedding_rsvp'
  | 'event_bento_specs'
  | 'event_venue'
  | 'event_faq'
  | 'event_sponsors'
  | 'event_gallery'
  | 'event_contact';

export type EventTypographyStyle =
  | 'futuristic'
  | 'cinematic'
  | 'luxury'
  | 'editorial'
  | 'festive'
  | 'modern';

export type EventPersonRole =
  | 'keynote_speaker'
  | 'speaker'
  | 'headliner_artist'
  | 'performer'
  | 'executive'
  | 'host'
  | 'jury'
  | 'couple';

export interface EventPerson {
  id: string;
  name: string;
  role: EventPersonRole | string;
  title?: string; // e.g. "VP of Artificial Intelligence", "Grammy Award Winning Vocalist"
  organization?: string; // e.g. "TechCorp Global", "Indie Music Collective"
  bio: string;
  topic?: string; // Session topic or performance genre
  photoUrl?: string;
  isFeatured: boolean;
  socialUrl?: string;
  displayOrder: number;
}

export interface EventTrack {
  id: string;
  name: string; // e.g. "AI & Machine Learning", "Main Stage", "Executive Roundtable"
  description?: string;
  color: string; // Hex color for badge, e.g. "#06b6d4"
  stage?: string;
}

export interface EventSession {
  id: string;
  title: string;
  description: string;
  day: string; // e.g. "Day 1", "Saturday Oct 24"
  date: string; // e.g. "2026-11-20"
  startTime: string; // e.g. "09:30 AM"
  endTime: string; // e.g. "10:30 AM"
  trackId?: string;
  stage?: string; // e.g. "Hall A - Keynote Arena", "Sunset Stage"
  speakerIds: string[];
  room?: string;
  isKeynote: boolean;
  tags?: string[];
}

export interface EventTicketTier {
  id: string;
  name: string; // e.g. "Early Bird Pass", "VIP All-Access", "Weekend Camping"
  price: number | string; // e.g. 14999 or "Free RSVP"
  currency: string; // "INR", "USD", "EUR"
  description: string;
  features: string[];
  badge?: string; // "Best Value", "Selling Fast", "Limited"
  isAvailable: boolean;
  registrationUrl?: string;
}

export interface EventExhibitor {
  id: string;
  name: string;
  category: string; // e.g. "Contemporary Sculpture", "Robotics & AI", "Fintech"
  boothNumber?: string;
  hallSector?: string; // e.g. "Hall 3 - Sector B"
  description: string;
  logoUrl?: string;
  imageUrl?: string;
  specHighlights?: string[];
  websiteUrl?: string;
}

export interface EventAwardNominee {
  id: string;
  title: string; // Nominee work title, e.g. "NextGen Neural Audio Engine"
  subtitle: string; // Creator/Agency, e.g. "Acoustic Labs Ltd."
  isWinner?: boolean;
  imageUrl?: string;
  categoryId: string;
}

export interface EventAwardCategory {
  id: string;
  name: string; // e.g. "Grand Prix for Digital Craft", "Breakthrough Technology of the Year"
  description: string;
  nominees: EventAwardNominee[];
  sponsorName?: string;
}

export interface EventWeddingStoryMilestone {
  id: string;
  title: string; // e.g. "How We Met", "The First Trip", "The Proposal in Venice"
  date?: string;
  text: string;
  imageUrl?: string;
}

export interface EventCeremonyItem {
  id: string;
  time: string; // e.g. "04:30 PM"
  eventName: string; // e.g. "Sacred Vows Ceremony", "Sunset Cocktail Hour", "Grand Reception"
  venue: string;
  dressCode: string; // e.g. "Black Tie Optional", "Traditional Festive Attire"
  description?: string;
}

export interface EventHotelBlock {
  id: string;
  hotelName: string;
  address: string;
  bookingCode?: string;
  link?: string;
  deadline?: string;
  distanceToVenue?: string;
}

export interface EventWeddingStory {
  coupleNames: string; // e.g. "Sophia & Alexander"
  partnerOne: string;
  partnerTwo: string;
  storyMilestones: EventWeddingStoryMilestone[];
  ceremonyItinerary: EventCeremonyItem[];
  hotelBlocks: EventHotelBlock[];
  registryLinks?: { storeName: string; url: string }[];
}

export interface EventBentoHighlight {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  metric?: string; // e.g. "3.2x Faster", "48 Hours Battery", "Titanium Grade 5"
  colSpan?: number; // 1, 2, or 3 column span in bento grid
  imageUrl?: string;
  iconName?: string;
}

export interface EventTechSpecGroup {
  group: string; // e.g. "Display & Design", "Chip Architecture", "Camera System"
  items: { label: string; value: string }[];
}

export interface EventProductLaunch {
  productName: string; // e.g. "Nova Pro 5G"
  tagline: string;
  heroHeadline: string;
  heroSubheadline?: string;
  revealVideoUrl?: string;
  bentoHighlights: EventBentoHighlight[];
  techSpecs: EventTechSpecGroup[];
  preorderCtaText?: string;
  preorderUrl?: string;
}

export interface EventSponsor {
  id: string;
  name: string;
  tier: 'title' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'partner' | 'media';
  logoUrl?: string;
  websiteUrl?: string;
}

export interface EventVenueInfo {
  venueName: string;
  address: string;
  city: string;
  country: string;
  mapEmbedUrl?: string;
  metroTransit?: string;
  parkingInfo?: string;
  airportInfo?: string;
  floorPlanUrl?: string;
  wheelchairAccessible?: boolean;
}

export interface EventFAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface EventMediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  category?: string;
  youtubeId?: string;
}

export interface EventRSVPSubmission {
  id: string;
  guestName: string;
  guestEmail: string;
  attending: 'attending' | 'declined' | 'tentative';
  mealPreference?: string;
  dietaryNotes?: string;
  plusOnes: number;
  songRequest?: string;
  createdAt: string;
}

export interface EventProfile {
  name: string;
  edition?: string; // e.g. "2026 Edition", "14th Annual Conference"
  tagline: string;
  description: string;
  startDate: string; // "2026-11-20"
  endDate?: string; // "2026-11-22"
  time: string; // "09:00 AM - 06:00 PM"
  /** 24-hour "HH:mm" start and end of the first day. Optional; library templates use them for an exact countdown. */
  startTime?: string;
  endTime?: string;
  timezone: string; // "EST", "IST", "GMT"
  venueName: string;
  venueAddress: string;
  city: string;
  country: string;
  isVirtual?: boolean;
  isHybrid?: boolean;
  virtualStreamUrl?: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
}

export interface EventBrandingIdentity {
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  typographyStyle: EventTypographyStyle;
  preferredTheme?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  badgeText?: string;
}

export interface EventWebsiteData {
  schemaVersion: '1.0';
  category: EventCategory;
  profile: EventProfile;
  branding: EventBrandingIdentity;
  speakers: EventPerson[];
  tracks: EventTrack[];
  sessions: EventSession[];
  tickets: EventTicketTier[];
  exhibitors: EventExhibitor[];
  awardCategories: EventAwardCategory[];
  weddingStory?: EventWeddingStory;
  productLaunch?: EventProductLaunch;
  sponsors: EventSponsor[];
  venue: EventVenueInfo;
  faqs: EventFAQItem[];
  gallery: EventMediaItem[];
  rsvpSubmissions?: EventRSVPSubmission[];

  dataAvailability: {
    speakers: boolean;
    schedule: boolean;
    tickets: boolean;
    exhibitors: boolean;
    awards: boolean;
    weddingStory: boolean;
    productLaunch: boolean;
    sponsors: boolean;
    venue: boolean;
    faqs: boolean;
    gallery: boolean;
  };
}
