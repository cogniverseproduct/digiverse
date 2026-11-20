import type { ClientRequirements, SelectedTemplateMetadata } from '../../../types/admin';
import type {
  NGOFAQItem, NGOImpactStat, NGOMediaItem, NGOPerson, NGOProgram, NGOStory, NGOUpdateItem, NGOVolunteerOpportunity, NGOWebsiteData
} from '../../../types/ngo';
import type { NgoArchetypeId } from '../../../templates/ngo/ids';

/* ------------------------------------------------------------------ form shape */

/** One card in a repeatable list. Every value is text (or a list of text) so drafts round-trip and validation is uniform. */
export interface Entry { id: string; [key: string]: string | string[] | Entry[] }

export type ListKey = 'programs' | 'stats' | 'leadership' | 'gallery' | 'roles' | 'updates' | 'stories' | 'faqs';
const LIST_KEYS: ListKey[] = ['programs', 'stats', 'leadership', 'gallery', 'roles', 'updates', 'stories', 'faqs'];

export interface IntakeForm {
  v: Record<string, string>;
  lists: Record<ListKey, Entry[]>;
  template: SelectedTemplateMetadata;
}

export type FieldErrors = Record<string, string>;

let uid = 0;
export const newId = (p: string) => `${p}_${Date.now().toString(36)}${(uid++).toString(36)}`;

