import type { EventWebsiteData, EventPerson, EventSession } from '../../../types/event';
import type { EventCategoryId } from '../ids';

/**
 * Fictional sample events used only by the library's "sample" preview, to show how a client's data lands in a template.
 * Everything here is invented on purpose and labelled "Sample content: fictional event" wherever it is shown. Addresses use
 * reserved `.example` domains and there are no photographs of anyone. It is never written to a project.
 */

const person = (id: string, name: string, title: string, organization: string, topic: string, featured = false): EventPerson => ({
  id, name, role: 'speaker', title, organization, bio: '', topic, isFeatured: featured, displayOrder: 0,
});

const session = (id: string, title: string, day: string, date: string, startTime: string, endTime: string, over: Partial<EventSession> = {}): EventSession => ({
  id, title, description: '', day, date, startTime, endTime, speakerIds: [], isKeynote: false, ...over,
});

const base = (category: EventCategoryId): EventWebsiteData => ({
  schemaVersion: '1.0',
  category,
  profile: {
    name: 'Beacon Dev Summit 2027', tagline: 'Two days of practical engineering talks', description: 'A fictional sample event that shows how your details appear in this design: your name, dates, venue, speakers, schedule and tickets.',
    startDate: '2027-03-18', endDate: '2027-03-19', time: '09:00 AM - 06:00 PM', startTime: '09:00', endTime: '18:00', timezone: 'GMT',
    venueName: 'Riverside Hall', venueAddress: '12 Quay Road', city: 'Sampleton', country: 'Exampleland',
    organizerName: 'Beacon Events (sample)', organizerEmail: 'hello@beacon-summit.example', organizerPhone: '+00 000 000 0000',
    socialLinks: { linkedin: 'https://linkedin.example/beacon-summit', youtube: 'https://youtube.example/beacon-summit' },
  },
  branding: { primaryColor: '', accentColor: '', typographyStyle: 'modern' },
  speakers: [], tracks: [], sessions: [], tickets: [], exhibitors: [], awardCategories: [], sponsors: [],
  venue: { venueName: 'Riverside Hall', address: '12 Quay Road', city: 'Sampleton', country: 'Exampleland', airportInfo: 'The airport is 30 minutes away by train.', metroTransit: 'Quay Road station is a five-minute walk.', parkingInfo: 'Public parking is available next to the hall.', wheelchairAccessible: true },
  faqs: [
    { id: 'f1', question: 'Will the talks be recorded?', answer: 'Yes. Recordings are sent to ticket holders after the event.' },
    { id: 'f2', question: 'Is there a code of conduct?', answer: 'Yes. It applies to everyone at the venue and online.' },
    { id: 'f3', question: 'Can I bring a colleague?', answer: 'Every attendee needs their own pass; passes can be transferred.' },
  ],
  gallery: [],
  dataAvailability: { speakers: false, schedule: false, tickets: false, exhibitors: false, awards: false, weddingStory: false, productLaunch: false, sponsors: false, venue: true, faqs: true, gallery: false },
});

