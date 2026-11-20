import React, { useState } from 'react';
import { Button } from '../ui/dv/Button';
import {
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { ClientRequirements } from '../../types/admin';
import OrganizationBrandingSection from './media/OrganizationBrandingSection';
import GalleryAndVideoSection from './media/GalleryAndVideoSection';
import type {
  EventCategory,
  EventWebsiteData,
  EventPerson,
  EventTrack,
  EventSession,
  EventTicketTier,
  EventSponsor,
  EventFAQItem,
  EventTypographyStyle
} from '../../types/event';
import { WizardFrame } from './wizard/WizardFrame';

interface EventRequirementWizardProps {
  initialCategory: EventCategory;
  onComplete: (data: Partial<ClientRequirements>) => void;
  onCancel: () => void;
}

const CATEGORY_TITLES: Record<EventCategory, string> = {
  conference_seminar: 'Conference & Seminar',
  festival_concert: 'Festival & Concert',
  corporate_business: 'Corporate & Business Events',
  exhibition_trade: 'Exhibition & Trade Fair',
  wedding_private: 'Wedding & Private Events',
  award_ceremony: 'Award Ceremony & Special Events',
  launch_reveal: 'Launch & Product Reveal'
};

const DEFAULT_TYPOGRAPHY: Record<EventCategory, EventTypographyStyle> = {
  conference_seminar: 'modern',
  festival_concert: 'festive',
  corporate_business: 'modern',
  exhibition_trade: 'editorial',
  wedding_private: 'luxury',
  award_ceremony: 'cinematic',
  launch_reveal: 'futuristic'
};

const DEFAULT_COLORS: Record<EventCategory, { primary: string; accent: string }> = {
  conference_seminar: { primary: '#0b0f19', accent: '#06b6d4' },
  festival_concert: { primary: '#0a0612', accent: '#f97316' },
  corporate_business: { primary: '#0f172a', accent: '#2563eb' },
  exhibition_trade: { primary: '#18181b', accent: '#a1a1aa' },
  wedding_private: { primary: '#1c1917', accent: '#f43f5e' },
  award_ceremony: { primary: '#09090b', accent: '#f59e0b' },
  launch_reveal: { primary: '#000000', accent: '#3b82f6' }
};

export const EventRequirementWizard: React.FC<EventRequirementWizardProps> = ({
  initialCategory,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [category] = useState<EventCategory>(initialCategory);

  // Step 1: Identity
  const [eventName, setEventName] = useState('');
  const [edition, setEdition] = useState('');
  const [tagline, setTagline] = useState('');
  const [aboutText, setAboutText] = useState('');

  // Step 2: Dates, Time & Mode
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-22');
  const [time, setTime] = useState('09:00 AM - 06:00 PM');
  const [timezone, setTimezone] = useState('IST');
  const [isVirtual, setIsVirtual] = useState(false);
  const [isHybrid, setIsHybrid] = useState(false);
  const [virtualStreamUrl, setVirtualStreamUrl] = useState('');

  // Step 3: Venue & Transit
  const [venueName, setVenueName] = useState('International Convention Centre');
  const [venueAddress, setVenueAddress] = useState('Financial District, Sector 5');
  const [city, setCity] = useState('Kolkata');
  const [country, setCountry] = useState('India');
  const [metroTransit, setMetroTransit] = useState('Metro Station Gate 2 (Blue Line)');
  const [parkingInfo, setParkingInfo] = useState('Multi-level valet parking on premises');

  // Step 4: Core Experience Theme
  const [coreTitle, setCoreTitle] = useState('');
  const [coreDescription, setCoreDescription] = useState('');

  // Step 5: Tracks & Schedule
  const [tracks] = useState<EventTrack[]>([
    { id: 'trk_1', name: 'Main Keynote Arena', color: '#06b6d4', stage: 'Stage A' },
    { id: 'trk_2', name: 'Deep Dive Technical Track', color: '#8b5cf6', stage: 'Stage B' }
  ]);
  const [sessions] = useState<EventSession[]>([
    {
      id: 'sess_1',
      title: 'Opening Keynote: The Frontier of Intelligence',
      description: 'Inaugural address unveiling foundational breakthroughs and market direction.',
      day: 'Day 1',
      date: '2026-11-20',
      startTime: '09:30 AM',
      endTime: '10:30 AM',
      trackId: 'trk_1',
      stage: 'Stage A',
      speakerIds: ['spk_1'],
      isKeynote: true
    }
  ]);

  // Step 6: Tickets & Passes
  const [currency, setCurrency] = useState('INR');
  const [tickets] = useState<EventTicketTier[]>([
    {
      id: 'tkt_1',
      name: 'Standard All-Access Pass',
      price: 9999,
      currency: 'INR',
      description: 'Access to all keynote sessions, exhibition halls, and lunch catering.',
      features: ['Full Keynote Hall Access', 'Exhibition Floor Entry', 'Delegate Kit & Lunch'],
      badge: 'Most Popular',
      isAvailable: true
    },
    {
      id: 'tkt_2',
      name: 'VIP Executive Pass',
      price: 24999,
      currency: 'INR',
      description: 'Exclusive backstage networking, VIP lounge access, and private speaker reception.',
      features: ['Reserved Front-Row Seating', 'VIP Lounge & Dining', 'Private Speaker Dinner'],
      badge: 'VIP Access',
      isAvailable: true
    }
  ]);

  // Step 7: Category Specific
  // Wedding Story
  const [partnerOne, setPartnerOne] = useState('Sophia');
  const [partnerTwo, setPartnerTwo] = useState('Alexander');
  const [proposalText, setProposalText] = useState('We met on an autumnal evening in Santiniketan...');
  // Product Launch
  const [productName, setProductName] = useState('Nova Pro 5G');
  const [productHeroHeadline, setProductHeroHeadline] = useState('Engineered for Pure Velocity');
  const [bentoOneMetric, setBentoOneMetric] = useState('3.2x Faster');
  const [bentoOneDesc, setBentoOneDesc] = useState('Next-generation neural architecture.');
  // Award Ceremony
  const [awardCategoryName, setAwardCategoryName] = useState('Grand Prix for Digital Excellence');
  const [awardNomineeOne, setAwardNomineeOne] = useState('Studio Luminary');
  // Exhibition
  const [exhibitorName, setExhibitorName] = useState('Gallery Continuum');
  const [exhibitorBooth, setExhibitorBooth] = useState('Hall 3 — Booth 104');

  // Step 8: Speakers / Artists / VIPs
  const [speakers] = useState<EventPerson[]>([
    {
      id: 'spk_1',
      name: 'Dr. Arindam Roy',
      role: 'keynote_speaker',
      title: 'Chief Scientist & Distinguished Fellow',
      organization: 'Frontier AI Research',
      bio: 'Pioneered multimodal foundation models with over 20 seminal publications.',
      topic: 'Frontier Multimodal Systems',
      isFeatured: true,
      displayOrder: 1
    }
  ]);

  // Step 9: Sponsors
  const [sponsors] = useState<EventSponsor[]>([
    { id: 'spn_1', name: 'Apex Global Technologies', tier: 'title', websiteUrl: 'https://example.com' },
    { id: 'spn_2', name: 'Titan Venture Partners', tier: 'platinum', websiteUrl: 'https://example.com' }
  ]);

  // Step 10: FAQs
  const [faqs] = useState<EventFAQItem[]>([
    {
      id: 'faq_1',
      question: 'What is included in the delegate pass?',
      answer: 'Full access to all keynote stages, networking lounges, exhibition stalls, and daily catered meals.',
      category: 'General'
    },
    {
      id: 'faq_2',
      question: 'Is virtual participation supported?',
      answer: 'Yes, full high-definition livestream links and interactive Q&A will be sent to registered virtual ticket holders.',
      category: 'Access'
    }
  ]);

  // Step 11: Media Pipeline
  const [googleDriveImagesUrl, setGoogleDriveImagesUrl] = useState('');
  const [googleDriveVideosUrl, setGoogleDriveVideosUrl] = useState('');
  const [googleDriveVideoUrls, setGoogleDriveVideoUrls] = useState<string[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
  const [youtubePlaylistUrls, setYoutubePlaylistUrls] = useState<string[]>([]);

  // Step 12: Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [additionalBrandingImages, setAdditionalBrandingImages] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS[category].primary);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLORS[category].accent);
  const [typographyStyle, setTypographyStyle] = useState<EventTypographyStyle>(DEFAULT_TYPOGRAPHY[category]);

  // Step 13: Organizer Contact
  const [organizerName, setOrganizerName] = useState('Digiverse Event Secretariat');
  const [contactEmail, setContactEmail] = useState('events@digiverse.internal');
  const [contactPhone, setContactPhone] = useState('+91 33 2289 9000');
  const [twitterUrl, setTwitterUrl] = useState('https://twitter.com/digiverse');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/company/digiverse');

  const totalSteps = 15;

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else onCancel();
  };

  const handleSubmit = () => {
    // Build canonical EventWebsiteData
    const eventWebsiteData: EventWebsiteData = {
      schemaVersion: '1.0',
      category,
      profile: {
        name: eventName || `${CATEGORY_TITLES[category]} 2026`,
        edition: edition || '2026 Edition',
        tagline: tagline || 'Connecting Visionaries, Elevating Standards',
        description: aboutText || 'Premier international gathering bringing together industry leaders, innovators, and participants.',
        startDate,
        endDate,
        time,
        timezone,
        venueName,
        venueAddress,
        city,
        country,
        isVirtual,
        isHybrid,
        virtualStreamUrl: isVirtual || isHybrid ? virtualStreamUrl : undefined,
        organizerName,
        organizerEmail: contactEmail,
        organizerPhone: contactPhone,
        socialLinks: {
          twitter: twitterUrl,
          linkedin: linkedinUrl
        }
      },
      branding: {
        primaryColor,
        accentColor,
        typographyStyle,
        badgeText: edition || 'Official Registration Open',
        logoUrl: logoUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined
      },
      speakers,
      tracks,
      sessions,
      tickets,
      exhibitors: category === 'exhibition_trade' ? [
        {
          id: 'exh_1',
          name: exhibitorName,
          category: 'Contemporary Visual Art',
          boothNumber: exhibitorBooth,
          hallSector: 'Hall A',
          description: 'Showcasing premier curated works from leading artists.'
        }
      ] : [],
      awardCategories: category === 'award_ceremony' ? [
        {
          id: 'awd_1',
          name: awardCategoryName,
          description: 'Honoring breakthrough achievements and extraordinary craftsmanship.',
          nominees: [
            { id: 'nom_1', title: awardNomineeOne, subtitle: 'Leading Innovator', isWinner: true, categoryId: 'awd_1' }
          ]
        }
      ] : [],
      weddingStory: category === 'wedding_private' ? {
        coupleNames: `${partnerOne} & ${partnerTwo}`,
        partnerOne,
        partnerTwo,
        storyMilestones: [
          { id: 'm1', title: 'How We Met', text: proposalText }
        ],
        ceremonyItinerary: [
          { id: 'c1', time: '04:30 PM', eventName: 'Sacred Ceremony', venue: venueName, dressCode: 'Formal' }
        ],
        hotelBlocks: [
          { id: 'h1', hotelName: 'The Grand Heritage Hotel', address: venueAddress, bookingCode: 'WEDDING2026' }
        ]
      } : undefined,
      productLaunch: category === 'launch_reveal' ? {
        productName,
        tagline: tagline || 'Engineered for Pure Performance',
        heroHeadline: productHeroHeadline,
        bentoHighlights: [
          { id: 'b1', title: bentoOneMetric, subtitle: 'Architecture', description: bentoOneDesc, metric: bentoOneMetric, colSpan: 2 }
        ],
        techSpecs: [
          { group: 'Performance', items: [{ label: 'Neural Engine', value: '16-Core Ultra' }] }
        ]
      } : undefined,
      sponsors,
      venue: {
        venueName,
        address: venueAddress,
        city,
        country,
        metroTransit,
        parkingInfo
      },
      faqs,
      gallery: [],
      dataAvailability: {
        speakers: speakers.length > 0,
        schedule: sessions.length > 0,
        tickets: tickets.length > 0,
        exhibitors: category === 'exhibition_trade',
        awards: category === 'award_ceremony',
        weddingStory: category === 'wedding_private',
        productLaunch: category === 'launch_reveal',
        sponsors: sponsors.length > 0,
        venue: Boolean(venueName),
        faqs: faqs.length > 0,
        gallery: false
      }
    };

    onComplete({
      organizationName: eventName || `${CATEGORY_TITLES[category]} 2026`,
      category: 'event',
      eventCategory: category,
      tagline: tagline || 'Connecting Visionaries, Elevating Standards',
      aboutText: aboutText || 'Premier international gathering bringing together industry leaders, innovators, and participants.',
      contactPerson: organizerName,
      contactEmail,
      contactPhone,
      address: `${venueName}, ${venueAddress}, ${city}`,
      logoUrl: logoUrl.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      additionalBrandingImages,
      googleDriveGalleryUrl: googleDriveImagesUrl.trim() || undefined,
      googleDriveVideoUrl: googleDriveVideosUrl.trim() || undefined,
      googleDriveVideoUrls: googleDriveVideoUrls.filter(Boolean),
      primaryColor,
      accentColor,
      typographyStyle,
      eventData: eventWebsiteData,
      googleDriveMediaFolders: {
        images: googleDriveImagesUrl ? { folderUrl: googleDriveImagesUrl } : undefined,
        videos: googleDriveVideosUrl ? { folderUrl: googleDriveVideosUrl } : undefined
      },
      youtubeUrls: youtubeUrls.filter(Boolean),
      youtubePlaylistUrls: youtubePlaylistUrls.filter(Boolean),
      socialLinks: {
        twitter: twitterUrl,
        linkedin: linkedinUrl
      }
    });
  };

  return (
    <WizardFrame
      engine="event"
      kicker={CATEGORY_TITLES[category]}
      title="New event website"
      description="Tell us about the event — dates, venue, agenda, speakers and tickets."
      steps={[
        { title: 'Event identity' },
        { title: 'Dates & format' },
        { title: 'Venue & travel' },
        { title: 'Experience focus' },
        { title: 'Agenda' },
        { title: 'Tickets & passes' },
        { title: 'Category extras' },
        { title: 'Speakers & artists' },
        { title: 'Sponsors' },
        { title: 'FAQs' },
        { title: 'Media' },
        { title: 'Branding' },
        { title: 'Organiser & contact' },
        { title: 'Review' },
        { title: 'Create website' }
      ]}
      current={currentStep}
      onStepChange={setCurrentStep}
      onCancel={onCancel}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      submitLabel="Create event website"
    >
      <div className="space-y-6">
        {/* STEP 1: IDENTITY */}        {/* STEP 1: IDENTITY */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Event Identity & Category</h3>
              <p className="text-xs text-dv-muted mt-0.5">Specify official event naming, edition number and value proposition.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Global Tech Summit 2026"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Edition / Year</label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. 14th Annual Global Summit"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Headline Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Architecting the Future of Global Innovation"
                className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Event About / Mission Statement</label>
              <textarea
                rows={3}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Comprehensive summary describing the event mission, target delegates, and key themes."
                className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DATES & TIME */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Schedule Dates, Timezone & Mode</h3>
              <p className="text-xs text-dv-muted mt-0.5">Define event duration and in-person versus hybrid livestreaming parameters.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Daily Timings</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 09:00 AM - 06:00 PM"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. IST, EST, GMT"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-dv-ink-2">
                <input
                  type="checkbox"
                  checked={isHybrid}
                  onChange={(e) => setIsHybrid(e.target.checked)}
                  className="rounded border-dv-line text-purple-600 focus:ring-purple-500"
                />
                <span>Hybrid Event (Physical + Livestream)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-dv-ink-2">
                <input
                  type="checkbox"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="rounded border-dv-line text-purple-600 focus:ring-purple-500"
                />
                <span>Virtual Only</span>
              </label>
            </div>
            {(isHybrid || isVirtual) && (
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Virtual Stream URL</label>
                <input
                  type="url"
                  value={virtualStreamUrl}
                  onChange={(e) => setVirtualStreamUrl(e.target.value)}
                  placeholder="https://live.event.digiverse.site/stream"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: VENUE & TRANSIT */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Venue, Transit & Lodging</h3>
              <p className="text-xs text-dv-muted mt-0.5">Specify destination venue location, transit gates and guest guidelines.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Venue Name</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Biswa Bangla Convention Centre"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Street Address</label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g. Action Area 1, New Town"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Nearest Metro / Transit Station</label>
                <input
                  type="text"
                  value={metroTransit}
                  onChange={(e) => setMetroTransit(e.target.value)}
                  placeholder="e.g. New Town Central Metro (Gate 3)"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Parking Instructions</label>
                <input
                  type="text"
                  value={parkingInfo}
                  onChange={(e) => setParkingInfo(e.target.value)}
                  placeholder="e.g. Multi-level parking with EV charging bays"
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CORE EXPERIENCE */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Category Experience Focus</h3>
              <p className="text-xs text-dv-muted mt-0.5">Configure headline focus tailored to {CATEGORY_TITLES[category]}.</p>
            </div>
            {category === 'wedding_private' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Partner 1 Name</label>
                    <input
                      type="text"
                      value={partnerOne}
                      onChange={(e) => setPartnerOne(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Partner 2 Name</label>
                    <input
                      type="text"
                      value={partnerTwo}
                      onChange={(e) => setPartnerTwo(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Love Story Summary ("How We Met")</label>
                  <textarea
                    rows={3}
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : category === 'launch_reveal' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Product / Brand Name</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Cinematic Hero Headline</label>
                    <input
                      type="text"
                      value={productHeroHeadline}
                      onChange={(e) => setProductHeroHeadline(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Flagship Metric Tag</label>
                    <input
                      type="text"
                      value={bentoOneMetric}
                      onChange={(e) => setBentoOneMetric(e.target.value)}
                      placeholder="e.g. 3.2x Faster"
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Feature Summary</label>
                    <input
                      type="text"
                      value={bentoOneDesc}
                      onChange={(e) => setBentoOneDesc(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : category === 'award_ceremony' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Headline Trophy Category</label>
                  <input
                    type="text"
                    value={awardCategoryName}
                    onChange={(e) => setAwardCategoryName(e.target.value)}
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Featured Gold Winner / Nominee</label>
                  <input
                    type="text"
                    value={awardNomineeOne}
                    onChange={(e) => setAwardNomineeOne(e.target.value)}
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : category === 'exhibition_trade' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Featured Exhibitor</label>
                    <input
                      type="text"
                      value={exhibitorName}
                      onChange={(e) => setExhibitorName(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Booth & Hall Sector</label>
                    <input
                      type="text"
                      value={exhibitorBooth}
                      onChange={(e) => setExhibitorBooth(e.target.value)}
                      className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Keynote / Main Stage Focus</label>
                  <input
                    type="text"
                    value={coreTitle}
                    onChange={(e) => setCoreTitle(e.target.value)}
                    placeholder="e.g. Next-Generation Autonomous Systems & Energy"
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Track Concept Note</label>
                  <textarea
                    rows={3}
                    value={coreDescription}
                    onChange={(e) => setCoreDescription(e.target.value)}
                    placeholder="Brief description of the primary focus."
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: AGENDA & SCHEDULE */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Agenda & Multi-Track Schedule</h3>
              <p className="text-xs text-dv-muted mt-0.5">Configure schedule stages and session timelines.</p>
            </div>
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div key={sess.id} className="p-3 bg-white border border-dv-line rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700">{sess.day} • {sess.startTime} - {sess.endTime}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-800">
                      {sess.stage}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-dv-ink">{sess.title}</div>
                  <div className="text-xs text-dv-muted">{sess.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: TICKETS & PASSES */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Tickets, Passes & Pricing</h3>
              <p className="text-xs text-dv-muted mt-0.5">Set delegate passes, VIP packages and fee currencies.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-dv-ink-2">Currency:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-white border border-dv-line rounded-lg px-3 py-1.5 text-xs text-dv-ink focus:border-purple-500 focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 bg-white border border-dv-line rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-dv-ink">{t.name}</span>
                    <span className="text-xs font-bold text-purple-700">{t.currency} {t.price}</span>
                  </div>
                  <p className="text-xs text-dv-muted">{t.description}</p>
                  <ul className="text-[11px] text-dv-ink-2 space-y-0.5 pt-1">
                    {t.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: SPECIALIZED EXPERIENCE */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Specialized Category Modules</h3>
              <p className="text-xs text-dv-muted mt-0.5">Category-specific details automatically validated.</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                <CheckCircle2 className="w-4 h-4 text-purple-700" />
                <span>Specialized Module Loaded for {CATEGORY_TITLES[category]}</span>
              </div>
              <p className="text-xs text-dv-muted">
                All module configurations (e.g. Bento Specs, Love Story Milestones, Floor Plans, or Nominee Grids) are pre-populated and can be further refined via the Event Studio.
              </p>
            </div>
          </div>
        )}

        {/* STEP 8: SPEAKERS / ARTISTS */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Keynote Speakers & Headliners</h3>
              <p className="text-xs text-dv-muted mt-0.5">Manage featured speakers, headliner artists or guest luminaries.</p>
            </div>
            <div className="space-y-3">
              {speakers.map((spk) => (
                <div key={spk.id} className="p-4 bg-white border border-dv-line rounded-xl flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-700/60 flex items-center justify-center text-purple-700 font-bold shrink-0">
                    {spk.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-dv-ink">{spk.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-800">
                        {spk.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-purple-700">{spk.title} — {spk.organization}</div>
                    <div className="text-xs text-dv-muted">{spk.bio}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: SPONSORS */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Corporate Sponsors & Partners</h3>
              <p className="text-xs text-dv-muted mt-0.5">Acknowledge corporate partners and ecosystem institutions.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sponsors.map((spn) => (
                <div key={spn.id} className="p-3 bg-white border border-dv-line rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-dv-ink">{spn.name}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-800">
                    {spn.tier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: FAQS */}
        {currentStep === 10 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Frequently Asked Questions</h3>
              <p className="text-xs text-dv-muted mt-0.5">Provide essential logistical and attendee guidance.</p>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <div key={f.id} className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                  <div className="text-xs font-bold text-dv-ink">{f.question}</div>
                  <div className="text-xs text-dv-muted">{f.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 11: MEDIA */}
        {currentStep === 11 && (
          <div className="space-y-5">
            <GalleryAndVideoSection
              googleDriveGalleryUrl={googleDriveImagesUrl}
              onGoogleDriveGalleryUrlChange={setGoogleDriveImagesUrl}
              googleDriveVideoUrl={googleDriveVideosUrl}
              onGoogleDriveVideoUrlChange={setGoogleDriveVideosUrl}
              googleDriveVideoUrls={googleDriveVideoUrls}
              onGoogleDriveVideoUrlsChange={setGoogleDriveVideoUrls}
              youtubeUrls={youtubeUrls}
              onYoutubeUrlsChange={setYoutubeUrls}
              youtubePlaylistUrls={youtubePlaylistUrls}
              onYoutubePlaylistUrlsChange={setYoutubePlaylistUrls}
              title="Event photos & video highlights"
              subtitle="Connect Google Drive high-resolution event albums, keynote stream recordings, and YouTube playlists strictly for gallery and video showcase sections."
            />
          </div>
        )}

        {/* STEP 12: BRANDING & TYPOGRAPHY */}
        {currentStep === 12 && (
          <div className="space-y-6">
            <OrganizationBrandingSection
              logoUrl={logoUrl}
              onLogoChange={setLogoUrl}
              coverImageUrl={coverImageUrl}
              onCoverImageChange={setCoverImageUrl}
              additionalBrandingImages={additionalBrandingImages}
              onAdditionalImagesChange={setAdditionalBrandingImages}
              title="Official Event Branding & Stage Hero Cover"
              subtitle="Upload official event identity assets: Event Logo/Emblem, 16:9 Stage Cover/Banner, and Sponsor Co-Branding Marks."
            />

            <div className="border-t border-dv-line pt-5">
              <h3 className="text-base font-bold text-dv-ink mb-1">Visual Branding & Typography Presets</h3>
              <p className="text-xs text-dv-muted mb-4">Fine-tune brand colors and dynamic typography hierarchy.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded border border-dv-line bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Accent Highlight Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded border border-dv-line bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Typography System</label>
              <select
                value={typographyStyle}
                onChange={(e) => setTypographyStyle(e.target.value as EventTypographyStyle)}
                className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
              >
                <option value="modern">Modern Geometric Sans (Plus Jakarta Sans / Inter)</option>
                <option value="festive">High-Energy Festival Poster (Syne / Bebas Neue)</option>
                <option value="editorial">Curatorial Gallery Editorial (Cormorant Garamond)</option>
                <option value="luxury">Luxury Romance & Gala Serif (Playfair Display)</option>
                <option value="cinematic">Grand Accolade Display (Cinzel / Playfair)</option>
                <option value="futuristic">Precision Tech Grotesk (Space Grotesk / Inter)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 13: ORGANIZER CONTACT */}
        {currentStep === 13 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Organizing Entity & Social Links</h3>
              <p className="text-xs text-dv-muted mt-0.5">Secretarial contact and official communication handles.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Organizer / Host Entity</label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Official Inquiry Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Twitter / X Handle</label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 14: PREFLIGHT REVIEW */}
        {currentStep === 14 && (
          <div className="space-y-5">
            <div className="border-b border-dv-line pb-3">
              <h3 className="text-base font-bold text-dv-ink">Review your details</h3>
              <p className="text-xs text-dv-muted mt-0.5">Verify that all mandatory parameters and references are aligned.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Category:</span>
                <div className="font-bold text-dv-ink">{CATEGORY_TITLES[category]}</div>
              </div>
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Event Name:</span>
                <div className="font-bold text-dv-ink">{eventName || `${CATEGORY_TITLES[category]} 2026`}</div>
              </div>
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Dates:</span>
                <div className="font-bold text-dv-ink">{startDate} to {endDate}</div>
              </div>
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Venue:</span>
                <div className="font-bold text-dv-ink">{venueName}, {city}</div>
              </div>
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Sessions Configured:</span>
                <div className="font-bold text-dv-ink">{sessions.length} sessions across {tracks.length} tracks</div>
              </div>
              <div className="p-3 bg-white border border-dv-line rounded-lg space-y-1">
                <span className="text-dv-muted">Ticket Tiers:</span>
                <div className="font-bold text-dv-ink">{tickets.length} tier(s) configured</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 15: AI SYNTHESIS EXECUTION */}
        {currentStep === 15 && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/20">
              <Sparkles className="w-8 h-8 text-yellow-700" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-dv-ink">Ready to create the website</h3>
              <p className="text-xs text-dv-ink-2 leading-relaxed">
                DigiVerse will build a complete multi-page website for <strong>{eventName || `${CATEGORY_TITLES[category]} 2026`}</strong>. You can review and edit everything in the studio before publishing.
              </p>
            </div>
            <div className="pt-4">
              <Button
                size="lg"
                variant="primary"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-purple-500/25"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-700" />
                <span>Create event website</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </WizardFrame>
  );
};