/** Every field starts empty. Nothing is invented for the organisation, and the template brings its own colours. */
export function emptyForm(template: SelectedTemplateMetadata): IntakeForm {
  const lists = {} as Record<ListKey, Entry[]>;
  LIST_KEYS.forEach((k) => { lists[k] = []; });
  return { v: {}, lists, template };
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
  /** Google Drive gallery/video links and YouTube links (the shared GalleryAndVideoSection). Values live in `v` as newline lists. */
  | { kind: 'media' }
  | { kind: 'review' };

export interface StepSpec { id: string; title: string; subtitle?: string; sections: SectionSpec[] }

const text = (e: Entry, k: string) => (typeof e[k] === 'string' ? (e[k] as string) : '');
const label = (e: Entry, k: string, fallback: string, i: number) => text(e, k).trim() || `${fallback} ${i + 1}`;

export const MEDIA_KEYS = { driveGallery: 'driveGalleryUrl', driveVideos: 'driveVideoUrls', youtube: 'youtubeUrls', playlists: 'youtubePlaylistUrls' } as const;

export const ARCHETYPE_LABEL: Record<NgoArchetypeId, string> = {
  grassroots_ngo: 'Grassroots Impact & Community NGO',
  institutional_foundation: 'Institutional Foundation & Trust',
  cause_charity: 'Visual Storytelling & Cause Charity'
};

const PROGRAM_STATUS: Opt[] = [{ value: 'active', label: 'Active' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }];
const TIERS: Opt[] = [
  { value: 'founder', label: 'Founder' }, { value: 'board', label: 'Board / trustee' }, { value: 'executive', label: 'Executive team' },
  { value: 'advisor', label: 'Advisor' }, { value: 'team', label: 'Team member' }
];
const UPDATE_KINDS: Opt[] = [
  { value: 'announcement', label: 'Announcement' }, { value: 'news', label: 'News' }, { value: 'event', label: 'Event' },
  { value: 'campaign', label: 'Campaign' }, { value: 'project', label: 'Project update' }, { value: 'success_story', label: 'Success story' }
];

const programsList: SectionSpec = {
  kind: 'list', list: 'programs', title: 'Programmes', hint: 'The work you actually do. Leave empty to hide the programmes section.', addLabel: 'Add a programme', itemLabel: (e, i) => label(e, 'title', 'Programme', i),
  blank: () => ({ id: newId('prog'), title: '', category: '', summary: '', description: '', beneficiary: '', locations: '', outcomes: '', image: '', status: 'active' }),
  fields: [
    { key: 'title', label: 'Programme name', required: true }, { key: 'category', label: 'Focus area', placeholder: 'Food, Education, Health…' },
    { key: 'summary', label: 'One-line summary', required: true, wide: true }, { key: 'description', label: 'Full description', kind: 'textarea', wide: true },
    { key: 'beneficiary', label: 'Who it helps' }, { key: 'status', label: 'Status', kind: 'select', options: PROGRAM_STATUS },
    { key: 'locations', label: 'Where it runs (one per line)', kind: 'lines' }, { key: 'outcomes', label: 'Outcomes you can stand behind (one per line)', kind: 'lines' },
    { key: 'image', label: 'Photo', kind: 'image', wide: true }
  ]
};
const statsList: SectionSpec = {
  kind: 'list', list: 'stats', title: 'Impact figures', hint: 'Only figures you can verify. Leave empty to hide them. Nothing is estimated for you.', addLabel: 'Add a figure', itemLabel: (e, i) => label(e, 'label', 'Figure', i),
  blank: () => ({ id: newId('stat'), value: '', label: '', description: '' }),
  fields: [{ key: 'value', label: 'Figure', required: true, placeholder: '1,200' }, { key: 'label', label: 'What it counts', required: true, placeholder: 'Households supported' }, { key: 'description', label: 'Note', wide: true }]
};
const leadershipList: SectionSpec = {
  kind: 'list', list: 'leadership', title: 'People', hint: 'Trustees, leaders and team members you want shown. Leave empty to hide the section.', addLabel: 'Add a person', itemLabel: (e, i) => label(e, 'name', 'Person', i),
  blank: () => ({ id: newId('ld'), name: '', role: '', tier: 'team', bio: '', photo: '', linkedin: '' }),
  fields: [
    { key: 'name', label: 'Full name', required: true }, { key: 'role', label: 'Role', required: true, placeholder: 'Chairperson' }, { key: 'tier', label: 'Group', kind: 'select', options: TIERS },
    { key: 'photo', label: 'Photo', kind: 'image' }, { key: 'bio', label: 'Short biography', kind: 'textarea', wide: true }, { key: 'linkedin', label: 'LinkedIn link', kind: 'url' }
  ]
};
const galleryList: SectionSpec = {
  kind: 'list', list: 'gallery', title: 'Photographs', hint: 'Real photographs of your work. Your logo and cover go in the Branding step, not here.', addLabel: 'Add a photo', itemLabel: (e, i) => label(e, 'caption', 'Photo', i),
  blank: () => ({ id: newId('ph'), url: '', caption: '' }),
  fields: [{ key: 'url', label: 'Photo', kind: 'image', required: true, wide: true }, { key: 'caption', label: 'Caption', wide: true }]
};
const rolesList: SectionSpec = {
  kind: 'list', list: 'roles', title: 'Volunteer roles', hint: 'Real roles only. Leave empty if you are not recruiting.', addLabel: 'Add a role', itemLabel: (e, i) => label(e, 'name', 'Role', i),
  blank: () => ({ id: newId('role'), name: '', department: '', location: '', commitment: '', requirements: '' }),
  fields: [
    { key: 'name', label: 'Role', required: true }, { key: 'department', label: 'Team' }, { key: 'location', label: 'Where' }, { key: 'commitment', label: 'Time needed', placeholder: 'Saturdays, 2 hours' },
    { key: 'requirements', label: 'What helps (one per line)', kind: 'lines', wide: true }
  ]
};
const updatesList: SectionSpec = {
  kind: 'list', list: 'updates', title: 'News and updates', hint: 'Real announcements only. Leave empty to hide the updates section.', addLabel: 'Add an update', itemLabel: (e, i) => label(e, 'title', 'Update', i),
  blank: () => ({ id: newId('upd'), title: '', kind: 'announcement', date: '', summary: '', image: '', link: '' }),
  fields: [
    { key: 'title', label: 'Headline', required: true, wide: true }, { key: 'kind', label: 'Type', kind: 'select', options: UPDATE_KINDS }, { key: 'date', label: 'Date', kind: 'date' },
    { key: 'summary', label: 'Details', kind: 'textarea', required: true, wide: true }, { key: 'image', label: 'Image', kind: 'image' }, { key: 'link', label: 'Link for more', kind: 'url' }
  ]
};
const storiesList: SectionSpec = {
  kind: 'list', list: 'stories', title: 'Stories', hint: 'Only stories told with the person’s consent. Leave empty to hide the stories section.', addLabel: 'Add a story', itemLabel: (e, i) => label(e, 'name', 'Story', i),
  blank: () => ({ id: newId('story'), name: '', location: '', quote: '', story: '', photo: '' }),
  fields: [
    { key: 'name', label: 'Name (or first name)', required: true }, { key: 'location', label: 'Where' }, { key: 'quote', label: 'In their words', kind: 'textarea', required: true, wide: true },
    { key: 'story', label: 'Longer story', kind: 'textarea', wide: true }, { key: 'photo', label: 'Photo', kind: 'image', wide: true }
  ]
};
const faqsList: SectionSpec = {
  kind: 'list', list: 'faqs', title: 'Common questions', hint: 'Questions people really ask you. Leave empty to hide the section.', addLabel: 'Add a question', itemLabel: (e, i) => label(e, 'question', 'Question', i),
  blank: () => ({ id: newId('faq'), question: '', answer: '' }),
  fields: [{ key: 'question', label: 'Question', required: true, wide: true }, { key: 'answer', label: 'Answer', kind: 'textarea', required: true, wide: true }]
};

/** The ten steps. All three archetypes collect the same real information; the chosen template decides how it is shown. */
export const STEPS: StepSpec[] = [
  {
    id: 'profile', title: 'Organisation profile', subtitle: 'Who you are. Only the name is required to start.',
    sections: [{ kind: 'fields', fields: [
      { key: 'name', label: 'Organisation name', required: true }, { key: 'shortName', label: 'Short name', hint: 'Used where space is tight, if different.' },
      { key: 'legalName', label: 'Registered legal name' }, { key: 'tagline', label: 'Tagline', wide: true },
      { key: 'founded', label: 'Year founded', kind: 'number', placeholder: '2014' }, { key: 'registrationNumber', label: 'Registration number (optional)', hint: 'Shown only if you enter it.' }
    ] }]
  },
  {
    id: 'mission', title: 'Mission and story', subtitle: 'What you stand for, in your own words.',
    sections: [{ kind: 'fields', fields: [
      { key: 'mission', label: 'Mission', kind: 'textarea', required: true, wide: true }, { key: 'vision', label: 'Vision', kind: 'textarea', wide: true },
      { key: 'description', label: 'About the organisation', kind: 'textarea', required: true, wide: true }, { key: 'values', label: 'Values (one per line)', kind: 'lines', wide: true }
    ] }]
  },
  {
    id: 'branding', title: 'Branding and template', subtitle: 'Your logo and cover. The design keeps its own look; colours are optional.',
    sections: [
      { kind: 'fields', title: 'Logo and cover', fields: [
        { key: 'logo', label: 'Logo', kind: 'image', hint: 'Shown in the site header.' }, { key: 'cover', label: 'Cover image', kind: 'image', hint: 'Used where the design shows a large photograph.' },
        { key: 'accentColor', label: 'Accent colour (optional)', kind: 'color', hint: 'Used only where the design has one accent colour.' }
      ] },
      { kind: 'template' }
    ]
  },
  { id: 'programmes', title: 'Programmes and impact', subtitle: 'The work you do and what it has achieved.', sections: [programsList, statsList] },
  { id: 'leadership', title: 'Leadership and team', subtitle: 'The people behind the organisation.', sections: [leadershipList] },
  { id: 'media', title: 'Gallery and media', subtitle: 'Photographs and videos from your work.', sections: [galleryList, { kind: 'media' }] },
  {
    id: 'volunteer', title: 'Volunteers and support', subtitle: 'How people can get involved. Information only: no payments or donation forms are collected.',
    sections: [
      { kind: 'fields', title: 'Volunteering', fields: [
        { key: 'volHeadline', label: 'Headline', placeholder: 'Give a few hours' }, { key: 'volDescription', label: 'What you ask of volunteers', kind: 'textarea', wide: true },
        { key: 'volApplyUrl', label: 'Where to apply (link)', kind: 'url', hint: 'Optional. Visitors can always contact you instead.' }
      ] },
      rolesList,
      { kind: 'fields', title: 'Other ways to support', hint: 'A short note, for example “donate spare kitchen items” or “contact us about sponsorship”. The website does not take payments.', fields: [
        { key: 'supportHeadline', label: 'Heading' }, { key: 'supportText', label: 'How people can support you', kind: 'textarea', wide: true }
      ] }
    ]
  },
  { id: 'updates', title: 'News, stories and questions', subtitle: 'Fresh updates, stories you can share and common questions.', sections: [updatesList, storiesList, faqsList] },
  {
    id: 'contact', title: 'Contact and social', subtitle: 'How people reach you.',
    sections: [
      { kind: 'fields', title: 'Contact', fields: [
        { key: 'email', label: 'Contact email', kind: 'email', required: true }, { key: 'phone', label: 'Phone', kind: 'tel' }, { key: 'contactPerson', label: 'Contact person' },
        { key: 'website', label: 'Existing website', kind: 'url' }, { key: 'address', label: 'Address', wide: true }, { key: 'city', label: 'City' }, { key: 'country', label: 'Country' },
        { key: 'regions', label: 'Where you work (one per line)', kind: 'lines', wide: true }
      ] },
      { kind: 'fields', title: 'Social profiles', fields: [
        { key: 'facebook', label: 'Facebook', kind: 'url' }, { key: 'instagram', label: 'Instagram', kind: 'url' }, { key: 'twitter', label: 'X (Twitter)', kind: 'url' },
        { key: 'linkedin', label: 'LinkedIn', kind: 'url' }, { key: 'youtubeChannel', label: 'YouTube channel', kind: 'url' }, { key: 'whatsapp', label: 'WhatsApp link', kind: 'url' }
      ] }
    ]
  },
  { id: 'review', title: 'Review and create', subtitle: 'Check what will appear, then create the website.', sections: [{ kind: 'review' }] }
];

/* ------------------------------------------------------------------ blanks and pruning */

const sameValue = (a: unknown, b: unknown): boolean => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => sameValue(x, b[i])) : a === b);
const isBlankEntry = (e: Entry, blank: Entry): boolean => Object.keys(blank).every((k) => k === 'id' || sameValue(e[k], blank[k]));

