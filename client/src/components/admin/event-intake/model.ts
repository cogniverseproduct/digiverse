import type { ClientRequirements, SelectedTemplateMetadata } from '../../../types/admin';
import type {
  EventAwardCategory, EventBentoHighlight, EventCeremonyItem, EventExhibitor, EventFAQItem, EventHotelBlock, EventMediaItem, EventPerson, EventSession,
  EventSponsor, EventTechSpecGroup, EventTicketTier, EventTrack, EventWebsiteData
} from '../../../types/event';
import type { EventCategoryId } from '../../../templates/event/ids';
import { EVENT_CATEGORY_LABELS } from '../../../templates/event/ids';

/* ------------------------------------------------------------------ form shape */

/** One card in a repeatable list. Every value is text so drafts round-trip and validation is uniform. */
export interface Entry { id: string; [key: string]: string | string[] | Entry[] }

export type ListKey =
  | 'speakers' | 'sessions' | 'tickets' | 'sponsors' | 'faqs' | 'gallery' | 'exhibitors' | 'awards'
  | 'milestones' | 'itinerary' | 'hotels' | 'registry' | 'highlights' | 'specs';
export const LIST_KEYS: ListKey[] = [
  'speakers', 'sessions', 'tickets', 'sponsors', 'faqs', 'gallery', 'exhibitors', 'awards', 'milestones', 'itinerary', 'hotels', 'registry', 'highlights', 'specs'
];

export interface IntakeForm {
  category: EventCategoryId;
  v: Record<string, string>;
  lists: Record<ListKey, Entry[]>;
  template: SelectedTemplateMetadata;
}

export type FieldErrors = Record<string, string>;

let uid = 0;
export const newId = (p: string) => `${p}_${Date.now().toString(36)}${(uid++).toString(36)}`;

/** Every field starts empty. Nothing is invented for the event, and the template brings its own colours. */
export function emptyForm(category: EventCategoryId, template: SelectedTemplateMetadata): IntakeForm {
  const lists = {} as Record<ListKey, Entry[]>;
  LIST_KEYS.forEach((k) => { lists[k] = []; });
  return { category, v: {}, lists, template };
}

/* ------------------------------------------------------------------ field and step specs */

export type FieldKind = 'text' | 'textarea' | 'lines' | 'select' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'url' | 'image' | 'color';
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
export const CATEGORY_LABEL = EVENT_CATEGORY_LABELS;

