import type { ClientRequirements, GeneratedWebsite } from '../../../types/admin';
import type {
  CulturalActivity, CulturalActivityCategory, CulturalEvent, CulturalLeader, CulturalNewsArticle, CulturalSponsor, CulturalWebsiteData, PujaRitualScheduleItem
} from '../../../types/cultural';
import { art, type CulturalArtKind, type CulturalPaletteName } from '../kit/art';
import type { CulturalCategory, CulturalTemplateId } from '../types';

/**
 * Demo content for the template gallery and live previews ONLY. Every organisation, person, date, schedule and sponsor
 * here is fictional, and the preview shows a visible "Sample content" badge. None of it is ever copied into a client
 * project: generated sites render only what the client supplied. Images are generated SVG artwork (kit/art.ts); nothing is hotlinked.
 */

interface DemoSpec {
  id: CulturalTemplateId;
  templateName: string;
  archetype: CulturalCategory;
  org: string;
  native?: string;
  city: string;
  state: string;
  founded: number;
  palette: CulturalPaletteName;
  primary: string;
  accent: string;
  tagline: string;
  about: string;
  focus: CulturalActivityCategory[];
  membership?: boolean;
  donation?: boolean;
  trim?: { gallery?: number; news?: number; leaders?: number };
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateOnly = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const FIRST = ['Anirban', 'Meera', 'Soumik', 'Tanushree', 'Rahul', 'Ishita', 'Debojit', 'Sharmila', 'Kunal', 'Paromita', 'Arnab', 'Nandini', 'Subrata', 'Rimjhim', 'Pranab', 'Aditi'];
const LAST = ['Sen', 'Mitra', 'Bhattacharya', 'Dutta', 'Ghosh', 'Chatterjee', 'Basu', 'Sarkar', 'Roy', 'Das', 'Banerjee', 'Pal'];
const person = (i: number) => `${FIRST[i % FIRST.length]} ${LAST[(i * 5 + 3) % LAST.length]}`;

const ACTIVITY_LIBRARY: Record<CulturalActivityCategory, { title: string; description: string; schedule: string }[]> = {
  music: [{ title: 'Rabindra Sangeet circle', description: 'A weekly practice circle for voice and harmonium, open to beginners and experienced singers.', schedule: 'Saturdays, 5:00 pm' }, { title: 'Tabla and percussion class', description: 'Graded lessons in tabla with an annual recital.', schedule: 'Sundays, 10:00 am' }],
  dance: [{ title: 'Classical dance training', description: 'Foundation and intermediate batches in classical dance with annual stage presentations.', schedule: 'Tue and Thu, 6:00 pm' }, { title: 'Folk dance workshop', description: 'Seasonal workshops introducing regional folk traditions.', schedule: 'Monthly' }],
  theatre: [{ title: 'Community theatre group', description: 'Rehearsals and two staged productions a year, with roles on and off stage.', schedule: 'Fridays, 7:00 pm' }],
  literary: [{ title: 'Reading circle', description: 'Members read and discuss poetry, short stories and essays in Bengali and English.', schedule: 'First Sunday of the month' }, { title: 'Annual literary magazine', description: 'A members’ magazine of verse, prose and art, edited by a volunteer board.', schedule: 'Published each winter' }],
  arts: [{ title: 'Painting and sketching studio', description: 'Open studio sessions and a yearly members’ exhibition.', schedule: 'Saturdays, 11:00 am' }, { title: 'Alpona and craft workshop', description: 'Hands-on workshops in traditional floor art and handcrafts.', schedule: 'Before major festivals' }],
  workshop: [{ title: 'Heritage walk and workshop series', description: 'Guided neighbourhood walks followed by a short hands-on workshop.', schedule: 'Last Sunday of the month' }],
  competition: [{ title: 'Inter-school recitation contest', description: 'An annual contest in recitation and elocution for school students.', schedule: 'Each autumn' }],
  heritage: [{ title: 'Oral history project', description: 'Recording stories and songs from senior residents for the community archive.', schedule: 'Ongoing' }],
  community: [{ title: 'Neighbourhood cultural evenings', description: 'Open evenings of music, recitation and storytelling hosted in the community hall.', schedule: 'Second Saturday of the month' }, { title: 'Winter blanket drive', description: 'A volunteer drive that pairs cultural evenings with a community service.', schedule: 'Every December' }]
};

const EVENT_TITLES = ['Annual Day Celebration', 'Spring Cultural Evening', 'Monsoon Music Festival', 'Poetry and Prose Night', 'Heritage Week', 'Children’s Art Fair'];

function society(spec: DemoSpec): Pick<CulturalWebsiteData, 'leadership' | 'activities' | 'events' | 'news' | 'sponsors' | 'gallery' | 'membershipInfo'> {
  const activities: CulturalActivity[] = spec.focus.flatMap((cat) => ACTIVITY_LIBRARY[cat].map((a) => ({ ...a, category: cat }))).slice(0, 6).map((a, i) => ({
    id: `act${i}`, title: a.title, category: a.category, description: a.description, schedule: a.schedule, venue: `${spec.org.split(' ')[0]} Community Hall`,
    featuredImageUrl: art(['alpona', 'textile', 'stage', 'ink', 'lotus', 'mandala'][i % 6] as CulturalArtKind, `${spec.org}:a${i}`, spec.palette), isUpcoming: true, registrationRequired: i % 3 === 0
  }));
  const offsets = [6, 19, 41, -14, -52];
  const events: CulturalEvent[] = offsets.map((o, i) => ({
    id: `ev${i}`, title: EVENT_TITLES[i % EVENT_TITLES.length], category: spec.focus[i % spec.focus.length], description: i < 3 ? 'An evening of performances and conversation. Open to members and guests.' : 'A well-attended evening that members and neighbours remember warmly.',
    startDate: dateOnly(o), time: i % 2 ? '6:30 pm' : '5:00 pm', venue: `${spec.org.split(' ')[0]} Auditorium`, featuredImageUrl: art('stage', `${spec.org}:e${i}`, spec.palette),
    status: o >= 0 ? 'upcoming' : 'completed', isFeatured: i === 0, registrationUrl: i === 0 ? 'https://events.example/register' : undefined
  }));
  const roles: [string, CulturalLeader['roleCategory']][] = [['President', 'executive'], ['Vice President', 'executive'], ['Secretary', 'executive'], ['Treasurer', 'executive'], ['Cultural Director', 'organizer'], ['Advisor', 'advisory'], ['Programme Coordinator', 'organizer'], ['Youth Coordinator', 'volunteer']];
  const leadership: CulturalLeader[] = roles.slice(0, spec.trim?.leaders ?? 8).map(([designation, roleCategory], i) => ({ id: `ld${i}`, name: person(i + spec.founded % 7), designation, roleCategory, displayOrder: i + 1, profileImageUrl: art('portrait', `${spec.org}:p${i}`, spec.palette) }));
  const news: CulturalNewsArticle[] = [
    { id: 'n0', title: 'Registrations open for the new term', summary: 'Classes and workshops for the new term are open for registration at the clubhouse and online.', content: 'Classes and workshops for the new term are open for registration at the clubhouse and online.', publishedAt: dateOnly(-3), category: 'Notice', isPublished: true },
    { id: 'n1', title: 'Annual general meeting', summary: 'Members are invited to the annual general meeting to review the year and elect the new committee.', content: 'Members are invited to the annual general meeting to review the year and elect the new committee.', publishedAt: dateOnly(-9), category: 'Members', isPublished: true },
    { id: 'n2', title: 'Volunteers welcome', summary: 'We are looking for volunteers to help with stage, hospitality and documentation.', content: 'We are looking for volunteers to help with stage, hospitality and documentation.', publishedAt: dateOnly(-15), category: 'Community', isPublished: true }
  ].slice(0, spec.trim?.news ?? 3);
  const sponsors: CulturalSponsor[] = ['Hearth & Home Bookshop', 'Brightwater Foundation', 'Lantern Press', 'Orchard Sweets'].map((name, i) => ({ id: `sp${i}`, name, tier: i === 0 ? 'principal' : i === 1 ? 'associate' : 'community' }));
  const gallery = Array.from({ length: spec.trim?.gallery ?? 8 }, (_, i) => ({ id: `g${i}`, title: ['Annual day', 'Rehearsal', 'Workshop', 'Exhibition', 'Recital', 'Community evening', 'Backstage', 'Heritage walk'][i % 8], category: 'Gallery', imageUrl: art(['alpona', 'stage', 'ink', 'textile', 'lotus', 'mandala', 'dhak', 'diya'][i % 8] as CulturalArtKind, `${spec.org}:g${i}`, spec.palette), caption: ['Annual day', 'Rehearsal', 'Workshop', 'Exhibition', 'Recital', 'Community evening', 'Backstage', 'Heritage walk'][i % 8] }));
  const membershipInfo = spec.membership ? { enabled: true, membershipTypes: [{ name: 'Individual', fee: '₹600 a year', benefits: ['Voting rights', 'Discounted workshops', 'Members’ newsletter'] }, { name: 'Family', fee: '₹1,000 a year', benefits: ['Two adults and children', 'Priority registration', 'Free entry to annual day'] }, { name: 'Student', fee: '₹250 a year', benefits: ['Open to students with ID', 'Workshop discounts'] }], guidelines: 'Membership runs from April to March. New members are welcomed at the monthly meeting.' } : undefined;
  return { leadership, activities, events, news, sponsors, gallery, membershipInfo };
}

const DAYS: [string, string, string][] = [['Maha Shashthi', 'মহা ষষ্ঠী', 'Bodhon and Amantran'], ['Maha Saptami', 'মহাসপ্তমী', 'Kola Bou snan and Pran Pratistha'], ['Maha Ashtami', 'মহাষ্টমী', 'Pushpanjali and Sandhi Puja'], ['Maha Nabami', 'মহানবমী', 'Maha Aarti and Havan'], ['Vijaya Dashami', 'বিজয়া দশমী', 'Sindoor Khela and Visarjan']];

function puja(spec: DemoSpec): Pick<CulturalWebsiteData, 'leadership' | 'activities' | 'events' | 'news' | 'sponsors' | 'gallery' | 'pujaSchedule' | 'pujaTheme' | 'visitorGuide' | 'donationInfo'> {
  const pujaSchedule: PujaRitualScheduleItem[] = DAYS.map(([dayName, dayNameNative, headline], i) => ({
    id: `d${i}`, dayName, dayNameNative, date: dateOnly(34 + i), tithiInfo: i === 2 ? 'Ashtami tithi (sample)' : undefined,
    rituals: [
      { time: '6:30 am', name: i === 0 ? 'Bodhon' : 'Morning aarti' },
      { time: i === 2 ? '10:00 am' : '9:30 am', name: headline.split(' and ')[0], description: headline.includes(' and ') ? headline.split(' and ')[1] : undefined, isKeyRitual: i === 2 },
      { time: '12:30 pm', name: 'Pushpanjali', nameNative: 'পুষ্পাঞ্জলি', isKeyRitual: i >= 2 && i < 4 },
      { time: '1:30 pm', name: 'Bhog distribution' },
      { time: '7:00 pm', name: 'Evening aarti' }
    ]
  }));
  const pujaTheme = { currentThemeName: 'Anandamayi: a lamp in every window', currentThemeNameNative: 'আনন্দময়ী', editionYear: `${new Date().getFullYear()} edition (sample)`, themeConcept: 'This year’s pandal gathers thousands of handmade clay lamps into a single glowing canopy, a quiet tribute to the neighbours who kept a light on for each other.', themeStory: 'Local artisans and volunteers spent weeks shaping and painting the lamps. Every family in the para contributed one.', idolArtisan: 'Idol sculpted in clay by a family of artisans (sample)', pandalArchitecture: 'A canopy of woven bamboo and hand-painted clay lamps', lightingConcept: 'Warm, low-glare lighting that follows the evening aarti', themeImages: [{ url: art('pandal', `${spec.org}:t0`, spec.palette), caption: 'The pandal canopy', category: 'pandal' as const }, { url: art('diya', `${spec.org}:t1`, spec.palette), caption: 'Hand-painted lamps', category: 'lighting' as const }, { url: art('alpona', `${spec.org}:t2`, spec.palette), caption: 'Alpona at the entrance', category: 'pratima' as const }], pastThemes: [{ year: new Date().getFullYear() - 1, themeName: 'Rivers remember', description: 'A pandal drawn from the memory of the old river ghats.' }, { year: new Date().getFullYear() - 2, themeName: 'Handloom', description: 'Woven textiles and looms as architecture.' }, { year: new Date().getFullYear() - 3, themeName: 'The village fair', description: 'A recreated rural mela.' }] };
  const visitorGuide = { pandalLocation: `${spec.org.split(' ')[0]} Maidan, ${spec.city}`, landmark: 'Next to the old community library', nearestMetro: 'Nearest metro: 12 minutes on foot (sample)', nearestBusStop: 'Bus stop opposite the main gate', parkingInfo: 'Limited parking; please use public transport', visitingHours: '9:00 am to 11:00 pm', crowdGuidelines: ['Evenings are busiest; mornings are quieter', 'Please queue and follow volunteers’ directions'], safetyAccessibility: ['Wheelchair access at the north gate', 'First-aid desk near the entrance'], emergencyContactPhone: '+00 000 000 0000' };
  const donationInfo = spec.donation ? { campaignTitle: 'Support this year’s Puja', appealMessage: 'The puja is funded by neighbours. Every contribution helps with the idol, the pandal, bhog for everyone and cultural evenings.', causes: [{ id: 'c0', title: 'Bhog for all', description: 'Free community meals on Ashtami and Nabami.', suggestedAmounts: [250, 500, 1000] }, { id: 'c1', title: 'Cultural evenings', description: 'Stage, sound and artists’ honorarium.', suggestedAmounts: [500, 1000] }], transparencyNote: 'Accounts are shared with members at the annual meeting.', contactForDonations: 'Contact the treasurer at the committee office to contribute.' } : undefined;
  const base = society({ ...spec, focus: spec.focus, membership: false });
  const leadership: CulturalLeader[] = [['President', 'executive'], ['Secretary', 'executive'], ['Treasurer', 'executive'], ['Cultural Convenor', 'organizer'], ['Volunteer Captain', 'volunteer'], ['Chief Advisor', 'advisory'], ['Hospitality Lead', 'organizer'], ['Decoration Lead', 'organizer']].map(([designation, roleCategory], i) => ({ id: `ld${i}`, name: person(i + 4), designation, roleCategory: roleCategory as CulturalLeader['roleCategory'], displayOrder: i + 1, profileImageUrl: art('portrait', `${spec.org}:p${i}`, spec.palette) }));
  const activities: CulturalActivity[] = [{ id: 'pa0', title: 'Inaugural cultural evening', category: 'music', description: 'Devotional music and folk songs by local artists.', schedule: 'Shashthi evening, 7:30 pm', venue: 'Main stage', isUpcoming: true }, { id: 'pa1', title: 'Dhunuchi dance', category: 'dance', description: 'The traditional dhunuchi nach, open to everyone who wants to join.', schedule: 'Ashtami evening, 8:00 pm', venue: 'Pandal courtyard', isUpcoming: true }, { id: 'pa2', title: 'Children’s drawing contest', category: 'competition', description: 'Free drawing contest for children aged 5 to 14.', schedule: 'Saptami morning, 10:00 am', venue: 'Community hall', isUpcoming: true, registrationRequired: true }, { id: 'pa3', title: 'Bengali theatre evening', category: 'theatre', description: 'A short play by the para’s theatre group.', schedule: 'Nabami evening, 7:30 pm', venue: 'Main stage', isUpcoming: true }].map((a, i) => ({ ...a, category: a.category as CulturalActivityCategory, featuredImageUrl: art((['stage', 'dhak', 'ink', 'stage'] as CulturalArtKind[])[i], `${spec.org}:a${i}`, spec.palette) }));
  return { ...base, leadership: leadership.slice(0, spec.trim?.leaders ?? 8), activities, events: [], pujaSchedule, pujaTheme, visitorGuide, donationInfo };
}

function build(spec: DemoSpec): { requirements: ClientRequirements; culturalData: CulturalWebsiteData; website: GeneratedWebsite } {
  const isPuja = spec.archetype === 'puja_committee';
  const part = isPuja ? puja(spec) : society(spec);
  const cover = art(isPuja ? 'pandal' : 'alpona', spec.org, spec.palette);
  const slug = spec.org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const culturalData: CulturalWebsiteData = {
    schemaVersion: '1.0', websiteType: spec.archetype, festivalType: isPuja ? 'durga_puja' : undefined,
    organization: { name: spec.org, nativeName: spec.native, type: spec.archetype, establishedYear: spec.founded, tagline: spec.tagline, description: spec.about, history: `${spec.org} began as a handful of neighbours meeting in a borrowed room. Decades later it is still run by volunteers and still open to everyone.`, mission: 'To keep our traditions alive and make them easy for everyone in the neighbourhood to join.', vision: 'A neighbourhood where every generation takes part in its own culture.', coreValues: ['Community', 'Tradition', 'Openness'], headquarters: `${spec.org.split(' ')[0]} Community Hall`, city: spec.city, state: spec.state, country: 'India', contactPerson: person(2), contactEmail: `hello@${slug}.example`, contactPhone: '+00 000 000 0000', socialLinks: { facebook: 'https://facebook.example/page', instagram: 'https://instagram.example/page' } },
    branding: { coverImageUrl: cover, primaryColor: spec.primary, accentColor: spec.accent, typographyStyle: 'heritage' },
    ...part,
    dataAvailability: { leadership: false, activities: false, events: false, gallery: false, sponsors: false, news: false }
  };
  culturalData.dataAvailability = {
    leadership: culturalData.leadership.length > 0, activities: culturalData.activities.length > 0, events: culturalData.events.length > 0, gallery: culturalData.gallery.length > 0,
    sponsors: culturalData.sponsors.length > 0, news: culturalData.news.length > 0, pujaSchedule: (culturalData.pujaSchedule?.length || 0) > 0, pujaTheme: Boolean(culturalData.pujaTheme),
    visitorGuide: Boolean(culturalData.visitorGuide), donationInfo: Boolean(culturalData.donationInfo), membership: Boolean(culturalData.membershipInfo?.enabled)
  };
  const selectedTemplate = { templateId: spec.id, templateVersion: '1.0.0', templateName: spec.templateName, websiteCategory: spec.archetype, selectedAt: '2026-01-01T00:00:00.000Z' };
  const requirements = {
    organizationName: spec.org, category: isPuja ? 'puja_committee' : 'cultural', organizationType: isPuja ? 'puja_committee' : 'cultural', culturalArchetype: spec.archetype, tagline: spec.tagline, aboutText: spec.about,
    contactEmail: `hello@${slug}.example`, contactPhone: '+00 000 000 0000', address: `${spec.org.split(' ')[0]} Community Hall, ${spec.city}, ${spec.state}`, primaryColor: spec.primary, accentColor: spec.accent,
    coverImageUrl: cover, socialLinks: { facebook: 'https://facebook.example/page', instagram: 'https://instagram.example/page' }, culturalData, selectedTemplate
  } as unknown as ClientRequirements;
  const website = {
    themeAccent: spec.id, layoutPreset: 'editorial', fontFamily: 'Inter, sans-serif', simulatedDomain: `${slug}.example`, heroHeadline: spec.org, heroDescription: spec.tagline, heroImage: cover,
    metrics: [], eventsTitle: '', eventsList: [], aboutContent: spec.about, committeeTitle: '', committeeList: [], galleryTitle: '', galleryList: [], culturalData, selectedTemplate
  } as unknown as GeneratedWebsite;
  return { requirements, culturalData, website };
}

/** One entry per template: the fictional organisation that fills the template in the library. */
export const DEMO_SPECS: Record<CulturalTemplateId, DemoSpec> = {
  'cultural-heritage': { id: 'cultural-heritage', templateName: 'Cultural Heritage', archetype: 'cultural_society', org: 'Nandanpur Heritage Society', native: 'নন্দনপুর হেরিটেজ সোসাইটি', city: 'Nandanpur', state: 'West Bengal', founded: 1948, palette: 'ivory', primary: '#7A1F2B', accent: '#B8893C', tagline: 'Keeping the old songs, stories and crafts of our town alive.', about: 'A registered society devoted to the music, literature and crafts of the region. We run classes, an oral-history archive and a calendar of public programmes.', focus: ['heritage', 'music', 'literary', 'arts'], membership: true },
  'arts-literature-society': { id: 'arts-literature-society', templateName: 'Arts & Literature Society', archetype: 'cultural_society', org: 'Kaveri Arts & Letters Circle', city: 'Kaveripur', state: 'Karnataka', founded: 1986, palette: 'sand', primary: '#1F2A44', accent: '#D2512B', tagline: 'Readings, exhibitions and a magazine made by members.', about: 'A circle of writers, painters and readers. We host monthly readings, a yearly exhibition and publish a members’ magazine.', focus: ['literary', 'arts', 'workshop', 'competition'], membership: true },
  'dance-music-association': { id: 'dance-music-association', templateName: 'Dance & Music Association', archetype: 'cultural_society', org: 'Taal-Laya Sangeet Mandali', city: 'Madhyapur', state: 'Maharashtra', founded: 1972, palette: 'plum', primary: '#2A0E3C', accent: '#F2A33A', tagline: 'Where rhythm meets tradition.', about: 'A music and dance association with weekly classes in vocal, instrumental and classical dance, and a season of stage performances.', focus: ['music', 'dance', 'community'], membership: true },
  'community-cultural-association': { id: 'community-cultural-association', templateName: 'Community Cultural Association', archetype: 'cultural_society', org: 'Mitali Community Cultural Association', city: 'Mitalipur', state: 'Odisha', founded: 1999, palette: 'teal', primary: '#0F6E6B', accent: '#F0A12B', tagline: 'A cultural home for the whole neighbourhood.', about: 'A friendly neighbourhood association with something for every age: cultural evenings, classes, volunteering and festivals.', focus: ['community', 'dance', 'arts', 'theatre'], membership: true },
  'modern-festival-organization': { id: 'modern-festival-organization', templateName: 'Modern Festival & Cultural Organization', archetype: 'cultural_society', org: 'Utsav Collective', city: 'Riverbend', state: 'Gujarat', founded: 2014, palette: 'night', primary: '#FF4D2E', accent: '#FFD23F', tagline: 'Three days of music, dance and food on the riverfront.', about: 'A festival organisation producing an annual riverfront festival of music, dance, theatre and food, with workshops through the year.', focus: ['music', 'dance', 'theatre', 'workshop'], trim: { news: 2 } },

  'traditional-durga-puja': { id: 'traditional-durga-puja', templateName: 'Traditional Durga Puja', archetype: 'puja_committee', org: 'Dakshinpalli Sarbojanin Durgotsav', native: 'দক্ষিণপল্লী সর্বজনীন দুর্গোৎসব', city: 'Dakshinpalli', state: 'West Bengal', founded: 1958, palette: 'vermilion', primary: '#B3121B', accent: '#E0A526', tagline: 'Our para’s Durga Puja, open to all.', about: 'A neighbourhood puja committee that has organised the community Durga Puja for over sixty years, with rituals, cultural evenings and a shared bhog.', focus: ['music', 'dance', 'community'], donation: true },
  'premium-modern-durga-puja': { id: 'premium-modern-durga-puja', templateName: 'Premium Modern Durga Puja', archetype: 'puja_committee', org: 'Aurora Park Durgotsav', city: 'Aurora Park', state: 'West Bengal', founded: 2003, palette: 'night', primary: '#8E1B2A', accent: '#D9B26A', tagline: 'A contemporary Durga Puja of light, craft and calm.', about: 'A modern community puja known for its themed pandal, thoughtful lighting and a programme of evening performances.', focus: ['music', 'dance', 'theatre'], donation: true },
  'community-puja-committee': { id: 'community-puja-committee', templateName: 'Community Puja Committee', archetype: 'puja_committee', org: 'Shantipara Pally Puja Committee', city: 'Shantipara', state: 'West Bengal', founded: 1991, palette: 'marigold', primary: '#E4572E', accent: '#2E8B57', tagline: 'Our puja is made by our neighbours.', about: 'A volunteer-run neighbourhood puja where everyone has a part to play, from decorations and bhog to cultural evenings.', focus: ['community', 'music', 'competition'], donation: true },
  'heritage-traditional-puja': { id: 'heritage-traditional-puja', templateName: 'Heritage & Traditional Puja', archetype: 'puja_committee', org: 'Barir Puja Heritage Trust', native: 'বাড়ির পূজা হেরিটেজ ট্রাস্ট', city: 'Old Chandannagar', state: 'West Bengal', founded: 1790, palette: 'sand', primary: '#8C3B1E', accent: '#2F4A3A', tagline: 'A family puja carried through more than two centuries.', about: 'A trust that keeps the household Durga Puja of an old family alive, with its rituals, songs and recipes passed from generation to generation.', focus: ['heritage', 'music'], donation: true, trim: { gallery: 6 } },
  'festival-experience-celebration': { id: 'festival-experience-celebration', templateName: 'Festival Experience & Celebration', archetype: 'puja_committee', org: 'Metro Square Sharadotsav', city: 'Metro Square', state: 'West Bengal', founded: 2010, palette: 'indigo', primary: '#E5338A', accent: '#FFB400', tagline: 'Five days of puja, performance and street food.', about: 'A large city-centre puja festival with a full timetable of rituals, cultural performances and food stalls.', focus: ['music', 'dance', 'community'], donation: true }
};

export const DEMO_BUILDERS = Object.fromEntries(
  (Object.keys(DEMO_SPECS) as CulturalTemplateId[]).map((id) => [id, () => build(DEMO_SPECS[id])])
) as Record<CulturalTemplateId, () => ReturnType<typeof build>>;
