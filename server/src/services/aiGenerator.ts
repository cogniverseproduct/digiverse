import { isDemoStockThumbnail } from './googleDriveService.js';
import { usesNgoLibraryTemplate } from './ngoCatalog.js';
import { usesEventLibraryTemplate } from './eventCatalog.js';
import {
  ClientRequirements,
  DriveMediaItem,
  GeneratedWebsite,
  PhotoItem,
  VideoItem,
  YouTubeVideo,
  OrganizationCategory,
  EventItem,
  CommitteeMember,
  GalleryItem,
  PageRoute,
  WebsiteSectionConfig,
  WebsiteThemeConfig,
  NavigationBarConfig,
  FooterConfig,
  ResponsiveConfig,
  SelectedTemplateMetadata
} from '../types/index.js';
import type {
  SportsWebsiteData,
  SportsPageKey,
  SportsSectionDefinition,
  SportsSectionType
} from '../types/sports.js';
import type {
  CulturalWebsiteData,
  CulturalOrganizationProfile,
  CulturalBrandingIdentity,
  CulturalLeader,
  CulturalActivity,
  CulturalEvent,
  CulturalMediaItem,
  CulturalSponsor,
  CulturalNewsArticle,
  PujaRitualScheduleItem,
  PujaThemeDecoration,
  PujaVisitorGuide,
  CulturalDonationInfo,
  CulturalMembershipInfo
} from '../types/cultural.js';
import type {
  EventWebsiteData,
  EventCategory,
  EventSectionType,
  EventPerson,
  EventTrack,
  EventSession,
  EventTicketTier,
  EventExhibitor,
  EventAwardCategory,
  EventWeddingStory,
  EventProductLaunch,
  EventSponsor,
  EventVenueInfo,
  EventFAQItem,
  EventMediaItem,
  EventProfile,
  EventBrandingIdentity
} from '../types/event.js';
import type {
  NGOArchetype,
  NGOWebsiteData,
  NGOSectionType,
  NGOTypographyStyle,
  NGOProfile,
  NGOBrandingIdentity,
  NGOProgram,
  NGOImpactStat,
  NGOCampaign,
  NGOCausePillar,
  NGOPerson,
  NGOVolunteerOpportunity,
  NGOVolunteerInfo,
  NGOVolunteerApplication,
  NGOCollectionCenter,
  NGODonationTier,
  NGODonationModel,
  NGODonationEnquiry,
  NGOStory,
  NGOReportDocument,
  NGOPartner,
  NGOFAQItem,
  NGOMediaItem,
  NGODataAvailability
} from '../types/ngo.js';
import type {
  PortfolioWebsiteData,
  PortfolioArchetype
} from '../types/portfolio.js';

interface ArchetypeProfile {
  themeAccent: string;
  layoutPreset: 'split' | 'grid' | 'editorial';
  fontFamily: string;
  headingFont: string;
  primaryColor: string;
  accentColor: string;
  categoryLabel: string;
  eventsTitle: string;
  committeeTitle: string;
  galleryTitle: string;
  ctaLabel: string;
  announcementsTitle: string;
}

interface DesignProfile {
  layoutPreset: 'split' | 'grid' | 'editorial';
  themeAccent: string;
  headingFont: string;
  fontFamily: string;
  backgroundColor: string;
  visualDirection: string;
}