const YES_NO: Opt[] = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const SPONSOR_TIERS: Opt[] = [
  { value: 'title', label: 'Title' }, { value: 'diamond', label: 'Diamond' }, { value: 'platinum', label: 'Platinum' }, { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' }, { value: 'partner', label: 'Partner' }, { value: 'media', label: 'Media partner' }
];
const ROLES: Record<EventCategoryId, Opt[]> = {
  conference_seminar: [{ value: 'keynote_speaker', label: 'Keynote speaker' }, { value: 'speaker', label: 'Speaker' }, { value: 'host', label: 'Host / moderator' }],
  festival_concert: [{ value: 'headliner_artist', label: 'Headliner' }, { value: 'performer', label: 'Performer' }, { value: 'host', label: 'Host' }],
  corporate_business: [{ value: 'executive', label: 'Executive' }, { value: 'speaker', label: 'Speaker' }, { value: 'host', label: 'Host' }],
  exhibition_trade: [{ value: 'speaker', label: 'Speaker' }, { value: 'host', label: 'Host' }],
  wedding_private: [{ value: 'host', label: 'Host' }],
  award_ceremony: [{ value: 'jury', label: 'Jury member' }, { value: 'host', label: 'Host' }, { value: 'speaker', label: 'Presenter' }],
  launch_reveal: [{ value: 'executive', label: 'Executive' }, { value: 'host', label: 'Host' }, { value: 'speaker', label: 'Presenter' }]
};

/** Words that fit each category. The same data model underlies all of them. */
const PEOPLE_WORDS: Record<EventCategoryId, { title: string; hint: string; add: string; one: string; topic: string }> = {
  conference_seminar: { title: 'Speakers', hint: 'Only speakers who have confirmed. Leave empty to hide the speakers section.', add: 'Add a speaker', one: 'Speaker', topic: 'Talk title' },
  festival_concert: { title: 'Line-up', hint: 'Artists and performers you have confirmed. Leave empty to hide the line-up.', add: 'Add an artist', one: 'Artist', topic: 'Genre or set' },
  corporate_business: { title: 'Speakers and hosts', hint: 'Leaders and speakers who will appear. Leave empty to hide the section.', add: 'Add a person', one: 'Person', topic: 'Topic' },
  exhibition_trade: { title: 'Speakers and hosts', hint: 'Programme speakers and hosts. Leave empty to hide the section.', add: 'Add a person', one: 'Person', topic: 'Topic' },
  wedding_private: { title: 'Hosts and family', hint: 'Optional. People you want to introduce. Leave empty to hide the section.', add: 'Add a person', one: 'Person', topic: 'Role in the day' },
  award_ceremony: { title: 'Jury, hosts and presenters', hint: 'The people who will judge, host or present. Leave empty to hide the section.', add: 'Add a person', one: 'Person', topic: 'Role or category' },
  launch_reveal: { title: 'Presenters', hint: 'The people presenting the launch. Leave empty to hide the section.', add: 'Add a presenter', one: 'Presenter', topic: 'Topic' }
};

const speakersList = (c: EventCategoryId): SectionSpec => {
  const w = PEOPLE_WORDS[c];
  return {
    kind: 'list', list: 'speakers', title: w.title, hint: w.hint, addLabel: w.add, itemLabel: (e, i) => label(e, 'name', w.one, i),
    blank: () => ({ id: newId('spk'), name: '', role: ROLES[c][0].value, title: '', organization: '', topic: '', bio: '', photo: '', social: '', featured: '' }),
    fields: [
      { key: 'name', label: 'Full name', required: true }, { key: 'role', label: 'Role', kind: 'select', options: ROLES[c] },
      { key: 'title', label: 'Job title or description', placeholder: 'Principal Engineer' }, { key: 'organization', label: 'Organisation' },
      { key: 'topic', label: w.topic, wide: true }, { key: 'bio', label: 'Short biography', kind: 'textarea', wide: true },
      { key: 'photo', label: 'Photo', kind: 'image' }, { key: 'social', label: 'Profile link', kind: 'url' },
      { key: 'featured', label: 'Feature prominently', kind: 'select', options: YES_NO, emptyLabel: 'No' }
    ]
  };
};

const sessionsList = (title: string, hint: string, add: string): SectionSpec => ({
  kind: 'list', list: 'sessions', title, hint, addLabel: add, itemLabel: (e, i) => label(e, 'title', 'Item', i),
  blank: () => ({ id: newId('ses'), title: '', description: '', day: '', date: '', startTime: '', endTime: '', track: '', stage: '', speakers: '', kind: 'session' }),
  fields: [
    { key: 'title', label: 'Title', required: true, wide: true }, { key: 'description', label: 'Description', kind: 'textarea', wide: true },
    { key: 'date', label: 'Date', kind: 'date', required: true }, { key: 'day', label: 'Day label (optional)', placeholder: 'Day 1' },
    { key: 'startTime', label: 'Starts', kind: 'time', required: true }, { key: 'endTime', label: 'Ends', kind: 'time' },
    { key: 'track', label: 'Track or theme (optional)', hint: 'Items with the same name share a colour.' }, { key: 'stage', label: 'Room or stage' },
    { key: 'speakers', label: 'Who is presenting (names, one per line)', kind: 'lines', hint: 'Use the names exactly as in the people list.', wide: true },
    { key: 'kind', label: 'Type', kind: 'select', options: [{ value: 'session', label: 'Session' }, { value: 'keynote', label: 'Keynote / headline' }, { value: 'break', label: 'Break (lunch, coffee)' }] }
  ]
});

const ticketsList = (title: string, hint: string, add: string): SectionSpec => ({
  kind: 'list', list: 'tickets', title, hint, addLabel: add, itemLabel: (e, i) => label(e, 'name', 'Pass', i),
  blank: () => ({ id: newId('tkt'), name: '', price: '', currency: '', description: '', features: '', badge: '', url: '', available: '' }),
  fields: [
    { key: 'name', label: 'Pass name', required: true }, { key: 'price', label: 'Price (text)', placeholder: '199 or Free', hint: 'Shown as information only. Nothing is charged on the website.' },
    { key: 'currency', label: 'Currency', placeholder: 'GBP' }, { key: 'badge', label: 'Highlight label (optional)', placeholder: 'Best value' },
    { key: 'description', label: 'Short description', wide: true }, { key: 'features', label: 'What it includes (one per line)', kind: 'lines', wide: true },
    { key: 'url', label: 'Booking or registration link', kind: 'url', wide: true, hint: 'Your own external booking page. Visitors are sent there; this website takes no payment.' },
    { key: 'available', label: 'Availability', kind: 'select', options: [{ value: 'yes', label: 'On sale' }, { value: 'no', label: 'Sold out / closed' }], emptyLabel: 'On sale' }
  ]
});

const sponsorsList = (title: string): SectionSpec => ({
  kind: 'list', list: 'sponsors', title, hint: 'Only real partners. Leave empty to hide the section.', addLabel: 'Add a partner', itemLabel: (e, i) => label(e, 'name', 'Partner', i),
  blank: () => ({ id: newId('spo'), name: '', tier: 'partner', logo: '', url: '' }),
  fields: [{ key: 'name', label: 'Name', required: true }, { key: 'tier', label: 'Level', kind: 'select', options: SPONSOR_TIERS }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'url', label: 'Website', kind: 'url' }]
});

const faqsList: SectionSpec = {
  kind: 'list', list: 'faqs', title: 'Common questions', hint: 'Questions people really ask. Leave empty to hide the section.', addLabel: 'Add a question', itemLabel: (e, i) => label(e, 'question', 'Question', i),
  blank: () => ({ id: newId('faq'), question: '', answer: '' }),
  fields: [{ key: 'question', label: 'Question', required: true, wide: true }, { key: 'answer', label: 'Answer', kind: 'textarea', required: true, wide: true }]
};

const galleryList: SectionSpec = {
  kind: 'list', list: 'gallery', title: 'Photographs', hint: 'Real photographs from the event or venue. Your logo and cover go in the Branding step, not here.', addLabel: 'Add a photo', itemLabel: (e, i) => label(e, 'caption', 'Photo', i),
  blank: () => ({ id: newId('ph'), url: '', caption: '' }),
  fields: [{ key: 'url', label: 'Photo', kind: 'image', required: true, wide: true }, { key: 'caption', label: 'Caption', wide: true }]
};

