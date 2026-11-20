import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Edit2,
  Users,
  Calendar,
  Layers,
  Code2,
  Building2,
  X,
  Palette,
  Image as ImageIcon,
  Compass,
  Heart,
  Megaphone,
  Flame,
  Award,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';

import type { ClientProject, SelectedTemplateMetadata } from '../../types/admin';
import type {
  CulturalWebsiteData,
  CulturalLeader,
  PujaRitualScheduleItem,
  CulturalSponsor,
  CulturalNewsArticle,
  CulturalMediaItem
} from '../../types/cultural';
import { api } from '../../lib/api';
import type { CulturalTemplateDefinition } from '../../templates/cultural/types';
import { getCulturalTemplateById, DEFAULT_CULTURAL_TEMPLATE } from '../../templates/cultural/registry';
import { CulturalTemplateLibrary, buildCulturalTemplateMetadata } from './templates/CulturalTemplateLibrary';
import { CulturalDemoModal } from './templates/CulturalDemoModal';

interface CulturalDataManagerProps {
  project: ClientProject;
  onProjectUpdated: (project: ClientProject) => void;
  onClose?: () => void;
}

export type CulturalDatasetKey =
  | 'organization'
  | 'branding'
  | 'leadership'
  | 'activities'
  | 'events'
  | 'pujaSchedule'
  | 'pujaTheme'
  | 'visitorGuide'
  | 'gallery'
  | 'sponsors'
  | 'membership'
  | 'donationInfo'
  | 'news'
  | 'dataAvailability';

