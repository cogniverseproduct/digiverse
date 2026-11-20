import type { ClientRequirements, SelectedTemplateMetadata } from '../../../types/admin';
import type {
  CulturalActivity, CulturalActivityCategory, CulturalDonationInfo, CulturalEvent, CulturalLeader, CulturalMediaItem, CulturalNewsArticle, CulturalRoleCategory,
  CulturalSponsor, CulturalWebsiteData, FestivalType, PujaRitualScheduleItem, PujaThemeDecoration, PujaVisitorGuide
} from '../../../types/cultural';
import type { CulturalCategory } from '../../../templates/cultural/types';

/* ------------------------------------------------------------------ form shape */

/** One card in a repeatable list. Every value is kept as text (or text lists / nested cards) so drafts round-trip and validation is uniform. */
export interface Entry { id: string; [key: string]: string | string[] | Entry[] }

export type ListKey = 'leadership' | 'activities' | 'events' | 'news' | 'sponsors' | 'gallery' | 'membershipTypes' | 'days' | 'themeImages' | 'pastThemes' | 'causes';

export interface IntakeForm {
  v: Record<string, string>;
  lists: Record<ListKey, Entry[]>;
  template: SelectedTemplateMetadata;
}

export type FieldErrors = Record<string, string>;

let uid = 0;
export const newId = (p: string) => `${p}_${Date.now().toString(36)}${(uid++).toString(36)}`;

const LIST_KEYS: ListKey[] = ['leadership', 'activities', 'events', 'news', 'sponsors', 'gallery', 'membershipTypes', 'days', 'themeImages', 'pastThemes', 'causes'];

/** Every field starts empty. Only the chosen template's colours are pre-set; nothing is invented for the client. */
export function emptyForm(template: SelectedTemplateMetadata): IntakeForm {
  const lists = {} as Record<ListKey, Entry[]>;
  LIST_KEYS.forEach((k) => { lists[k] = []; });
  return { v: { primaryColor: template.designTokens?.primaryColor || '', accentColor: template.designTokens?.accentColor || '' }, lists, template };
}

/* ------------------------------------------------------------------ field and step specs */

export type FieldKind = 'text' | 'textarea' | 'lines' | 'select' | 'number' | 'date' | 'email' | 'tel' | 'url' | 'image' | 'color';
export type Opt = { value: string; label: string };

export interface FieldSpec {
  key: string; label: string; kind?: FieldKind; options?: Opt[]; emptyLabel?: string; required?: boolean; hint?: string; placeholder?: string; wide?: boolean;
}

export type SectionSpec =
  | { kind: 'fields'; title?: string; hint?: string; fields: FieldSpec[] }
  | { kind: 'list'; list: ListKey; title: string; hint?: string; addLabel: string; itemLabel: (e: Entry, i: number) => string; fields: FieldSpec[]; blank: () => Entry }
  | { kind: 'template' }
  /** Day-by-day ritual schedule: each day holds its own rituals. */
  | { kind: 'schedule' }
  /** Google Drive gallery/video links and YouTube links (the shared GalleryAndVideoSection). Values live in `v` as newline lists. */
  | { kind: 'media' }
  | { kind: 'review' };

export interface StepSpec { id: string; title: string; subtitle?: string; sections: SectionSpec[] }

const text = (e: Entry, k: string) => (typeof e[k] === 'string' ? (e[k] as string) : '');
const label = (e: Entry, k: string, fallback: string, i: number) => text(e, k).trim() || `${fallback} ${i + 1}`;

export const MEDIA_KEYS = { driveGallery: 'driveGalleryUrl', driveVideos: 'driveVideoUrls', youtube: 'youtubeUrls', playlists: 'youtubePlaylistUrls' } as const;

const FESTIVALS: Opt[] = [
  { value: 'durga_puja', label: 'Durga Puja' }, { value: 'kali_puja', label: 'Kali Puja' }, { value: 'saraswati_puja', label: 'Saraswati Puja' }, { value: 'lakshmi_puja', label: 'Lakshmi Puja' },
  { value: 'jagaddhatri_puja', label: 'Jagaddhatri Puja' }, { value: 'ganesh_utsav', label: 'Ganesh Utsav' }, { value: 'basant_utsav', label: 'Basant Utsav' }, { value: 'general_festival', label: 'Another festival' }
];
const ROLES: Opt[] = [{ value: 'executive', label: 'Executive committee' }, { value: 'advisory', label: 'Advisor' }, { value: 'organizer', label: 'Organiser' }, { value: 'volunteer', label: 'Volunteer' }, { value: 'religious', label: 'Priest / ritual lead' }];
const ACTIVITY_CATEGORIES: Opt[] = [
  { value: 'music', label: 'Music' }, { value: 'dance', label: 'Dance' }, { value: 'theatre', label: 'Theatre' }, { value: 'literary', label: 'Literary' }, { value: 'arts', label: 'Arts & crafts' },
  { value: 'workshop', label: 'Workshop' }, { value: 'competition', label: 'Competition' }, { value: 'heritage', label: 'Heritage' }, { value: 'community', label: 'Community' }
];
const SPONSOR_TIERS: Opt[] = [{ value: 'title', label: 'Title sponsor' }, { value: 'principal', label: 'Principal sponsor' }, { value: 'powered_by', label: 'Powered by' }, { value: 'associate', label: 'Associate sponsor' }, { value: 'community', label: 'Community partner' }];
const THEME_IMAGE_CATEGORIES: Opt[] = [{ value: 'pandal', label: 'Pandal' }, { value: 'pratima', label: 'Idol (pratima)' }, { value: 'lighting', label: 'Lighting' }, { value: 'inauguration', label: 'Inauguration' }];

