import type { NgoArchetypeId } from './ids';
import { ALL_NGO_TEMPLATE_IDS, NGO_ARCHETYPE_IDS, NGO_TEMPLATE_IDS_BY_ARCHETYPE } from './ids';
import type { NgoTemplateDefinition, NgoTemplateSource } from './types';

/**
 * The Social & NGO template library. Every entry is a real, open-licensed third-party website template integrated into DigiVerse
 * (bundle in `public/ngo-templates/<id>/`, upstream LICENSE copied beside it). Nothing here is a DigiVerse-invented design.
 * `source` is filled from the upstream repository and its LICENSE file; see NGO_TEMPLATE_SOURCES.md for the audit trail.
 */

const COMMON_CHANGES = [
  'Sample content (names, places, copy, photographs) replaced with the client\'s data through mapping.json; nothing is invented when data is missing.',
  'Forms, third-party scripts, structured data and unmapped photographs removed from client sites.',
  'The template runs in a sandboxed frame; its own HTML, CSS and scripts are otherwise unchanged.',
];

const eightB = (over: Partial<NgoTemplateSource> & Pick<NgoTemplateSource, 'name' | 'repoUrl' | 'commit' | 'sampleTokens'>): NgoTemplateSource => ({
  kind: 'adapted',
  author: '8B',
  license: 'MIT',
  copyright: 'Copyright (c) 2026 8B (https://8b.com)',
  retrievedAt: '2026-11-18',
  imageNote: 'Upstream loads its photographs from images.unsplash.com under the Unsplash License and says they are not covered by the MIT licence (CREDITS.md). DigiVerse does not ship or load them on client sites; the library preview may show them from Unsplash\'s servers.',
  changes: COMMON_CHANGES,
  ...over,
});

const make = (d: Omit<NgoTemplateDefinition, 'entry' | 'previewImage'> & { entry?: string }): NgoTemplateDefinition => ({
  entry: 'index.html', previewImage: `/images/ngo-templates/${d.id}.jpg`, ...d,
});

export const NGO_TEMPLATES: NgoTemplateDefinition[] = [
  make({
    id: 'grassroots-folder-tabs', archetype: 'grassroots_ngo', name: 'Folder Tabs',
    tagline: 'A warm, colourful community page built from folder-tab cards',
    description: 'A one-page community website with a yellow opening screen, a scrolling drawer of folder cards, a stepped skyline of programme cards, a horizontal story strip and handwritten quote names.',
    designStyle: 'Playful folder tabs, bold grotesk headings, handwritten signatures, scroll-driven motion',
    highlights: ['Scroll-driven drawer and card scenes', 'Colour field per cause', 'Questions that open without JavaScript', 'Reduced-motion friendly'],
    source: eightB({
      name: 'Spare Hour (nonprofit-website-template)', repoUrl: 'https://github.com/8bsite/nonprofit-website-template', commit: 'eb0188a',
      sampleTokens: ['Spare Hour', 'Glasgow', 'Govan', 'Partick', 'Dennistoun', 'Shawlands', 'Margaret', 'PVG'],
    }),
  }),
  make({
    id: 'cause-open-rivers', archetype: 'cause_charity', name: 'Open Rivers',
    tagline: 'A cause told as one long story, chapter by chapter',
    description: 'A dark, photograph-led campaign page: a full-screen opening, three story chapters that each pair a photograph with a headline, impact figures set the width of the page that count up as they arrive, and a closing band that explains how people can help. Best for a single-cause charity with a few programmes and real photographs.',
    designStyle: 'Full-bleed hero, chaptered storytelling, page-wide counting numbers, scroll-revealed photographs',
    highlights: ['Three story chapters from your programmes', 'Page-wide impact figures that count up', 'Scroll-revealed photographs', 'Information-only support band, no payment'],
    source: {
      kind: 'adapted', name: 'Open Rivers', author: 'pinylabs', repoUrl: 'https://github.com/pinylabs/open-rivers', commit: '85ccddd',
      license: 'MIT', copyright: 'Copyright (c) 2026 pinylabs', retrievedAt: '2026-11-18',
      imageNote: "Upstream links four photographs from Unsplash under the Unsplash License (not covered by its MIT licence). DigiVerse never ships them and a live client site never loads them; only the library's \"Original sample\" preview does. The upstream \"Piny Studio\" mark is excluded from the bundle because it is not MIT-covered.",
      changes: [
        ...COMMON_CHANGES,
        "The template's own static build output is used unchanged apart from inlining its one stylesheet.",
        'The donate band (amount picker and payment link) is replaced by an information-only "how to support" band; the header Donate button is removed.',
      ],
      sampleTokens: ['Wend', 'OPEN RIVERS', 'Open Rivers', 'Piny', 'storm drain', 'Trout', 'bathing test'],
    },
  }),
  make({
    id: 'grassroots-kilnfield', archetype: 'grassroots_ngo', name: 'Kilnfield',
    tagline: 'A bold, sporty community-club page with a dealt deck of programme cards',
    description: 'A community club or youth organisation site: a long statement opening with a wide photograph, your programmes dealt like a deck of cards, your values as sweeping bands, your team as rows with portraits, volunteer roles as numbered steps, stories from the people you serve, questions and contact details.',
    designStyle: 'Black, cream and signal-green blocks, heavy wide grotesk headings, scroll-driven deck and band scenes with no libraries',
    highlights: ['Programmes dealt like a deck of cards', 'Values as sweeping bands (up to four)', 'Team as rows with portraits', 'Volunteer roles as numbered steps', 'Stories from the people you serve', 'Reduced-motion friendly'],
    source: eightB({
      name: 'Kilnfield Colts (football-club-website-template, native build)', repoUrl: 'https://github.com/8bsite/football-club-website-template', commit: '8d8c79c', retrievedAt: '2026-11-19',
      changes: [
        ...COMMON_CHANGES,
        "The weekly-calendar, fixtures and fees sections are removed on client sites; programmes, values, team, volunteer roles, stories, questions and contact are filled with the organisation's data.",
        'Four scene or form scripts got a one-line guard so they do nothing when their section is removed (the page would otherwise throw). The GSAP variant is not used.',
      ],
      sampleTokens: ['Kilnfield', 'Colts', 'Armley', 'Leeds', 'Mini Colts', 'Karim', 'Haddad', 'Megan Price', 'Ashworth', 'Aisha Rahman', 'Stanningley', 'Gotts Park', 'Example Lane', 'FA badge', 'bursary'],
    }),
  }),
];

export const getNgoTemplateList = (): NgoTemplateDefinition[] => NGO_TEMPLATES;
export const getNgoTemplateById = (id: string | undefined | null): NgoTemplateDefinition | undefined => NGO_TEMPLATES.find((t) => t.id === id);
export const getNgoTemplatesByArchetype = (a: NgoArchetypeId): NgoTemplateDefinition[] => NGO_TEMPLATES.filter((t) => t.archetype === a);

// Fail fast in development if the registry and the id list disagree (a unit test also checks this).
if (import.meta?.env?.DEV) {
  const reg = NGO_TEMPLATES.map((t) => t.id).sort().join(',');
  const ids = [...ALL_NGO_TEMPLATE_IDS].sort().join(',');
  if (reg !== ids) console.error('[ngo] registry and ids.ts disagree', { reg, ids });
  NGO_ARCHETYPE_IDS.forEach((a) => NGO_TEMPLATES.filter((t) => t.archetype === a).length === NGO_TEMPLATE_IDS_BY_ARCHETYPE[a].length || console.error('[ngo] archetype mismatch', a));
}