const conference = (): EventWebsiteData => {
  const d = base('conference_seminar');
  d.speakers = [
    person('s1', 'Alex Morgan', 'Principal Engineer', 'Northbridge Labs', 'Designing for failure', true),
    person('s2', 'Sam Rivera', 'Design Systems Lead', 'Paperwork Co', 'Tokens that last'),
    person('s3', 'Jordan Lee', 'Staff Engineer', 'Quarry Cloud', 'The 100 ms budget'),
    person('s4', 'Casey Patel', 'Accessibility Lead', 'Hexa Group', 'Accessible by default'),
    person('s5', 'Riley Chen', 'ML Engineer', 'Orbit Data', 'Evals as unit tests'),
    person('s6', 'Taylor Nguyen', 'Browser Engineer', 'Open source', 'What ships in CSS'),
  ];
  d.tracks = [
    { id: 't1', name: 'Main stage', color: '#7c5cff' }, { id: 't2', name: 'Build', color: '#22e1c3' }, { id: 't3', name: 'Design', color: '#ff5c8a' },
  ];
  d.sessions = [
    session('a1', 'Registration and coffee', 'Day 1', '2027-03-18', '08:30 AM', '09:30 AM', { tags: ['break'] }),
    session('a2', 'Opening keynote', 'Day 1', '2027-03-18', '09:30 AM', '10:30 AM', { trackId: 't1', speakerIds: ['s1'], isKeynote: true }),
    session('a3', 'Designing for failure', 'Day 1', '2027-03-18', '10:45 AM', '11:30 AM', { trackId: 't1', speakerIds: ['s1'] }),
    session('a4', 'Tokens that last', 'Day 1', '2027-03-18', '10:45 AM', '11:30 AM', { trackId: 't3', speakerIds: ['s2'] }),
    session('a5', 'Evals as unit tests', 'Day 1', '2027-03-18', '10:45 AM', '11:30 AM', { trackId: 't2', speakerIds: ['s5'] }),
    session('a6', 'Lunch', 'Day 1', '2027-03-18', '12:30 PM', '02:00 PM', { tags: ['break'] }),
    session('a7', 'The 100 ms budget', 'Day 1', '2027-03-18', '02:00 PM', '02:45 PM', { trackId: 't1', speakerIds: ['s3'] }),
    session('b1', 'Coffee and hallway track', 'Day 2', '2027-03-19', '09:00 AM', '09:30 AM', { tags: ['break'] }),
    session('b2', 'Accessible by default', 'Day 2', '2027-03-19', '09:30 AM', '10:30 AM', { trackId: 't1', speakerIds: ['s4'], isKeynote: true }),
    session('b3', 'What ships in CSS', 'Day 2', '2027-03-19', '10:45 AM', '11:30 AM', { trackId: 't2', speakerIds: ['s6'] }),
    session('b4', 'Closing remarks', 'Day 2', '2027-03-19', '04:00 PM', '04:30 PM', { trackId: 't1', isKeynote: true }),
  ];
  d.tickets = [
    { id: 'k1', name: 'Early pass', price: 199, currency: 'GBP', description: 'Both days', features: ['Both conference days', 'All tracks', 'Lunch and coffee'], isAvailable: true, registrationUrl: 'https://tickets.example/beacon' },
    { id: 'k2', name: 'Workshop pass', price: 349, currency: 'GBP', description: 'Includes a workshop day', features: ['Everything in Early pass', 'One hands-on workshop', 'Workshop materials'], badge: 'Best value', isAvailable: true, registrationUrl: 'https://tickets.example/beacon' },
    { id: 'k3', name: 'Standard pass', price: 249, currency: 'GBP', description: 'Both days', features: ['Both conference days', 'All tracks', 'Lunch and coffee'], isAvailable: true },
  ];
  d.sponsors = [
    { id: 'p1', name: 'Northbridge Labs', tier: 'platinum' }, { id: 'p2', name: 'Quarry Cloud', tier: 'platinum' },
    { id: 'p3', name: 'Orbit Data', tier: 'gold' }, { id: 'p4', name: 'Paperwork Co', tier: 'gold' }, { id: 'p5', name: 'Hexa Group', tier: 'gold' },
  ];
  d.dataAvailability = { ...d.dataAvailability, speakers: true, schedule: true, tickets: true, sponsors: true };
  return d;
};