const leadershipList = (title: string, hint: string): SectionSpec => ({
  kind: 'list', list: 'leadership', title, hint, addLabel: 'Add a member', itemLabel: (e, i) => label(e, 'name', 'Member', i),
  blank: () => ({ id: newId('ld'), name: '', designation: '', roleCategory: 'executive', photo: '', bio: '', email: '', phone: '' }),
  fields: [
    { key: 'name', label: 'Full name', required: true }, { key: 'designation', label: 'Role', required: true, placeholder: 'President' },
    { key: 'roleCategory', label: 'Group', kind: 'select', options: ROLES }, { key: 'photo', label: 'Photo', kind: 'image' },
    { key: 'bio', label: 'Short note', kind: 'textarea', wide: true }, { key: 'email', label: 'Email', kind: 'email' }, { key: 'phone', label: 'Phone', kind: 'tel' }
  ]
});
const activitiesList = (title: string, hint: string): SectionSpec => ({
  kind: 'list', list: 'activities', title, hint, addLabel: 'Add a programme', itemLabel: (e, i) => label(e, 'title', 'Programme', i),
  blank: () => ({ id: newId('act'), title: '', category: '', description: '', schedule: '', venue: '', image: '', registration: '' }),
  fields: [
    { key: 'title', label: 'Programme name', required: true }, { key: 'category', label: 'Kind', kind: 'select', options: ACTIVITY_CATEGORIES, required: true, emptyLabel: 'Choose a kind' },
    { key: 'description', label: 'Description', kind: 'textarea', wide: true, required: true }, { key: 'schedule', label: 'When', placeholder: 'Saturdays, 5:00 pm' }, { key: 'venue', label: 'Where' },
    { key: 'image', label: 'Photo', kind: 'image', wide: true },
    { key: 'registration', label: 'Registration', kind: 'select', options: [{ value: 'yes', label: 'Registration is required' }], emptyLabel: 'No registration needed' }
  ]
});
const newsList: SectionSpec = {
  kind: 'list', list: 'news', title: 'Announcements', hint: 'Real notices only. Leave empty to hide the notices section.', addLabel: 'Add an announcement', itemLabel: (e, i) => label(e, 'title', 'Notice', i),
  blank: () => ({ id: newId('news'), title: '', summary: '', date: '', category: '', image: '' }),
  fields: [{ key: 'title', label: 'Headline', required: true, wide: true }, { key: 'summary', label: 'Details', kind: 'textarea', wide: true, required: true }, { key: 'date', label: 'Date', kind: 'date', required: true }, { key: 'category', label: 'Kind', placeholder: 'Notice, Members, Press…' }, { key: 'image', label: 'Image', kind: 'image', wide: true }]
};
const sponsorsList: SectionSpec = {
  kind: 'list', list: 'sponsors', title: 'Sponsors & partners', hint: 'Only real partners. Leave empty to hide the sponsors section.', addLabel: 'Add a sponsor', itemLabel: (e, i) => label(e, 'name', 'Sponsor', i),
  blank: () => ({ id: newId('sp'), name: '', tier: 'associate', websiteUrl: '', logo: '', description: '' }),
  fields: [{ key: 'name', label: 'Name', required: true }, { key: 'tier', label: 'Level', kind: 'select', options: SPONSOR_TIERS }, { key: 'websiteUrl', label: 'Website', kind: 'url' }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }]
};
const galleryList: SectionSpec = {
  kind: 'list', list: 'gallery', title: 'Photos', hint: 'Real photographs of the organisation and its events. They appear in the gallery. Your logo and cover go in the Branding step, not here.', addLabel: 'Add a photo',
  itemLabel: (e, i) => label(e, 'caption', 'Photo', i), blank: () => ({ id: newId('ph'), url: '', caption: '', category: '' }),
  fields: [{ key: 'url', label: 'Photo', kind: 'image', required: true, wide: true }, { key: 'caption', label: 'Caption' }, { key: 'category', label: 'Group', placeholder: 'Annual day, Rehearsal…' }]
};
const eventsList: SectionSpec = {
  kind: 'list', list: 'events', title: 'Events', hint: 'Real events only. Past events are shown separately.', addLabel: 'Add an event', itemLabel: (e, i) => label(e, 'title', 'Event', i),
  blank: () => ({ id: newId('ev'), title: '', category: '', description: '', startDate: '', endDate: '', time: '', venue: '', image: '', registrationUrl: '', featured: '' }),
  fields: [
    { key: 'title', label: 'Event name', required: true }, { key: 'category', label: 'Kind', placeholder: 'Concert, Exhibition…' }, { key: 'startDate', label: 'Date', kind: 'date', required: true }, { key: 'endDate', label: 'Ends', kind: 'date' },
    { key: 'time', label: 'Time', placeholder: '6:30 pm' }, { key: 'venue', label: 'Venue', required: true }, { key: 'description', label: 'Description', kind: 'textarea', wide: true, required: true },
    { key: 'image', label: 'Image', kind: 'image' }, { key: 'registrationUrl', label: 'Registration link', kind: 'url' },
    { key: 'featured', label: 'Highlight', kind: 'select', options: [{ value: 'yes', label: 'Feature this event' }], emptyLabel: 'Normal' }
  ]
};

