import React, { useMemo, useState } from 'react';
import type {
  GeneratedWebsite,
  ClientRequirements,
  VideoItem,
  WebsiteSectionConfig
} from '../../types/admin';
import type {
  SportsWebsiteData,
  SportsPageKey,
  SportsSectionType,
  SportsTeam,
  SportsPlayer,
  SportsStaffMember,
  SportsCompetition,
  SportsFixture,
  SportsStanding,
  SportsMatchEvent,
  SportsSponsor,
  SportsNewsArticle,
  SportsPageDefinition,
  SportsSectionDefinition
} from '../../types/sports';
import type {
  CulturalWebsiteData
} from '../../types/cultural';
import { CulturalTemplateDispatcher, resolveCulturalTemplateForProject } from '../../templates/cultural/CulturalTemplateDispatcher';
import { CulturalLiveFrame } from '../../templates/cultural/CulturalLiveFrame';
import { NgoLiveFrame } from '../../templates/ngo/NgoLiveFrame';
import { isNgoTemplateIdLite } from '../../templates/ngo/ids';
import { EventLiveFrame } from '../../templates/event/EventLiveFrame';
import { isEventTemplateIdLite } from '../../templates/event/ids';
import type { PortfolioWebsiteData } from '../../types/portfolio';
import { PortfolioTemplateDispatcher } from '../../templates/portfolio/PortfolioTemplateDispatcher';
import { SportsTemplateDispatcher, resolveSportsTemplateId } from '../../templates/sports/SportsTemplateDispatcher';
import { SportsLiveFrame, type PreviewViewport } from '../../templates/sports/SportsLiveFrame';
import type {
  EventWebsiteData,
  EventCategory
} from '../../types/event';
import type {
  NGOArchetype,
  NGOWebsiteData
} from '../../types/ngo';
import { api } from '../../lib/api';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Globe,
  Shield,
  Sparkles,
  Flame,
  Music,
  Trophy,
  Zap,
  Activity,
  Book,
  Heart,
  HeartHandshake,
  HandHeart,
  Target,
  HelpCircle,
  FileText,
  ArrowRight,
  Droplets,
  Quote,
  Mail,
  Phone,
  Video,
  Play,
  Image as ImageIcon,
  Bell,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  Medal,
  UserRound,
  CalendarDays,
  ListOrdered,
  Swords,
  Building2,
  ExternalLink,
  GraduationCap,
  GitBranch,
  Timer,
  CheckCircle2,
  Compass,
  ShieldCheck,
  Ticket,
  Award,
  Check,
  ChevronDown,
  Radio,
  Search,
  Filter,
  Download,
  Info
} from 'lucide-react';

interface TenantWebsiteRendererProps {
  requirements: ClientRequirements;
  website: GeneratedWebsite;
  inBrowserFrame?: boolean;
  /** Real address shown in the preview's browser bar (defaults to the stored demo domain). */
  browserAddress?: string;
  /** Small label on the right of the browser bar. */
  browserBadge?: string;
  /**
   * Admin Studio and client preview only: render Sports library templates in a real device-width iframe so the
   * design's responsive breakpoints react to the chosen device. Published sites never pass this.
   */
  previewViewport?: PreviewViewport;
}

interface NavPageItem {
  id: string;
  slug: string;
  label: string;
}

const SPORTS_PAGE_LABELS: Record<SportsPageKey, string> = {
  home: 'Home',
  about: 'About',
  teams: 'Teams',
  squads: 'Squads',
  players: 'Players',
  fixtures: 'Fixtures',
  results: 'Results',
  standings: 'Standings',
  competitions: 'Competitions',
  'match-centre': 'Match Centre',
  coaches: 'Coaches',
  news: 'News',
  gallery: 'Gallery',
  sponsors: 'Sponsors',
  contact: 'Contact',
  programmes: 'Programmes',
  batches: 'Schedule',
  admissions: 'Admissions',
  brackets: 'Brackets'
};

const SPORTS_PAGE_PATHS: Record<SportsPageKey, string> = {
  home: '/',
  about: '/about',
  teams: '/teams',
  squads: '/squads',
  players: '/players',
  fixtures: '/fixtures',
  results: '/results',
  standings: '/standings',
  competitions: '/competitions',
  'match-centre': '/match-centre',
  coaches: '/coaches',
  news: '/news',
  gallery: '/gallery',
  sponsors: '/sponsors',
  contact: '/contact',
  programmes: '/programmes',
  batches: '/batches',
  admissions: '/admissions',
  brackets: '/brackets'
};

const SPORTS_PAGE_SECTIONS: Record<SportsPageKey, SportsSectionType[]> = {
  home: [
    'sports_hero',
    'club_identity',
    'featured_teams',
    'upcoming_fixtures',
    'recent_results',
    'sports_news',
    'sponsor_showcase'
  ],
  about: ['club_identity'],
  teams: ['team_directory'],
  squads: ['team_directory', 'player_directory'],
  players: ['player_directory'],
  fixtures: ['upcoming_fixtures'],
  results: ['recent_results'],
  standings: ['league_standings'],
  competitions: ['competition_list'],
  'match-centre': ['live_match', 'match_timeline'],
  coaches: ['coaching_staff'],
  news: ['sports_news'],
  gallery: ['sports_gallery'],
  sponsors: ['sponsor_showcase'],
  contact: ['sports_contact'],
  programmes: ['academy_programmes'],
  batches: ['training_schedules'],
  admissions: ['admission_enquiry'],
  brackets: ['tournament_bracket', 'participating_teams']
};

const SPORTS_DATA_KEYS: Partial<Record<SportsPageKey, string>> = {
  teams: 'teams',
  squads: 'players',
  players: 'players',
  fixtures: 'fixtures',
  results: 'fixtures',
  standings: 'standings',
  competitions: 'competitions',
  'match-centre': 'fixtures',
  coaches: 'staff',
  news: 'news',
  sponsors: 'sponsors'
};

