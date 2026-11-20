import type { EventCategoryId } from './ids';
import { ALL_EVENT_TEMPLATE_IDS, EVENT_CATEGORY_IDS, EVENT_TEMPLATE_IDS_BY_CATEGORY } from './ids';
import type { EventTemplateDefinition, EventTemplateSource } from './types';

/**
 * The Event template library. Every entry is a real, third-party website template integrated into DigiVerse (bundle in
 * `public/event-templates/<id>/`, upstream LICENSE copied beside it). Nothing here is a DigiVerse-invented design.
 * `source` is filled from the upstream repository and its LICENSE file; see EVENT_TEMPLATE_SOURCES.md for the audit trail.
 * Categories with no entry have no qualifying template and are shown as unavailable.
 */

const COMMON_CHANGES = [
  "Sample content (names, dates, places, copy, photographs, logos) replaced with the client's data through mapping.json; nothing is invented when data is missing.",
  'Forms, third-party scripts, structured data and unmapped photographs removed from client sites. Ticket buttons only link to booking links the organiser supplied.',
  "The template's own HTML, CSS and scripts are otherwise unchanged and run in a sandboxed frame.",
];

const novpix = (over: Partial<EventTemplateSource> & Pick<EventTemplateSource, 'name' | 'sampleTokens'>): EventTemplateSource => ({
  kind: 'adapted',
  author: 'Novpix LLC (ZumaTools)',
  repoUrl: 'https://github.com/Novpix/free-html-templates',
  commit: '9765e79',
  license: 'MIT',
  copyright: 'Copyright (c) 2026 Novpix LLC (ZumaTools)',
  retrievedAt: '2026-11-19',
  imageNote: "The template's illustrations (hero artwork, avatars, venue map) are original vector art released with the code under the MIT licence. Fonts are loaded from Google Fonts (SIL Open Font License). Avatars and the venue map depict the fictional sample event and are not shown on client sites.",
  changes: COMMON_CHANGES,
  ...over,
});

const eightB = (over: Partial<EventTemplateSource> & Pick<EventTemplateSource, 'name' | 'repoUrl' | 'commit' | 'sampleTokens'>): EventTemplateSource => ({
  kind: 'adapted',
  author: '8B',
  license: 'MIT',
  copyright: 'Copyright (c) 2026 8B (https://8b.com)',
  retrievedAt: '2026-11-19',
  imageNote: "Code is MIT. The upstream page loads its photographs from Unsplash (Unsplash License, not covered by the MIT licence, author names not recorded upstream); they are never copied into DigiVerse and are never loaded on a client's site. Only the labelled original-template preview loads them straight from Unsplash. Fonts are Google Fonts under the SIL Open Font License. The footer credit \"Design: 8B\" is kept.",
  changes: COMMON_CHANGES,
  ...over,
});

const make = (d: Omit<EventTemplateDefinition, 'entry' | 'previewImage' | 'version'> & { entry?: string; version?: string }): EventTemplateDefinition => ({
  entry: 'index.html', version: '1.0.0', previewImage: `/images/event-templates/${d.id}.jpg`, ...d,
});