const wedding = (): EventWebsiteData => {
  const d = base('wedding_private');
  d.profile = {
    ...d.profile, name: 'Nora & Theo', tagline: 'We are getting married, and we would love you there', startDate: '2027-06-12', endDate: undefined, startTime: '16:00', endTime: '23:00', time: '16:00 – 23:00',
    description: 'A fictional sample wedding that shows how a couple’s details appear in this design: names, date, story, the day plan, travel and stay, gift links and questions.',
    venueName: 'Willow Barn', venueAddress: '4 Orchard Lane', city: 'Sampleton', country: 'Exampleland', organizerName: 'Nora and Theo (sample)', organizerEmail: 'hello@nora-and-theo.example', organizerPhone: undefined, socialLinks: {},
  };
  d.venue = { venueName: 'Willow Barn', address: '4 Orchard Lane', city: 'Sampleton', country: 'Exampleland', airportInfo: 'The nearest airport is about forty minutes away by car.', metroTransit: 'A shuttle leaves both hotels at 3 pm.', wheelchairAccessible: true };
  d.faqs = [
    { id: 'f1', question: 'Can I bring a plus-one?', answer: 'Your invitation says how many seats are reserved for you.' },
    { id: 'f2', question: 'Are children welcome?', answer: 'Yes, at the ceremony and the dinner.' },
    { id: 'f3', question: 'What if it rains?', answer: 'The ceremony moves indoors, at the same time.' },
  ];
  d.weddingStory = {
    coupleNames: 'Nora & Theo', partnerOne: 'Nora', partnerTwo: 'Theo',
    storyMilestones: [
      { id: 'm1', title: 'A bookshop on a rainy day', date: '2019', text: 'Two people reached for the same book. One of them let go.' },
      { id: 'm2', title: 'Coffee that became dinner', date: '2020', text: 'A short coffee turned into a long walk home.' },
      { id: 'm3', title: 'A small flat and a big dog', date: '2022', text: 'We moved in together and adopted a dog with strong opinions.' },
      { id: 'm4', title: 'The question', date: '2026', text: 'At the top of our favourite trail, with a very shaky voice.' },
    ],
    ceremonyItinerary: [
      { id: 'c1', time: '19:00', eventName: 'Welcome drinks', venue: 'The Orchard', dressCode: 'Garden formal', description: 'Casual drinks and lawn games the evening before.' },
      { id: 'c2', time: '16:00', eventName: 'Ceremony', venue: 'The Lawn', dressCode: 'Garden formal', description: 'Please arrive by half past three.' },
      { id: 'c3', time: '17:30', eventName: 'Reception', venue: 'The Barn', dressCode: 'Garden formal', description: 'Dinner, speeches and dancing.' },
    ],
    hotelBlocks: [
      { id: 'h1', hotelName: 'The Lantern Inn', address: '1 River Road', bookingCode: 'NORATHEO', distanceToVenue: '5 min' },
      { id: 'h2', hotelName: 'The Mill House', address: '9 Main Street', deadline: '30 April', distanceToVenue: '12 min' },
    ],
    registryLinks: [{ storeName: 'Home registry', url: 'https://registry.example/nora-theo' }, { storeName: 'Honeymoon fund', url: 'https://honeymoon.example/nora-theo' }],
  };
  d.dataAvailability = { ...d.dataAvailability, weddingStory: true, faqs: true };
  return d;
};

const festival = (): EventWebsiteData => {
  const d = base('festival_concert');
  d.profile = {
    ...d.profile, name: 'Riverlight Open Air', tagline: 'Two nights of live music by the water', startDate: '2027-07-16', endDate: '2027-07-17', startTime: '16:00', endTime: '23:30', time: '16:00 – 23:30', timezone: 'BST',
    description: 'A fictional sample festival that shows how a festival appears in this design: its name, dates and venue, the line-up, the running order, passes and questions.',
    venueName: 'The Meadow', venueAddress: '1 Mill Lane', city: 'Sampleton', country: 'Exampleland', organizerName: 'Riverlight Events (sample)', organizerEmail: 'hello@riverlight.example', organizerPhone: '+00 000 000 0000',
    socialLinks: { instagram: 'https://instagram.example/riverlight', youtube: 'https://youtube.example/riverlight' },
  };
  d.venue = { venueName: 'The Meadow', address: '1 Mill Lane', city: 'Sampleton', country: 'Exampleland', airportInfo: 'The nearest airport is an hour away by coach.', metroTransit: 'A free shuttle runs from Sampleton station all evening.', parkingInfo: 'Day parking is available in the next field.', wheelchairAccessible: true };
  d.speakers = [
    person('a1', 'Lanterns', 'Headliner', '', 'Friday · Main stage · 21:30', true),
    person('a2', 'Marlow Fox', 'Headliner', '', 'Saturday · Main stage · 21:30', true),
    person('a3', 'The Quiet Hours', 'Special guest', '', 'Friday · Main stage · 20:00'),
    person('a4', 'Ines Calder', 'Live set', '', 'Saturday · River stage · 19:30'),
    person('a5', 'Pale Harbour', 'Live set', '', 'Saturday · River stage · 18:00'),
  ];
  d.sessions = [
    session('s1', 'Gates open', 'Friday', '2027-07-16', '04:00 PM', '05:00 PM'),
    session('s2', 'Opening set', 'Friday', '2027-07-16', '05:30 PM', '06:30 PM'),
    session('s3', 'River stage', 'Friday', '2027-07-16', '07:00 PM', '08:00 PM'),
    session('s4', 'The Quiet Hours', 'Friday', '2027-07-16', '08:00 PM', '09:00 PM'),
    session('s5', 'Lanterns', 'Friday', '2027-07-16', '09:30 PM', '11:00 PM', { isKeynote: true }),
    session('s6', 'Last call', 'Friday', '2027-07-16', '11:15 PM', '11:30 PM'),
    session('t1', 'Gates open', 'Saturday', '2027-07-17', '03:00 PM', '04:00 PM'),
    session('t2', 'Marlow Fox', 'Saturday', '2027-07-17', '09:30 PM', '11:00 PM', { isKeynote: true }),
  ];
  d.tracks = [
    { id: 'k-main', name: 'Main stage', description: 'Fri, Sat', color: '#ff5b1f' },
    { id: 'k-river', name: 'River stage', description: 'Sat', color: '#2f80ed' },
  ];
  d.tickets = [
    { id: 'k1', name: 'Day pass', price: 59, currency: 'GBP', description: 'Friday or Saturday', features: ['Entry for one day', 'All stages', 'Free shuttle'], badge: 'Friday or Saturday', isAvailable: true, registrationUrl: 'https://tickets.example/riverlight' },
    { id: 'k2', name: 'Weekend', price: 99, currency: 'GBP', description: 'Both days', features: ['Entry for both days', 'All stages', 'Early entry'], badge: 'Both days', isAvailable: true, registrationUrl: 'https://tickets.example/riverlight' },
    { id: 'k3', name: 'Front of stage', price: 149, currency: 'GBP', description: 'Both days', features: ['Front-of-stage area', 'Both days', 'Limited numbers'], badge: 'Limited', isAvailable: true },
  ];
  d.faqs = [
    { id: 'f1', question: 'Can I bring a picnic?', answer: 'Yes, in the meadow. Glass bottles stay at the gate.' },
    { id: 'f2', question: 'Is there an age limit?', answer: 'All ages are welcome. Under-14s need an adult with them.' },
    { id: 'f3', question: 'What if it rains?', answer: 'The festival runs in light rain; we will tell you early if anything changes.' },
  ];
  d.dataAvailability = { ...d.dataAvailability, speakers: true, schedule: true, tickets: true };
  return d;
};