const exhibitorsList: SectionSpec = {
  kind: 'list', list: 'exhibitors', title: 'Exhibitors', hint: 'Confirmed exhibitors only. Leave empty to hide the section.', addLabel: 'Add an exhibitor', itemLabel: (e, i) => label(e, 'name', 'Exhibitor', i),
  blank: () => ({ id: newId('exh'), name: '', category: '', booth: '', hall: '', description: '', logo: '', image: '', url: '', specs: '' }),
  fields: [
    { key: 'name', label: 'Exhibitor', required: true }, { key: 'category', label: 'Sector' }, { key: 'booth', label: 'Booth' }, { key: 'hall', label: 'Hall or zone' },
    { key: 'description', label: 'About', kind: 'textarea', wide: true }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'image', label: 'Image', kind: 'image' },
    { key: 'url', label: 'Website', kind: 'url' }, { key: 'specs', label: 'Highlights (one per line)', kind: 'lines', wide: true }
  ]
};

const awardsList: SectionSpec = {
  kind: 'list', list: 'awards', title: 'Award categories', hint: 'Categories and their nominees. Leave empty to hide the awards section.', addLabel: 'Add a category', itemLabel: (e, i) => label(e, 'name', 'Category', i),
  blank: () => ({ id: newId('awd'), name: '', description: '', sponsor: '', nominees: '', winner: '' }),
  fields: [
    { key: 'name', label: 'Category name', required: true, wide: true }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }, { key: 'sponsor', label: 'Sponsored by' },
    { key: 'nominees', label: 'Nominees (one per line: Title | Creator)', kind: 'lines', wide: true }, { key: 'winner', label: 'Winner (only after the ceremony)', hint: 'Must match a nominee title. Leave empty before the event.' }
  ]
};

const milestonesList: SectionSpec = {
  kind: 'list', list: 'milestones', title: 'Our story', hint: 'Moments you want to share. Leave empty to hide the story.', addLabel: 'Add a moment', itemLabel: (e, i) => label(e, 'title', 'Moment', i),
  blank: () => ({ id: newId('ms'), title: '', date: '', text: '', image: '' }),
  fields: [{ key: 'title', label: 'Title', required: true }, { key: 'date', label: 'When' }, { key: 'text', label: 'The story', kind: 'textarea', required: true, wide: true }, { key: 'image', label: 'Photo', kind: 'image', wide: true }]
};
const itineraryList: SectionSpec = {
  kind: 'list', list: 'itinerary', title: 'Day plan', hint: 'The ceremonies and gatherings. Leave empty to hide the schedule.', addLabel: 'Add an item', itemLabel: (e, i) => label(e, 'eventName', 'Item', i),
  blank: () => ({ id: newId('cer'), time: '', eventName: '', venue: '', dressCode: '', description: '' }),
  fields: [
    { key: 'eventName', label: 'What', required: true }, { key: 'time', label: 'Time', kind: 'time', required: true }, { key: 'venue', label: 'Where' }, { key: 'dressCode', label: 'Dress code' },
    { key: 'description', label: 'Details', kind: 'textarea', wide: true }
  ]
};
const hotelsList: SectionSpec = {
  kind: 'list', list: 'hotels', title: 'Where to stay', hint: 'Hotels you recommend. Leave empty to hide the section.', addLabel: 'Add a hotel', itemLabel: (e, i) => label(e, 'hotelName', 'Hotel', i),
  blank: () => ({ id: newId('htl'), hotelName: '', address: '', bookingCode: '', link: '', deadline: '', distance: '' }),
  fields: [
    { key: 'hotelName', label: 'Hotel', required: true }, { key: 'address', label: 'Address' }, { key: 'bookingCode', label: 'Booking code' }, { key: 'link', label: 'Booking link', kind: 'url' },
    { key: 'deadline', label: 'Book by' }, { key: 'distance', label: 'Distance to the venue' }
  ]
};
const registryList: SectionSpec = {
  kind: 'list', list: 'registry', title: 'Gift registry links', hint: 'Links to your own registry pages. The website takes no payments.', addLabel: 'Add a link', itemLabel: (e, i) => label(e, 'storeName', 'Link', i),
  blank: () => ({ id: newId('reg'), storeName: '', url: '' }),
  fields: [{ key: 'storeName', label: 'Name', required: true }, { key: 'url', label: 'Link', kind: 'url', required: true }]
};
const highlightsList: SectionSpec = {
  kind: 'list', list: 'highlights', title: 'Highlights', hint: 'The main things to know about the product. Leave empty to hide the section.', addLabel: 'Add a highlight', itemLabel: (e, i) => label(e, 'title', 'Highlight', i),
  blank: () => ({ id: newId('hl'), title: '', subtitle: '', description: '', metric: '', image: '' }),
  fields: [
    { key: 'title', label: 'Title', required: true }, { key: 'metric', label: 'Figure (optional)', placeholder: '48 hours' }, { key: 'subtitle', label: 'Subtitle' },
    { key: 'description', label: 'Description', kind: 'textarea', required: true, wide: true }, { key: 'image', label: 'Image', kind: 'image', wide: true }
  ]
};
const specsList: SectionSpec = {
  kind: 'list', list: 'specs', title: 'Specifications', hint: 'Real specifications only. Leave empty to hide them.', addLabel: 'Add a group', itemLabel: (e, i) => label(e, 'group', 'Group', i),
  blank: () => ({ id: newId('sp'), group: '', items: '' }),
  fields: [{ key: 'group', label: 'Group', required: true }, { key: 'items', label: 'Lines (Label: value, one per line)', kind: 'lines', wide: true }]
};

/* ------------------------------------------------------------------ steps per category */

