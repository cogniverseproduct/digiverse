import { OrganizationData } from '../types/preview';

export const mockOrganizations: Record<string, OrganizationData> = {
  cultural: {
    id: 'cultural',
    type: 'cultural',
    name: 'Utsav Cultural Society & Puja Samiti',
    tagline: 'Preserving Heritage, Celebrating Devotion & Community Unity',
    categoryBadge: 'Cultural Society & Puja Committee',
    simulatedDomain: 'utsav-society.digiverse.site',
    primaryColor: '#991B1B', // Deep crimson
    accentColor: '#D97706', // Golden amber
    themeAccentDefault: 'crimson-gold',
    bannerImage: 'cultural-banner',
    heroHeadline: 'Welcoming Generations in Grandeur & Tradition',
    heroDescription: 'Organizing grand Sharadotsav Durga Puja celebrations, seasonal musical festivals, classical dance workshops, and charitable community bhog for over 28 years.',
    metrics: [
      { value: '28th', label: 'Annual Celebrations' },
      { value: '15,000+', label: 'Festival Attendees' },
      { value: '45+', label: 'Cultural Workshops' },
      { value: '100% Volunteer', label: 'Community Run' }
    ],
    aboutText: 'Dedicated to upholding rich regional heritage, classical fine arts, and inclusive community welfare. Our annual Durga Puja and Diwali gatherings bring together families across generations.',
    scheduleTitle: 'Upcoming Puja Rituals & Cultural Festivities',
    scheduleItems: [
      {
        date: 'Oct 19, 2026',
        title: 'Maha Shasthi Bodhon & Ananda Mela',
        time: '06:30 PM IST',
        venue: 'Main Samiti Pandal, Sector 4 Grounds',
        category: 'Rituals & Festivities',
        tag: 'Sacred Ritual'
      },
      {
        date: 'Oct 20, 2026',
        title: 'Maha Saptami Puja & Classical Sitar Recital',
        time: '10:00 AM & 07:00 PM',
        venue: 'Cultural Auditorium',
        category: 'Music & Devotion',
        tag: 'Featured Event'
      },
      {
        date: 'Oct 21, 2026',
        title: 'Maha Ashtami Sandhi Puja & Community Bhog Distribution',
        time: '05:45 PM IST',
        venue: 'Samiti Hall & Dining Pavilion',
        category: 'Prasad Distribution',
        tag: 'All Welcome'
      },
      {
        date: 'Oct 22, 2026',
        title: 'Sindoor Khela & Bijoya Dashami Procession',
        time: '04:00 PM IST',
        venue: 'Riverside Ghat & Samiti Grounds',
        category: 'Grand Farewell',
        tag: 'Procession'
      }
    ],
    leadershipTitle: 'Executive Puja & Cultural Committee',
    leadership: [
      { name: 'Dr. Debabrata Roy', role: 'President & Founder', department: 'Executive Board' },
      { name: 'Ananya Sengupta', role: 'General Secretary', department: 'Operations & Cultural Affairs' },
      { name: 'Subhashish Bose', role: 'Puja Coordinator & Pandal Lead', department: 'Logistics' },
      { name: 'Maitreyi Mukherjee', role: 'Treasurer & Sponsorship Chair', department: 'Finance' }
    ],
    galleryTitle: 'Samiti Heritage & Festival Moments',
    galleryImages: [
      { title: 'Durga Pratima & Traditional Alpona', subtitle: 'Artisanal clay idol crafted by Kumartuli master sculptors', iconType: 'flame' },
      { title: 'Dhaak Performance & Aarti', subtitle: 'Traditional rhythm celebrations during Sandhya Aarti', iconType: 'music' },
      { title: 'Ananda Mela Traditional Food Fair', subtitle: 'Community home chefs showcasing authentic culinary heritage', iconType: 'coffee' }
    ]
  },

  sports: {
    id: 'sports',
    type: 'sports',
    name: 'Titan Warriors Athletic & Sports Club',
    tagline: 'Championship Excellence, Youth Development & Sporting Spirit',
    categoryBadge: 'Sports & Athletic Club',
    simulatedDomain: 'titans-sports.digiverse.site',
    primaryColor: '#0284C7', // Electric Blue / Cyan
    accentColor: '#38BDF8', // Cyan Highlight
    themeAccentDefault: 'neon-cyan',
    bannerImage: 'sports-banner',
    heroHeadline: 'Power, Discipline and Athletic Mastery',
    heroDescription: 'State-certified athletic academy offering premier coaching in football, cricket, athletics, and tennis. Home to regional tournament champions and elite youth training.',
    metrics: [
      { value: '4', label: 'Championship Trophies' },
      { value: '650+', label: 'Registered Athletes' },
      { value: '18', label: 'Certified Coaches' },
      { value: '8 Acres', label: 'Training Facilities' }
    ],
    aboutText: 'Fostering athletic excellence, sportsmanship, and tactical fitness. Our academy bridges grassroots talent discovery with advanced competitive tournament pathways.',
    scheduleTitle: 'League Fixtures & Upcoming Tournaments',
    scheduleItems: [
      {
        date: 'Nov 02, 2026',
        title: 'Regional Premier Football Semi-Final: Titans vs United FC',
        time: '04:30 PM',
        venue: 'Arena Stadium, Field 1',
        category: 'Football Championship',
        tag: 'High Stakes'
      },
      {
        date: 'Nov 08, 2026',
        title: 'Inter-Club T20 Cup: Quarter Final Clash',
        time: '09:00 AM',
        venue: 'Titans Oval Ground',
        category: 'Cricket',
        tag: 'Tournament'
      },
      {
        date: 'Nov 14, 2026',
        title: 'Annual Youth Athletics Track & Field Meet',
        time: '08:00 AM - 05:00 PM',
        venue: 'Main Synthetic Track',
        category: 'Track & Field',
        tag: 'All Divisions'
      },
      {
        date: 'Nov 22, 2026',
        title: 'Junior Tennis Open Championship Final',
        time: '02:00 PM',
        venue: 'Center Clay Courts',
        category: 'Tennis',
        tag: 'Finals'
      }
    ],
    leadershipTitle: 'Sports Directors & Coaching Faculty',
    leadership: [
      { name: 'Coach Marcus Vance', role: 'Head of Athletics & Football', department: 'UEFA A License' },
      { name: 'Rajeev Malhotra', role: 'Cricket Academy Director', department: 'BCCI Level 3 Certified' },
      { name: 'Elena Rostova', role: 'Physiotherapist & Conditioning Coach', department: 'Sports Science' },
      { name: 'Dev Sharma', role: 'Club Secretary & Operations', department: 'Member Administration' }
    ],
    galleryTitle: 'Titan Arena & Matchday Glory',
    galleryImages: [
      { title: 'Championship Trophy Victory', subtitle: 'Senior squad lifting the Regional Inter-District Cup', iconType: 'trophy' },
      { title: 'Floodlit Evening Training Sessions', subtitle: 'Modern high-intensity drills under stadium lighting', iconType: 'zap' },
      { title: 'Youth Academy Summer Bootcamp', subtitle: 'Over 180 junior athletes mastering foundational agility', iconType: 'activity' }
    ]
  },

  community: {
    id: 'community',
    type: 'community',
    name: 'Harmony Civic & Community Association',
    tagline: 'Empowering Citizens, Fostering Green Neighborhoods & Public Welfare',
    categoryBadge: 'Civic & Community Welfare Society',
    simulatedDomain: 'harmony-civic.digiverse.site',
    primaryColor: '#059669', // Emerald
    accentColor: '#10B981', // Bright Emerald
    themeAccentDefault: 'forest-emerald',
    bannerImage: 'community-banner',
    heroHeadline: 'Building a Healthier, Safer & Connected Neighborhood',
    heroDescription: 'An independent residents welfare and social action society advocating for sustainable urban ecology, senior citizen care, youth recreation, and local civic governance.',
    metrics: [
      { value: '3,200+', label: 'Resident Families' },
      { value: '12', label: 'Active Social Initiatives' },
      { value: '5,000+', label: 'Trees Planted' },
      { value: '24/7', label: 'Civic Helpdesk' }
    ],
    aboutText: 'Dedicated to community solidarity and civic upliftment. We coordinate local environmental drives, neighborhood safety patrols, educational scholarships, and recreational public spaces.',
    scheduleTitle: 'Civic Forums, Health Camps & Green Drives',
    scheduleItems: [
      {
        date: 'Nov 07, 2026',
        title: 'Neighborhood Green Belt Tree Plantation & Composting Workshop',
        time: '07:30 AM',
        venue: 'Community Park East Entrance',
        category: 'Environment',
        tag: 'Green Action'
      },
      {
        date: 'Nov 12, 2026',
        title: 'Free Senior Citizens Health & Vision Screening Camp',
        time: '09:30 AM - 02:00 PM',
        venue: 'Civic Community Hall, Room 2',
        category: 'Public Health',
        tag: 'Free Entry'
      },
      {
        date: 'Nov 18, 2026',
        title: 'Quarterly General Civic Assembly & Municipal Town Hall',
        time: '06:00 PM',
        venue: 'Main Town Hall Auditorium',
        category: 'Governance',
        tag: 'Resident Voting'
      },
      {
        date: 'Nov 25, 2026',
        title: 'Youth Winter Sports League & Library Fundraiser',
        time: '10:00 AM',
        venue: 'Community Recreation Center',
        category: 'Youth & Education',
        tag: 'Fundraiser'
      }
    ],
    leadershipTitle: 'Elected Resident Council & Board of Trustees',
    leadership: [
      { name: 'Dr. Savita Sundaram', role: 'President & Civic Chair', department: 'Elected Council' },
      { name: 'Farhan Siddiqui', role: 'Secretary & Municipal Liaison', department: 'Civic Affairs' },
      { name: 'Vikramjit Sahni', role: 'Environmental Initiatives Head', department: 'Green Guild' },
      { name: 'Anita Roy', role: 'Social Welfare & Health Coordinator', department: 'Community Aid' }
    ],
    galleryTitle: 'Community Impact & Neighborhood Life',
    galleryImages: [
      { title: 'Solar Powered Public Garden', subtitle: 'Eco-restoration project funded and planted by local residents', iconType: 'sun' },
      { title: 'Weekly Community Library & Study Circle', subtitle: 'Free public access learning space for neighborhood students', iconType: 'book' },
      { title: 'Emergency Blood Donation & Medical Drive', subtitle: 'Over 220 units collected in partnership with Red Cross', iconType: 'heart' }
    ]
  }
};