function createDefaultCulturalData(project: ClientProject): CulturalWebsiteData {
  const req = project.requirements;
  const isPuja = req.category === 'puja_committee' || req.culturalArchetype === 'puja_committee';

  return {
    schemaVersion: '1.0',
    websiteType: isPuja ? 'puja_committee' : 'cultural_society',
    festivalType: isPuja ? 'durga_puja' : 'general_festival',
    organization: {
      name: req.organizationName || 'Cultural Organization',
      nativeName: req.culturalData?.organization?.nativeName,
      type: isPuja ? 'puja_committee' : 'cultural_society',
      establishedYear: req.culturalData?.organization?.establishedYear || 1998,
      registrationNumber: req.culturalData?.organization?.registrationNumber || 'REG/WB/1998/4521',
      tagline: req.tagline,
      description: req.aboutText || 'Preserving cultural heritage and celebrating traditional festivals.',
      history: req.culturalData?.organization?.history || req.aboutText,
      mission: req.culturalData?.organization?.mission || 'Promote arts, literature and communal harmony.',
      headquarters: req.address || 'Cultural Complex, Main Road',
      city: req.culturalData?.organization?.city || 'Kolkata',
      state: req.culturalData?.organization?.state || 'West Bengal',
      country: req.culturalData?.organization?.country || 'India',
      contactPerson: req.contactPerson || 'General Secretary',
      contactEmail: req.contactEmail || 'info@cultural-samiti.org',
      contactPhone: req.contactPhone || '+91 98300 12345',
      socialLinks: req.socialLinks || { facebook: 'https://facebook.com', instagram: 'https://instagram.com' }
    },
    branding: {
      primaryLogoUrl: req.logoUrl,
      coverImageUrl: req.coverImageUrl,
      primaryColor: req.primaryColor || (isPuja ? '#991b1b' : '#1e3a8a'),
      accentColor: req.accentColor || '#d97706',
      typographyStyle: (req.typographyStyle as any) || 'heritage',
      preferredTheme: isPuja ? 'durga-puja' : 'cultural-heritage'
    },
    leadership: [],
    activities: [],
    events: [],
    gallery: [],
    sponsors: [],
    news: [],
    donationInfo: {
      campaignTitle: isPuja ? 'Maha Sharadotsav Utsav Seva & Bhog Distribution' : 'Cultural Heritage Preservation Fund',
      appealMessage: 'Our festivals and educational workshops are powered by voluntary community contributions. We maintain 100% audited financial transparency.',
      causes: [
        { id: 'c_bhog', title: 'Community Maha Bhog Distribution', description: 'Providing sacred prasadam to 5,000+ devotees daily.' },
        { id: 'c_academy', title: 'Traditional Performing Arts Workshop', description: 'Underwriting classical music & dance training for young talents.' }
      ],
      transparencyNote: 'All voluntary donations receive official stamped receipts. We do not process online card payments without verified treasurer clearance.',
      contactForDonations: req.contactPhone || '+91 98300 12345'
    },
    membershipInfo: isPuja
      ? undefined
      : {
          enabled: true,
          membershipTypes: [
            { name: 'Life Patron Member', fee: '₹25,000 one-time', benefits: ['Voting rights in AGM', 'Reserved VIP seating at annual seminars', 'Complimentary literary quarterly'] },
            { name: 'Annual General Member', fee: '₹1,200 annually', benefits: ['Access to cultural academy workshops', 'Festival delegate passes', 'Library borrowing privileges'] },
            { name: 'Student Performing Artist', fee: '₹500 annually', benefits: ['Subsidized masterclass tuition', 'Audition entry for annual stage productions'] }
          ],
          guidelines: 'Membership applications are reviewed monthly by the Executive Committee.'
        },
    pujaSchedule: isPuja ? [] : undefined,
    pujaTheme: isPuja
      ? {
          currentThemeName: 'Aitihasik Terracotta: Bengal Heritage Shrine',
          currentThemeNameNative: 'ঐতিহাসিক পোড়ামাটির মন্দির শিল্প',
          editionYear: '2026 (28th Annual Edition)',
          themeConcept: 'Recreating traditional Bishnupur terracotta architecture using sustainable clay, bamboo and hand-pressed earthen tiles.',
          idolArtisan: 'Master Sculptor Mintu Pal (Kumartuli, Kolkata)',
          pandalArchitecture: 'Terracotta Temple Replica by Shri Partha Sarathi',
          lightingConcept: 'Chandannagar Dynamic Illumination by Babu Pal',
          themeImages: [
            {
              url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
              caption: 'Terracotta Temple Facade Replica with ornate archways',
              category: 'pandal'
            }
          ]
        }
      : undefined,
    visitorGuide: isPuja
      ? {
          pandalLocation: req.address || 'Samiti Grounds, Sector 4',
          nearestMetro: 'Central Metro Station (Gate 3) — 450 meters walk',
          nearestRailway: 'Howrah Junction — 4.2 km (Direct feeder bus available)',
          nearestBusStop: 'Sector 4 Police Station Depot',
          parkingInfo: 'Designated parking available at Metro Parkade Ground A',
          visitingHours: 'Morning: 08:00 AM - 01:00 PM | Evening: 04:30 PM - 12:30 AM',
          crowdGuidelines: [
            'Separate queues maintained for Senior Citizens & Differently-Abled Devotees (Gate 2)',
            'Strictly keep moving in Darshan queue; photography prohibited inside sanctum sanctorum',
            'Bhog coupons must be pre-collected from Treasurer counter before 11:30 AM'
          ],
          safetyAccessibility: [
            '24/7 Red Cross First Aid Camp & St. John Ambulance Station located at Gate 1',
            'Fire tender station and water mist hydrants deployed in accordance with WB Fire Services',
            'Wheelchair accessibility ramps deployed across all entry gates'
          ],
          emergencyContactPhone: req.contactPhone || '+91 98300 12345'
        }
      : undefined,
    dataAvailability: {
      leadership: false,
      activities: false,
      events: false,
      gallery: false,
      sponsors: false,
      news: false,
      pujaSchedule: false,
      pujaTheme: isPuja,
      visitorGuide: isPuja,
      donationInfo: true,
      membership: !isPuja
    }
  };
}

function getInitialCulturalData(project: ClientProject): CulturalWebsiteData {
  if (project.generatedWebsite?.culturalData) {
    return { ...project.generatedWebsite.culturalData };
  }
  if (project.requirements.culturalData) {
    return { ...project.requirements.culturalData };
  }
  return createDefaultCulturalData(project);
}