const detailsStep = (c: EventCategoryId): StepSpec => ({
  id: 'details', title: 'Event details', subtitle: 'What the event is. Only the name is required to start.',
  sections: [{ kind: 'fields', fields: [
    { key: 'name', label: c === 'wedding_private' ? 'Event title' : c === 'launch_reveal' ? 'Launch event name' : 'Event name', required: true, placeholder: c === 'wedding_private' ? 'Names or the occasion' : undefined },
    { key: 'edition', label: 'Edition or year (optional)' },
    { key: 'tagline', label: 'Tagline', wide: true },
    { key: 'description', label: 'About the event', kind: 'textarea', wide: true, hint: 'Shown as the introduction. Write what is true; nothing is added for you.' }
  ] }]
});

const whenWhereStep = (c: EventCategoryId): StepSpec => {
  const travel = c === 'conference_seminar' || c === 'festival_concert' || c === 'exhibition_trade' || c === 'corporate_business';
  return {
    id: 'venue', title: 'Date, time and venue', subtitle: 'When and where it happens.',
    sections: [
      { kind: 'fields', title: 'Date and time', fields: [
        { key: 'startDate', label: 'Start date', kind: 'date', required: true }, { key: 'endDate', label: 'End date', kind: 'date', hint: 'Leave empty for a single-day event.' },
        { key: 'startTime', label: 'Starts at', kind: 'time', hint: 'Used for the countdown. Leave empty to count to midnight.' }, { key: 'endTime', label: 'Ends at', kind: 'time' },
        { key: 'timezone', label: 'Time zone', placeholder: 'GMT, IST, CET…' }
      ] },
      { kind: 'fields', title: 'Venue', fields: [
        { key: 'format', label: 'Format', kind: 'select', emptyLabel: 'In person', options: [{ value: 'virtual', label: 'Online only' }, { value: 'hybrid', label: 'In person and online' }] },
        { key: 'streamUrl', label: 'Online event link', kind: 'url', hint: 'Only if people can join online.' },
        { key: 'venueName', label: 'Venue name' }, { key: 'venueAddress', label: 'Street address', wide: true }, { key: 'city', label: 'City' }, { key: 'country', label: 'Country' },
        ...(travel ? [
          { key: 'airportInfo', label: 'Getting there by air', wide: true }, { key: 'transitInfo', label: 'Public transport', wide: true }, { key: 'parkingInfo', label: 'Parking', wide: true },
          { key: 'accessible', label: 'Step-free access', kind: 'select' as const, options: YES_NO, emptyLabel: 'Not stated' }
        ] : [])
      ] }
    ]
  };
};

const brandingStep: StepSpec = {
  id: 'branding', title: 'Branding and template', subtitle: 'Your logo and cover. The design keeps its own look; colours are optional.',
  sections: [
    { kind: 'fields', title: 'Logo and cover', fields: [
      { key: 'logo', label: 'Logo', kind: 'image', hint: 'Shown in the site header.' }, { key: 'cover', label: 'Cover image', kind: 'image', hint: 'Used where the design shows a large photograph.' },
      { key: 'primaryColor', label: 'Main colour (optional)', kind: 'color', hint: 'Used only where the design has one main colour.' }, { key: 'accentColor', label: 'Accent colour (optional)', kind: 'color' }
    ] },
    { kind: 'template' }
  ]
};

const mediaStep: StepSpec = { id: 'media', title: 'Gallery and media', subtitle: 'Photographs and videos for the event.', sections: [galleryList, { kind: 'media' }] };

const contactStep = (c: EventCategoryId): StepSpec => ({
  id: 'contact', title: 'Contact and social', subtitle: c === 'wedding_private' ? 'Where guests send questions and replies.' : 'How people reach the organisers.',
  sections: [
    { kind: 'fields', title: 'Contact', fields: [
      { key: 'organizerName', label: 'Organiser or contact person' }, { key: 'email', label: 'Contact email', kind: 'email', required: true }, { key: 'phone', label: 'Phone', kind: 'tel' }
    ] },
    { kind: 'fields', title: 'Social profiles', fields: [
      { key: 'facebook', label: 'Facebook', kind: 'url' }, { key: 'instagram', label: 'Instagram', kind: 'url' }, { key: 'twitter', label: 'X (Twitter)', kind: 'url' },
      { key: 'linkedin', label: 'LinkedIn', kind: 'url' }, { key: 'youtubeChannel', label: 'YouTube channel', kind: 'url' }
    ] }
  ]
});

const reviewStep: StepSpec = { id: 'review', title: 'Review and create', subtitle: 'Check what will appear, then create the website.', sections: [{ kind: 'review' }] };

const TICKET_NOTE = 'Information only: pricing is shown and each button goes to your own booking page. The website takes no payment.';