const identityStep = (archetype: CulturalCategory): StepSpec => {
  const puja = archetype === 'puja_committee';
  return {
    id: 'identity', title: puja ? 'Committee identity' : 'Identity', subtitle: puja ? 'Who runs the puja.' : 'Who the organisation is.',
    sections: [{ kind: 'fields', fields: [
      { key: 'name', label: puja ? 'Committee / puja name' : 'Organisation name', required: true, wide: true },
      { key: 'nativeName', label: 'Name in Bengali or another script', hint: 'Optional. Shown beside the English name.', wide: true },
      ...(puja ? [{ key: 'festivalType', label: 'Festival', kind: 'select', options: FESTIVALS, required: true, emptyLabel: 'Choose a festival' } as FieldSpec] : []),
      { key: 'founded', label: puja ? 'First puja (year)' : 'Year established', kind: 'number', placeholder: 'e.g. 1958' },
      { key: 'tagline', label: 'Tagline', hint: 'A short line under the name. Optional.', wide: true },
      { key: 'registrationNumber', label: 'Registration number', hint: 'Optional. Only shown if you fill it in.' },
      { key: 'city', label: 'City / town' }, { key: 'state', label: 'State / region' }, { key: 'country', label: 'Country' }
    ] }]
  };
};

const brandingStep: StepSpec = {
  id: 'branding', title: 'Branding & design', subtitle: 'Your template, logo and colours. The colours start from the template and can be changed.',
  sections: [
    { kind: 'template' },
    { kind: 'fields', title: 'Logo, cover image and colours', fields: [
      { key: 'logo', label: 'Logo', kind: 'image', hint: 'Square or transparent works best.' }, { key: 'cover', label: 'Hero / cover image', kind: 'image', hint: 'A wide photograph of the pandal, stage or members.' },
      { key: 'primaryColor', label: 'Primary colour', kind: 'color' }, { key: 'accentColor', label: 'Accent colour', kind: 'color' }
    ] }
  ]
};

const aboutStep = (archetype: CulturalCategory): StepSpec => ({
  id: 'about', title: archetype === 'puja_committee' ? 'History & purpose' : 'About & history', subtitle: 'In the organisation’s own words. Every field is optional.',
  sections: [{ kind: 'fields', fields: [
    { key: 'description', label: 'About us', kind: 'textarea', wide: true }, { key: 'history', label: 'History', kind: 'textarea', wide: true },
    { key: 'mission', label: 'Mission', kind: 'textarea' }, { key: 'vision', label: 'Vision', kind: 'textarea' },
    { key: 'values', label: 'Values', kind: 'lines', hint: 'One per line', wide: true }
  ] }]
});

const contactStep: StepSpec = {
  id: 'contact', title: 'Contact & social', subtitle: 'How visitors reach the organisation. Only the contact email is required.',
  sections: [{ kind: 'fields', fields: [
    { key: 'contactPerson', label: 'Contact person' }, { key: 'email', label: 'Contact email', kind: 'email', required: true }, { key: 'phone', label: 'Phone', kind: 'tel' }, { key: 'whatsapp', label: 'WhatsApp number', kind: 'tel' },
    { key: 'address', label: 'Address / venue', wide: true },
    { key: 'facebook', label: 'Facebook page', kind: 'url' }, { key: 'instagram', label: 'Instagram', kind: 'url' }, { key: 'twitter', label: 'X (Twitter)', kind: 'url' }, { key: 'youtube', label: 'YouTube channel', kind: 'url' }
  ] }]
};
const reviewStep: StepSpec = { id: 'review', title: 'Review & generate', subtitle: 'Check what will appear on the website, then create it.', sections: [{ kind: 'review' }] };
const mediaStep: StepSpec = { id: 'gallery', title: 'Gallery & video', sections: [galleryList, { kind: 'media' }] };

const ASSOCIATION_STEPS: StepSpec[] = [
  identityStep('cultural_society'), brandingStep, aboutStep('cultural_society'),
  { id: 'committee', title: 'Committee & leadership', sections: [leadershipList('Office-bearers and members', 'Only people who actually serve. Add them with their permission. Leave empty to hide the section.')] },
  { id: 'programmes', title: 'Programmes & activities', sections: [activitiesList('Programmes', 'Classes, workshops and regular activities the organisation really runs.')] },
  { id: 'events', title: 'Events', sections: [eventsList] },
  mediaStep,
  { id: 'news', title: 'Announcements', sections: [newsList] },
  { id: 'sponsors', title: 'Sponsors & partners', sections: [sponsorsList] },
  { id: 'membership', title: 'Membership', subtitle: 'Shown only if you add a membership type or notes.', sections: [
    { kind: 'list', list: 'membershipTypes', title: 'Membership types', addLabel: 'Add a membership type', itemLabel: (e, i) => label(e, 'name', 'Membership', i),
      blank: () => ({ id: newId('mem'), name: '', fee: '', benefits: '' }),
      fields: [{ key: 'name', label: 'Name', required: true, placeholder: 'Individual' }, { key: 'fee', label: 'Fee', placeholder: '₹600 a year' }, { key: 'benefits', label: 'Benefits', kind: 'lines', hint: 'One per line', wide: true }] },
    { kind: 'fields', fields: [{ key: 'memGuidelines', label: 'How to join', kind: 'textarea', wide: true }] }
  ] },
  contactStep, reviewStep
];