// Visual defaults only. No sample people, events, media, statistics or claims.
const ARCHETYPES: Record<OrganizationCategory, ArchetypeProfile> = {
  event: { themeAccent: 'neon-cyan', layoutPreset: 'split', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Plus Jakarta Sans, sans-serif', primaryColor: '#6366f1', accentColor: '#06b6d4', categoryLabel: 'Event & Experience', eventsTitle: 'Event Schedule & Timetable', committeeTitle: 'Speakers & Keynotes', galleryTitle: 'Event Highlights & Gallery', ctaLabel: 'Register & Passes', announcementsTitle: 'Announcements & Updates' },
  cultural: { themeAccent: 'crimson-gold', layoutPreset: 'editorial', fontFamily: 'Georgia, "Times New Roman", serif', headingFont: 'Playfair Display, Georgia, serif', primaryColor: '#991b1b', accentColor: '#d97706', categoryLabel: 'Cultural organization', eventsTitle: 'Cultural Events & Programs', committeeTitle: 'Organization Committee', galleryTitle: 'Cultural Gallery', ctaLabel: 'Explore Programs', announcementsTitle: 'Announcements & Notices' },
  puja_committee: { themeAccent: 'sunset-amber', layoutPreset: 'editorial', fontFamily: 'Georgia, "Times New Roman", serif', headingFont: 'Cinzel, Georgia, serif', primaryColor: '#c2410c', accentColor: '#eab308', categoryLabel: 'Puja committee', eventsTitle: 'Puja Schedule & Programs', committeeTitle: 'Puja Committee', galleryTitle: 'Festival Gallery', ctaLabel: 'View Schedule', announcementsTitle: 'Committee Notices' },
  sports: { themeAccent: 'neon-cyan', layoutPreset: 'split', fontFamily: 'Inter, -apple-system, sans-serif', headingFont: 'Montserrat, Inter, sans-serif', primaryColor: '#0284c7', accentColor: '#06b6d4', categoryLabel: 'Sports organization', eventsTitle: 'Sports Events', committeeTitle: 'Club Leadership', galleryTitle: 'Sports Gallery', ctaLabel: 'Explore the Club', announcementsTitle: 'Club Updates' },
  health_wellness: { themeAccent: 'clinical-trust', layoutPreset: 'split', fontFamily: 'Inter, sans-serif', headingFont: 'Plus Jakarta Sans, sans-serif', primaryColor: '#0f766e', accentColor: '#2dd4bf', categoryLabel: 'Health and wellness organization', eventsTitle: 'Programs & Sessions', committeeTitle: 'Team & Practitioners', galleryTitle: 'Gallery', ctaLabel: 'Explore Services', announcementsTitle: 'Updates & Notices' },
  ngo_social: { themeAccent: 'impact-green', layoutPreset: 'split', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Plus Jakarta Sans, Inter, sans-serif', primaryColor: '#15803d', accentColor: '#eab308', categoryLabel: 'Nonprofit organization', eventsTitle: 'Programs & Activities', committeeTitle: 'Organization Team', galleryTitle: 'Impact Gallery', ctaLabel: 'Support Our Work', announcementsTitle: 'Announcements & Updates' },
  ngo: { themeAccent: 'impact-green', layoutPreset: 'split', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Plus Jakarta Sans, Inter, sans-serif', primaryColor: '#15803d', accentColor: '#eab308', categoryLabel: 'Nonprofit organization', eventsTitle: 'Programs & Activities', committeeTitle: 'Organization Team', galleryTitle: 'Impact Gallery', ctaLabel: 'Support Our Work', announcementsTitle: 'Announcements & Updates' },
  portfolio: { themeAccent: 'tech-cyan', layoutPreset: 'split', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Space Grotesk, Plus Jakarta Sans, sans-serif', primaryColor: '#0284c7', accentColor: '#38bdf8', categoryLabel: 'Professional Portfolio', eventsTitle: 'Career Milestones & Timeline', committeeTitle: 'References & Collaborators', galleryTitle: 'Portfolio Showcase', ctaLabel: 'View Projects', announcementsTitle: 'Updates & Announcements' },
  educational: { themeAccent: 'academic-blue', layoutPreset: 'editorial', fontFamily: 'Georgia, serif', headingFont: 'Lora, Georgia, serif', primaryColor: '#1d4ed8', accentColor: '#f59e0b', categoryLabel: 'Educational institution', eventsTitle: 'Academic Events', committeeTitle: 'Leadership & Faculty', galleryTitle: 'Campus Gallery', ctaLabel: 'Explore Programs', announcementsTitle: 'Notices & Announcements' },
  professional: { themeAccent: 'corporate-blue', layoutPreset: 'split', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Plus Jakarta Sans, sans-serif', primaryColor: '#1e40af', accentColor: '#38bdf8', categoryLabel: 'Professional organization', eventsTitle: 'Professional Events', committeeTitle: 'Leadership Team', galleryTitle: 'Organization Gallery', ctaLabel: 'Connect With Us', announcementsTitle: 'Official Updates' },
  hobby_club: { themeAccent: 'creative-purple', layoutPreset: 'grid', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Outfit, sans-serif', primaryColor: '#7e22ce', accentColor: '#ec4899', categoryLabel: 'Hobby club', eventsTitle: 'Club Activities', committeeTitle: 'Club Team', galleryTitle: 'Club Gallery', ctaLabel: 'Explore Activities', announcementsTitle: 'Club Announcements' },
  community: { themeAccent: 'community-blue', layoutPreset: 'grid', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Outfit, sans-serif', primaryColor: '#0369a1', accentColor: '#14b8a6', categoryLabel: 'Community organization', eventsTitle: 'Community Activities', committeeTitle: 'Community Leadership', galleryTitle: 'Community Gallery', ctaLabel: 'Get Involved', announcementsTitle: 'Community Notices' },
  custom: { themeAccent: 'custom-neutral', layoutPreset: 'editorial', fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Plus Jakarta Sans, sans-serif', primaryColor: '#334155', accentColor: '#0ea5e9', categoryLabel: 'Organization', eventsTitle: 'Events & Activities', committeeTitle: 'Our Team', galleryTitle: 'Gallery', ctaLabel: 'Learn More', announcementsTitle: 'Announcements' }
};

const DESIGN_MODEL_PROFILES: Record<string, DesignProfile> = {
  cultural_heritage: { layoutPreset: 'editorial', themeAccent: 'heritage-ivory', headingFont: 'Playfair Display, Georgia, serif', fontFamily: 'Georgia, serif', backgroundColor: '#17120F', visualDirection: 'Heritage editorial, warm ivory, antique gold and cultural storytelling' },
  cultural_festival: { layoutPreset: 'grid', themeAccent: 'festival-vibrant', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#100D1D', visualDirection: 'Immersive festival canvas, bold photography and energetic visual sections' },
  cultural_art: { layoutPreset: 'split', themeAccent: 'art-gallery', headingFont: 'Cormorant Garamond, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#111318', visualDirection: 'Contemporary art gallery, asymmetric composition and visual storytelling' },

  puja_classic: { layoutPreset: 'editorial', themeAccent: 'sacred-classic', headingFont: 'Cinzel, Georgia, serif', fontFamily: 'Georgia, serif', backgroundColor: '#1B100D', visualDirection: 'Traditional devotional design, ornamental details and warm gold' },
  puja_immersive: { layoutPreset: 'split', themeAccent: 'sacred-immersive', headingFont: 'Cinzel, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#100D16', visualDirection: 'Full-bleed pandal photography, dramatic lighting and festival storytelling' },
  puja_magazine: { layoutPreset: 'grid', themeAccent: 'puja-editorial', headingFont: 'Playfair Display, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#17120F', visualDirection: 'Premium festival magazine, editorial grids and curated photography' },

  sports_club: { layoutPreset: 'split', themeAccent: 'sports-performance', headingFont: 'Montserrat, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#07131D', visualDirection: 'Professional sports club, athletic typography and performance-led layout' },
  sports_tournament: { layoutPreset: 'grid', themeAccent: 'sports-arena', headingFont: 'Oswald, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#090F18', visualDirection: 'High-energy tournament interface, score-focused hierarchy and dramatic imagery' },
  sports_academy: { layoutPreset: 'editorial', themeAccent: 'sports-academy', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0B1715', visualDirection: 'Sports academy, coaching profiles, training programs and enrollment journeys' },

  health_clinic: { layoutPreset: 'split', themeAccent: 'clinical-trust', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0C191A', visualDirection: 'Trustworthy healthcare design, calm layouts and accessible service navigation' },
  health_fitness: { layoutPreset: 'grid', themeAccent: 'fitness-energy', headingFont: 'Montserrat, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#10140F', visualDirection: 'Energetic fitness brand, bold imagery and training cards' },
  health_holistic: { layoutPreset: 'editorial', themeAccent: 'holistic-calm', headingFont: 'Cormorant Garamond, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#151713', visualDirection: 'Natural wellness aesthetic, organic shapes and calm editorial storytelling' },

  ngo_impact: { layoutPreset: 'split', themeAccent: 'impact-trust', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#11151D', visualDirection: 'Impact-first nonprofit design, authentic photography and transparent storytelling' },
  ngo_campaign: { layoutPreset: 'grid', themeAccent: 'campaign-bold', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#191018', visualDirection: 'Campaign-led design, strong calls to action and donation journeys' },
  ngo_community: { layoutPreset: 'editorial', themeAccent: 'community-human', headingFont: 'Lora, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#111A19', visualDirection: 'Human-centered community storytelling and warm photography' },
  ngo_grassroots: { layoutPreset: 'split', themeAccent: 'grassroots-warmth', headingFont: 'Space Grotesk, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0B1410', visualDirection: 'Grassroots community empowerment, earth tones, dignity-first visual identity' },
  ngo_foundation: { layoutPreset: 'editorial', themeAccent: 'institutional-navy', headingFont: 'Cinzel, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0A0F1D', visualDirection: 'Prestigious global foundation, deep navy & antique gold, fellowship and governance structure' },
  ngo_charity: { layoutPreset: 'split', themeAccent: 'cause-clarity', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#071822', visualDirection: 'Cause storytelling, radical 100% donation transparency, live impact metric counters' },

  edu_institution: { layoutPreset: 'editorial', themeAccent: 'academic-trust', headingFont: 'Lora, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#111522', visualDirection: 'Prestigious institutional design and structured academic information' },
  edu_academy: { layoutPreset: 'grid', themeAccent: 'learning-modern', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#101827', visualDirection: 'Modern learning platform, course cards and enrollment journeys' },
  edu_research: { layoutPreset: 'split', themeAccent: 'research-editorial', headingFont: 'Merriweather, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#141820', visualDirection: 'Research-led editorial design and publication layouts' },

  pro_corporate: { layoutPreset: 'split', themeAccent: 'corporate-premium', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0D1421', visualDirection: 'Premium corporate identity, precise spacing and conversion-focused services' },
  pro_network: { layoutPreset: 'grid', themeAccent: 'professional-network', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#101827', visualDirection: 'Professional network, member discovery and community interaction' },
  pro_editorial: { layoutPreset: 'editorial', themeAccent: 'executive-editorial', headingFont: 'Playfair Display, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#151515', visualDirection: 'Executive editorial identity, refined typography and long-form storytelling' },

  hobby_gallery: { layoutPreset: 'grid', themeAccent: 'creative-gallery', headingFont: 'Cormorant Garamond, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#17131A', visualDirection: 'Visual-first creative gallery and expressive image composition' },
  hobby_community: { layoutPreset: 'split', themeAccent: 'hobby-social', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#10171A', visualDirection: 'Friendly hobby community, activity discovery and member participation' },
  hobby_journal: { layoutPreset: 'editorial', themeAccent: 'creative-journal', headingFont: 'Lora, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#171512', visualDirection: 'Editorial journal, thoughtful typography and story-driven content' },

  community_resident: { layoutPreset: 'grid', themeAccent: 'resident-modern', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#10191C', visualDirection: 'Resident association portal, practical service cards and clear notices' },
  community_local: { layoutPreset: 'split', themeAccent: 'local-warm', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#171610', visualDirection: 'Welcoming local community identity and neighborhood storytelling' },
  community_civic: { layoutPreset: 'editorial', themeAccent: 'civic-trust', headingFont: 'Lora, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#111923', visualDirection: 'Civic information design, high readability and transparent communication' },

  custom_editorial: { layoutPreset: 'editorial', themeAccent: 'custom-editorial', headingFont: 'Playfair Display, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#151515', visualDirection: 'Custom editorial design, distinctive typography and asymmetric storytelling' },
  custom_visual: { layoutPreset: 'grid', themeAccent: 'custom-visual', headingFont: 'Outfit, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#10131C', visualDirection: 'Custom visual-first design, bold image compositions and expressive hierarchy' },
  custom_institutional: { layoutPreset: 'split', themeAccent: 'custom-institutional', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#111827', visualDirection: 'Custom institutional design, structured layouts and information clarity' },

  event_conference: { layoutPreset: 'split', themeAccent: 'conference-tech', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0A0E1A', visualDirection: 'Tech summit aesthetic, dark theme, crisp grid lines, high-contrast badges' },
  event_festival: { layoutPreset: 'grid', themeAccent: 'festival-twilight', headingFont: 'Syne, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#090814', visualDirection: 'Electric twilight glow, oversized typography, artist card lineup grids' },
  event_corporate: { layoutPreset: 'split', themeAccent: 'corporate-summit', headingFont: 'Plus Jakarta Sans, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0B132B', visualDirection: 'Polished executive summit, royal blue tones, structured timetable' },
  event_exhibition: { layoutPreset: 'grid', themeAccent: 'gallery-minimal', headingFont: 'Cormorant Garamond, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0D0E12', visualDirection: 'Curatorial white-space, high-fashion typography, exhibitor directory' },
  event_wedding: { layoutPreset: 'editorial', themeAccent: 'wedding-romance', headingFont: 'Playfair Display, Georgia, serif', fontFamily: 'Cormorant Garamond, Georgia, serif', backgroundColor: '#131114', visualDirection: 'Romantic editorial, warm champagne, serif elegance, story milestones' },
  event_awards: { layoutPreset: 'editorial', themeAccent: 'awards-gala', headingFont: 'Cinzel, Georgia, serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#0A0A0C', visualDirection: 'Black-tie gala, obsidian & gold accents, nominee spotlights' },
  event_launch: { layoutPreset: 'split', themeAccent: 'launch-stealth', headingFont: 'Space Grotesk, Inter, sans-serif', fontFamily: 'Inter, sans-serif', backgroundColor: '#000000', visualDirection: 'Minimalist keynote black, dynamic glow, bold spec metrics' }
};

function resolveDesignProfile(modelId: string | undefined, archetype: ArchetypeProfile): DesignProfile {
  if (modelId && DESIGN_MODEL_PROFILES[modelId]) return DESIGN_MODEL_PROFILES[modelId];
  return {
    layoutPreset: archetype.layoutPreset,
    themeAccent: archetype.themeAccent,
    headingFont: archetype.headingFont,
    fontFamily: archetype.fontFamily,
    backgroundColor: '#090D17',
    visualDirection: `${archetype.categoryLabel} visual system`
  };
}

const SPORTS_PAGE_META: Record<SportsPageKey, { slug: string; title: string; navLabel: string }> = {
  home: { slug: '/', title: 'Home', navLabel: 'Home' },
  about: { slug: '/about', title: 'About the Club', navLabel: 'About' },
  teams: { slug: '/teams', title: 'Teams', navLabel: 'Teams' },
  squads: { slug: '/squads', title: 'Squads', navLabel: 'Squads' },
  players: { slug: '/players', title: 'Players', navLabel: 'Players' },
  fixtures: { slug: '/fixtures', title: 'Fixtures', navLabel: 'Fixtures' },
  results: { slug: '/results', title: 'Results', navLabel: 'Results' },
  standings: { slug: '/standings', title: 'Standings', navLabel: 'Standings' },
  competitions: { slug: '/competitions', title: 'Competitions', navLabel: 'Competitions' },
  'match-centre': { slug: '/match-centre', title: 'Match Centre', navLabel: 'Match Centre' },
  coaches: { slug: '/coaches', title: 'Coaches & Staff', navLabel: 'Coaches' },
  news: { slug: '/news', title: 'Sports News', navLabel: 'News' },
  gallery: { slug: '/gallery', title: 'Gallery', navLabel: 'Gallery' },
  sponsors: { slug: '/sponsors', title: 'Sponsors', navLabel: 'Sponsors' },
  contact: { slug: '/contact', title: 'Contact', navLabel: 'Contact' },
  programmes: { slug: '/programmes', title: 'Coaching Programmes', navLabel: 'Programmes' },
  batches: { slug: '/batches', title: 'Training Batches & Schedule', navLabel: 'Schedule' },
  admissions: { slug: '/admissions', title: 'Admissions & Trials', navLabel: 'Admissions' },
  brackets: { slug: '/brackets', title: 'Tournament Brackets', navLabel: 'Brackets' }
};

const SPORTS_PAGE_DATA: Partial<Record<SportsPageKey, keyof SportsWebsiteData['dataAvailability']>> = {
  teams: 'teams', squads: 'players', players: 'players', fixtures: 'fixtures', results: 'fixtures',
  standings: 'standings', competitions: 'competitions', 'match-centre': 'fixtures', coaches: 'staff',
  news: 'news', sponsors: 'sponsors', programmes: 'academyProgrammes', batches: 'trainingBatches', admissions: 'academyProgrammes', brackets: 'tournamentStages'
};

const SPORTS_PAGE_SECTIONS: Partial<Record<SportsPageKey, SportsSectionType[]>> = {
  home: ['sports_hero', 'club_identity', 'featured_teams', 'upcoming_fixtures', 'recent_results', 'sports_news', 'sponsor_showcase'],
  about: ['club_identity'], teams: ['team_directory'], squads: ['team_directory', 'player_directory'],
  players: ['player_directory'], fixtures: ['upcoming_fixtures'], results: ['recent_results'],
  standings: ['league_standings'], competitions: ['competition_list'],
  'match-centre': ['live_match', 'match_timeline'], coaches: ['coaching_staff'],
  news: ['sports_news'], gallery: ['sports_gallery'], sponsors: ['sponsor_showcase'], contact: ['sports_contact'],
  programmes: ['academy_programmes'], batches: ['training_schedules'], admissions: ['admission_enquiry'], brackets: ['tournament_bracket', 'participating_teams']
};

function toPageRoute(page: { id: string; slug: string; title: string; navLabel: string; enabled: boolean; sections: string[]; showInNavigation?: boolean }): PageRoute {
  return { id: `page_${page.id}`, slug: page.slug, title: page.title, navLabel: page.navLabel, enabled: page.enabled, sections: page.sections };
}

function getArchetypeHomeSections(archetype: string): SportsSectionType[] {
  if (archetype === 'sports_tournament') {
    return [
      'sports_hero',
      'competition_list',
      'participating_teams',
      'upcoming_fixtures',
      'live_match',
      'tournament_bracket',
      'recent_results',
      'league_standings',
      'sports_news',
      'sponsor_showcase'
    ];
  }
  if (archetype === 'sports_academy') {
    return [
      'sports_hero',
      'club_identity',
      'academy_programmes',
      'training_schedules',
      'coaching_staff',
      'sports_gallery',
      'sponsor_showcase',
      'admission_enquiry'
    ];
  }
  return [
    'sports_hero',
    'club_identity',
    'featured_teams',
    'upcoming_fixtures',
    'recent_results',
    'league_standings',
    'sports_news',
    'sponsor_showcase',
    'membership_enquiry'
  ];
}

function buildSportsPages(sportsData: SportsWebsiteData, archetype: string = 'sports_club'): PageRoute[] {
  const isTournament = archetype === 'sports_tournament';
  const isAcademy = archetype === 'sports_academy';

  const definitions = sportsData.pages?.length
    ? sportsData.pages
    : (Object.keys(SPORTS_PAGE_META) as SportsPageKey[])
        .filter(key => {
          if (key === 'home' || key === 'about' || key === 'contact') return true;
          // Filter out archetype irrelevant pages unless data exists
          if (isAcademy && (key === 'brackets' || key === 'standings' || key === 'competitions') && !sportsData.dataAvailability[SPORTS_PAGE_DATA[key]!]) return false;
          if (isTournament && (key === 'programmes' || key === 'batches' || key === 'admissions') && !sportsData.dataAvailability[SPORTS_PAGE_DATA[key]!]) return false;
          if (!isAcademy && !isTournament && (key === 'programmes' || key === 'batches' || key === 'admissions' || key === 'brackets') && !sportsData.dataAvailability[SPORTS_PAGE_DATA[key]!]) return false;

          const dataset = SPORTS_PAGE_DATA[key];
          return dataset ? sportsData.dataAvailability[dataset] : false;
        })
        .map(key => {
          const sections = key === 'home' ? getArchetypeHomeSections(archetype) : (SPORTS_PAGE_SECTIONS[key] || []);
          return {
            id: key,
            slug: SPORTS_PAGE_META[key].slug,
            title: SPORTS_PAGE_META[key].title,
            navLabel: SPORTS_PAGE_META[key].navLabel,
            enabled: true,
            sections,
            showInNavigation: true
          };
        });

  return definitions
    .filter(page => page.enabled)
    .map(page => toPageRoute(page));
}

function buildSportsSections(sportsData: SportsWebsiteData, archetype: string = 'sports_club'): WebsiteSectionConfig[] {
  const sectionDataset: Partial<Record<SportsSectionType, keyof SportsWebsiteData['dataAvailability']>> = {
    featured_teams: 'teams', team_directory: 'teams', player_directory: 'players', featured_players: 'players',
    upcoming_fixtures: 'fixtures', recent_results: 'fixtures', live_match: 'fixtures', league_standings: 'standings',
    competition_list: 'competitions', match_timeline: 'fixtures', coaching_staff: 'staff', sports_news: 'news',
    sponsor_showcase: 'sponsors', tournament_bracket: 'tournamentStages', participating_teams: 'teams',
    academy_programmes: 'academyProgrammes', training_schedules: 'trainingBatches'
  };

  const definitions: SportsSectionDefinition[] = sportsData.sections?.length
    ? sportsData.sections
    : buildSportsPages(sportsData, archetype).flatMap(page => {
        const key = page.id.replace(/^page_/, '') as SportsPageKey;
        const pageSections = key === 'home' ? getArchetypeHomeSections(archetype) : (SPORTS_PAGE_SECTIONS[key] || []);
        return pageSections
          .filter(type => {
            const dataset = sectionDataset[type];
            return !dataset || sportsData.dataAvailability[dataset];
          })
          .map((type, index) => ({
            id: `${key}_${type}_${index + 1}`,
            type,
            title: undefined,
            subtitle: undefined,
            enabled: true,
            order: index + 1,
            layoutStyle: key === 'home' ? 'featured' : 'directory',
            dataReferences: [],
            metadata: { pageKey: key }
          }));
      });

  return definitions
    .filter(section => section.enabled)
    .map(section => ({
      id: `sports_${section.id}`,
      // WebsiteSectionConfig currently accepts only generic section types.
      // Preserve the exact sports domain type in metadata for the renderer.
      type: 'custom',
      title: section.title || section.type.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()),
      subtitle: section.subtitle,
      content: undefined,
      layoutStyle: section.layoutStyle || 'grid',
      order: section.order,
      enabled: section.enabled,
      metadata: {
        domain: 'sports',
        sportsSectionType: section.type,
        dataReferences: section.dataReferences || [],
        ...(section.metadata || {})
      }
    }));
}

const CULTURAL_SOCIETY_PAGE_META: Record<string, { slug: string; title: string; navLabel: string; sections: string[] }> = {
  home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['cultural_hero', 'cultural_story', 'cultural_programmes', 'cultural_events', 'cultural_committee', 'cultural_membership', 'cultural_gallery', 'cultural_sponsors', 'cultural_contact'] },
  about: { slug: '/about', title: 'Heritage & Society History', navLabel: 'About', sections: ['cultural_story', 'cultural_committee'] },
  activities: { slug: '/activities', title: 'Programmes & Workshops', navLabel: 'Programmes', sections: ['cultural_programmes'] },
  events: { slug: '/events', title: 'Cultural Festivals & Calendar', navLabel: 'Events', sections: ['cultural_events'] },
  committee: { slug: '/committee', title: 'Governing Body & Leaders', navLabel: 'Committee', sections: ['cultural_committee'] },
  membership: { slug: '/membership', title: 'Membership & Enrolment', navLabel: 'Membership', sections: ['cultural_membership'] },
  gallery: { slug: '/gallery', title: 'Photo & Media Archive', navLabel: 'Gallery', sections: ['cultural_gallery'] },
  sponsors: { slug: '/sponsors', title: 'Patrons & Corporate Sponsors', navLabel: 'Patrons', sections: ['cultural_sponsors'] },
  contact: { slug: '/contact', title: 'Contact & Secretarial Desk', navLabel: 'Contact', sections: ['cultural_contact'] }
};

const PUJA_COMMITTEE_PAGE_META: Record<string, { slug: string; title: string; navLabel: string; sections: string[] }> = {
  home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['puja_hero', 'puja_theme', 'puja_schedule', 'puja_programmes', 'puja_organizers', 'puja_visitor_guide', 'puja_donations', 'puja_gallery', 'puja_sponsors', 'puja_contact'] },
  schedule: { slug: '/schedule', title: '5-Day Tithi & Ritual Schedule', navLabel: 'Puja Schedule', sections: ['puja_schedule'] },
  theme: { slug: '/theme', title: 'Pandal Architecture & Artisan Tribute', navLabel: 'Theme & Pratima', sections: ['puja_theme'] },
  'visitor-guide': { slug: '/visitor-guide', title: 'Visitor Transit & Entry Guide', navLabel: 'Visitor Guide', sections: ['puja_visitor_guide'] },
  events: { slug: '/events', title: 'Cultural Evenings & Anandamela', navLabel: 'Celebrations', sections: ['puja_programmes'] },
  committee: { slug: '/committee', title: 'Puja Committee & Organizers', navLabel: 'Committee', sections: ['puja_organizers'] },
  gallery: { slug: '/gallery', title: 'Aarti & Utsav Photo Gallery', navLabel: 'Gallery', sections: ['puja_gallery'] },
  contribute: { slug: '/contribute', title: 'Voluntary Donations & Maha Bhog', navLabel: 'Contribute', sections: ['puja_donations'] },
  sponsors: { slug: '/sponsors', title: 'Sponsors & Brand Partners', navLabel: 'Sponsors', sections: ['puja_sponsors'] },
  contact: { slug: '/contact', title: 'Pandal Location & Contact Desk', navLabel: 'Contact', sections: ['puja_contact'] }
};

export function normalizeEventCategory(cat?: string): EventCategory {
  if (!cat) return 'conference_seminar';
  if (cat === 'launch_reveal' || cat === 'launch_product_reveal') return 'launch_reveal';
  if (cat === 'exhibition_trade' || cat === 'exhibition_trade_fair') return 'exhibition_trade';
  if (cat === 'festival_concert') return 'festival_concert';
  if (cat === 'corporate_business') return 'corporate_business';
  if (cat === 'wedding_private') return 'wedding_private';
  if (cat === 'award_ceremony') return 'award_ceremony';
  return 'conference_seminar';
}

const EVENT_PAGE_META: Record<string, Record<string, { slug: string; title: string; navLabel: string; sections: string[] }>> = {
  conference_seminar: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['conference_hero', 'event_speakers', 'event_agenda', 'event_tickets', 'event_sponsors', 'event_venue', 'event_faq', 'event_contact'] },
    speakers: { slug: '/speakers', title: 'Keynote & Speakers', navLabel: 'Speakers', sections: ['event_speakers'] },
    schedule: { slug: '/schedule', title: 'Agenda & Tracks', navLabel: 'Schedule', sections: ['event_agenda'] },
    tickets: { slug: '/tickets', title: 'Registration & Passes', navLabel: 'Tickets', sections: ['event_tickets'] },
    venue: { slug: '/venue', title: 'Venue & Location', navLabel: 'Venue', sections: ['event_venue'] },
    sponsors: { slug: '/sponsors', title: 'Sponsors & Partners', navLabel: 'Sponsors', sections: ['event_sponsors'] },
    faq: { slug: '/faq', title: 'Frequently Asked Questions', navLabel: 'FAQ', sections: ['event_faq'] },
    contact: { slug: '/contact', title: 'Contact Organizer', navLabel: 'Contact', sections: ['event_contact'] }
  },
  festival_concert: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['festival_hero', 'event_speakers', 'event_agenda', 'event_tickets', 'event_gallery', 'event_venue', 'event_sponsors', 'event_contact'] },
    lineup: { slug: '/lineup', title: 'Artist Lineup & Headliners', navLabel: 'Lineup', sections: ['event_speakers'] },
    stages: { slug: '/stages', title: 'Stages & Schedule', navLabel: 'Stages', sections: ['event_agenda'] },
    tickets: { slug: '/tickets', title: 'Festival Passes & Camping', navLabel: 'Passes', sections: ['event_tickets'] },
    venue: { slug: '/venue', title: 'Location & Travel', navLabel: 'Venue', sections: ['event_venue'] },
    gallery: { slug: '/gallery', title: 'Moments & Highlights', navLabel: 'Gallery', sections: ['event_gallery'] },
    partners: { slug: '/partners', title: 'Brand Partners', navLabel: 'Partners', sections: ['event_sponsors'] },
    contact: { slug: '/contact', title: 'Help & Information', navLabel: 'Info', sections: ['event_contact'] }
  },
  corporate_business: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['corporate_hero', 'event_agenda', 'event_speakers', 'event_tickets', 'event_venue', 'event_sponsors', 'event_contact'] },
    agenda: { slug: '/agenda', title: 'Summit Agenda', navLabel: 'Agenda', sections: ['event_agenda'] },
    speakers: { slug: '/speakers', title: 'Executive Speakers', navLabel: 'Speakers', sections: ['event_speakers'] },
    networking: { slug: '/networking', title: 'Networking Sessions & Roundtables', navLabel: 'Networking', sections: ['event_agenda'] },
    registration: { slug: '/registration', title: 'Delegate Registration', navLabel: 'Register', sections: ['event_tickets'] },
    partners: { slug: '/partners', title: 'Corporate Partners', navLabel: 'Partners', sections: ['event_sponsors'] },
    venue: { slug: '/venue', title: 'Summit Location', navLabel: 'Venue', sections: ['event_venue'] },
    contact: { slug: '/contact', title: 'Organizer Contact', navLabel: 'Contact', sections: ['event_contact'] }
  },
  exhibition_trade: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['exhibition_hero', 'event_exhibitors', 'event_floorplan', 'event_agenda', 'event_tickets', 'event_gallery', 'event_sponsors', 'event_contact'] },
    exhibitors: { slug: '/exhibitors', title: 'Exhibitor Directory', navLabel: 'Exhibitors', sections: ['event_exhibitors'] },
    floorplan: { slug: '/floorplan', title: 'Floor Plan & Sectors', navLabel: 'Floor Plan', sections: ['event_floorplan'] },
    schedule: { slug: '/schedule', title: 'Demonstrations & Workshops', navLabel: 'Schedule', sections: ['event_agenda'] },
    tickets: { slug: '/tickets', title: 'Visitor Badges & Passes', navLabel: 'Badges', sections: ['event_tickets'] },
    gallery: { slug: '/gallery', title: 'Exhibition Showcase', navLabel: 'Showcase', sections: ['event_gallery'] },
    sponsors: { slug: '/sponsors', title: 'Trade Partners & Sponsors', navLabel: 'Partners', sections: ['event_sponsors'] },
    contact: { slug: '/contact', title: 'Exhibitor & Visitor Inquiries', navLabel: 'Contact', sections: ['event_contact'] }
  },
  exhibition_trade_fair: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['exhibition_hero', 'event_exhibitors', 'event_floorplan', 'event_agenda', 'event_tickets', 'event_gallery', 'event_sponsors', 'event_contact'] },
    exhibitors: { slug: '/exhibitors', title: 'Exhibitor Directory', navLabel: 'Exhibitors', sections: ['event_exhibitors'] },
    floorplan: { slug: '/floorplan', title: 'Floor Plan & Sectors', navLabel: 'Floor Plan', sections: ['event_floorplan'] },
    schedule: { slug: '/schedule', title: 'Demonstrations & Workshops', navLabel: 'Schedule', sections: ['event_agenda'] },
    tickets: { slug: '/tickets', title: 'Visitor Badges & Passes', navLabel: 'Badges', sections: ['event_tickets'] },
    gallery: { slug: '/gallery', title: 'Exhibition Showcase', navLabel: 'Showcase', sections: ['event_gallery'] },
    sponsors: { slug: '/sponsors', title: 'Trade Partners & Sponsors', navLabel: 'Partners', sections: ['event_sponsors'] },
    contact: { slug: '/contact', title: 'Exhibitor & Visitor Inquiries', navLabel: 'Contact', sections: ['event_contact'] }
  },
  wedding_private: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['wedding_hero', 'event_wedding_story', 'event_agenda', 'event_wedding_rsvp', 'event_venue', 'event_gallery', 'event_contact'] },
    story: { slug: '/story', title: 'Our Story & Journey', navLabel: 'Our Story', sections: ['event_wedding_story'] },
    schedule: { slug: '/schedule', title: 'Ceremony Itinerary', navLabel: 'Schedule', sections: ['event_agenda'] },
    rsvp: { slug: '/rsvp', title: 'RSVP & Guest Attendance', navLabel: 'RSVP', sections: ['event_wedding_rsvp'] },
    travel: { slug: '/travel', title: 'Travel & Accommodations', navLabel: 'Travel & Stay', sections: ['event_venue'] },
    gallery: { slug: '/gallery', title: 'Memories & Engagement Photos', navLabel: 'Moments', sections: ['event_gallery'] },
    contact: { slug: '/contact', title: 'Celebration Inquiries', navLabel: 'Contact', sections: ['event_contact'] }
  },
  award_ceremony: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['award_hero', 'event_awards', 'event_speakers', 'event_tickets', 'event_agenda', 'event_gallery', 'event_sponsors', 'event_contact'] },
    categories: { slug: '/categories', title: 'Award Categories', navLabel: 'Categories', sections: ['event_awards'] },
    nominees: { slug: '/nominees', title: 'Official Shortlist & Nominees', navLabel: 'Nominees', sections: ['event_awards'] },
    jury: { slug: '/jury', title: 'Distinguished Jury & Hosts', navLabel: 'Jury', sections: ['event_speakers'] },
    ceremony: { slug: '/ceremony', title: 'Gala Night Order of Events', navLabel: 'Ceremony', sections: ['event_agenda'] },
    tickets: { slug: '/tickets', title: 'Gala Seats & Table Reservations', navLabel: 'Tables & Seats', sections: ['event_tickets'] },
    gallery: { slug: '/gallery', title: 'Hall of Fame & Past Winners', navLabel: 'Hall of Fame', sections: ['event_gallery'] },
    contact: { slug: '/contact', title: 'Gala Desk & Sponsorship', navLabel: 'Contact', sections: ['event_contact'] }
  },
  launch_reveal: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['launch_hero', 'event_bento_specs', 'event_agenda', 'event_gallery', 'event_faq', 'event_contact'] },
    product: { slug: '/product', title: 'Product Architecture & Innovation', navLabel: 'Overview', sections: ['event_bento_specs'] },
    specs: { slug: '/specs', title: 'Technical Specifications', navLabel: 'Tech Specs', sections: ['event_bento_specs'] },
    schedule: { slug: '/schedule', title: 'Keynote Broadcast Schedule', navLabel: 'Broadcast', sections: ['event_agenda'] },
    gallery: { slug: '/gallery', title: 'Hardware Gallery & Renders', navLabel: 'Gallery', sections: ['event_gallery'] },
    preorder: { slug: '/preorder', title: 'Pre-Order & Availability', navLabel: 'Pre-Order', sections: ['event_tickets'] },
    contact: { slug: '/contact', title: 'Press & Inquiries', navLabel: 'Press & Inquiries', sections: ['event_contact'] }
  },
  launch_product_reveal: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['launch_hero', 'event_bento_specs', 'event_agenda', 'event_gallery', 'event_faq', 'event_contact'] },
    product: { slug: '/product', title: 'Product Architecture & Innovation', navLabel: 'Overview', sections: ['event_bento_specs'] },
    specs: { slug: '/specs', title: 'Technical Specifications', navLabel: 'Tech Specs', sections: ['event_bento_specs'] },
    schedule: { slug: '/schedule', title: 'Keynote Broadcast Schedule', navLabel: 'Broadcast', sections: ['event_agenda'] },
    gallery: { slug: '/gallery', title: 'Hardware Gallery & Renders', navLabel: 'Gallery', sections: ['event_gallery'] },
    preorder: { slug: '/preorder', title: 'Pre-Order & Availability', navLabel: 'Pre-Order', sections: ['event_tickets'] },
    contact: { slug: '/contact', title: 'Press & Inquiries', navLabel: 'Press & Inquiries', sections: ['event_contact'] }
  }
};

/**
 * Event data for projects built on a library template. Nothing is invented: a value the client did not give stays empty and the
 * template drops that section. Strings are trimmed, URLs must be http(s), colours must be #rrggbb, list items without their key
 * field are dropped, and stored RSVP submissions are carried over untouched. There are no payment fields; a ticket's price is
 * display text only and its button is the organiser's own external booking link.
 */
export function normalizeEventDataStrict(raw: any, reqs: ClientRequirements, category: EventCategory): EventWebsiteData {
  const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
  const url = (v: unknown): string => { const t = s(v); return /^https?:\/\/[^\s]+$/i.test(t) ? t : ''; };
  const hex = (v: unknown): string => (/^#[0-9a-fA-F]{6}$/.test(s(v)) ? s(v) : '');
  const time = (v: unknown): string | undefined => (/^\d{2}:\d{2}$/.test(s(v)) ? s(v) : undefined);
  const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
  const id = (x: any, prefix: string, i: number): string => s(x?.id) || `${prefix}-${i + 1}`;
  const strs = (v: unknown): string[] => list(v).map(s).filter(Boolean);

  const p = raw?.profile || {};
  const b = raw?.branding || {};
  const profile: EventProfile = {
    name: s(p.name) || s(reqs.organizationName),
    edition: s(p.edition) || undefined,
    tagline: s(p.tagline) || s(reqs.tagline),
    description: s(p.description) || s(reqs.aboutText),
    startDate: s(p.startDate), endDate: s(p.endDate) || undefined,
    time: s(p.time), startTime: time(p.startTime), endTime: time(p.endTime), timezone: s(p.timezone),
    venueName: s(p.venueName), venueAddress: s(p.venueAddress), city: s(p.city), country: s(p.country),
    isVirtual: Boolean(p.isVirtual), isHybrid: Boolean(p.isHybrid), virtualStreamUrl: url(p.virtualStreamUrl) || undefined,
    organizerName: s(p.organizerName) || s(reqs.contactPerson),
    organizerEmail: s(p.organizerEmail) || s(reqs.contactEmail),
    organizerPhone: s(p.organizerPhone) || s(reqs.contactPhone) || undefined,
    socialLinks: Object.fromEntries(Object.entries(p.socialLinks || {}).map(([k, v]) => [k, url(v)]).filter(([, v]) => v))
  };
  const branding: EventBrandingIdentity = {
    primaryColor: hex(b.primaryColor) || hex(reqs.primaryColor), accentColor: hex(b.accentColor) || hex(reqs.accentColor),
    backgroundColor: hex(b.backgroundColor) || undefined, typographyStyle: (s(b.typographyStyle) as any) || 'modern', preferredTheme: s(b.preferredTheme) || undefined,
    logoUrl: s(b.logoUrl) || s(reqs.logoUrl) || undefined, coverImageUrl: s(b.coverImageUrl) || s(reqs.coverImageUrl) || undefined, badgeText: s(b.badgeText) || undefined
  };

  const speakers: EventPerson[] = list(raw?.speakers).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'spk', i), name: s(x.name), role: s(x.role) || 'speaker', title: s(x.title) || undefined, organization: s(x.organization) || undefined,
    bio: s(x.bio), topic: s(x.topic) || undefined, photoUrl: s(x.photoUrl) || undefined, isFeatured: Boolean(x.isFeatured), socialUrl: url(x.socialUrl) || undefined, displayOrder: i
  }));
  const tracks: EventTrack[] = list(raw?.tracks).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'trk', i), name: s(x.name), description: s(x.description) || undefined, color: hex(x.color) || '#64748b', stage: s(x.stage) || undefined
  }));
  const sessions: EventSession[] = list(raw?.sessions).filter((x) => s(x?.title)).map((x, i) => ({
    id: id(x, 'ses', i), title: s(x.title), description: s(x.description), day: s(x.day), date: s(x.date), startTime: s(x.startTime), endTime: s(x.endTime),
    trackId: s(x.trackId) || undefined, stage: s(x.stage) || undefined, speakerIds: strs(x.speakerIds), room: s(x.room) || undefined, isKeynote: Boolean(x.isKeynote), tags: strs(x.tags)
  }));
  const tickets: EventTicketTier[] = list(raw?.tickets).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'tkt', i), name: s(x.name), price: typeof x.price === 'number' && Number.isFinite(x.price) ? x.price : s(x.price), currency: s(x.currency),
    description: s(x.description), features: strs(x.features), badge: s(x.badge) || undefined, isAvailable: x.isAvailable !== false, registrationUrl: url(x.registrationUrl) || undefined
  }));
  const exhibitors: EventExhibitor[] = list(raw?.exhibitors).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'exh', i), name: s(x.name), category: s(x.category), boothNumber: s(x.boothNumber) || undefined, hallSector: s(x.hallSector) || undefined, description: s(x.description),
    logoUrl: s(x.logoUrl) || undefined, imageUrl: s(x.imageUrl) || undefined, specHighlights: strs(x.specHighlights), websiteUrl: url(x.websiteUrl) || undefined
  }));
  const awardCategories: EventAwardCategory[] = list(raw?.awardCategories).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'awd', i), name: s(x.name), description: s(x.description), sponsorName: s(x.sponsorName) || undefined,
    nominees: list(x.nominees).filter((n) => s(n?.title)).map((n, j) => ({ id: id(n, 'nom', j), title: s(n.title), subtitle: s(n.subtitle), isWinner: Boolean(n.isWinner), imageUrl: s(n.imageUrl) || undefined, categoryId: id(x, 'awd', i) }))
  }));
  const w = raw?.weddingStory;
  const weddingStory: EventWeddingStory | undefined = w ? {
    coupleNames: s(w.coupleNames), partnerOne: s(w.partnerOne), partnerTwo: s(w.partnerTwo),
    storyMilestones: list(w.storyMilestones).filter((m) => s(m?.title)).map((m, i) => ({ id: id(m, 'ms', i), title: s(m.title), date: s(m.date) || undefined, text: s(m.text), imageUrl: s(m.imageUrl) || undefined })),
    ceremonyItinerary: list(w.ceremonyItinerary).filter((c) => s(c?.eventName)).map((c, i) => ({ id: id(c, 'cer', i), time: s(c.time), eventName: s(c.eventName), venue: s(c.venue), dressCode: s(c.dressCode), description: s(c.description) || undefined })),
    hotelBlocks: list(w.hotelBlocks).filter((h) => s(h?.hotelName)).map((h, i) => ({ id: id(h, 'htl', i), hotelName: s(h.hotelName), address: s(h.address), bookingCode: s(h.bookingCode) || undefined, link: url(h.link) || undefined, deadline: s(h.deadline) || undefined, distanceToVenue: s(h.distanceToVenue) || undefined })),
    registryLinks: list(w.registryLinks).map((r) => ({ storeName: s(r?.storeName), url: url(r?.url) })).filter((r) => r.storeName && r.url)
  } : undefined;
  const pl = raw?.productLaunch;
  const productLaunch: EventProductLaunch | undefined = pl ? {
    productName: s(pl.productName), tagline: s(pl.tagline), heroHeadline: s(pl.heroHeadline), heroSubheadline: s(pl.heroSubheadline) || undefined, revealVideoUrl: url(pl.revealVideoUrl) || undefined,
    bentoHighlights: list(pl.bentoHighlights).filter((h) => s(h?.title)).map((h, i) => ({ id: id(h, 'hl', i), title: s(h.title), subtitle: s(h.subtitle) || undefined, description: s(h.description), metric: s(h.metric) || undefined, imageUrl: s(h.imageUrl) || undefined })),
    techSpecs: list(pl.techSpecs).filter((g) => s(g?.group)).map((g) => ({ group: s(g.group), items: list(g.items).map((it) => ({ label: s(it?.label), value: s(it?.value) })).filter((it) => it.label && it.value) })),
    preorderCtaText: s(pl.preorderCtaText) || undefined, preorderUrl: url(pl.preorderUrl) || undefined
  } : undefined;
  const sponsors: EventSponsor[] = list(raw?.sponsors).filter((x) => s(x?.name)).map((x, i) => ({
    id: id(x, 'spo', i), name: s(x.name), tier: (['title', 'diamond', 'platinum', 'gold', 'silver', 'partner', 'media'].includes(s(x.tier)) ? s(x.tier) : 'partner') as EventSponsor['tier'],
    logoUrl: s(x.logoUrl) || undefined, websiteUrl: url(x.websiteUrl) || undefined
  }));
  const v = raw?.venue || {};
  const venue: EventVenueInfo = {
    venueName: s(v.venueName) || profile.venueName, address: s(v.address) || profile.venueAddress, city: s(v.city) || profile.city, country: s(v.country) || profile.country,
    mapEmbedUrl: url(v.mapEmbedUrl) || undefined, metroTransit: s(v.metroTransit) || undefined, parkingInfo: s(v.parkingInfo) || undefined, airportInfo: s(v.airportInfo) || undefined,
    floorPlanUrl: s(v.floorPlanUrl) || undefined, wheelchairAccessible: typeof v.wheelchairAccessible === 'boolean' ? v.wheelchairAccessible : undefined
  };
  const faqs: EventFAQItem[] = list(raw?.faqs).filter((x) => s(x?.question) && s(x?.answer)).map((x, i) => ({ id: id(x, 'faq', i), question: s(x.question), answer: s(x.answer), category: s(x.category) || undefined }));
  const gallery: EventMediaItem[] = list(raw?.gallery).filter((x) => s(x?.url)).map((x, i) => ({
    id: id(x, 'med', i), title: s(x.title), type: x.type === 'video' ? 'video' : 'photo', url: s(x.url), thumbnailUrl: s(x.thumbnailUrl) || undefined, caption: s(x.caption) || undefined, category: s(x.category) || undefined, youtubeId: s(x.youtubeId) || undefined
  }));
  // RSVP replies are private data collected by the site; whatever is stored is carried over untouched.
  const rsvpSubmissions: any[] = list(raw?.rsvpSubmissions);

  return {
    schemaVersion: '1.0', category, profile, branding, speakers, tracks, sessions, tickets, exhibitors, awardCategories, weddingStory, productLaunch, sponsors, venue, faqs, gallery, rsvpSubmissions,
    dataAvailability: {
      speakers: speakers.length > 0, schedule: sessions.length > 0, tickets: tickets.length > 0, exhibitors: exhibitors.length > 0, awards: awardCategories.length > 0,
      weddingStory: Boolean(weddingStory && (weddingStory.coupleNames || weddingStory.storyMilestones.length || weddingStory.ceremonyItinerary.length)),
      productLaunch: Boolean(productLaunch && (productLaunch.productName || productLaunch.bentoHighlights.length)), sponsors: sponsors.length > 0,
      venue: Boolean(venue.venueName || venue.address), faqs: faqs.length > 0, gallery: gallery.length > 0
    }
  };
}