export const EVENT_TEMPLATES: EventTemplateDefinition[] = [
  make({
    id: 'conference-shift26', category: 'conference_seminar', name: 'SHIFT/26',
    tagline: 'A bold, dark one-page conference site with a live countdown',
    description: 'A dark, modern site for conferences, summits and meetups: opening screen with date, venue and a live countdown, a speaker grid, a multi-track schedule with a tab for each day, ticket tiers, a sponsor wall, venue and travel notes and an FAQ.',
    designStyle: 'Dark navy with violet and teal accents, display type, glowing grid, tabbed multi-track schedule',
    highlights: ['Live countdown to your start time', 'Speaker grid', 'Multi-track schedule with a tab per day', 'Ticket tiers that link to your booking page', 'Reduced-motion friendly'],
    pages: ['Home', 'Speakers', 'Schedule', 'Tickets', 'Sponsors', 'Venue & travel', 'FAQ'],
    source: novpix({
      name: 'SHIFT/26 (event-conference)',
      sampleTokens: ['SHIFT', 'Lisbon', 'Harbour Hall', 'Okoye', 'Fischer', 'Santos', 'Almeida', 'Northwind', 'Quanta', 'Lumen', 'Orbitly', 'Paperplane', 'Hexgrid', 'Meridian', 'SHIFT26', 'Cais'],
    }),
  }),
  make({
    id: 'wedding-evermore', category: 'wedding_private', name: 'Evermore',
    tagline: 'An elegant one-page wedding site with a countdown and soft florals',
    description: 'A romantic wedding site: the couple’s names with a live countdown, a welcome note, a story timeline, the wedding-weekend plan, venue and travel with hotel suggestions, a photo gallery, gift links and a question-and-answer list.',
    designStyle: 'Warm cream with sage and rose, script and serif type, hand-drawn florals, scroll reveals',
    highlights: ['Live countdown to the ceremony', 'Story timeline', 'Day-by-day plan', 'Venue, travel and hotel notes', 'Gift links that go to your own pages', 'Guests reply by email'],
    pages: ['Home', 'Our story', 'Schedule', 'Venue & travel', 'Gallery', 'Registry', 'FAQ'],
    source: novpix({
      name: 'Evermore (wedding)',
      imageNote: "The florals and the photo placeholders are original vector art released with the code under the MIT licence. Fonts (Cormorant Garamond, Pinyon Script, Jost) load from Google Fonts under the SIL Open Font License. The photo placeholders and the illustrated map depict the fictional sample wedding and are not shown on client sites; only the couple's own photographs are.",
      changes: [
        ...COMMON_CHANGES,
        "The RSVP form is replaced by RSVP buttons that open an email to the organiser (the template's form only showed a demo message). No guest data is collected by the template.",
      ],
      sampleTokens: ['Amelia', 'James', 'Willowbrook', 'Biscuit', 'Catskills', 'Hudson', 'Stewart', 'Riverside Inn', 'Hudson House', 'Amalfi', 'Orchard Barn', 'Glasshouse', 'Garden Lawn', 'AmeliaAndJames'],
    }),
  }),
  make({
    id: 'launch-aube', category: 'launch_reveal', name: 'Aube',
    tagline: 'An elegant one-screen reveal page with a live countdown',
    description: 'A refined teaser page for a launch or product reveal: a large headline, a short pitch, a live countdown to the reveal moment, one button to your own page or contact, and your social link, over a softly animated gradient with hand-drawn botanical line art.',
    designStyle: 'Deep navy with gold and rose glow, high-contrast serif display type, animated gradient orbs and drawn line art',
    highlights: ['Live countdown to the reveal', 'One clear call to action to your own link', 'Animated gradient and line-art background', 'Works on any phone', 'Reduced-motion friendly'],
    pages: ['Reveal page'],
    source: novpix({
      name: 'Aube (coming soon page)',
      imageNote: "The botanical line art is original vector art released with the code under the MIT licence. Fonts (Cormorant Garamond, Manrope) load from Google Fonts under the SIL Open Font License. No photographs are used.",
      changes: [
        ...COMMON_CHANGES,
        "The waitlist form is replaced by one button that links to the organiser's own booking or product link, or opens an email to them. The page's date is read from the page instead of a hard-coded script value. The dawn (light) colour variant is not included.",
      ],
      sampleTokens: ['Aube', 'Botanicals', 'blooming', 'skincare', 'cold-pressed', 'Pinterest', 'TikTok', 'waitlist', 'Dawn version'],
    }),
  }),
  make({
    id: 'festival-ondo', category: 'festival_concert', name: 'ONDO',
    tagline: 'A bold, motion-led festival site with a huge title and a running order',
    description: 'A high-energy site for festivals and concerts: a full-screen opening with a huge animated title, dates and venue, the day as a ring of set times, a line-up with each act’s name set across the full width, a photo wall, passes that link to your ticket page, questions and contact.',
    designStyle: 'Deep wine and red with pale text, one oversized display typeface, round photo windows, scroll-driven motion with no libraries',
    highlights: ['Huge animated festival title', 'The day as a ring of set times', 'Line-up with portraits', 'Photo wall from your own photos', 'Passes that link to your ticket page', 'Reduced-motion friendly'],
    pages: ['Opening', 'Schedule', 'Line-up', 'Photo wall', 'Passes', 'FAQ', 'Contact'],
    source: {
      kind: 'adapted',
      name: 'ONDO (event website template, native build)',
      author: '8B',
      repoUrl: 'https://github.com/8bsite/event-website-template',
      commit: '690d121',
      license: 'MIT',
      copyright: 'Copyright (c) 2026 8B (https://8b.com)',
      retrievedAt: '2026-11-19',
      imageNote: "The upstream page uses 29 Unsplash photographs, which its author states are under the Unsplash License and not covered by the MIT licence. They are never shipped or loaded on a client's site: the opening picture, line-up portraits and photo wall show the client's own photographs, or are left out. Only the labelled \"Original template sample\" preview loads them from Unsplash. The font (Asta Sans) is loaded under the SIL Open Font License. The page's \"Design: 8B\" credit is kept.",
      changes: [
        ...COMMON_CHANGES,
        "The K-pop-specific sections (dance battle, venue zones, make-up looks, food street, audience columns) are removed on client sites; the opening, schedule ring, line-up, photo wall, passes, questions and contact are filled with the organiser's data.",
        "The GSAP variant is not used; this is the author's native build with no libraries. An optional scene script is guarded so a site without that section stays quiet.",
      ],
      sampleTokens: ['ONDO', 'Rotterdam', 'Pier Arena', 'Seoul', 'K-pop', 'Nova Nine', 'Seora Kim', 'Halo Kids', 'Moon June', 'Tteokbokki', 'lightstick', 'Maashaven', 'Heat of'],
    },
  }),
  make({
    id: 'festival-cutshort', category: 'festival_concert', name: 'Cut Short',
    tagline: 'A black-and-white, type-led festival site with a title cut out of a film still',
    description: 'A cinematic festival site: a huge title with the last word set over your picture, dates and city, a programme list from your schedule, your tracks as a running list, speakers or guests, questions, passes that link to your ticket page, and contact.',
    designStyle: 'Pure black with white type and one orange accent, giant headline type, hairline rules, scroll-driven reveals with no libraries',
    highlights: ['Giant title with a picture cut-out', 'Programme list from your schedule', 'Tracks as a running list', 'Guests with portraits', 'Passes that link to your ticket page', 'Reduced-motion friendly'],
    pages: ['Opening', 'Programme', 'Tracks', 'Guests', 'FAQ', 'Passes', 'Contact'],
    source: eightB({
      name: 'Cut Short (film festival website template, native build)',
      repoUrl: 'https://github.com/8bsite/film-festival-website-template',
      commit: 'ebc5b7e',
      changes: [
        ...COMMON_CHANGES,
        "The film-specific sections (opening-night feature, film submissions, three-venue track) are removed on client sites; the opening, programme, tracks, guests, questions, passes, contact and footer are filled with the organiser's data.",
        "The GSAP variant is not used; this is the author's native build with no libraries.",
      ],
      sampleTokens: ['Cut Short', 'Glasgow', 'Lucky Star', 'Niamh', 'Kearney', 'Whiteout', 'Aaltonen', 'Carmen Ruiz', 'Fintry', 'Calum Reid', 'Saoirse', 'Tomasz', 'Leila Haddad', 'Mensah', 'Ruaridh', 'Grand Hall', 'Trongate', 'Amaya Ortiz', 'Letterboxd', 'cutshort', 'Scottish Shorts', 'Rescued Reels'],
    }),
  }),
  make({
    id: 'exhibition-nocturna', category: 'exhibition_trade', name: 'Nocturna',
    tagline: 'A dark, scroll-driven exhibition site with a ledger of dates, exhibitor rooms and speaker rows',
    description: 'An exhibition site for a gallery, expo or show: a big opening with your name and a one-line pitch, a dated programme ledger beside a window of your photographs, your exhibitors as framed rooms, your speakers as a list with portraits, passes that link to your ticket page, questions, contact details and a wordmark footer.',
    designStyle: 'Near-black ground with warm coral light, arch-shaped photo windows, oversized grotesque headlines, scroll-driven scenes with no libraries',
    highlights: ['Programme ledger with dates and places', 'Arch window for your photographs', 'Exhibitors as framed rooms (up to four)', 'Speakers as a ruled list with portraits', 'Passes that link to your ticket page (up to three)', 'Reduced-motion friendly'],
    pages: ['Opening', 'Programme', 'Exhibitors', 'Speakers', 'Passes', 'FAQ', 'Contact'],
    source: eightB({
      name: 'Nocturna (art gallery website template, native build)',
      repoUrl: 'https://github.com/8bsite/art-gallery-website-template',
      commit: '6e42c9d',
      changes: [
        ...COMMON_CHANGES,
        "The midnight-screening, relay and journal sections and the contact form are removed on client sites; the opening, programme, exhibitors (the template's \"rooms\"), speakers (its \"artists\"), passes, questions, contact and footer are filled with the organiser's data.",
        "The template's room layout shows up to four exhibitors and its pass stack up to three tickets; further entries are not shown.",
        "The GSAP variant is not used; this is the author's native build with no libraries.",
      ],
      sampleTokens: ['Nocturna', 'Rotterdam', 'Ruben Hale', 'Ines Varga', 'Tomas Reyl', 'Oumar Diallo', 'Lev Aranda', 'Headlights', 'Floorwork', 'Glass Garden', 'Red Silk', 'Amber Hall', 'Red Room', 'Stone Corridor', 'Long Hall', 'Night Pass', 'Patron', 'kunsthalle', 'Auckland', 'Midnight screening', 'Example Street'],
    }),
  }),
  make({
    id: 'exhibition-wrenfield', category: 'exhibition_trade', name: 'Wrenfield',
    tagline: 'A warm, museum-style exhibition site with a sliding hall of exhibitors and a printed-plate feature',
    description: 'An exhibition site with the feel of a museum: your name and dates on a label card, exhibitors sliding past as a row of framed halls, the featured show with your dates, venue and ticket price, a dated programme, tickets, visit and travel information, questions and contact details.',
    designStyle: 'Cream paper tones with amber and ink, hand-printed plate look, sideways-scrolling hall row, label-card tables, scroll-driven scenes with no libraries',
    highlights: ['Exhibitors as a sideways-scrolling row of halls', 'Featured-show panel from your dates, venue and ticket', 'Dated programme list', 'Tickets that link to your ticket page', 'Visit and travel information', 'Reduced-motion friendly'],
    pages: ['Opening', 'Exhibitors', 'About', 'Programme', 'Tickets', 'Visit', 'FAQ', 'Contact'],
    source: eightB({
      name: 'Wrenfield (museum website template, native build)',
      repoUrl: 'https://github.com/8bsite/museum-website-template',
      commit: '8a523f4',
      changes: [
        ...COMMON_CHANGES,
        "The collection-drawers, fieldwork and learning-sessions sections and the two forms are removed on client sites; the opening, exhibitors (the template's \"halls\"), featured show, programme (its \"Lates\"), tickets (its \"membership\" cards), visit information, questions, contact and footer are filled with the organiser's data.",
        "One line was added to the halls scene script so it does nothing when that section is removed (the page would otherwise throw).",
        "The GSAP variant is not used; this is the author's native build with no libraries.",
      ],
      sampleTokens: ['Wrenfield', 'Kingsbridge', 'Monedula', 'Colour of Flight', 'Tiny Naturalists', 'Specimen Detectives', 'Young Curators', 'Jackdaw Ball', 'taxidermist', 'Courtship in the drawers', 'Adopt a specimen', 'Hoverflies', 'Hartmoor', 'Hall of Prints', 'Tide Line', 'Deep time', 'Nepal pheasant', 'Natural History', 'Example Street'],
    }),
  }),
];

export const getEventTemplateList = (): EventTemplateDefinition[] => EVENT_TEMPLATES;
export const getEventTemplateById = (id: string | undefined | null): EventTemplateDefinition | undefined => EVENT_TEMPLATES.find((t) => t.id === id);
export const getEventTemplatesByCategory = (c: EventCategoryId): EventTemplateDefinition[] => EVENT_TEMPLATES.filter((t) => t.category === c);

// Fail fast in development if the registry and the id list disagree (a unit test also checks this).
if (import.meta?.env?.DEV) {
  const reg = EVENT_TEMPLATES.map((t) => t.id).sort().join(',');
  const ids = [...ALL_EVENT_TEMPLATE_IDS].sort().join(',');
  if (reg !== ids) console.error('[event] registry and ids.ts disagree', { reg, ids });
  EVENT_CATEGORY_IDS.forEach((c) => EVENT_TEMPLATES.filter((t) => t.category === c).length === EVENT_TEMPLATE_IDS_BY_CATEGORY[c].length || console.error('[event] category mismatch', c));
}