const PUJA_STEPS: StepSpec[] = [
  identityStep('puja_committee'), brandingStep, aboutStep('puja_committee'),
  { id: 'committee', title: 'Committee', sections: [leadershipList('Committee and organisers', 'Only real members, added with their permission. Leave empty to hide the section.')] },
  { id: 'schedule', title: 'Puja schedule', subtitle: 'Day by day. Enter only what the committee has confirmed: dates, tithis and timings are never made up.', sections: [{ kind: 'schedule' }] },
  { id: 'theme', title: 'Theme & pandal', subtitle: 'This year’s theme. Leave blank if it is not announced yet.', sections: [
    { kind: 'fields', fields: [
      { key: 'themeName', label: 'Theme name' }, { key: 'themeNameNative', label: 'Theme name in Bengali or another script' }, { key: 'editionYear', label: 'Edition', placeholder: 'e.g. 2026 · 68th year' },
      { key: 'themeConcept', label: 'Concept', kind: 'textarea', wide: true }, { key: 'themeStory', label: 'The story behind it', kind: 'textarea', wide: true },
      { key: 'idolArtisan', label: 'Idol and artisan' }, { key: 'pandalArchitecture', label: 'Pandal design' }, { key: 'lightingConcept', label: 'Lighting' }
    ] },
    { kind: 'list', list: 'themeImages', title: 'Theme photographs', addLabel: 'Add a photograph', itemLabel: (e, i) => label(e, 'caption', 'Photograph', i), blank: () => ({ id: newId('ti'), url: '', caption: '', category: 'pandal' }),
      fields: [{ key: 'url', label: 'Photo', kind: 'image', required: true, wide: true }, { key: 'caption', label: 'Caption', required: true }, { key: 'category', label: 'Shows', kind: 'select', options: THEME_IMAGE_CATEGORIES }] },
    { kind: 'list', list: 'pastThemes', title: 'Previous years', addLabel: 'Add a previous year', itemLabel: (e, i) => text(e, 'year') ? `${text(e, 'year')}: ${text(e, 'themeName')}` : `Year ${i + 1}`,
      blank: () => ({ id: newId('pt'), year: '', themeName: '', description: '' }),
      fields: [{ key: 'year', label: 'Year', kind: 'number', required: true }, { key: 'themeName', label: 'Theme', required: true }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }] }
  ] },
  { id: 'visitor', title: 'Visitor guide', subtitle: 'Where the pandal is and how to visit. Add it only if you have it.', sections: [{ kind: 'fields', fields: [
    { key: 'pandalLocation', label: 'Pandal location', wide: true }, { key: 'landmark', label: 'Landmark' }, { key: 'visitingHours', label: 'Visiting hours', placeholder: '9:00 am to 11:00 pm' },
    { key: 'nearestMetro', label: 'Nearest metro' }, { key: 'nearestRailway', label: 'Nearest railway station' }, { key: 'nearestBusStop', label: 'Nearest bus stop' },
    { key: 'parkingInfo', label: 'Parking', wide: true }, { key: 'vipPassInfo', label: 'Passes / entry', wide: true },
    { key: 'crowdGuidelines', label: 'Crowd guidelines', kind: 'lines', hint: 'One per line', wide: true }, { key: 'safetyAccessibility', label: 'Safety and accessibility', kind: 'lines', hint: 'One per line', wide: true },
    { key: 'emergencyPhone', label: 'Emergency contact number', kind: 'tel' }
  ] }] },
  { id: 'programmes', title: 'Cultural programmes', sections: [activitiesList('Cultural programmes', 'Evenings of music, dance, drama and contests during the puja.')] },
  { id: 'news', title: 'Announcements', sections: [newsList] },
  mediaStep,
  { id: 'sponsors', title: 'Sponsors & partners', sections: [sponsorsList] },
  { id: 'donation', title: 'Donations', subtitle: 'Shown only if you fill it in. DigiVerse does not collect money: visitors are told how to contact you.', sections: [
    { kind: 'fields', fields: [
      { key: 'donTitle', label: 'Appeal title' }, { key: 'donMessage', label: 'Appeal message', kind: 'textarea', wide: true }, { key: 'donTransparency', label: 'How funds are accounted for', kind: 'textarea', wide: true },
      { key: 'donContact', label: 'How to contribute', kind: 'textarea', wide: true, hint: 'For example “Contact the treasurer at the committee office”.' }, { key: 'donTax', label: 'Tax exemption note', kind: 'textarea', wide: true }
    ] },
    { kind: 'list', list: 'causes', title: 'What donations support', addLabel: 'Add a cause', itemLabel: (e, i) => label(e, 'title', 'Cause', i), blank: () => ({ id: newId('cause'), title: '', description: '', amounts: '' }),
      fields: [{ key: 'title', label: 'Cause', required: true }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }, { key: 'amounts', label: 'Suggested amounts', hint: 'Whole numbers, separated by commas', placeholder: '250, 500, 1000' }] }
  ] },
  contactStep, reviewStep
];