function normalizeEventData(
  raw: any,
  reqs: ClientRequirements,
  category: EventCategory
): EventWebsiteData {
  if (usesEventLibraryTemplate(reqs)) return normalizeEventDataStrict(raw, reqs, category);
  const profileRaw = raw?.profile || {};
  const brandingRaw = raw?.branding || {};

  const profile: EventProfile = {
    name: profileRaw.name || reqs.organizationName || 'Event Experience',
    edition: profileRaw.edition || '2026 Edition',
    tagline: profileRaw.tagline || reqs.tagline || '',
    description: profileRaw.description || reqs.aboutText || 'A premier gathering of industry leaders, innovators, and creators.',
    startDate: profileRaw.startDate || '2026-11-20',
    endDate: profileRaw.endDate || '2026-11-22',
    time: profileRaw.time || '09:00 AM - 06:00 PM',
    timezone: profileRaw.timezone || 'IST',
    venueName: profileRaw.venueName || reqs.address || 'Convention & Exhibition Center',
    venueAddress: profileRaw.venueAddress || reqs.address || 'Grand Avenue',
    city: profileRaw.city || 'Bangalore',
    country: profileRaw.country || 'India',
    isVirtual: Boolean(profileRaw.isVirtual),
    isHybrid: Boolean(profileRaw.isHybrid),
    virtualStreamUrl: profileRaw.virtualStreamUrl,
    organizerName: profileRaw.organizerName || reqs.contactPerson || 'Event Organizing Committee',
    organizerEmail: profileRaw.organizerEmail || reqs.contactEmail || 'contact@event.internal',
    organizerPhone: profileRaw.organizerPhone || reqs.contactPhone || '+91 80 4000 0000',
    socialLinks: profileRaw.socialLinks || reqs.socialLinks || {}
  };

  const defaultPrimaryColor = category === 'conference_seminar' ? '#3b82f6'
    : category === 'festival_concert' ? '#ec4899'
    : category === 'corporate_business' ? '#1e40af'
    : category === 'exhibition_trade' ? '#0f766e'
    : category === 'wedding_private' ? '#be185d'
    : category === 'award_ceremony' ? '#ca8a04'
    : '#000000';

  const defaultAccentColor = category === 'conference_seminar' ? '#06b6d4'
    : category === 'festival_concert' ? '#f59e0b'
    : category === 'corporate_business' ? '#38bdf8'
    : category === 'exhibition_trade' ? '#d97706'
    : category === 'wedding_private' ? '#f472b6'
    : category === 'award_ceremony' ? '#eab308'
    : '#2563eb';

  const defaultTypo = category === 'conference_seminar' ? 'modern'
    : category === 'festival_concert' ? 'festive'
    : category === 'corporate_business' ? 'modern'
    : category === 'exhibition_trade' ? 'editorial'
    : category === 'wedding_private' ? 'luxury'
    : category === 'award_ceremony' ? 'cinematic'
    : 'futuristic';

  const branding: EventBrandingIdentity = {
    primaryColor: brandingRaw.primaryColor || reqs.primaryColor || defaultPrimaryColor,
    accentColor: brandingRaw.accentColor || reqs.accentColor || defaultAccentColor,
    backgroundColor: brandingRaw.backgroundColor,
    typographyStyle: brandingRaw.typographyStyle || (reqs.typographyStyle as any) || defaultTypo,
    preferredTheme: brandingRaw.preferredTheme,
    logoUrl: brandingRaw.logoUrl || reqs.logoUrl,
    coverImageUrl: brandingRaw.coverImageUrl || reqs.coverImageUrl,
    badgeText: brandingRaw.badgeText || profile.edition
  };

  const speakers: EventPerson[] = Array.isArray(raw?.speakers) ? raw.speakers : [];
  const tracks: EventTrack[] = Array.isArray(raw?.tracks) ? raw.tracks : [];
  const sessions: EventSession[] = Array.isArray(raw?.sessions) ? raw.sessions : [];
  const tickets: EventTicketTier[] = Array.isArray(raw?.tickets) ? raw.tickets : [];
  const exhibitors: EventExhibitor[] = Array.isArray(raw?.exhibitors) ? raw.exhibitors : [];
  const awardCategories: EventAwardCategory[] = Array.isArray(raw?.awardCategories) ? raw.awardCategories : [];
  const weddingStory: EventWeddingStory | undefined = raw?.weddingStory || undefined;
  const productLaunch: EventProductLaunch | undefined = raw?.productLaunch || undefined;
  const sponsors: EventSponsor[] = Array.isArray(raw?.sponsors) ? raw.sponsors : [];
  const venue: EventVenueInfo = raw?.venue || {
    venueName: profile.venueName,
    address: profile.venueAddress,
    city: profile.city,
    country: profile.country
  };
  const faqs: EventFAQItem[] = Array.isArray(raw?.faqs) ? raw.faqs : [];
  const gallery: EventMediaItem[] = Array.isArray(raw?.gallery) ? raw.gallery : [];
  const rsvpSubmissions: any[] = Array.isArray(raw?.rsvpSubmissions) ? raw.rsvpSubmissions : [];

  const dataAvailability = {
    speakers: speakers.length > 0,
    schedule: sessions.length > 0,
    tickets: tickets.length > 0,
    exhibitors: exhibitors.length > 0,
    awards: awardCategories.length > 0,
    weddingStory: Boolean(weddingStory && (weddingStory.coupleNames || weddingStory.storyMilestones?.length)),
    productLaunch: Boolean(productLaunch && productLaunch.productName),
    sponsors: sponsors.length > 0,
    venue: Boolean(venue.venueName || venue.address),
    faqs: faqs.length > 0,
    gallery: gallery.length > 0
  };

  return {
    schemaVersion: '1.0',
    category,
    profile,
    branding,
    speakers,
    tracks,
    sessions,
    tickets,
    exhibitors,
    awardCategories,
    weddingStory,
    productLaunch,
    sponsors,
    venue,
    faqs,
    gallery,
    rsvpSubmissions,
    dataAvailability
  };
}

function buildEventPages(eventData: EventWebsiteData, category: EventCategory): PageRoute[] {
  const catMeta = EVENT_PAGE_META[category] || EVENT_PAGE_META.conference_seminar;
  return Object.entries(catMeta).map(([key, page]) => ({
    id: `page_${key}`,
    slug: page.slug,
    title: page.title,
    navLabel: page.navLabel,
    enabled: true,
    sections: page.sections
  }));
}

