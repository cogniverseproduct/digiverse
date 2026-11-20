import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Save,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Users,
  UserCheck,
  Swords,
  CalendarDays,
  ListOrdered,
  Clock,
  Sparkles,
  Megaphone,
  Layers,
  Code2,
  Building2,
  X,
  GraduationCap,
  GitBranch,
  Timer,
  Globe,
  Palette,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

import type { ClientProject } from '../../types/admin';
import type {
  SportsWebsiteData
} from '../../types/sports';
import { api } from '../../lib/api';

interface SportsDataManagerProps {
  project: ClientProject;
  onProjectUpdated: (project: ClientProject) => void;
  onClose?: () => void;
}

export type DatasetKey =
  | 'club'
  | 'branding'
  | 'teams'
  | 'players'
  | 'staff'
  | 'competitions'
  | 'fixtures'
  | 'standings'
  | 'matchEvents'
  | 'stages'
  | 'programmes'
  | 'batches'
  | 'sponsors'
  | 'news'
  | 'gallery'
  | 'enquiries'
  | 'pages'
  | 'seo'
  | 'sections';

interface DatasetDef {
  key: DatasetKey;
  label: string;
  description: string;
  archetypes: ('all' | 'sports_club' | 'sports_tournament' | 'sports_academy')[];
  icon: React.ReactNode;
}

const DATASETS: DatasetDef[] = [
  { key: 'club', label: '1. Club Profile', description: 'Organization identity, venues & colors', archetypes: ['all'], icon: <Building2 className="h-4 w-4" /> },
  { key: 'branding', label: '2. Brand & Crest', description: 'Logos, club crest & color identity', archetypes: ['all'], icon: <Palette className="h-4 w-4" /> },
  { key: 'teams', label: '3. Teams & Squads', description: 'Squads, age groups & rosters', archetypes: ['sports_club', 'sports_tournament'], icon: <Users className="h-4 w-4" /> },
  { key: 'players', label: '4. Player Profiles & Stats', description: 'Player cards, jerseys, stats & bio', archetypes: ['sports_club', 'sports_academy'], icon: <UserCheck className="h-4 w-4" /> },
  { key: 'staff', label: '5. Coaches & Staff', description: 'Trainers, credentials & assignments', archetypes: ['sports_club', 'sports_academy'], icon: <Sparkles className="h-4 w-4" /> },
  { key: 'competitions', label: '6. Competitions', description: 'Leagues, cups & tournament formats', archetypes: ['sports_club', 'sports_tournament'], icon: <Swords className="h-4 w-4" /> },
  { key: 'fixtures', label: '7. Fixtures & Results', description: 'Match schedules, scorelines & reports', archetypes: ['sports_club', 'sports_tournament'], icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'standings', label: '8. Points Table', description: 'Positions, points, GD & form guide', archetypes: ['sports_club', 'sports_tournament'], icon: <ListOrdered className="h-4 w-4" /> },
  { key: 'matchEvents', label: '9. Match Events', description: 'Timeline minutes, goals & cards', archetypes: ['sports_club', 'sports_tournament'], icon: <Clock className="h-4 w-4" /> },
  { key: 'stages', label: '10. Knockout Brackets', description: 'Tournament rounds & elimination trees', archetypes: ['sports_tournament'], icon: <GitBranch className="h-4 w-4" /> },
  { key: 'programmes', label: '11. Academy Programmes', description: 'Coaching courses, age groups & fees', archetypes: ['sports_academy'], icon: <GraduationCap className="h-4 w-4" /> },
  { key: 'batches', label: '12. Training Batches', description: 'Schedules, venues & trainer slots', archetypes: ['sports_academy'], icon: <Timer className="h-4 w-4" /> },
  { key: 'news', label: '13. Sports News', description: 'Club announcements & match reports', archetypes: ['all'], icon: <Megaphone className="h-4 w-4" /> },
  { key: 'gallery', label: '14. Gallery & Media', description: 'Photo albums & YouTube video embeds', archetypes: ['all'], icon: <ImageIcon className="h-4 w-4" /> },
  { key: 'sponsors', label: '15. Sponsors & Partners', description: 'Partner logos, tiers & sponsor links', archetypes: ['all'], icon: <Trophy className="h-4 w-4" /> },
  { key: 'enquiries', label: '16. Enquiries & Trials', description: 'Membership & trial intake settings', archetypes: ['all'], icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'pages', label: '17. Pages & Nav', description: 'Website pages & navigation visibility', archetypes: ['all'], icon: <Layers className="h-4 w-4" /> },
  { key: 'seo', label: '18. SEO & Social Meta', description: 'Search titles, meta tags & OG images', archetypes: ['all'], icon: <Globe className="h-4 w-4" /> },
  { key: 'sections', label: 'Page Sections', description: 'Section layout order & visibility', archetypes: ['all'], icon: <ClipboardList className="h-4 w-4" /> }
];

