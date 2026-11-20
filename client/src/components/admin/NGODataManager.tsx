import React, { useState, useEffect } from 'react';
import { isNgoTemplateIdLite } from '../../templates/ngo/ids';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  HeartHandshake,
  Landmark,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  Coins,
  Users,
  MapPin,
  FileText,
  ShieldCheck,
  Award,
  Sparkles,
  Inbox,
  HelpCircle,
  Image as ImageIcon,
  Code2,
  X
} from 'lucide-react';
import type { ClientProject } from '../../types/admin';
import type {
  NGOWebsiteData,
  NGOArchetype,
  NGOTypographyStyle
} from '../../types/ngo';
import { api } from '../../lib/api';

interface NGODataManagerProps {
  project: ClientProject;
  onProjectUpdated: (updatedProject: ClientProject) => void;
  onClose: () => void;
}

type TabType =
  | 'profile'
  | 'branding'
  | 'programs'
  | 'impact'
  | 'campaigns'
  | 'causes'
  | 'leadership'
  | 'volunteering'
  | 'volunteer_inbox'
  | 'dropping_hubs'
  | 'donation_model'
  | 'donation_inbox'
  | 'stories'
  | 'reports'
  | 'partners'
  | 'gallery'
  | 'faqs'
  | 'raw_json';