function buildEventSections(eventData: EventWebsiteData, category: EventCategory): WebsiteSectionConfig[] {
  const profile = eventData.profile;
  const branding = eventData.branding;
  const heroSectionType = `${category.split('_')[0]}_hero` as EventSectionType;

  const heroTitles: Record<EventCategory, { title: string; subtitle: string; content: string }> = {
    conference_seminar: {
      title: profile.name,
      subtitle: `${profile.edition || 'Global Summit'} • ${profile.startDate} • ${profile.venueName}, ${profile.city}`,
      content: profile.description || 'Where visionaries converge to shape the future of technology, intelligence, and humanity.'
    },
    festival_concert: {
      title: profile.name,
      subtitle: `${profile.startDate} - ${profile.endDate || ''} • ${profile.venueName} • Non-stop Live Sets`,
      content: profile.description || 'An immersive multi-stage sonic celebration featuring world-class artists, visual arts, and festival culture.'
    },
    corporate_business: {
      title: profile.name,
      subtitle: `Annual Leadership Summit • ${profile.startDate} • ${profile.venueName}`,
      content: profile.description || 'Accelerating enterprise transformation, sustainable growth, and C-suite strategic alignment.'
    },
    exhibition_trade: {
      title: profile.name,
      subtitle: `International Trade Exhibition • ${profile.startDate} - ${profile.endDate || ''} • ${profile.venueName}`,
      content: profile.description || 'Connecting leading global manufacturers, buyers, innovators, and design visionaries across specialized industry pavilions.'
    },
    wedding_private: {
      title: eventData.weddingStory?.coupleNames || profile.name,
      subtitle: `Together With Their Families • ${profile.startDate} • ${profile.venueName}`,
      content: profile.description || 'We invite you to share our joy as we celebrate our love and begin our new chapter together.'
    },
    award_ceremony: {
      title: profile.name,
      subtitle: `The Official Annual Gala & Trophy Presentation • ${profile.startDate} • Red Carpet Evening`,
      content: profile.description || 'Honoring the most groundbreaking achievements, fearless creativity, and extraordinary excellence.'
    },
    launch_reveal: {
      title: eventData.productLaunch?.productName || profile.name,
      subtitle: eventData.productLaunch?.tagline || `Special Live Keynote Broadcast • ${profile.startDate}`,
      content: eventData.productLaunch?.heroHeadline || profile.description || 'A monumental leap forward in design, intelligence, and engineered perfection.'
    }
  };

  const currentHero = heroTitles[category] || heroTitles.conference_seminar;

  const sections: WebsiteSectionConfig[] = [
    {
      id: `sec_${category}_hero`,
      type: heroSectionType,
      title: currentHero.title,
      subtitle: currentHero.subtitle,
      content: currentHero.content,
      layoutStyle: 'editorial',
      order: 1,
      enabled: true,
      metadata: {
        domain: 'event',
        eventCategory: category,
        profile,
        branding,
        weddingStory: eventData.weddingStory,
        productLaunch: eventData.productLaunch
      }
    },
    {
      id: 'sec_event_speakers',
      type: 'event_speakers',
      title: category === 'festival_concert' ? 'Artist Lineup & Performers'
        : category === 'award_ceremony' ? 'Jury Members & Special Hosts'
        : 'Featured Keynotes & Industry Leaders',
      subtitle: category === 'festival_concert' ? 'World-class artists performing live' : 'Distinguished voices sharing perspectives and breakthroughs',
      content: 'Session speakers and thought leaders.',
      layoutStyle: 'grid',
      order: 2,
      enabled: eventData.dataAvailability.speakers,
      metadata: { domain: 'event', eventCategory: category, speakers: eventData.speakers }
    },
    {
      id: 'sec_event_agenda',
      type: 'event_agenda',
      title: category === 'wedding_private' ? 'Wedding Day Itinerary'
        : category === 'festival_concert' ? 'Stage Schedule & Set Times'
        : 'Conference Timetable & Multi-Track Agenda',
      subtitle: `${profile.startDate} • Structured timeline across all sessions and stages`,
      content: 'Explore sessions, keynotes, masterclasses, and breaks.',
      layoutStyle: 'list',
      order: 3,
      enabled: eventData.dataAvailability.schedule,
      metadata: { domain: 'event', eventCategory: category, sessions: eventData.sessions, tracks: eventData.tracks }
    },
    {
      id: 'sec_event_tickets',
      type: 'event_tickets',
      title: category === 'award_ceremony' ? 'Gala Table & Seat Reservations'
        : category === 'festival_concert' ? 'Festival Passes & Camping Options'
        : category === 'exhibition_trade' ? 'Visitor Badges & Trade Registration'
        : 'Passes, Badges & Ticket Tiers',
      subtitle: 'Transparent registration with immediate badge confirmation',
      content: 'Select the pass tier that fits your team or attendance requirements.',
      layoutStyle: 'cards',
      order: 4,
      enabled: eventData.dataAvailability.tickets,
      metadata: { domain: 'event', eventCategory: category, tickets: eventData.tickets }
    },
    {
      id: 'sec_event_exhibitors',
      type: 'event_exhibitors',
      title: 'Exhibitor Pavilion Directory',
      subtitle: 'Explore participating companies, booth locations, and showcase sectors',
      content: 'Curated industry brands displaying the newest advancements.',
      layoutStyle: 'grid',
      order: 5,
      enabled: eventData.dataAvailability.exhibitors,
      metadata: { domain: 'event', eventCategory: category, exhibitors: eventData.exhibitors }
    },
    {
      id: 'sec_event_floorplan',
      type: 'event_floorplan',
      title: 'Interactive Floor Plan & Pavilion Map',
      subtitle: `${profile.venueName} • Complete exhibition hall navigation`,
      content: 'Locate exhibition booths, presentation arenas, and networking lounges.',
      layoutStyle: 'split',
      order: 6,
      enabled: Boolean(eventData.venue?.floorPlanUrl || eventData.dataAvailability.exhibitors),
      metadata: { domain: 'event', eventCategory: category, floorPlanUrl: eventData.venue?.floorPlanUrl }
    },
    {
      id: 'sec_event_awards',
      type: 'event_awards',
      title: 'Official Award Categories & Nominees',
      subtitle: 'Recognizing unparalleled innovation and creative excellence',
      content: 'Shortlisted nominees across prestigious categories judged by our independent jury.',
      layoutStyle: 'grid',
      order: 7,
      enabled: eventData.dataAvailability.awards,
      metadata: { domain: 'event', eventCategory: category, awardCategories: eventData.awardCategories }
    },
    {
      id: 'sec_event_wedding_story',
      type: 'event_wedding_story',
      title: 'Our Journey & Love Story',
      subtitle: `${eventData.weddingStory?.partnerOne || 'Partner 1'} & ${eventData.weddingStory?.partnerTwo || 'Partner 2'}`,
      content: 'Key moments and memories from the day we met to forever.',
      layoutStyle: 'editorial',
      order: 8,
      enabled: eventData.dataAvailability.weddingStory,
      metadata: { domain: 'event', eventCategory: category, weddingStory: eventData.weddingStory }
    },
    {
      id: 'sec_event_wedding_rsvp',
      type: 'event_wedding_rsvp',
      title: 'Kindly Respond — RSVP',
      subtitle: 'Please confirm your attendance by the designated deadline',
      content: 'We look forward to celebrating together.',
      layoutStyle: 'split',
      order: 9,
      enabled: category === 'wedding_private',
      metadata: { domain: 'event', eventCategory: category }
    },
    {
      id: 'sec_event_bento_specs',
      type: 'event_bento_specs',
      title: eventData.productLaunch?.tagline || 'Engineered Breakthroughs & Architectural Innovation',
      subtitle: `${eventData.productLaunch?.productName || profile.name} Specifications`,
      content: 'Uncompromising power, efficiency, and industrial craftsmanship.',
      layoutStyle: 'grid',
      order: 10,
      enabled: eventData.dataAvailability.productLaunch,
      metadata: { domain: 'event', eventCategory: category, productLaunch: eventData.productLaunch }
    },
    {
      id: 'sec_event_venue',
      type: 'event_venue',
      title: 'Venue, Travel & Accommodations',
      subtitle: `${profile.venueName} • ${profile.venueAddress}, ${profile.city}`,
      content: 'Transit recommendations, airport proximity, parking guidelines, and discounted hotel room blocks.',
      layoutStyle: 'split',
      order: 11,
      enabled: eventData.dataAvailability.venue,
      metadata: { domain: 'event', eventCategory: category, venue: eventData.venue, hotelBlocks: eventData.weddingStory?.hotelBlocks }
    },
    {
      id: 'sec_event_sponsors',
      type: 'event_sponsors',
      title: 'Ecosystem Partners & Global Sponsors',
      subtitle: 'Supported by industry-leading organizations and visionary brands',
      content: 'Proud to collaborate with our valued sponsors and ecosystem contributors.',
      layoutStyle: 'grid',
      order: 12,
      enabled: eventData.dataAvailability.sponsors,
      metadata: { domain: 'event', eventCategory: category, sponsors: eventData.sponsors }
    },
    {
      id: 'sec_event_faq',
      type: 'event_faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Essential information regarding passes, access, directions, and schedule',
      content: 'Find instant answers to common questions about the event experience.',
      layoutStyle: 'list',
      order: 13,
      enabled: eventData.dataAvailability.faqs,
      metadata: { domain: 'event', eventCategory: category, faqs: eventData.faqs }
    },
    {
      id: 'sec_event_gallery',
      type: 'event_gallery',
      title: 'Moments, Highlights & Media Archive',
      subtitle: 'Capturing unforgettable memories, live sets, and keynote sessions',
      content: 'Visual highlights from previous editions and current sessions.',
      layoutStyle: 'grid',
      order: 14,
      enabled: eventData.dataAvailability.gallery,
      metadata: { domain: 'event', eventCategory: category, gallery: eventData.gallery }
    },
    {
      id: 'sec_event_contact',
      type: 'event_contact',
      title: 'Organizer Contact & Inquiries Desk',
      subtitle: `${profile.organizerName} • ${profile.city}`,
      content: `For inquiries regarding tickets, speaker coordination, press credentials, or sponsorships, contact our team at ${profile.organizerEmail}.`,
      layoutStyle: 'split',
      order: 15,
      enabled: true,
      metadata: { domain: 'event', eventCategory: category, profile }
    }
  ];

  return sections;
}

function normalizeCulturalData(
  raw: any,
  reqs: ClientRequirements,
  archetype: string
): CulturalWebsiteData {
  const isPuja = archetype === 'puja_committee' || raw?.websiteType === 'puja_committee';
  const orgRaw = raw?.organization || raw?.societyInfo || raw?.pujaInfo || {};
  const brandingRaw = raw?.branding || {};

  const organization: CulturalOrganizationProfile = {
    name: orgRaw.name || orgRaw.societyName || reqs.organizationName || '',
    nativeName: orgRaw.nativeName || raw?.pujaInfo?.deity || '',
    type: isPuja ? 'puja_committee' : 'cultural_society',
    establishedYear: Number(orgRaw.establishedYear) || undefined,
    registrationNumber: orgRaw.registrationNumber || '',
    tagline: orgRaw.tagline || reqs.tagline || '',
    description: orgRaw.description || reqs.aboutText || '',
    history: orgRaw.history || reqs.aboutText || '',
    mission: orgRaw.mission || '',
    vision: orgRaw.vision || '',
    coreValues: orgRaw.coreValues || [],
    headquarters: orgRaw.headquarters || raw?.contactInfo?.address || reqs.address || '',
    city: orgRaw.city || '',
    state: orgRaw.state || '',
    country: orgRaw.country || '',
    contactPerson: orgRaw.contactPerson || reqs.contactPerson || '',
    contactEmail: orgRaw.contactEmail || raw?.contactInfo?.email || reqs.contactEmail || '',
    contactPhone: orgRaw.contactPhone || raw?.contactInfo?.phone || reqs.contactPhone || '',
    operatingArea: orgRaw.operatingArea || '',
    socialLinks: orgRaw.socialLinks || raw?.contactInfo?.socialLinks || {}
  };

  const branding: CulturalBrandingIdentity = {
    primaryLogoUrl: brandingRaw.primaryLogoUrl || reqs.logoUrl,
    alternativeLogoUrl: brandingRaw.alternativeLogoUrl,
    faviconUrl: brandingRaw.faviconUrl,
    coverImageUrl: brandingRaw.coverImageUrl || reqs.coverImageUrl,
    primaryColor: brandingRaw.primaryColor || reqs.primaryColor || (isPuja ? '#991b1b' : '#881337'),
    secondaryColor: brandingRaw.secondaryColor,
    accentColor: brandingRaw.accentColor || reqs.accentColor || '#f59e0b',
    typographyStyle: brandingRaw.typographyStyle || (reqs.typographyStyle as any) || (isPuja ? 'bilingual' : 'classical'),
    preferredTheme: brandingRaw.preferredTheme || (isPuja ? 'durga-puja' : 'cultural-heritage')
  };

  const leadership: CulturalLeader[] = Array.isArray(raw?.leadership)
    ? raw.leadership
    : Array.isArray(raw?.committee)
    ? raw.committee.map((c: any, idx: number) => ({
        id: c.id || `lead_${idx + 1}`,
        name: c.name || '',
        nativeName: c.nativeName || '',
        designation: c.designation || c.role || 'Committee Member',
        roleCategory: c.roleCategory || 'executive',
        profileImageUrl: c.photo || c.profileImageUrl,
        bio: c.bio,
        displayOrder: idx + 1
      }))
    : [];

  const activities: CulturalActivity[] = Array.isArray(raw?.activities)
    ? raw.activities
    : Array.isArray(raw?.programmes)
    ? raw.programmes.map((p: any, idx: number) => ({
        id: p.id || `act_${idx + 1}`,
        title: p.title || '',
        titleNative: p.titleNative,
        category: p.category || 'music',
        description: p.description || '',
        schedule: p.frequency || p.schedule,
        venue: p.venue,
        featuredImageUrl: p.featuredImageUrl,
        isUpcoming: true
      }))
    : [];

  const events: CulturalEvent[] = Array.isArray(raw?.events)
    ? raw.events
    : Array.isArray(raw?.culturalEvents)
    ? raw.culturalEvents.map((e: any, idx: number) => ({
        id: e.id || `evt_${idx + 1}`,
        title: e.title || '',
        titleNative: e.titleNative,
        category: e.category || 'Festival',
        description: e.description || '',
        startDate: e.date || e.startDate || '',
        endDate: e.endDate,
        time: e.time || '',
        venue: e.venue || '',
        status: 'upcoming'
      }))
    : [];

  const gallery: CulturalMediaItem[] = Array.isArray(raw?.gallery) ? raw.gallery : [];
  const sponsors: CulturalSponsor[] = Array.isArray(raw?.sponsors) ? raw.sponsors : [];
  const news: CulturalNewsArticle[] = Array.isArray(raw?.news) ? raw.news : [];

  let pujaSchedule: PujaRitualScheduleItem[] | undefined = undefined;
  if (Array.isArray(raw?.pujaSchedule)) {
    pujaSchedule = raw.pujaSchedule;
  } else if (Array.isArray(raw?.tithiSchedule)) {
    pujaSchedule = raw.tithiSchedule.map((t: any, idx: number) => ({
      id: t.id || `tithi_${idx + 1}`,
      dayName: t.dayLabel || t.dayName || '',
      date: t.date || '',
      rituals: Array.isArray(t.rituals) ? t.rituals : []
    }));
  }

  let pujaTheme: PujaThemeDecoration | undefined = undefined;
  if (raw?.pujaTheme) {
    pujaTheme = raw.pujaTheme;
  } else if (raw?.pujaInfo?.themeName) {
    pujaTheme = {
      currentThemeName: raw.pujaInfo.themeName,
      editionYear: String(raw.pujaInfo.edition || raw.pujaInfo.year || ''),
      themeConcept: raw.pujaInfo.themeDescription || '',
      idolArtisan: raw.pujaInfo.leadArtisan,
      pandalArchitecture: raw.pujaInfo.pandalArchitect,
      themeImages: []
    };
  }

  // Visiting hours are the committee's to state; an empty value stays empty rather than being filled with a guess.
  const visitorGuide: PujaVisitorGuide | undefined = raw?.visitorGuide;

  let donationInfo: CulturalDonationInfo | undefined = raw?.donationInfo;
  if (!donationInfo && raw?.donations) {
    donationInfo = {
      campaignTitle: raw.donations.campaignTitle || '',
      appealMessage: raw.donations.appealMessage || '',
      causes: (raw.donations.bhogSponsorshipTiers || []).map((b: any, idx: number) => ({
        id: `cause_${idx + 1}`,
        title: b.name,
        description: b.description || ''
      })),
      transparencyNote: raw.donations.transparencyNote || '',
      contactForDonations: raw.donations.bankDetails ? `Account: ${raw.donations.bankDetails.accountNumber} (${raw.donations.bankDetails.bankName})` : ''
    };
  }

  let membershipInfo: CulturalMembershipInfo | undefined = raw?.membershipInfo;
  if (!membershipInfo && Array.isArray(raw?.memberships)) {
    membershipInfo = {
      enabled: raw.memberships.length > 0,
      membershipTypes: raw.memberships.map((m: any) => ({
        name: m.tierName || m.name,
        fee: m.fee,
        benefits: m.benefits || []
      }))
    };
  }

  return {
    schemaVersion: '1.0',
    websiteType: isPuja ? 'puja_committee' : 'cultural_society',
    festivalType: raw?.festivalType || (isPuja ? 'durga_puja' : undefined),
    organization,
    branding,
    leadership,
    activities,
    events,
    gallery,
    sponsors,
    news,
    pujaSchedule,
    pujaTheme,
    visitorGuide,
    donationInfo,
    membershipInfo,
    dataAvailability: {
      leadership: leadership.length > 0,
      activities: activities.length > 0,
      events: events.length > 0,
      gallery: gallery.length > 0,
      sponsors: sponsors.length > 0,
      news: news.length > 0,
      pujaSchedule: Boolean(pujaSchedule?.length),
      pujaTheme: Boolean(pujaTheme?.currentThemeName),
      visitorGuide: Boolean(visitorGuide?.pandalLocation),
      donationInfo: Boolean(donationInfo?.appealMessage),
      membership: Boolean(membershipInfo?.enabled)
    }
  };
}

function buildCulturalPages(culturalData: CulturalWebsiteData, archetype: string): PageRoute[] {
  const isPuja = archetype === 'puja_committee' || culturalData.websiteType === 'puja_committee';
  const meta = isPuja ? PUJA_COMMITTEE_PAGE_META : CULTURAL_SOCIETY_PAGE_META;

  return Object.entries(meta).map(([key, page]) => ({
    id: `page_${key}`,
    slug: page.slug,
    title: page.title,
    navLabel: page.navLabel,
    enabled: true,
    sections: page.sections
  }));
}