export const STEPS: Record<CulturalCategory, StepSpec[]> = { cultural_society: ASSOCIATION_STEPS, puja_committee: PUJA_STEPS };
export const CATEGORY_LABEL: Record<CulturalCategory, string> = { cultural_society: 'Cultural association', puja_committee: 'Puja committee' };

/* ------------------------------------------------------------------ schedule (days with nested rituals) */

export const blankDay = (): Entry => ({ id: newId('day'), dayName: '', dayNameNative: '', date: '', tithiInfo: '', rituals: [] });
export const blankRitual = (): Entry => ({ id: newId('rit'), time: '', name: '', nameNative: '', description: '', key: '' });

/* ------------------------------------------------------------------ pruning and validation */

const sameValue = (a: unknown, b: unknown): boolean => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => sameValue(x, b[i])) : a === b);
const isBlankEntry = (e: Entry, blank: Entry): boolean => Object.keys(blank).every((k) => k === 'id' || sameValue(e[k], blank[k]));

const BLANKS = {} as Record<ListKey, () => Entry>;
[ASSOCIATION_STEPS, PUJA_STEPS].forEach((steps) => steps.forEach((s) => s.sections.forEach((sec) => { if (sec.kind === 'list') BLANKS[sec.list] = sec.blank; })));
BLANKS.days = blankDay;
const RITUAL_BLANK = blankRitual();
const pruneDay = (d: Entry): Entry => ({ ...d, rituals: ((d.rituals as Entry[]) || []).filter((r) => !isBlankEntry(r, RITUAL_BLANK)) });

/** Drop cards that were added but never filled in. A day card is kept while it has a name, date, tithi or any ritual. */
export function pruneBlank(f: IntakeForm): IntakeForm {
  const lists = { ...f.lists };
  LIST_KEYS.forEach((k) => {
    const blank = BLANKS[k]();
    lists[k] = (f.lists[k] || []).map((e) => (k === 'days' ? pruneDay(e) : e)).filter((e) => (k === 'days' ? !(isBlankEntry({ ...e, rituals: [] }, blank) && !((e.rituals as Entry[]) || []).length) : !isBlankEntry(e, blank)));
  });
  return { ...f, lists };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const HEX = /^#[0-9a-fA-F]{6}$/;
const isInt = (s: string) => /^\d+$/.test(s.trim());
const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '');

function fieldError(spec: FieldSpec, value: unknown): string | undefined {
  const s = typeof value === 'string' ? value.trim() : '';
  if (spec.required && !filled(value)) return `${spec.label} is required.`;
  if (!filled(value)) return undefined;
  switch (spec.kind) {
    case 'email': return EMAIL.test(s) ? undefined : 'Enter a valid email address.';
    case 'url': return isUrl(s) ? undefined : 'Enter a full link starting with https://';
    case 'number': return isInt(s) ? undefined : 'Use whole numbers only.';
    case 'color': return HEX.test(s) ? undefined : 'Use a hex colour such as #7A1F2B.';
    default: return undefined;
  }
}

export const errKey = (list: ListKey | string, id: string, field: string) => `${list}:${id}:${field}`;
const anyOf = (v: Record<string, string>, keys: string[]) => keys.some((k) => filled(v[k]));
const GUIDE_KEYS = ['pandalLocation', 'landmark', 'visitingHours', 'nearestMetro', 'nearestRailway', 'nearestBusStop', 'parkingInfo', 'vipPassInfo', 'crowdGuidelines', 'safetyAccessibility', 'emergencyPhone'];
const DONATION_KEYS = ['donTitle', 'donMessage', 'donTransparency', 'donContact', 'donTax'];
const THEME_KEYS = ['themeName', 'themeNameNative', 'editionYear', 'themeConcept', 'themeStory', 'idolArtisan', 'pandalArchitecture', 'lightingConcept'];

