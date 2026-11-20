import React, { useMemo, useState } from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  ClientRequirements,
  OrganizationCategory,
  TypographyStyle,
  WebsiteLanguage,
  DesignSelectionMode
} from '../../types/admin';
import {
  Building, Palette, Layout, Activity, CheckCircle2,
  Plus, Trash2, Sparkles,
  Link, Users,
  HeartHandshake, BookOpen, Briefcase, Camera, Shield,
  FileText, Monitor, WandSparkles
} from 'lucide-react';
import OrganizationBrandingSection from './media/OrganizationBrandingSection';
import GalleryAndVideoSection from './media/GalleryAndVideoSection';
import { WizardFrame } from './wizard/WizardFrame';

interface RequirementWizardProps {
  onCancel: () => void;
  onSubmit: (requirements: ClientRequirements) => Promise<void>;
  initialData?: Partial<ClientRequirements>;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-xs text-dv-ink focus:outline-none focus:border-indigo-500';

const cardClass =
  'p-4 rounded-xl border border-slate-200 bg-white space-y-3';

const categories: {
  id: OrganizationCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { id: 'cultural', label: 'Cultural Societies', description: 'Arts, heritage and cultural organizations', icon: <Building className="w-5 h-5" /> },
  { id: 'puja_committee', label: 'Puja Committees', description: 'Durga Puja, Kali Puja and festivals', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'sports', label: 'Sports Clubs', description: 'Sports teams, tournaments and academies', icon: <Activity className="w-5 h-5" /> },
  { id: 'event', label: 'Events & Summits', description: 'Conferences, festivals, summits, expos, weddings, galas, and launches', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'health_wellness', label: 'Health & Wellness', description: 'Yoga, fitness and wellness organizations', icon: <HeartHandshake className="w-5 h-5" /> },
  { id: 'educational', label: 'Educational Institutions', description: 'Schools, academies and learning centers', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'professional', label: 'Professional Associations', description: 'Professional and trade associations', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'hobby_club', label: 'Hobby & Interest Clubs', description: 'Photography, books and interest groups', icon: <Camera className="w-5 h-5" /> },
  { id: 'community', label: 'Community & RWA', description: 'Resident and local community groups', icon: <Users className="w-5 h-5" /> },
  { id: 'custom', label: 'Custom Organization', description: 'A specialized organization category', icon: <Shield className="w-5 h-5" /> }
];

const designModels: Record<OrganizationCategory, {
  id: string;
  name: string;
  description: string;
  style: string;
}[]> = {
  cultural: [
    { id: 'cultural_heritage', name: 'Heritage Editorial', description: 'Elegant cultural storytelling with editorial sections.', style: 'Heritage' },
    { id: 'cultural_festival', name: 'Festival Showcase', description: 'Immersive festival imagery and event-led layouts.', style: 'Festival' },
    { id: 'cultural_art', name: 'Arts & Gallery', description: 'Visual-first gallery and cultural archive.', style: 'Gallery' }
  ],
  puja_committee: [
    { id: 'puja_classic', name: 'Traditional Puja', description: 'Traditional visual identity and festival information.', style: 'Traditional' },
    { id: 'puja_immersive', name: 'Immersive Festival', description: 'Large visual storytelling and event highlights.', style: 'Immersive' },
    { id: 'puja_magazine', name: 'Puja Magazine', description: 'Editorial layouts for programs, news and galleries.', style: 'Editorial' }
  ],
  sports: [
    { id: 'sports_club', name: 'Club & Team', description: 'Team identity, player profiles and club news.', style: 'Club' },
    { id: 'sports_tournament', name: 'Tournament Hub', description: 'Fixtures, results, standings and registration.', style: 'Tournament' },
    { id: 'sports_academy', name: 'Sports Academy', description: 'Training programs, coaches and admissions.', style: 'Academy' }
  ],
  event: [
    { id: 'event_conference', name: 'Conference & Summit', description: 'Tech summit aesthetic, multi-track agenda and speaker keynotes.', style: 'Conference' },
    { id: 'event_festival', name: 'Festival & Concert', description: 'Vibrant lineup canvas, countdown and stage passes.', style: 'Festival' },
    { id: 'event_corporate', name: 'Corporate Summit', description: 'Executive leadership forum and delegate registration.', style: 'Corporate' }
  ],
  health_wellness: [
    { id: 'health_clinic', name: 'Wellness Center', description: 'Services, specialists and appointment information.', style: 'Wellness' },
    { id: 'health_fitness', name: 'Fitness Studio', description: 'Programs, trainers and membership information.', style: 'Fitness' },
    { id: 'health_holistic', name: 'Holistic Wellness', description: 'Calm editorial layouts for wellness services.', style: 'Holistic' }
  ],
  ngo_social: [
    { id: 'ngo_impact', name: 'Impact & Mission', description: 'Mission-led storytelling and impact reporting.', style: 'Impact' },
    { id: 'ngo_campaign', name: 'Campaign & Causes', description: 'Campaigns, initiatives and donation information.', style: 'Campaign' },
    { id: 'ngo_community', name: 'Community Outreach', description: 'Volunteer activities and community programs.', style: 'Community' }
  ],
  ngo: [
    { id: 'ngo_grassroots', name: 'Grassroots & Community', description: 'Material relief drives, dropping centers and volunteer mobilization.', style: 'Grassroots' },
    { id: 'ngo_foundation', name: 'Institutional Foundation', description: 'Civic leadership, fellowship initiatives and governance.', style: 'Institutional' },
    { id: 'ngo_charity', name: 'Cause Storytelling & 100% Model', description: 'Radical donation transparency, live impact counters and field proof.', style: 'Storytelling' }
  ],
  educational: [
    { id: 'edu_institution', name: 'Institutional', description: 'Academic programs, departments and admissions.', style: 'Institutional' },
    { id: 'edu_academy', name: 'Modern Academy', description: 'Course discovery and student-focused sections.', style: 'Academy' },
    { id: 'edu_research', name: 'Research & Knowledge', description: 'Research, publications and academic resources.', style: 'Research' }
  ],
  professional: [
    { id: 'pro_corporate', name: 'Corporate Association', description: 'Formal institutional and member information.', style: 'Corporate' },
    { id: 'pro_network', name: 'Professional Network', description: 'Member directory, events and networking.', style: 'Network' },
    { id: 'pro_editorial', name: 'Professional Editorial', description: 'Thought leadership, updates and publications.', style: 'Editorial' }
  ],
  hobby_club: [
    { id: 'hobby_gallery', name: 'Creative Gallery', description: 'Image-led portfolios and creative showcases.', style: 'Gallery' },
    { id: 'hobby_community', name: 'Interest Community', description: 'Community activities, discussions and events.', style: 'Community' },
    { id: 'hobby_journal', name: 'Club Journal', description: 'Articles, stories and curated collections.', style: 'Journal' }
  ],
  community: [
    { id: 'community_resident', name: 'Resident Association', description: 'Notices, services and resident information.', style: 'Resident' },
    { id: 'community_local', name: 'Local Community', description: 'Local events, initiatives and announcements.', style: 'Local' },
    { id: 'community_civic', name: 'Civic Portal', description: 'Structured information and community services.', style: 'Civic' }
  ],
  custom: [
    { id: 'custom_editorial', name: 'Editorial Canvas', description: 'Flexible editorial structure for a custom identity.', style: 'Editorial' },
    { id: 'custom_visual', name: 'Visual Showcase', description: 'Flexible image-led website structure.', style: 'Visual' },
    { id: 'custom_institutional', name: 'Institutional Portal', description: 'Structured information and service pages.', style: 'Institutional' }
  ],
  portfolio: [
    { id: 'portfolio_tech', name: 'Developer & Systems', description: 'Technical terminal prompts and repository metrics.', style: 'Technical' },
    { id: 'portfolio_creative', name: 'Creative & Editorial', description: 'Asymmetric editorial case studies and visual storytelling.', style: 'Editorial' },
    { id: 'portfolio_brand', name: 'Brand & Advisory', description: 'Conversion-focused value propositions and client results.', style: 'Conversion' }
  ]
};

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const RequirementCollectionWizard: React.FC<RequirementWizardProps> = ({
  onCancel,
  onSubmit,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCustomPage, setNewCustomPage] = useState('');
  const [newReference, setNewReference] = useState('');

  const [requirements, setRequirements] = useState<ClientRequirements>(() => ({
    organizationName: initialData?.organizationName || '',
    category: initialData?.category || 'cultural',
    organizationType: initialData?.organizationType || initialData?.category || 'cultural',
    subcategory: initialData?.subcategory || '',
    customCategoryName: initialData?.customCategoryName || '',
    contactPerson: initialData?.contactPerson || '',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
    address: initialData?.address || '',
    tagline: initialData?.tagline || '',
    aboutText: initialData?.aboutText || '',
    logoUrl: initialData?.logoUrl || '',
    coverImageUrl: initialData?.coverImageUrl || '',
    primaryColor: initialData?.primaryColor || '#4F46E5',
    accentColor: initialData?.accentColor || '#06B6D4',
    typographyStyle: initialData?.typographyStyle || 'modern',
    preferredLanguage: initialData?.preferredLanguage || initialData?.websiteLanguage || 'bilingual',
    websiteLanguage: initialData?.websiteLanguage || initialData?.preferredLanguage || 'bilingual',
    designSelection: initialData?.designSelection || {
      mode: 'template',
      modelId: designModels[initialData?.category || 'cultural'][0].id,
      modelName: designModels[initialData?.category || 'cultural'][0].name,
      customDesignPrompt: ''
    },
    additionalBrandingImages: initialData?.additionalBrandingImages || [],
    googleDriveGalleryUrl: initialData?.googleDriveGalleryUrl || '',
    googleDriveVideoUrl: initialData?.googleDriveVideoUrl || '',
    googleDriveVideoUrls: initialData?.googleDriveVideoUrls || [],
    youtubePlaylistUrls: initialData?.youtubePlaylistUrls || [],
    googleDriveMediaFolders: initialData?.googleDriveMediaFolders || {
      images: { folderUrl: '' },
      videos: { folderUrl: '' }
    },
    googleDriveUrl: initialData?.googleDriveUrl || '',
    youtubeUrls: initialData?.youtubeUrls || [],
    socialLinks: initialData?.socialLinks || {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
      whatsapp: ''
    },
    requiredPages: initialData?.requiredPages || {
      home: true,
      about: true,
      events: false,
      committee: false,
      gallery: false,
      announcements: false,
      donations: false,
      contact: true,
      customPages: []
    },
    requiredFunctionality: initialData?.requiredFunctionality || {
      onlineInquiries: true,
      eventCalendar: false,
      photoGallery: false,
      youtubeVideoPlayer: false,
      googleDriveSync: false,
      donorWall: false,
      memberDirectory: false,
      bilingualToggle: false
    },
    referenceWebsites: initialData?.referenceWebsites || [],
    additionalRequirements: initialData?.additionalRequirements || '',
    enabledSections: initialData?.enabledSections || {
      hero: true,
      events: false,
      about: true,
      committee: false,
      gallery: false,
      contact: true
    },
    events: initialData?.events || [],
    committee: initialData?.committee || [],
    gallery: initialData?.gallery || [],
    sportsData: initialData?.sportsData
  }));

  const selectedModels = useMemo(
    () => designModels[requirements.category] || designModels.custom,
    [requirements.category]
  );

  const updateRequirements = (updates: Partial<ClientRequirements>) => {
    setRequirements(previous => ({ ...previous, ...updates }));
  };

  const updateDesignMode = (mode: DesignSelectionMode) => {
    updateRequirements({
      designSelection: {
        ...requirements.designSelection,
        mode,
        modelId: requirements.designSelection?.modelId,
        modelName: requirements.designSelection?.modelName,
        customDesignPrompt: requirements.designSelection?.customDesignPrompt
      }
    });
  };

  const handleCategoryChange = (category: OrganizationCategory) => {
    const firstModel = designModels[category][0];

    updateRequirements({
      category,
      organizationType: category,
      designSelection: {
        mode: 'template',
        modelId: firstModel.id,
        modelName: firstModel.name,
        customDesignPrompt: requirements.designSelection?.customDesignPrompt
      }
    });
  };

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!requirements.organizationName.trim()) {
        return 'Organization name is required.';
      }