const exhibition = (): EventWebsiteData => {
  const d = base('exhibition_trade');
  d.profile = {
    ...d.profile, name: 'Harbourlight Art Fair', tagline: 'Forty small galleries under one roof', startDate: '2027-10-08', endDate: '2027-10-10', startTime: '10:00', endTime: '19:00', time: '10:00 – 19:00', timezone: 'BST',
    description: 'A fictional sample fair that shows how an exhibition appears in this design: its name, dates and venue, the programme, exhibitors, speakers, tickets and questions.',
    venueName: 'The Warehouse', venueAddress: '4 Dock Street', city: 'Sampleton', country: 'Exampleland', organizerName: 'Harbourlight Fairs (sample)', organizerEmail: 'hello@harbourlight.example', organizerPhone: '+00 000 000 0000',
    socialLinks: { instagram: 'https://instagram.example/harbourlight', linkedin: 'https://linkedin.example/harbourlight' },
  };
  d.venue = { venueName: 'The Warehouse', address: '4 Dock Street', city: 'Sampleton', country: 'Exampleland', airportInfo: 'The airport is 25 minutes away by train.', metroTransit: 'Dock Street station is a three-minute walk.', parkingInfo: 'Paid parking is available on the quay.' };
  d.speakers = [
    person('p1', 'Mara Quill', 'Curator', 'Quay Gallery', 'Collecting small'),
    person('p2', 'Jonas Ferreiro', 'Painter', '', 'Working in public'),
    person('p3', 'Ada Lindqvist', 'Art advisor', 'North Room', 'Your first purchase'),
    person('p4', 'Rhys Okafor', 'Sculptor', '', 'Making for a crowd'),
  ];
  d.sessions = [
    session('e1', 'Doors open', 'Friday', '2027-10-08', '10:00 AM', '11:00 AM', { room: 'Main hall' }),
    session('e2', 'Opening talk', 'Friday', '2027-10-08', '11:30 AM', '12:30 PM', { room: 'Talks room' }),
    session('e3', 'Studio walk', 'Friday', '2027-10-08', '02:00 PM', '03:00 PM', { room: 'Hall B' }),
    session('e4', 'Collecting small', 'Friday', '2027-10-08', '04:00 PM', '05:00 PM', { room: 'Talks room' }),
    session('e5', 'Late view', 'Friday', '2027-10-08', '06:00 PM', '07:00 PM', { room: 'Main hall' }),
  ];
  d.exhibitors = [
    { id: 'x1', name: 'Quay Gallery', category: 'Painting', boothNumber: 'A1', hallSector: 'Hall A', description: 'Contemporary painting from the coast.' },
    { id: 'x2', name: 'North Room', category: 'Photography', boothNumber: 'A4', hallSector: 'Hall A', description: 'Documentary and landscape work.' },
    { id: 'x3', name: 'Kiln & Co', category: 'Ceramics', boothNumber: 'B2', hallSector: 'Hall B', description: 'Hand-built vessels and sculpture.' },
    { id: 'x4', name: 'Paper Mill Press', category: 'Prints', boothNumber: 'B7', hallSector: 'Hall B', description: 'Limited editions and artists’ books.' },
  ];
  d.tickets = [
    { id: 'k1', name: 'Day ticket', price: 12, currency: 'GBP', description: 'one day', features: ['Entry for one day', 'All halls', 'Programme of talks'], badge: '', isAvailable: true, registrationUrl: 'https://tickets.example/harbourlight' },
    { id: 'k2', name: 'Weekend', price: 24, currency: 'GBP', description: 'all three days', features: ['Entry for all three days', 'All halls', 'Private view invitation'], badge: '', isAvailable: true, registrationUrl: 'https://tickets.example/harbourlight' },
    { id: 'k3', name: 'Friend of the fair', price: 60, currency: 'GBP', description: 'all three days', features: ['Everything in Weekend', 'Early entry', 'Catalogue'], badge: '', isAvailable: true },
  ];
  d.faqs = [
    { id: 'f1', question: 'Can I buy work at the fair?', answer: 'Yes. Each gallery sells from its own stand and explains how to take a piece home.' },
    { id: 'f2', question: 'Is the hall accessible?', answer: 'All halls are step-free, with a lift to the talks room.' },
    { id: 'f3', question: 'Can I take photographs?', answer: 'Yes, without flash, unless a stand asks you not to.' },
  ];
  d.dataAvailability = { ...d.dataAvailability, speakers: true, schedule: true, tickets: true, exhibitors: true };
  return d;
};