// Sport options available for multi-sport extensions

function createDefaultSportsData(project: ClientProject): SportsWebsiteData {
  const req = project.requirements;
  return {
    schemaVersion: '1.0',
    club: {
      organizationName: req.organizationName || 'Sports Organization',
      sportTypes: ['football'],
      organizationType: req.sportsArchetype === 'sports_academy' ? 'sports_academy' : req.sportsArchetype === 'sports_tournament' ? 'tournament_organizer' : 'sports_club',
      tagline: req.tagline || 'Excellence in Sport',
      description: req.aboutText || '',
      headquarters: req.address || '',
      homeGround: 'Main Stadium Grounds',
      logoUrl: req.logoUrl,
      coverImageUrl: req.coverImageUrl,
      primaryColor: req.primaryColor || '#0284c7',
      accentColor: req.accentColor || '#06b6d4',
      websiteLanguage: 'english'
    },
    teams: [],
    players: [],
    staff: [],
    competitions: [],
    fixtures: [],
    standings: [],
    matchEvents: [],
    sponsors: [],
    news: [],
    pages: [],
    sections: [],
    tournamentStages: [],
    academyProgrammes: [],
    trainingBatches: [],
    seoInfo: {
      metaTitle: `${req.organizationName || 'Sports Organization'} | Official Website`,
      metaDescription: req.tagline || 'Official sports organization portal.',
      keywords: ['sports', 'fixtures', 'club', 'league']
    },
    brandingMedia: {
      primaryLogoUrl: req.logoUrl,
      bannerImageUrl: req.coverImageUrl
    },
    dataAvailability: {
      teams: false,
      players: false,
      staff: false,
      competitions: false,
      fixtures: false,
      standings: false,
      sponsors: false,
      news: false
    }
  };
}

function getInitialData(project: ClientProject): SportsWebsiteData {
  if (project.generatedWebsite?.sportsData) {
    const sd = project.generatedWebsite.sportsData;
    return {
      ...sd,
      tournamentStages: sd.tournamentStages || [],
      academyProgrammes: sd.academyProgrammes || [],
      trainingBatches: sd.trainingBatches || [],
      seoInfo: sd.seoInfo || {
        metaTitle: `${project.requirements.organizationName || 'Sports'} | Official Portal`,
        metaDescription: project.requirements.tagline || '',
        keywords: ['sports']
      },
      brandingMedia: sd.brandingMedia || {
        primaryLogoUrl: project.requirements.logoUrl,
        bannerImageUrl: project.requirements.coverImageUrl
      }
    };
  }
  if (project.requirements.sportsData) {
    const sd = project.requirements.sportsData;
    return {
      ...sd,
      tournamentStages: sd.tournamentStages || [],
      academyProgrammes: sd.academyProgrammes || [],
      trainingBatches: sd.trainingBatches || [],
      seoInfo: sd.seoInfo || {
        metaTitle: `${project.requirements.organizationName || 'Sports'} | Official Portal`,
        metaDescription: project.requirements.tagline || '',
        keywords: ['sports']
      },
      brandingMedia: sd.brandingMedia || {
        primaryLogoUrl: project.requirements.logoUrl,
        bannerImageUrl: project.requirements.coverImageUrl
      }
    };
  }
  return createDefaultSportsData(project);
}