const BLANKS = {} as Record<ListKey, () => Entry>;
STEPS.forEach((s) => s.sections.forEach((sec) => { if (sec.kind === 'list') BLANKS[sec.list] = sec.blank; }));

/** Drop cards that were added but never filled in. */
export function pruneBlank(f: IntakeForm): IntakeForm {
  const lists = { ...f.lists };
  LIST_KEYS.forEach((k) => { const blank = BLANKS[k](); lists[k] = (f.lists[k] || []).filter((e) => !isBlankEntry(e, blank)); });
  return { ...f, lists };
}

/* ------------------------------------------------------------------ validation */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const HEX = /^#[0-9a-fA-F]{6}$/;
const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '');

function fieldError(spec: FieldSpec, value: unknown): string | undefined {
  const s = typeof value === 'string' ? value.trim() : '';
  if (spec.required && !filled(value)) return `${spec.label} is required.`;
  if (!filled(value)) return undefined;
  switch (spec.kind) {
    case 'email': return EMAIL.test(s) ? undefined : 'Enter a valid email address.';
    case 'url': return isUrl(s) ? undefined : 'Enter a full link starting with https://';
    case 'number': return /^\d+$/.test(s) ? undefined : 'Use whole numbers only.';
    case 'color': return HEX.test(s) ? undefined : 'Use a hex colour such as #1F6F5C.';
    default: return undefined;
  }
}