const launch = (): EventWebsiteData => {
  const d = base('launch_reveal');
  d.profile = {
    ...d.profile, name: 'The Kestrel Reveal', tagline: 'A new pocket camera, shown for the first time', startDate: '2027-03-04', endDate: undefined, startTime: '19:00', endTime: '20:30', time: '19:00 – 20:30',
    description: 'A fictional sample launch that shows how a product reveal appears in this design: the name, a short pitch, a countdown to the reveal and a way to get in touch.',
    venueName: 'The Glass Room', venueAddress: '2 Harbour Street', city: 'Sampleton', country: 'Exampleland', organizerName: 'Kestrel Studio (sample)', organizerEmail: 'press@kestrel-studio.example', organizerPhone: undefined,
    socialLinks: { instagram: 'https://instagram.example/kestrel-studio' },
  };
  d.venue = { venueName: 'The Glass Room', address: '2 Harbour Street', city: 'Sampleton', country: 'Exampleland' };
  d.productLaunch = { productName: 'Kestrel One', tagline: 'Small enough to forget, good enough to remember', heroHeadline: 'Meet Kestrel One', heroSubheadline: 'A camera that fits a shirt pocket.', bentoHighlights: [], techSpecs: [], preorderCtaText: 'Reserve your seat', preorderUrl: 'https://events.example/kestrel-reveal' };
  d.dataAvailability = { ...d.dataAvailability, productLaunch: true };
  return d;
};

/** The least a client can give: a name and a contact email. Used by tests to prove a live site never falls back to sample content. */
export function getMinimalEventData(category: EventCategoryId): EventWebsiteData {
  return {
    schemaVersion: '1.0', category,
    profile: { name: 'Minimal Gathering', tagline: '', description: '', startDate: '', time: '', timezone: '', venueName: '', venueAddress: '', city: '', country: '', organizerName: '', organizerEmail: 'minimal@gathering.example', socialLinks: {} },
    branding: { primaryColor: '', accentColor: '', typographyStyle: 'modern' },
    speakers: [], tracks: [], sessions: [], tickets: [], exhibitors: [], awardCategories: [], sponsors: [],
    venue: { venueName: '', address: '', city: '', country: '' }, faqs: [], gallery: [],
    dataAvailability: { speakers: false, schedule: false, tickets: false, exhibitors: false, awards: false, weddingStory: false, productLaunch: false, sponsors: false, venue: false, faqs: false, gallery: false },
  };
}

/** Demo data for a category. Only categories with an integrated template need one; the others fall back to the generic base. */
export function getEventDemoData(category: EventCategoryId): EventWebsiteData {
  switch (category) {
    case 'conference_seminar': return conference();
    case 'wedding_private': return wedding();
    case 'launch_reveal': return launch();
    case 'festival_concert': return festival();
    case 'exhibition_trade': return exhibition();
    default: return base(category);
  }
}