export const CulturalDataManager: React.FC<CulturalDataManagerProps> = ({
  project,
  onProjectUpdated,
  onClose
}) => {
  const [culturalData, setCulturalData] = useState<CulturalWebsiteData>(() => getInitialCulturalData(project));
  const isPuja = culturalData.websiteType === 'puja_committee';
  const [activeDataset, setActiveDataset] = useState<CulturalDatasetKey>(isPuja ? 'pujaSchedule' : 'activities');
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CulturalTemplateDefinition | null>(null);
  const [switchTemplateModalOpen, setSwitchTemplateModalOpen] = useState(false);
  const [switchingTemplate, setSwitchingTemplate] = useState(false);

  // Retired first-generation ids resolve to the design that replaced them; a project with none shows the category default.
  const currentTemplateId = project.requirements.selectedTemplate?.templateId || project.generatedWebsite?.selectedTemplate?.templateId;
  const currentTemplate = (getCulturalTemplateById(currentTemplateId) || getCulturalTemplateById(DEFAULT_CULTURAL_TEMPLATE[isPuja ? 'puja_committee' : 'cultural_society']))!;

  const handleSwitchTemplate = async (tmpl: CulturalTemplateDefinition) => {
    try {
      setSwitchingTemplate(true);
      const newMeta: SelectedTemplateMetadata = buildCulturalTemplateMetadata(tmpl);

      // Only the design changes. The client's own brand colours and content are left exactly as they are.
      const updatedProject = await api.updateProject(project.id, { selectedTemplate: newMeta });

      onProjectUpdated(updatedProject);
      setSwitchTemplateModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Template switched successfully to ${tmpl.name} (v${tmpl.version}). Client content preserved.`
      });
    } catch (err: unknown) {
      alert(`Error switching template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSwitchingTemplate(false);
    }
  };


  useEffect(() => {
    setCulturalData(getInitialCulturalData(project));
  }, [project.id, project.updatedAt]);

  const getCurrentDatasetValue = (key: CulturalDatasetKey): any => {
    switch (key) {
      case 'organization': return culturalData.organization;
      case 'branding': return culturalData.branding;
      case 'leadership': return culturalData.leadership;
      case 'activities': return culturalData.activities;
      case 'events': return culturalData.events;
      case 'pujaSchedule': return culturalData.pujaSchedule || [];
      case 'pujaTheme': return culturalData.pujaTheme || {};
      case 'visitorGuide': return culturalData.visitorGuide || {};
      case 'gallery': return culturalData.gallery;
      case 'sponsors': return culturalData.sponsors;
      case 'membership': return culturalData.membershipInfo || {};
      case 'donationInfo': return culturalData.donationInfo || {};
      case 'news': return culturalData.news;
      case 'dataAvailability': return culturalData.dataAvailability;
      default: return {};
    }
  };

  useEffect(() => {
    setJsonDraft(JSON.stringify(getCurrentDatasetValue(activeDataset), null, 2));
  }, [activeDataset, culturalData]);

  const updateDataAvailability = (data: CulturalWebsiteData): CulturalWebsiteData => {
    return {
      ...data,
      dataAvailability: {
        leadership: data.leadership.length > 0,
        activities: data.activities.length > 0,
        events: data.events.length > 0,
        gallery: data.gallery.length > 0,
        sponsors: data.sponsors.length > 0,
        news: data.news.some((item) => item.isPublished),
        pujaSchedule: (data.pujaSchedule?.length ?? 0) > 0,
        pujaTheme: Boolean(data.pujaTheme?.currentThemeName),
        visitorGuide: Boolean(data.visitorGuide?.pandalLocation),
        donationInfo: Boolean(data.donationInfo?.appealMessage),
        membership: Boolean(data.membershipInfo?.enabled)
      }
    };
  };

  const handleSaveAll = async (overrideData?: CulturalWebsiteData) => {
    const dataToSave = updateDataAvailability(overrideData || culturalData);
    setSaving(true);
    setFeedback(null);

    try {
      let updatedProject: ClientProject;
      if (typeof api.saveCulturalData === 'function') {
        const res = await api.saveCulturalData(project.id, dataToSave);
        updatedProject = res.project;
      } else {
        updatedProject = await api.customizeWebsite(project.id, { culturalData: dataToSave });
      }

      setCulturalData(dataToSave);
      onProjectUpdated(updatedProject);
      setFeedback({
        type: 'success',
        message: 'Cultural data saved and synchronized to SQLite WAL database.'
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save cultural data.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      const updated: CulturalWebsiteData = { ...culturalData };

      switch (activeDataset) {
        case 'organization': updated.organization = parsed; break;
        case 'branding': updated.branding = parsed; break;
        case 'leadership': updated.leadership = Array.isArray(parsed) ? parsed : []; break;
        case 'activities': updated.activities = Array.isArray(parsed) ? parsed : []; break;
        case 'events': updated.events = Array.isArray(parsed) ? parsed : []; break;
        case 'pujaSchedule': updated.pujaSchedule = Array.isArray(parsed) ? parsed : []; break;
        case 'pujaTheme': updated.pujaTheme = parsed; break;
        case 'visitorGuide': updated.visitorGuide = parsed; break;
        case 'gallery': updated.gallery = Array.isArray(parsed) ? parsed : []; break;
        case 'sponsors': updated.sponsors = Array.isArray(parsed) ? parsed : []; break;
        case 'membership': updated.membershipInfo = parsed; break;
        case 'donationInfo': updated.donationInfo = parsed; break;
        case 'news': updated.news = Array.isArray(parsed) ? parsed : []; break;
        case 'dataAvailability': updated.dataAvailability = parsed; break;
      }

      setCulturalData(updated);
      handleSaveAll(updated);
      setIsJsonMode(false);
    } catch (err: unknown) {
      alert(`Invalid JSON format: ${err instanceof Error ? err.message : 'Syntax error'}`);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dv-line pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              <span>Cultural Data Studio</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isPuja ? 'bg-red-50 text-red-700 border-red-800/60' : 'bg-blue-50 text-blue-700 border-blue-800/60'}`}>
              {isPuja ? 'PUJA COMMITTEE' : 'CULTURAL SOCIETY'}
            </span>
            <span className="text-xs text-dv-muted">|</span>
            <span className="text-xs text-dv-ink-2 font-semibold">{culturalData.organization.name}</span>
          </div>
          <p className="text-xs text-dv-muted">
            Bidirectional visual CRUD and raw JSON editor with verified persistence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJsonMode(!isJsonMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isJsonMode
                ? 'bg-amber-500/20 text-amber-700 border-amber-500/40'
                : 'bg-dv-ink/[0.04] text-dv-ink-2 border-dv-line hover:bg-dv-ink/[0.03]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isJsonMode ? 'Visual Forms' : 'Raw JSON Mode'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveAll()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save & Sync'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-dv-muted hover:text-dv-ink hover:bg-dv-ink/[0.03] transition-colors"
              title="Close Data Manager"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-500/40 text-emerald-700'
              : 'bg-red-50 border-red-500/40 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Active Cultural Template Banner */}
      <div className="bg-gradient-to-r from-white via-white to-dv-canvas border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-dv-ink text-xs shrink-0 shadow-inner"
            style={{ backgroundColor: currentTemplate?.tokens.primaryColor || '#991b1b' }}
          >
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-dv-ink tracking-wide">
                {currentTemplate?.name || 'Cultural Master Template'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 border border-amber-500/30">
                v{currentTemplate?.version || '1.0.0'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dv-ink/[0.03] text-dv-ink-2">
                {currentTemplate?.categoryLabel}
              </span>
            </div>
            <p className="text-xs text-dv-muted mt-0.5 line-clamp-1">
              {currentTemplate?.tagline || currentTemplate?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewTemplate(currentTemplate)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dv-ink/[0.03] hover:bg-dv-ink/[0.06] text-dv-ink border border-dv-line flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span>Preview Template Demo</span>
          </button>

          <button
            type="button"
            onClick={() => setSwitchTemplateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch Template</span>
          </button>
        </div>
      </div>

      {/* Module Tab Selector */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-dv-line scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveDataset('organization')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'organization' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDataset('branding')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'branding' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDataset('leadership')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'leadership' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Committee ({culturalData.leadership.length})</span>
        </button>

        {!isPuja && (
          <button
            type="button"
            onClick={() => setActiveDataset('activities')}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDataset === 'activities' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Programmes ({culturalData.activities.length})</span>
          </button>
        )}

        {isPuja && (
          <button
            type="button"
            onClick={() => setActiveDataset('pujaSchedule')}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDataset === 'pujaSchedule' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-700" />
            <span>5-Day Tithi Schedule ({culturalData.pujaSchedule?.length || 0})</span>
          </button>
        )}

        {isPuja && (
          <button
            type="button"
            onClick={() => setActiveDataset('pujaTheme')}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDataset === 'pujaTheme' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Pandal & Idol Tribute</span>
          </button>
        )}

        {isPuja && (
          <button
            type="button"
            onClick={() => setActiveDataset('visitorGuide')}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDataset === 'visitorGuide' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-700" />
            <span>Visitor Transit Guide</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveDataset('events')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'events' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Events & Evenings ({culturalData.events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDataset('gallery')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'gallery' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Gallery ({culturalData.gallery.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDataset('sponsors')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'sponsors' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Sponsors ({culturalData.sponsors.length})</span>
        </button>

        {!isPuja && (
          <button
            type="button"
            onClick={() => setActiveDataset('membership')}
            className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDataset === 'membership' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Membership</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveDataset('donationInfo')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'donationInfo' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-700" />
          <span>Donations Appeal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDataset('news')}
          className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeDataset === 'news' ? 'bg-amber-500/20 text-amber-700 border-b-2 border-amber-400' : 'text-dv-muted hover:text-dv-ink'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Notices ({culturalData.news.length})</span>
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto min-h-[350px]">
        {isJsonMode ? (
          /* RAW JSON MODE */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-dv-muted">
              <span>Editing active dataset: <strong className="text-amber-700 font-mono">{activeDataset}</strong></span>
              <button
                type="button"
                onClick={handleJsonApply}
                className="px-3 py-1 rounded bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
              >
                Apply JSON Changes
              </button>
            </div>
            <textarea
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              rows={16}
              className="w-full bg-dv-ink/[0.04] border border-dv-line rounded-xl p-3 text-xs font-mono text-cyan-700 focus:outline-none focus:border-amber-400"
            />
          </div>
        ) : (
          /* VISUAL CRUD MODE */
          <div className="space-y-4">
            {/* 1. ORGANIZATION PROFILE */}
            {activeDataset === 'organization' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Organization Official Name</label>
                    <input
                      type="text"
                      value={culturalData.organization.name}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, name: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Native Language Name (বাংলা / Hindi)</label>
                    <input
                      type="text"
                      value={culturalData.organization.nativeName || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, nativeName: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink font-serif"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Year Established</label>
                    <input
                      type="number"
                      value={culturalData.organization.establishedYear || 1998}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, establishedYear: Number(e.target.value) }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Registration / Societies Act No.</label>
                    <input
                      type="text"
                      value={culturalData.organization.registrationNumber || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, registrationNumber: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Tagline / Cultural Motto</label>
                    <input
                      type="text"
                      value={culturalData.organization.tagline || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, tagline: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Full Description & Mission</label>
                    <textarea
                      value={culturalData.organization.description}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          organization: { ...culturalData.organization, description: e.target.value }
                        })
                      }
                      rows={3}
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. BRANDING */}
            {activeDataset === 'branding' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={culturalData.branding.primaryColor}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          branding: { ...culturalData.branding, primaryColor: e.target.value }
                        })
                      }
                      className="w-10 h-10 rounded border border-dv-line bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={culturalData.branding.primaryColor}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          branding: { ...culturalData.branding, primaryColor: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Accent Gold Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={culturalData.branding.accentColor}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          branding: { ...culturalData.branding, accentColor: e.target.value }
                        })
                      }
                      className="w-10 h-10 rounded border border-dv-line bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={culturalData.branding.accentColor}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          branding: { ...culturalData.branding, accentColor: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Official Logo URL</label>
                  <input
                    type="text"
                    value={culturalData.branding.primaryLogoUrl || ''}
                    onChange={(e) =>
                      setCulturalData({
                        ...culturalData,
                        branding: { ...culturalData.branding, primaryLogoUrl: e.target.value }
                      })
                    }
                    className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Hero Banner Image URL</label>
                  <input
                    type="text"
                    value={culturalData.branding.coverImageUrl || ''}
                    onChange={(e) =>
                      setCulturalData({
                        ...culturalData,
                        branding: { ...culturalData.branding, coverImageUrl: e.target.value }
                      })
                    }
                    className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                  />
                </div>
              </div>
            )}

            {/* 3. LEADERSHIP & COMMITTEE */}
            {activeDataset === 'leadership' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dv-muted">Total Leaders: {culturalData.leadership.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newLead: CulturalLeader = {
                        id: `lead_${Date.now()}`,
                        name: 'New Committee Member',
                        designation: 'Executive Member',
                        roleCategory: 'executive',
                        displayOrder: culturalData.leadership.length + 1
                      };
                      setCulturalData({
                        ...culturalData,
                        leadership: [...culturalData.leadership, newLead]
                      });
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {culturalData.leadership.map((leader, idx) => (
                    <div key={leader.id} className="p-3 rounded-xl border border-dv-line bg-dv-ink/[0.04] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dv-ink">{leader.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt('Edit member name:', leader.name);
                              if (!name) return;
                              const desig = prompt('Edit designation:', leader.designation);
                              if (!desig) return;
                              setCulturalData({
                                ...culturalData,
                                leadership: culturalData.leadership.map((l, i) =>
                                  i === idx ? { ...l, name, designation: desig } : l
                                )
                              });
                            }}
                            className="p-1 text-dv-muted hover:text-dv-ink"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCulturalData({
                                ...culturalData,
                                leadership: culturalData.leadership.filter((_, i) => i !== idx)
                              })
                            }
                            className="p-1 text-dv-muted hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium">{leader.designation}</div>
                      {leader.bio && <p className="text-[10px] text-dv-muted line-clamp-2">{leader.bio}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PUJA 5-DAY RITUAL SCHEDULE (Puja Only) */}
            {activeDataset === 'pujaSchedule' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dv-muted">Configured Ritual Days: {culturalData.pujaSchedule?.length || 0}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const dayName = prompt('Enter Day Name (e.g. Sandhi Puja Special):', 'Sandhi Puja Special');
                      if (!dayName) return;
                      const date = prompt('Enter Date:', 'Oct 21, 2026');
                      if (!date) return;
                      const newDay: PujaRitualScheduleItem = {
                        id: `sch_${Date.now()}`,
                        dayName,
                        date,
                        tithiInfo: 'Astami Tithi transition',
                        rituals: [
                          { time: '05:15 PM', name: 'Sandhi Puja 108 Deepam', description: 'Lighting 108 sacred earthen lamps', isKeyRitual: true }
                        ]
                      };
                      setCulturalData({
                        ...culturalData,
                        pujaSchedule: [...(culturalData.pujaSchedule || []), newDay]
                      });
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ritual Day</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(culturalData.pujaSchedule || []).map((day, dIdx) => (
                    <div key={day.id} className="p-4 rounded-xl border border-red-500/30 bg-red-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-red-200 pb-2">
                        <div>
                          <span className="font-bold text-dv-ink text-sm">{day.dayName}</span>
                          {day.dayNameNative && <span className="ml-2 text-xs text-amber-700 font-serif">({day.dayNameNative})</span>}
                          <span className="ml-3 text-[11px] text-dv-muted font-mono">🗓️ {day.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-700 font-mono">{day.tithiInfo}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCulturalData({
                                ...culturalData,
                                pujaSchedule: (culturalData.pujaSchedule || []).filter((_, i) => i !== dIdx)
                              })
                            }
                            className="p-1 text-dv-muted hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {day.rituals.map((r, rIdx) => (
                          <div key={rIdx} className="flex items-center justify-between text-xs p-2 rounded bg-dv-ink/[0.04] border border-dv-line">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-700 font-mono font-bold">{r.time}</span>
                              <span className="text-dv-ink font-semibold">{r.name}</span>
                              {r.isKeyRitual && <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 text-[9px] font-bold">KEY</span>}
                            </div>
                            <span className="text-dv-muted text-[11px] truncate max-w-xs">{r.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. PUJA THEME & ARTISAN TRIBUTE (Puja Only) */}
            {activeDataset === 'pujaTheme' && culturalData.pujaTheme && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Current Year Theme Name</label>
                    <input
                      type="text"
                      value={culturalData.pujaTheme.currentThemeName}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          pujaTheme: { ...culturalData.pujaTheme!, currentThemeName: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Native Language Theme Name</label>
                    <input
                      type="text"
                      value={culturalData.pujaTheme.currentThemeNameNative || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          pujaTheme: { ...culturalData.pujaTheme!, currentThemeNameNative: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink font-serif"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Kumartuli Idol Master Sculptor Tribute</label>
                    <input
                      type="text"
                      value={culturalData.pujaTheme.idolArtisan || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          pujaTheme: { ...culturalData.pujaTheme!, idolArtisan: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Theme Architectural Concept & Philosophy</label>
                    <textarea
                      value={culturalData.pujaTheme.themeConcept}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          pujaTheme: { ...culturalData.pujaTheme!, themeConcept: e.target.value }
                        })
                      }
                      rows={4}
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. VISITOR TRANSIT GUIDE (Puja Only) */}
            {activeDataset === 'visitorGuide' && culturalData.visitorGuide && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Pandal Grounds Exact Location</label>
                    <input
                      type="text"
                      value={culturalData.visitorGuide.pandalLocation}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          visitorGuide: { ...culturalData.visitorGuide!, pandalLocation: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Nearest Metro Station & Gate</label>
                    <input
                      type="text"
                      value={culturalData.visitorGuide.nearestMetro || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          visitorGuide: { ...culturalData.visitorGuide!, nearestMetro: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2 mb-1">Designated Parking Information</label>
                    <input
                      type="text"
                      value={culturalData.visitorGuide.parkingInfo || ''}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          visitorGuide: { ...culturalData.visitorGuide!, parkingInfo: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-dv-ink-2 mb-1">Visiting Hours</label>
                    <input
                      type="text"
                      value={culturalData.visitorGuide.visitingHours}
                      onChange={(e) =>
                        setCulturalData({
                          ...culturalData,
                          visitorGuide: { ...culturalData.visitorGuide!, visitingHours: e.target.value }
                        })
                      }
                      className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. DONATIONS APPEAL */}
            {activeDataset === 'donationInfo' && culturalData.donationInfo && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Campaign Appeal Heading</label>
                  <input
                    type="text"
                    value={culturalData.donationInfo.campaignTitle}
                    onChange={(e) =>
                      setCulturalData({
                        ...culturalData,
                        donationInfo: { ...culturalData.donationInfo!, campaignTitle: e.target.value }
                      })
                    }
                    className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Appeal Narrative</label>
                  <textarea
                    value={culturalData.donationInfo.appealMessage}
                    onChange={(e) =>
                      setCulturalData({
                        ...culturalData,
                        donationInfo: { ...culturalData.donationInfo!, appealMessage: e.target.value }
                      })
                    }
                    rows={3}
                    className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">100% Financial Transparency Note</label>
                  <input
                    type="text"
                    value={culturalData.donationInfo.transparencyNote}
                    onChange={(e) =>
                      setCulturalData({
                        ...culturalData,
                        donationInfo: { ...culturalData.donationInfo!, transparencyNote: e.target.value }
                      })
                    }
                    className="w-full bg-dv-ink/[0.03] border border-dv-line rounded-lg p-2.5 text-dv-ink"
                  />
                </div>
              </div>
            )}

            {/* 8. GALLERY */}
            {activeDataset === 'gallery' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dv-muted">Total Media Items: {culturalData.gallery.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const title = prompt('Enter image title:', 'Traditional Aarti Ceremony');
                      if (!title) return;
                      const imageUrl = prompt('Enter image URL:', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80');
                      if (!imageUrl) return;
                      const newMedia: CulturalMediaItem = {
                        id: `gal_${Date.now()}`,
                        title,
                        category: isPuja ? 'Festivities' : 'Conventions',
                        imageUrl
                      };
                      setCulturalData({
                        ...culturalData,
                        gallery: [...culturalData.gallery, newMedia]
                      });
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {culturalData.gallery.map((item, idx) => (
                    <div key={item.id} className="group relative rounded-xl overflow-hidden border border-dv-line bg-dv-ink/[0.04]">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
                      <div className="p-2 space-y-1">
                        <div className="text-[11px] font-bold text-dv-ink truncate">{item.title}</div>
                        <div className="text-[9px] text-amber-700 font-mono">{item.category}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCulturalData({
                            ...culturalData,
                            gallery: culturalData.gallery.filter((_, i) => i !== idx)
                          })
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-dv-ink/[0.04] text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. SPONSORS */}
            {activeDataset === 'sponsors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dv-muted">Total Sponsors: {culturalData.sponsors.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Enter sponsor name:', 'National Cultural Arts Trust');
                      if (!name) return;
                      const newSp: CulturalSponsor = {
                        id: `sp_${Date.now()}`,
                        name,
                        tier: 'principal'
                      };
                      setCulturalData({
                        ...culturalData,
                        sponsors: [...culturalData.sponsors, newSp]
                      });
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sponsor</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {culturalData.sponsors.map((sp, idx) => (
                    <div key={sp.id} className="p-3 rounded-xl border border-dv-line bg-dv-ink/[0.04] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dv-ink">{sp.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setCulturalData({
                              ...culturalData,
                              sponsors: culturalData.sponsors.filter((_, i) => i !== idx)
                            })
                          }
                          className="p-1 text-dv-muted hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/30">
                        {sp.tier} Sponsor
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. NOTICES & ANNOUNCEMENTS */}
            {activeDataset === 'news' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dv-muted">Total Notices: {culturalData.news.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const title = prompt('Enter notice title:', 'Important: General Body Meeting Notice');
                      if (!title) return;
                      const newArticle: CulturalNewsArticle = {
                        id: `news_${Date.now()}`,
                        title,
                        publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        category: 'Official Notice',
                        summary: 'Notice regarding the upcoming annual society general assembly.',
                        content: 'All registered members are requested to attend the General Body Meeting.',
                        isPublished: true
                      };
                      setCulturalData({
                        ...culturalData,
                        news: [...culturalData.news, newArticle]
                      });
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Notice</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {culturalData.news.map((n, idx) => (
                    <div key={n.id} className="p-3 rounded-xl border border-dv-line bg-dv-ink/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-dv-ink">{n.title}</div>
                        <div className="text-[10px] text-dv-muted font-mono">Published: {n.publishedAt} | {n.category}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCulturalData({
                            ...culturalData,
                            news: culturalData.news.filter((_, i) => i !== idx)
                          })
                        }
                        className="p-1 text-dv-muted hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change template: the same library the admin used when creating the project */}
      {switchTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dv-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Change website template">
          <div className="my-6 w-full max-w-6xl rounded-2xl border border-dv-line bg-dv-mist p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-xs text-dv-muted">Pick a new design. Everything your client supplied (events, schedules, committee, media) is kept. Your site is re-rendered in the new design.</p>
              <button type="button" onClick={() => setSwitchTemplateModalOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-dv-muted hover:bg-dv-ink/[0.05] hover:text-dv-ink"><X className="h-5 w-5" /></button>
            </div>
            <CulturalTemplateLibrary
              category={currentTemplate.archetype}
              selectedTemplateId={currentTemplate.id}
              allowAllCategories={false}
              selectLabel={switchingTemplate ? 'Switching...' : 'Switch to this'}
              onSelectTemplate={(meta) => { const t = getCulturalTemplateById(meta.templateId); if (t && !switchingTemplate) void handleSwitchTemplate(t); }}
            />
          </div>
        </div>
      )}

      {previewTemplate && (
        <CulturalDemoModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
};