export const SportsDataManager: React.FC<SportsDataManagerProps> = ({
  project,
  onProjectUpdated,
  onClose
}) => {
  const projectArchetype = project.requirements.sportsArchetype || 'sports_club';
  const [archetypeFilter, setArchetypeFilter] = useState<'all' | 'archetype'>('all');
  const [activeDataset, setActiveDataset] = useState<DatasetKey>(
    projectArchetype === 'sports_tournament' ? 'competitions' : projectArchetype === 'sports_academy' ? 'programmes' : 'teams'
  );
  const [sportsData, setSportsData] = useState<SportsWebsiteData>(() => getInitialData(project));
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Form state for item editing
  const [editingItem, setEditingItem] = useState<{ type: DatasetKey; isNew: boolean; data: any } | null>(null);

  useEffect(() => {
    setSportsData(getInitialData(project));
  }, [project.id, project.updatedAt]);

  const getCurrentDatasetValue = (key: DatasetKey): any => {
    switch (key) {
      case 'club': return sportsData.club;
      case 'branding': return sportsData.brandingMedia || {};
      case 'teams': return sportsData.teams;
      case 'players': return sportsData.players;
      case 'staff': return sportsData.staff;
      case 'competitions': return sportsData.competitions;
      case 'fixtures': return sportsData.fixtures;
      case 'standings': return sportsData.standings;
      case 'matchEvents': return sportsData.matchEvents;
      case 'stages': return sportsData.tournamentStages || [];
      case 'programmes': return sportsData.academyProgrammes || [];
      case 'batches': return sportsData.trainingBatches || [];
      case 'sponsors': return sportsData.sponsors;
      case 'news': return sportsData.news;
      case 'gallery': return sportsData.pages;
      case 'enquiries': return { membership: true, admission: true, hotline: project.requirements.contactPhone };
      case 'pages': return sportsData.pages;
      case 'seo': return sportsData.seoInfo || {};
      case 'sections': return sportsData.sections;
      default: return [];
    }
  };

  useEffect(() => {
    setJsonDraft(JSON.stringify(getCurrentDatasetValue(activeDataset), null, 2));
  }, [activeDataset, sportsData]);

  const updateDataAvailability = (data: SportsWebsiteData): SportsWebsiteData => {
    return {
      ...data,
      dataAvailability: {
        teams: data.teams.length > 0,
        players: data.players.length > 0,
        staff: data.staff.length > 0,
        competitions: data.competitions.length > 0,
        fixtures: data.fixtures.length > 0,
        standings: data.standings.length > 0,
        sponsors: data.sponsors.length > 0,
        news: data.news.some(item => item.isPublished),
        tournamentStages: (data.tournamentStages?.length ?? 0) > 0,
        academyProgrammes: (data.academyProgrammes?.length ?? 0) > 0,
        trainingBatches: (data.trainingBatches?.length ?? 0) > 0
      }
    };
  };

  const handleSaveAll = async (overrideData?: SportsWebsiteData) => {
    const dataToSave = updateDataAvailability(overrideData || sportsData);
    setSaving(true);
    setFeedback(null);

    try {
      let updatedProject: ClientProject;
      if (typeof api.saveSportsData === 'function') {
        const res = await api.saveSportsData(project.id, dataToSave);
        updatedProject = res.project;
      } else {
        updatedProject = await api.customizeWebsite(project.id, { sportsData: dataToSave });
      }

      setSportsData(dataToSave);
      onProjectUpdated(updatedProject);
      setFeedback({
        type: 'success',
        message: 'Sports data successfully saved to database. Live website preview updated.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save sports data.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleJsonSave = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      let nextData = { ...sportsData };
      if (activeDataset === 'club') {
        nextData.club = parsed;
      } else if (activeDataset === 'branding') {
        nextData.brandingMedia = parsed;
      } else if (activeDataset === 'seo') {
        nextData.seoInfo = parsed;
      } else if (activeDataset === 'stages') {
        nextData.tournamentStages = parsed;
      } else if (activeDataset === 'programmes') {
        nextData.academyProgrammes = parsed;
      } else if (activeDataset === 'batches') {
        nextData.trainingBatches = parsed;
      } else {
        (nextData as any)[activeDataset] = parsed;
      }
      setSportsData(nextData);
      handleSaveAll(nextData);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Invalid JSON format.' });
    }
  };

  const saveItemToDataset = (datasetKey: DatasetKey, item: any, isNew: boolean) => {
    let nextData = { ...sportsData };
    if (datasetKey === 'stages') {
      const list = [...(nextData.tournamentStages || [])];
      if (isNew) list.push(item);
      else {
        const idx = list.findIndex(i => i.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
      }
      nextData.tournamentStages = list;
    } else if (datasetKey === 'programmes') {
      const list = [...(nextData.academyProgrammes || [])];
      if (isNew) list.push(item);
      else {
        const idx = list.findIndex(i => i.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
      }
      nextData.academyProgrammes = list;
    } else if (datasetKey === 'batches') {
      const list = [...(nextData.trainingBatches || [])];
      if (isNew) list.push(item);
      else {
        const idx = list.findIndex(i => i.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
      }
      nextData.trainingBatches = list;
    } else if (datasetKey === 'branding') {
      nextData.brandingMedia = item;
    } else if (datasetKey === 'seo') {
      nextData.seoInfo = item;
    } else {
      const list = [...(((nextData as any)[datasetKey] as any[]) || [])];
      if (isNew) list.push(item);
      else {
        const index = list.findIndex(i => i.id === item.id);
        if (index >= 0) list[index] = item;
        else list.push(item);
      }
      (nextData as any)[datasetKey] = list;
    }

    setSportsData(nextData);
    setEditingItem(null);
    handleSaveAll(nextData);
  };

  const deleteItemFromDataset = (datasetKey: DatasetKey, id: string) => {
    let nextData = { ...sportsData };
    if (datasetKey === 'stages') {
      nextData.tournamentStages = (nextData.tournamentStages || []).filter(i => i.id !== id);
    } else if (datasetKey === 'programmes') {
      nextData.academyProgrammes = (nextData.academyProgrammes || []).filter(i => i.id !== id);
    } else if (datasetKey === 'batches') {
      nextData.trainingBatches = (nextData.trainingBatches || []).filter(i => i.id !== id);
    } else {
      const list = ((nextData as any)[datasetKey] as any[]) || [];
      (nextData as any)[datasetKey] = list.filter(i => i.id !== id);
    }
    setSportsData(nextData);
    handleSaveAll(nextData);
  };

  const activeDefinition = DATASETS.find(item => item.key === activeDataset)!;
  const activeValue = getCurrentDatasetValue(activeDataset);
  const activeCount = Array.isArray(activeValue) ? activeValue.length : ['club', 'branding', 'seo', 'enquiries'].includes(activeDataset) ? 1 : 0;

  const filteredDatasets = DATASETS.filter(item => {
    if (archetypeFilter === 'all') return true;
    return item.archetypes.includes('all') || item.archetypes.includes(projectArchetype);
  });

  return (
    <div className="space-y-6 rounded-2xl border border-dv-line bg-white p-6 text-dv-ink shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-700 border border-cyan-500/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-dv-ink">Sports Data Manager (18 Modules)</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-50 border border-cyan-800 text-cyan-700">
                {projectArchetype.replace('sports_', '').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-dv-muted">
              Teams, squads, fixtures and standings for {sportsData.club.organizationName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Archetype Filter Toggle */}
          <div className="flex items-center rounded-lg border border-dv-line bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setArchetypeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${archetypeFilter === 'all' ? 'bg-cyan-500 text-white' : 'text-dv-muted hover:text-white'}`}
            >
              All 18
            </button>
            <button
              type="button"
              onClick={() => setArchetypeFilter('archetype')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${archetypeFilter === 'archetype' ? 'bg-cyan-500 text-white' : 'text-dv-muted hover:text-white'}`}
            >
              Archetype Focus
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsJsonMode(!isJsonMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isJsonMode
                ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                : 'border-dv-line bg-white text-dv-muted hover:bg-dv-canvas hover:text-dv-ink'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            {isJsonMode ? 'Visual UI' : 'Raw JSON'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save & Sync
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-dv-line p-1.5 text-dv-muted hover:bg-dv-canvas hover:text-dv-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
              : 'border-rose-500/40 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 18-Module Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-1.5">
        {filteredDatasets.map(item => {
          const isSelected = activeDataset === item.key;
          const val = getCurrentDatasetValue(item.key);
          const count = Array.isArray(val) ? val.length : 1;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveDataset(item.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-50 text-dv-ink shadow-md shadow-cyan-950/50'
                  : 'border-dv-line bg-white text-dv-muted hover:border-dv-line hover:bg-white hover:text-dv-ink'
              }`}
            >
              <span className={isSelected ? 'text-cyan-700' : 'text-dv-muted'}>{item.icon}</span>
              <span className="text-[11px] font-semibold truncate w-full">{item.label.replace(/^\d+\.\s*/, '')}</span>
              <span className="text-[9px] font-mono text-dv-muted">
                {Array.isArray(val) ? `${count} items` : 'Config'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Dataset Container */}
      <div className="rounded-xl border border-dv-line bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dv-line pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-dv-ink flex items-center gap-2">
              {activeDefinition.icon}
              {activeDefinition.label}
              <span className="text-[10px] font-normal text-dv-muted">({activeCount} records)</span>
            </h4>
            <p className="text-xs text-dv-muted mt-0.5">{activeDefinition.description}</p>
          </div>

          {!isJsonMode && Array.isArray(activeValue) && (
            <button
              type="button"
              onClick={() => {
                const id = `item_${Date.now()}`;
                let newItem: any = { id };
                if (activeDataset === 'teams') {
                  newItem = { id, name: 'New Squad', sport: 'football', ageGroup: 'Senior', isActive: true };
                } else if (activeDataset === 'players') {
                  newItem = { id, teamId: sportsData.teams[0]?.id || '', fullName: 'New Player', status: 'active', jerseyNumber: 10, statistics: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0 } };
                } else if (activeDataset === 'fixtures') {
                  newItem = { id, teamId: sportsData.teams[0]?.id || '', opponentName: 'Opponent FC', scheduledAt: new Date().toISOString(), venue: sportsData.club.homeGround, status: 'scheduled', homeOrAway: 'home' };
                } else if (activeDataset === 'stages') {
                  newItem = { id, name: 'Quarter-Finals', stageType: 'knockout', stageOrder: 1, status: 'upcoming', matches: [] };
                } else if (activeDataset === 'programmes') {
                  newItem = { id, title: 'Elite Training Programme', sport: 'football', ageGroup: 'U-17', duration: '6 Months', feeStructure: '₹3,000 / Mo', curriculumHighlights: ['Technical Mastery', 'Tactical Training'], isActive: true };
                } else if (activeDataset === 'batches') {
                  newItem = { id, programmeId: sportsData.academyProgrammes?.[0]?.id || '', name: 'Morning Elite Batch', ageGroup: 'U-17', daysOfWeek: ['Mon', 'Wed', 'Fri'], startTime: '06:30 AM', endTime: '08:00 AM', venue: 'Main Field', coachName: 'Coach Marcus', maxCapacity: 25, currentEnrollment: 10 };
                } else if (activeDataset === 'sponsors') {
                  newItem = { id, name: 'Official Sponsor', tier: 'principal', sponsorshipLevel: 'gold', logoUrl: '', websiteUrl: '' };
                } else if (activeDataset === 'news') {
                  newItem = { id, title: 'Latest Club Announcement', summary: 'Exciting news from the club.', publishedAt: new Date().toISOString(), category: 'Announcement', isPublished: true, tags: ['Club'] };
                } else if (activeDataset === 'staff') {
                  newItem = { id, fullName: 'New Coach', role: 'Head Coach', credentials: ['FA Level 2'], isActive: true };
                } else if (activeDataset === 'competitions') {
                  newItem = { id, name: 'Premier League', season: '2026/27', format: 'league', sport: 'football', isActive: true };
                } else if (activeDataset === 'matchEvents') {
                  newItem = { id, fixtureId: sportsData.fixtures[0]?.id || '', minute: 15, eventType: 'goal', teamId: sportsData.teams[0]?.id || '', description: 'Clinical finish into bottom corner' };
                }
                setEditingItem({ type: activeDataset, isNew: true, data: newItem });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600/30 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-600 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Record
            </button>
          )}
        </div>

        {isJsonMode ? (
          <div className="space-y-3">
            <textarea
              rows={16}
              value={jsonDraft}
              onChange={e => setJsonDraft(e.target.value)}
              className="w-full rounded-xl border border-dv-line bg-white p-4 font-mono text-xs text-cyan-700 focus:border-cyan-400 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleJsonSave}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                Apply JSON Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. CLUB PROFILE */}
            {activeDataset === 'club' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Club / Organization Name</label>
                  <input
                    type="text"
                    value={sportsData.club.organizationName}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, organizationName: e.target.value } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Club Tagline / Motto</label>
                  <input
                    type="text"
                    value={sportsData.club.tagline || ''}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, tagline: e.target.value } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Home Ground / Stadium</label>
                  <input
                    type="text"
                    value={sportsData.club.homeGround || ''}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, homeGround: e.target.value } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Founded Year</label>
                  <input
                    type="number"
                    value={sportsData.club.foundedYear ?? 1892}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, foundedYear: Number(e.target.value) || undefined } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-dv-ink-2 mb-1">Headquarters & Postal Address</label>
                  <input
                    type="text"
                    value={sportsData.club.headquarters || ''}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, headquarters: e.target.value } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-dv-ink-2 mb-1">About & Club History</label>
                  <textarea
                    rows={4}
                    value={sportsData.club.description || ''}
                    onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, description: e.target.value } })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
              </div>
            )}

            {/* 2. BRANDING & CREST */}
            {activeDataset === 'branding' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Primary Club Crest / Logo URL</label>
                  <input
                    type="text"
                    value={sportsData.brandingMedia?.primaryLogoUrl || sportsData.club.logoUrl || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      club: { ...sportsData.club, logoUrl: e.target.value },
                      brandingMedia: { ...(sportsData.brandingMedia || {}), primaryLogoUrl: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Hero Banner Image URL</label>
                  <input
                    type="text"
                    value={sportsData.brandingMedia?.bannerImageUrl || sportsData.club.coverImageUrl || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      club: { ...sportsData.club, coverImageUrl: e.target.value },
                      brandingMedia: { ...(sportsData.brandingMedia || {}), bannerImageUrl: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Primary Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sportsData.club.primaryColor || '#0284c7'}
                      onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, primaryColor: e.target.value } })}
                      className="h-9 w-12 rounded border border-dv-line bg-white p-1"
                    />
                    <input
                      type="text"
                      value={sportsData.club.primaryColor || '#0284c7'}
                      onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, primaryColor: e.target.value } })}
                      className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Accent Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sportsData.club.accentColor || '#06b6d4'}
                      onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, accentColor: e.target.value } })}
                      className="h-9 w-12 rounded border border-dv-line bg-white p-1"
                    />
                    <input
                      type="text"
                      value={sportsData.club.accentColor || '#06b6d4'}
                      onChange={e => setSportsData({ ...sportsData, club: { ...sportsData.club, accentColor: e.target.value } })}
                      className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. TOURNAMENT STAGES & BRACKETS */}
            {activeDataset === 'stages' && (
              <div className="space-y-3">
                {(sportsData.tournamentStages || []).map((stage, idx) => (
                  <div key={stage.id || idx} className="rounded-xl border border-dv-line bg-white p-4">
                    <div className="flex items-center justify-between border-b border-dv-line pb-3 mb-3">
                      <div>
                        <span className="font-bold text-dv-ink text-sm">{stage.name}</span>
                        <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-800">
                          {(stage.stageType || "KNOCKOUT").toUpperCase()} (Order: {stage.stageOrder ?? stage.order ?? 1})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ type: 'stages', isNew: false, data: { ...stage } })}
                          className="p-1.5 text-dv-muted hover:text-cyan-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItemFromDataset('stages', stage.id)}
                          className="p-1.5 text-dv-muted hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {stage.matches.map((m, mIdx) => (
                        <div key={m.id || mIdx} className="rounded-lg border border-dv-line bg-white p-2.5">
                          <p className="text-[10px] text-cyan-700 font-semibold">{m.roundName || "Match"}</p>
                          <div className="flex justify-between items-center text-dv-ink mt-1 font-bold">
                            <span>{m.homeTeamName}</span>
                            <span>{m.homeScore ?? '-'}</span>
                          </div>
                          <div className="flex justify-between items-center text-dv-ink font-bold">
                            <span>{m.awayTeamName}</span>
                            <span>{m.awayScore ?? '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(sportsData.tournamentStages || []).length === 0 && (
                  <div className="py-10 text-center text-dv-muted text-xs">
                    No tournament knockout stages configured. Click "Add Record" to build elimination brackets.
                  </div>
                )}
              </div>
            )}

            {/* 11. ACADEMY PROGRAMMES */}
            {activeDataset === 'programmes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(sportsData.academyProgrammes || []).map((prog, idx) => (
                  <div key={prog.id || idx} className="rounded-xl border border-dv-line bg-white p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-dv-ink text-sm">{prog.title}</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-800">
                            {prog.ageGroup}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-800">
                            {prog.duration}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700">
                            {prog.feeStructure}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ type: 'programmes', isNew: false, data: { ...prog } })}
                          className="p-1.5 text-dv-muted hover:text-cyan-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItemFromDataset('programmes', prog.id)}
                          className="p-1.5 text-dv-muted hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-dv-muted line-clamp-2">{prog.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prog.curriculumHighlights?.map((h, i) => (
                        <span key={i} className="text-[10px] rounded bg-dv-ink/[0.03] px-2 py-0.5 text-dv-ink-2">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {(sportsData.academyProgrammes || []).length === 0 && (
                  <div className="col-span-2 py-10 text-center text-dv-muted text-xs">
                    No coaching programmes found. Click "Add Record" to create structured training modules.
                  </div>
                )}
              </div>
            )}

            {/* 12. TRAINING BATCHES */}
            {activeDataset === 'batches' && (
              <div className="space-y-3">
                {(sportsData.trainingBatches || []).map((b, idx) => (
                  <div key={b.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-dv-line bg-white p-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-dv-ink text-sm">{b.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-800">
                          {b.ageGroup}
                        </span>
                      </div>
                      <p className="text-xs text-dv-muted mt-1">
                        🗓️ {b.daysOfWeek.join(', ')} • ⏰ {b.startTime} - {b.endTime} • 🏟️ {b.venue}
                      </p>
                      <p className="text-[11px] text-cyan-700 mt-0.5">
                        Coach: {b.coachName} • Enrolled: {b.currentEnrollment}/{b.maxCapacity} athletes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'batches', isNew: false, data: { ...b } })}
                        className="p-1.5 text-dv-muted hover:text-cyan-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItemFromDataset('batches', b.id)}
                        className="p-1.5 text-dv-muted hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(sportsData.trainingBatches || []).length === 0 && (
                  <div className="py-10 text-center text-dv-muted text-xs">
                    No batch schedules added. Click "Add Record" to create weekday/weekend training slots.
                  </div>
                )}
              </div>
            )}

            {/* 18. SEO & SOCIAL META */}
            {activeDataset === 'seo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Search Engine Meta Title</label>
                  <input
                    type="text"
                    value={sportsData.seoInfo?.metaTitle || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      seoInfo: { ...(sportsData.seoInfo || {}), metaTitle: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-dv-ink-2 mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={sportsData.seoInfo?.canonicalUrl || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      seoInfo: { ...(sportsData.seoInfo || {}), canonicalUrl: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    placeholder="https://client-club.digiverse.site"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-dv-ink-2 mb-1">Meta Description (150-160 characters)</label>
                  <textarea
                    rows={3}
                    value={sportsData.seoInfo?.metaDescription || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      seoInfo: { ...(sportsData.seoInfo || {}), metaDescription: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-dv-ink-2 mb-1">Open Graph / Social Sharing Card Image URL</label>
                  <input
                    type="text"
                    value={sportsData.seoInfo?.ogImageUrl || ''}
                    onChange={e => setSportsData({
                      ...sportsData,
                      seoInfo: { ...(sportsData.seoInfo || {}), ogImageUrl: e.target.value }
                    })}
                    className="w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                  />
                </div>
              </div>
            )}

            {/* Standings Table */}
            {activeDataset === 'standings' && (
              sportsData.standings.length === 0 ? (
                <div className="py-10 text-center text-dv-muted">
                  <ListOrdered className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">No standings records found.</p>
                  <p className="text-xs text-dv-muted">Add competition table rows or calculate from completed results.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-dv-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-dv-muted text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Pos</th>
                        <th className="p-3">Team</th>
                        <th className="p-3">P</th>
                        <th className="p-3">W</th>
                        <th className="p-3">D</th>
                        <th className="p-3">L</th>
                        <th className="p-3">Pts</th>
                        <th className="p-3">Form</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dv-line">
                      {sportsData.standings.map((row, idx) => {
                        const teamName = sportsData.teams.find(t => t.id === row.teamId)?.name || row.teamId;
                        return (
                          <tr key={`${row.competitionId}-${row.teamId}-${idx}`} className="text-dv-ink-2 hover:bg-dv-ink/[0.03]">
                            <td className="p-3 font-bold text-dv-ink">{row.position}</td>
                            <td className="p-3 font-semibold text-dv-ink">{teamName}</td>
                            <td className="p-3">{row.played}</td>
                            <td className="p-3">{row.won}</td>
                            <td className="p-3">{row.drawn}</td>
                            <td className="p-3">{row.lost}</td>
                            <td className="p-3 font-bold text-cyan-700">{row.points}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                {row.form?.map((f, fi) => (
                                  <span key={fi} className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${f === 'W' ? 'bg-emerald-600 text-white' : f === 'D' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'}`}>
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = sportsData.standings.filter((_, i) => i !== idx);
                                  const next = { ...sportsData, standings: list };
                                  setSportsData(next);
                                  handleSaveAll(next);
                                }}
                                className="text-dv-muted hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Generic List for other datasets */}
            {activeDataset !== 'club' && activeDataset !== 'branding' && activeDataset !== 'stages' && activeDataset !== 'programmes' && activeDataset !== 'batches' && activeDataset !== 'seo' && activeDataset !== 'standings' && (
              <div className="space-y-3">
                {((sportsData[activeDataset as keyof SportsWebsiteData] as any[]) || []).map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between rounded-xl border border-dv-line bg-white p-4">
                    <div>
                      <span className="font-bold text-dv-ink text-sm">{item.name || item.title || item.fullName || item.opponentName || item.id}</span>
                      <p className="text-xs text-dv-muted">{item.role || item.sport || item.category || item.status || ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: activeDataset, isNew: false, data: { ...item } })}
                        className="p-1.5 text-dv-muted hover:text-cyan-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItemFromDataset(activeDataset, item.id)}
                        className="p-1.5 text-dv-muted hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {((sportsData[activeDataset as keyof SportsWebsiteData] as any[]) || []).length === 0 && (
                  <div className="py-10 text-center text-dv-muted text-xs">
                    No records found for {activeDefinition.label}. Click "Add Record" to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit / Add Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/[0.04] p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-dv-line bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-dv-line pb-3">
              <h4 className="text-sm font-bold text-dv-ink">
                {editingItem.isNew ? 'Create New' : 'Edit'} {editingItem.type.toUpperCase()} Record
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-dv-muted hover:text-dv-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* PLAYERS FORM */}
              {editingItem.type === 'players' && (
                <>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Full Name *</label>
                    <input
                      type="text"
                      value={editingItem.data.fullName || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, fullName: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Assigned Team</label>
                      <select
                        value={editingItem.data.teamId || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, teamId: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      >
                        <option value="">Select Team</option>
                        {sportsData.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Jersey Number</label>
                      <input
                        type="number"
                        value={editingItem.data.jerseyNumber ?? ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, jerseyNumber: Number(e.target.value) || undefined } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Position</label>
                      <input
                        type="text"
                        value={editingItem.data.position || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, position: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Status</label>
                      <select
                        value={editingItem.data.status || 'active'}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, status: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      >
                        <option value="active">Active</option>
                        <option value="injured">Injured</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Player Stats */}
                  <div className="p-3 rounded-xl border border-dv-line bg-white space-y-2">
                    <p className="font-bold text-cyan-700">Season Statistics</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-dv-muted">Apps</label>
                        <input
                          type="number"
                          value={editingItem.data.statistics?.appearances ?? 0}
                          onChange={e => setEditingItem({
                            ...editingItem,
                            data: {
                              ...editingItem.data,
                              statistics: { ...(editingItem.data.statistics || {}), appearances: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full rounded border border-dv-line bg-white p-1 text-dv-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-dv-muted">Goals</label>
                        <input
                          type="number"
                          value={editingItem.data.statistics?.goals ?? 0}
                          onChange={e => setEditingItem({
                            ...editingItem,
                            data: {
                              ...editingItem.data,
                              statistics: { ...(editingItem.data.statistics || {}), goals: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full rounded border border-dv-line bg-white p-1 text-dv-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-dv-muted">Assists</label>
                        <input
                          type="number"
                          value={editingItem.data.statistics?.assists ?? 0}
                          onChange={e => setEditingItem({
                            ...editingItem,
                            data: {
                              ...editingItem.data,
                              statistics: { ...(editingItem.data.statistics || {}), assists: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full rounded border border-dv-line bg-white p-1 text-dv-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-dv-muted">Clean Sheets</label>
                        <input
                          type="number"
                          value={editingItem.data.statistics?.cleanSheets ?? 0}
                          onChange={e => setEditingItem({
                            ...editingItem,
                            data: {
                              ...editingItem.data,
                              statistics: { ...(editingItem.data.statistics || {}), cleanSheets: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full rounded border border-dv-line bg-white p-1 text-dv-ink"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* PROGRAMMES FORM */}
              {editingItem.type === 'programmes' && (
                <>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Programme Title *</label>
                    <input
                      type="text"
                      value={editingItem.data.title || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      placeholder="e.g. Youth Development Camp"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Age Group</label>
                      <input
                        type="text"
                        value={editingItem.data.ageGroup || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, ageGroup: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                        placeholder="e.g. U-15 or 8-12 Yrs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Duration</label>
                      <input
                        type="text"
                        value={editingItem.data.duration || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, duration: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                        placeholder="e.g. 6 Months"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Fee Structure</label>
                    <input
                      type="text"
                      value={editingItem.data.feeStructure || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, feeStructure: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      placeholder="e.g. ₹3,500 / Month"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Description</label>
                    <textarea
                      rows={3}
                      value={editingItem.data.description || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                </>
              )}

              {/* BATCHES FORM */}
              {editingItem.type === 'batches' && (
                <>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Batch Name *</label>
                    <input
                      type="text"
                      value={editingItem.data.name || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      placeholder="e.g. Morning Academy Batch A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Age Group</label>
                      <input
                        type="text"
                        value={editingItem.data.ageGroup || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, ageGroup: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Venue</label>
                      <input
                        type="text"
                        value={editingItem.data.venue || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, venue: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-dv-ink-2">Start Time</label>
                      <input
                        type="text"
                        value={editingItem.data.startTime || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, startTime: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                        placeholder="06:30 AM"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-dv-ink-2">End Time</label>
                      <input
                        type="text"
                        value={editingItem.data.endTime || ''}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, endTime: e.target.value } })}
                        className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                        placeholder="08:00 AM"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Coach Name</label>
                    <input
                      type="text"
                      value={editingItem.data.coachName || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, coachName: e.target.value } })}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                </>
              )}

              {/* Fallback for other records */}
              {editingItem.type !== 'players' && editingItem.type !== 'programmes' && editingItem.type !== 'batches' && (
                <>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Name / Title *</label>
                    <input
                      type="text"
                      value={editingItem.data.name || editingItem.data.title || editingItem.data.fullName || editingItem.data.opponentName || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const key = editingItem.data.fullName !== undefined ? 'fullName' : editingItem.data.title !== undefined ? 'title' : editingItem.data.opponentName !== undefined ? 'opponentName' : 'name';
                        setEditingItem({ ...editingItem, data: { ...editingItem.data, [key]: val } });
                      }}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-dv-ink-2">Details / Description</label>
                    <textarea
                      rows={3}
                      value={editingItem.data.description || editingItem.data.summary || editingItem.data.biography || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const key = editingItem.data.biography !== undefined ? 'biography' : editingItem.data.summary !== undefined ? 'summary' : 'description';
                        setEditingItem({ ...editingItem, data: { ...editingItem.data, [key]: val } });
                      }}
                      className="mt-1 w-full rounded-lg border border-dv-line bg-white p-2 text-dv-ink"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dv-line">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg border border-dv-line px-4 py-2 text-xs font-semibold text-dv-muted hover:text-dv-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveItemToDataset(editingItem.type, editingItem.data, editingItem.isNew)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