export const errKey = (list: ListKey | string, id: string, field: string) => `${list}:${id}:${field}`;

/** Validate one step. Keys: scalar field key, or `list:entryId:field`. */
export function validateStep(stepIndex: number, form: IntakeForm): FieldErrors {
  const step = STEPS[stepIndex - 1];
  const errors: FieldErrors = {};
  if (!step) return errors;
  const clean = pruneBlank(form);
  const { v } = clean;
  for (const sec of step.sections) {
    if (sec.kind === 'fields') {
      sec.fields.forEach((f) => { const m = fieldError(f, v[f.key] ?? ''); if (m) errors[f.key] = m; });
      if (step.id === 'profile' && v.founded && (Number(v.founded) < 1000 || Number(v.founded) > new Date().getFullYear())) errors.founded = `Enter a year between 1000 and ${new Date().getFullYear()}.`;
    }
    if (sec.kind === 'list') {
      for (const e of clean.lists[sec.list]) sec.fields.forEach((f) => { const m = fieldError(f, e[f.key]); if (m) errors[errKey(sec.list, e.id, f.key)] = m; });
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

export function validateAll(form: IntakeForm): { step: number; errors: FieldErrors }[] {
  const out: { step: number; errors: FieldErrors }[] = [];
  STEPS.forEach((_, i) => { const errors = validateStep(i + 1, form); if (Object.keys(errors).length) out.push({ step: i + 1, errors }); });
  return out;
}

/* ------------------------------------------------------------------ build requirements */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const lines = (v: unknown) => str(v).split('\n').map((l) => l.trim()).filter(Boolean);
const opt = (s: string) => (s ? s : undefined);

/**
 * Turns the form into the project's requirements. Only what the organisation typed is carried over: no registration numbers, no bank
 * or UPI details, no donation tiers and no placeholder people or figures are created, and a blank list stays blank.
 */
export function buildRequirements(input: IntakeForm, archetype: NgoArchetypeId): ClientRequirements {
  const f = pruneBlank(input);
  const v = f.v; const L = f.lists;
  const name = str(v.name);
  const accent = HEX.test(str(v.accentColor)) ? str(v.accentColor) : undefined;

  const programs: NGOProgram[] = L.programs.map((e) => ({
    id: e.id, title: str(e.title), category: str(e.category), shortSummary: str(e.summary), fullDescription: str(e.description) || str(e.summary), beneficiaryGroup: str(e.beneficiary),
    locations: lines(e.locations), outcomes: lines(e.outcomes), imageUrl: opt(str(e.image)), status: (str(e.status) || 'active') as NGOProgram['status']
  }));
  const impactStats: NGOImpactStat[] = L.stats.map((e) => ({ id: e.id, value: str(e.value), label: str(e.label), description: opt(str(e.description)), isVerified: false }));
  const leadership: NGOPerson[] = L.leadership.map((e) => ({
    id: e.id, name: str(e.name), role: str(e.role), tier: (str(e.tier) || 'team') as NGOPerson['tier'], bio: str(e.bio), photoUrl: opt(str(e.photo)),
    socials: str(e.linkedin) ? { linkedin: str(e.linkedin) } : undefined
  }));
  const gallery: NGOMediaItem[] = L.gallery.map((e) => ({ id: e.id, title: str(e.caption) || 'Photo', type: 'photo', url: str(e.url), caption: opt(str(e.caption)) }));
  const opportunities: NGOVolunteerOpportunity[] = L.roles.map((e) => ({
    id: e.id, roleName: str(e.name), department: str(e.department), location: str(e.location), commitment: str(e.commitment), requirements: lines(e.requirements)
  }));
  const updates: NGOUpdateItem[] = L.updates.map((e) => ({
    id: e.id, title: str(e.title), kind: (str(e.kind) || 'announcement') as NGOUpdateItem['kind'], date: opt(str(e.date)), summary: str(e.summary), imageUrl: opt(str(e.image)), linkUrl: opt(str(e.link))
  }));
  const stories: NGOStory[] = L.stories.map((e) => ({
    id: e.id, title: str(e.name), beneficiaryName: str(e.name), location: str(e.location), excerpt: str(e.quote), fullStory: str(e.story), quote: str(e.quote), photoUrl: opt(str(e.photo))
  }));
  const faqs: NGOFAQItem[] = L.faqs.map((e) => ({ id: e.id, question: str(e.question), answer: str(e.answer), category: '' }));

  const socialLinks: Record<string, string> = {};
  ([['facebook', 'facebook'], ['instagram', 'instagram'], ['twitter', 'twitter'], ['linkedin', 'linkedin'], ['youtubeChannel', 'youtube'], ['whatsapp', 'whatsapp']] as const)
    .forEach(([k, out]) => { if (str(v[k])) socialLinks[out] = str(v[k]); });
  const youtubeUrls = lines(v.youtubeUrls);
  const youtubePlaylistUrls = lines(v.youtubePlaylistUrls);
  const googleDriveVideoUrls = lines(v.driveVideoUrls);
  const googleDriveGalleryUrl = opt(str(v.driveGalleryUrl));
  const hasVolunteer = Boolean(str(v.volHeadline) || str(v.volDescription) || opportunities.length);
  const hasSupport = Boolean(str(v.supportHeadline) || str(v.supportText));

  const ngoData: NGOWebsiteData = {
    schemaVersion: '1.0',
    archetype,
    profile: {
      name, legalRegisteredName: opt(str(v.legalName)), registrationNumber: opt(str(v.registrationNumber)), foundedYear: opt(str(v.founded)), tagline: str(v.tagline),
      missionStatement: str(v.mission), visionStatement: str(v.vision), coreValues: lines(v.values), aboutDescription: str(v.description), operationalRegions: lines(v.regions),
      headquartersAddress: str(v.address), city: opt(str(v.city)), country: opt(str(v.country)), contactEmail: str(v.email).toLowerCase(), contactPhone: str(v.phone),
      websiteUrl: opt(str(v.website)), socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined, contactPerson: opt(str(v.contactPerson))
    },
    branding: { primaryColor: '', accentColor: accent || '', typographyStyle: 'humanist', logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)) },
    programs, impactStats, campaigns: [], causes: [], leadership,
    volunteering: { enabled: hasVolunteer, headline: str(v.volHeadline), description: str(v.volDescription), opportunities, applicationUrl: opt(str(v.volApplyUrl)) },
    volunteerSubmissions: [], collectionCenters: [],
    // Informational only: no tiers, bank/UPI, tax claims or payment of any kind.
    donationModel: { headline: '', donationTiers: [], customAmountAllowed: false, taxDeductible: false, enquiryOnly: true },
    donationEnquiries: [], stories, reports: [], partners: [], faqs, gallery, updates,
    supportInfo: hasSupport ? { headline: str(v.supportHeadline), text: str(v.supportText) } : undefined,
    dataAvailability: {
      programs: programs.length > 0, impactStats: impactStats.length > 0, campaigns: false, causes: false, leadership: leadership.length > 0, volunteering: opportunities.length > 0,
      collectionCenters: false, donationModel: false, stories: stories.length > 0, reports: false, partners: false, faqs: faqs.length > 0, gallery: gallery.length > 0
    }
  } as NGOWebsiteData;

  const location = [str(v.city), str(v.country)].filter(Boolean).join(', ');
  return {
    organizationName: name, category: 'ngo_social', organizationType: 'ngo_social', ngoArchetype: archetype,
    tagline: str(v.tagline), aboutText: str(v.description),
    contactPerson: opt(str(v.contactPerson)), contactEmail: str(v.email).toLowerCase(), contactPhone: str(v.phone),
    address: [str(v.address), location].filter(Boolean).join(', ') || undefined,
    logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), additionalBrandingImages: [],
    accentColor: accent,
    youtubeUrls, youtubePlaylistUrls, googleDriveGalleryUrl, googleDriveVideoUrls, socialLinks,
    designSelection: { mode: 'template' },
    selectedTemplate: f.template,
    ngoData
  } as unknown as ClientRequirements;
}