const CONTENT_STEPS: Record<EventCategoryId, StepSpec[]> = {
  conference_seminar: [
    { id: 'speakers', title: 'Speakers', subtitle: 'The people on stage.', sections: [speakersList('conference_seminar')] },
    { id: 'schedule', title: 'Schedule', subtitle: 'Sessions by day. Leave empty to hide the schedule.', sections: [sessionsList('Sessions', 'Real sessions only. Add breaks too if you want them shown.', 'Add a session')] },
    { id: 'tickets', title: 'Tickets and registration', subtitle: TICKET_NOTE, sections: [ticketsList('Passes', 'Leave empty to hide the tickets section.', 'Add a pass')] },
    { id: 'partners', title: 'Partners and questions', subtitle: 'Sponsors and common questions.', sections: [sponsorsList('Sponsors and partners'), faqsList] }
  ],
  festival_concert: [
    { id: 'lineup', title: 'Line-up', subtitle: 'Who is playing.', sections: [speakersList('festival_concert')] },
    { id: 'schedule', title: 'Schedule', subtitle: 'Sets by day and stage. Leave empty to hide it.', sections: [sessionsList('Sets and events', 'Real sets only.', 'Add a set')] },
    { id: 'tickets', title: 'Tickets', subtitle: TICKET_NOTE, sections: [ticketsList('Tickets', 'Leave empty to hide the tickets section.', 'Add a ticket')] },
    { id: 'partners', title: 'Partners and questions', subtitle: 'Sponsors and common questions.', sections: [sponsorsList('Sponsors and partners'), faqsList] }
  ],
  corporate_business: [
    { id: 'speakers', title: 'Speakers and hosts', subtitle: 'The people leading the event.', sections: [speakersList('corporate_business')] },
    { id: 'agenda', title: 'Agenda', subtitle: 'The programme. Leave empty to hide it.', sections: [sessionsList('Agenda', 'Real items only.', 'Add an agenda item')] },
    { id: 'registration', title: 'Registration', subtitle: TICKET_NOTE, sections: [ticketsList('Registration options', 'Leave empty to hide registration.', 'Add an option')] },
    { id: 'partners', title: 'Partners and questions', subtitle: 'Sponsors and common questions.', sections: [sponsorsList('Partners'), faqsList] }
  ],
  exhibition_trade: [
    { id: 'exhibitors', title: 'Exhibitors', subtitle: 'Who is exhibiting.', sections: [exhibitorsList] },
    { id: 'programme', title: 'Programme', subtitle: 'Talks and activities. Leave empty to hide it.', sections: [speakersList('exhibition_trade'), sessionsList('Programme', 'Real items only.', 'Add an item')] },
    { id: 'visitor', title: 'Visitor registration', subtitle: TICKET_NOTE, sections: [ticketsList('Visitor passes', 'Leave empty to hide registration.', 'Add a pass')] },
    { id: 'partners', title: 'Sponsors and questions', subtitle: 'Sponsors and common questions.', sections: [sponsorsList('Sponsors'), faqsList] }
  ],
  wedding_private: [
    { id: 'story', title: 'The couple and story', subtitle: 'Who is celebrating, and the story you want to tell.', sections: [
      { kind: 'fields', title: 'The couple', fields: [{ key: 'partnerOne', label: 'First name', required: true }, { key: 'partnerTwo', label: 'Second name', required: true }] },
      milestonesList
    ] },
    { id: 'itinerary', title: 'Day plan', subtitle: 'What happens when.', sections: [itineraryList] },
    { id: 'travel', title: 'Stay and gifts', subtitle: 'Where guests can stay, and gift links. Information only.', sections: [hotelsList, registryList] },
    { id: 'questions', title: 'Questions and hosts', subtitle: 'What guests ask, and the people to introduce.', sections: [faqsList, speakersList('wedding_private')] }
  ],
  award_ceremony: [
    { id: 'awards', title: 'Award categories', subtitle: 'Categories and nominees.', sections: [awardsList] },
    { id: 'jury', title: 'Jury, hosts and presenters', subtitle: 'The people behind the evening.', sections: [speakersList('award_ceremony')] },
    { id: 'programme', title: 'Programme', subtitle: 'The running order of the evening. Leave empty to hide it.', sections: [sessionsList('Programme', 'Real items only.', 'Add an item')] },
    { id: 'tickets', title: 'Tickets and sponsors', subtitle: TICKET_NOTE, sections: [ticketsList('Tickets', 'Leave empty to hide the tickets section.', 'Add a ticket'), sponsorsList('Sponsors and partners'), faqsList] }
  ],
  launch_reveal: [
    { id: 'product', title: 'The product', subtitle: 'What is being revealed.', sections: [
      { kind: 'fields', fields: [
        { key: 'productName', label: 'Product name', required: true }, { key: 'productTagline', label: 'Product tagline' },
        { key: 'heroHeadline', label: 'Headline', wide: true }, { key: 'heroSubheadline', label: 'Sub-headline', kind: 'textarea', wide: true },
        { key: 'revealVideoUrl', label: 'Reveal video link (YouTube or Vimeo)', kind: 'url', wide: true }
      ] }
    ] },
    { id: 'features', title: 'Highlights and specifications', subtitle: 'What makes it special.', sections: [highlightsList, specsList] },
    { id: 'programme', title: 'Presenters and programme', subtitle: 'Who presents, and when. Leave empty to hide them.', sections: [speakersList('launch_reveal'), sessionsList('Programme', 'Real items only.', 'Add an item')] },
    { id: 'preorder', title: 'Button and questions', subtitle: 'A button to your own page. The website takes no payment.', sections: [
      { kind: 'fields', title: 'Button to your own page', fields: [{ key: 'preorderText', label: 'Button text', placeholder: 'Find out more' }, { key: 'preorderUrl', label: 'Your own page (link)', kind: 'url', wide: true }] },
      sponsorsList('Partners'), faqsList
    ] }
  ]
};

/** The steps for a category: shared details, the category's own content steps, then media, contact and review. */
export function getSteps(category: EventCategoryId): StepSpec[] {
  return [detailsStep(category), whenWhereStep(category), brandingStep, ...CONTENT_STEPS[category], mediaStep, contactStep(category), reviewStep];
}

