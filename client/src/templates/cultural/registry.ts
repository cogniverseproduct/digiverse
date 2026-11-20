import type {
  CulturalCategory, CulturalSectionConfig, CulturalSectionKey, CulturalTemplateDefinition, CulturalTemplateId, CulturalTemplateTokens
} from './types';
import { CULTURAL_CATEGORY_LABELS } from './types';
import { ALL_CULTURAL_IDS, CULTURAL_IDS_BY_CATEGORY, DEFAULT_CULTURAL_TEMPLATE_ID, resolveCulturalTemplateId } from './ids';
import { DEMO_BUILDERS } from './demos/demoData';

/**
 * Cultural Website Creation Engine template library (2 categories x 5 designs). Every entry is an original design
 * implemented in ./designs; see LICENSES.md and CULTURAL_TEMPLATE_SOURCES.md for sources and font licences.
 */

const preview = (id: CulturalTemplateId) => `/images/cultural-templates/${id}.jpg`;
const sec = (id: CulturalSectionKey, label: string, needs?: string): CulturalSectionConfig => ({ id, label, needs });
const original = (inspiration: string[], note: string) => ({ kind: 'original' as const, inspiration, note });

const SOCIETY_FIELDS = ['organization.name', 'organization.tagline', 'organization.description', 'organization.history', 'branding.primaryLogoUrl', 'branding.coverImageUrl', 'leadership[]', 'activities[]', 'events[]', 'news[]', 'sponsors[]', 'gallery[]', 'membershipInfo', 'requirements.contact*', 'requirements.socialLinks'];
const PUJA_FIELDS = ['organization.name', 'organization.tagline', 'organization.description', 'branding.primaryLogoUrl', 'branding.coverImageUrl', 'pujaSchedule[]', 'pujaTheme', 'visitorGuide', 'leadership[]', 'activities[]', 'news[]', 'sponsors[]', 'gallery[]', 'donationInfo', 'requirements.contact*', 'requirements.socialLinks'];

interface Def {
  id: CulturalTemplateId; name: string; tagline: string; description: string; archetype: CulturalCategory; badge: string; designStyle: string;
  styleGroup: CulturalTemplateDefinition['styleGroup']; designDirection: string; highlights: string[]; tokens: CulturalTemplateTokens;
  sections: CulturalSectionConfig[]; animation: { style: string; features: string[] }; inspiration: string[]; note: string;
  logo?: 'required' | 'recommended' | 'optional'; hero?: 'required' | 'recommended' | 'optional'; assets?: string;
}

const make = (d: Def): CulturalTemplateDefinition => ({
  id: d.id, name: d.name, tagline: d.tagline, description: d.description, archetype: d.archetype, categoryLabel: CULTURAL_CATEGORY_LABELS[d.archetype],
  version: '2.0.0', author: 'DigiVerse Design', badge: d.badge, designStyle: d.designStyle, styleGroup: d.styleGroup, designDirection: d.designDirection,
  highlights: d.highlights, tokens: d.tokens, sections: d.sections, contentFields: d.archetype === 'cultural_society' ? SOCIETY_FIELDS : PUJA_FIELDS,
  assetRequirements: { logo: d.logo || 'recommended', heroImage: d.hero || 'recommended', notes: d.assets || 'A logo and one wide cover photograph. Generated artwork is used until the client supplies images.' },
  animation: { style: d.animation.style, reducedMotion: 'static', features: d.animation.features },
  previewImage: preview(d.id), source: original(d.inspiration, d.note), getDemoData: DEMO_BUILDERS[d.id]
});

const tok = (primaryColor: string, accentColor: string, background: string, textColor: string, headingFont: string, fontFamily: string, layoutPreset: string, secondaryColor?: string): CulturalTemplateTokens =>
  ({ primaryColor, accentColor, secondaryColor, background, textColor, headingFont, fontFamily, layoutPreset });