/* ------------------------------------------------------------------ drafts */

const draftKey = (scope: string, archetype: string) => `dv:ngo-draft:${scope}:${archetype}`;
interface DraftEnvelope { version: 1; step: number; savedAt: string; form: IntakeForm }

/** Browser-local drafts. Every call is guarded: storage can be blocked or full. */
export const drafts = {
  available(): boolean {
    try { const k = '__dv_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch { return false; }
  },
  save(scope: string, archetype: string, step: number, form: IntakeForm): { ok: boolean; savedAt?: string; error?: string } {
    try {
      const env: DraftEnvelope = { version: 1, step, savedAt: new Date().toISOString(), form };
      window.localStorage.setItem(draftKey(scope, archetype), JSON.stringify(env));
      return { ok: true, savedAt: env.savedAt };
    } catch (e) { return { ok: false, error: e instanceof Error && /quota/i.test(e.message) ? 'Browser storage is full, so the draft could not be saved.' : 'The draft could not be saved in this browser.' }; }
  },
  load(scope: string, archetype: string): DraftEnvelope | null {
    try {
      const raw = window.localStorage.getItem(draftKey(scope, archetype));
      if (!raw) return null;
      const env = JSON.parse(raw) as DraftEnvelope;
      return env && env.version === 1 && env.form && typeof env.form === 'object' ? env : null;
    } catch { return null; }
  },
  clear(scope: string, archetype: string) { try { window.localStorage.removeItem(draftKey(scope, archetype)); } catch { /* ignore */ } }
};

/** Merge a stored draft over a fresh form so lists added in newer versions never come back undefined. */
export function mergeDraft(base: IntakeForm, saved: IntakeForm): IntakeForm {
  const lists = { ...base.lists };
  LIST_KEYS.forEach((k) => { if (Array.isArray(saved.lists?.[k])) lists[k] = saved.lists[k]; });
  return { ...base, v: { ...base.v, ...(saved.v || {}) }, lists };
}

/** Does the form hold anything the Admin typed? Used to decide whether a draft is worth keeping. */
export const hasContent = (f: IntakeForm) => Object.values(f.v).some(Boolean) || LIST_KEYS.some((k) => (f.lists[k] || []).length > 0);
