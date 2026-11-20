import type { NGOWebsiteData } from '../../../types/ngo';
import type { NgoArchetypeId } from '../ids';

/**
 * Fictional sample organisations used only for library previews and tests, always behind a "Sample content" label.
 * Every name, place and address is invented and uses reserved `.example` domains. They are never merged into a real project.
 * Contains no donation, bank, UPI or payment details.
 */
const base = (archetype: NgoArchetypeId): NGOWebsiteData => ({
  schemaVersion: '1.0', archetype,
  profile: { name: '', tagline: '', missionStatement: '', visionStatement: '', coreValues: [], aboutDescription: '', operationalRegions: [], headquartersAddress: '', contactEmail: '', contactPhone: '' },
  branding: { primaryColor: '#1f6f5c', accentColor: '#e0a526', typographyStyle: 'humanist' },
  programs: [], impactStats: [], campaigns: [], causes: [], leadership: [],
  volunteering: { enabled: false, headline: '', description: '', opportunities: [] }, volunteerSubmissions: [], collectionCenters: [],
  donationModel: { headline: '', donationTiers: [], customAmountAllowed: false, taxDeductible: false, enquiryOnly: true }, donationEnquiries: [],
  stories: [], reports: [], partners: [], faqs: [], gallery: [],
  dataAvailability: { programs: false, impactStats: false, campaigns: false, causes: false, leadership: false, volunteering: false, collectionCenters: false, donationModel: false, stories: false, reports: false, partners: false, faqs: false, gallery: false },
});

export function getNgoDemoData(archetype: NgoArchetypeId): NGOWebsiteData {
  const d = base(archetype);
  d.profile = {
    name: 'Riverbend Community Trust', tagline: 'Neighbours helping neighbours, one street at a time',
    missionStatement: 'We bring volunteers, families and local groups together to make sure no household in our district goes without food, learning support or company.',
    visionStatement: 'A district where everyone has someone to turn to.', coreValues: ['Show up', 'Listen first', 'Share what we have', 'Keep it local'],
    aboutDescription: 'Riverbend Community Trust is a volunteer-led organisation working across six neighbourhoods. This is sample content for a fictional organisation.',
    foundedYear: '2014', operationalRegions: ['Riverbend', 'Oakfield', 'Mill Lane', 'Harbour Row'], headquartersAddress: '12 Sample Street, Riverbend', city: 'Riverbend', country: 'Exampleland',
    contactEmail: 'hello@riverbend-trust.example', contactPhone: '+00 000 000 0000', websiteUrl: 'https://riverbend-trust.example', contactPerson: 'The office team',
    socialLinks: { facebook: 'https://facebook.example/riverbend', instagram: 'https://instagram.example/riverbend' },
  };
  d.programs = [
    { id: 'p1', title: 'Community larder', category: 'Food', shortSummary: 'A weekly larder and shared lunch for local households.', fullDescription: 'A weekly larder and shared lunch for local households.', beneficiaryGroup: 'Local families', locations: ['Riverbend'], outcomes: ['Sample outcome'], status: 'active' },
    { id: 'p2', title: 'Homework club', category: 'Learning', shortSummary: 'After-school reading and homework help with volunteer mentors.', fullDescription: 'After-school reading and homework help with volunteer mentors.', beneficiaryGroup: 'Children', locations: ['Oakfield'], outcomes: [], status: 'active' },
    { id: 'p3', title: 'Tea and company', category: 'Wellbeing', shortSummary: 'Weekly visits and tea tables for older neighbours.', fullDescription: 'Weekly visits and tea tables for older neighbours.', beneficiaryGroup: 'Older neighbours', locations: ['Mill Lane'], outcomes: [], status: 'ongoing' },
    { id: 'p4', title: 'Repair night', category: 'Skills', shortSummary: 'Volunteers fix bikes, lamps and kettles for free.', fullDescription: 'Volunteers fix bikes, lamps and kettles for free.', beneficiaryGroup: 'Everyone', locations: ['Harbour Row'], outcomes: [], status: 'active' },
  ];
  d.impactStats = [
    { id: 's1', value: '1,200', label: 'Households supported', isVerified: false }, { id: 's2', value: '85', label: 'Active volunteers', isVerified: false },
    { id: 's3', value: '6', label: 'Neighbourhoods', isVerified: false },
  ];
  d.leadership = [
    { id: 'l1', name: 'Asha Verma', role: 'Chairperson', tier: 'board', bio: 'Sample biography.' }, { id: 'l2', name: 'Tomas Berg', role: 'Secretary', tier: 'board', bio: 'Sample biography.' },
    { id: 'l3', name: 'Mei Tan', role: 'Volunteer coordinator', tier: 'team', bio: 'Sample biography.' },
  ];
  d.volunteering = { enabled: true, headline: 'Give a few hours', description: 'Tell us when you are free and we will match you with a group near you.', opportunities: [
    { id: 'v1', roleName: 'Larder helper', department: 'Food', location: 'Riverbend', commitment: 'Saturdays, 2 hours', requirements: [] },
    { id: 'v2', roleName: 'Homework mentor', department: 'Learning', location: 'Oakfield', commitment: 'Weekday afternoons', requirements: [] },
  ] };
  d.stories = [
    { id: 'st1', title: 'A new start', beneficiaryName: 'Grace O.', location: 'Mill Lane', excerpt: 'I moved here knowing nobody. Now I know everyone on my street.', fullStory: 'Sample story.', quote: 'I moved here knowing nobody. Now I know everyone on my street.' },
    { id: 'st2', title: 'Reading together', beneficiaryName: 'Priya K.', location: 'Oakfield', excerpt: 'My reading buddy corrects how I pronounce the dinosaurs.', fullStory: 'Sample story.', quote: 'My reading buddy corrects how I pronounce the dinosaurs.' },
    { id: 'st3', title: 'Fixing things', beneficiaryName: 'Callum R.', location: 'Harbour Row', excerpt: 'Fixing a kettle takes twenty minutes; the conversation lasts all evening.', fullStory: 'Sample story.', quote: 'Fixing a kettle takes twenty minutes; the conversation lasts all evening.' },
  ];
  d.updates = [
    { id: 'u1', title: 'Larder opens a second day', kind: 'announcement', date: '2026-10-02', summary: 'Sample update.' }, { id: 'u2', title: 'Autumn repair night', kind: 'event', date: '2026-09-18', summary: 'Sample update.' },
    { id: 'u3', title: 'New homework club venue', kind: 'news', date: '2026-09-01', summary: 'Sample update.' }, { id: 'u4', title: 'Volunteer thank-you tea', kind: 'event', date: '2026-08-12', summary: 'Sample update.' },
  ];
  d.faqs = [
    { id: 'f1', category: 'Volunteering', question: 'Do I need experience?', answer: 'No. Every group explains the job at the start.' },
    { id: 'f2', category: 'Volunteering', question: 'Can I come just once?', answer: 'Yes. Many volunteers give an hour a month.' },
  ];
  d.supportInfo = { headline: 'Other ways to help', text: 'Tell your neighbours about us, donate spare kitchen items or lend a skill. Contact the office to find out what we need this month.' };
  d.dataAvailability = { ...d.dataAvailability, programs: true, impactStats: true, leadership: true, volunteering: true, stories: true, faqs: true };
  return d;
}

/** A project that supplied only the required fields: what a sparse client gets. */
export function getMinimalNgoData(archetype: NgoArchetypeId): NGOWebsiteData {
  const d = base(archetype);
  d.profile = { ...d.profile, name: 'Tiny Trust', contactEmail: 'office@tiny-trust.example' };
  return d;
}