      if (requirements.category === 'custom' && !requirements.customCategoryName?.trim()) {
        return 'Please enter the custom organization category.';
      }

      if (!requirements.contactEmail.trim()) {
        return 'Official contact email is required.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requirements.contactEmail.trim())) {
        return 'Please enter a valid email address.';
      }
    }

    if (step === 2) {
      if (requirements.designSelection?.mode === 'template' &&
          !requirements.designSelection?.modelId) {
        return 'Please select a website design model.';
      }

      if (requirements.designSelection?.mode === 'custom_ai' &&
          !requirements.designSelection?.customDesignPrompt?.trim()) {
        return 'Please describe the custom AI design you want.';
      }
    }

    if (step === 5 && !requirements.aboutText.trim()) {
      return 'Please provide the organization description and mission.';
    }

    return null;
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setCurrentStep(step => Math.min(step + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(step => Math.max(step - 1, 1));
  };

  const addReferenceWebsite = () => {
    const value = newReference.trim();

    if (!value) return;

    if (!isValidUrl(value)) {
      setError('Please enter a valid reference website URL.');
      return;
    }

    if ((requirements.referenceWebsites || []).includes(value)) {
      setError('This reference website has already been added.');
      return;
    }

    updateRequirements({
      referenceWebsites: [...(requirements.referenceWebsites || []), value]
    });

    setNewReference('');
    setError(null);
  };

  const handleFinalSubmit = async () => {
    for (let step = 1; step <= 5; step += 1) {
      const validationError = validateStep(step);

      if (validationError) {
        setCurrentStep(step);
        setError(validationError);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const cleanedRequirements: ClientRequirements = {
        ...requirements,
        organizationName: requirements.organizationName.trim(),
        contactEmail: requirements.contactEmail.trim(),
        contactPerson: requirements.contactPerson?.trim() || '',
        tagline: requirements.tagline.trim(),
        aboutText: requirements.aboutText.trim(),
        youtubeUrls: (requirements.youtubeUrls || []).filter(Boolean),
        referenceWebsites: (requirements.referenceWebsites || []).filter(Boolean),
        googleDriveMediaFolders: {
          ...(requirements.googleDriveMediaFolders?.images?.folderUrl?.trim()
            ? { images: { folderUrl: requirements.googleDriveMediaFolders.images.folderUrl.trim() } }
            : {}),
          ...(requirements.googleDriveMediaFolders?.videos?.folderUrl?.trim()
            ? { videos: { folderUrl: requirements.googleDriveMediaFolders.videos.folderUrl.trim() } }
            : {})
        }
      };

      await onSubmit(cleanedRequirements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit requirements.');
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find(item => item.id === requirements.category);
  const selectedModel = selectedModels.find(
    item => item.id === requirements.designSelection?.modelId
  );

  const checklist = [
    { label: 'Organization name', complete: !!requirements.organizationName.trim() },
    { label: 'Valid contact email', complete: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requirements.contactEmail.trim()) },
    { label: 'Organization description', complete: !!requirements.aboutText.trim() },
    {
      label: 'Website design',
      complete: requirements.designSelection?.mode === 'custom_ai'
        ? !!requirements.designSelection.customDesignPrompt?.trim()
        : !!requirements.designSelection?.modelId
    },
    { label: 'Website pages selected', complete: Object.values(requirements.requiredPages || {}).some(value => value === true) }
  ];

  const allRequiredComplete = checklist.every(item => item.complete);

  return (
    <WizardFrame
      engine="other"
      kicker="General requirements"
      title="New website"
      description="Plan the website: organisation, design, pages, features and content."
      steps={['Organisation', 'Brand & design', 'Pages', 'Features', 'Content', 'Review'].map((title) => ({ title }))}
      current={currentStep}
      onStepChange={(n) => {
        // Forward moves go through validation; going back is always allowed.
        if (n < currentStep) {
          setError(null);
          setCurrentStep(n);
        } else if (n === currentStep + 1) handleNext();
      }}
      onCancel={onCancel}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleFinalSubmit}
      submitting={submitting}
      submitDisabled={!allRequiredComplete}
      submitLabel="Submit requirements"
      error={error}
    >
      <div className="space-y-6">
      {/* STEP 1: ORGANIZATION */}      {/* STEP 1: ORGANIZATION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Organization Identity
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Select the organization category and provide the client's actual information.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {categories.map(category => (
              <button
                type="button"
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`p-3 rounded-xl border text-left min-h-28 transition-all ${
                  requirements.category === category.id
                    ? 'bg-indigo-50 border-indigo-500 text-dv-ink ring-1 ring-indigo-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-indigo-700">{category.icon}</span>
                  {requirements.category === category.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="text-xs font-semibold">{category.label}</div>
                <p className="text-[10px] text-dv-muted mt-1">{category.description}</p>
              </button>
            ))}
          </div>

          {requirements.category === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Custom Category Name *</label>
              <input
                className={inputClass}
                value={requirements.customCategoryName || ''}
                onChange={event => updateRequirements({ customCategoryName: event.target.value })}
                placeholder="Enter the organization category"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold">Organization Name *</label>
              <input
                className={inputClass}
                value={requirements.organizationName}
                onChange={event => updateRequirements({ organizationName: event.target.value })}
                placeholder="Enter the official organization name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Subcategory / Wing</label>
              <input
                className={inputClass}
                value={requirements.subcategory || ''}
                onChange={event => updateRequirements({ subcategory: event.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Primary Contact Person</label>
              <input
                className={inputClass}
                value={requirements.contactPerson || ''}
                onChange={event => updateRequirements({ contactPerson: event.target.value })}
                placeholder="Contact person's name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Official Contact Email *</label>
              <input
                type="email"
                className={inputClass}
                value={requirements.contactEmail}
                onChange={event => updateRequirements({ contactEmail: event.target.value })}
                placeholder="organization@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Contact Phone / WhatsApp</label>
              <input
                className={inputClass}
                value={requirements.contactPhone}
                onChange={event => updateRequirements({ contactPhone: event.target.value })}
                placeholder="Phone number"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold">Office / Organization Address</label>
              <input
                className={inputClass}
                value={requirements.address || ''}
                onChange={event => updateRequirements({ address: event.target.value })}
                placeholder="Full address"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold">Motto / Tagline</label>
              <input
                className={inputClass}
                value={requirements.tagline}
                onChange={event => updateRequirements({ tagline: event.target.value })}
                placeholder="Optional organization tagline"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            {/* Shared engine media module keeps its own design system */}
            <div className="dv-engine-stage rounded-2xl bg-dv-canvas p-4 text-dv-ink">
            <OrganizationBrandingSection
              logoUrl={requirements.logoUrl || ''}
              onLogoChange={url => updateRequirements({ logoUrl: url })}
              coverImageUrl={requirements.coverImageUrl || ''}
              onCoverImageChange={url => updateRequirements({ coverImageUrl: url })}
              additionalBrandingImages={requirements.additionalBrandingImages || []}
              onAdditionalImagesChange={urls => updateRequirements({ additionalBrandingImages: urls })}
              title="Official Organization Branding Assets"
              subtitle="Upload your official logo/crest, 16:9 widescreen hero banner, and additional branding assets."
            />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BRAND AND DESIGN */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-600" />
              Brand Identity & Website Design
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Choose a category-specific design model or request a custom AI design.
            </p>
          </div>

          <div className={cardClass}>
            <label className="text-xs font-semibold">Design Creation Method</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateDesignMode('template')}
                className={`p-4 rounded-xl border text-left ${
                  requirements.designSelection?.mode === 'template'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Monitor className="w-5 h-5 text-indigo-700 mb-2" />
                <div className="text-sm font-semibold text-dv-ink">Select Design Model</div>
                <p className="text-[10px] text-dv-muted mt-1">Choose from available category-specific models.</p>
              </button>

              <button
                type="button"
                onClick={() => updateDesignMode('custom_ai')}
                className={`p-4 rounded-xl border text-left ${
                  requirements.designSelection?.mode === 'custom_ai'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <WandSparkles className="w-5 h-5 text-purple-700 mb-2" />
                <div className="text-sm font-semibold text-dv-ink">Custom AI Design</div>
                <p className="text-[10px] text-dv-muted mt-1">Describe the look you want and DigiVerse will design around it.</p>
              </button>
            </div>
          </div>

          {requirements.designSelection?.mode === 'template' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">
                  Available Models — {selectedCategory?.label}
                </label>
                <Badge variant="indigo">{selectedModels.length} models</Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {selectedModels.map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => updateRequirements({
                      designSelection: {
                        mode: 'template',
                        modelId: model.id,
                        modelName: model.name,
                        customDesignPrompt: requirements.designSelection?.customDesignPrompt
                      }
                    })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      requirements.designSelection?.modelId === model.id
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <Layout className="w-5 h-5 text-indigo-700" />
                      {requirements.designSelection?.modelId === model.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-dv-ink mt-3">{model.name}</div>
                    <p className="text-[10px] text-dv-muted mt-1">{model.description}</p>
                    <span className="inline-block mt-3 text-[10px] text-indigo-700">{model.style}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-amber-700">
                Model selection records the design preference. Actual website previews require the design-preview engine to be connected.
              </p>
            </div>
          )}

          {requirements.designSelection?.mode === 'custom_ai' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold">Custom Design Brief *</label>
              <textarea
                rows={5}
                className={inputClass}
                value={requirements.designSelection?.customDesignPrompt || ''}
                onChange={event => updateRequirements({
                  designSelection: {
                    mode: 'custom_ai',
                    customDesignPrompt: event.target.value,
                    modelId: requirements.designSelection?.modelId,
                    modelName: requirements.designSelection?.modelName
                  }
                })}
                placeholder="Describe the visual direction, layout, mood, typography, colors, imagery and website experience you want..."
              />
              <p className="text-[10px] text-dv-muted">
                Provide specific design instructions. The generation engine must interpret this brief when creating the website.
              </p>
            </div>
          )}

          <div className={cardClass}>
            <label className="text-xs font-semibold">Color Palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Heritage', primary: '#991B1B', accent: '#D97706' },
                { name: 'Athletic', primary: '#0284C7', accent: '#06B6D4' },
                { name: 'Nature', primary: '#047857', accent: '#84CC16' },
                { name: 'Prestige', primary: '#4F46E5', accent: '#A78BFA' }
              ].map(palette => (
                <button
                  type="button"
                  key={palette.name}
                  onClick={() => updateRequirements({
                    primaryColor: palette.primary,
                    accentColor: palette.accent
                  })}
                  className="p-3 rounded-lg border border-slate-200 text-left hover:border-slate-300"
                >
                  <div className="flex gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.primary }} />
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.accent }} />
                  </div>
                  <span className="text-xs text-dv-ink">{palette.name}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-dv-muted">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={requirements.primaryColor} onChange={event => updateRequirements({ primaryColor: event.target.value })} className="w-10 h-10 bg-transparent" />
                  <input className={inputClass} value={requirements.primaryColor} onChange={event => updateRequirements({ primaryColor: event.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-dv-muted">Accent Color</label>
                <div className="flex gap-2">
                  <input type="color" value={requirements.accentColor} onChange={event => updateRequirements({ accentColor: event.target.value })} className="w-10 h-10 bg-transparent" />
                  <input className={inputClass} value={requirements.accentColor} onChange={event => updateRequirements({ accentColor: event.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <label className="text-xs font-semibold">Typography Personality</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'heritage', name: 'Heritage & Traditional', font: 'Cinzel / Serif' },
                { id: 'athletic', name: 'Athletic & Dynamic', font: 'Oswald / Sans' },
                { id: 'civic', name: 'Civic & Welcoming', font: 'Inter / Sans' },
                { id: 'modern', name: 'Modern Editorial', font: 'Plus Jakarta Sans' },
                { id: 'academic', name: 'Academic', font: 'Playfair / Serif' },
                { id: 'classic', name: 'Classic Corporate', font: 'Roboto' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateRequirements({ typographyStyle: item.id as TypographyStyle })}
                  className={`p-3 rounded-lg border text-left ${
                    requirements.typographyStyle === item.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-dv-ink">{item.name}</div>
                  <div className="text-[10px] text-dv-muted mt-1">{item.font}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Website Language</label>
            <select
              className={inputClass}
              value={requirements.websiteLanguage || 'bilingual'}
              onChange={event => updateRequirements({
                websiteLanguage: event.target.value as WebsiteLanguage,
                preferredLanguage: event.target.value as WebsiteLanguage
              })}
            >
              <option value="bilingual">English + Bengali</option>
              <option value="bengali">Bengali</option>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 3: PAGES */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-600" />
              Website Architecture & Pages
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Select the pages that should be included in the client's website.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'home', label: 'Home', description: 'Homepage and hero section' },
              { key: 'about', label: 'About', description: 'Organization history and mission' },
              { key: 'events', label: 'Events', description: 'Programs and event schedules' },
              { key: 'committee', label: 'Committee', description: 'Team and office bearers' },
              { key: 'gallery', label: 'Gallery', description: 'Images and media albums' },
              { key: 'announcements', label: 'Announcements', description: 'News and notices' },
              { key: 'donations', label: 'Donations', description: 'Support and contribution details' },
              { key: 'contact', label: 'Contact', description: 'Contact details and inquiry form' }
            ].map(page => {
              const checked = !!(requirements.requiredPages as any)?.[page.key];

              return (
                <label
                  key={page.key}
                  className={`p-3 rounded-xl border cursor-pointer ${
                    checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-dv-ink">{page.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={event => updateRequirements({
                        requiredPages: {
                          ...requirements.requiredPages!,
                          [page.key]: event.target.checked
                        } as any
                      })}
                    />
                  </div>
                  <p className="text-[10px] text-dv-muted mt-2">{page.description}</p>
                </label>
              );
            })}
          </div>

          <div className={cardClass}>
            <label className="text-xs font-semibold">Custom Pages</label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newCustomPage}
                onChange={event => setNewCustomPage(event.target.value)}
                placeholder="Enter a custom page name"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const value = newCustomPage.trim();
                  if (!value) return;

                  const current = requirements.requiredPages?.customPages || [];

                  if (current.some(page => page.toLowerCase() === value.toLowerCase())) {
                    setError('This custom page already exists.');
                    return;
                  }

                  updateRequirements({
                    requiredPages: {
                      ...requirements.requiredPages!,
                      customPages: [...current, value]
                    }
                  });

                  setNewCustomPage('');
                  setError(null);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(requirements.requiredPages?.customPages || []).map((page, index) => (
                <span key={`${page}-${index}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                  {page}
                  <button
                    type="button"
                    onClick={() => updateRequirements({
                      requiredPages: {
                        ...requirements.requiredPages!,
                        customPages: requirements.requiredPages!.customPages!.filter((_, i) => i !== index)
                      }
                    })}
                    className="text-dv-muted hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: FUNCTIONALITY AND DRIVE */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Features & Media Integrations
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Select functionality and provide the client's media source folders.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'onlineInquiries', label: 'Online Inquiries', description: 'Inquiry and contact forms' },
              { key: 'eventCalendar', label: 'Event Calendar', description: 'Events and schedules' },
              { key: 'photoGallery', label: 'Photo Gallery', description: 'Albums and image viewer' },
              { key: 'youtubeVideoPlayer', label: 'YouTube Player', description: 'Embedded video display' },
              { key: 'googleDriveSync', label: 'Google Drive Sync', description: 'Media folder ingestion' },
              { key: 'donorWall', label: 'Sponsor / Donor Wall', description: 'Sponsor recognition' },
              { key: 'memberDirectory', label: 'Member Directory', description: 'Member and committee profiles' },
              { key: 'bilingualToggle', label: 'Language Switcher', description: 'Multilingual website support' }
            ].map(feature => {
              const checked = !!(requirements.requiredFunctionality as any)?.[feature.key];

              return (
                <label
                  key={feature.key}
                  className={`p-3 rounded-xl border cursor-pointer ${
                    checked ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-semibold text-dv-ink">{feature.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={event => updateRequirements({
                        requiredFunctionality: {
                          ...requirements.requiredFunctionality,
                          [feature.key]: event.target.checked
                        } as any
                      })}
                    />
                  </div>
                  <p className="text-[10px] text-dv-muted mt-2">{feature.description}</p>
                </label>
              );
            })}
          </div>

          <div className="dv-engine-stage rounded-2xl bg-dv-canvas p-4 text-dv-ink">
          <GalleryAndVideoSection
            googleDriveGalleryUrl={requirements.googleDriveGalleryUrl || requirements.googleDriveMediaFolders?.images?.folderUrl || requirements.googleDriveUrl || ''}
            onGoogleDriveGalleryUrlChange={url => updateRequirements({
              googleDriveGalleryUrl: url,
              googleDriveMediaFolders: {
                ...requirements.googleDriveMediaFolders,
                images: { folderUrl: url }
              }
            })}
            googleDriveVideoUrl={requirements.googleDriveVideoUrl || requirements.googleDriveMediaFolders?.videos?.folderUrl || ''}
            onGoogleDriveVideoUrlChange={url => updateRequirements({
              googleDriveVideoUrl: url,
              googleDriveMediaFolders: {
                ...requirements.googleDriveMediaFolders,
                videos: { folderUrl: url }
              }
            })}
            googleDriveVideoUrls={requirements.googleDriveVideoUrls || []}
            onGoogleDriveVideoUrlsChange={urls => updateRequirements({ googleDriveVideoUrls: urls })}
            youtubeUrls={requirements.youtubeUrls || []}
            onYoutubeUrlsChange={urls => updateRequirements({ youtubeUrls: urls })}
            youtubePlaylistUrls={requirements.youtubePlaylistUrls || []}
            onYoutubePlaylistUrlsChange={urls => updateRequirements({ youtubePlaylistUrls: urls })}
            title="Website Gallery & Video Media Pipeline"
            subtitle="Connect Google Drive photo galleries, video files, and YouTube streams strictly for gallery and video showcase sections."
          />
          </div>
        </div>
      )}

      {/* STEP 5: CONTENT */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Organization Content & References
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Collect authentic content and design references supplied by the client.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">About, History & Mission *</label>
            <textarea
              rows={5}
              className={inputClass}
              value={requirements.aboutText}
              onChange={event => updateRequirements({ aboutText: event.target.value })}
              placeholder="Enter the organization's real history, mission, activities, achievements and other information..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Additional Requirements</label>
            <textarea
              rows={3}
              className={inputClass}
              value={requirements.additionalRequirements || ''}
              onChange={event => updateRequirements({ additionalRequirements: event.target.value })}
              placeholder="Other requirements provided by the client..."
            />
          </div>

          <div className={cardClass}>
            <div className="text-xs font-semibold">Social Media Links</div>
            {([
              ['facebook', 'Facebook URL'],
              ['instagram', 'Instagram URL'],
              ['youtube', 'YouTube Channel URL'],
              ['whatsapp', 'WhatsApp Link'],
              ['twitter', 'X / Twitter URL'],
              ['linkedin', 'LinkedIn URL']
            ] as const).map(([key, label]) => (
              <div className="space-y-1" key={key}>
                <label className="text-[10px] text-dv-muted">{label}</label>
                <input
                  className={inputClass}
                  value={(requirements.socialLinks as any)?.[key] || ''}
                  onChange={event => updateRequirements({
                    socialLinks: {
                      ...requirements.socialLinks,
                      [key]: event.target.value
                    }
                  })}
                  placeholder="Optional"
                />
              </div>
            ))}
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold">Reference Websites</span>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newReference}
                onChange={event => setNewReference(event.target.value)}
                placeholder="Paste a website URL for design inspiration"
              />
              <Button type="button" variant="outline" size="sm" onClick={addReferenceWebsite}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {(requirements.referenceWebsites || []).length === 0 && (
              <p className="text-[10px] text-dv-muted">No reference website supplied.</p>
            )}

            {(requirements.referenceWebsites || []).map((url, index) => (
              <div key={`${url}-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-600 font-mono truncate flex-1">{url}</span>
                <button
                  type="button"
                  onClick={() => updateRequirements({
                    referenceWebsites: requirements.referenceWebsites!.filter((_, i) => i !== index)
                  })}
                  className="text-dv-muted hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Special Design Instructions</label>
            <textarea
              rows={3}
              className={inputClass}
              value={requirements.designInstructions || ''}
              onChange={event => updateRequirements({ designInstructions: event.target.value })}
              placeholder="Describe any special layout, animation, visual or branding instructions..."
            />
          </div>
        </div>
      )}

      {/* STEP 6: REVIEW */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Review requirements
            </h3>
            <p className="text-xs text-dv-muted mt-1">
              Check the collected information before submitting the project for website generation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className={cardClass}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700">Organization</div>
              <div className="text-sm font-bold text-dv-ink">{requirements.organizationName || 'Not provided'}</div>
              <p className="text-xs text-dv-muted">Category: {selectedCategory?.label || requirements.category}</p>
              {requirements.subcategory && <p className="text-xs text-dv-muted">Subcategory: {requirements.subcategory}</p>}
              <p className="text-xs text-dv-muted">Contact: {requirements.contactPerson || 'Not provided'}</p>
              <p className="text-xs text-dv-muted">Email: {requirements.contactEmail || 'Not provided'}</p>
              <p className="text-xs text-dv-muted">Phone: {requirements.contactPhone || 'Not provided'}</p>
              <p className="text-xs text-dv-muted">Language: {requirements.websiteLanguage}</p>
            </div>

            <div className={cardClass}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700">Brand & Design</div>
              <div className="flex gap-2 items-center">
                <span className="w-5 h-5 rounded-full border border-dv-line" style={{ backgroundColor: requirements.primaryColor }} />
                <span className="text-xs font-mono">{requirements.primaryColor}</span>
                <span className="w-5 h-5 rounded-full border border-dv-line" style={{ backgroundColor: requirements.accentColor }} />
                <span className="text-xs font-mono">{requirements.accentColor}</span>
              </div>
              <p className="text-xs text-dv-muted">Typography: {requirements.typographyStyle}</p>
              <p className="text-xs text-dv-muted">
                Design method: {requirements.designSelection?.mode === 'custom_ai' ? 'Custom AI Design' : 'Selected Model'}
              </p>
              <p className="text-xs text-dv-muted">
                Model: {selectedModel?.name || requirements.designSelection?.modelName || 'Not selected'}
              </p>
              <p className="text-xs text-dv-muted">Logo: {requirements.logoUrl ? 'Uploaded' : 'Not supplied'}</p>
              <p className="text-xs text-dv-muted">Cover: {requirements.coverImageUrl ? 'Uploaded' : 'Not supplied'}</p>
            </div>

            <div className={cardClass}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700">Website Structure</div>
              {Object.entries(requirements.requiredPages || {})
                .filter(([key, value]) => key !== 'customPages' && value === true)
                .map(([key]) => (
                  <p key={key} className="text-xs text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                ))}
              {(requirements.requiredPages?.customPages || []).map(page => (
                <p key={page} className="text-xs text-dv-muted">Custom: {page}</p>
              ))}
            </div>

            <div className={cardClass}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700">Features & Media</div>
              <p className="text-xs text-dv-muted">Image folder: {requirements.googleDriveMediaFolders?.images?.folderUrl ? 'Provided' : 'Not provided'}</p>
              <p className="text-xs text-dv-muted">Video folder: {requirements.googleDriveMediaFolders?.videos?.folderUrl ? 'Provided' : 'Not provided'}</p>
              <p className="text-xs text-dv-muted">YouTube links: {requirements.youtubeUrls?.length || 0}</p>
              <p className="text-xs text-dv-muted">Reference websites: {requirements.referenceWebsites?.length || 0}</p>
              <p className="text-xs text-dv-muted">Events supplied: {requirements.events.length}</p>
              <p className="text-xs text-dv-muted">Committee members supplied: {requirements.committee.length}</p>
              <p className="text-xs text-dv-muted">Gallery items supplied: {requirements.gallery.length}</p>
            </div>
          </div>

          <div className={cardClass}>
            <div className="text-xs font-semibold text-dv-ink">Requirement Completeness</div>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  {item.complete ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </span>
                  ) : (
                    <span className="text-amber-600">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </WizardFrame>
  );
};