/** Validate one step. Keys: scalar field key, or `list:entryId:field`, or `list` for a whole-section problem. */
export function validateStep(stepIndex: number, form: IntakeForm, category: CulturalCategory): FieldErrors {
  const step = STEPS[category][stepIndex - 1];
  const errors: FieldErrors = {};
  if (!step) return errors;
  const clean = pruneBlank(form);
  const { v } = clean;
  for (const sec of step.sections) {
    if (sec.kind === 'fields') {
      sec.fields.forEach((f) => { const m = fieldError(f, v[f.key] ?? ''); if (m) errors[f.key] = m; });
      if (step.id === 'identity' && v.founded && (Number(v.founded) < 1000 || Number(v.founded) > new Date().getFullYear())) errors.founded = `Enter a year between 1000 and ${new Date().getFullYear()}.`;
      if (step.id === 'visitor' && anyOf(v, GUIDE_KEYS)) {
        if (!filled(v.pandalLocation)) errors.pandalLocation = 'Add the pandal location, or clear the other visitor details.';
        if (!filled(v.visitingHours)) errors.visitingHours = 'Add the visiting hours, or clear the other visitor details.';
      }
      if (step.id === 'theme' && anyOf(v, THEME_KEYS)) {
        if (!filled(v.themeName)) errors.themeName = 'Name the theme, or clear the other theme details.';
        if (!filled(v.themeConcept)) errors.themeConcept = 'Describe the concept, or clear the other theme details.';
        if (!filled(v.editionYear)) errors.editionYear = 'Add the edition (for example “2026”), or clear the other theme details.';
      }
      if (step.id === 'donation' && anyOf(v, DONATION_KEYS)) {
        if (!filled(v.donMessage)) errors.donMessage = 'Add the appeal message, or clear the other donation details.';
        if (!filled(v.donContact)) errors.donContact = 'Say how people can contribute, or clear the other donation details.';
      }
    }
    if (sec.kind === 'list') {
      for (const e of clean.lists[sec.list]) {
        sec.fields.forEach((f) => { const m = fieldError(f, e[f.key]); if (m) errors[errKey(sec.list, e.id, f.key)] = m; });
        if (sec.list === 'events' && filled(e.endDate) && filled(e.startDate) && text(e, 'endDate') < text(e, 'startDate')) errors[errKey('events', e.id, 'endDate')] = 'The end date cannot be before the start date.';
        if (sec.list === 'causes' && filled(e.amounts) && !text(e, 'amounts').split(',').map((x) => x.trim()).filter(Boolean).every(isInt)) errors[errKey('causes', e.id, 'amounts')] = 'Use whole numbers separated by commas.';
        if (sec.list === 'pastThemes' && filled(e.year) && (Number(text(e, 'year')) < 1000 || Number(text(e, 'year')) > new Date().getFullYear())) errors[errKey('pastThemes', e.id, 'year')] = 'Enter a real year.';
      }
    }
    if (sec.kind === 'schedule') {
      for (const d of clean.lists.days) {
        if (!filled(d.dayName)) errors[errKey('days', d.id, 'dayName')] = 'Name this day, for example “Maha Ashtami”.';
        if (!filled(d.date)) errors[errKey('days', d.id, 'date')] = 'Choose the date.';
        for (const r of (d.rituals as Entry[]) || []) {
          if (!filled(r.name)) errors[errKey('days', r.id, 'name')] = 'Name the ritual.';
          if (!filled(r.time)) errors[errKey('days', r.id, 'time')] = 'Add the time.';
        }
      }
    }
    if (sec.kind === 'media') {
      const bad = (key: string) => String(v[key] ?? '').split('\n').map((l) => l.trim()).filter(Boolean).some((l) => !isUrl(l));
      if (bad(MEDIA_KEYS.youtube) || bad(MEDIA_KEYS.playlists)) errors[MEDIA_KEYS.youtube] = 'Each YouTube link must be a full link starting with https://';
      if (bad(MEDIA_KEYS.driveVideos)) errors[MEDIA_KEYS.driveVideos] = 'Each Google Drive link must be a full link starting with https://';
      if (v[MEDIA_KEYS.driveGallery] && !isUrl(String(v[MEDIA_KEYS.driveGallery]).trim())) errors[MEDIA_KEYS.driveGallery] = 'Enter the full Google Drive folder link.';
    }
  }
  return errors;
}

export function validateAll(form: IntakeForm, category: CulturalCategory): { step: number; errors: FieldErrors }[] {
  const out: { step: number; errors: FieldErrors }[] = [];
  STEPS[category].forEach((_, i) => { const errors = validateStep(i + 1, form, category); if (Object.keys(errors).length) out.push({ step: i + 1, errors }); });
  return out;
}