function buildCulturalSections(culturalData: CulturalWebsiteData, archetype: string): WebsiteSectionConfig[] {
  const isPuja = archetype === 'puja_committee' || culturalData.websiteType === 'puja_committee';
  const org = culturalData.organization || {
    name: 'Cultural Organization',
    description: '',
    headquarters: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  };
  const branding = culturalData.branding || {
    primaryColor: '#881337',
    accentColor: '#f59e0b'
  };
  const activities = culturalData.activities || [];
  const events = culturalData.events || [];
  const leadership = culturalData.leadership || [];
  const gallery = culturalData.gallery || [];
  const sponsors = culturalData.sponsors || [];

  if (isPuja) {
    const sections: WebsiteSectionConfig[] = [
      {
        id: 'sec_puja_hero',
        type: 'puja_hero',
        title: org.name,
        subtitle: org.nativeName || org.tagline || 'Maha Sharadotsav 2026',
        content: org.description,
        layoutStyle: 'editorial',
        order: 1,
        enabled: true,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          festivalType: culturalData.festivalType || 'durga_puja',
          nativeName: org.nativeName,
          coverImageUrl: branding.coverImageUrl
        }
      },
      {
        id: 'sec_puja_theme',
        type: 'puja_theme',
        title: culturalData.pujaTheme?.currentThemeName || 'Pandal Architecture & Concept',
        subtitle: culturalData.pujaTheme?.idolArtisan || 'Master Artisan Tribute',
        content: culturalData.pujaTheme?.themeConcept || org.description,
        layoutStyle: 'editorial',
        order: 2,
        enabled: Boolean(culturalData.pujaTheme?.currentThemeName),
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          pujaTheme: culturalData.pujaTheme
        }
      },
      {
        id: 'sec_puja_schedule',
        type: 'puja_schedule',
        title: '5-Day Tithi & Ritual Schedule',
        subtitle: 'Sacred worship timings from Maha Shasthi to Vijaya Dashami',
        content: 'Detailed ritual timings, Pushpanjali batches, and Maha Bhog distribution.',
        layoutStyle: 'list',
        order: 3,
        enabled: Array.isArray(culturalData.pujaSchedule) && culturalData.pujaSchedule.length > 0,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          pujaSchedule: culturalData.pujaSchedule
        }
      },
      {
        id: 'sec_puja_programmes',
        type: 'puja_programmes',
        title: 'Cultural Evenings & Celebrations',
        subtitle: 'Anandamela, Dhunuchi Naach & Musical Recitals',
        content: 'Festive programmes organized during Sharadotsav.',
        layoutStyle: 'grid',
        order: 4,
        enabled: events.length > 0,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          events: events
        }
      },
      {
        id: 'sec_puja_organizers',
        type: 'puja_organizers',
        title: 'Puja Committee & Office Bearers',
        subtitle: 'Dedicated community volunteers and organizers',
        content: 'Executive team leading the Sharadotsav celebrations.',
        layoutStyle: 'grid',
        order: 5,
        enabled: leadership.length > 0,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          leadership: leadership
        }
      },
      {
        id: 'sec_puja_visitor_guide',
        type: 'puja_visitor_guide',
        title: 'Visitor Transit & Pandal Access Guide',
        subtitle: culturalData.visitorGuide?.pandalLocation || org.headquarters || 'Pandal Grounds',
        content: 'Transit directions, nearest metro gates, and parking guidelines.',
        layoutStyle: 'split',
        order: 6,
        enabled: Boolean(culturalData.visitorGuide?.pandalLocation),
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          visitorGuide: culturalData.visitorGuide
        }
      },
      {
        id: 'sec_puja_donations',
        type: 'puja_donations',
        title: culturalData.donationInfo?.campaignTitle || 'Voluntary Donations & Maha Bhog Support',
        subtitle: '100% Financial Transparency & Community Empowerment',
        content: culturalData.donationInfo?.appealMessage || 'Support our devotional and social welfare initiatives.',
        layoutStyle: 'cards',
        order: 7,
        enabled: Boolean(culturalData.donationInfo?.appealMessage),
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          donationInfo: culturalData.donationInfo
        }
      },
      {
        id: 'sec_puja_gallery',
        type: 'puja_gallery',
        title: 'Festival Moments & Aarti Gallery',
        subtitle: 'Highlights of Pratima, Pandal illumination and sacred rituals',
        content: '',
        layoutStyle: 'grid',
        order: 8,
        enabled: gallery.length > 0,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          gallery: gallery
        }
      },
      {
        id: 'sec_puja_sponsors',
        type: 'puja_sponsors',
        title: 'Patrons & Brand Partners',
        subtitle: 'Generous community partners powering the celebrations',
        content: '',
        layoutStyle: 'grid',
        order: 9,
        enabled: sponsors.length > 0,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          sponsors: sponsors
        }
      },
      {
        id: 'sec_puja_contact',
        type: 'puja_contact',
        title: 'Pandal Location & Contact Desk',
        subtitle: org.headquarters || org.city || 'Pandal Office',
        content: `Contact: ${org.contactPerson || 'Puja Coordinator'} (${org.contactPhone || '+91 33 0000 0000'}) | Email: ${org.contactEmail || 'desk@pujasamiti.internal'}`,
        layoutStyle: 'split',
        order: 10,
        enabled: true,
        metadata: {
          domain: 'cultural',
          culturalArchetype: 'puja_committee',
          organization: org
        }
      }
    ];
    return sections;
  }

  // Cultural Society
  const sections: WebsiteSectionConfig[] = [
    {
      id: 'sec_cultural_hero',
      type: 'cultural_hero',
      title: org.name,
      subtitle: org.nativeName || org.tagline || 'Preserving Cultural Heritage & Arts',
      content: org.description,
      layoutStyle: 'editorial',
      order: 1,
      enabled: true,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        nativeName: org.nativeName,
        coverImageUrl: branding.coverImageUrl
      }
    },
    {
      id: 'sec_cultural_story',
      type: 'cultural_story',
      title: 'Our Heritage, Mission & Cultural Journey',
      subtitle: org.establishedYear ? `Established in ${org.establishedYear}` : 'Our History',
      content: org.history || org.description,
      layoutStyle: 'editorial',
      order: 2,
      enabled: Boolean(org.history || org.description),
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        mission: org.mission,
        vision: org.vision,
        establishedYear: org.establishedYear
      }
    },
    {
      id: 'sec_cultural_programmes',
      type: 'cultural_programmes',
      title: 'Performing Arts & Cultural Programmes',
      subtitle: 'Classical music, dance, theatre and language workshops',
      content: 'Ongoing academies and training modules.',
      layoutStyle: 'grid',
      order: 3,
      enabled: activities.length > 0,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        activities: activities
      }
    },
    {
      id: 'sec_cultural_events',
      type: 'cultural_events',
      title: 'Cultural Festivals & Calendar',
      subtitle: 'Upcoming concerts, seminars and seasonal assemblies',
      content: '',
      layoutStyle: 'list',
      order: 4,
      enabled: events.length > 0,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        events: events
      }
    },
    {
      id: 'sec_cultural_committee',
      type: 'cultural_committee',
      title: 'Governing Council & Office Bearers',
      subtitle: 'Eminent cultural leaders, scholars and executive members',
      content: '',
      layoutStyle: 'grid',
      order: 5,
      enabled: leadership.length > 0,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        leadership: leadership
      }
    },
    {
      id: 'sec_cultural_membership',
      type: 'cultural_membership',
      title: 'Society Membership & Enrolment',
      subtitle: 'Join as Life, Annual or Student Member',
      content: culturalData.membershipInfo?.guidelines || 'Become part of our vibrant community promoting traditional arts.',
      layoutStyle: 'cards',
      order: 6,
      enabled: Boolean(culturalData.membershipInfo?.enabled),
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        membershipInfo: culturalData.membershipInfo
      }
    },
    {
      id: 'sec_cultural_gallery',
      type: 'cultural_gallery',
      title: 'Cultural Heritage Gallery',
      subtitle: 'Moments from past conventions, recitals and felicitation ceremonies',
      content: '',
      layoutStyle: 'grid',
      order: 7,
      enabled: gallery.length > 0,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        gallery: gallery
      }
    },
    {
      id: 'sec_cultural_sponsors',
      type: 'cultural_sponsors',
      title: 'Patrons & Corporate Partners',
      subtitle: 'Institutions supporting classical performing arts and literature',
      content: '',
      layoutStyle: 'grid',
      order: 8,
      enabled: sponsors.length > 0,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        sponsors: sponsors
      }
    },
    {
      id: 'sec_cultural_contact',
      type: 'cultural_contact',
      title: 'Society Secretarial Desk',
      subtitle: org.headquarters || org.city || 'Secretarial Office',
      content: `Contact: ${org.contactPerson || 'General Secretary'} (${org.contactPhone || '+91 33 0000 0000'}) | Email: ${org.contactEmail || 'secretary@organization.internal'}`,
      layoutStyle: 'split',
      order: 9,
      enabled: true,
      metadata: {
        domain: 'cultural',
        culturalArchetype: 'cultural_society',
        organization: org
      }
    }
  ];
  return sections;
}

function normalizeNGOArchetype(arch?: string): NGOArchetype {
  if (arch === 'institutional_foundation' || arch === 'foundation') return 'institutional_foundation';
  if (arch === 'cause_charity' || arch === 'charity') return 'cause_charity';
  return 'grassroots_ngo';
}

const NGO_PAGE_META: Record<NGOArchetype, Record<string, { slug: string; title: string; navLabel: string; sections: string[] }>> = {
  grassroots_ngo: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['grassroots_hero', 'ngo_programs', 'ngo_impact_stats', 'ngo_campaigns', 'ngo_collection_centers', 'ngo_volunteering', 'ngo_stories', 'ngo_reports', 'ngo_partners', 'ngo_faqs', 'ngo_contact'] },
    about: { slug: '/about', title: 'About Us & Philosophy', navLabel: 'About', sections: ['ngo_stories', 'ngo_leadership', 'ngo_reports'] },
    programs: { slug: '/programs', title: 'Programs & Initiatives', navLabel: 'Programs', sections: ['ngo_programs'] },
    campaigns: { slug: '/campaigns', title: 'Active Relief Drives', navLabel: 'Drives', sections: ['ngo_campaigns'] },
    collection_centers: { slug: '/collection-centers', title: 'Dropping Hubs & Material Collection', navLabel: 'Dropping Hubs', sections: ['ngo_collection_centers'] },
    volunteers: { slug: '/volunteers', title: 'Volunteer Mobilization', navLabel: 'Volunteers', sections: ['ngo_volunteering'] },
    reports: { slug: '/reports', title: 'Audited Accounts & Transparency', navLabel: 'Transparency', sections: ['ngo_reports'] },
    donate: { slug: '/donate', title: 'Contribute with Dignity', navLabel: 'Contribute', sections: ['ngo_donation'] },
    contact: { slug: '/contact', title: 'Contact & Grievance Desk', navLabel: 'Contact', sections: ['ngo_contact'] }
  },
  institutional_foundation: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['foundation_hero', 'ngo_programs', 'ngo_impact_stats', 'ngo_leadership', 'ngo_reports', 'ngo_partners', 'ngo_faqs', 'ngo_contact'] },
    about: { slug: '/about', title: 'Mission & Heritage', navLabel: 'Mission', sections: ['ngo_stories', 'ngo_leadership'] },
    initiatives: { slug: '/initiatives', title: 'Strategic Initiatives', navLabel: 'Initiatives', sections: ['ngo_programs'] },
    leadership: { slug: '/leadership', title: 'Board of Trustees & Leadership', navLabel: 'Leadership', sections: ['ngo_leadership'] },
    fellows: { slug: '/fellows', title: 'Fellowship & Civic Leaders', navLabel: 'Fellows', sections: ['ngo_volunteering'] },
    publications: { slug: '/publications', title: 'Research & Policy Insights', navLabel: 'Publications', sections: ['ngo_stories'] },
    reports: { slug: '/reports', title: 'Governance & Financial Disclosures', navLabel: 'Disclosures', sections: ['ngo_reports'] },
    partner: { slug: '/partner', title: 'Partner With Us', navLabel: 'Partner', sections: ['ngo_donation'] },
    contact: { slug: '/contact', title: 'Institutional Inquiries', navLabel: 'Contact', sections: ['ngo_contact'] }
  },
  cause_charity: {
    home: { slug: '/', title: 'Home', navLabel: 'Home', sections: ['charity_water_hero', 'ngo_impact_stats', 'ngo_donation', 'ngo_programs', 'ngo_stories', 'ngo_reports', 'ngo_faqs', 'ngo_contact'] },
    why_cause: { slug: '/why-cause', title: 'Why Clean Water Matters', navLabel: 'Why Clean Water', sections: ['ngo_stories'] },
    how_it_works: { slug: '/how-it-works', title: 'Our 100% Model & Process', navLabel: 'How It Works', sections: ['ngo_programs', 'ngo_reports'] },
    projects: { slug: '/projects', title: 'Field Water Projects', navLabel: 'Projects', sections: ['ngo_programs'] },
    impact: { slug: '/impact', title: 'Verified Global Impact', navLabel: 'Impact', sections: ['ngo_impact_stats'] },
    campaigns: { slug: '/campaigns', title: 'Active Community Campaigns', navLabel: 'Campaigns', sections: ['ngo_campaigns'] },
    transparency: { slug: '/transparency', title: '100% Financial Transparency', navLabel: 'Transparency', sections: ['ngo_reports'] },
    donate: { slug: '/donate', title: 'Give Clean Water', navLabel: 'Give Water', sections: ['ngo_donation'] },
    contact: { slug: '/contact', title: 'Donor Support & Inquiries', navLabel: 'Contact', sections: ['ngo_contact'] }
  }
};

/**
 * Library-template projects (see ngoCatalog) get exactly what the organisation entered. Nothing is invented: no registration or
 * tax numbers, no bank or UPI details, no donation tiers, no sample people, regions or colours. Empty stays empty and the
 * template simply leaves that section out. Pledge, donor and payment details are never carried onto these sites.
 */
export function normalizeNGODataStrict(raw: any, reqs: ClientRequirements, archetype: NGOArchetype): NGOWebsiteData {
  const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const p = raw?.profile || {};
  const profile: NGOProfile = {
    name: s(p.name) || s(p.organizationName) || s(reqs.organizationName),
    legalRegisteredName: s(p.legalRegisteredName) || undefined,
    registrationNumber: s(p.registrationNumber) || undefined,
    foundedYear: s(p.foundedYear) || undefined,
    tagline: s(p.tagline) || s(reqs.tagline),
    missionStatement: s(p.missionStatement),
    visionStatement: s(p.visionStatement),
    coreValues: list<string>(p.coreValues).map(s).filter(Boolean),
    aboutDescription: s(p.aboutDescription) || s(reqs.aboutText),
    operationalRegions: list<string>(p.operationalRegions).map(s).filter(Boolean),
    headquartersAddress: s(p.headquartersAddress) || s(reqs.address),
    city: s(p.city) || undefined,
    country: s(p.country) || undefined,
    contactEmail: s(p.contactEmail) || s(reqs.contactEmail),
    contactPhone: s(p.contactPhone) || s(reqs.contactPhone),
    websiteUrl: s(p.websiteUrl) || undefined,
    socialLinks: p.socialLinks && typeof p.socialLinks === 'object' ? p.socialLinks : undefined,
    contactPerson: s(p.contactPerson) || undefined
  };
  const b = raw?.branding || {};
  const branding: NGOBrandingIdentity = {
    primaryColor: s(b.primaryColor) || s(reqs.primaryColor),
    accentColor: s(b.accentColor) || s(reqs.accentColor),
    typographyStyle: b.typographyStyle || 'humanist',
    logoUrl: s(b.logoUrl) || s(reqs.logoUrl) || undefined,
    coverImageUrl: s(b.coverImageUrl) || s(reqs.coverImageUrl) || undefined
  };
  const rv = raw?.volunteering;
  const opportunities: NGOVolunteerOpportunity[] = list<NGOVolunteerOpportunity>(rv?.opportunities ?? rv);
  const volunteering: NGOVolunteerInfo = {
    enabled: rv?.enabled ?? opportunities.length > 0,
    headline: s(rv?.headline),
    description: s(rv?.description),
    opportunities,
    applicationUrl: s(rv?.applicationUrl) || undefined
  };
  const programs = list<NGOProgram>(raw?.programs);
  const impactStats = list<NGOImpactStat>(raw?.impactStats);
  const campaigns = list<NGOCampaign>(raw?.campaigns);
  const causes = list<NGOCausePillar>(raw?.causes);
  const leadership = list<NGOPerson>(raw?.leadership);
  const collectionCenters = list<NGOCollectionCenter>(raw?.collectionCenters);
  const stories = list<NGOStory>(raw?.stories);
  const reports = list<NGOReportDocument>(raw?.reports);
  const partners = list<NGOPartner>(raw?.partners);
  const faqs = list<NGOFAQItem>(raw?.faqs);
  const gallery = list<NGOMediaItem>(raw?.gallery);
  const updates = list<NonNullable<NGOWebsiteData['updates']>[number]>(raw?.updates);
  // Stored volunteer applications are kept for the organisation's own records; donor details are never created here.
  const volunteerSubmissions = list<NGOVolunteerApplication>(raw?.volunteerSubmissions || raw?.volunteerApplications);
  const donationEnquiries = list<NGODonationEnquiry>(raw?.donationEnquiries);
  const supportInfo = raw?.supportInfo && typeof raw.supportInfo === 'object'
    ? { headline: s(raw.supportInfo.headline), text: s(raw.supportInfo.text) }
    : undefined;
  // Informational only: no tiers, no bank/UPI, no tax claims, and the site offers no way to pay.
  const donationModel: NGODonationModel = { headline: '', donationTiers: [], customAmountAllowed: false, taxDeductible: false, enquiryOnly: true };

  return {
    schemaVersion: '1.0',
    archetype,
    profile,
    branding,
    programs,
    impactStats,
    campaigns,
    causes,
    leadership,
    volunteering,
    volunteerSubmissions,
    collectionCenters,
    donationModel,
    donationEnquiries,
    stories,
    reports,
    partners,
    faqs,
    gallery,
    updates,
    supportInfo,
    dataAvailability: {
      programs: programs.length > 0,
      impactStats: impactStats.length > 0,
      campaigns: campaigns.length > 0,
      causes: causes.length > 0,
      leadership: leadership.length > 0,
      volunteering: opportunities.length > 0,
      collectionCenters: collectionCenters.length > 0,
      donationModel: false,
      stories: stories.length > 0,
      reports: reports.length > 0,
      partners: partners.length > 0,
      faqs: faqs.length > 0,
      gallery: gallery.length > 0
    }
  };
}