const DEFS: Def[] = [
  /* ============================ CULTURAL ASSOCIATION ============================ */
  {
    id: 'cultural-heritage', name: 'Cultural Heritage', archetype: 'cultural_society', badge: 'Classic', designStyle: 'Ivory · Maroon · Editorial', styleGroup: 'traditional',
    tagline: 'A formal society journal with a nameplate masthead and a roll of office-bearers.',
    description: 'A dignified, ivory-and-maroon website for long-established societies: a framed hero, a ruled "story" section with a drop cap, an office-bearers roll with dotted leaders, numbered programmes, a dated events ledger and an archive of photographs.',
    designDirection: 'Heritage and gravitas: ivory paper, maroon and antique gold, high-contrast serif headlines and ruled sections.',
    highlights: ['Nameplate masthead with scroll-spy navigation', 'Office-bearers roll with dotted leaders', 'Numbered programme list', 'Dated events ledger with register links', 'Sepia archive gallery'],
    tokens: tok('#7A1F2B', '#B8893C', '#F7F0E1', '#2E1A0E', 'Cormorant Garamond', 'Lora', 'Masthead + ruled sections', '#EFE4CB'),
    sections: [sec('hero', 'Masthead hero'), sec('about', 'About', 'about'), sec('leadership', 'Council', 'leadership'), sec('activities', 'Programmes', 'activities'), sec('events', 'Events', 'events'), sec('gallery', 'Archive', 'gallery'), sec('news', 'Notices', 'news'), sec('membership', 'Membership', 'membership'), sec('sponsors', 'Patrons', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Slow fades, underline hovers', features: ['Reveal on scroll', 'Sepia-to-colour hover', 'Scroll-spy nav'] }, inspiration: ['Society journals and club nameplates'], note: 'Original layout and code. Cormorant Garamond and Lora (SIL OFL).'
  },
  {
    id: 'arts-literature-society', name: 'Arts & Literature Society', archetype: 'cultural_society', badge: 'Editorial', designStyle: 'Paper · Ink navy · Vermilion', styleGroup: 'editorial',
    tagline: 'A magazine for readings, exhibitions and workshops, with filterable programmes.',
    description: 'A magazine-style website for writers, readers and artists: an oversized headline over a collage cover, programme cards you can filter by category, a calendar of dated events, a contributors grid, a mosaic gallery and a numbered journal.',
    designDirection: 'Contemporary editorial: warm paper, ink-navy type, a single vermilion accent and generous scale.',
    highlights: ['Oversized headline and collage cover', 'Programme cards filtered by category', 'Dated events calendar', 'Contributor portraits', 'Mosaic gallery and numbered journal'],
    tokens: tok('#1F2A44', '#D2512B', '#FBF8F1', '#1B1B1F', 'DM Serif Display', 'DM Sans', 'Magazine grid', '#EFE9DA'),
    sections: [sec('hero', 'Cover'), sec('activities', 'Programmes', 'activities'), sec('events', 'Calendar', 'events'), sec('leadership', 'Contributors', 'leadership'), sec('gallery', 'Gallery', 'gallery'), sec('videos', 'Videos', 'videos'), sec('news', 'Journal', 'news'), sec('membership', 'Membership', 'membership'), sec('sponsors', 'Supporters', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Card lift, soft reveals', features: ['Category filter', 'Reveal on scroll', 'Hover lift'] }, inspiration: ['Independent arts magazines and gallery sites'], note: 'Original layout and code. DM Serif Display and DM Sans (SIL OFL).'
  },
  {
    id: 'dance-music-association', name: 'Dance & Music Association', archetype: 'cultural_society', badge: 'Stage', designStyle: 'Plum · Amber · Theatrical', styleGroup: 'festive',
    tagline: 'A dark stage with a live countdown, a performance bill and disciplines to browse.',
    description: 'A theatrical website for dance and music associations: stage curtains and a spotlight hero, a countdown to the next performance, a ticket-style performance bill, a sideways scroll of disciplines, a faculty list, a performance reel and a gallery strip.',
    designDirection: 'The theatre at night: deep plum, amber spotlight, serif display type and ticket-stub details.',
    highlights: ['Spotlight hero with live countdown', 'Ticket-style performance bill', 'Horizontal discipline cards', 'Faculty and committee cards', 'Performance reel and gallery strip'],
    tokens: tok('#2A0E3C', '#F2A33A', '#120818', '#F6EEF8', 'Marcellus', 'Nunito Sans', 'Stage hero + bill', '#3B1650'),
    sections: [sec('hero', 'Stage hero'), sec('events', 'Performance bill', 'events'), sec('activities', 'Disciplines', 'activities'), sec('leadership', 'Faculty', 'leadership'), sec('videos', 'Reel', 'videos'), sec('gallery', 'Gallery', 'gallery'), sec('membership', 'Membership', 'membership'), sec('sponsors', 'Patrons', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Spotlight, ticking countdown', features: ['Live countdown', 'Horizontal scroll', 'Reveal on scroll'] }, inspiration: ['Theatre and concert-hall programme sites'], note: 'Original layout and code. Marcellus and Nunito Sans (SIL OFL).'
  },
  {
    id: 'community-cultural-association', name: 'Community Cultural Association', archetype: 'cultural_society', badge: 'Friendly', designStyle: 'Cream · Teal · Marigold', styleGroup: 'community',
    tagline: 'Warm and welcoming, with an upcoming/past events toggle and a notice board.',
    description: 'A friendly neighbourhood-association website: a rounded hero with clear calls to action, icon cards for what the association does, an upcoming/past events toggle, team portraits, a pinned notice board, a photo grid and a prominent membership panel.',
    designDirection: 'Approachable and warm: cream background, teal and marigold, rounded shapes and friendly type.',
    highlights: ['Calls to action for events and membership', 'Upcoming / past events toggle', 'Pinned-note notice board', 'Team portraits', 'Prominent membership tiers'],
    tokens: tok('#0F6E6B', '#F0A12B', '#FFF8EC', '#1D3A39', 'Fredoka', 'Quicksand', 'Rounded cards', '#DDF1EE'),
    sections: [sec('hero', 'Welcome'), sec('activities', 'What we do', 'activities'), sec('events', 'Events', 'events'), sec('leadership', 'Our team', 'leadership'), sec('news', 'Notice board', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('membership', 'Join us', 'membership'), sec('sponsors', 'Supporters', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Gentle card lifts', features: ['Events toggle', 'Reveal on scroll', 'Hover lift'] }, inspiration: ['Community centre and neighbourhood association sites'], note: 'Original layout and code. Fredoka and Quicksand (SIL OFL).'
  },
  {
    id: 'modern-festival-organization', name: 'Modern Festival & Cultural Organization', archetype: 'cultural_society', badge: 'Bold', designStyle: 'Black · Hot orange · Sun yellow', styleGroup: 'modern',
    tagline: 'Giant type, a marquee of the programme and a lineup split into day tabs.',
    description: 'A bold, contemporary website for festival organisers: a full-height hero with enormous type, a marquee of the programme, headline counters, a lineup divided by day, a numbered programme grid, a mosaic gallery, a partners wall and a loud contact block.',
    designDirection: 'Festival poster energy: near-black canvas, hot orange and sun yellow, tight uppercase grotesque type.',
    highlights: ['Full-height hero with huge type', 'Scrolling marquee of the programme', 'Lineup in day tabs', 'Counters from real figures', 'Mosaic gallery and partners wall'],
    tokens: tok('#FF4D2E', '#FFD23F', '#0A0A0F', '#FFFFFF', 'Space Grotesk', 'Inter', 'Poster hero + lineup', '#1A1A24'),
    sections: [sec('hero', 'Poster hero'), sec('events', 'Lineup', 'events'), sec('activities', 'Programme', 'activities'), sec('gallery', 'Highlights', 'gallery'), sec('videos', 'Watch', 'videos'), sec('sponsors', 'Partners', 'sponsors'), sec('membership', 'Join', 'membership'), sec('contact', 'Contact')],
    animation: { style: 'Marquee, snappy reveals', features: ['Marquee', 'Day tabs', 'Reveal on scroll'] }, inspiration: ['Music-festival and arts-festival sites'], note: 'Original layout and code. Space Grotesk and Inter (SIL OFL).'
  },

  /* ================================ PUJA COMMITTEE ================================ */
  {
    id: 'traditional-durga-puja', name: 'Traditional Durga Puja', archetype: 'puja_committee', badge: 'Traditional', designStyle: 'Sindoor red · Gold · Cream', styleGroup: 'traditional',
    tagline: 'Alpona borders, a ritual schedule by day and a devotional, ceremonial tone.',
    description: 'A devotional, ceremonial website for a neighbourhood Durga Puja: a sindoor-red hero with the theme, a day-by-day ritual schedule in tabs, the year’s theme and previous years, a visiting guide, cultural evenings, the committee, notices, a gallery and a donation appeal, all framed with alpona borders.',
    designDirection: 'Ceremonial and warm: sindoor red, marigold gold and cream, alpona borders and a Bengali-friendly body face.',
    highlights: ['Alpona borders and mandala hero', 'Ritual schedule in day tabs', 'Theme, idol, pandal and lighting details', 'Visitor guide for the pandal', 'Donation appeal with transparency note'],
    tokens: tok('#B3121B', '#E0A526', '#FFF6E5', '#3B1410', 'Yatra One', 'Hind Siliguri', 'Ceremonial hero + tabs', '#5C0A10'),
    sections: [sec('hero', 'Festival hero'), sec('theme', 'The Puja', 'theme'), sec('schedule', 'Ritual schedule', 'schedule'), sec('visitor', 'Visit', 'visitor'), sec('activities', 'Cultural evenings', 'activities'), sec('leadership', 'Committee', 'leadership'), sec('news', 'Notices', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('donation', 'Contribute', 'donation'), sec('sponsors', 'Patrons', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Gentle fades', features: ['Day tabs', 'Reveal on scroll'] }, inspiration: ['Community Durga Puja committee pages'], note: 'Original layout and code. Yatra One and Hind Siliguri (SIL OFL).'
  },
  {
    id: 'premium-modern-durga-puja', name: 'Premium Modern Durga Puja', archetype: 'puja_committee', badge: 'Premium', designStyle: 'Near-black · Champagne · Crimson', styleGroup: 'modern',
    tagline: 'Cinematic and restrained, with a sticky day rail and a highlights reel.',
    description: 'A cinematic website for a themed, modern Durga Puja: a full-screen hero, a two-column concept section with a horizontal highlights reel, a schedule with a sticky day rail beside the rituals, a visitor guide, a media mosaic, a committee grid and a crimson donation panel.',
    designDirection: 'Quiet luxury: near-black, champagne gold and crimson, a high-contrast Didone display face and wide spacing.',
    highlights: ['Full-screen cinematic hero', 'Sticky day rail beside the schedule', 'Horizontal highlights reel', 'Media mosaic', 'Crimson donation panel'],
    tokens: tok('#8E1B2A', '#D9B26A', '#0B0B10', '#F3EEE4', 'Bodoni Moda', 'Manrope', 'Cinematic hero + sticky rail', '#101018'),
    sections: [sec('hero', 'Cinematic hero'), sec('theme', 'Theme', 'theme'), sec('schedule', 'Schedule', 'schedule'), sec('visitor', 'Visit', 'visitor'), sec('gallery', 'Media', 'gallery'), sec('videos', 'Videos', 'videos'), sec('leadership', 'Committee', 'leadership'), sec('news', 'News', 'news'), sec('donation', 'Support', 'donation'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Slow reveals', features: ['Sticky day rail', 'Horizontal reel', 'Reveal on scroll'] }, inspiration: ['Luxury event and cultural-institution sites'], note: 'Original layout and code. Bodoni Moda and Manrope (SIL OFL).'
  },
  {
    id: 'community-puja-committee', name: 'Community Puja Committee', archetype: 'puja_committee', badge: 'Community', designStyle: 'Warm orange · Green · Friendly', styleGroup: 'community',
    tagline: 'Participation first: quick answers, a programme toggle, volunteer and donor paths.',
    description: 'A friendly, participation-led website for a neighbourhood puja: quick-answer cards (when, where, how to get there), a rituals/cultural-programmes toggle, visiting information, announcements, a photo wall, the team and clear ways to volunteer or donate.',
    designDirection: 'Welcoming and practical: warm orange and green, rounded cards and plain, helpful language.',
    highlights: ['Quick-answer cards from your real data', 'Rituals / cultural programmes toggle', 'Volunteer and donate paths', 'Announcements list', 'Masonry photo wall'],
    tokens: tok('#E4572E', '#2E8B57', '#FFF9F0', '#33241C', 'Baloo Da 2', 'Mukta', 'Quick answers + toggle', '#FCE5D8'),
    sections: [sec('hero', 'Welcome'), sec('schedule', 'Programme', 'schedule'), sec('activities', 'Cultural programmes', 'activities'), sec('visitor', 'Visiting us', 'visitor'), sec('news', 'Announcements', 'news'), sec('gallery', 'Photo wall', 'gallery'), sec('leadership', 'Our team', 'leadership'), sec('donation', 'Donate', 'donation'), sec('sponsors', 'Sponsors', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Playful lifts', features: ['Programme toggle', 'Reveal on scroll', 'Hover lift'] }, inspiration: ['Neighbourhood festival committees'], note: 'Original layout and code. Baloo Da 2 and Mukta (SIL OFL).'
  },
  {
    id: 'heritage-traditional-puja', name: 'Heritage & Traditional Puja', archetype: 'puja_committee', badge: 'Heritage', designStyle: 'Parchment · Terracotta · Moss', styleGroup: 'editorial',
    tagline: 'A long-form story in numbered chapters, with a timeline and sepia archive.',
    description: 'A storytelling website for old and household pujas: a parchment cover, a chapter index, the story with a drop cap, a theme chapter with a timeline of past years, the rituals day by day, a sepia archive of photographs, the custodians, visiting notes and offerings.',
    designDirection: 'The family album: parchment, terracotta and moss, an old-style Bengali display face and classical text type.',
    highlights: ['Numbered chapters with an index', 'Timeline of previous years', 'Rituals listed day by day', 'Sepia archive photographs', 'Custodians of the tradition'],
    tokens: tok('#8C3B1E', '#2F4A3A', '#EFE3C8', '#2B2118', 'Tiro Bangla', 'Spectral', 'Chapters + archive', '#E6D6B3'),
    sections: [sec('hero', 'Cover'), sec('history', 'Our story', 'history'), sec('theme', 'This year', 'theme'), sec('schedule', 'The rituals', 'schedule'), sec('gallery', 'Archive', 'gallery'), sec('leadership', 'Custodians', 'leadership'), sec('visitor', 'Visiting', 'visitor'), sec('news', 'Notices', 'news'), sec('donation', 'Offerings', 'donation'), sec('sponsors', 'Patrons', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Slow fades', features: ['Chapter index', 'Reveal on scroll'] }, inspiration: ['Heritage trusts and family-history sites'], note: 'Original layout and code. Tiro Bangla and Spectral (SIL OFL).'
  },
  {
    id: 'festival-experience-celebration', name: 'Festival Experience & Celebration', archetype: 'puja_committee', badge: 'Festival', designStyle: 'Indigo · Magenta · Marigold', styleGroup: 'festive',
    tagline: 'Immersive and celebratory: a live countdown, a marquee and a big timetable.',
    description: 'An immersive website for a large puja festival: a full-bleed hero with a live countdown, a marquee of rituals and events, a big tabbed timetable, a full-width image band, programme tiles, an events list, a visitor guide, a mosaic gallery and a marigold donation block.',
    designDirection: 'Night-festival energy: deep indigo with magenta and marigold, a friendly geometric sans and large imagery.',
    highlights: ['Live countdown to the first ritual', 'Marquee of festival highlights', 'Big tabbed timetable', 'Full-width image band', 'Programme tiles over imagery'],
    tokens: tok('#E5338A', '#FFB400', '#14123A', '#FFFFFF', 'Rubik', 'Work Sans', 'Immersive bands', '#1C1A52'),
    sections: [sec('hero', 'Festival hero'), sec('schedule', 'Timetable', 'schedule'), sec('activities', 'Programmes', 'activities'), sec('events', 'Events', 'events'), sec('visitor', 'Visit', 'visitor'), sec('gallery', 'Gallery', 'gallery'), sec('videos', 'Videos', 'videos'), sec('donation', 'Give', 'donation'), sec('leadership', 'Committee', 'leadership'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Marquee, image zoom', features: ['Live countdown', 'Marquee', 'Day tabs'] }, inspiration: ['Large city festival sites'], note: 'Original layout and code. Rubik and Work Sans (SIL OFL).'
  }
];

export const CULTURAL_TEMPLATES: Record<CulturalTemplateId, CulturalTemplateDefinition> = Object.fromEntries(DEFS.map((d) => [d.id, make(d)])) as Record<CulturalTemplateId, CulturalTemplateDefinition>;

export const getCulturalTemplateList = (): CulturalTemplateDefinition[] => ALL_CULTURAL_IDS.map((id) => CULTURAL_TEMPLATES[id]);
export const getCulturalTemplatesByCategory = (category: CulturalCategory): CulturalTemplateDefinition[] => CULTURAL_IDS_BY_CATEGORY[category].map((id) => CULTURAL_TEMPLATES[id]);

/** The design for an id. A retired first-generation id resolves to the design that replaced it; an unknown id is undefined. */
export const getCulturalTemplateById = (id?: string): CulturalTemplateDefinition | undefined => {
  const r = resolveCulturalTemplateId(id);
  return r ? CULTURAL_TEMPLATES[r] : undefined;
};

export const DEFAULT_CULTURAL_TEMPLATE = DEFAULT_CULTURAL_TEMPLATE_ID;

export const STYLE_FILTERS: { id: CulturalTemplateDefinition['styleGroup'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All styles' }, { id: 'traditional', label: 'Traditional' }, { id: 'modern', label: 'Modern' }, { id: 'editorial', label: 'Editorial' }, { id: 'festive', label: 'Festive' }, { id: 'community', label: 'Community' }
];