/* ------------------------------------------------------------------ build requirements */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number | undefined => (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : undefined);
const lines = (v: unknown) => str(v).split('\n').map((l) => l.trim()).filter(Boolean);
const opt = (s: string) => (s ? s : undefined);
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function buildRequirements(input: IntakeForm, category: CulturalCategory): ClientRequirements {
  const f = pruneBlank(input);
  const v = f.v; const L = f.lists;
  const puja = category === 'puja_committee';
  const name = str(v.name);
  const city = str(v.city); const state = str(v.state); const country = str(v.country);
  const location = [city, state, country].filter(Boolean).join(', ');
  const primaryColor = HEX.test(str(v.primaryColor)) ? str(v.primaryColor) : (f.template.designTokens?.primaryColor || '#7A1F2B');
  const accentColor = HEX.test(str(v.accentColor)) ? str(v.accentColor) : (f.template.designTokens?.accentColor || '#B8893C');

  const leadership: CulturalLeader[] = L.leadership.map((e, i) => ({ id: e.id, name: str(e.name), designation: str(e.designation), roleCategory: (str(e.roleCategory) || 'executive') as CulturalRoleCategory, profileImageUrl: opt(str(e.photo)), bio: opt(str(e.bio)), email: opt(str(e.email)), phone: opt(str(e.phone)), displayOrder: i + 1 }));
  const activities: CulturalActivity[] = L.activities.map((e) => ({ id: e.id, title: str(e.title), category: str(e.category) as CulturalActivityCategory, description: str(e.description), schedule: opt(str(e.schedule)), venue: opt(str(e.venue)), featuredImageUrl: opt(str(e.image)), isUpcoming: true, registrationRequired: str(e.registration) === 'yes' || undefined }));
  const today = todayIso();
  const events: CulturalEvent[] = L.events.map((e) => {
    const start = str(e.startDate); const end = str(e.endDate);
    return { id: e.id, title: str(e.title), category: str(e.category) || 'Event', description: str(e.description), startDate: start, endDate: opt(end), time: str(e.time), venue: str(e.venue), featuredImageUrl: opt(str(e.image)), registrationUrl: opt(str(e.registrationUrl)), isFeatured: str(e.featured) === 'yes' || undefined, status: (end || start) < today ? 'completed' : 'upcoming' };
  });
  const news: CulturalNewsArticle[] = L.news.map((e) => ({ id: e.id, title: str(e.title), publishedAt: str(e.date), category: str(e.category) || 'Notice', summary: str(e.summary), content: str(e.summary), coverImageUrl: opt(str(e.image)), isPublished: true }));
  const sponsors: CulturalSponsor[] = L.sponsors.map((e) => ({ id: e.id, name: str(e.name), tier: (str(e.tier) || 'associate') as CulturalSponsor['tier'], logoUrl: opt(str(e.logo)), websiteUrl: opt(str(e.websiteUrl)), description: opt(str(e.description)) }));
  const gallery: CulturalMediaItem[] = L.gallery.map((e) => ({ id: e.id, title: str(e.caption) || 'Photo', category: str(e.category) || 'Gallery', imageUrl: str(e.url), caption: opt(str(e.caption)) }));

  const tiers = L.membershipTypes.map((e) => ({ name: str(e.name), fee: str(e.fee), benefits: lines(e.benefits) }));
  const membershipInfo = !puja && (tiers.length || str(v.memGuidelines)) ? { enabled: true, membershipTypes: tiers, guidelines: opt(str(v.memGuidelines)) } : undefined;

  const pujaSchedule: PujaRitualScheduleItem[] | undefined = puja ? L.days.map((d) => ({
    id: d.id, dayName: str(d.dayName), dayNameNative: opt(str(d.dayNameNative)), date: str(d.date), tithiInfo: opt(str(d.tithiInfo)),
    rituals: ((d.rituals as Entry[]) || []).map((r) => ({ time: str(r.time), name: str(r.name), nameNative: opt(str(r.nameNative)), description: opt(str(r.description)), isKeyRitual: str(r.key) === 'yes' || undefined }))
  })) : undefined;
  const hasTheme = puja && anyOf(v, THEME_KEYS);
  const pujaTheme: PujaThemeDecoration | undefined = hasTheme ? {
    currentThemeName: str(v.themeName), currentThemeNameNative: opt(str(v.themeNameNative)), editionYear: str(v.editionYear), themeConcept: str(v.themeConcept), themeStory: opt(str(v.themeStory)),
    idolArtisan: opt(str(v.idolArtisan)), pandalArchitecture: opt(str(v.pandalArchitecture)), lightingConcept: opt(str(v.lightingConcept)),
    themeImages: L.themeImages.map((e) => ({ url: str(e.url), caption: str(e.caption), category: (str(e.category) || 'pandal') as PujaThemeDecoration['themeImages'][number]['category'] })),
    pastThemes: L.pastThemes.map((e) => ({ year: Number(str(e.year)), themeName: str(e.themeName), description: str(e.description) }))
  } : undefined;
  const visitorGuide: PujaVisitorGuide | undefined = puja && anyOf(v, GUIDE_KEYS) ? {
    pandalLocation: str(v.pandalLocation), landmark: opt(str(v.landmark)), nearestMetro: opt(str(v.nearestMetro)), nearestRailway: opt(str(v.nearestRailway)), nearestBusStop: opt(str(v.nearestBusStop)), parkingInfo: opt(str(v.parkingInfo)),
    visitingHours: str(v.visitingHours), vipPassInfo: opt(str(v.vipPassInfo)), crowdGuidelines: lines(v.crowdGuidelines), safetyAccessibility: lines(v.safetyAccessibility), emergencyContactPhone: opt(str(v.emergencyPhone))
  } : undefined;
  const donationInfo: CulturalDonationInfo | undefined = puja && anyOf(v, DONATION_KEYS) ? {
    campaignTitle: str(v.donTitle), appealMessage: str(v.donMessage), transparencyNote: str(v.donTransparency), contactForDonations: str(v.donContact), taxExemptionNote: opt(str(v.donTax)),
    causes: L.causes.map((e) => ({ id: e.id, title: str(e.title), description: str(e.description), suggestedAmounts: str(e.amounts).split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0) }))
  } : undefined;

  const socialLinks: Record<string, string> = {};
  (['facebook', 'instagram', 'twitter', 'youtube', 'whatsapp'] as const).forEach((k) => { if (str(v[k])) socialLinks[k] = str(v[k]); });
  const youtubeUrls = lines(v.youtubeUrls);
  const youtubePlaylistUrls = lines(v.youtubePlaylistUrls);
  const googleDriveVideoUrls = lines(v.driveVideoUrls);
  const googleDriveGalleryUrl = opt(str(v.driveGalleryUrl));
  const hasGalleryMedia = gallery.length > 0 || Boolean(googleDriveGalleryUrl) || youtubeUrls.length > 0 || youtubePlaylistUrls.length > 0 || googleDriveVideoUrls.length > 0 || Boolean(pujaTheme?.themeImages.length);

  const culturalData: CulturalWebsiteData = {
    schemaVersion: '1.0', websiteType: category, festivalType: puja ? ((str(v.festivalType) || 'general_festival') as FestivalType) : undefined,
    organization: {
      name, nativeName: opt(str(v.nativeName)), type: category, establishedYear: num(v.founded), registrationNumber: opt(str(v.registrationNumber)), tagline: opt(str(v.tagline)),
      description: str(v.description), history: opt(str(v.history)), mission: opt(str(v.mission)), vision: opt(str(v.vision)), coreValues: lines(v.values),
      headquarters: str(v.address), city, state, country, contactPerson: str(v.contactPerson), contactEmail: str(v.email).toLowerCase(), contactPhone: str(v.phone), socialLinks
    },
    branding: { primaryLogoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), primaryColor, accentColor, typographyStyle: 'heritage', preferredTheme: f.template.templateId },
    leadership, activities, events, gallery, sponsors, news, donationInfo, membershipInfo, pujaSchedule, pujaTheme, visitorGuide,
    dataAvailability: {
      leadership: leadership.length > 0, activities: activities.length > 0, events: events.length > 0, gallery: gallery.length > 0, sponsors: sponsors.length > 0, news: news.length > 0,
      pujaSchedule: Boolean(pujaSchedule?.length), pujaTheme: Boolean(pujaTheme), visitorGuide: Boolean(visitorGuide), donationInfo: Boolean(donationInfo), membership: Boolean(membershipInfo)
    }
  };

  return {
    organizationName: name, category: puja ? 'puja_committee' : 'cultural', organizationType: puja ? 'puja_committee' : 'cultural', culturalArchetype: category,
    tagline: str(v.tagline), aboutText: [str(v.description), str(v.history)].filter(Boolean).join('\n\n'),
    contactPerson: opt(str(v.contactPerson)), contactEmail: str(v.email).toLowerCase(), contactPhone: str(v.phone),
    address: [str(v.address), location].filter(Boolean).join(', ') || undefined,
    logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), additionalBrandingImages: [],
    primaryColor, accentColor, typographyStyle: 'heritage', websiteLanguage: 'bilingual', preferredLanguage: 'bilingual',
    youtubeUrls, youtubePlaylistUrls, googleDriveGalleryUrl, googleDriveVideoUrls, socialLinks,
    requiredPages: { home: true, about: true, events: events.length > 0 || Boolean(pujaSchedule?.length), committee: leadership.length > 0, gallery: hasGalleryMedia, announcements: news.length > 0, contact: true },
    enabledSections: { hero: true, events: events.length > 0 || Boolean(pujaSchedule?.length), about: true, committee: leadership.length > 0, gallery: hasGalleryMedia, contact: true },
    events: events.map((e) => ({ id: e.id, title: e.title, date: e.startDate, time: e.time, venue: e.venue, category: e.category })),
    committee: leadership.map((l) => ({ id: l.id, name: l.name, role: l.designation, department: l.roleCategory })),
    gallery: [],
    designSelection: { mode: 'template' },
    selectedTemplate: f.template,
    culturalData
  } as unknown as ClientRequirements;
}