function normalizeNGOData(raw: any, reqs: ClientRequirements, archetype: NGOArchetype): NGOWebsiteData {
  if (usesNgoLibraryTemplate(reqs)) return normalizeNGODataStrict(raw, reqs, archetype);
  const profile: NGOProfile = {
    name: raw?.profile?.name || (raw?.profile as any)?.organizationName || reqs.organizationName || (reqs as any)?.clientName || 'Social & Community Initiative',
    legalRegisteredName: raw?.profile?.legalRegisteredName || raw?.profile?.name || (raw?.profile as any)?.organizationName || reqs.organizationName,
    registrationNumber: raw?.profile?.registrationNumber || (reqs as any)?.registrationNumber || 'REG-NGO-9842/DELHI',
    foundedYear: raw?.profile?.foundedYear || (reqs as any)?.foundedYear || '1999',
    tagline: raw?.profile?.tagline || reqs.tagline || (archetype === 'grassroots_ngo' ? 'A Dignity-First Rural Community Initiative' : archetype === 'institutional_foundation' ? 'Inspiring, Empowering, and Connecting Civic Leaders' : 'Ending the Water Crisis in Our Lifetime'),
    missionStatement: raw?.profile?.missionStatement || 'Empower underserved communities through systemic, transparent, and dignified ground-level interventions.',
    visionStatement: raw?.profile?.visionStatement || 'A just, equitable society where every human being lives with dignity, opportunity, and clean resources.',
    coreValues: Array.isArray(raw?.profile?.coreValues) ? raw.profile.coreValues : ['Dignity', 'Transparency', 'Grassroots Empowerment', 'Accountability'],
    aboutDescription: raw?.profile?.aboutDescription || raw?.profile?.description || reqs.aboutText || 'Working relentlessly on the ground to create sustainable, lasting community impact through dignity, transparency, and collective action.',
    taxExemptionNotice: raw?.profile?.taxExemptionNotice || raw?.profile?.taxExemptionInfo || (reqs as any)?.taxExemptionInfo || (archetype === 'grassroots_ngo' ? 'Donations exempt under Section 80G of the Indian Income Tax Act. FCRA Approved.' : '501(c)(3) tax-exempt public charitable organization.'),
    fcraRegistrationNumber: raw?.profile?.fcraRegistrationNumber,
    operationalRegions: Array.isArray(raw?.profile?.operationalRegions) ? raw.profile.operationalRegions : ['National', 'Rural Communities'],
    headquartersAddress: raw?.profile?.headquartersAddress || raw?.profile?.headquarters || reqs.address || 'Central Office, Sector 4, Institutional Area, New Delhi 110001',
    city: raw?.profile?.city || 'New Delhi',
    country: raw?.profile?.country || 'India',
    contactEmail: raw?.profile?.contactEmail || raw?.profile?.primaryEmail || reqs.contactEmail || 'contact@social-initiative.internal',
    contactPhone: raw?.profile?.contactPhone || raw?.profile?.primaryPhone || reqs.contactPhone || '+91 11 2697 5880',
    websiteUrl: raw?.profile?.websiteUrl
  };

  const defaultTheme: Record<NGOArchetype, 'earth_grassroots' | 'presidential_navy' | 'clean_water_impact'> = {
    grassroots_ngo: 'earth_grassroots',
    institutional_foundation: 'presidential_navy',
    cause_charity: 'clean_water_impact'
  };

  const defaultTypography: Record<NGOArchetype, NGOTypographyStyle> = {
    grassroots_ngo: 'grassroots',
    institutional_foundation: 'institutional',
    cause_charity: 'humanist'
  };

  const branding: NGOBrandingIdentity = {
    primaryColor: raw?.branding?.primaryColor || reqs.primaryColor || (archetype === 'grassroots_ngo' ? '#9a3412' : archetype === 'institutional_foundation' ? '#0f172a' : '#0284c7'),
    accentColor: raw?.branding?.accentColor || reqs.accentColor || (archetype === 'grassroots_ngo' ? '#ea580c' : archetype === 'institutional_foundation' ? '#d97706' : '#f59e0b'),
    backgroundColor: raw?.branding?.backgroundColor || (archetype === 'grassroots_ngo' ? '#0B1410' : archetype === 'institutional_foundation' ? '#0A0F1D' : '#071822'),
    typographyStyle: raw?.branding?.typographyStyle || defaultTypography[archetype],
    themePreset: raw?.branding?.themePreset || defaultTheme[archetype],
    logoUrl: raw?.branding?.logoUrl || reqs.logoUrl,
    coverImageUrl: raw?.branding?.coverImageUrl || reqs.coverImageUrl
  };

  // Deterministic Zero-Sample Principle: empty collections stay empty, never fabricated
  const programs: NGOProgram[] = Array.isArray(raw?.programs) ? raw.programs : [];
  const impactStats: NGOImpactStat[] = Array.isArray(raw?.impactStats) ? raw.impactStats : [];
  const campaigns: NGOCampaign[] = Array.isArray(raw?.campaigns) ? raw.campaigns : [];
  const causes: NGOCausePillar[] = Array.isArray(raw?.causes) ? raw.causes : [];
  const leadership: NGOPerson[] = Array.isArray(raw?.leadership) ? raw.leadership : [];
  
  const rawVolunteering = raw?.volunteering;
  const volunteeringOpportunities: NGOVolunteerOpportunity[] = Array.isArray(rawVolunteering?.opportunities)
    ? rawVolunteering.opportunities
    : Array.isArray(rawVolunteering)
    ? rawVolunteering
    : [];

  const volunteering: NGOVolunteerInfo = {
    enabled: rawVolunteering?.enabled ?? (volunteeringOpportunities.length > 0),
    headline: rawVolunteering?.headline || (archetype === 'institutional_foundation' ? 'Leadership Fellowships & Residencies' : 'Volunteer Mobilization & Fellowships'),
    description: rawVolunteering?.description || 'Dedicate your skills, time, and heart to community transformation and ground-level action.',
    opportunities: volunteeringOpportunities,
    applicationUrl: rawVolunteering?.applicationUrl
  };

  const collectionCenters: NGOCollectionCenter[] = Array.isArray(raw?.collectionCenters) ? raw.collectionCenters : [];
  const stories: NGOStory[] = Array.isArray(raw?.stories) ? raw.stories : [];
  const reports: NGOReportDocument[] = Array.isArray(raw?.reports) ? raw.reports : [];
  const partners: NGOPartner[] = Array.isArray(raw?.partners) ? raw.partners : [];
  const faqs: NGOFAQItem[] = Array.isArray(raw?.faqs) ? raw.faqs : [];
  const gallery: NGOMediaItem[] = Array.isArray(raw?.gallery) ? raw.gallery : [];
  const volunteerSubmissions: NGOVolunteerApplication[] = Array.isArray(raw?.volunteerSubmissions || raw?.volunteerApplications) ? (raw?.volunteerSubmissions || raw?.volunteerApplications) : [];
  const donationEnquiries: NGODonationEnquiry[] = Array.isArray(raw?.donationEnquiries) ? raw.donationEnquiries : [];

  const defaultDonationModel: NGODonationModel = {
    headline: archetype === 'cause_charity' ? '100% of your public donation funds clean water projects' : archetype === 'institutional_foundation' ? 'Invest in the Next Generation of Civic Leaders' : 'Dignity Not Charity — Support Rural Infrastructure & Relief',
    subheadline: archetype === 'cause_charity' ? 'Private donors cover all our overhead, so every dollar proves direct impact.' : 'Every contribution fuels measurable, transparent field programs with rigorous financial disclosures.',
    donationTiers: [
      { id: 'tier_1', amount: 3000, currency: archetype === 'cause_charity' ? 'USD' : 'INR', label: archetype === 'cause_charity' ? 'Clean Water for 75 People' : 'Family Relief & Dignity Kit', impactEquivalence: archetype === 'cause_charity' ? 'Provides clean water and sanitation access for one household' : 'Supplies complete material kit, clothes and essentials for 1 family', isPopular: true },
      { id: 'tier_2', amount: 7500, currency: archetype === 'cause_charity' ? 'USD' : 'INR', label: archetype === 'cause_charity' ? 'School Handwashing Station' : 'Community School Refurbishment', impactEquivalence: archetype === 'cause_charity' ? 'Builds safe sanitation facilities in 1 rural school' : 'Provides blackboards, mats and stationery for 50 children' },
      { id: 'tier_3', amount: 15000, currency: archetype === 'cause_charity' ? 'USD' : 'INR', label: archetype === 'cause_charity' ? 'Community Borewell Pump' : 'Village Water Canal Restructuring', impactEquivalence: archetype === 'cause_charity' ? 'Provides deep sustainable water table access for an entire hamlet' : 'Restores seasonal agricultural drainage canal for 1 village' }
    ],
    customAmountAllowed: true,
    taxDeductible: true,
    eightyGRegNumber: profile.registrationNumber,
    fcraStatus: archetype === 'grassroots_ngo' ? 'FCRA Approved' : undefined,
    modelProofNote: archetype === 'cause_charity' ? '100% Model Guarantee: Board members and private benefactors independently fund all administrative costs.' : undefined,
    directTransferDetails: {
      bankName: raw?.donationModel?.directTransferDetails?.bankName || 'State Bank of India',
      accountName: raw?.donationModel?.directTransferDetails?.accountName || profile.name,
      accountNumber: raw?.donationModel?.directTransferDetails?.accountNumber || '39485729103',
      ifscCode: raw?.donationModel?.directTransferDetails?.ifscCode || 'SBIN0001234',
      upiId: raw?.donationModel?.directTransferDetails?.upiId || 'ngo.relief@sbi'
    },
    enquiryOnly: false,
    outboundDonationUrl: raw?.donationModel?.outboundDonationUrl
  };

  const donationModel: NGODonationModel = raw?.donationModel || defaultDonationModel;

  const dataAvailability: NGODataAvailability = {
    programs: programs.length > 0,
    impactStats: impactStats.length > 0,
    campaigns: campaigns.length > 0,
    causes: causes.length > 0,
    leadership: leadership.length > 0,
    volunteering: volunteering.opportunities.length > 0,
    collectionCenters: collectionCenters.length > 0,
    donationModel: Boolean(donationModel && donationModel.donationTiers?.length > 0),
    stories: stories.length > 0,
    reports: reports.length > 0,
    partners: partners.length > 0,
    faqs: faqs.length > 0,
    gallery: gallery.length > 0
  };

  return {
    schemaVersion: '1.0',
    archetype,
    profile,
    branding,
    programs,
    impactStats,
    campaigns,
    causes,
    leadership,
    volunteering,
    volunteerSubmissions,
    collectionCenters,
    donationModel,
    donationEnquiries,
    stories,
    reports,
    partners,
    faqs,
    gallery,
    dataAvailability
  };
}

function buildNGOPages(ngoData: NGOWebsiteData, archetype: NGOArchetype): PageRoute[] {
  const catMeta = NGO_PAGE_META[archetype] || NGO_PAGE_META.grassroots_ngo;
  return Object.entries(catMeta).map(([key, page]) => ({
    id: `page_${key}`,
    slug: page.slug,
    title: page.title,
    navLabel: page.navLabel,
    enabled: true,
    sections: page.sections
  }));
}

function buildNGOSections(ngoData: NGOWebsiteData, archetype: NGOArchetype): WebsiteSectionConfig[] {
  const profile = ngoData.profile;
  const branding = ngoData.branding;
  const heroSectionType = (archetype === 'grassroots_ngo' ? 'grassroots_hero' : archetype === 'institutional_foundation' ? 'foundation_hero' : 'charity_water_hero') as NGOSectionType;

  const heroTitles: Record<NGOArchetype, { title: string; subtitle: string; content: string }> = {
    grassroots_ngo: {
      title: profile.name,
      subtitle: `${profile.tagline} • Founded ${profile.foundedYear || '1999'} • ${profile.headquartersAddress}`,
      content: profile.aboutDescription || 'Mobilizing urban surplus to ignite dignified rural development and disaster response across thousands of remote villages.'
    },
    institutional_foundation: {
      title: profile.name,
      subtitle: `${profile.tagline} • Global Civic Action & Policy Fellowships`,
      content: profile.aboutDescription || 'Cultivating the next generation of civic leaders, community organizers, and public servants dedicated to democratic renewal and justice.'
    },
    cause_charity: {
      title: profile.name,
      subtitle: `${profile.tagline} • 100% Direct Impact Model • Zero Public Overhead`,
      content: profile.aboutDescription || 'Proving that radical transparency, local community ownership, and sustained clean water infrastructure can transform entire generations.'
    }
  };

  const currentHero = heroTitles[archetype] || heroTitles.grassroots_ngo;

  const sections: WebsiteSectionConfig[] = [
    {
      id: `sec_${archetype}_hero`,
      type: heroSectionType,
      title: currentHero.title,
      subtitle: currentHero.subtitle,
      content: currentHero.content,
      layoutStyle: 'editorial',
      order: 1,
      enabled: true,
      metadata: {
        domain: 'ngo',
        ngoArchetype: archetype,
        profile,
        branding,
        impactStats: ngoData.impactStats,
        donationModel: ngoData.donationModel
      }
    },
    {
      id: 'sec_ngo_impact_stats',
      type: 'ngo_impact_stats',
      title: archetype === 'cause_charity' ? 'Verified Field Impact at Scale' : archetype === 'institutional_foundation' ? 'Global Leadership Footprint' : 'Ground-Level Impact in Numbers',
      subtitle: 'Real-time verified metrics from our field operations and institutional interventions',
      content: 'Tangible outcomes achieved through collective citizen action.',
      layoutStyle: 'grid',
      order: 2,
      enabled: ngoData.dataAvailability.impactStats,
      metadata: { domain: 'ngo', ngoArchetype: archetype, impactStats: ngoData.impactStats }
    },
    {
      id: 'sec_ngo_programs',
      type: 'ngo_programs',
      title: archetype === 'institutional_foundation' ? 'Core Initiatives & Civic Programs' : archetype === 'cause_charity' ? 'Water, Sanitation & Hygiene Programs' : 'Programs Built with Dignity',
      subtitle: 'Systemic community programs managed in direct partnership with local stakeholders',
      content: 'Explore our multi-faceted operational divisions and active interventions.',
      layoutStyle: 'cards',
      order: 3,
      enabled: ngoData.dataAvailability.programs,
      metadata: { domain: 'ngo', ngoArchetype: archetype, programs: ngoData.programs }
    },
    {
      id: 'sec_ngo_campaigns',
      type: 'ngo_campaigns',
      title: archetype === 'cause_charity' ? 'Active Community Water Campaigns' : 'Urgent Relief Drives & Appeals',
      subtitle: 'Targeted fundraising campaigns addressing urgent grassroots crises and long-term community infrastructure',
      content: 'Join hands to meet vital campaign targets with transparent progress tracking.',
      layoutStyle: 'grid',
      order: 4,
      enabled: ngoData.dataAvailability.campaigns,
      metadata: { domain: 'ngo', ngoArchetype: archetype, campaigns: ngoData.campaigns }
    },
    {
      id: 'sec_ngo_collection_centers',
      type: 'ngo_collection_centers',
      title: 'Material Dropping Hubs & Processing Centers',
      subtitle: 'Drop off urban surplus, clothing, books, and disaster essentials at our verified city hubs',
      content: 'Connecting urban resource surplus with rural development and disaster rehabilitation needs.',
      layoutStyle: 'list',
      order: 5,
      enabled: ngoData.dataAvailability.collectionCenters,
      metadata: { domain: 'ngo', ngoArchetype: archetype, collectionCenters: ngoData.collectionCenters }
    },
    {
      id: 'sec_ngo_donation',
      type: 'ngo_donation',
      title: archetype === 'cause_charity' ? '100% of Your Giving Directly Funds Clean Water' : archetype === 'institutional_foundation' ? 'Invest in Enduring Civic Change' : 'Contribute with Dignity',
      subtitle: ngoData.donationModel.modelProofNote || 'Direct community empowerment with full tax exemption under Section 80G',
      content: 'Choose a contribution tier or wire directly to our audited institutional bank account.',
      layoutStyle: 'split',
      order: 6,
      enabled: ngoData.dataAvailability.donationModel,
      metadata: { domain: 'ngo', ngoArchetype: archetype, donationModel: ngoData.donationModel, profile }
    },
    {
      id: 'sec_ngo_volunteering',
      type: 'ngo_volunteering',
      title: archetype === 'institutional_foundation' ? 'Leadership Fellowships & Residencies' : 'Volunteer Mobilization & Fellowships',
      subtitle: 'Dedicate your skills, time, and heart to community transformation and ground-level action',
      content: 'Explore open volunteer opportunities across field operations, sorting, communications, and strategy.',
      layoutStyle: 'grid',
      order: 7,
      enabled: ngoData.dataAvailability.volunteering,
      metadata: { domain: 'ngo', ngoArchetype: archetype, volunteering: ngoData.volunteering }
    },
    {
      id: 'sec_ngo_leadership',
      type: 'ngo_leadership',
      title: archetype === 'institutional_foundation' ? 'Board of Trustees & Senior Leadership' : 'Founders, Trustees & Advisory Council',
      subtitle: 'Stewarding our mission with institutional integrity, strategic clarity, and ethical governance',
      content: 'Meet the governing trustees, directors, and grassroots pioneers guiding our trajectory.',
      layoutStyle: 'grid',
      order: 8,
      enabled: ngoData.dataAvailability.leadership,
      metadata: { domain: 'ngo', ngoArchetype: archetype, leadership: ngoData.leadership }
    },
    {
      id: 'sec_ngo_stories',
      type: 'ngo_stories',
      title: 'Voices of Transformation & Field Stories',
      subtitle: 'Unfiltered ground realities, village breakthroughs, and human dignity in action',
      content: 'Read first-hand accounts of systemic change from beneficiaries, community leaders, and volunteers.',
      layoutStyle: 'cards',
      order: 9,
      enabled: ngoData.dataAvailability.stories,
      metadata: { domain: 'ngo', ngoArchetype: archetype, stories: ngoData.stories }
    },
    {
      id: 'sec_ngo_reports',
      type: 'ngo_reports',
      title: 'Financial Disclosures & Audited Annual Reports',
      subtitle: 'Radical institutional transparency: download audited balance sheets, annual reports, and statutory filings',
      content: 'Every rupee and dollar accounted for with public auditor certification.',
      layoutStyle: 'list',
      order: 10,
      enabled: ngoData.dataAvailability.reports,
      metadata: { domain: 'ngo', ngoArchetype: archetype, reports: ngoData.reports }
    },
    {
      id: 'sec_ngo_partners',
      type: 'ngo_partners',
      title: 'Institutional Patrons & CSR Partners',
      subtitle: 'Collaborating with visionary foundations, corporate partners, and humanitarian networks',
      content: 'Our work is amplified through deep institutional partnerships.',
      layoutStyle: 'grid',
      order: 11,
      enabled: ngoData.dataAvailability.partners,
      metadata: { domain: 'ngo', ngoArchetype: archetype, partners: ngoData.partners }
    },
    {
      id: 'sec_ngo_faqs',
      type: 'ngo_faqs',
      title: 'Frequently Asked Questions & Transparency',
      subtitle: 'Answers regarding our 100% model, material utilization, tax benefits, and governance',
      content: 'Everything you need to know about our operational methodology and donor stewardship.',
      layoutStyle: 'list',
      order: 12,
      enabled: ngoData.dataAvailability.faqs,
      metadata: { domain: 'ngo', ngoArchetype: archetype, faqs: ngoData.faqs }
    },
    {
      id: 'sec_ngo_contact',
      type: 'ngo_contact',
      title: 'Institutional Headquarters & Field Desks',
      subtitle: profile.headquartersAddress || 'Registered Office & Grievance Cell',
      content: `Email: ${profile.contactEmail} | Phone: ${profile.contactPhone} | Tax Registration: ${profile.registrationNumber || 'N/A'}`,
      layoutStyle: 'split',
      order: 13,
      enabled: true,
      metadata: { domain: 'ngo', ngoArchetype: archetype, profile }
    }
  ];

  return sections.filter(s => s.enabled);
}

type PortfolioTemplateDefault = { templateName: string; websiteCategory: string; designTokens: NonNullable<SelectedTemplateMetadata['designTokens']> };

/**
 * Default portfolio template metadata. Ids match the client's template library (v2, client/src/templates/portfolio/registry.ts).
 * Projects created before v2 keep their stored legacy ids (nova, creative_studio, ...); the client still renders those.
 */