const STEP_CACHE = new Map<EventCategoryId, StepSpec[]>();
export const stepsFor = (category: EventCategoryId): StepSpec[] => {
  let s = STEP_CACHE.get(category);
  if (!s) { s = getSteps(category); STEP_CACHE.set(category, s); }
  return s;
};

/* ------------------------------------------------------------------ blanks and pruning */

const sameValue = (a: unknown, b: unknown): boolean => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => sameValue(x, b[i])) : a === b);
const isBlankEntry = (e: Entry, blank: Entry): boolean => Object.keys(blank).every((k) => k === 'id' || sameValue(e[k], blank[k]));

const BLANKS: Partial<Record<ListKey, () => Entry>> = {};
(Object.keys(CONTENT_STEPS) as EventCategoryId[]).forEach((c) => stepsFor(c).forEach((s) => s.sections.forEach((sec) => { if (sec.kind === 'list') BLANKS[sec.list] = sec.blank; })));

/** Drop cards that were added but never filled in. */
export function pruneBlank(f: IntakeForm): IntakeForm {
  const lists = { ...f.lists };
  LIST_KEYS.forEach((k) => { const make = BLANKS[k]; if (!make) return; const blank = make(); lists[k] = (f.lists[k] || []).filter((e) => !isBlankEntry(e, blank)); });
  return { ...f, lists };
}

/* ------------------------------------------------------------------ validation */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const HEX = /^#[0-9a-fA-F]{6}$/;
const TIME = /^\d{2}:\d{2}$/;
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
    case 'time': return TIME.test(s) ? undefined : 'Use a time such as 09:30.';
    case 'date': return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? undefined : 'Enter a valid date.';
    default: return undefined;
  }
}

export const errKey = (list: ListKey | string, id: string, field: string) => `${list}:${id}:${field}`;