/* ------------------------------------------------------------------ drafts */

const draftKey = (scope: string, category: string) => `dv:cultural-draft:${scope}:${category}`;
interface DraftEnvelope { version: 1; step: number; savedAt: string; form: IntakeForm }

/** Browser-local drafts. Every call is guarded: storage can be blocked or full. */
export const drafts = {
  available(): boolean {
    try { const k = '__dv_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch { return false; }
  },
  save(scope: string, category: string, step: number, form: IntakeForm): { ok: boolean; savedAt?: string; error?: string } {
    try {
      const env: DraftEnvelope = { version: 1, step, savedAt: new Date().toISOString(), form };
      window.localStorage.setItem(draftKey(scope, category), JSON.stringify(env));
      return { ok: true, savedAt: env.savedAt };
    } catch (e) { return { ok: false, error: e instanceof Error && /quota/i.test(e.message) ? 'Browser storage is full, so the draft could not be saved.' : 'The draft could not be saved in this browser.' }; }
  },
  load(scope: string, category: string): DraftEnvelope | null {
    try {
      const raw = window.localStorage.getItem(draftKey(scope, category));
      if (!raw) return null;
      const env = JSON.parse(raw) as DraftEnvelope;
      return env && env.version === 1 && env.form && typeof env.form === 'object' ? env : null;
    } catch { return null; }
  },
  clear(scope: string, category: string) { try { window.localStorage.removeItem(draftKey(scope, category)); } catch { /* ignore */ } }
};

/** Merge a stored draft over a fresh form so lists added in newer versions never come back undefined. */
export function mergeDraft(base: IntakeForm, saved: IntakeForm): IntakeForm {
  const lists = { ...base.lists };
  LIST_KEYS.forEach((k) => { if (Array.isArray(saved.lists?.[k])) lists[k] = saved.lists[k]; });
  return { ...base, v: { ...base.v, ...(saved.v || {}) }, lists };
}

/** Does the form hold anything the Admin typed? Used to decide whether a draft is worth keeping. */
export const hasContent = (f: IntakeForm) => Object.entries(f.v).some(([k, x]) => k !== 'primaryColor' && k !== 'accentColor' && Boolean(x)) || LIST_KEYS.some((k) => f.lists[k].length > 0);