const PORTFOLIO_TEMPLATE_DEFAULTS: Record<string, PortfolioTemplateDefault> = {
  'engineer-blueprint': { templateName: 'Systems Engineer Blueprint', websiteCategory: 'developer', designTokens: { primaryColor: '#070B16', accentColor: '#3DD6A5', fontFamily: 'Inter', headingFont: 'Space Grotesk', layoutPreset: 'Side rail + single column' } },
  'editorial-ux': { templateName: 'Editorial UX Portfolio', websiteCategory: 'ui_ux', designTokens: { primaryColor: '#1E1A14', accentColor: '#2F8F5B', fontFamily: 'Inter', headingFont: 'Fraunces', layoutPreset: 'Editorial spreads' } },
  'photo-fullscreen': { templateName: 'Full-Screen Photography', websiteCategory: 'photography', designTokens: { primaryColor: '#000000', accentColor: '#EDE9E3', fontFamily: 'Jost', headingFont: 'Cormorant Garamond', layoutPreset: 'Full-bleed + masonry' } },
  'graphic-bold': { templateName: 'Bold Graphic Designer', websiteCategory: 'creative', designTokens: { primaryColor: '#000000', accentColor: '#FF3D81', fontFamily: 'Space Grotesk', headingFont: 'Unbounded', layoutPreset: 'Colour-block grid' } },
  'motion-immersive': { templateName: 'Immersive 3D & Motion', websiteCategory: 'creative', designTokens: { primaryColor: '#07060F', accentColor: '#A855F7', fontFamily: 'Manrope', headingFont: 'Syne', layoutPreset: 'Stage + reel' } },
  'freelancer-services': { templateName: 'Freelancer Services & Clients', websiteCategory: 'freelancer', designTokens: { primaryColor: '#2563EB', accentColor: '#7C3AED', fontFamily: 'Plus Jakarta Sans', headingFont: 'Plus Jakarta Sans', layoutPreset: 'Conversion landing' } },
  'graduate-profile': { templateName: 'Fresh Graduate Profile', websiteCategory: 'student', designTokens: { primaryColor: '#0EA5E9', accentColor: '#6366F1', fontFamily: 'Inter', headingFont: 'Outfit', layoutPreset: 'Sidebar + resume' } },
  'data-ai-lab': { templateName: 'Data & AI Research Lab', websiteCategory: 'ai_data', designTokens: { primaryColor: '#070D1A', accentColor: '#2DD4BF', fontFamily: 'IBM Plex Sans', headingFont: 'IBM Plex Sans', layoutPreset: 'Research group' } },
  'architect-minimal': { templateName: 'Architecture Minimal', websiteCategory: 'architecture', designTokens: { primaryColor: '#111111', accentColor: '#111111', fontFamily: 'Barlow', headingFont: 'Barlow Condensed', layoutPreset: 'Gallery index' } },
  'creator-media': { templateName: 'Creator Media Hub', websiteCategory: 'content_creator', designTokens: { primaryColor: '#14081F', accentColor: '#F72585', fontFamily: 'Sora', headingFont: 'Sora', layoutPreset: 'Centered column' } }
};

/** Archetype -> default template id. The six client-wizard archetypes must match DEFAULT_TEMPLATE_BY_ARCHETYPE in the client registry. */
const PORTFOLIO_ARCHETYPE_DEFAULT_TEMPLATE: Record<PortfolioArchetype, string> = {
  developer: 'engineer-blueprint',
  fullstack_dev: 'engineer-blueprint',
  data_scientist: 'data-ai-lab',
  designer: 'editorial-ux',
  product_designer: 'editorial-ux',
  writer_author: 'editorial-ux',
  graphic_artist: 'graphic-bold',
  fine_artist: 'graphic-bold',
  photographer: 'photo-fullscreen',
  motion_3d: 'motion-immersive',
  filmmaker: 'motion-immersive',
  freelancer: 'freelancer-services',
  marketer_seo: 'freelancer-services',
  personal_brand: 'freelancer-services',
  content_creator: 'creator-media',
  architect: 'architect-minimal',
  academic_pro: 'graduate-profile',
  student_grad: 'graduate-profile'
};

function defaultPortfolioTemplate(arch: PortfolioArchetype = 'developer'): SelectedTemplateMetadata {
  const templateId = PORTFOLIO_ARCHETYPE_DEFAULT_TEMPLATE[arch] || 'freelancer-services';
  const d = PORTFOLIO_TEMPLATE_DEFAULTS[templateId];
  return {
    templateId,
    templateVersion: '2.0.0',
    templateName: d.templateName,
    websiteCategory: d.websiteCategory,
    selectedAt: new Date().toISOString(),
    designTokens: d.designTokens
  };
}

function buildPortfolioPages(portfolioData: PortfolioWebsiteData, archetype: PortfolioArchetype = 'developer'): PageRoute[] {
  const commonPages: PageRoute[] = [
    { id: 'page_home', slug: '/', title: 'Home', navLabel: 'Home', enabled: true, sections: ['portfolio_hero'] }
  ];

  switch (archetype) {
    case 'developer':
      return [
        ...commonPages,
        { id: 'page_projects', slug: '/projects', title: 'Systems & Repositories', navLabel: 'Projects', enabled: true, sections: ['portfolio_projects'] },
        { id: 'page_experience', slug: '/experience', title: 'Experience & Milestones', navLabel: 'Experience', enabled: true, sections: ['portfolio_experience'] },
        { id: 'page_contact', slug: '/contact', title: 'Terminal Dispatch', navLabel: 'Contact', enabled: true, sections: ['portfolio_contact'] }
      ];
    case 'designer':
      return [
        ...commonPages,
        { id: 'page_case_studies', slug: '/case-studies', title: 'Case Studies & Visual Systems', navLabel: 'Case Studies', enabled: true, sections: ['portfolio_projects'] },
        { id: 'page_craft', slug: '/craft', title: 'Design Philosophy & Tokens', navLabel: 'Design Tokens', enabled: true, sections: ['portfolio_skills'] },
        { id: 'page_contact', slug: '/contact', title: 'Direct Commission Desk', navLabel: 'Contact', enabled: true, sections: ['portfolio_contact'] }
      ];
    case 'photographer':
      return [
        ...commonPages,
        { id: 'page_series', slug: '/series', title: 'Curated Photographic Series', navLabel: 'Series', enabled: true, sections: ['portfolio_projects'] },
        { id: 'page_gear', slug: '/gear', title: 'Optics & Technical Metadata', navLabel: 'Exhibitions', enabled: true, sections: ['portfolio_skills'] },
        { id: 'page_contact', slug: '/contact', title: 'Print Inquiries & Exhibitions', navLabel: 'Acquire Print', enabled: true, sections: ['portfolio_contact'] }
      ];
    case 'motion_3d':
      return [
        ...commonPages,
        { id: 'page_breakdowns', slug: '/breakdowns', title: '3D Breakdown Passes', navLabel: 'Breakdowns', enabled: true, sections: ['portfolio_projects'] },
        { id: 'page_clients', slug: '/clients', title: 'Studio Collaborations', navLabel: 'Collaborations', enabled: true, sections: ['portfolio_experience'] },
        { id: 'page_contact', slug: '/contact', title: 'Commission Motion Desk', navLabel: 'Commission', enabled: true, sections: ['portfolio_contact'] }
      ];
    case 'academic_pro':
      return [
        ...commonPages,
        { id: 'page_publications', slug: '/publications', title: 'Publications & Research Output', navLabel: 'Publications', enabled: true, sections: ['portfolio_publications'] },
        { id: 'page_teaching', slug: '/teaching', title: 'Courses & Curriculum', navLabel: 'Teaching', enabled: true, sections: ['portfolio_experience'] },
        { id: 'page_cv', slug: '/cv', title: 'Curriculum Vitae', navLabel: 'Curriculum Vitae', enabled: true, sections: ['portfolio_about'] }
      ];
    case 'personal_brand':
    default:
      return [
        ...commonPages,
        { id: 'page_services', slug: '/services', title: 'Advisory Engagements & Tiers', navLabel: 'Services', enabled: true, sections: ['portfolio_services'] },
        { id: 'page_results', slug: '/results', title: 'Case Results & Proof', navLabel: 'Case Results', enabled: true, sections: ['portfolio_projects'] },
        { id: 'page_contact', slug: '/contact', title: 'Schedule Advisory Briefing', navLabel: 'Contact', enabled: true, sections: ['portfolio_contact'] }
      ];
  }
}

function normalizePortfolioData(
  raw: any,
  reqs: ClientRequirements,
  archetype: PortfolioArchetype = 'developer'
): PortfolioWebsiteData {
  const pRaw = raw || {};
  // Real intake data was supplied: never invent names, emails, skills or links for it. The demo defaults below
  // are only for a portfolio project created with no portfolio data at all.
  const supplied = !!raw && typeof raw === 'object' && Object.keys(raw).length > 0;
  const identity = pRaw.identity || {};
  const about = pRaw.about || {};
  const branding = pRaw.branding || {};
  const profilePhoto = identity.profilePhotoUrl || identity.avatarUrl || reqs.logoUrl;
  const heroCover = identity.heroCoverUrl || identity.coverImageUrl || reqs.coverImageUrl;

  return {
    schemaVersion: '1.0',
    archetype: raw?.archetype || reqs.portfolioArchetype || archetype,
    identity: {
      fullName: identity.fullName || reqs.organizationName || (supplied ? '' : 'Alex Mercer'),
      displayName: identity.displayName || identity.fullName || reqs.organizationName || (supplied ? '' : 'Alex Mercer'),
      professionalTitle: identity.professionalTitle || identity.title || reqs.tagline || (supplied ? '' : 'Principal Systems Engineer'),
      title: identity.title || identity.professionalTitle || reqs.tagline || (supplied ? '' : 'Principal Systems Engineer'),
      tagline: identity.tagline || reqs.tagline || (supplied ? '' : 'Building resilient, mission-critical digital systems.'),
      bio: identity.bio || about.bio || reqs.aboutText || (supplied ? '' : 'Senior technologist and creator.'),
      avatarUrl: profilePhoto,
      profilePhotoUrl: profilePhoto,
      coverImageUrl: heroCover,
      heroCoverUrl: heroCover,
      location: identity.location || reqs.address || '',
      email: identity.email || reqs.contactEmail || (supplied ? '' : 'alex@example.internal'),
      phone: identity.phone || reqs.contactPhone,
      availableForHire: identity.availableForHire ?? true,
      yearsOfExperience: identity.yearsOfExperience,
      currentCompany: identity.currentCompany,
      currentRole: identity.currentRole
    },
    about: {
      bio: about.bio || identity.bio || reqs.aboutText || (supplied ? '' : 'Senior technologist and creator dedicated to building robust software systems, intuitive user interfaces, and high-performance digital products.'),
      story: about.story || reqs.aboutText,
      interests: about.interests || (supplied ? [] : ['Distributed Systems', 'UI Architecture', 'Cloud Infrastructure', 'Open Source']),
      brandStatement: about.brandStatement || (supplied ? undefined : 'Translating complex engineering challenges into clean, elegant, and impactful software.')
    },
    skills: pRaw.skills || (supplied ? [] : [
      { id: 'sk_1', name: 'TypeScript / Node.js', category: 'technical', level: 'expert', featured: true },
      { id: 'sk_2', name: 'React / Next.js', category: 'technical', level: 'expert', featured: true },
      { id: 'sk_3', name: 'System Architecture', category: 'technical', level: 'advanced', featured: true },
      { id: 'sk_4', name: 'Cloud Infrastructure', category: 'tools', level: 'advanced', featured: true }
    ]),
    projects: pRaw.projects || [],
    experience: pRaw.experience || [],
    education: pRaw.education || [],
    publications: pRaw.publications || [],
    services: pRaw.services || [],
    testimonials: pRaw.testimonials || [],
    achievements: pRaw.achievements || [],
    certifications: pRaw.certifications || [],
    resumeUrl: pRaw.resumeUrl || undefined,
    socialLinks: pRaw.socialLinks || reqs.socialLinks || (supplied ? {} : {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    }),
    media: pRaw.media || {
      officialLogoUrl: profilePhoto,
      officialHeroBannerUrl: heroCover,
      googleDriveGalleryUrl: reqs.googleDriveGalleryUrl,
      googleDriveVideoUrl: reqs.googleDriveVideoUrl,
      youtubeUrl: reqs.youtubeUrls?.[0]
    },
    branding: {
      primaryColor: branding.primaryColor || reqs.primaryColor || '#0284c7',
      accentColor: branding.accentColor || reqs.accentColor || '#38bdf8',
      fontFamily: branding.fontFamily || 'Inter, sans-serif',
      headingFont: branding.headingFont || 'Space Grotesk, sans-serif',
      stylePreset: branding.stylePreset || 'modern_tech'
    }
  };
}

function buildPortfolioSections(data: PortfolioWebsiteData): WebsiteSectionConfig[] {
  return [
    {
      id: 'sec_portfolio_hero',
      type: 'portfolio_hero',
      title: data.identity?.fullName || data.identity?.displayName || 'Portfolio',
      subtitle: data.identity?.professionalTitle || data.identity?.tagline || data.identity?.title,
      content: data.about?.bio || data.identity?.bio || '',
      layoutStyle: 'split',
      order: 1,
      enabled: true
    },
    {
      id: 'sec_portfolio_about',
      type: 'portfolio_about',
      title: `About ${data.identity?.displayName || data.identity?.fullName || 'Me'}`,
      subtitle: data.identity?.professionalTitle || data.identity?.title,
      content: data.about?.story || data.about?.bio || data.identity?.bio || '',
      layoutStyle: 'editorial',
      order: 2,
      enabled: true
    },
    {
      id: 'sec_portfolio_skills',
      type: 'portfolio_skills',
      title: 'Skills & Proficiencies',
      subtitle: 'Technical & Creative Stack',
      content: 'Core domains, libraries, and tools utilized across client and open-source work.',
      layoutStyle: 'grid',
      order: 3,
      enabled: data.skills.length > 0
    },
    {
      id: 'sec_portfolio_projects',
      type: 'portfolio_projects',
      title: 'Featured Works & Case Studies',
      subtitle: 'Selected production releases and client projects',
      content: 'A showcase of engineered systems, creative direction, and case studies.',
      layoutStyle: 'cards',
      order: 4,
      enabled: true
    },
    {
      id: 'sec_portfolio_experience',
      type: 'portfolio_experience',
      title: 'Career & Experience Timeline',
      subtitle: 'Professional history and milestones',
      content: 'Roles, teams, organizations, and leadership tenures.',
      layoutStyle: 'list',
      order: 5,
      enabled: data.experience.length > 0
    },
    {
      id: 'sec_portfolio_contact',
      type: 'portfolio_contact',
      title: 'Initiate Contact & Commissions',
      subtitle: data.identity.location,
      content: data.identity.availableForHire ? 'Currently open for new engagements, commissions, and consulting.' : 'Reach out for inquiries.',
      layoutStyle: 'split',
      order: 6,
      enabled: true
    }
  ];
}