/** Validate one step. Keys: scalar field key, or `list:entryId:field`. */
export function validateStep(stepIndex: number, form: IntakeForm): FieldErrors {
  const step = stepsFor(form.category)[stepIndex - 1];
  const errors: FieldErrors = {};
  if (!step) return errors;
  const clean = pruneBlank(form);
  const { v } = clean;
  for (const sec of step.sections) {
    if (sec.kind === 'fields') {
      sec.fields.forEach((f) => { const m = fieldError(f, v[f.key] ?? ''); if (m) errors[f.key] = m; });
      if (step.id === 'venue' && v.startDate && v.endDate && v.endDate < v.startDate) errors.endDate = 'The end date cannot be before the start date.';
      if (step.id === 'venue' && v.startTime && v.endTime && !v.endDate && v.endTime <= v.startTime) errors.endTime = 'The end time must be after the start time.';
    }
    if (sec.kind === 'list') {
      for (const e of clean.lists[sec.list]) sec.fields.forEach((f) => { const m = fieldError(f, e[f.key]); if (m) errors[errKey(sec.list, e.id, f.key)] = m; });
      if (sec.list === 'sessions') for (const e of clean.lists.sessions) { if (text(e, 'startTime') && text(e, 'endTime') && text(e, 'endTime') <= text(e, 'startTime')) errors[errKey('sessions', e.id, 'endTime')] = 'The end time must be after the start time.'; }
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
  stepsFor(form.category).forEach((_, i) => { const errors = validateStep(i + 1, form); if (Object.keys(errors).length) out.push({ step: i + 1, errors }); });
  return out;
}

/* ------------------------------------------------------------------ build requirements */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const lines = (v: unknown) => str(v).split('\n').map((l) => l.trim()).filter(Boolean);
const opt = (s: string) => (s ? s : undefined);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Turns the form into the project's requirements. Only what the organiser typed is carried over: no venue, dates, people, prices or
 * contact details are created, a blank list stays blank, and there is no payment, bank or UPI field of any kind.
 */
export function buildRequirements(input: IntakeForm): ClientRequirements {
  const f = pruneBlank(input);
  const category = f.category;
  const v = f.v; const L = f.lists;
  const name = str(v.name) || [str(v.partnerOne), str(v.partnerTwo)].filter(Boolean).join(' & ');
  const primary = HEX.test(str(v.primaryColor)) ? str(v.primaryColor) : '';
  const accent = HEX.test(str(v.accentColor)) ? str(v.accentColor) : '';

  const speakers: EventPerson[] = L.speakers.map((e, i) => ({
    id: e.id, name: str(e.name), role: str(e.role) || ROLES[category][0].value, title: opt(str(e.title)), organization: opt(str(e.organization)), bio: str(e.bio),
    topic: opt(str(e.topic)), photoUrl: opt(str(e.photo)), isFeatured: str(e.featured) === 'yes', socialUrl: opt(str(e.social)), displayOrder: i
  }));
  const personIdByName = new Map(speakers.map((s) => [s.name.toLowerCase(), s.id]));

  // Tracks come from the names Admin typed on sessions; a name used twice is one track.
  const tracks: EventTrack[] = [];
  const trackIdByName = new Map<string, string>();
  const PALETTE = ['#6d5efc', '#19c3a6', '#ff5d8f', '#f5a524', '#3b82f6', '#8b5cf6'];
  L.sessions.forEach((e) => {
    const n = str(e.track);
    if (n && str(e.kind) !== 'break' && !trackIdByName.has(n.toLowerCase())) {
      const id = `trk-${slug(n) || tracks.length + 1}`;
      trackIdByName.set(n.toLowerCase(), id);
      tracks.push({ id, name: n, color: PALETTE[tracks.length % PALETTE.length] });
    }
  });
  const sessions: EventSession[] = L.sessions.map((e) => ({
    id: e.id, title: str(e.title), description: str(e.description), day: str(e.day), date: str(e.date), startTime: str(e.startTime), endTime: str(e.endTime),
    trackId: str(e.kind) === 'break' ? undefined : trackIdByName.get(str(e.track).toLowerCase()), stage: opt(str(e.stage)),
    speakerIds: lines(e.speakers).map((n) => personIdByName.get(n.toLowerCase())).filter((x): x is string => Boolean(x)),
    isKeynote: str(e.kind) === 'keynote', tags: str(e.kind) === 'break' ? ['break'] : []
  }));
  const tickets: EventTicketTier[] = L.tickets.map((e) => {
    const price = str(e.price);
    return {
      id: e.id, name: str(e.name), price: /^\d+(\.\d+)?$/.test(price) ? Number(price) : price, currency: str(e.currency).toUpperCase(), description: str(e.description),
      features: lines(e.features), badge: opt(str(e.badge)), isAvailable: str(e.available) !== 'no', registrationUrl: opt(str(e.url))
    };
  });
  const sponsors: EventSponsor[] = L.sponsors.map((e) => ({ id: e.id, name: str(e.name), tier: (str(e.tier) || 'partner') as EventSponsor['tier'], logoUrl: opt(str(e.logo)), websiteUrl: opt(str(e.url)) }));
  const faqs: EventFAQItem[] = L.faqs.map((e) => ({ id: e.id, question: str(e.question), answer: str(e.answer) }));
  const gallery: EventMediaItem[] = L.gallery.map((e) => ({ id: e.id, title: str(e.caption) || 'Photo', type: 'photo', url: str(e.url), caption: opt(str(e.caption)) }));
  const exhibitors: EventExhibitor[] = L.exhibitors.map((e) => ({
    id: e.id, name: str(e.name), category: str(e.category), boothNumber: opt(str(e.booth)), hallSector: opt(str(e.hall)), description: str(e.description),
    logoUrl: opt(str(e.logo)), imageUrl: opt(str(e.image)), specHighlights: lines(e.specs), websiteUrl: opt(str(e.url))
  }));
  const awardCategories: EventAwardCategory[] = L.awards.map((e) => {
    const winner = str(e.winner).toLowerCase();
    return {
      id: e.id, name: str(e.name), description: str(e.description), sponsorName: opt(str(e.sponsor)),
      nominees: lines(e.nominees).map((l, j) => { const [title, ...rest] = l.split('|'); return { id: `${e.id}-n${j + 1}`, title: title.trim(), subtitle: rest.join('|').trim(), isWinner: Boolean(winner) && title.trim().toLowerCase() === winner, categoryId: e.id }; }).filter((n) => n.title)
    };
  });

  const hasWedding = category === 'wedding_private' && Boolean(str(v.partnerOne) || str(v.partnerTwo) || L.milestones.length || L.itinerary.length || L.hotels.length || L.registry.length);
  const weddingStory = hasWedding ? {
    coupleNames: [str(v.partnerOne), str(v.partnerTwo)].filter(Boolean).join(' & '), partnerOne: str(v.partnerOne), partnerTwo: str(v.partnerTwo),
    storyMilestones: L.milestones.map((e) => ({ id: e.id, title: str(e.title), date: opt(str(e.date)), text: str(e.text), imageUrl: opt(str(e.image)) })),
    ceremonyItinerary: L.itinerary.map((e): EventCeremonyItem => ({ id: e.id, time: str(e.time), eventName: str(e.eventName), venue: str(e.venue), dressCode: str(e.dressCode), description: opt(str(e.description)) })),
    hotelBlocks: L.hotels.map((e): EventHotelBlock => ({ id: e.id, hotelName: str(e.hotelName), address: str(e.address), bookingCode: opt(str(e.bookingCode)), link: opt(str(e.link)), deadline: opt(str(e.deadline)), distanceToVenue: opt(str(e.distance)) })),
    registryLinks: L.registry.map((e) => ({ storeName: str(e.storeName), url: str(e.url) }))
  } : undefined;

  const hasProduct = category === 'launch_reveal' && Boolean(str(v.productName) || L.highlights.length || L.specs.length);
  const productLaunch = hasProduct ? {
    productName: str(v.productName), tagline: str(v.productTagline), heroHeadline: str(v.heroHeadline), heroSubheadline: opt(str(v.heroSubheadline)), revealVideoUrl: opt(str(v.revealVideoUrl)),
    bentoHighlights: L.highlights.map((e): EventBentoHighlight => ({ id: e.id, title: str(e.title), subtitle: opt(str(e.subtitle)), description: str(e.description), metric: opt(str(e.metric)), imageUrl: opt(str(e.image)) })),
    techSpecs: L.specs.map((e): EventTechSpecGroup => ({
      group: str(e.group),
      items: lines(e.items).map((l) => { const i = l.indexOf(':'); return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: '', value: '' }; }).filter((it) => it.label && it.value)
    })),
    preorderCtaText: opt(str(v.preorderText)), preorderUrl: opt(str(v.preorderUrl))
  } : undefined;

  const socialLinks: Record<string, string> = {};
  ([['facebook', 'facebook'], ['instagram', 'instagram'], ['twitter', 'twitter'], ['linkedin', 'linkedin'], ['youtubeChannel', 'youtube']] as const).forEach(([k, out]) => { if (str(v[k])) socialLinks[out] = str(v[k]); });
  const youtubeUrls = lines(v.youtubeUrls);
  const youtubePlaylistUrls = lines(v.youtubePlaylistUrls);
  const googleDriveVideoUrls = lines(v.driveVideoUrls);
  const googleDriveGalleryUrl = opt(str(v.driveGalleryUrl));
  const timeText = [str(v.startTime), str(v.endTime)].filter(Boolean).join(' – ');
  const email = str(v.email).toLowerCase();

  const eventData: EventWebsiteData = {
    schemaVersion: '1.0', category,
    profile: {
      name, edition: opt(str(v.edition)), tagline: str(v.tagline), description: str(v.description),
      startDate: str(v.startDate), endDate: opt(str(v.endDate)), time: timeText, startTime: opt(str(v.startTime)), endTime: opt(str(v.endTime)), timezone: str(v.timezone),
      venueName: str(v.venueName), venueAddress: str(v.venueAddress), city: str(v.city), country: str(v.country),
      isVirtual: str(v.format) === 'virtual', isHybrid: str(v.format) === 'hybrid', virtualStreamUrl: opt(str(v.streamUrl)),
      organizerName: str(v.organizerName), organizerEmail: email, organizerPhone: opt(str(v.phone)),
      socialLinks: Object.keys(socialLinks).length ? socialLinks : {}
    },
    branding: { primaryColor: primary, accentColor: accent, typographyStyle: 'modern', logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)) },
    speakers, tracks, sessions, tickets, exhibitors, awardCategories, weddingStory, productLaunch, sponsors,
    venue: {
      venueName: str(v.venueName), address: str(v.venueAddress), city: str(v.city), country: str(v.country),
      metroTransit: opt(str(v.transitInfo)), parkingInfo: opt(str(v.parkingInfo)), airportInfo: opt(str(v.airportInfo)),
      wheelchairAccessible: str(v.accessible) === 'yes' ? true : str(v.accessible) === 'no' ? false : undefined
    },
    faqs, gallery, rsvpSubmissions: [],
    dataAvailability: {
      speakers: speakers.length > 0, schedule: sessions.length > 0, tickets: tickets.length > 0, exhibitors: exhibitors.length > 0, awards: awardCategories.length > 0,
      weddingStory: Boolean(weddingStory), productLaunch: Boolean(productLaunch), sponsors: sponsors.length > 0,
      venue: Boolean(str(v.venueName) || str(v.venueAddress)), faqs: faqs.length > 0, gallery: gallery.length > 0
    }
  };

  const location = [str(v.city), str(v.country)].filter(Boolean).join(', ');
  return {
    organizationName: name, category: 'event', organizationType: 'event', eventCategory: category,
    tagline: str(v.tagline), aboutText: str(v.description),
    contactPerson: opt(str(v.organizerName)), contactEmail: email, contactPhone: str(v.phone),
    address: [str(v.venueAddress), location].filter(Boolean).join(', ') || undefined,
    logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), additionalBrandingImages: [],
    primaryColor: opt(primary), accentColor: opt(accent),
    youtubeUrls, youtubePlaylistUrls, googleDriveGalleryUrl, googleDriveVideoUrls, socialLinks,
    designSelection: { mode: 'template' },
    selectedTemplate: f.template,
    eventData
  } as unknown as ClientRequirements;
}