export const TenantWebsiteRenderer: React.FC<TenantWebsiteRendererProps> = ({
  requirements,
  website,
  inBrowserFrame = true,
  browserAddress,
  browserBadge = 'Preview',
  previewViewport
}) => {
  const addressBase = (browserAddress || `https://${website.simulatedDomain}`).replace(/\/$/, '');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(
    website.featuredVideos?.[0] || null
  );
  const [activeVideoFilter, setActiveVideoFilter] = useState('all');
  const [activePage, setActivePage] = useState('/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sportsData: SportsWebsiteData | undefined = website.sportsData;
  const isSports = Boolean(sportsData && requirements.category === 'sports');
  const culturalData: CulturalWebsiteData | undefined = website.culturalData || requirements.culturalData;
  const isCultural = Boolean(culturalData && (requirements.category === 'cultural' || requirements.category === 'puja_committee' || requirements.culturalArchetype));
  const eventData: EventWebsiteData | undefined = website.eventData || requirements.eventData;
  const isEvent = Boolean(eventData || requirements.category === 'event' || requirements.eventCategory);
  const eventCategory: EventCategory = eventData?.category || requirements.eventCategory || 'conference_seminar';
  const ngoData: NGOWebsiteData | undefined = website.ngoData || requirements.ngoData;
  const isNGO = Boolean(ngoData || requirements.category === 'ngo_social' || requirements.category === 'ngo' || requirements.ngoArchetype);
  const ngoArchetype: NGOArchetype = ngoData?.archetype || requirements.ngoArchetype || 'grassroots_ngo';
  const portfolioData: PortfolioWebsiteData | undefined = website.portfolioData || requirements.portfolioData;
  const isPortfolio = Boolean(portfolioData || requirements.category === 'portfolio' || requirements.portfolioArchetype);

  const accentStylesMap: Record<string, {
    heroGlow: string;
    primaryBtn: string;
    badge: string;
    highlightBorder: string;
    accentText: string;
    tagBg: string;
    headerGradient: string;
  }> = {
    'crimson-gold': {
      heroGlow: 'from-amber-600/20 via-red-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-red-900/40 border-amber-500/30',
      badge: 'bg-red-950/80 text-amber-300 border-amber-500/40',
      highlightBorder: 'border-amber-500/30',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      headerGradient: 'from-red-500 via-amber-400 to-yellow-200'
    },
    'sunset-amber': {
      heroGlow: 'from-orange-600/25 via-amber-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-900/40 border-amber-400/30',
      badge: 'bg-orange-950/80 text-amber-300 border-amber-400/40',
      highlightBorder: 'border-amber-500/30',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      headerGradient: 'from-orange-500 via-amber-400 to-yellow-200'
    },
    'neon-cyan': {
      heroGlow: 'from-cyan-600/20 via-blue-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/40 border-cyan-400/30',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/40',
      highlightBorder: 'border-cyan-400/30',
      accentText: 'text-cyan-400',
      tagBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      headerGradient: 'from-cyan-400 via-teal-300 to-blue-300'
    },
    'forest-emerald': {
      heroGlow: 'from-emerald-600/20 via-teal-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 border-emerald-400/30',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/40',
      highlightBorder: 'border-emerald-400/30',
      accentText: 'text-emerald-400',
      tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      headerGradient: 'from-emerald-400 via-teal-300 to-green-200'
    },
    'rose-ruby': {
      heroGlow: 'from-rose-600/20 via-pink-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-900/40 border-rose-400/30',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-400/40',
      highlightBorder: 'border-rose-400/30',
      accentText: 'text-rose-400',
      tagBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      headerGradient: 'from-rose-400 via-pink-300 to-amber-200'
    },
    'royal-indigo': {
      heroGlow: 'from-indigo-600/20 via-blue-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-900/40 border-indigo-400/30',
      badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-400/40',
      highlightBorder: 'border-indigo-400/30',
      accentText: 'text-indigo-400',
      tagBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      headerGradient: 'from-indigo-400 via-sky-300 to-cyan-200'
    },
    'charcoal-slate': {
      heroGlow: 'from-slate-600/20 via-zinc-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-slate-700 to-zinc-600 hover:from-slate-600 hover:to-zinc-500 text-white shadow-slate-900/40 border-slate-400/30',
      badge: 'bg-slate-900/80 text-slate-300 border-slate-500/40',
      highlightBorder: 'border-slate-500/30',
      accentText: 'text-sky-400',
      tagBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      headerGradient: 'from-slate-300 via-zinc-200 to-sky-300'
    },
    'amethyst-purple': {
      heroGlow: 'from-purple-600/20 via-fuchsia-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-purple-900/40 border-purple-400/30',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-400/40',
      highlightBorder: 'border-purple-400/30',
      accentText: 'text-purple-400',
      tagBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      headerGradient: 'from-purple-400 via-fuchsia-300 to-pink-200'
    },
    'ocean-blue': {
      heroGlow: 'from-blue-600/20 via-cyan-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-900/40 border-blue-400/30',
      badge: 'bg-blue-950/80 text-cyan-300 border-blue-400/40',
      highlightBorder: 'border-blue-400/30',
      accentText: 'text-cyan-400',
      tagBg: 'bg-blue-500/10 text-cyan-300 border-blue-500/20',
      headerGradient: 'from-blue-400 via-cyan-300 to-teal-200'
    },
    'royal-violet': {
      heroGlow: 'from-violet-600/20 via-indigo-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/40 border-violet-400/30',
      badge: 'bg-violet-950/80 text-violet-300 border-violet-400/40',
      highlightBorder: 'border-violet-400/30',
      accentText: 'text-violet-400',
      tagBg: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      headerGradient: 'from-violet-400 via-fuchsia-300 to-indigo-200'
    },
    'earth-dignity': {
      heroGlow: 'from-amber-700/20 via-orange-800/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-950/40 border-amber-500/30',
      badge: 'bg-amber-950/80 text-amber-200 border-amber-600/40',
      highlightBorder: 'border-amber-600/30',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-600/20',
      headerGradient: 'from-amber-400 via-orange-400 to-yellow-200'
    },
    'earth_grassroots': {
      heroGlow: 'from-amber-700/20 via-orange-800/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-950/40 border-amber-500/30',
      badge: 'bg-amber-950/80 text-amber-200 border-amber-600/40',
      highlightBorder: 'border-amber-600/30',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-600/20',
      headerGradient: 'from-amber-400 via-orange-400 to-yellow-200'
    },
    'grassroots-warmth': {
      heroGlow: 'from-amber-700/20 via-orange-800/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-950/40 border-amber-500/30',
      badge: 'bg-amber-950/80 text-amber-200 border-amber-600/40',
      highlightBorder: 'border-amber-600/30',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-600/20',
      headerGradient: 'from-amber-400 via-orange-400 to-yellow-200'
    },
    'institutional-navy': {
      heroGlow: 'from-blue-900/30 via-slate-900/20 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-amber-200 shadow-blue-950/50 border-amber-400/30',
      badge: 'bg-slate-900/90 text-amber-300 border-amber-500/40',
      highlightBorder: 'border-amber-400/30',
      accentText: 'text-amber-300',
      tagBg: 'bg-blue-500/10 text-blue-200 border-blue-400/20',
      headerGradient: 'from-amber-300 via-blue-200 to-white'
    },
    'presidential_navy': {
      heroGlow: 'from-blue-900/30 via-slate-900/20 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-amber-200 shadow-blue-950/50 border-amber-400/30',
      badge: 'bg-slate-900/90 text-amber-300 border-amber-500/40',
      highlightBorder: 'border-amber-400/30',
      accentText: 'text-amber-300',
      tagBg: 'bg-blue-500/10 text-blue-200 border-blue-400/20',
      headerGradient: 'from-amber-300 via-blue-200 to-white'
    },
    'cyan-clear': {
      heroGlow: 'from-cyan-600/25 via-sky-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-cyan-950/40 border-cyan-400/30',
      badge: 'bg-cyan-950/80 text-cyan-200 border-cyan-400/40',
      highlightBorder: 'border-cyan-400/30',
      accentText: 'text-cyan-400',
      tagBg: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
      headerGradient: 'from-cyan-300 via-sky-200 to-white'
    },
    'clean_water_impact': {
      heroGlow: 'from-cyan-600/25 via-sky-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-cyan-950/40 border-cyan-400/30',
      badge: 'bg-cyan-950/80 text-cyan-200 border-cyan-400/40',
      highlightBorder: 'border-cyan-400/30',
      accentText: 'text-cyan-400',
      tagBg: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
      headerGradient: 'from-cyan-300 via-sky-200 to-white'
    },
    'cause-clarity': {
      heroGlow: 'from-cyan-600/25 via-sky-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-cyan-950/40 border-cyan-400/30',
      badge: 'bg-cyan-950/80 text-cyan-200 border-cyan-400/40',
      highlightBorder: 'border-cyan-400/30',
      accentText: 'text-cyan-400',
      tagBg: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
      headerGradient: 'from-cyan-300 via-sky-200 to-white'
    },
    'impact-green': {
      heroGlow: 'from-emerald-600/20 via-green-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-950/40 border-emerald-400/30',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/40',
      highlightBorder: 'border-emerald-400/30',
      accentText: 'text-emerald-400',
      tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      headerGradient: 'from-emerald-400 via-teal-300 to-green-200'
    }
  };

  const accentStyles =
    accentStylesMap[website.themeAccent] || accentStylesMap['crimson-gold'];

  const categoryName = (category?: string) => {
    const names: Record<string, string> = {
      cultural: 'Cultural Society',
      puja_committee: 'Puja Committee',
      sports: sportsData?.club.organizationType === 'sports_academy'
        ? 'Sports Academy'
        : sportsData?.club.organizationType === 'tournament_organizer'
          ? 'Tournament Organizer'
          : 'Sports Club',
      health_wellness: 'Health & Wellness',
      ngo_social: 'NGO & Social Welfare',
      ngo: ngoArchetype === 'institutional_foundation' ? 'Foundation & Trust' : ngoArchetype === 'cause_charity' ? 'Charitable Initiative' : 'Grassroots NGO',
      educational: 'Educational Institution',
      professional: 'Professional Association',
      hobby_club: 'Hobby & Interest Club',
      community: 'Community Organization',
      custom: 'Organization'
    };

    return names[category || ''] || category || 'Organization';
  };

  const allVideos = website.featuredVideos || [];
  const filteredVideos = activeVideoFilter === 'all'
    ? allVideos
    : allVideos.filter(video =>
        (video.category || '').toLowerCase().includes(activeVideoFilter.toLowerCase())
      );

  const sportsPages: NavPageItem[] = useMemo(() => {
    if (!sportsData) return [];

    const suppliedPages = sportsData.pages?.filter((page: SportsPageDefinition) => page.enabled) || [];

    if (suppliedPages.length > 0) {
      return suppliedPages.map((page: SportsPageDefinition) => ({
        id: page.id as SportsPageKey,
        slug: page.slug,
        label: page.navLabel || page.title
      }));
    }

    const availablePages = (Object.keys(SPORTS_PAGE_LABELS) as SportsPageKey[])
      .filter(key => {
        if (['home', 'about', 'contact'].includes(key)) return true;

        const dataKey = SPORTS_DATA_KEYS[key];
        if (!dataKey) return false;

        return Boolean(
          sportsData.dataAvailability[
            dataKey as keyof typeof sportsData.dataAvailability
          ]
        );
      });

    return availablePages.map(key => ({
      id: key,
      slug: SPORTS_PAGE_PATHS[key],
      label: SPORTS_PAGE_LABELS[key]
    }));
  }, [sportsData]);

  const genericPages: NavPageItem[] = useMemo(() => {
    return (website.pages || [])
      .filter(page => page.enabled)
      .map(page => ({
        id: page.id,
        slug: page.slug,
        label: page.navLabel || page.title
      }));
  }, [website.pages]);

  const eventPages: NavPageItem[] = useMemo(() => {
    if (!eventData && !isEvent) return [];
    const cat = eventCategory;
    if (cat === 'conference_seminar') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'speakers', slug: '/speakers', label: 'Speakers' },
        { id: 'schedule', slug: '/schedule', label: 'Schedule' },
        { id: 'tickets', slug: '/tickets', label: 'Tickets' },
        { id: 'venue', slug: '/venue', label: 'Venue' },
        { id: 'sponsors', slug: '/sponsors', label: 'Sponsors' },
        { id: 'faq', slug: '/faq', label: 'FAQ' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (cat === 'festival_concert') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'lineup', slug: '/lineup', label: 'Lineup' },
        { id: 'stages', slug: '/stages', label: 'Stages' },
        { id: 'tickets', slug: '/tickets', label: 'Passes' },
        { id: 'venue', slug: '/venue', label: 'Venue' },
        { id: 'gallery', slug: '/gallery', label: 'Gallery' },
        { id: 'partners', slug: '/partners', label: 'Partners' },
        { id: 'contact', slug: '/contact', label: 'Info' }
      ];
    }
    if (cat === 'corporate_business') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'agenda', slug: '/agenda', label: 'Agenda' },
        { id: 'speakers', slug: '/speakers', label: 'Speakers' },
        { id: 'networking', slug: '/networking', label: 'Networking' },
        { id: 'registration', slug: '/registration', label: 'Register' },
        { id: 'partners', slug: '/partners', label: 'Partners' },
        { id: 'venue', slug: '/venue', label: 'Venue' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (cat === 'exhibition_trade') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'exhibitors', slug: '/exhibitors', label: 'Exhibitors' },
        { id: 'floorplan', slug: '/floorplan', label: 'Floor Plan' },
        { id: 'schedule', slug: '/schedule', label: 'Schedule' },
        { id: 'tickets', slug: '/tickets', label: 'Badges' },
        { id: 'gallery', slug: '/gallery', label: 'Showcase' },
        { id: 'sponsors', slug: '/sponsors', label: 'Partners' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (cat === 'wedding_private') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'story', slug: '/story', label: 'Our Story' },
        { id: 'schedule', slug: '/schedule', label: 'Schedule' },
        { id: 'rsvp', slug: '/rsvp', label: 'RSVP' },
        { id: 'travel', slug: '/travel', label: 'Travel & Stay' },
        { id: 'gallery', slug: '/gallery', label: 'Moments' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (cat === 'award_ceremony') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'categories', slug: '/categories', label: 'Categories' },
        { id: 'nominees', slug: '/nominees', label: 'Nominees' },
        { id: 'jury', slug: '/jury', label: 'Jury' },
        { id: 'ceremony', slug: '/ceremony', label: 'Ceremony' },
        { id: 'tickets', slug: '/tickets', label: 'Tables & Seats' },
        { id: 'gallery', slug: '/gallery', label: 'Hall of Fame' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (cat === 'launch_reveal') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'product', slug: '/product', label: 'Overview' },
        { id: 'specs', slug: '/specs', label: 'Tech Specs' },
        { id: 'schedule', slug: '/schedule', label: 'Broadcast' },
        { id: 'gallery', slug: '/gallery', label: 'Gallery' },
        { id: 'preorder', slug: '/preorder', label: 'Pre-Order' },
        { id: 'contact', slug: '/contact', label: 'Press' }
      ];
    }
    return [
      { id: 'home', slug: '/', label: 'Home' },
      { id: 'speakers', slug: '/speakers', label: 'Speakers' },
      { id: 'schedule', slug: '/schedule', label: 'Schedule' },
      { id: 'tickets', slug: '/tickets', label: 'Tickets' },
      { id: 'contact', slug: '/contact', label: 'Contact' }
    ];
  }, [eventData, isEvent, eventCategory]);

  const ngoPages: NavPageItem[] = useMemo(() => {
    if (!ngoData && !isNGO) return [];
    if (ngoArchetype === 'grassroots_ngo') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'about', slug: '/about', label: 'About Us' },
        { id: 'programs', slug: '/programs', label: 'Programs' },
        { id: 'campaigns', slug: '/campaigns', label: 'Drives' },
        { id: 'collection-centers', slug: '/collection-centers', label: 'Dropping Hubs' },
        { id: 'volunteers', slug: '/volunteers', label: 'Volunteers' },
        { id: 'reports', slug: '/reports', label: 'Transparency' },
        { id: 'donate', slug: '/donate', label: 'Contribute' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    if (ngoArchetype === 'institutional_foundation') {
      return [
        { id: 'home', slug: '/', label: 'Home' },
        { id: 'about', slug: '/about', label: 'Mission' },
        { id: 'initiatives', slug: '/initiatives', label: 'Initiatives' },
        { id: 'leadership', slug: '/leadership', label: 'Leadership' },
        { id: 'fellows', slug: '/fellows', label: 'Fellows' },
        { id: 'publications', slug: '/publications', label: 'Publications' },
        { id: 'reports', slug: '/reports', label: 'Disclosures' },
        { id: 'partner', slug: '/partner', label: 'Partner' },
        { id: 'contact', slug: '/contact', label: 'Contact' }
      ];
    }
    // cause_charity
    return [
      { id: 'home', slug: '/', label: 'Home' },
      { id: 'why-cause', slug: '/why-cause', label: 'Why Clean Water' },
      { id: 'how-it-works', slug: '/how-it-works', label: 'How It Works' },
      { id: 'projects', slug: '/projects', label: 'Projects' },
      { id: 'impact', slug: '/impact', label: 'Impact' },
      { id: 'campaigns', slug: '/campaigns', label: 'Campaigns' },
      { id: 'transparency', slug: '/transparency', label: '100% Model' },
      { id: 'donate', slug: '/donate', label: 'Give Water' },
      { id: 'contact', slug: '/contact', label: 'Contact' }
    ];
  }, [ngoData, isNGO, ngoArchetype]);

  const navigationPages: NavPageItem[] = isSports ? sportsPages : isCultural ? ([] as NavPageItem[]) : isEvent ? eventPages : isNGO ? ngoPages : genericPages;

  const activeSportsPage = (
    sportsPages.find((page: NavPageItem) => page.slug === activePage)?.id || 'home'
  ) as SportsPageKey;

  const sportsExperience = useMemo((): 'sports_club' | 'sports_tournament' | 'sports_academy' => {
    const modelId = requirements.designSelection?.modelId;
    if (modelId === 'sports_tournament' || modelId === 'sports_academy' || modelId === 'sports_club') {
      return modelId;
    }
    const orgType = sportsData?.club.organizationType;
    if (orgType === 'tournament_organizer') return 'sports_tournament';
    if (orgType === 'sports_academy') return 'sports_academy';
    const sub = (requirements.subcategory || '').toLowerCase();
    if (sub.includes('tournament') || sub.includes('cup') || sub.includes('league')) return 'sports_tournament';
    if (sub.includes('academy') || sub.includes('training') || sub.includes('coaching')) return 'sports_academy';
    return 'sports_club';
  }, [requirements.designSelection?.modelId, requirements.subcategory, sportsData?.club.organizationType]);

  const currentPageSections = useMemo(() => {
    if (!isSports) return [];

    const configured = sportsData?.pages?.find(
      (page: SportsPageDefinition) => page.slug === activePage
    );

    if (configured?.sections?.length) {
      return configured.sections as SportsSectionType[];
    }

    return SPORTS_PAGE_SECTIONS[activeSportsPage] || [];
  }, [isSports, sportsData, activePage, activeSportsPage]);

  const currentGenericPage = genericPages.find((page: NavPageItem) => page.slug === activePage);
  const currentGenericPageData = website.pages?.find(
    page => page.slug === activePage
  );

  const genericSectionIds = currentGenericPageData?.sections || [];

  const pageSections: WebsiteSectionConfig[] = (website.sections || [])
    .filter((section: WebsiteSectionConfig) => section.enabled)
    .sort((a: WebsiteSectionConfig, b: WebsiteSectionConfig) => a.order - b.order);

  const heroImage = website.heroImage || sportsData?.club.coverImageUrl || '';

  const goToPage = (slug: string) => {
    setActivePage(slug);
    setMobileMenuOpen(false);
  };

  const SectionHeading = ({
    title,
    subtitle,
    icon
  }: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
  }) => (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs leading-5 text-gray-400">{subtitle}</p>
        )}
      </div>
      <div className={`h-1 w-12 rounded-full ${accentStyles.accentText.replace('text-', 'bg-')}`} />
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-500">
        <Activity className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );

  const upcomingFixtures = (sportsData?.fixtures || []).filter((item: SportsFixture) =>
    ['scheduled', 'live', 'half_time'].includes(item.status)
  );

  const nextFixture = upcomingFixtures[0];

  const SportsHero = () => (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07131D] shadow-2xl">
      {heroImage && (
        <img
          src={heroImage}
          alt={sportsData?.club.organizationName || requirements.organizationName}
          className="absolute inset-0 h-full w-full object-cover opacity-30 filter saturate-150"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07131D] via-[#07131D]/90 to-transparent" />
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:items-center">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${accentStyles.badge}`}>
              {sportsExperience === 'sports_tournament' ? (
                <><Trophy className="h-3 w-3" /> Tournament Hub</>
              ) : sportsExperience === 'sports_academy' ? (
                <><GraduationCap className="h-3 w-3" /> Sports Academy</>
              ) : (
                <><Shield className="h-3 w-3" /> Official Club Portal</>
              )}
            </span>
            {sportsData?.club.foundedYear && (
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-gray-300">
                Est. {sportsData.club.foundedYear}
              </span>
            )}
            {sportsData?.club.homeGround && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] text-gray-400">
                <MapPin className="h-3 w-3 text-cyan-400" /> {sportsData.club.homeGround}
              </span>
            )}
          </div>

          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {sportsData?.club.organizationName || website.heroHeadline}
          </h1>

          <p className="max-w-2xl text-sm font-medium leading-relaxed text-gray-300 sm:text-base">
            {sportsData?.club.tagline || sportsData?.club.description || website.heroDescription}
          </p>

          {/* Pitchero-inspired Next Match Bar / Hero Fixture Box */}
          {nextFixture && sportsExperience === 'sports_club' && (
            <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-black/60 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                <span>Next Matchday</span>
                <span>{nextFixture.scheduledAt ? new Date(nextFixture.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-white">
                  {nextFixture.homeOrAway === 'away' ? nextFixture.opponentName : sportsData?.club.organizationName}
                </span>
                <span className="rounded-md bg-cyan-500/20 px-2.5 py-0.5 text-xs font-black text-cyan-300">VS</span>
                <span className="text-sm font-bold text-white">
                  {nextFixture.homeOrAway === 'away' ? sportsData?.club.organizationName : nextFixture.opponentName}
                </span>
              </div>
              {nextFixture.venue && (
                <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-cyan-400" /> {nextFixture.venue}
                </p>
              )}
            </div>
          )}

          {/* Academy Highlights Banner */}
          {sportsExperience === 'sports_academy' && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Admissions Open for All Age Groups · Certified Professional Coaching</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/fixtures')}
              className={`rounded-xl border px-5 py-3 text-xs font-bold transition ${accentStyles.primaryBtn}`}
            >
              {sportsExperience === 'sports_tournament' ? 'Tournament Schedule' : sportsExperience === 'sports_academy' ? 'Training Programmes' : 'View Fixtures'} <ChevronRight className="ml-1 inline h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage('/teams')}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/10"
            >
              {sportsExperience === 'sports_academy' ? 'Our Coaches & Staff' : 'Explore Teams & Squads'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-4">
          {[
            { value: sportsData?.teams?.length || 0, label: sportsExperience === 'sports_tournament' ? 'Participating Teams' : 'Active Teams' },
            { value: sportsData?.players?.length || 0, label: sportsExperience === 'sports_academy' ? 'Cadets Enrolled' : 'Squad Players' },
            { value: sportsData?.fixtures?.length || 0, label: 'Match Fixtures' },
            { value: sportsData?.competitions?.length || 0, label: 'Competitions' }
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <div className={`text-2xl font-black ${accentStyles.accentText}`}>
                {item.value}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderSportsSection = (type: SportsSectionType) => {
    if (!sportsData) return null;

    const teams = sportsData.teams || [];
    const players = sportsData.players || [];
    const fixtures = sportsData.fixtures || [];
    const staff = sportsData.staff || [];
    const competitions = sportsData.competitions || [];
    const standings = sportsData.standings || [];
    const sponsors = sportsData.sponsors || [];
    const news = (sportsData.news || []).filter(item => item.isPublished);
    const matchEvents = sportsData.matchEvents || [];

    const upcomingFixtures = fixtures.filter((item: SportsFixture) =>
      ['scheduled', 'live', 'half_time'].includes(item.status)
    );

    const completedFixtures = fixtures.filter((item: SportsFixture) =>
      item.status === 'completed'
    );

    const formatDate = (value?: string) => {
      if (!value) return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
    };

    const getTeamName = (teamId?: string) =>
      teams.find((team: SportsTeam) => team.id === teamId)?.name || '';

    const renderFixtureCard = (fixture: SportsFixture) => {
      const homeTeam = fixture.homeOrAway === 'away'
        ? fixture.opponentName
        : getTeamName(fixture.teamId) || sportsData.club.organizationName;

      const awayTeam = fixture.homeOrAway === 'away'
        ? getTeamName(fixture.teamId) || sportsData.club.organizationName
        : fixture.opponentName;

      return (
        <article
          key={fixture.id}
          className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase ${accentStyles.badge}`}>
              {fixture.status.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-gray-400">
              {formatDate(fixture.scheduledAt)}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{homeTeam}</p>
              {fixture.homeScore !== undefined && (
                <p className={`mt-2 text-2xl font-black ${accentStyles.accentText}`}>
                  {fixture.homeScore}
                </p>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-500">VS</span>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{awayTeam}</p>
              {fixture.awayScore !== undefined && (
                <p className={`mt-2 text-2xl font-black ${accentStyles.accentText}`}>
                  {fixture.awayScore}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-gray-400">
            {fixture.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {fixture.venue}
              </span>
            )}
            {fixture.round && <span>{fixture.round}</span>}
          </div>
          {fixture.resultSummary && (
            <p className="mt-3 text-xs text-gray-300">{fixture.resultSummary}</p>
          )}
        </article>
      );
    };

    switch (type) {
      case 'sports_hero':
        return <SportsHero />;

      case 'club_identity':
        return (
          <section>
            <SectionHeading title="Club Identity" subtitle="Organization profile and background" icon={<Building2 className="h-5 w-5" />} />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Founded', sportsData.club.foundedYear],
                ['Home Ground', sportsData.club.homeGround],
                ['Headquarters', sportsData.club.headquarters],
                ['Sports', sportsData.club.sportTypes?.join(', ')]
              ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            {sportsData.club.description && (
              <p className="mt-4 text-sm leading-7 text-gray-300">{sportsData.club.description}</p>
            )}
          </section>
        );

      case 'featured_teams':
      case 'team_directory':
        return (
          <section>
            <SectionHeading title="Teams & Squads" subtitle="Teams registered with the organization" icon={<Users className="h-5 w-5" />} />
            {teams.length === 0 ? (
              <EmptyState message="Team information has not been provided yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.filter((team: SportsTeam) => team.isActive).map((team: SportsTeam) => (
                  <article key={team.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                    {team.coverImageUrl && (
                      <img src={team.coverImageUrl} alt={team.name} className="h-32 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt="" className="h-11 w-11 rounded-xl object-contain" />
                        ) : (
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${accentStyles.accentText}`}>
                            <Trophy className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-white">{team.name}</h3>
                          <p className="text-[10px] text-gray-400">{team.sport}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {team.ageGroup && <span className={`rounded-full border px-2 py-1 text-[9px] ${accentStyles.tagBg}`}>{team.ageGroup}</span>}
                        {team.genderCategory && <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-gray-300">{team.genderCategory}</span>}
                      </div>
                      {team.description && <p className="mt-3 text-xs leading-5 text-gray-400">{team.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'player_directory':
      case 'featured_players':
        return (
          <section>
            <SectionHeading title="Players" subtitle="Player profiles and squad information" icon={<UserRound className="h-5 w-5" />} />
            {players.length === 0 ? (
              <EmptyState message="Player profiles have not been provided yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player: SportsPlayer) => (
                  <article key={player.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                    {player.profileImageUrl ? (
                      <img src={player.profileImageUrl} alt={player.fullName} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-white/[0.04]">
                        <UserRound className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{player.displayName || player.fullName}</h3>
                        {player.jerseyNumber !== undefined && (
                          <span className={`text-lg font-black ${accentStyles.accentText}`}>#{player.jerseyNumber}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {[player.position, getTeamName(player.teamId)].filter(Boolean).join(' · ')}
                      </p>
                      {player.status && (
                        <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[9px] ${accentStyles.tagBg}`}>
                          {player.status}
                        </span>
                      )}
                      {player.biography && <p className="mt-3 text-xs leading-5 text-gray-400">{player.biography}</p>}
                      {player.statistics && (
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                          {Object.entries(player.statistics)
                            .filter(([, value]) => typeof value === 'number')
                            .slice(0, 3)
                            .map(([label, value]) => (
                              <div key={label}>
                                <p className="text-lg font-bold text-white">{String(value)}</p>
                                <p className="text-[9px] capitalize text-gray-500">{label.replace(/([A-Z])/g, ' $1')}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'upcoming_fixtures':
        return (
          <section>
            <SectionHeading title="Upcoming Fixtures" subtitle="Scheduled and currently active matches" icon={<CalendarDays className="h-5 w-5" />} />
            {upcomingFixtures.length === 0 ? (
              <EmptyState message="No upcoming fixtures have been provided." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcomingFixtures.map(renderFixtureCard)}
              </div>
            )}
          </section>
        );

      case 'recent_results':
        return (
          <section>
            <SectionHeading title="Recent Results" subtitle="Completed match results" icon={<Medal className="h-5 w-5" />} />
            {completedFixtures.length === 0 ? (
              <EmptyState message="Completed match results have not been provided." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {completedFixtures.map(renderFixtureCard)}
              </div>
            )}
          </section>
        );

      case 'live_match': {
        const liveFixture = fixtures.find((item: SportsFixture) =>
          ['live', 'half_time'].includes(item.status)
        );

        return (
          <section>
            <SectionHeading title="Match Centre" subtitle="Live match status and score" icon={<Activity className="h-5 w-5" />} />
            {!liveFixture ? (
              <EmptyState message="There is no live match information available." />
            ) : (
              <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/40 to-blue-950/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] font-bold uppercase text-red-300">
                    {liveFixture.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{liveFixture.round}</span>
                </div>
                {renderFixtureCard(liveFixture)}
                {liveFixture.matchReport && (
                  <p className="mt-4 text-xs leading-6 text-gray-300">{liveFixture.matchReport}</p>
                )}
                {liveFixture.matchHighlightsUrl && (
                  <a href={liveFixture.matchHighlightsUrl} target="_blank" rel="noreferrer" className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold ${accentStyles.accentText}`}>
                    Match Highlights <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </section>
        );
      }

      case 'match_timeline': {
        const liveFixture = fixtures.find((item: SportsFixture) =>
          ['live', 'half_time', 'completed'].includes(item.status)
        );
        const events = matchEvents.filter((event: SportsMatchEvent) => event.fixtureId === liveFixture?.id);

        return (
          <section>
            <SectionHeading title="Match Timeline" subtitle="Recorded match events" icon={<Clock className="h-5 w-5" />} />
            {!liveFixture || events.length === 0 ? (
              <EmptyState message="No match timeline events have been supplied." />
            ) : (
              <div className="space-y-3">
                {events.map((event: SportsMatchEvent) => (
                  <div key={event.id} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className={`min-w-12 rounded-lg bg-white/5 px-2 py-2 text-center text-xs font-bold ${accentStyles.accentText}`}>
                      {event.minute !== undefined ? `${event.minute}'` : '—'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{event.eventType.replace(/_/g, ' ')}</p>
                      {event.description && <p className="mt-1 text-xs text-gray-400">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'league_standings':
        return (
          <section>
            <SectionHeading title="League Standings" subtitle="Competition table and team positions" icon={<ListOrdered className="h-5 w-5" />} />
            {standings.length === 0 ? (
              <EmptyState message="League standings have not been provided." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="bg-white/[0.06] text-[10px] uppercase tracking-wider text-gray-400">
                    <tr>
                      {['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map(label => (
                        <th key={label} className="px-4 py-3">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...standings].sort((a, b) => a.position - b.position).map((row: SportsStanding) => (
                      <tr key={`${row.competitionId}-${row.teamId}`} className="border-t border-white/10 text-gray-300">
                        <td className="px-4 py-3 font-bold text-white">{row.position}</td>
                        <td className="px-4 py-3 font-semibold text-white">{getTeamName(row.teamId) || row.teamId}</td>
                        <td className="px-4 py-3">{row.played}</td>
                        <td className="px-4 py-3">{row.won}</td>
                        <td className="px-4 py-3">{row.drawn}</td>
                        <td className="px-4 py-3">{row.lost}</td>
                        <td className="px-4 py-3">{row.goalsFor ?? '—'}</td>
                        <td className="px-4 py-3">{row.goalsAgainst ?? '—'}</td>
                        <td className="px-4 py-3">{row.goalDifference ?? '—'}</td>
                        <td className={`px-4 py-3 font-bold ${accentStyles.accentText}`}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );

      case 'competition_list':
        return (
          <section>
            <SectionHeading title="Competitions" subtitle="Leagues, cups and tournaments" icon={<Swords className="h-5 w-5" />} />
            {competitions.length === 0 ? (
              <EmptyState message="Competition information has not been provided." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {competitions.map((competition: SportsCompetition) => (
                  <article key={competition.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    {competition.logoUrl && <img src={competition.logoUrl} alt="" className="mb-4 h-12 w-12 object-contain" />}
                    <h3 className="text-sm font-bold text-white">{competition.name}</h3>
                    <p className="mt-1 text-xs capitalize text-gray-400">{competition.competitionType.replace(/_/g, ' ')} · {competition.sport}</p>
                    {competition.season && <p className="mt-3 text-xs text-gray-300">Season: {competition.season}</p>}
                    {competition.description && <p className="mt-2 text-xs leading-5 text-gray-400">{competition.description}</p>}
                    {(competition.startDate || competition.endDate) && (
                      <p className="mt-3 text-[10px] text-gray-500">{competition.startDate || ''} {competition.endDate ? `— ${competition.endDate}` : ''}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'coaching_staff':
        return (
          <section>
            <SectionHeading title="Coaches & Staff" subtitle="Coaching and organization staff profiles" icon={<Users className="h-5 w-5" />} />
            {staff.length === 0 ? (
              <EmptyState message="Coach and staff information has not been provided." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((person: SportsStaffMember) => (
                  <article key={person.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    {person.profileImageUrl ? (
                      <img src={person.profileImageUrl} alt={person.fullName} className="mb-4 h-36 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-white/5">
                        <UserRound className="h-10 w-10 text-gray-600" />
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-white">{person.fullName}</h3>
                    <p className={`mt-1 text-xs font-semibold ${accentStyles.accentText}`}>{person.role}</p>
                    {person.qualifications && <p className="mt-3 text-xs text-gray-400">{person.qualifications}</p>}
                    {person.biography && <p className="mt-2 text-xs leading-5 text-gray-400">{person.biography}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'sports_news':
        return (
          <section>
            <SectionHeading title="Sports News" subtitle="Published club updates and articles" icon={<Bell className="h-5 w-5" />} />
            {news.length === 0 ? (
              <EmptyState message="No published sports news has been provided." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((article: SportsNewsArticle) => (
                  <article key={article.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                    {article.coverImageUrl && <img src={article.coverImageUrl} alt={article.title} className="h-40 w-full object-cover" />}
                    <div className="p-4">
                      {article.category && <p className={`text-[9px] font-bold uppercase ${accentStyles.accentText}`}>{article.category}</p>}
                      <h3 className="mt-2 text-sm font-bold text-white">{article.title}</h3>
                      {article.summary && <p className="mt-2 text-xs leading-5 text-gray-400">{article.summary}</p>}
                      <p className="mt-3 text-[10px] text-gray-500">{article.publishedAt}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'sports_gallery':
        return (
          <section>
            <SectionHeading title="Sports Gallery" subtitle="Organization-provided photographs" icon={<ImageIcon className="h-5 w-5" />} />
            {(website.galleryPhotos || []).length === 0 ? (
              <EmptyState message="No approved sports photographs have been provided." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {website.galleryPhotos?.map(photo => (
                  <article key={photo.id} className="overflow-hidden rounded-xl border border-white/10">
                    <img src={photo.url} alt={photo.title} className="h-48 w-full object-cover" />
                    <div className="p-3">
                      <p className="text-xs font-semibold text-white">{photo.title}</p>
                      {photo.category && <p className="mt-1 text-[10px] text-gray-400">{photo.category}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'sponsor_showcase':
        return (
          <section>
            <SectionHeading title="Sponsors & Partners" subtitle="Official sponsor information supplied by the organization" icon={<Trophy className="h-5 w-5" />} />
            {sponsors.length === 0 ? (
              <EmptyState message="Sponsor information has not been provided." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sponsors.map((sponsor: SportsSponsor) => (
                  <article key={sponsor.id} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-center">
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} alt={sponsor.name} className="mb-4 h-16 max-w-full object-contain" />
                    ) : (
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                        <Trophy className={`h-7 w-7 ${accentStyles.accentText}`} />
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-white">{sponsor.name}</h3>
                    {sponsor.sponsorshipLevel && <p className={`mt-2 text-[10px] uppercase ${accentStyles.accentText}`}>{sponsor.sponsorshipLevel}</p>}
                    {sponsor.description && <p className="mt-2 text-xs text-gray-400">{sponsor.description}</p>}
                    {sponsor.websiteUrl && (
                      <a href={sponsor.websiteUrl} target="_blank" rel="noreferrer" className={`mt-3 text-xs font-semibold ${accentStyles.accentText}`}>
                        Visit Website <ExternalLink className="ml-1 inline h-3 w-3" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'sports_contact':
        return (
          <section>
            <SectionHeading title="Contact the Club" subtitle="Contact details supplied by the organization" icon={<Mail className="h-5 w-5" />} />
            <div className="grid gap-4 sm:grid-cols-2">
              {sportsData.club.headquarters && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <MapPin className={`mb-3 h-5 w-5 ${accentStyles.accentText}`} />
                  <p className="text-[10px] uppercase text-gray-500">Headquarters</p>
                  <p className="mt-1 text-sm text-white">{sportsData.club.headquarters}</p>
                </div>
              )}
              {requirements.contactEmail && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <Mail className={`mb-3 h-5 w-5 ${accentStyles.accentText}`} />
                  <p className="text-[10px] uppercase text-gray-500">Email</p>
                  <p className="mt-1 break-all text-sm text-white">{requirements.contactEmail}</p>
                </div>
              )}
              {requirements.contactPhone && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <Phone className={`mb-3 h-5 w-5 ${accentStyles.accentText}`} />
                  <p className="text-[10px] uppercase text-gray-500">Phone</p>
                  <p className="mt-1 text-sm text-white">{requirements.contactPhone}</p>
                </div>
              )}
            </div>
          </section>
        );

      case 'tournament_bracket': {
        const stages = sportsData.tournamentStages || [];
        return (
          <section>
            <SectionHeading
              title="Tournament Knockout Brackets"
              subtitle="Championship elimination rounds & progression pathway"
              icon={<GitBranch className="h-5 w-5" />}
            />
            {stages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
                <Trophy className="mx-auto h-12 w-12 text-cyan-400 mb-3" />
                <h4 className="text-base font-bold text-white">Knockout Stage Fixtures Upcoming</h4>
                <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                  Tournament elimination bracket pairings and match schedules will appear here following the conclusion of preliminary fixtures.
                </p>
                <button
                  type="button"
                  onClick={() => goToPage('/fixtures')}
                  className={`mt-4 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold ${accentStyles.primaryBtn}`}
                >
                  Explore Match Schedule <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {stages.map((stage: any, stageIdx: number) => (
                    <div key={stage.id || stageIdx} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          {stage.name}
                        </h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400">
                          Round {stage.stageOrder ?? stage.order ?? stageIdx + 1}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {(stage.matches || []).map((match: any, mIdx: number) => {
                          const homeWinner = match.winner === 'home' || (match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore);
                          const awayWinner = match.winner === 'away' || (match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore);
                          return (
                            <div
                              key={match.id || mIdx}
                              className="rounded-xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-cyan-500/40"
                            >
                              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                                <span className="font-semibold text-gray-300">{match.roundName || match.round || `Match ${mIdx + 1}`}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${match.status === 'live' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-gray-400'}`}>
                                  {match.status || 'Scheduled'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div className={`flex items-center justify-between p-1.5 rounded ${homeWinner ? 'bg-cyan-950/40 border border-cyan-800/40 font-bold text-white' : 'text-gray-300'}`}>
                                  <span className="text-xs truncate">{match.homeTeamName}</span>
                                  <span className="text-xs font-mono font-black text-cyan-400 ml-2">{match.homeScore ?? '-'}</span>
                                </div>
                                <div className={`flex items-center justify-between p-1.5 rounded ${awayWinner ? 'bg-cyan-950/40 border border-cyan-800/40 font-bold text-white' : 'text-gray-300'}`}>
                                  <span className="text-xs truncate">{match.awayTeamName}</span>
                                  <span className="text-xs font-mono font-black text-cyan-400 ml-2">{match.awayScore ?? '-'}</span>
                                </div>
                              </div>
                              {match.venue && (
                                <p className="mt-2 text-[9px] text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-cyan-500" /> {match.venue}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      }

      case 'participating_teams':
        return (
          <section>
            <SectionHeading
              title="Participating Teams"
              subtitle="Clubs and squads competing in the championship"
              icon={<Users className="h-5 w-5" />}
            />
            {teams.length === 0 ? (
              <EmptyState message="Participating team roster will be published once team registrations conclude." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {teams.map((team: SportsTeam) => (
                  <article key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center transition hover:border-cyan-500/40">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-950/80 to-blue-950/40 border border-cyan-500/30 mb-3">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="h-10 w-10 object-contain" />
                      ) : (
                        <Shield className="h-8 w-8 text-cyan-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{team.name}</h3>
                    <p className="mt-1 text-xs text-cyan-400 font-semibold uppercase tracking-wider">{team.ageGroup || team.sport || 'Club'}</p>
                    {team.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{team.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'academy_programmes': {
        const programmes = sportsData.academyProgrammes || [];
        return (
          <section>
            <SectionHeading
              title="Academy Coaching Programmes"
              subtitle="Structured athletic development pathways and age-specific curriculums"
              icon={<GraduationCap className="h-5 w-5" />}
            />
            {programmes.length === 0 ? (
              <EmptyState message="Academy programmes are currently being finalized for the upcoming season." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programmes.map((prog: any, idx: number) => (
                  <article
                    key={prog.id || idx}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-emerald-500/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          {prog.ageGroup}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {prog.feeStructure}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{prog.title}</h3>
                      <p className="text-xs leading-relaxed text-gray-300">{prog.description}</p>
                      {prog.curriculumHighlights && prog.curriculumHighlights.length > 0 && (
                        <div className="border-t border-white/10 pt-3 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Curriculum Highlights</p>
                          {prog.curriculumHighlights.map((hl: string, hIdx: number) => (
                            <div key={hIdx} className="flex items-center gap-2 text-xs text-gray-300">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{hl}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => goToPage('/admissions')}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500 transition"
                      >
                        Book Assessment & Trial
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'training_schedules': {
        const batches = sportsData.trainingBatches || [];
        return (
          <section>
            <SectionHeading
              title="Training Timetables & Batches"
              subtitle="Weekly training sessions, venues and assigned coaching staff"
              icon={<Timer className="h-5 w-5" />}
            />
            {batches.length === 0 ? (
              <EmptyState message="Training schedules and session timetables will be posted prior to term commencement." />
            ) : (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  {batches.map((batch: any, idx: number) => (
                    <div key={batch.id || idx} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-cyan-500/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{batch.name}</h4>
                          <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300">
                            {batch.ageGroup}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400">{batch.startTime} - {batch.endTime}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(batch.daysOfWeek || []).map((day: string, dIdx: number) => (
                          <span key={dIdx} className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3 text-gray-400">
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-cyan-400" /> {batch.venue}</p>
                        <p className="flex items-center gap-1.5 font-semibold text-gray-300"><Sparkles className="h-3.5 w-3.5 text-amber-400" /> {batch.coachName}</p>
                      </div>
                      {batch.maxCapacity && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Enrollment</span>
                            <span>{batch.currentEnrollment || 0} / {batch.maxCapacity} Athletes</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(((batch.currentEnrollment || 0) / batch.maxCapacity) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      }

      case 'membership_enquiry':
        return (
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  <Shield className="h-3.5 w-3.5" /> Official Club Membership
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Join {sportsData.club.organizationName}</h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Support the club, unlock exclusive matchday priority tickets, official club merchandise discounts, and take part in annual general meetings.
                </p>
                <div className="space-y-2 pt-2">
                  {[
                    'Matchday priority access and reserved seating',
                    'Official club member scarf and digital crest badge',
                    'Voting rights at the annual club supporter assembly',
                    'Direct invitation to end-of-season awards banquet'
                  ].map((benefit, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2.5 text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-md lg:col-span-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Enquire for Membership</h3>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp Number"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => alert('Thank you for your membership enquiry! The club secretary will reach out shortly.')}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
                >
                  Submit Membership Enquiry
                </button>
              </div>
            </div>
          </section>
        );

      case 'admission_enquiry':
        return (
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <GraduationCap className="h-3.5 w-3.5" /> Academy Admissions & Scouting
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Trial Bookings Open</h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Register prospective student-athletes for technical trial assessments evaluated by our certified UEFA / FA licensed coaching staff.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-lg font-black text-emerald-400">100%</p>
                    <p className="text-[10px] text-gray-400">Licensed Coaching Staff</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-lg font-black text-cyan-400">U-8 to U-19</p>
                    <p className="text-[10px] text-gray-400">Age Divisions Catered</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-md lg:col-span-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Register for Trials</h3>
                <input
                  type="text"
                  placeholder="Athlete Full Name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Age / Date of Birth"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Preferred Position"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Parent / Guardian Mobile"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => alert('Trial application received! Our Academy Registrar will send the date and reporting instructions.')}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500 transition"
                >
                  Confirm Trial Registration
                </button>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  // ==========================================
  // EVENT CREATION ENGINE COMPONENTS (7 CATEGORIES)
  // ==========================================

  // Conference & Seminar Hero (Relate / Web Summit parity)
  const ConferenceHero = () => {
    const prof = eventData?.profile;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-[#0a1428] to-black shadow-2xl p-6 sm:p-12">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-[1px]" />
        )}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300">
              <Zap className="h-3 w-3 text-blue-400" />
              {prof?.edition || 'Annual Global Summit'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              <Calendar className="h-3 w-3 text-cyan-400" />
              {prof?.startDate} {prof?.endDate && prof.endDate !== prof.startDate ? `— ${prof.endDate}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              <MapPin className="h-3 w-3 text-cyan-400" />
              {prof?.venueName}, {prof?.city}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {prof?.name || requirements.organizationName}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl font-light">
              {prof?.tagline || prof?.description || requirements.aboutText}
            </p>
          </div>

          {eventData?.speakers && eventData.speakers.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {eventData.speakers.slice(0, 4).map((sp, idx) => (
                  <div key={sp.id || idx} className="h-9 w-9 rounded-full border-2 border-[#0a1428] bg-slate-800 flex items-center justify-center overflow-hidden">
                    {sp.photoUrl ? (
                      <img src={sp.photoUrl} alt={sp.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-white">{eventData.speakers.length}+ Industry Leaders</span> Speaking Live
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 active:scale-95"
            >
              <Ticket className="h-4 w-4" /> Book Passes Now
            </button>
            <button
              type="button"
              onClick={() => goToPage('/schedule')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
            >
              <CalendarDays className="h-4 w-4" /> View Full Schedule
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Festival & Concert Hero (Outside Festival / Summer Dance parity)
  const FestivalHero = () => {
    const prof = eventData?.profile;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    const headliners = (eventData?.speakers || []).filter(s => s.role === 'headliner_artist' || s.isFeatured).slice(0, 5);
    return (
      <section className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-[#1b0520] via-[#0f071f] to-black shadow-2xl p-6 sm:p-12 text-center">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 filter contrast-125" />
        )}
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-950/70 px-4 py-1 text-xs font-black uppercase tracking-widest text-pink-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {prof?.edition || 'Summer Sonic Experience 2026'}
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-400 sm:text-6xl lg:text-7xl">
            {prof?.name || requirements.organizationName}
          </h1>

          <p className="text-sm sm:text-base text-pink-100/80 max-w-xl mx-auto font-light">
            {prof?.tagline || 'Three Days of Live Music, Immersive Art, Visual Stages & Community'}
          </p>

          {headliners.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-pink-300/80 mb-2">Featured Headliners</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {headliners.map(h => (
                  <span key={h.id} className="rounded-lg border border-pink-500/30 bg-black/60 px-3.5 py-1 text-xs font-bold text-white shadow">
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 max-w-lg mx-auto">
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-2.5">
              <div className="text-xs text-gray-400">Date</div>
              <div className="text-sm font-bold text-white">{prof?.startDate}</div>
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-2.5">
              <div className="text-xs text-gray-400">Location</div>
              <div className="text-sm font-bold text-white truncate">{prof?.venueName}</div>
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-2.5">
              <div className="text-xs text-gray-400">Stages</div>
              <div className="text-sm font-bold text-white">{eventData?.tracks.length || 3}+ Arenas</div>
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-2.5">
              <div className="text-xs text-gray-400">Live Artists</div>
              <div className="text-sm font-bold text-white">{eventData?.speakers.length || 12}+ Acts</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-pink-600/30 transition hover:brightness-110 active:scale-95"
            >
              <Ticket className="h-4 w-4" /> Get Festival Passes
            </button>
            <button
              type="button"
              onClick={() => goToPage('/lineup')}
              className="inline-flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-950/40 px-6 py-3.5 text-xs font-bold text-pink-200 transition hover:bg-pink-900/50 active:scale-95"
            >
              <Music className="h-4 w-4" /> View Full Lineup
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Corporate & Business Hero (Dreamforce parity)
  const CorporateHero = () => {
    const prof = eventData?.profile;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-[#070b1a] via-[#0c1430] to-black shadow-2xl p-6 sm:p-12">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        )}
        <div className="relative max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <Building2 className="h-3 w-3 text-indigo-400" />
              {prof?.edition || 'Executive Leadership Summit'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              {prof?.startDate} • {prof?.venueName}, {prof?.city}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight">
              {prof?.name || requirements.organizationName}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-indigo-100/80 max-w-2xl font-light">
              {prof?.tagline || prof?.description || 'Accelerating Enterprise Transformation, Growth and Executive Alignment'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 max-w-xl">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5">
              <div className="text-xl font-black text-indigo-300">{eventData?.speakers.length || 20}+</div>
              <div className="text-[11px] text-gray-400">C-Suite & Keynote Speakers</div>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5">
              <div className="text-xl font-black text-cyan-300">{eventData?.sessions.length || 35}+</div>
              <div className="text-[11px] text-gray-400">Curated Executive Sessions</div>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5 col-span-2 sm:col-span-1">
              <div className="text-xl font-black text-emerald-300">{eventData?.sponsors.length || 10}+</div>
              <div className="text-[11px] text-gray-400">Global Enterprise Partners</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/registration')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" /> Register As Delegate
            </button>
            <button
              type="button"
              onClick={() => goToPage('/agenda')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              <CalendarDays className="h-4 w-4" /> View Summit Agenda
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Exhibition & Trade Fair Hero (Art Basel / The Other Art Fair parity)
  const ExhibitionHero = () => {
    const prof = eventData?.profile;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-[#041414] via-[#091b1a] to-black shadow-2xl p-6 sm:p-12">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 filter grayscale" />
        )}
        <div className="relative max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300">
              <Compass className="h-3 w-3 text-teal-400" />
              {prof?.edition || 'International Trade Exhibition'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              {prof?.startDate} — {prof?.endDate || 'Annual'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              {prof?.venueName}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl font-serif">
              {prof?.name || requirements.organizationName}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-teal-100/80 max-w-2xl font-light">
              {prof?.description || 'Connecting leading global manufacturers, buyers, innovators and visionaries across specialized pavilions.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="rounded-xl border border-teal-500/20 bg-teal-950/40 px-4 py-2.5">
              <div className="text-sm font-bold text-white">{eventData?.exhibitors.length || 45}+</div>
              <div className="text-[10px] text-teal-300 uppercase">Exhibitors</div>
            </div>
            <div className="rounded-xl border border-teal-500/20 bg-teal-950/40 px-4 py-2.5">
              <div className="text-sm font-bold text-white">{eventData?.tracks.length || 4} Sectors</div>
              <div className="text-[10px] text-teal-300 uppercase">Trade Pavilions</div>
            </div>
            <div className="rounded-xl border border-teal-500/20 bg-teal-950/40 px-4 py-2.5">
              <div className="text-sm font-bold text-white">{prof?.time || '10:00 AM - 06:00 PM'}</div>
              <div className="text-[10px] text-teal-300 uppercase">Daily Hours</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-teal-600/30 transition hover:brightness-110 active:scale-95"
            >
              <Ticket className="h-4 w-4" /> Get Visitor Badges
            </button>
            <button
              type="button"
              onClick={() => goToPage('/exhibitors')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              <Search className="h-4 w-4" /> Exhibitor Directory
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Wedding & Private Hero (Zola / Wix Events parity)
  const WeddingHero = () => {
    const prof = eventData?.profile;
    const story = eventData?.weddingStory;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-[#1a0a14] via-[#12070e] to-black shadow-2xl p-6 sm:p-14 text-center">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-950/60 px-4 py-1 text-xs font-serif tracking-widest text-pink-300">
            <Heart className="h-3.5 w-3.5 text-pink-400 fill-pink-400" />
            Together With Their Families
          </div>

          <h1 className="text-4xl font-normal text-white sm:text-6xl lg:text-7xl font-serif tracking-normal">
            {story?.coupleNames || prof?.name || 'Sophia & Alexander'}
          </h1>

          <p className="text-sm sm:text-base text-pink-100/80 italic font-serif max-w-lg mx-auto">
            {prof?.tagline || '"Two souls, one heart, beginning their forever journey together."'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="rounded-full border border-pink-500/20 bg-black/60 px-4 py-1.5 text-xs text-pink-200">
              <Calendar className="mr-1.5 inline h-3.5 w-3.5 text-pink-400" />
              {prof?.startDate}
            </span>
            <span className="rounded-full border border-pink-500/20 bg-black/60 px-4 py-1.5 text-xs text-pink-200">
              <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-pink-400" />
              {prof?.venueName}, {prof?.city}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => goToPage('/rsvp')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition hover:brightness-110 active:scale-95"
            >
              <Heart className="h-4 w-4 fill-white" /> RSVP Kindly
            </button>
            <button
              type="button"
              onClick={() => goToPage('/story')}
              className="inline-flex items-center gap-2 rounded-full border border-pink-400/40 bg-pink-950/30 px-7 py-3.5 text-xs font-bold text-pink-200 transition hover:bg-pink-900/40 active:scale-95"
            >
              Our Love Story
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Award Ceremony Hero (Cannes Lions / Webby Awards parity)
  const AwardHero = () => {
    const prof = eventData?.profile;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#161208] via-[#0d0a04] to-black shadow-2xl p-6 sm:p-12">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 filter contrast-125" />
        )}
        <div className="relative max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Trophy className="h-3 w-3 text-amber-400" />
              {prof?.edition || 'Annual Gala Presentation'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300">
              Black Tie • {prof?.startDate}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight">
              {prof?.name || requirements.organizationName}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-amber-100/80 max-w-2xl font-light">
              {prof?.tagline || prof?.description || 'Honoring Outstanding Creativity, Engineering and Fearless Excellence'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md pt-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
              <div className="text-lg font-black text-amber-300">{eventData?.awardCategories.length || 12}</div>
              <div className="text-[10px] text-gray-400">Award Categories</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
              <div className="text-lg font-black text-amber-300">{eventData?.speakers.length || 8}</div>
              <div className="text-[10px] text-gray-400">Distinguished Jury</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3 col-span-2 sm:col-span-1">
              <div className="text-lg font-black text-amber-300">Gala Dinner</div>
              <div className="text-[10px] text-gray-400">Grand Ballroom</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-6 py-3.5 text-xs font-bold text-black shadow-lg shadow-amber-600/30 transition hover:brightness-110 active:scale-95"
            >
              <Ticket className="h-4 w-4 text-black" /> Book Gala Tables & Seats
            </button>
            <button
              type="button"
              onClick={() => goToPage('/categories')}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/40 px-6 py-3.5 text-xs font-bold text-amber-200 transition hover:bg-amber-900/50 active:scale-95"
            >
              <Award className="h-4 w-4" /> View Award Categories
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Launch & Product Reveal Hero (Apple Events parity)
  const LaunchHero = () => {
    const prof = eventData?.profile;
    const launch = eventData?.productLaunch;
    const cover = eventData?.branding.coverImageUrl || heroImage;
    return (
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-b from-[#0b0c10] via-black to-[#050608] shadow-2xl p-6 sm:p-14 text-center">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/50 px-4 py-1 text-xs font-semibold text-blue-300">
            <Radio className="h-3.5 w-3.5 text-red-400" />
            Special Keynote Announcement • {prof?.startDate}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl font-sans">
            {launch?.productName || prof?.name || 'Nova Architecture'}
          </h1>

          <p className="text-base sm:text-xl font-light text-slate-300 max-w-xl mx-auto">
            {launch?.tagline || prof?.tagline || 'A monumental leap forward in speed, intelligence and industrial engineering.'}
          </p>

          {launch?.bentoHighlights && launch.bentoHighlights.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {launch.bentoHighlights.slice(0, 3).map(h => (
                <div key={h.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
                  <span className="text-xs font-bold text-cyan-400">{h.metric || h.title}</span>
                  <span className="ml-1 text-[11px] text-gray-400">{h.subtitle || ''}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => goToPage('/preorder')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              Pre-Order Now
            </button>
            <button
              type="button"
              onClick={() => goToPage('/specs')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-7 py-3.5 text-xs font-bold text-white transition active:scale-95"
            >
              Technical Specifications
            </button>
          </div>
        </div>
      </section>
    );
  };


  // Event Speakers / Artists / Jury Section
  const EventSpeakersSection = () => {
    const speakers = eventData?.speakers || [];
    const [selectedRole, setSelectedRole] = useState('all');
    const [expandedBioId, setExpandedBioId] = useState<string | null>(null);

    if (speakers.length === 0) return null;

    const roles = Array.from(new Set(speakers.map(s => s.role))).filter(Boolean);
    const filteredSpeakers = selectedRole === 'all'
      ? speakers
      : speakers.filter(s => s.role === selectedRole);

    const title = eventCategory === 'festival_concert' ? 'Artist Lineup & Performers'
      : eventCategory === 'award_ceremony' ? 'Distinguished Jury & Hosts'
      : 'Keynote Speakers & Industry Leaders';

    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            title={title}
            subtitle={eventCategory === 'festival_concert' ? 'World-class artists performing across our festival stages' : 'Visionaries sharing breakthrough perspectives and domain expertise'}
            icon={<Users className="h-5 w-5 text-blue-400" />}
          />
          {roles.length > 1 && (
            <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedRole('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selectedRole === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All ({speakers.length})
              </button>
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${selectedRole === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {r.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredSpeakers.map(sp => {
            const isExpanded = expandedBioId === sp.id;
            return (
              <div
                key={sp.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 p-4 transition hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div>
                  <div className="relative mb-3.5 aspect-square w-full overflow-hidden rounded-xl bg-slate-900 border border-white/5">
                    {sp.photoUrl ? (
                      <img src={sp.photoUrl} alt={sp.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <UserRound className="h-16 w-16" />
                      </div>
                    )}
                    {sp.isFeatured && (
                      <span className="absolute top-2.5 right-2.5 rounded-full border border-amber-400/40 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                      {sp.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {sp.title || sp.role?.replace(/_/g, ' ')}
                    </p>
                    {sp.organization && (
                      <p className="text-[11px] font-semibold text-cyan-400 line-clamp-1">
                        {sp.organization}
                      </p>
                    )}
                  </div>

                  {sp.topic && (
                    <div className="mt-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[11px] text-slate-300">
                      <span className="font-semibold text-blue-300">Topic: </span>
                      {sp.topic}
                    </div>
                  )}

                  {sp.bio && (
                    <div className="mt-2">
                      <p className={`text-[11px] leading-relaxed text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {sp.bio}
                      </p>
                      {sp.bio.length > 80 && (
                        <button
                          type="button"
                          onClick={() => setExpandedBioId(isExpanded ? null : sp.id)}
                          className="mt-1 text-[10px] font-semibold text-blue-400 hover:underline"
                        >
                          {isExpanded ? 'Show Less' : 'Read Bio'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {sp.socialUrl && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="capitalize">{sp.role.replace(/_/g, ' ')}</span>
                    <a href={sp.socialUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-white flex items-center gap-1">
                      Profile <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };


  // Event Agenda & Timetable Section
  const EventAgendaSection = () => {
    const sessions = eventData?.sessions || [];
    const tracks = eventData?.tracks || [];
    const speakers = eventData?.speakers || [];

    if (sessions.length === 0) return null;

    const days = Array.from(new Set(sessions.map(s => s.day))).filter(Boolean);
    const [selectedDay, setSelectedDay] = useState(days[0] || 'all');
    const [selectedTrack, setSelectedTrack] = useState('all');

    const filteredSessions = sessions.filter(s => {
      const matchDay = selectedDay === 'all' || s.day === selectedDay;
      const matchTrack = selectedTrack === 'all' || s.trackId === selectedTrack;
      return matchDay && matchTrack;
    });

    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            title={eventCategory === 'wedding_private' ? 'Wedding Day Itinerary' : 'Schedule & Multi-Track Agenda'}
            subtitle="Explore sessions, keynote presentations, roundtables and activities"
            icon={<CalendarDays className="h-5 w-5 text-cyan-400" />}
          />

          {days.length > 1 && (
            <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              {days.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${selectedDay === d ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {tracks.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter Track:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTrack('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${selectedTrack === 'all' ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300' : 'border-white/10 bg-black/30 text-gray-400'}`}
            >
              All Tracks
            </button>
            {tracks.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrack(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${selectedTrack === t.id ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300' : 'border-white/10 bg-black/30 text-gray-400'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {filteredSessions.map(session => {
            const track = tracks.find(t => t.id === session.trackId);
            const sessionSpeakers = speakers.filter(sp => session.speakerIds?.includes(sp.id));
            return (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
              >
                <div className="sm:w-44 shrink-0 space-y-1">
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                    <Clock className="h-3.5 w-3.5" />
                    {session.startTime} — {session.endTime}
                  </div>
                  {session.stage && (
                    <div className="text-[11px] font-semibold text-gray-400">
                      📍 {session.stage}
                    </div>
                  )}
                  {session.room && (
                    <div className="text-[10px] text-gray-500">
                      {session.room}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-white">
                      {session.title}
                    </h4>
                    {session.isKeynote && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        ★ Keynote
                      </span>
                    )}
                    {track && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[10px] font-medium text-cyan-300">
                        {track.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                    {session.description}
                  </p>

                  {sessionSpeakers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {sessionSpeakers.map(sp => (
                        <div key={sp.id} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-gray-300">
                          {sp.photoUrl ? (
                            <img src={sp.photoUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <UserRound className="h-3.5 w-3.5 text-blue-400" />
                          )}
                          <span className="font-semibold text-white">{sp.name}</span>
                          {sp.organization && <span className="text-gray-500">({sp.organization})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };


  // Event Tickets & Passes Pricing Cards Section
  const EventTicketsSection = () => {
    const tickets = eventData?.tickets || [];
    if (tickets.length === 0) return null;

    const title = eventCategory === 'award_ceremony' ? 'Gala Table & Seat Reservations'
      : eventCategory === 'festival_concert' ? 'Festival Passes & Camping'
      : eventCategory === 'exhibition_trade' ? 'Visitor Badges & Passes'
      : 'Passes & Registration Tiers';

    return (
      <section className="space-y-6">
        <SectionHeading
          title={title}
          subtitle="Select your pass tier for direct access and immediate confirmation"
          icon={<Ticket className="h-5 w-5 text-emerald-400" />}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(tier => {
            const isFeatured = Boolean(tier.badge);
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition duration-300 ${isFeatured ? 'border-blue-500/50 bg-gradient-to-b from-blue-950/40 via-slate-950/80 to-black shadow-xl shadow-blue-950/30' : 'border-white/10 bg-black/40 hover:border-white/20'}`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 right-6 rounded-full border border-blue-400/50 bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                    {tier.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <p className="mt-1 text-xs text-gray-400">{tier.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {typeof tier.price === 'number' ? (
                          tier.currency === 'INR' ? `₹${tier.price.toLocaleString()}` : `${tier.currency} ${tier.price.toLocaleString()}`
                        ) : (
                          tier.price
                        )}
                      </span>
                      {typeof tier.price === 'number' && (
                        <span className="text-xs text-gray-400">/ pass</span>
                      )}
                    </div>
                  </div>

                  {tier.features && tier.features.length > 0 && (
                    <ul className="space-y-2 pt-2 text-xs text-gray-300">
                      {tier.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (tier.registrationUrl) {
                        window.open(tier.registrationUrl, '_blank');
                      } else {
                        goToPage('/contact');
                      }
                    }}
                    className={`w-full rounded-xl py-3 text-xs font-bold transition active:scale-95 ${isFeatured ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg hover:brightness-110' : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'}`}
                  >
                    {tier.registrationUrl ? 'Book Online Pass' : 'Select Pass & Register'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };


  // Event Exhibitors Directory Section
  const EventExhibitorsSection = () => {
    const exhibitors = eventData?.exhibitors || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSector, setSelectedSector] = useState('all');

    if (exhibitors.length === 0) return null;

    const sectors = Array.from(new Set(exhibitors.map(e => e.category))).filter(Boolean);
    const filtered = exhibitors.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.boothNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = selectedSector === 'all' || e.category === selectedSector;
      return matchSearch && matchSector;
    });

    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeading
            title="Exhibitor Pavilion Directory"
            subtitle="Discover participating companies, cutting-edge booths and exhibition sectors"
            icon={<Building2 className="h-5 w-5 text-teal-400" />}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search exhibitors, booths..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {sectors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSector('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${selectedSector === 'all' ? 'border-teal-400 bg-teal-950/80 text-teal-300' : 'border-white/10 bg-black/30 text-gray-400'}`}
            >
              All Sectors ({exhibitors.length})
            </button>
            {sectors.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSector(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${selectedSector === s ? 'border-teal-400 bg-teal-950/80 text-teal-300' : 'border-white/10 bg-black/30 text-gray-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ex => (
            <div
              key={ex.id}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 space-y-3 transition hover:border-teal-500/40 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white">{ex.name}</h4>
                  <span className="text-[11px] font-medium text-teal-300">{ex.category}</span>
                </div>
                {ex.boothNumber && (
                  <span className="rounded-lg border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-[11px] font-mono font-bold text-teal-200">
                    Booth {ex.boothNumber}
                  </span>
                )}
              </div>

              {ex.hallSector && (
                <div className="text-[11px] text-gray-400">
                  📍 {ex.hallSector}
                </div>
              )}

              <p className="text-xs text-gray-300 leading-relaxed">
                {ex.description}
              </p>

              {ex.specHighlights && ex.specHighlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {ex.specHighlights.map((tag, idx) => (
                    <span key={idx} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {ex.websiteUrl && (
                <div className="pt-2 border-t border-white/5">
                  <a
                    href={ex.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 hover:text-white"
                  >
                    Visit Exhibitor Website <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };


  // Event Floor Plan Visualizer
  const EventFloorPlanSection = () => {
    const venue = eventData?.venue;
    return (
      <section className="space-y-6">
        <SectionHeading
          title="Interactive Floor Plan & Pavilion Map"
          subtitle={`${venue?.venueName || 'Exhibition Hall'} • Complete sector layout and navigation`}
          icon={<Compass className="h-5 w-5 text-teal-400" />}
        />

        <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 sm:p-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 p-4">
              <div className="text-xs text-teal-300 font-bold">Sector A</div>
              <div className="text-sm font-semibold text-white mt-1">Main Keynote Arena</div>
              <div className="text-[11px] text-gray-400 mt-1">Capacity: 2,500 delegates</div>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4">
              <div className="text-xs text-blue-300 font-bold">Sector B</div>
              <div className="text-sm font-semibold text-white mt-1">Innovation & Robotics</div>
              <div className="text-[11px] text-gray-400 mt-1">45+ Hardware Pavilions</div>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4">
              <div className="text-xs text-cyan-300 font-bold">Sector C</div>
              <div className="text-sm font-semibold text-white mt-1">AI & Software Hub</div>
              <div className="text-[11px] text-gray-400 mt-1">Live Demo Arenas</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4">
              <div className="text-xs text-amber-300 font-bold">Sector D</div>
              <div className="text-sm font-semibold text-white mt-1">VIP & Networking Lounge</div>
              <div className="text-[11px] text-gray-400 mt-1">Private Meeting Suites</div>
            </div>
          </div>

          <div className="relative aspect-[16/9] w-full rounded-2xl border border-white/10 bg-black/60 flex flex-col items-center justify-center p-6 text-center">
            <Compass className="h-12 w-12 text-teal-400/40 mb-2" />
            <div className="text-base font-bold text-white">Interactive Exhibition Hall Visualizer</div>
            <p className="text-xs text-gray-400 max-w-md mt-1">
              Floor plan sectors, booth zones and transit doors mapped across {venue?.venueName || 'the Convention Center'}.
            </p>
            {venue?.floorPlanUrl && (
              <a
                href={venue.floorPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500"
              >
                <Download className="h-4 w-4" /> Download PDF Floor Plan
              </a>
            )}
          </div>
        </div>
      </section>
    );
  };


  // Event Awards & Nominees Section
  const EventAwardsSection = () => {
    const categories = eventData?.awardCategories || [];
    if (categories.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Official Award Categories & Shortlist"
          subtitle="Honoring extraordinary craft, engineering and brave innovation across global industry standards"
          icon={<Trophy className="h-5 w-5 text-amber-400" />}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-black to-black p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-amber-500/20 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
                </div>
                {cat.sponsorName && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-950/60 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                    Presented by {cat.sponsorName}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/80">Nominees & Finalists</div>
                {cat.nominees && cat.nominees.length > 0 ? (
                  cat.nominees.map(nom => (
                    <div
                      key={nom.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${nom.isWinner ? 'border-amber-400/60 bg-amber-950/50 shadow' : 'border-white/5 bg-white/[0.02]'}`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{nom.title}</div>
                        <div className="text-xs text-gray-400">{nom.subtitle}</div>
                      </div>
                      {nom.isWinner && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase text-black shadow">
                          <Trophy className="h-3 w-3 fill-black" /> Winner
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">Nominees to be announced shortly by the jury.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };


  // Event Wedding Story Milestones
  const EventWeddingStorySection = () => {
    const story = eventData?.weddingStory;
    const milestones = story?.storyMilestones || [];
    if (milestones.length === 0 && !story?.coupleNames) return null;

    return (
      <section className="space-y-8">
        <SectionHeading
          title="Our Journey & Love Story"
          subtitle={`${story?.partnerOne || 'Sophia'} & ${story?.partnerTwo || 'Alexander'} • Moments that brought us together`}
          icon={<Heart className="h-5 w-5 text-pink-400" />}
        />

        <div className="relative border-l-2 border-pink-500/30 ml-4 sm:ml-8 space-y-8 pl-6 sm:pl-8">
          {milestones.map((m, idx) => (
            <div key={m.id || idx} className="relative group">
              <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-4 w-4 rounded-full border-2 border-pink-500 bg-black group-hover:bg-pink-500 transition" />
              <div className="rounded-2xl border border-pink-500/20 bg-white/[0.02] p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-serif font-bold text-white">{m.title}</h4>
                  {m.date && (
                    <span className="text-xs font-mono text-pink-300">{m.date}</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-serif">
                  {m.text}
                </p>
                {m.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 max-h-64">
                    <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };


  // Event Wedding RSVP Interactive Form Card
  const EventWeddingRSVPSection = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [attending, setAttending] = useState<'attending' | 'declined'>('attending');
    const [meal, setMeal] = useState('Vegetarian');
    const [plusOnes, setPlusOnes] = useState(0);
    const [songRequest, setSongRequest] = useState('');
    const [dietary, setDietary] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !email) return;
      setSubmitted(true);
    };

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Kindly Respond — RSVP"
          subtitle="Please confirm your attendance so we may make seamless arrangements for your presence"
          icon={<Heart className="h-5 w-5 text-pink-400" />}
        />

        <div className="max-w-2xl mx-auto rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#180a14] to-black p-6 sm:p-10 shadow-2xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Thank You, {name}!</h3>
              <p className="text-xs text-pink-200/80 max-w-md mx-auto">
                Your RSVP ({attending === 'attending' ? 'Attending with joy' : 'Respectfully declining'}) has been recorded. We deeply appreciate your response.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 rounded-xl border border-pink-400/30 px-4 py-2 text-xs text-pink-300 hover:bg-pink-900/30"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Sophia Crawford"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sophia@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Will you attend?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending('attending')}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition ${attending === 'attending' ? 'border-pink-500 bg-pink-950/80 text-white' : 'border-white/10 bg-black/40 text-gray-400'}`}
                  >
                    Joyfully Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending('declined')}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition ${attending === 'declined' ? 'border-pink-500 bg-pink-950/80 text-white' : 'border-white/10 bg-black/40 text-gray-400'}`}
                  >
                    Regretfully Decline
                  </button>
                </div>
              </div>

              {attending === 'attending' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Meal Preference</label>
                      <select
                        value={meal}
                        onChange={e => setMeal(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                      >
                        <option value="Vegetarian">Vegetarian Delight</option>
                        <option value="Non-Vegetarian">Non-Vegetarian Gourmet</option>
                        <option value="Vegan">Vegan Organic</option>
                        <option value="Jain">Jain Pure Vegetarian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Plus-One Guests</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={plusOnes}
                        onChange={e => setPlusOnes(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Dietary Restrictions or Notes</label>
                    <input
                      type="text"
                      value={dietary}
                      onChange={e => setDietary(e.target.value)}
                      placeholder="Nut allergies, gluten-free, etc."
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Song Request for the Dance Floor</label>
                    <input
                      type="text"
                      value={songRequest}
                      onChange={e => setSongRequest(e.target.value)}
                      placeholder="Your favorite celebration song"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition hover:brightness-110 active:scale-95"
              >
                Confirm RSVP
              </button>
            </form>
          )}
        </div>
      </section>
    );
  };


  // Launch Bento Specs Section (Apple Bento parity)
  const EventBentoSpecsSection = () => {
    const launch = eventData?.productLaunch;
    const highlights = launch?.bentoHighlights || [];
    const specs = launch?.techSpecs || [];

    if (highlights.length === 0 && specs.length === 0) return null;

    return (
      <section className="space-y-8">
        <SectionHeading
          title={launch?.productName ? `${launch.productName} Architecture & Innovation` : 'Engineered Breakthroughs'}
          subtitle="Explore the precision craftsmanship, custom silicon and performance metrics"
          icon={<Zap className="h-5 w-5 text-blue-400" />}
        />

        {highlights.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(h => (
              <div
                key={h.id}
                className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black p-6 space-y-3 transition hover:border-blue-500/40 ${h.colSpan === 2 ? 'sm:col-span-2' : ''}`}
              >
                {h.metric && (
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white">
                    {h.metric}
                  </div>
                )}
                <h4 className="text-lg font-bold text-white">{h.title}</h4>
                {h.subtitle && <p className="text-xs font-semibold text-cyan-400">{h.subtitle}</p>}
                <p className="text-xs text-gray-300 leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        )}

        {specs.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Technical Specifications</h3>
            <div className="space-y-6">
              {specs.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400">{group.group}</h4>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    {group.items.map((it, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between border-b border-white/5 py-2">
                        <span className="text-gray-400">{it.label}</span>
                        <span className="font-semibold text-white text-right">{it.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  // Event Venue & Travel Accommodations Section
  const EventVenueSection = () => {
    const venue = eventData?.venue;
    const hotelBlocks = eventData?.weddingStory?.hotelBlocks || [];
    if (!venue?.venueName && !venue?.address) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Venue, Transit & Accommodations"
          subtitle={`${venue.venueName} • Transit directions and guest hotel bookings`}
          icon={<MapPin className="h-5 w-5 text-cyan-400" />}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
            <h4 className="text-base font-bold text-white">Location & Address</h4>
            <div className="space-y-2 text-xs text-gray-300">
              <p className="font-semibold text-white">{venue.venueName}</p>
              <p className="text-gray-400">{venue.address}</p>
              <p className="text-gray-400">{venue.city}, {venue.country}</p>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              {venue.metroTransit && (
                <p><strong className="text-white">🚆 Metro Transit: </strong><span className="text-gray-400">{venue.metroTransit}</span></p>
              )}
              {venue.parkingInfo && (
                <p><strong className="text-white">🅿️ Parking: </strong><span className="text-gray-400">{venue.parkingInfo}</span></p>
              )}
              {venue.airportInfo && (
                <p><strong className="text-white">✈️ Airport Proximity: </strong><span className="text-gray-400">{venue.airportInfo}</span></p>
              )}
            </div>
          </div>

          {hotelBlocks.length > 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
              <h4 className="text-base font-bold text-white">Discounted Hotel Room Blocks</h4>
              <div className="space-y-3">
                {hotelBlocks.map(block => (
                  <div key={block.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
                    <div className="font-bold text-white">{block.hotelName}</div>
                    <div className="text-gray-400">{block.address} • {block.distanceToVenue}</div>
                    {block.bookingCode && (
                      <div className="text-[11px] font-mono text-cyan-400">Booking Code: {block.bookingCode}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 flex flex-col justify-center items-center text-center">
              <Compass className="h-8 w-8 text-cyan-400/40 mb-2" />
              <div className="text-sm font-bold text-white">Nearby Accommodations</div>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Preferred partner hotels with negotiated attendee rates will be sent directly with your pass confirmation.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  };


  // Event FAQ Section
  const EventFAQSection = () => {
    const faqs = eventData?.faqs || [];
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    if (faqs.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Essential details regarding badge collection, ticketing, venue policies and accessibility"
          icon={<Info className="h-5 w-5 text-blue-400" />}
        />

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.id || idx}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-white"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-400' : 'text-gray-500'}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-white/5 px-4 pb-5 pt-2 sm:px-5">
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };


  // Event Sponsors & Brand Partners Section
  const EventSponsorsSection = () => {
    const sponsors = eventData?.sponsors || [];
    if (sponsors.length === 0) return null;

    const titleSponsors = sponsors.filter(s => s.tier === 'title' || s.tier === 'diamond');
    const standardSponsors = sponsors.filter(s => s.tier !== 'title' && s.tier !== 'diamond');

    return (
      <section className="space-y-6 border-t border-white/10 pt-8">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            Ecosystem Partners & Global Sponsors
          </div>
        </div>

        {titleSponsors.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {titleSponsors.map(sp => (
              <div key={sp.id} className="rounded-2xl border border-blue-500/30 bg-blue-950/20 px-6 py-4 text-center">
                <span className="text-sm font-bold text-white">{sp.name}</span>
                <div className="text-[9px] font-mono uppercase text-blue-400">Title Partner</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          {standardSponsors.map(sp => (
            <div key={sp.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-gray-300">
              {sp.name}
            </div>
          ))}
        </div>
      </section>
    );
  };


  // Event Gallery & Media Highlights Section
  const EventGallerySection = () => {
    const gallery = eventData?.gallery || [];
    if (gallery.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Moments & Highlights Gallery"
          subtitle="Visual archive from recent editions, keynote stages and festival sets"
          icon={<ImageIcon className="h-5 w-5 text-pink-400" />}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map(media => (
            <div
              key={media.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 aspect-video"
            >
              <img
                src={media.url || media.thumbnailUrl}
                alt={media.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <div className="text-xs font-bold text-white">{media.title}</div>
                  {media.caption && <p className="text-[10px] text-gray-300">{media.caption}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };


  // Event Contact Desk Section
  const EventContactSection = () => {
    const prof = eventData?.profile;
    return (
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-10 space-y-4">
        <SectionHeading
          title="Organizer Desk & Inquiries"
          subtitle={`${prof?.organizerName || 'Organizing Secretariat'} • ${prof?.city}`}
          icon={<Mail className="h-5 w-5 text-blue-400" />}
        />

        <div className="grid gap-4 sm:grid-cols-3 text-xs text-gray-300 pt-2">
          <div>
            <strong className="text-white">Secretariat Email:</strong>
            <p className="mt-1 text-gray-400">{prof?.organizerEmail}</p>
          </div>
          <div>
            <strong className="text-white">Help Desk Phone:</strong>
            <p className="mt-1 text-gray-400">{prof?.organizerPhone || '+91 80 4000 0000'}</p>
          </div>
          <div>
            <strong className="text-white">Venue Headquarters:</strong>
            <p className="mt-1 text-gray-400">{prof?.venueName}, {prof?.city}</p>
          </div>
        </div>
      </section>
    );
  };


  function renderVideoShowcase() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'Rituals', 'Music', 'Sports'].map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveVideoFilter(category)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                activeVideoFilter === category
                  ? accentStyles.primaryBtn
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {category === 'all' ? 'All Videos' : category}
            </button>
          ))}
        </div>

        {selectedVideo && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="relative aspect-video">
              <iframe
                src={selectedVideo.embedUrl}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-white">{selectedVideo.title}</h3>
              <p className="mt-1 text-[10px] text-gray-400">{selectedVideo.category}</p>
            </div>
          </div>
        )}

        {filteredVideos.length > 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {filteredVideos.map(video => (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideo(video)}
                className={`rounded-xl border p-2 text-left transition ${
                  selectedVideo?.id === video.id
                    ? 'border-cyan-400/50 bg-cyan-400/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="relative mb-2 aspect-video overflow-hidden rounded-lg bg-black">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                  <Play className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                </div>
                <p className="line-clamp-2 text-[10px] font-semibold text-white">{video.title}</p>
                <p className="mt-1 text-[9px] text-gray-500">{video.category}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentSportsSections = currentPageSections
    .map((type: SportsSectionType) => {
      const configured = sportsData?.sections?.find(
        (section: SportsSectionDefinition) => section.type === type && section.enabled
      );
      return { type, configured };
    })
    .filter((item: { type: SportsSectionType; configured?: SportsSectionDefinition }) => {
      if (!sportsData) return false;
      const configuredTypes = sportsData.sections?.filter((section: SportsSectionDefinition) => section.enabled).map((section: SportsSectionDefinition) => section.type);
      return !configuredTypes?.length || configuredTypes.includes(item.type);
    });

  const currentGenericSections = pageSections.filter(section =>
    genericSectionIds.includes(section.id.replace(/^sec_/, '')) ||
    genericSectionIds.includes(section.id)
  );

  // ==========================================
  // DIGIVERSE SOCIAL & NGO ENGINE COMPONENTS
  // ==========================================

  const GrassrootsHero = () => {
    const prof = ngoData?.profile;
    const branding = ngoData?.branding;
    const cover = branding?.coverImageUrl || heroImage;

    return (
      <section className="relative overflow-hidden rounded-3xl border border-amber-600/30 bg-gradient-to-br from-[#1c0f0a] via-[#120a07] to-black p-6 sm:p-12 shadow-2xl">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay" />
        )}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <HandHeart className="h-3.5 w-3.5 text-amber-400" /> Dignity Not Charity • Grassroots Impact
            </span>
            {prof?.registrationNumber && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> {prof.registrationNumber}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl font-['Space_Grotesk']">
            {prof?.name || website.heroHeadline}
          </h1>
          <p className="text-base font-medium text-amber-200/90 sm:text-lg">
            {prof?.tagline}
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-gray-300 line-clamp-3">
            {prof?.aboutDescription || website.heroDescription}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/donate')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-950/50 hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer"
            >
              <Heart className="h-4 w-4 fill-white" /> Contribute with Dignity
            </button>
            <button
              type="button"
              onClick={() => goToPage('/collection-centers')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-amber-400" /> Find Dropping Hubs
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Tax Benefit</p>
              <p className="text-emerald-400 font-semibold mt-0.5">{prof?.taxExemptionNotice || '80G Tax Exemption'}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Operational Scope</p>
              <p className="text-amber-300 font-semibold mt-0.5">{prof?.operationalRegions?.join(', ') || 'Rural Community Reach'}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Dropping Hubs</p>
              <p className="text-white font-semibold mt-0.5">{ngoData?.collectionCenters?.length || 0} Verified Locations</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const FoundationHero = () => {
    const prof = ngoData?.profile;
    const branding = ngoData?.branding;
    const cover = branding?.coverImageUrl || heroImage;

    return (
      <section className="relative overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#0a1120] via-[#070b14] to-black p-6 sm:p-14 shadow-2xl">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        )}
        <div className="relative max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-slate-900/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Building2 className="h-3.5 w-3.5 text-amber-400" /> Civic Leadership & Democratic Renewal
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-950/60 px-2.5 py-0.5 text-[10px] text-blue-300">
              <Award className="h-3 w-3" /> Global Fellowship Network
            </span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl font-serif">
            {prof?.name || website.heroHeadline}
          </h1>

          <p className="text-base font-light italic text-amber-100/90 sm:text-xl font-serif border-l-2 border-amber-500/50 pl-4">
            "{prof?.tagline || 'Empowering the next generation of civic pioneers.'}"
          </p>

          <p className="text-xs sm:text-sm leading-relaxed text-gray-300">
            {prof?.aboutDescription || website.heroDescription}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/partner')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-3.5 text-xs font-bold text-amber-200 border border-amber-400/30 shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all cursor-pointer"
            >
              Partner With Us <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage('/fellows')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Explore Fellowships <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">Governing Body</p>
              <p className="text-white font-medium mt-0.5">{ngoData?.leadership?.length || 0} Board Trustees</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">Active Fellows</p>
              <p className="text-amber-300 font-medium mt-0.5">{ngoData?.volunteering?.opportunities?.length || 0} Fellowships</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">Financial Transparency</p>
              <p className="text-emerald-400 font-medium mt-0.5">{ngoData?.reports?.length || 0} Public Disclosures</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const CharityWaterHero = () => {
    const prof = ngoData?.profile;
    const branding = ngoData?.branding;
    const cover = branding?.coverImageUrl || heroImage;

    return (
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#031522] via-[#051c2c] to-black p-6 sm:p-14 shadow-2xl">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/80 px-4 py-1.5 text-xs font-bold text-cyan-200 shadow-md">
            <Droplets className="h-4 w-4 text-cyan-400" />
            <span>100% Direct Impact Model • Zero Public Overhead</span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-white sm:text-6xl tracking-tight">
            {prof?.name || website.heroHeadline}
          </h1>

          <p className="text-base font-semibold text-cyan-200 sm:text-2xl">
            {prof?.tagline || 'Ending the clean water crisis in our lifetime.'}
          </p>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-4 text-xs sm:text-sm text-cyan-100/90 leading-relaxed backdrop-blur-sm">
            <span className="font-bold text-white block mb-1">Our Radical Transparency Guarantee:</span>
            {ngoData?.donationModel?.modelProofNote || '100% of your public donation directly funds water and sanitation projects. Private benefactors cover all operational and administrative costs.'}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage('/donate')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-7 py-4 text-sm font-black text-black hover:from-cyan-400 hover:to-sky-500 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              Give Clean Water <ArrowRight className="h-4 w-4 text-black" />
            </button>
            <button
              type="button"
              onClick={() => goToPage('/transparency')}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-900/20 px-6 py-4 text-xs font-bold text-cyan-200 hover:bg-cyan-900/40 transition-all cursor-pointer"
            >
              Proof & Audits <ShieldCheck className="h-4 w-4 text-cyan-300" />
            </button>
          </div>

          {ngoData?.impactStats && ngoData.impactStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {ngoData.impactStats.slice(0, 3).map(stat => (
                <div key={stat.id} className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
                  <p className="text-2xl font-black text-cyan-300">{stat.value}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const NGOImpactStatsSection = () => {
    const stats = ngoData?.impactStats || [];
    if (stats.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title={ngoArchetype === 'cause_charity' ? 'Verified Field Impact at Scale' : ngoArchetype === 'institutional_foundation' ? 'Global Leadership Footprint' : 'Ground-Level Impact in Numbers'}
          subtitle="Real-time verified metrics from our field operations and institutional interventions"
          icon={<Target className="h-5 w-5 text-amber-400" />}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs font-bold text-amber-300/90">{stat.label}</p>
                {stat.description && (
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">{stat.description}</p>
                )}
              </div>
              {stat.isVerified && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-emerald-400">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> Verified Metric
                  </span>
                  {stat.verificationSource && (
                    <span className="text-gray-400 truncate max-w-[120px]" title={stat.verificationSource}>
                      {stat.verificationSource}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGOProgramsSection = () => {
    const programs = ngoData?.programs || [];
    if (programs.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title={ngoArchetype === 'institutional_foundation' ? 'Core Initiatives & Civic Programs' : ngoArchetype === 'cause_charity' ? 'Water, Sanitation & Hygiene Programs' : 'Programs Built with Dignity'}
          subtitle="Systemic community programs managed in direct partnership with local stakeholders"
          icon={<HeartHandshake className="h-5 w-5 text-emerald-400" />}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map(prog => (
            <article key={prog.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase text-emerald-300">
                    {prog.category}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">
                    {prog.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{prog.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{prog.shortSummary}</p>
                
                <div className="space-y-2 pt-2 text-xs">
                  <div className="text-gray-400">
                    <strong className="text-gray-200">Beneficiaries:</strong> {prog.beneficiaryGroup}
                  </div>
                  {prog.locations && prog.locations.length > 0 && (
                    <div className="text-gray-400">
                      <strong className="text-gray-200">Regions:</strong> {prog.locations.join(', ')}
                    </div>
                  )}
                </div>

                {prog.outcomes && prog.outcomes.length > 0 && (
                  <div className="pt-3 border-t border-white/5 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Key Outcomes:</p>
                    {prog.outcomes.map((outcome, idx) => (
                      <p key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{outcome}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const NGOCampaignsSection = () => {
    const campaigns = ngoData?.campaigns || [];
    if (campaigns.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title={ngoArchetype === 'cause_charity' ? 'Active Community Water Campaigns' : 'Urgent Relief Drives & Appeals'}
          subtitle="Targeted fundraising drives addressing urgent community needs and field rehabilitation"
          icon={<Flame className="h-5 w-5 text-orange-400" />}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map(camp => {
            const percent = camp.targetGoal && camp.achievedAmount
              ? Math.min(100, Math.round((camp.achievedAmount / camp.targetGoal) * 100))
              : 0;
            return (
              <div key={camp.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-orange-500/30 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${camp.status === 'urgent' ? 'bg-red-950/80 border border-red-500/40 text-red-300' : 'bg-orange-950/80 border border-orange-500/40 text-orange-300'}`}>
                      {camp.status === 'urgent' ? 'Urgent Relief Appeal' : 'Active Drive'}
                    </span>
                    {camp.currency && (
                      <span className="text-[10px] text-gray-400 font-bold">{camp.currency}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{camp.title}</h3>
                  {camp.tagline && <p className="text-xs font-semibold text-amber-300">{camp.tagline}</p>}
                  <p className="text-xs text-gray-300 leading-relaxed">{camp.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                  {camp.targetGoal && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{camp.currency} {camp.achievedAmount?.toLocaleString()} raised</span>
                        <span className="text-gray-400 font-medium">{percent}% of {camp.currency} {camp.targetGoal?.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage('/donate')}
                    className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer"
                  >
                    {camp.donationCtaLabel || 'Support This Drive'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const NGOCollectionCentersSection = () => {
    const centers = ngoData?.collectionCenters || [];
    const [selectedCity, setSelectedCity] = useState<string>('all');
    if (centers.length === 0) return null;

    const cities = Array.from(new Set(centers.map(c => c.city)));
    const filteredCenters = selectedCity === 'all'
      ? centers
      : centers.filter(c => c.city.toLowerCase() === selectedCity.toLowerCase());

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Material Dropping Hubs & Processing Centers"
          subtitle="Drop off urban surplus, clothing, books, and disaster essentials at our verified city hubs"
          icon={<MapPin className="h-5 w-5 text-amber-400" />}
        />

        {cities.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCity('all')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${selectedCity === 'all' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
            >
              All Hubs ({centers.length})
            </button>
            {cities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${selectedCity === city ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map(center => (
            <div key={center.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{center.centerName}</h4>
                  <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {center.city}
                  </span>
                </div>
                <p className="text-xs text-gray-300 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{center.address}</span>
                </p>
                <div className="space-y-1 text-xs text-gray-400 pt-1">
                  <p className="flex items-center gap-1.5">
                    <UserRound className="h-3 w-3 text-gray-400" />
                    <span>Contact: {center.contactPerson} ({center.contactPhone})</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>Timings: {center.timings}</span>
                  </p>
                </div>
              </div>

              {center.acceptedItems && center.acceptedItems.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Accepted Material:</p>
                  <div className="flex flex-wrap gap-1">
                    {center.acceptedItems.map((item, idx) => (
                      <span key={idx} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGODonationSection = () => {
    const don = ngoData?.donationModel;
    const prof = ngoData?.profile;
    const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
    const [pledgeSubmitted, setPledgeSubmitted] = useState(false);
    const [pledgeForm, setPledgeForm] = useState({
      name: '',
      email: '',
      phone: '',
      pan: '',
      amount: '',
      frequency: 'one_time' as 'one_time' | 'monthly',
      message: ''
    });

    if (!don) return null;

    // Pledges are retired: DigiVerse no longer collects donor details, so nothing here opens a form or claims that a pledge was recorded.

    const handlePledgeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const projectId = (requirements as any).id || (website as any).id || (requirements as any).projectId;
      if (projectId) {
        api.submitDonationEnquiry(projectId, {
          donorName: pledgeForm.name,
          donorEmail: pledgeForm.email,
          donorPhone: pledgeForm.phone,
          amount: Number(pledgeForm.amount) || 0,
          currency: don.donationTiers?.[0]?.currency || 'INR',
          panNumber: pledgeForm.pan,
          frequency: pledgeForm.frequency,
          message: pledgeForm.message
        }).catch(err => console.warn('Pledge submission notice:', err));
      }
      setPledgeSubmitted(true);
    };

    return (
      <section className="space-y-6">
        <SectionHeading
          title={don.headline || 'Contribute with Dignity'}
          subtitle={don.subheadline || '100% of public giving fuels verified community empowerment and relief'}
          icon={<HandHeart className="h-5 w-5 text-amber-400" />}
        />

        {don.modelProofNote && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-xs text-cyan-200">
            <strong className="text-white block mb-0.5">100% Donation Model Guarantee:</strong>
            {don.modelProofNote}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">How contributions help</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {don.donationTiers?.map(tier => {
                const isSelected = selectedTier === tier.amount;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.amount)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-amber-400 bg-amber-500/10 shadow-lg' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                  >
                    <div className="space-y-2">
                      {tier.isPopular && (
                        <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300 inline-block">
                          Most Impactful
                        </span>
                      )}
                      <p className="text-2xl font-black text-white">{tier.currency} {tier.amount.toLocaleString()}</p>
                      <p className="text-xs font-bold text-amber-300">{tier.label}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{tier.impactEquivalence}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">Direct Institutional Transfer</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Wire funds directly to our audited institutional bank account or transfer via verified UPI ID:
            </p>

            {don.directTransferDetails && (
              <div className="space-y-2 rounded-xl bg-black/40 border border-white/5 p-4 text-xs font-mono">
                {don.directTransferDetails.bankName && (
                  <p><span className="text-gray-400">Bank:</span> <strong className="text-white">{don.directTransferDetails.bankName}</strong></p>
                )}
                {don.directTransferDetails.accountName && (
                  <p><span className="text-gray-400">A/C Name:</span> <span className="text-white">{don.directTransferDetails.accountName}</span></p>
                )}
                {don.directTransferDetails.accountNumber && (
                  <p><span className="text-gray-400">A/C No:</span> <strong className="text-amber-300">{don.directTransferDetails.accountNumber}</strong></p>
                )}
                {don.directTransferDetails.ifscCode && (
                  <p><span className="text-gray-400">IFSC:</span> <strong className="text-white">{don.directTransferDetails.ifscCode}</strong></p>
                )}
                {don.directTransferDetails.upiId && (
                  <p><span className="text-gray-400">UPI ID:</span> <strong className="text-emerald-400">{don.directTransferDetails.upiId}</strong></p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{prof?.taxExemptionNotice || '80G Tax Exemption Eligible'}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Receipt with Section 80G tax certificate issued within 24 hours of confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Pledge Modal */}
        {pledgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#0d141e] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-amber-400" /> Donation Pledge & 80G Receipt
                </h3>
                <button
                  type="button"
                  onClick={() => setPledgeModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {pledgeSubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Thank You for Your Generosity!</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Your pledge of <strong>{don.donationTiers?.[0]?.currency || 'INR'} {pledgeForm.amount}</strong> has been recorded. Our team will verify the transfer details and issue your 80G tax receipt to <strong>{pledgeForm.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPledgeModalOpen(false)}
                    className="mt-4 rounded-xl bg-amber-600 px-6 py-2 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePledgeSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1 font-semibold">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Mahindra"
                      value={pledgeForm.name}
                      onChange={e => setPledgeForm({ ...pledgeForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={pledgeForm.email}
                        onChange={e => setPledgeForm({ ...pledgeForm, email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={pledgeForm.phone}
                        onChange={e => setPledgeForm({ ...pledgeForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Amount ({don.donationTiers?.[0]?.currency || 'INR'}) *</label>
                      <input
                        type="number"
                        required
                        value={pledgeForm.amount}
                        onChange={e => setPledgeForm({ ...pledgeForm, amount: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">PAN Card (For 80G)</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={pledgeForm.pan}
                        onChange={e => setPledgeForm({ ...pledgeForm, pan: e.target.value.toUpperCase() })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1 font-semibold">Note / Message (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Specific program or relief drive to allocate..."
                      value={pledgeForm.message}
                      onChange={e => setPledgeForm({ ...pledgeForm, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-xs font-bold text-white hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer mt-2"
                  >
                    Confirm Pledge & Request Receipt
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    );
  };

  const NGOVolunteerSection = () => {
    const vol = ngoData?.volunteering;
    const opps = vol?.opportunities || [];
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [appSubmitted, setAppSubmitted] = useState(false);
    const [appForm, setAppForm] = useState({
      name: '',
      email: '',
      phone: '',
      city: '',
      availability: '4-6 hours/week',
      skills: ''
    });

    if (!vol?.enabled && opps.length === 0) return null;

    const handleOpenApply = (roleTitle: string) => {
      setSelectedRole(roleTitle);
      setAppSubmitted(false);
      setApplyModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const projectId = (requirements as any).id || (website as any).id || (requirements as any).projectId;
      if (projectId) {
        api.submitVolunteerApplication(projectId, {
          applicantName: appForm.name,
          applicantEmail: appForm.email,
          applicantPhone: appForm.phone,
          city: appForm.city,
          roleInterest: selectedRole,
          availability: appForm.availability,
          skillsSummary: appForm.skills
        }).catch(err => console.warn('Volunteer submission notice:', err));
      }
      setAppSubmitted(true);
    };

    return (
      <section className="space-y-6">
        <SectionHeading
          title={vol?.headline || (ngoArchetype === 'institutional_foundation' ? 'Leadership Fellowships & Residencies' : 'Volunteer Mobilization & Fellowships')}
          subtitle={vol?.description || 'Dedicate your skills, time, and heart to ground-level community transformation'}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opps.map(opp => (
            <div key={opp.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-950/80 border border-blue-500/30 px-3 py-1 text-[10px] font-bold uppercase text-blue-300">
                    {opp.department}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">{opp.location}</span>
                </div>
                <h3 className="text-base font-bold text-white">{opp.roleName}</h3>
                <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Commitment: {opp.commitment}
                </div>

                {opp.requirements && opp.requirements.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Desired Skills:</p>
                    {opp.requirements.map((req, idx) => (
                      <p key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
                        <span>{req}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenApply(opp.roleName)}
                className="w-full rounded-xl bg-blue-600/80 hover:bg-blue-600 py-2.5 text-xs font-bold text-white transition-all cursor-pointer mt-2"
              >
                Apply for Fellowship
              </button>
            </div>
          ))}
        </div>

        {/* Application Modal */}
        {applyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-blue-500/30 bg-[#0d141e] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Volunteer & Fellowship Application</h3>
                  <p className="text-xs text-blue-300 font-semibold mt-0.5">{selectedRole}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {appSubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Application Successfully Received!</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Thank you, <strong>{appForm.name}</strong>. Our fellowship coordinator will review your profile for the <strong>{selectedRole}</strong> position and reach out to <strong>{appForm.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Devi"
                      value={appForm.name}
                      onChange={e => setAppForm({ ...appForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={appForm.email}
                        onChange={e => setAppForm({ ...appForm, email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 00000"
                        value={appForm.phone}
                        onChange={e => setAppForm({ ...appForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Current City *</label>
                      <input
                        type="text"
                        required
                        placeholder="New Delhi, Mumbai, etc."
                        value={appForm.city}
                        onChange={e => setAppForm({ ...appForm, city: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 block mb-1 font-semibold">Weekly Availability</label>
                      <input
                        type="text"
                        placeholder="4-6 hours/week"
                        value={appForm.availability}
                        onChange={e => setAppForm({ ...appForm, availability: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1 font-semibold">Skills / Experience Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us briefly about your background and why you want to serve..."
                      value={appForm.skills}
                      onChange={e => setAppForm({ ...appForm, skills: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 transition-all cursor-pointer mt-2"
                  >
                    Submit Application
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    );
  };

  const NGOLeadershipSection = () => {
    const people = ngoData?.leadership || [];
    if (people.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title={ngoArchetype === 'institutional_foundation' ? 'Board of Trustees & Leadership' : 'Founders, Trustees & Advisory Council'}
          subtitle="Stewarding our mission with institutional integrity, strategic clarity, and ethical governance"
          icon={<Shield className="h-5 w-5 text-amber-400" />}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {people.map(person => (
            <div key={person.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-white/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-lg font-bold">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{person.name}</h4>
                  <p className="text-xs text-amber-300">{person.role}</p>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] uppercase font-bold text-gray-400 mt-1 inline-block">
                    {person.tier}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-4">{person.bio}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGOStoriesSection = () => {
    const stories = ngoData?.stories || [];
    if (stories.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Voices of Transformation & Field Stories"
          subtitle="Unfiltered ground realities, village breakthroughs, and human dignity in action"
          icon={<Quote className="h-5 w-5 text-amber-400" />}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {stories.map(story => (
            <div key={story.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-bold text-white">{story.beneficiaryName}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{story.location}</span>
              </div>
              <h4 className="text-base font-bold text-white">{story.title}</h4>
              <blockquote className="border-l-2 border-amber-500 pl-4 italic text-xs text-amber-200">
                "{story.quote}"
              </blockquote>
              <p className="text-xs text-gray-300 leading-relaxed">{story.excerpt || story.fullStory}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGOReportsSection = () => {
    const reports = ngoData?.reports || [];
    if (reports.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Financial Disclosures & Audited Annual Reports"
          subtitle="Radical institutional transparency: download audited balance sheets, annual reports, and statutory filings"
          icon={<FileText className="h-5 w-5 text-emerald-400" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map(rep => (
            <div key={rep.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center justify-between gap-4 hover:border-emerald-500/30 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    FY {rep.financialYear}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">{rep.type.replace(/_/g, ' ')}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{rep.title}</h4>
                <p className="text-[10px] text-gray-400">Published {rep.publishDate} • {rep.fileSize || 'PDF Document'}</p>
              </div>
              <a
                href={rep.fileUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-xl bg-white/5 border border-white/10 p-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Download Report"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGOPartnersSection = () => {
    const partners = ngoData?.partners || [];
    if (partners.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Institutional Patrons & CSR Partners"
          subtitle="Collaborating with visionary foundations, corporate partners, and humanitarian networks"
          icon={<Building2 className="h-5 w-5 text-blue-400" />}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map(part => (
            <div key={part.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2 text-center hover:border-white/20 transition-all">
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-400">
                {part.tier.replace(/_/g, ' ')}
              </span>
              <h4 className="text-sm font-bold text-white">{part.name}</h4>
              {part.contributionSummary && (
                <p className="text-xs text-gray-400">{part.contributionSummary}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const NGOFAQSection = () => {
    const faqs = ngoData?.faqs || [];
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    if (faqs.length === 0) return null;

    return (
      <section className="space-y-6">
        <SectionHeading
          title="Frequently Asked Questions & Transparency"
          subtitle="Answers regarding our 100% model, material utilization, tax benefits, and governance"
          icon={<HelpCircle className="h-5 w-5 text-amber-400" />}
        />
        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={faq.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const NGOContactSection = () => {
    const prof = ngoData?.profile;
    return (
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-10 space-y-6">
        <SectionHeading
          title="Institutional Headquarters & Grievance Desk"
          subtitle={prof?.headquartersAddress || 'Registered Office & Secretarial Cell'}
          icon={<Mail className="h-5 w-5 text-amber-400" />}
        />
        <div className="grid gap-6 sm:grid-cols-3 text-xs text-gray-300 pt-2">
          <div>
            <strong className="text-white block mb-1">Official Email:</strong>
            <p className="text-gray-400">{prof?.contactEmail}</p>
          </div>
          <div>
            <strong className="text-white block mb-1">Primary Phone:</strong>
            <p className="text-gray-400">{prof?.contactPhone}</p>
          </div>
          <div>
            <strong className="text-white block mb-1">Legal Registration:</strong>
            <p className="text-emerald-400">{prof?.registrationNumber || 'Registered Society'}</p>
          </div>
        </div>
      </section>
    );
  };

  const renderGenericSection = (section: WebsiteSectionConfig) => {
    switch (section.type) {
      case 'hero':
        return (
          <section className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accentStyles.heroGlow} bg-[#101827] p-7 sm:p-12`}>
            {heroImage && (
              <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            )}
            <div className="relative max-w-3xl space-y-4">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${accentStyles.badge}`}>
                {categoryName(requirements.category || requirements.organizationType)}
              </span>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
                {website.heroHeadline}
              </h1>
              {website.heroDescription && <p className="text-sm leading-7 text-gray-300">{website.heroDescription}</p>}
              <button
                type="button"
                onClick={() => goToPage('/contact')}
                className={`rounded-xl border px-5 py-3 text-xs font-bold ${accentStyles.primaryBtn}`}
              >
                Contact Us <ArrowUpRight className="ml-1 inline h-4 w-4" />
              </button>
            </div>
          </section>
        );

      case 'about':
        return (
          <section>
            <SectionHeading title={section.title || 'About Us'} subtitle={section.subtitle} icon={<Book className="h-5 w-5" />} />
            {website.aboutContent ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-7 text-gray-300">
                {website.aboutContent}
              </div>
            ) : <EmptyState message="Organization description has not been provided." />}
          </section>
        );

      case 'events':
        return (
          <section>
            <SectionHeading title={section.title || website.eventsTitle} subtitle={section.subtitle} icon={<Calendar className="h-5 w-5" />} />
            {website.eventsList.length === 0 ? <EmptyState message="No events have been provided." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {website.eventsList.map(item => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <div className="mt-3 space-y-2 text-xs text-gray-400">
                      <p><Clock className="mr-1 inline h-3 w-3" />{item.date} · {item.time}</p>
                      <p><MapPin className="mr-1 inline h-3 w-3" />{item.venue}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case 'committee':
        return (
          <section>
            <SectionHeading title={section.title || website.committeeTitle} subtitle={section.subtitle} icon={<Users className="h-5 w-5" />} />
            {website.committeeList.length === 0 ? <EmptyState message="No team or committee members provided." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {website.committeeList.map(member => (
                  <div key={member.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{member.name}</h4>
                      <p className="text-[10px] text-gray-400">{member.role} {member.department ? `· ${member.department}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'gallery':
        return (
          <section>
            <SectionHeading title={section.title || website.galleryTitle} subtitle={section.subtitle} icon={<ImageIcon className="h-5 w-5" />} />
            {(website.galleryPhotos || []).length === 0 && (website.galleryList || []).length === 0 ? (
              <EmptyState message="No approved photos or gallery items available." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(website.galleryPhotos || []).map(photo => (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img src={photo.url} alt={photo.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                      <p className="text-[10px] font-medium text-white truncate">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'videos':
        return (
          <section>
            <SectionHeading title={section.title || 'Video Showcase'} subtitle={section.subtitle} icon={<Video className="h-5 w-5" />} />
            {renderVideoShowcase()}
          </section>
        );

      case 'announcements':
        return (
          <section>
            <SectionHeading title={section.title || 'Official Announcements'} subtitle={section.subtitle} icon={<Bell className="h-5 w-5" />} />
            <EmptyState message="No active announcements have been published." />
          </section>
        );

      case 'donations':
        return (
          <section>
            <SectionHeading title={section.title || 'Support Our Mission'} subtitle={section.subtitle} icon={<Heart className="h-5 w-5" />} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 space-y-3">
              <p className="text-xs text-gray-300">Contributions support organizational initiatives and public programs.</p>
              <button
                type="button"
                onClick={() => goToPage('/contact')}
                className={`rounded-xl border px-5 py-2.5 text-xs font-bold ${accentStyles.primaryBtn}`}
              >
                Inquire About Contributions
              </button>
            </div>
          </section>
        );

      case 'contact':
        return (
          <section>
            <SectionHeading title={section.title || 'Get in Touch'} subtitle={section.subtitle} icon={<Mail className="h-5 w-5" />} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 space-y-3 text-xs text-gray-300">
              {requirements.address && <p><MapPin className="mr-2 inline h-4 w-4 text-gray-400" />{requirements.address}</p>}
              {requirements.contactEmail && <p><Mail className="mr-2 inline h-4 w-4 text-gray-400" />{requirements.contactEmail}</p>}
              {requirements.contactPhone && <p><Phone className="mr-2 inline h-4 w-4 text-gray-400" />{requirements.contactPhone}</p>}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const renderPageContent = () => {
    if (isSports && sportsData) {
      if (activePage === '/') {
        return (
          <div className="space-y-10">
            {currentSportsSections.map(({ type, configured }, index) => (
              <React.Fragment key={`${type}-${index}`}>
                {configured?.title && type !== 'sports_hero' && (
                  <div className="sr-only">{configured.title}</div>
                )}
                {renderSportsSection(type)}
              </React.Fragment>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-10">
          {currentSportsSections.map(({ type }, index) => (
            <React.Fragment key={`${type}-${index}`}>
              {renderSportsSection(type)}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (isEvent && eventData) {
      const cat = eventCategory;
      if (cat === 'conference_seminar') {
        if (activePage === '/speakers') return <div className="space-y-10"><EventSpeakersSection /></div>;
        if (activePage === '/schedule') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/tickets') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/venue') return <div className="space-y-10"><EventVenueSection /></div>;
        if (activePage === '/sponsors') return <div className="space-y-10"><EventSponsorsSection /></div>;
        if (activePage === '/faq') return <div className="space-y-10"><EventFAQSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <ConferenceHero />
            <EventSpeakersSection />
            <EventAgendaSection />
            <EventTicketsSection />
            <EventSponsorsSection />
            <EventVenueSection />
            <EventFAQSection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'festival_concert') {
        if (activePage === '/lineup') return <div className="space-y-10"><EventSpeakersSection /></div>;
        if (activePage === '/stages') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/tickets') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/venue') return <div className="space-y-10"><EventVenueSection /></div>;
        if (activePage === '/gallery') return <div className="space-y-10"><EventGallerySection /></div>;
        if (activePage === '/partners') return <div className="space-y-10"><EventSponsorsSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <FestivalHero />
            <EventSpeakersSection />
            <EventAgendaSection />
            <EventTicketsSection />
            <EventGallerySection />
            <EventVenueSection />
            <EventSponsorsSection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'corporate_business') {
        if (activePage === '/agenda') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/speakers') return <div className="space-y-10"><EventSpeakersSection /></div>;
        if (activePage === '/networking') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/registration') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/partners') return <div className="space-y-10"><EventSponsorsSection /></div>;
        if (activePage === '/venue') return <div className="space-y-10"><EventVenueSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <CorporateHero />
            <EventAgendaSection />
            <EventSpeakersSection />
            <EventTicketsSection />
            <EventVenueSection />
            <EventSponsorsSection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'exhibition_trade') {
        if (activePage === '/exhibitors') return <div className="space-y-10"><EventExhibitorsSection /></div>;
        if (activePage === '/floorplan') return <div className="space-y-10"><EventFloorPlanSection /></div>;
        if (activePage === '/schedule') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/tickets') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/gallery') return <div className="space-y-10"><EventGallerySection /></div>;
        if (activePage === '/sponsors') return <div className="space-y-10"><EventSponsorsSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <ExhibitionHero />
            <EventExhibitorsSection />
            <EventFloorPlanSection />
            <EventAgendaSection />
            <EventTicketsSection />
            <EventGallerySection />
            <EventSponsorsSection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'wedding_private') {
        if (activePage === '/story') return <div className="space-y-10"><EventWeddingStorySection /></div>;
        if (activePage === '/schedule') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/rsvp') return <div className="space-y-10"><EventWeddingRSVPSection /></div>;
        if (activePage === '/travel') return <div className="space-y-10"><EventVenueSection /></div>;
        if (activePage === '/gallery') return <div className="space-y-10"><EventGallerySection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <WeddingHero />
            <EventWeddingStorySection />
            <EventAgendaSection />
            <EventWeddingRSVPSection />
            <EventVenueSection />
            <EventGallerySection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'award_ceremony') {
        if (activePage === '/categories') return <div className="space-y-10"><EventAwardsSection /></div>;
        if (activePage === '/nominees') return <div className="space-y-10"><EventAwardsSection /></div>;
        if (activePage === '/jury') return <div className="space-y-10"><EventSpeakersSection /></div>;
        if (activePage === '/ceremony') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/tickets') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/gallery') return <div className="space-y-10"><EventGallerySection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <AwardHero />
            <EventAwardsSection />
            <EventSpeakersSection />
            <EventTicketsSection />
            <EventAgendaSection />
            <EventGallerySection />
            <EventSponsorsSection />
            <EventContactSection />
          </div>
        );
      }
      if (cat === 'launch_reveal') {
        if (activePage === '/product') return <div className="space-y-10"><EventBentoSpecsSection /></div>;
        if (activePage === '/specs') return <div className="space-y-10"><EventBentoSpecsSection /></div>;
        if (activePage === '/schedule') return <div className="space-y-10"><EventAgendaSection /></div>;
        if (activePage === '/gallery') return <div className="space-y-10"><EventGallerySection /></div>;
        if (activePage === '/preorder') return <div className="space-y-10"><EventTicketsSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><EventContactSection /></div>;

        return (
          <div className="space-y-12">
            <LaunchHero />
            <EventBentoSpecsSection />
            <EventAgendaSection />
            <EventGallerySection />
            <EventFAQSection />
            <EventContactSection />
          </div>
        );
      }
    }

    if (isNGO && ngoData) {
      if (ngoArchetype === 'grassroots_ngo') {
        if (activePage === '/about') return <div className="space-y-10"><NGOStoriesSection /><NGOLeadershipSection /><NGOReportsSection /></div>;
        if (activePage === '/programs') return <div className="space-y-10"><NGOProgramsSection /></div>;
        if (activePage === '/campaigns') return <div className="space-y-10"><NGOCampaignsSection /></div>;
        if (activePage === '/collection-centers') return <div className="space-y-10"><NGOCollectionCentersSection /></div>;
        if (activePage === '/volunteers') return <div className="space-y-10"><NGOVolunteerSection /></div>;
        if (activePage === '/reports') return <div className="space-y-10"><NGOReportsSection /></div>;
        if (activePage === '/donate') return <div className="space-y-10"><NGODonationSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><NGOContactSection /></div>;

        return (
          <div className="space-y-12">
            <GrassrootsHero />
            <NGOImpactStatsSection />
            <NGOProgramsSection />
            <NGOCampaignsSection />
            <NGOCollectionCentersSection />
            <NGODonationSection />
            <NGOVolunteerSection />
            <NGOStoriesSection />
            <NGOReportsSection />
            <NGOPartnersSection />
            <NGOFAQSection />
            <NGOContactSection />
          </div>
        );
      }
      if (ngoArchetype === 'institutional_foundation') {
        if (activePage === '/about') return <div className="space-y-10"><NGOStoriesSection /><NGOLeadershipSection /></div>;
        if (activePage === '/initiatives') return <div className="space-y-10"><NGOProgramsSection /></div>;
        if (activePage === '/leadership') return <div className="space-y-10"><NGOLeadershipSection /></div>;
        if (activePage === '/fellows') return <div className="space-y-10"><NGOVolunteerSection /></div>;
        if (activePage === '/publications') return <div className="space-y-10"><NGOStoriesSection /></div>;
        if (activePage === '/reports') return <div className="space-y-10"><NGOReportsSection /></div>;
        if (activePage === '/partner') return <div className="space-y-10"><NGODonationSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><NGOContactSection /></div>;

        return (
          <div className="space-y-12">
            <FoundationHero />
            <NGOImpactStatsSection />
            <NGOProgramsSection />
            <NGOLeadershipSection />
            <NGOVolunteerSection />
            <NGOStoriesSection />
            <NGOReportsSection />
            <NGOPartnersSection />
            <NGOFAQSection />
            <NGOContactSection />
          </div>
        );
      }
      if (ngoArchetype === 'cause_charity') {
        if (activePage === '/why-cause') return <div className="space-y-10"><NGOStoriesSection /></div>;
        if (activePage === '/how-it-works') return <div className="space-y-10"><NGOProgramsSection /><NGOReportsSection /></div>;
        if (activePage === '/projects') return <div className="space-y-10"><NGOProgramsSection /></div>;
        if (activePage === '/impact') return <div className="space-y-10"><NGOImpactStatsSection /></div>;
        if (activePage === '/campaigns') return <div className="space-y-10"><NGOCampaignsSection /></div>;
        if (activePage === '/transparency') return <div className="space-y-10"><NGOReportsSection /></div>;
        if (activePage === '/donate') return <div className="space-y-10"><NGODonationSection /></div>;
        if (activePage === '/contact') return <div className="space-y-10"><NGOContactSection /></div>;

        return (
          <div className="space-y-12">
            <CharityWaterHero />
            <NGOImpactStatsSection />
            <NGODonationSection />
            <NGOProgramsSection />
            <NGOCampaignsSection />
            <NGOStoriesSection />
            <NGOReportsSection />
            <NGOPartnersSection />
            <NGOFAQSection />
            <NGOContactSection />
          </div>
        );
      }
    }


    const sectionsToRender = activePage === '/'
      ? pageSections.filter(section => section.type === 'hero')
      : currentGenericSections;

    return (
      <div className="space-y-10">
        {sectionsToRender.map(section => (
          <React.Fragment key={section.id}>
            {renderGenericSection(section)}
          </React.Fragment>
        ))}
        {activePage === '/' && (
          <>
            {pageSections
              .filter(section => section.type !== 'hero' && section.enabled)
              .map(section => (
                <React.Fragment key={section.id}>
                  {renderGenericSection(section)}
                </React.Fragment>
              ))}
          </>
        )}
      </div>
    );
  };

  const content = (
    <div
      className="min-h-[500px] space-y-8 p-4 text-gray-100 sm:p-8"
      style={{
        backgroundColor: website.themeConfig?.backgroundColor || '#090D17',
        color: website.themeConfig?.textColor || '#F3F4F6',
        fontFamily: website.themeConfig?.fontFamily || website.fontFamily
      }}
    >
      {/* Website Header */}
      <header className="relative z-20 border-b border-white/10 pb-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToPage('/')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            {(eventData?.branding.logoUrl || sportsData?.club.logoUrl || culturalData?.branding.primaryLogoUrl || requirements.logoUrl) ? (
              <img
                src={eventData?.branding.logoUrl || sportsData?.club.logoUrl || culturalData?.branding.primaryLogoUrl || requirements.logoUrl}
                alt={requirements.organizationName}
                className={`h-11 w-11 rounded-xl border bg-black/40 object-contain p-1 ${accentStyles.highlightBorder}`}
              />
            ) : (
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white/5 text-lg font-bold ${accentStyles.highlightBorder}`}>
                {requirements.organizationName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white sm:text-base">
                {eventData?.profile.name || culturalData?.organization.name || website.navigationBar?.brandName || requirements.organizationName}
              </h2>
              <p className="truncate text-[10px] text-gray-400">
                {eventData?.profile.tagline || requirements.tagline || categoryName(requirements.category)}
              </p>
            </div>
          </button>

          <div className="hidden flex-1 justify-end gap-1 lg:flex">
            {navigationPages.map(page => (
              <button
                key={page.slug}
                type="button"
                onClick={() => goToPage(page.slug)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                  activePage === page.slug
                    ? `${accentStyles.accentText} bg-white/10`
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(value => !value)}
            className="rounded-lg border border-white/10 p-2 text-gray-300 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-3 lg:hidden">
            {navigationPages.map(page => (
              <button
                key={page.slug}
                type="button"
                onClick={() => goToPage(page.slug)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                  activePage === page.slug
                    ? `${accentStyles.accentText} bg-white/10`
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {page.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Breadcrumb / current page indicator */}
      {activePage !== '/' && (
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <button type="button" onClick={() => goToPage('/')} className="hover:text-white">
            Home
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className={accentStyles.accentText}>
            {navigationPages.find(page => page.slug === activePage)?.label || currentGenericPage?.label}
          </span>
        </div>
      )}

      {/* Page Content */}
      <main>{renderPageContent()}</main>

      {/* Generic category video showcase */}
      {!isSports && !isCultural && !isEvent && !isNGO && !isPortfolio && activePage === '/' && allVideos.length > 0 && (
        <section className="space-y-5 border-t border-white/10 pt-6">
          <SectionHeading
            title="Video Showcase"
            subtitle="Videos supplied by the organization"
            icon={<Video className="h-5 w-5" />}
          />
          {renderVideoShowcase()}
        </section>
      )}

      {/* Generic category metrics */}
      {!isSports && !isCultural && !isEvent && !isNGO && !isPortfolio && activePage === '/' && website.metrics.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {website.metrics.map((metric, index) => (
            <div key={`${metric.label}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className={`text-2xl font-black ${accentStyles.accentText}`}>{metric.value}</p>
              <p className="mt-1 text-[10px] text-gray-400">{metric.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 pt-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              {website.footerConfig?.copyrightText || `© ${new Date().getFullYear()} ${requirements.organizationName}`}
            </h3>
            {website.footerConfig?.contactInfo.address && (
              <p className="mt-2 text-xs text-gray-400">{website.footerConfig.contactInfo.address}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-400 sm:items-end">
            {requirements.contactEmail && (
              <span><Mail className="mr-2 inline h-3.5 w-3.5" />{requirements.contactEmail}</span>
            )}
            {requirements.contactPhone && (
              <span><Phone className="mr-2 inline h-3.5 w-3.5" />{requirements.contactPhone}</span>
            )}
          </div>
        </div>

        {navigationPages.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-4">
            {navigationPages.map(page => (
              <button
                key={page.slug}
                type="button"
                onClick={() => goToPage(page.slug)}
                className="text-[10px] text-gray-500 transition hover:text-white"
              >
                {page.label}
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );

  // Sports projects that selected a template from the Sports library render through that template. Projects
  // without one (created before the library existed) keep the built-in renderer below, unchanged.
  const sportsTemplateId = isSports && sportsData ? resolveSportsTemplateId({ requirements, website }) : undefined;
  if (isSports && sportsData && sportsTemplateId) {
    const sportsContent = previewViewport ? (
      <SportsLiveFrame
        templateId={sportsTemplateId}
        requirements={requirements}
        sportsData={sportsData}
        website={website}
        viewport={previewViewport}
      />
    ) : (
      <SportsTemplateDispatcher
        templateId={sportsTemplateId}
        requirements={requirements}
        sportsData={sportsData}
        website={website}
        activePage={activePage}
        onNavigate={goToPage}
      />
    );

    if (!inBrowserFrame) return sportsContent;

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-mono text-[11px] text-gray-300">
              {addressBase}{activePage === '/' ? '' : activePage}
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
            <Shield className="h-3.5 w-3.5" /> {browserBadge}
          </span>
        </div>
        {/* A bounded viewport. The transform makes it the containing block for the template's fixed bars
            (otherwise they paint over the Admin sidebar), and sticky parts stick inside the frame. */}
        <div className={previewViewport ? 'relative bg-[#EEF1F6] p-2' : 'relative max-h-[80vh] overflow-y-auto'} style={previewViewport ? undefined : { transform: 'translateZ(0)' }} data-sports-preview-frame>
          {sportsContent}
        </div>
      </div>
    );
  }

  // Event projects that picked a library template render exactly that template in a sandboxed frame, the same one the library previewed.
  // The id is never swapped: an id that is not in the library shows a visible message instead of a different design. Projects created
  // before the library keep the inline renderer.
  const eventTemplateId = website.selectedTemplate?.templateId || requirements.selectedTemplate?.templateId;
  if (isEvent && isEventTemplateIdLite(eventTemplateId) && eventData) {
    const eventContent = (
      <EventLiveFrame
        templateId={eventTemplateId}
        viewport={previewViewport || 'desktop'}
        fill={!inBrowserFrame}
        requirements={requirements}
        eventData={eventData}
        website={website}
        mode="live"
      />
    );
    if (!inBrowserFrame) return eventContent;
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-mono text-[11px] text-gray-300">{addressBase}</span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
            <Shield className="h-3.5 w-3.5" /> {browserBadge}
          </span>
        </div>
        <div className="relative bg-[#EEF1F6] p-2" data-event-preview-frame>{eventContent}</div>
      </div>
    );
  }

  // Social & NGO projects that picked a library template render exactly that template in a sandboxed frame. The id is never swapped:
  // an id that is not in the library shows a visible message instead of a different design. Projects created before the library keep the inline renderer below.
  const ngoTemplateId = website.selectedTemplate?.templateId || requirements.selectedTemplate?.templateId;
  if (isNGO && isNgoTemplateIdLite(ngoTemplateId) && ngoData) {
    const ngoContent = (
      <NgoLiveFrame
        templateId={ngoTemplateId}
        viewport={previewViewport || 'desktop'}
        fill={!inBrowserFrame}
        requirements={requirements}
        ngoData={ngoData}
        website={website}
      />
    );
    if (!inBrowserFrame) return ngoContent;
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-mono text-[11px] text-gray-300">{addressBase}</span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
            <Shield className="h-3.5 w-3.5" /> {browserBadge}
          </span>
        </div>
        <div className="relative bg-[#EEF1F6] p-2" data-ngo-preview-frame>{ngoContent}</div>
      </div>
    );
  }

  // Cultural projects render through the template recorded on the project. A retired first-generation id maps to its replacement,
  // and a project that never chose one shows its category's default design, so a site never renders blank.
  if (isCultural && culturalData) {
    const culturalContent = previewViewport ? (
      <CulturalLiveFrame
        templateId={resolveCulturalTemplateForProject({ requirements, culturalData, website })}
        requirements={requirements}
        culturalData={culturalData}
        website={website}
        viewport={previewViewport}
      />
    ) : (
      <CulturalTemplateDispatcher
        requirements={requirements}
        culturalData={culturalData}
        website={website}
        activePage={activePage}
        onNavigate={goToPage}
      />
    );

    if (!inBrowserFrame) return culturalContent;

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-mono text-[11px] text-gray-300">
              {addressBase}{activePage === '/' ? '' : activePage}
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
            <Shield className="h-3.5 w-3.5" /> {browserBadge}
          </span>
        </div>
        {/* Bounded like the Sports frame: a real device-width iframe when a viewport is chosen, otherwise a scrolling stage. */}
        <div className={previewViewport ? 'relative bg-[#EEF1F6] p-2' : 'relative max-h-[80vh] overflow-y-auto'} style={previewViewport ? undefined : { transform: 'translateZ(0)' }} data-cultural-preview-frame>
          {culturalContent}
        </div>
      </div>
    );
  }

  if (isPortfolio && portfolioData) {
    const portfolioContent = (
      <PortfolioTemplateDispatcher
        requirements={requirements}
        portfolioData={portfolioData}
        website={website}
        activePage={activePage}
        onNavigate={goToPage}
      />
    );

    if (!inBrowserFrame) return portfolioContent;

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-mono text-[11px] text-gray-300">
              {addressBase}{activePage === '/' ? '' : activePage}
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
            <Shield className="h-3.5 w-3.5" /> {browserBadge}
          </span>
        </div>
        {/* A bounded viewport. The transform makes it the containing block for the template's fixed rails and
            headers (otherwise they paint over the Admin sidebar), and sticky parts stick inside the frame. */}
        <div className="relative max-h-[80vh] overflow-y-auto" style={{ transform: 'translateZ(0)' }} data-portfolio-preview-frame>
          {portfolioContent}
        </div>
      </div>
    );
  }

  if (!inBrowserFrame) return content;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-[#0e1422] px-4 py-2.5 text-xs text-gray-400">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700/50 bg-black/50 px-3 py-1">
          <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate font-mono text-[11px] text-gray-300">
            {addressBase}{activePage === '/' ? '' : activePage}
          </span>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-[10px] text-emerald-400 sm:flex">
          <Shield className="h-3.5 w-3.5" /> {browserBadge}
        </span>
      </div>
      {content}
    </div>
  );
};