export function synthesizeWebsite(
  reqs: ClientRequirements,
  driveItems: DriveMediaItem[] = [],
  youtubeVideos: YouTubeVideo[] = []
): GeneratedWebsite {
  const category: OrganizationCategory = reqs.category || reqs.organizationType || 'cultural';
  const archetype = ARCHETYPES[category] || ARCHETYPES.cultural;
  const designSelection = reqs.designSelection;
  const designProfile = resolveDesignProfile(
    designSelection?.mode === 'template' ? designSelection.modelId : undefined,
    archetype
  );
  const sportsData = category === 'sports' ? reqs.sportsData : undefined;
  const culturalArchetype = reqs.culturalArchetype || (category === 'puja_committee' || (reqs.culturalData as any)?.websiteType === 'puja_committee' ? 'puja_committee' : 'cultural_society');
  const rawCulturalData = (category === 'cultural' || category === 'puja_committee' || reqs.culturalData) ? reqs.culturalData : undefined;
  const culturalData = (rawCulturalData || category === 'cultural' || category === 'puja_committee') ? normalizeCulturalData(rawCulturalData, reqs, culturalArchetype) : undefined;
  const eventCategory: EventCategory = normalizeEventCategory(reqs.eventCategory || reqs.eventData?.category);
  const rawEventData = (category === 'event' || reqs.eventData) ? reqs.eventData : undefined;
  const eventData = (rawEventData || category === 'event') ? normalizeEventData(rawEventData, reqs, eventCategory) : undefined;
  const rawNGOData = (category === 'ngo_social' || category === 'ngo' || reqs.ngoData) ? reqs.ngoData : undefined;
  const ngoArchetype: NGOArchetype = normalizeNGOArchetype(reqs.ngoArchetype || reqs.ngoData?.archetype);
  const ngoData = (rawNGOData || category === 'ngo_social' || category === 'ngo') ? normalizeNGOData(rawNGOData, reqs, ngoArchetype) : undefined;
  const rawPortfolioData = (category === 'portfolio' || reqs.portfolioData) ? reqs.portfolioData : undefined;
  const portfolioArchetype: PortfolioArchetype = reqs.portfolioArchetype || reqs.portfolioData?.archetype || 'developer';
  const portfolioData = (rawPortfolioData || category === 'portfolio') ? normalizePortfolioData(rawPortfolioData, reqs, portfolioArchetype) : undefined;
  const orgName = reqs.organizationName || (reqs as any).clientName || 'organization';
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const effectivePortfolioArchetype = portfolioArchetype;
  const effectiveSelectedTemplate = category === 'portfolio'
    ? (reqs.selectedTemplate || defaultPortfolioTemplate(effectivePortfolioArchetype))
    : reqs.selectedTemplate;

  const themeAccent = effectiveSelectedTemplate?.designTokens?.layoutPreset
    ? `${effectiveSelectedTemplate.templateId}-theme`
    : designProfile.themeAccent;
  const layoutPreset: 'editorial' | 'split' | 'grid' = (effectiveSelectedTemplate?.designTokens?.layoutPreset as 'editorial' | 'split' | 'grid') || designProfile.layoutPreset;
  
  let fontFamily = effectiveSelectedTemplate?.designTokens?.fontFamily || designProfile.fontFamily;
  let headingFont = effectiveSelectedTemplate?.designTokens?.headingFont || designProfile.headingFont;
  if (reqs.typographyStyle === 'classical' || culturalData?.branding.typographyStyle === 'classical') {
    fontFamily = 'Cinzel, Garamond, serif';
    headingFont = 'Cinzel, serif';
  } else if (reqs.typographyStyle === 'heritage' || culturalData?.branding.typographyStyle === 'heritage') {
    fontFamily = 'Playfair Display, Georgia, serif';
    headingFont = 'Playfair Display, serif';
  } else if (reqs.typographyStyle === 'bilingual' || culturalData?.branding.typographyStyle === 'bilingual') {
    fontFamily = 'Cormorant Garamond, "Tiro Bangla", serif';
    headingFont = 'Cinzel, "Tiro Bangla", serif';
  } else if (reqs.typographyStyle === 'athletic') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Inter, sans-serif';
  } else if (reqs.typographyStyle === 'futuristic' || eventData?.branding.typographyStyle === 'futuristic') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Space Grotesk, Inter, sans-serif';
  } else if (reqs.typographyStyle === 'cinematic' || eventData?.branding.typographyStyle === 'cinematic') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Cinzel, Playfair Display, serif';
  } else if (reqs.typographyStyle === 'luxury' || eventData?.branding.typographyStyle === 'luxury') {
    fontFamily = 'Playfair Display, Georgia, serif';
    headingFont = 'Playfair Display, Georgia, serif';
  } else if (reqs.typographyStyle === 'editorial' || eventData?.branding.typographyStyle === 'editorial') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Cormorant Garamond, Georgia, serif';
  } else if (reqs.typographyStyle === 'festive' || eventData?.branding.typographyStyle === 'festive') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Syne, Bebas Neue, sans-serif';
  } else if (reqs.typographyStyle === 'grassroots' || ngoData?.branding.typographyStyle === 'grassroots') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Space Grotesk, Inter, sans-serif';
  } else if (reqs.typographyStyle === 'institutional' || ngoData?.branding.typographyStyle === 'institutional') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Cinzel, Georgia, serif';
  } else if (reqs.typographyStyle === 'humanist' || ngoData?.branding.typographyStyle === 'humanist') {
    fontFamily = 'Inter, sans-serif';
    headingFont = 'Playfair Display, Inter, serif';
  }

  const themeConfig: WebsiteThemeConfig = {
    primaryColor: reqs.primaryColor || culturalData?.branding.primaryColor || eventData?.branding.primaryColor || ngoData?.branding.primaryColor || archetype.primaryColor,
    accentColor: reqs.accentColor || culturalData?.branding.accentColor || eventData?.branding.accentColor || ngoData?.branding.accentColor || archetype.accentColor,
    backgroundColor: designProfile.backgroundColor,
    textColor: '#F3F4F6',
    fontFamily,
    headingFont,
    borderRadius: 'lg',
    themePreset: themeAccent
  };

  // Strict Separation: Hero banner comes strictly from reqs.coverImageUrl or archetype branding, NEVER automatically from Drive gallery folder.
  let heroImage = reqs.coverImageUrl || '';
  if (!heroImage) {
    if (sportsData?.club.coverImageUrl) {
      heroImage = sportsData.club.coverImageUrl;
    } else if (culturalData?.branding.coverImageUrl) {
      heroImage = culturalData.branding.coverImageUrl;
    } else if (eventData?.branding.coverImageUrl) {
      heroImage = eventData.branding.coverImageUrl;
    } else if (ngoData?.branding.coverImageUrl) {
      heroImage = ngoData.branding.coverImageUrl;
    } else {
      heroImage = (archetype as any).defaultHeroImage || '';
    }
  }

  // Cultural sites never show stock thumbnails: the platform's placeholder photographs are dropped (the template draws a plain play tile),
  // and a thumbnail the client's own source supplied is kept. Applies to items stored before this rule too.
  const culturalThumbnail = (url: string | undefined): string | undefined =>
    culturalData ? (url && !isDemoStockThumbnail(url) ? url : '') : undefined;

  // Drive images are strictly ingested for Photo Gallery (unless explicitly assigned to events)
  const approvedDriveImages = driveItems.filter(item => item.isApproved && item.mediaType === 'image');
  const galleryPhotos: PhotoItem[] = approvedDriveImages.map(item => ({
    id: item.id,
    title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    url: `/api/media/drive/proxy/${item.driveFileId}`,
    category: item.sectionAssignment === 'events' ? 'Events' : 'Gallery'
  }));

  // Ingest Drive videos alongside YouTube videos into featuredVideos
  const approvedDriveVideos = driveItems.filter(item => item.isApproved && item.mediaType === 'video');
  const driveVideoItems: VideoItem[] = approvedDriveVideos.map(item => ({
    id: item.id,
    videoId: item.driveFileId,
    originalUrl: `https://drive.google.com/file/d/${item.driveFileId}/view`,
    embedUrl: `https://drive.google.com/file/d/${item.driveFileId}/preview`,
    title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Featured Video',
    category: 'Video',
    provider: 'google_drive' as const,
    videoType: 'video' as const,
    thumbnailUrl: culturalThumbnail(item.thumbnailUrl) ?? (item.thumbnailUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80')
  }));

  const ytVideoItems: VideoItem[] = youtubeVideos
    .filter(video => video.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(video => ({ 
      id: video.id, 
      videoId: video.videoId, 
      originalUrl: video.originalUrl, 
      embedUrl: video.embedUrl, 
      title: video.title, 
      category: video.category,
      provider: 'youtube' as const,
      videoType: video.videoType || 'video',
      thumbnailUrl: culturalThumbnail(video.thumbnailUrl) ?? video.thumbnailUrl
    }));

  const featuredVideos: VideoItem[] = [...ytVideoItems, ...driveVideoItems];

  const heroHeadline = sportsData?.club.organizationName || culturalData?.organization.name || eventData?.profile.name || ngoData?.profile.name || reqs.organizationName;
  const heroDescription = reqs.aboutText?.trim() || reqs.tagline?.trim() || sportsData?.club.description?.trim() || culturalData?.organization.description?.trim() || eventData?.profile.description?.trim() || ngoData?.profile.aboutDescription?.trim() || '';
  const eventsList: EventItem[] = culturalData?.events.map(e => ({
    id: e.id,
    title: e.title,
    date: e.startDate,
    time: e.time,
    venue: e.venue,
    category: e.category
  })) || reqs.events || [];
  const committeeList: CommitteeMember[] = culturalData?.leadership.map(l => ({
    id: l.id,
    name: l.name,
    role: l.designation,
    department: l.roleCategory
  })) || reqs.committee || [];
  const galleryList: GalleryItem[] = culturalData?.gallery.map(g => ({
    id: g.id,
    title: g.title,
    subtitle: g.category,
    category: g.category,
    iconType: 'sparkles'
  })) || reqs.gallery || [];

  const metrics = [
    { value: String(eventsList.length || eventData?.sessions.length || ngoData?.programs.length || 0), label: ngoData ? 'Active Programs' : 'Provided Events / Sessions' },
    { value: String(committeeList.length || eventData?.speakers.length || ngoData?.leadership.length || 0), label: ngoData ? 'Trustees & Leaders' : 'Keynotes & Speakers' },
    { value: String(galleryPhotos.length + galleryList.length + (eventData?.gallery.length || 0) + (ngoData?.impactStats.length || 0)), label: ngoData ? 'Impact Metrics' : 'Approved Media Assets' }
  ];

  const sportsArchetype = reqs.sportsArchetype || (sportsData?.club.organizationType === "sports_academy" ? "sports_academy" : sportsData?.club.organizationType === "tournament_organizer" ? "sports_tournament" : "sports_club");
  const pages: PageRoute[] = sportsData
    ? buildSportsPages(sportsData, sportsArchetype)
    : culturalData
    ? buildCulturalPages(culturalData, culturalArchetype)
    : eventData
    ? buildEventPages(eventData, eventCategory)
    : ngoData
    ? buildNGOPages(ngoData, ngoArchetype)
    : portfolioData
    ? buildPortfolioPages(portfolioData, effectivePortfolioArchetype)
    : [{ id: 'page_home', slug: '/', title: 'Home', navLabel: 'Home', enabled: true, sections: ['hero', 'about', 'contact'] }];

  if (!sportsData && !culturalData && !eventData && !ngoData && !portfolioData) {
    const reqPages = reqs.requiredPages;
    const addPage = (id: string, slugValue: string, title: string, navLabel: string, sections: string[]) => {
      pages.push({ id, slug: slugValue, title, navLabel, enabled: true, sections });
    };
    if (!reqPages || reqPages.about) addPage('page_about', '/about', 'About Us', 'About', ['about', 'committee']);
    if ((!reqPages || reqPages.events) && category !== 'sports') addPage('page_events', '/events', archetype.eventsTitle, 'Events', ['events']);
    if ((!reqPages || reqPages.committee) && category !== 'sports') addPage('page_committee', '/committee', archetype.committeeTitle, 'Committee', ['committee']);
    if (!reqPages || reqPages.gallery) addPage('page_gallery', '/gallery', archetype.galleryTitle, 'Gallery', ['gallery', 'videos']);
    if (reqPages?.announcements) addPage('page_announcements', '/announcements', archetype.announcementsTitle, 'Announcements', ['announcements']);
    if (reqPages?.donations || category === 'ngo_social') addPage('page_donations', '/donations', 'Support & Donations', 'Support Us', ['donations']);
    if (!reqPages || reqPages.contact) addPage('page_contact', '/contact', 'Contact Us', 'Contact', ['contact']);
    reqPages?.customPages?.forEach((customPage, index) => {
      const pageSlug = customPage.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      addPage(`page_custom_${index + 1}`, `/${pageSlug}`, customPage, customPage, ['custom']);
    });
  }

  const sections: WebsiteSectionConfig[] = sportsData
    ? buildSportsSections(sportsData, sportsArchetype)
    : culturalData
    ? buildCulturalSections(culturalData, culturalArchetype)
    : eventData
    ? buildEventSections(eventData, eventCategory)
    : ngoData
    ? buildNGOSections(ngoData, ngoArchetype)
    : portfolioData
    ? buildPortfolioSections(portfolioData)
    : [
        { id: 'sec_hero', type: 'hero', title: heroHeadline, subtitle: reqs.tagline || designProfile.visualDirection, content: heroDescription, layoutStyle: layoutPreset, order: 1, enabled: reqs.enabledSections?.hero ?? true },
        { id: 'sec_about', type: 'about', title: `About ${reqs.organizationName}`, subtitle: reqs.subcategory || archetype.categoryLabel, content: reqs.aboutText || '', layoutStyle: 'editorial', order: 2, enabled: reqs.enabledSections?.about ?? true },
        { id: 'sec_events', type: 'events', title: archetype.eventsTitle, subtitle: 'Information supplied by the organization', layoutStyle: 'list', order: 3, enabled: (reqs.enabledSections?.events ?? true) && eventsList.length > 0 },
        { id: 'sec_committee', type: 'committee', title: archetype.committeeTitle, subtitle: 'Information supplied by the organization', layoutStyle: 'grid', order: 4, enabled: (reqs.enabledSections?.committee ?? true) && committeeList.length > 0 },
        { id: 'sec_gallery', type: 'gallery', title: archetype.galleryTitle, subtitle: 'Approved organization media', layoutStyle: 'grid', order: 5, enabled: (reqs.enabledSections?.gallery ?? true) && (galleryList.length > 0 || galleryPhotos.length > 0) },
        { id: 'sec_videos', type: 'videos', title: 'Featured Videos', subtitle: 'Videos supplied by the organization', layoutStyle: 'grid', order: 6, enabled: featuredVideos.length > 0 },
        { id: 'sec_announcements', type: 'announcements', title: archetype.announcementsTitle, subtitle: 'Official notices supplied by the organization', layoutStyle: 'list', order: 7, enabled: reqPagesFlag(reqs, 'announcements') },
        { id: 'sec_donations', type: 'donations', title: 'Support Our Initiatives', subtitle: 'Donation information supplied by the organization', layoutStyle: 'cards', order: 8, enabled: reqPagesFlag(reqs, 'donations') || category === 'ngo_social' || category === 'ngo' },
        { id: 'sec_contact', type: 'contact', title: 'Get in Touch', subtitle: reqs.address || '', layoutStyle: 'split', order: 9, enabled: reqs.enabledSections?.contact ?? true }
      ];

  const customPrompt = designSelection?.mode === 'custom_ai' ? designSelection.customDesignPrompt?.trim() : '';
  if (customPrompt && !sportsData && !culturalData && !eventData && !ngoData && !portfolioData) {
    const heroSection = sections.find(section => section.id === 'sec_hero');
    if (heroSection) heroSection.subtitle = [heroSection.subtitle, customPrompt].filter(Boolean).join(' | ');
  }

  const navigationPages = pages.filter(page => {
    if (!page.enabled) return false;
    if (sportsData?.pages?.length) {
      const pageKey = page.id.replace(/^page_/, '') as SportsPageKey;
      const definition = sportsData.pages.find(item => item.id === pageKey);
      return definition?.showInNavigation !== false;
    }
    return true;
  });

  const eventCtaLabel = eventCategory === 'conference_seminar' ? 'Book Passes'
    : eventCategory === 'festival_concert' ? 'Get Festival Passes'
    : eventCategory === 'corporate_business' ? 'Register Now'
    : eventCategory === 'exhibition_trade' ? 'Explore Directory'
    : eventCategory === 'wedding_private' ? 'RSVP Now'
    : eventCategory === 'award_ceremony' ? 'Book Gala Table'
    : 'Pre-Order Now';

  const eventCtaHref = eventCategory === 'conference_seminar' ? '/tickets'
    : eventCategory === 'festival_concert' ? '/tickets'
    : eventCategory === 'corporate_business' ? '/registration'
    : eventCategory === 'exhibition_trade' ? '/exhibitors'
    : eventCategory === 'wedding_private' ? '/rsvp'
    : eventCategory === 'award_ceremony' ? '/tickets'
    : '/preorder';

  const navigationBar: NavigationBarConfig = {
    brandName: portfolioData
      ? (portfolioData.identity.displayName || portfolioData.identity.fullName)
      : (eventData?.profile.name || culturalData?.organization.name || ngoData?.profile.name || reqs.organizationName),
    logoUrl: reqs.logoUrl || portfolioData?.identity.avatarUrl || eventData?.branding.logoUrl || sportsData?.club.logoUrl || culturalData?.branding.primaryLogoUrl || ngoData?.branding.logoUrl,
    links: navigationPages.map(page => ({ label: page.navLabel, href: page.slug })),
    ctaButton: {
      label: portfolioData
        ? (portfolioData.identity.availableForHire ? 'Get in Touch' : 'View Projects')
        : sportsData
        ? (sportsArchetype === 'sports_academy' ? 'Book Trial & Admission' : sportsArchetype === 'sports_tournament' ? 'View Brackets & Fixtures' : 'Join the Club')
        : culturalData
        ? (culturalArchetype === 'puja_committee' ? 'View Puja Schedule' : 'Explore Programmes')
        : eventData
        ? eventCtaLabel
        : ngoData
        ? (ngoArchetype === 'institutional_foundation' ? 'Partner With Us' : ngoArchetype === 'cause_charity' ? 'Give Clean Water' : 'Contribute with Dignity')
        : archetype.ctaLabel,
      href: portfolioData
        ? '/contact'
        : sportsData
        ? (sportsArchetype === 'sports_academy' ? '/admissions' : sportsArchetype === 'sports_tournament' ? '/brackets' : '/fixtures')
        : culturalData
        ? (culturalArchetype === 'puja_committee' ? '/schedule' : '/activities')
        : eventData
        ? eventCtaHref
        : ngoData
        ? (ngoArchetype === 'institutional_foundation' ? '/partner' : '/donate')
        : reqs.requiredPages?.donations ? '/donations' : reqs.requiredPages?.events ? '/events' : '/contact'
    }
  };
  const footerConfig: FooterConfig = {
    copyrightText: `© ${new Date().getFullYear()} ${portfolioData ? portfolioData.identity.displayName : (eventData?.profile.name || culturalData?.organization.name || ngoData?.profile.name || reqs.organizationName)}. All rights reserved.`,
    contactInfo: {
      address: reqs.address || portfolioData?.identity.location || sportsData?.club.headquarters || culturalData?.organization.headquarters || eventData?.venue.address || ngoData?.profile.headquartersAddress,
      email: reqs.contactEmail || portfolioData?.identity.email || culturalData?.organization.contactEmail || eventData?.profile.organizerEmail || ngoData?.profile.contactEmail,
      phone: reqs.contactPhone || portfolioData?.identity.phone || culturalData?.organization.contactPhone || eventData?.profile.organizerPhone || ngoData?.profile.contactPhone
    },
    socialLinks: reqs.socialLinks || portfolioData?.socialLinks || culturalData?.organization.socialLinks || eventData?.profile.socialLinks,
    quickLinks: navigationPages.map(page => ({ label: page.navLabel, href: page.slug }))
  };
  const responsiveConfig: ResponsiveConfig = { mobileBreakpoint: '768px', containerMaxWidth: '1280px', enableStickyNav: true };

  const heroCtaText = navigationBar.ctaButton?.label;
  const heroCtaLink = navigationBar.ctaButton?.href;

  return {
    organizationCategory: category,
    culturalArchetype,
    eventCategory,
    ngoArchetype,
    heroCtaText,
    heroCtaLink,
    themeAccent,
    layoutPreset,
    fontFamily,
    simulatedDomain: `${slug || 'tenant'}.digiverse.site`,
    heroHeadline,
    heroDescription,
    heroImage: heroImage || portfolioData?.identity.coverImageUrl || sportsData?.club.coverImageUrl || culturalData?.branding.coverImageUrl || eventData?.branding.coverImageUrl || ngoData?.branding.coverImageUrl,
    metrics,
    eventsTitle: archetype.eventsTitle,
    eventsList,
    aboutContent: reqs.aboutText || portfolioData?.about?.bio || portfolioData?.identity?.bio || sportsData?.club.description || culturalData?.organization.description || eventData?.profile.description || ngoData?.profile.aboutDescription || '',
    committeeTitle: archetype.committeeTitle,
    committeeList,
    galleryTitle: archetype.galleryTitle,
    galleryList,
    galleryPhotos,
    featuredVideos,
    themeConfig,
    pages,
    sections,
    announcements: [],
    donationsInfo: undefined,
    navigationBar,
    footerConfig,
    responsiveConfig,
    sportsData,
    culturalData,
    eventData,
    ngoData,
    portfolioData,
    additionalBrandingImages: reqs.additionalBrandingImages || [],
    selectedTemplate: effectiveSelectedTemplate || reqs.selectedTemplate || (reqs.culturalData as any)?.selectedTemplate || (reqs.portfolioData as any)?.selectedTemplate
  };
}

function reqPagesFlag(reqs: ClientRequirements, key: 'announcements' | 'donations'): boolean {
  return Boolean(reqs.requiredPages?.[key]);
}

export function regenerateSection(
  category: OrganizationCategory,
  sectionType: string,
  orgName: string,
  isBengali: boolean = false
): Partial<GeneratedWebsite> {
  const archetype = ARCHETYPES[category] || ARCHETYPES.cultural;

  if (sectionType === 'hero') {
    return {
      heroHeadline: isBengali ? `${orgName} - অফিসিয়াল পোর্টাল` : `${orgName} Official Portal`,
      heroDescription: `Welcome to the official digital portal for ${orgName}.`
    };
  }

  if (sectionType === 'events') {
    return {
      eventsTitle: archetype.eventsTitle,
      eventsList: [
        {
          id: `evt_regen_${Date.now()}`,
          title: isBengali ? 'বার্ষিক সাধারণ ও সাংস্কৃতিক উৎসব' : `${orgName} Community Gathering`,
          date: 'Upcoming Schedule',
          time: 'TBA',
          venue: 'Main Premises',
          category: 'Official'
        }
      ]
    };
  }

  if (sectionType === 'committee') {
    return {
      committeeTitle: archetype.committeeTitle,
      committeeList: [
        {
          id: `com_regen_${Date.now()}`,
          name: `${orgName} Executive Council`,
          role: 'Leadership',
          department: 'Executive'
        }
      ]
    };
  }

  return {};
}