/* ------------------------------------------------------------------ drafts */

const draftKey = (scope: string, category: string, templateId: string) => `dv:event-draft:${scope}:${category}:${templateId}`;
interface DraftEnvelope { version: 1; step: number; savedAt: string; form: IntakeForm }

/** Browser-local drafts, one per admin, event category and template. Every call is guarded: storage can be blocked or full. */
export const drafts = {
  available(): boolean {
    try { const k = '__dv_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch { return false; }
  },
  save(scope: string, category: string, templateId: string, step: number, form: IntakeForm): { ok: boolean; savedAt?: string; error?: string } {
    try {
      const env: DraftEnvelope = { version: 1, step, savedAt: new Date().toISOString(), form };
      window.localStorage.setItem(draftKey(scope, category, templateId), JSON.stringify(env));
      return { ok: true, savedAt: env.savedAt };
    } catch (e) { return { ok: false, error: e instanceof Error && /quota/i.test(e.message) ? 'Browser storage is full, so the draft could not be saved.' : 'The draft could not be saved in this browser.' }; }
  },
  load(scope: string, category: string, templateId: string): DraftEnvelope | null {
    try {
      const raw = window.localStorage.getItem(draftKey(scope, category, templateId));
      if (!raw) return null;
      const env = JSON.parse(raw) as DraftEnvelope;
      return env && env.version === 1 && env.form && typeof env.form === 'object' ? env : null;
    } catch { return null; }
  },
  clear(scope: string, category: string, templateId: string) { try { window.localStorage.removeItem(draftKey(scope, category, templateId)); } catch { /* ignore */ } }
};

/** Merge a stored draft over a fresh form so lists added in newer versions never come back undefined. */
export function mergeDraft(base: IntakeForm, saved: IntakeForm): IntakeForm {
  const lists = { ...base.lists };
  LIST_KEYS.forEach((k) => { if (Array.isArray(saved.lists?.[k])) lists[k] = saved.lists[k]; });
  return { ...base, v: { ...base.v, ...(saved.v || {}) }, lists };
}

/** Does the form hold anything the Admin typed? Used to decide whether a draft is worth keeping. */
export const hasContent = (f: IntakeForm) => Object.values(f.v).some(Boolean) || LIST_KEYS.some((k) => (f.lists[k] || []).length > 0);