export const NGODataManager: React.FC<NGODataManagerProps> = ({
  project,
  onProjectUpdated,
  onClose
}) => {
  // Sites built on a library template take no donations or donor details, so their payment-related controls are not offered.
  // Projects created before the library keep them, and nothing stored is ever deleted.
  const isLibrary = isNgoTemplateIdLite(project.requirements.selectedTemplate?.templateId);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or fallback
  const existingNGO: NGOWebsiteData = (project.requirements.ngoData as NGOWebsiteData) || {
    schemaVersion: '1.0',
    archetype: (project.requirements.ngoArchetype as NGOArchetype) || 'grassroots_ngo',
    profile: {
      name: project.requirements.organizationName || 'Gram Chetna Social Welfare Society',
      legalRegisteredName: project.requirements.organizationName,
      registrationNumber: 'TRUST/DL/2018/8892',
      foundedYear: '2018',
      tagline: project.requirements.tagline || 'Dignity Not Charity • Building Community Infrastructure',
      missionStatement: 'To mobilize communities, eradicate preventable suffering, and build sovereign human dignity through sustainable social programs.',
      visionStatement: 'An equitable world where every community has the resources, voice, and opportunity to thrive with dignity.',
      coreValues: ['Dignity', 'Accountability', 'Empathy', 'Equity'],
      aboutDescription: project.requirements.aboutText || 'A registered non-profit organization dedicated to grassroots community development.',
      taxExemptionNotice: 'All donations are 50% tax exempt under Section 80G of the Indian Income Tax Act.',
      operationalRegions: ['Pan-India'],
      headquartersAddress: project.requirements.address || 'New Delhi, India',
      city: 'New Delhi',
      country: 'India',
      contactEmail: project.requirements.contactEmail || 'secretariat@organization.org',
      contactPhone: project.requirements.contactPhone || '+91 11 4000 8000'
    },
    branding: {
      primaryColor: project.requirements.primaryColor || '#14532d',
      accentColor: project.requirements.accentColor || '#c2410c',
      typographyStyle: (project.requirements.typographyStyle as NGOTypographyStyle) || 'grassroots',
      badgeText: 'DIGNITY NOT CHARITY'
    },
    programs: [],
    impactStats: [],
    campaigns: [],
    causes: [],
    leadership: [],
    volunteering: {
      enabled: true,
      headline: 'Be the Catalyst of Real Change on the Ground',
      description: 'Join our network of active volunteers mobilizing collection drives, workshops, and relief.',
      opportunities: []
    },
    volunteerSubmissions: [],
    collectionCenters: [],
    donationModel: {
      headline: 'Every Contribution Creates Dignity & Measured Impact',
      subheadline: '100% of your public contribution directly impacts field programs with verified 80G tax benefits.',
      donationTiers: [
        { id: 't1', amount: 1500, currency: 'INR', label: 'Dignity Family Kit', impactEquivalence: 'Provides 1 rural family with clothing & warmth' },
        { id: 't2', amount: 3500, currency: 'INR', label: 'School Education Pack', impactEquivalence: 'Supplies 3 rural school students with stationery' }
      ],
      customAmountAllowed: true,
      taxDeductible: true,
      eightyGRegNumber: 'AAATG1234PF20214',
      enquiryOnly: false
    },
    donationEnquiries: [],
    stories: [],
    reports: [],
    partners: [],
    faqs: [],
    gallery: [],
    dataAvailability: {
      programs: false,
      impactStats: false,
      campaigns: false,
      causes: false,
      leadership: false,
      volunteering: true,
      collectionCenters: false,
      donationModel: true,
      stories: false,
      reports: false,
      partners: false,
      faqs: false,
      gallery: false
    }
  };

  const [ngoData, setNgoData] = useState<NGOWebsiteData>(existingNGO);
  const [rawJsonText, setRawJsonText] = useState(JSON.stringify(existingNGO, null, 2));

  useEffect(() => {
    if (project.requirements.ngoData) {
      setNgoData(project.requirements.ngoData);
      setRawJsonText(JSON.stringify(project.requirements.ngoData, null, 2));
    }
  }, [project.requirements.ngoData]);

  // Synchronize state changes to raw JSON
  const updateNGOData = (updater: (prev: NGOWebsiteData) => NGOWebsiteData) => {
    setNgoData(prev => {
      const updated = updater(prev);
      setRawJsonText(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      let dataToSave = ngoData;
      if (activeTab === 'raw_json') {
        dataToSave = JSON.parse(rawJsonText);
        setNgoData(dataToSave);
      }

      const res = await api.saveNGOData(project.id, dataToSave);
      onProjectUpdated(res.project);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save Social & NGO data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-800/60">
              Digiverse Social & NGO Studio
            </span>
            <Badge variant="indigo">
              {ngoData.archetype === 'grassroots_ngo' ? 'Design reference: Goonj' :
               ngoData.archetype === 'institutional_foundation' ? 'Design reference: Obama Foundation' :
               'Design reference: charity: water'}
            </Badge>
          </div>
          <h2 className="text-xl font-black text-dv-ink flex items-center gap-2">
            {ngoData.profile.name}
            <span className="text-xs font-normal text-dv-muted">({ngoData.archetype.replace('_', ' ')})</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {saveSuccess && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved to SQLite WAL
            </span>
          )}
          {errorMessage && (
            <span className="text-xs text-red-700 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </span>
          )}
          <Button
            size="sm"
            variant="primary"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Saving...' : 'Save & Sync'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-dv-muted hover:text-dv-ink">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 18 Visual Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-dv-line scrollbar-none text-xs">
        {[
          { id: 'profile', label: '1. Profile & Legal', icon: Building2 },
          { id: 'branding', label: '2. Branding & Theme', icon: Sparkles },
          { id: 'programs', label: '3. Programs & Work', icon: Award },
          { id: 'impact', label: '4. Impact & Metrics', icon: ShieldCheck },
          { id: 'campaigns', label: '5. Campaigns & Appeals', icon: Coins },
          { id: 'causes', label: '6. Cause Pillars', icon: HeartHandshake },
          { id: 'leadership', label: '7. Trustees & Leaders', icon: Users },
          { id: 'volunteering', label: '8. Volunteers', icon: Users },
          { id: 'volunteer_inbox', label: '9. Volunteer Inbox', icon: Inbox },
          { id: 'dropping_hubs', label: '10. Dropping Hubs', icon: MapPin },
          { id: 'donation_model', label: '11. Donation Model', icon: Coins },
          { id: 'donation_inbox', label: '12. Donation Inbox', icon: Inbox },
          { id: 'stories', label: '13. Field Stories', icon: FileText },
          { id: 'reports', label: '14. Audited Reports', icon: FileText },
          { id: 'partners', label: '15. CSR Partners', icon: Landmark },
          { id: 'gallery', label: '16. Media Gallery', icon: ImageIcon },
          { id: 'faqs', label: '17. FAQs', icon: HelpCircle },
          { id: 'raw_json', label: '18. Raw JSON', icon: Code2 }
        ].filter(tab => !(isLibrary && (tab.id === 'donation_model' || tab.id === 'donation_inbox'))).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-white text-dv-muted hover:text-dv-ink border border-dv-line hover:border-dv-line'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs">
        {/* Tab 1: Profile & Legal */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-dv-muted mb-1">Public Name</label>
                <input
                  type="text"
                  value={ngoData.profile.name}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, name: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
                />
              </div>
              <div>
                <label className="block text-dv-muted mb-1">Legal Registered Name</label>
                <input
                  type="text"
                  value={ngoData.profile.legalRegisteredName || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, legalRegisteredName: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-dv-muted mb-1">Trust / Society Registration</label>
                <input
                  type="text"
                  value={ngoData.profile.registrationNumber || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, registrationNumber: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink font-mono text-xs"
                />
              </div>
              {!isLibrary && <div>
                <label className="block text-dv-muted mb-1">Section 80G URN / No.</label>
                <input
                  type="text"
                  value={ngoData.donationModel.eightyGRegNumber || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, donationModel: { ...p.donationModel, eightyGRegNumber: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink font-mono text-xs"
                />
              </div>}
              <div>
                <label className="block text-dv-muted mb-1">Founded Year</label>
                <input
                  type="text"
                  value={ngoData.profile.foundedYear || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, foundedYear: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-dv-muted mb-1">Tax Exemption Notice for Donors</label>
              <input
                type="text"
                value={ngoData.profile.taxExemptionNotice || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateNGOData(p => ({ ...p, profile: { ...p.profile, taxExemptionNotice: val } }));
                }}
                className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-dv-muted mb-1">Mission Statement</label>
                <textarea
                  rows={3}
                  value={ngoData.profile.missionStatement}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, missionStatement: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded p-2 text-dv-ink"
                />
              </div>
              <div>
                <label className="block text-dv-muted mb-1">Vision Statement</label>
                <textarea
                  rows={3}
                  value={ngoData.profile.visionStatement}
                  onChange={e => {
                    const val = e.target.value;
                    updateNGOData(p => ({ ...p, profile: { ...p.profile, visionStatement: val } }));
                  }}
                  className="w-full bg-white border border-dv-line rounded p-2 text-dv-ink"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Branding */}
        {activeTab === 'branding' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-dv-muted mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ngoData.branding.primaryColor}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({ ...p, branding: { ...p.branding, primaryColor: val } }));
                    }}
                    className="w-8 h-8 rounded border border-dv-line bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={ngoData.branding.primaryColor}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({ ...p, branding: { ...p.branding, primaryColor: val } }));
                    }}
                    className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-dv-muted mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ngoData.branding.accentColor}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({ ...p, branding: { ...p.branding, accentColor: val } }));
                    }}
                    className="w-8 h-8 rounded border border-dv-line bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={ngoData.branding.accentColor}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({ ...p, branding: { ...p.branding, accentColor: val } }));
                    }}
                    className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-dv-muted mb-1">Badge Callout Text</label>
              <input
                type="text"
                value={ngoData.branding.badgeText || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateNGOData(p => ({ ...p, branding: { ...p.branding, badgeText: val } }));
                }}
                className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Programs */}
        {activeTab === 'programs' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Flagship programs and community initiatives ({ngoData.programs.length})</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateNGOData(p => ({
                    ...p,
                    programs: [
                      ...p.programs,
                      {
                        id: `prg_${Date.now()}`,
                        title: 'New Program Initiative',
                        category: 'Community Welfare',
                        shortSummary: 'Summary of objectives and activities.',
                        fullDescription: 'Comprehensive program description.',
                        beneficiaryGroup: 'Rural households',
                        locations: ['District Locations'],
                        outcomes: ['Key outcomes achieved'],
                        status: 'active'
                      }
                    ],
                    dataAvailability: { ...p.dataAvailability, programs: true }
                  }));
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Program
              </Button>
            </div>

            <div className="space-y-3">
              {ngoData.programs.map((prog, idx) => (
                <div key={prog.id} className="p-3.5 rounded-xl border border-dv-line bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700">Program #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateNGOData(p => ({
                          ...p,
                          programs: p.programs.filter(item => item.id !== prog.id),
                          dataAvailability: { ...p.dataAvailability, programs: p.programs.length > 1 }
                        }));
                      }}
                      className="text-red-700 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={prog.title}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          programs: p.programs.map(item => item.id === prog.id ? { ...item, title: val } : item)
                        }));
                      }}
                      placeholder="Title"
                      className="bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
                    />
                    <input
                      type="text"
                      value={prog.category}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          programs: p.programs.map(item => item.id === prog.id ? { ...item, category: val } : item)
                        }));
                      }}
                      placeholder="Category"
                      className="bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Impact Stats */}
        {activeTab === 'impact' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Verified impact metrics and proof ({ngoData.impactStats.length})</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateNGOData(p => ({
                    ...p,
                    impactStats: [
                      ...p.impactStats,
                      {
                        id: `stat_${Date.now()}`,
                        value: '10,000+',
                        label: 'People Impacted',
                        isVerified: true,
                        verificationSource: 'Field Registry'
                      }
                    ],
                    dataAvailability: { ...p.dataAvailability, impactStats: true }
                  }));
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Metric
              </Button>
            </div>

            <div className="space-y-2">
              {ngoData.impactStats.map(stat => (
                <div key={stat.id} className="p-3 rounded-xl border border-dv-line bg-white flex items-center gap-3">
                  <input
                    type="text"
                    value={stat.value}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({
                        ...p,
                        impactStats: p.impactStats.map(item => item.id === stat.id ? { ...item, value: val } : item)
                      }));
                    }}
                    placeholder="Value (e.g. 4.2M+)"
                    className="w-28 bg-white border border-dv-line rounded px-2 py-1 text-emerald-700 font-bold"
                  />
                  <input
                    type="text"
                    value={stat.label}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({
                        ...p,
                        impactStats: p.impactStats.map(item => item.id === stat.id ? { ...item, label: val } : item)
                      }));
                    }}
                    placeholder="Label"
                    className="flex-1 bg-white border border-dv-line rounded px-2 py-1 text-dv-ink"
                  />
                  <input
                    type="text"
                    value={stat.verificationSource || ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({
                        ...p,
                        impactStats: p.impactStats.map(item => item.id === stat.id ? { ...item, verificationSource: val } : item)
                      }));
                    }}
                    placeholder="Audit Source"
                    className="w-36 bg-white border border-dv-line rounded px-2 py-1 text-dv-muted"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateNGOData(p => ({
                        ...p,
                        impactStats: p.impactStats.filter(item => item.id !== stat.id),
                        dataAvailability: { ...p.dataAvailability, impactStats: p.impactStats.length > 1 }
                      }));
                    }}
                    className="text-red-700 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Fundraising appeals and active drives ({ngoData.campaigns.length})</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateNGOData(p => ({
                    ...p,
                    campaigns: [
                      ...p.campaigns,
                      {
                        id: `cmp_${Date.now()}`,
                        title: 'Emergency Relief Appeal',
                        tagline: 'Supporting affected families immediately',
                        description: 'Mobilizing essentials for rapid community relief.',
                        targetGoal: 1000000,
                        achievedAmount: 250000,
                        currency: 'INR',
                        status: 'urgent'
                      }
                    ],
                    dataAvailability: { ...p.dataAvailability, campaigns: true }
                  }));
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Campaign
              </Button>
            </div>

            <div className="space-y-3">
              {ngoData.campaigns.map(cmp => (
                <div key={cmp.id} className="p-3.5 rounded-xl border border-dv-line bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={cmp.title}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          campaigns: p.campaigns.map(c => c.id === cmp.id ? { ...c, title: val } : c)
                        }));
                      }}
                      className="bg-white border border-dv-line rounded px-2.5 py-1 text-dv-ink font-bold"
                    />
                    <select
                      value={cmp.status}
                      onChange={e => {
                        const val = e.target.value as any;
                        updateNGOData(p => ({
                          ...p,
                          campaigns: p.campaigns.map(c => c.id === cmp.id ? { ...c, status: val } : c)
                        }));
                      }}
                      className="bg-white border border-dv-line rounded px-2 py-1 text-xs text-amber-700"
                    >
                      <option value="active">Active</option>
                      <option value="urgent">Urgent</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 9: Volunteer Applications Inbox */}
        {activeTab === 'volunteer_inbox' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Applications submitted via public website ({ngoData.volunteerSubmissions?.length || 0})</span>
            </div>

            {(!ngoData.volunteerSubmissions || ngoData.volunteerSubmissions.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-dv-line rounded-xl text-dv-muted">
                No volunteer applications received yet. Submissions via POST /api/projects/:id/volunteer will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {ngoData.volunteerSubmissions.map(sub => (
                  <div key={sub.id} className="p-3 rounded-xl border border-dv-line bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-dv-ink">{sub.applicantName} ({sub.city})</div>
                      <div className="text-dv-muted text-[11px]">{sub.applicantEmail} • {sub.applicantPhone}</div>
                      <div className="text-emerald-700 text-[11px]">Role Interest: {sub.roleInterest} • Availability: {sub.availability}</div>
                    </div>
                    <span className="text-[10px] text-dv-muted">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 10: Dropping Hubs */}
        {activeTab === 'dropping_hubs' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Material collection dropping centers ({ngoData.collectionCenters.length})</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  updateNGOData(p => ({
                    ...p,
                    collectionCenters: [
                      ...p.collectionCenters,
                      {
                        id: `hub_${Date.now()}`,
                        centerName: 'Regional Collection Hub',
                        city: 'Mumbai',
                        address: 'Community Center, Andheri East',
                        contactPerson: 'Volunteer Lead',
                        contactPhone: '+91 98000 00000',
                        timings: '10:00 AM - 05:00 PM',
                        acceptedItems: ['Clothes', 'Blankets', 'Stationery']
                      }
                    ],
                    dataAvailability: { ...p.dataAvailability, collectionCenters: true }
                  }));
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Hub
              </Button>
            </div>

            <div className="space-y-3">
              {ngoData.collectionCenters.map(hub => (
                <div key={hub.id} className="p-3.5 rounded-xl border border-dv-line bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={hub.centerName}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          collectionCenters: p.collectionCenters.map(h => h.id === hub.id ? { ...h, centerName: val } : h)
                        }));
                      }}
                      className="bg-white border border-dv-line rounded px-2.5 py-1 text-dv-ink font-bold"
                    />
                    <input
                      type="text"
                      value={hub.city}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          collectionCenters: p.collectionCenters.map(h => h.id === hub.id ? { ...h, city: val } : h)
                        }));
                      }}
                      className="bg-white border border-dv-line rounded px-2.5 py-1 text-emerald-700"
                    />
                  </div>
                  <input
                    type="text"
                    value={hub.address}
                    onChange={e => {
                      const val = e.target.value;
                      updateNGOData(p => ({
                        ...p,
                        collectionCenters: p.collectionCenters.map(h => h.id === hub.id ? { ...h, address: val } : h)
                      }));
                    }}
                    placeholder="Address"
                    className="w-full bg-white border border-dv-line rounded px-2.5 py-1 text-dv-ink-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 11: Donation Model */}
        {activeTab === 'donation_model' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-dv-muted mb-1">Headline</label>
              <input
                type="text"
                value={ngoData.donationModel.headline}
                onChange={e => {
                  const val = e.target.value;
                  updateNGOData(p => ({ ...p, donationModel: { ...p.donationModel, headline: val } }));
                }}
                className="w-full bg-white border border-dv-line rounded px-2.5 py-1.5 text-dv-ink"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-dv-muted">Donation Tiers & Impact Equivalents ({ngoData.donationModel.donationTiers.length})</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ngoData.donationModel.donationTiers.map(tier => (
                  <div key={tier.id} className="p-3 rounded-xl border border-dv-line bg-white space-y-1.5">
                    <div className="text-emerald-700 font-bold font-mono">₹{tier.amount.toLocaleString()}</div>
                    <input
                      type="text"
                      value={tier.label}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          donationModel: {
                            ...p.donationModel,
                            donationTiers: p.donationModel.donationTiers.map(t => t.id === tier.id ? { ...t, label: val } : t)
                          }
                        }));
                      }}
                      className="w-full bg-white border border-dv-line rounded px-2 py-1 text-xs text-dv-ink"
                    />
                    <textarea
                      rows={2}
                      value={tier.impactEquivalence}
                      onChange={e => {
                        const val = e.target.value;
                        updateNGOData(p => ({
                          ...p,
                          donationModel: {
                            ...p.donationModel,
                            donationTiers: p.donationModel.donationTiers.map(t => t.id === tier.id ? { ...t, impactEquivalence: val } : t)
                          }
                        }));
                      }}
                      className="w-full bg-white border border-dv-line rounded p-1.5 text-[11px] text-dv-muted"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 12: Donation Enquiries Inbox */}
        {activeTab === 'donation_inbox' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted">Pledges & enquiries submitted via public website ({ngoData.donationEnquiries?.length || 0})</span>
            </div>

            {(!ngoData.donationEnquiries || ngoData.donationEnquiries.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-dv-line rounded-xl text-dv-muted">
                No donor pledges received yet. Submissions via POST /api/projects/:id/donation-enquiry will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {ngoData.donationEnquiries.map(enq => (
                  <div key={enq.id} className="p-3 rounded-xl border border-dv-line bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-dv-ink">{enq.donorName} ({enq.frequency})</div>
                      <div className="text-dv-muted text-[11px]">{enq.donorEmail} • PAN: {enq.panNumber || 'N/A'}</div>
                      <div className="text-emerald-700 text-[11px]">Pledged Amount: {enq.currency} {enq.amount?.toLocaleString() || 'Custom'}</div>
                    </div>
                    <span className="text-[10px] text-dv-muted">{new Date(enq.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 18: Diagnostic Raw JSON */}
        {activeTab === 'raw_json' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-dv-muted text-[11px]">Bidirectional editing of complete NGOWebsiteData payload</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRawJsonText(JSON.stringify(ngoData, null, 2))}
              >
                Reset from Visual State
              </Button>
            </div>
            <textarea
              rows={22}
              value={rawJsonText}
              onChange={e => setRawJsonText(e.target.value)}
              className="w-full bg-white border border-dv-line rounded-xl p-3 text-emerald-700 font-mono text-[11px] leading-relaxed outline-none focus:border-emerald-500/50"
            />
          </div>
        )}

        {/* Fallback for other tabs */}
        {['causes', 'leadership', 'volunteering', 'stories', 'reports', 'partners', 'gallery', 'faqs'].includes(activeTab) && (
          <div className="p-8 text-center border border-dv-line rounded-xl bg-white space-y-2">
            <p className="text-dv-ink-2 capitalize font-bold">{activeTab.replace('_', ' ')} Management</p>
            <p className="text-dv-muted text-xs">Edit directly in Tab 18 (Raw JSON) or configure through the 15-step intake wizard.</p>
          </div>
        )}
      </div>
    </div>
  );
};
