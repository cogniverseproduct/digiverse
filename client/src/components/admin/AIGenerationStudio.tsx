import React, { useState, useEffect } from 'react';
import { isNgoTemplateIdLite } from '../../templates/ngo/ids';
import { getNgoTemplateById } from '../../templates/ngo/registry';
import { getEventTemplateById } from '../../templates/event/registry';
import { isEventTemplateIdLite } from '../../templates/event/ids';
import { Button } from '../ui/dv/Button';
import { ClientProject, DriveMediaItem, YouTubeVideoItem } from '../../types/admin';
import { api } from '../../lib/api';
import { TenantWebsiteRenderer } from './TenantWebsiteRenderer';
import { ProjectAvatar, StatusChip } from '../workspace/ProjectBits';
import { ENGINE_META, engineForProject } from '../workspace/projectMeta';
import { 
  ArrowLeft, Sparkles, Sliders, CheckCircle2, Rocket, 
  Loader2, Palette, Layout, AlertCircle, RefreshCw, 
  HardDrive, Video, Monitor, Tablet, Smartphone, Trash2,
  Wand2, Layers, Type, History, Check, Plus,
  Share2, Copy, ExternalLink, Star, X,
  GitCompare, RotateCcw, Edit3, ShieldCheck,
  Trophy, Maximize2, Globe
} from 'lucide-react';
import { PublishingConsole } from './PublishingConsole';
import { SportsDataManager } from './SportsDataManager';
import { CulturalDataManager } from './CulturalDataManager';
import { EventDataManager } from './EventDataManager';
import { NGODataManager } from './NGODataManager';
import { getSportsTemplateById } from '../../templates/sports/registry';
import { getCulturalTemplateById } from '../../templates/cultural/registry';

interface AIGenerationStudioProps {
  project: ClientProject;
  onBack: () => void;
  onProjectUpdated: (project: ClientProject) => void;
  /** Sports projects only: opens the Sports template library for this project's category. */
  onChangeSportsTemplate?: (project: ClientProject) => void;
  /** Cultural projects only: opens the Cultural template library for this project's category. */
  onChangeCulturalTemplate?: (project: ClientProject) => void;
  /** Social & NGO projects built on a library template only: opens the NGO template library for this project's archetype. */
  onChangeNgoTemplate?: (project: ClientProject) => void;
  /** Event projects built on a library template only: opens the Event template library for this project's category. */
  onChangeEventTemplate?: (project: ClientProject) => void;
}

// @dv-keep-start — swatch colours represent generated-website themes
const THEME_OPTIONS = [
  { id: 'crimson-gold', label: 'Crimson & Gold', color: 'bg-red-600' },
  { id: 'sunset-amber', label: 'Sunset Amber', color: 'bg-amber-500' },
  { id: 'neon-cyan', label: 'Electric Cyan', color: 'bg-cyan-500' },
  { id: 'forest-emerald', label: 'Forest Emerald', color: 'bg-emerald-600' },
  { id: 'rose-ruby', label: 'Rose Ruby', color: 'bg-rose-600' },
  { id: 'royal-indigo', label: 'Royal Indigo', color: 'bg-indigo-600' },
  { id: 'charcoal-slate', label: 'Charcoal Slate', color: 'bg-slate-600' },
  { id: 'amethyst-purple', label: 'Amethyst Purple', color: 'bg-purple-600' },
  { id: 'ocean-blue', label: 'Ocean Blue', color: 'bg-blue-600' },
  { id: 'royal-violet', label: 'Royal Violet', color: 'bg-violet-600' }
];
// @dv-keep-end

const TYPOGRAPHY_OPTIONS = [
  { id: 'Georgia, serif', label: 'Heritage Serif', desc: 'Classical & Devotional' },
  { id: 'Inter, sans-serif', label: 'Athletic Modern', desc: 'Bold High-Contrast' },
  { id: 'Merriweather, serif', label: 'Academic Traditional', desc: 'Scholarly & Literary' },
  { id: 'Plus Jakarta Sans, sans-serif', label: 'Civic Modern', desc: 'Contemporary Clean' },
  { id: 'system-ui, sans-serif', label: 'Universal System', desc: 'Adaptive Clean UI' }
];

export const AIGenerationStudio: React.FC<AIGenerationStudioProps> = ({
  project,
  onBack,
  onProjectUpdated,
  onChangeSportsTemplate,
  onChangeCulturalTemplate,
  onChangeNgoTemplate,
  onChangeEventTemplate
}) => {
  const [generating, setGenerating] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Active Sidebar Mode: 'design' | 'sections' | 'variations' | 'media' | 'sports'
  const [sidebarTab, setSidebarTab] = useState<'design' | 'sections' | 'variations' | 'media' | 'sports'>('design');
  const [sportsModalOpen, setSportsModalOpen] = useState(false);
  const [culturalModalOpen, setCulturalModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [ngoModalOpen, setNgoModalOpen] = useState(false);

  // Viewport Device: 'desktop' | 'tablet' | 'mobile'
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Media state
  const [driveMedia, setDriveMedia] = useState<DriveMediaItem[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Design Variations state
  const [variations, setVariations] = useState<any[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [creatingVariation, setCreatingVariation] = useState(false);
  const [newVarPreset, setNewVarPreset] = useState<'split' | 'grid' | 'editorial'>('split');
  const [newVarTheme, setNewVarTheme] = useState('neon-cyan');
  const [newVarLabel, setNewVarLabel] = useState('');

  // AI Section Re-generation state
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Quick YouTube add
  const [newYtUrl, setNewYtUrl] = useState('');
  const [newYtTitle, setNewYtTitle] = useState('');
  const [newYtCat, setNewYtCat] = useState('Rituals & Festivities');
  const [addingVideo, setAddingVideo] = useState(false);

  // Client Preview & Feedback state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalTab, setPreviewModalTab] = useState<'tokens' | 'feedback'>('tokens');
  const [previewTokens, setPreviewTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenExpiryHours, setTokenExpiryHours] = useState(168); // 7 days
  const [tokenCopiedId, setTokenCopiedId] = useState<string | null>(null);

  // Version Comparison & Rollback state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareBaseId, setCompareBaseId] = useState<string>('');
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [compareDiff, setCompareDiff] = useState<any | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [editingNotesRevId, setEditingNotesRevId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  // Publishing Console (centralized Vercel publishing)
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);

  // Local Customizer State
  const [activeThemeAccent, setActiveThemeAccent] = useState(
    project.generatedWebsite?.themeAccent || 'crimson-gold'
  );
  const [activeLayoutPreset, setActiveLayoutPreset] = useState<'split' | 'grid' | 'editorial'>(
    project.generatedWebsite?.layoutPreset || 'editorial'
  );
  const [activeFontFamily, setActiveFontFamily] = useState(
    project.generatedWebsite?.fontFamily || 'Georgia, serif'
  );
  const [headlineEdit, setHeadlineEdit] = useState(
    project.generatedWebsite?.heroHeadline || ''
  );
  const [activeHeroImage, setActiveHeroImage] = useState(
    project.generatedWebsite?.heroImage || '/images/festivals/durga-hero.jpg'
  );

  // Sports library templates own their layout and typography (design preservation). The Studio only edits what
  // they actually read: brand colours and the hero line (`club.tagline`), stored in the project's sportsData.
  const sportsTemplateId: string | undefined = (project.generatedWebsite as any)?.selectedTemplate?.templateId
    || (project.requirements as any)?.selectedTemplate?.templateId;
  const isSportsLibraryProject = project.requirements.category === 'sports' && Boolean(sportsTemplateId && getSportsTemplateById(sportsTemplateId));
  const sportsClub = ((project.generatedWebsite as any)?.sportsData || (project.requirements as any)?.sportsData)?.club || {};
  // Cultural library designs work the same way: they own layout and type, and read the brand colours and the hero line
  // from the project's culturalData. A project saved before the library existed resolves to the design that replaced its old one.
  const isCulturalLibraryProject = (project.requirements.category === 'cultural' || project.requirements.category === 'puja_committee') && Boolean((project.generatedWebsite as any)?.culturalData || (project.requirements as any)?.culturalData);
  const culturalTemplateDef = isCulturalLibraryProject ? getCulturalTemplateById(sportsTemplateId) : undefined;
  const culturalDataNow = (project.generatedWebsite as any)?.culturalData || (project.requirements as any)?.culturalData;
  // Social & NGO projects built on a library template: the template owns its colours, layout and type, so the generic aesthetic controls do not apply.
  const isNgoLibraryProject = isNgoTemplateIdLite(project.requirements.selectedTemplate?.templateId);
  // Event projects built on a library template work the same way: the template owns colours, layout and type.
  const isEventLibraryProject = project.requirements.category === 'event' && isEventTemplateIdLite(project.requirements.selectedTemplate?.templateId);
  // Library designs that own all of their look (no Studio colour or hero-line controls).
  const isTemplateOnlyProject = isNgoLibraryProject || isEventLibraryProject;
  const isLibraryProject = isSportsLibraryProject || isCulturalLibraryProject || isNgoLibraryProject || isEventLibraryProject;
  const libraryTemplateName = isCulturalLibraryProject ? (culturalTemplateDef?.name || 'selected') : getSportsTemplateById(sportsTemplateId!)?.name;
  const isHexColour = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  const brandSource = isCulturalLibraryProject
    ? { primaryColor: culturalDataNow?.branding?.primaryColor, accentColor: culturalDataNow?.branding?.accentColor, tagline: culturalDataNow?.organization?.tagline }
    : sportsClub;
  const [brandPrimary, setBrandPrimary] = useState<string>(isHexColour(brandSource.primaryColor) ? brandSource.primaryColor : (isCulturalLibraryProject ? '#7A1F2B' : '#1F3A8A'));
  const [brandAccent, setBrandAccent] = useState<string>(isHexColour(brandSource.accentColor) ? brandSource.accentColor : (isCulturalLibraryProject ? '#B8893C' : '#F5C542'));
  const [brandTagline, setBrandTagline] = useState<string>(typeof brandSource.tagline === 'string' ? brandSource.tagline : '');

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const [driveRes, ytRes] = await Promise.all([
        api.getDriveMedia(project.id).catch(() => ({ items: [] })),
        api.getYouTubeVideos(project.id).catch(() => ({ videos: [] }))
      ]);
      setDriveMedia(driveRes.items || []);
      setYoutubeVideos(ytRes.videos || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setMediaLoading(false);
    }
  };

  const loadVariations = async () => {
    setLoadingVariations(true);
    try {
      const res = await api.getVariations(project.id);
      setVariations(res.variations || []);
    } catch (err) {
      console.error('Error loading variations:', err);
    } finally {
      setLoadingVariations(false);
    }
  };

  const loadPreviewTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await api.getProjectPreviewTokens(project.id);
      setPreviewTokens(res.tokens || []);
    } catch (err) {
      console.error('Error loading preview tokens:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await api.getProjectFeedback(project.id);
      setFeedbackList(res.feedback || []);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      await api.generatePreviewToken(project.id, tokenExpiryHours, project.activeRevisionId);
      await loadPreviewTokens();
    } catch (err: any) {
      alert(err.message || 'Error generating preview token');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this client preview link? The client will no longer be able to access it.')) return;
    try {
      await api.revokePreviewToken(project.id, tokenId);
      await loadPreviewTokens();
    } catch (err: any) {
      alert(err.message || 'Error revoking preview token');
    }
  };

  const handleResolveFeedback = async (feedbackId: string, currentStatus: boolean) => {
    try {
      await api.resolveFeedback(project.id, feedbackId, !currentStatus);
      await loadFeedback();
    } catch (err: any) {
      alert(err.message || 'Error updating feedback status');
    }
  };

  const handleCopyLink = (token: string, tokenId: string) => {
    const fullUrl = `${window.location.origin}/preview/${token}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setTokenCopiedId(tokenId);
      setTimeout(() => setTokenCopiedId(null), 2000);
    }).catch(() => {
      prompt('Copy preview URL:', fullUrl);
    });
  };

  const handleRollback = async (revisionId: string, label: string) => {
    if (!confirm(`Are you sure you want to rollback active design to '${label}'? Any unversioned live customizations will be replaced by this snapshot.`)) return;
    setRollingBackId(revisionId);
    try {
      const res = await api.rollbackRevision(project.id, revisionId);
      onProjectUpdated(res.project);
      if (res.project.generatedWebsite) {
        setActiveThemeAccent(res.project.generatedWebsite.themeAccent);
        setActiveLayoutPreset(res.project.generatedWebsite.layoutPreset);
        setActiveFontFamily(res.project.generatedWebsite.fontFamily);
        setHeadlineEdit(res.project.generatedWebsite.heroHeadline);
        if (res.project.generatedWebsite.heroImage) {
          setActiveHeroImage(res.project.generatedWebsite.heroImage);
        }
      }
      await loadVariations();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error rolling back revision');
    } finally {
      setRollingBackId(null);
    }
  };

  const handleOpenCompare = async (baseId?: string, targetId?: string) => {
    const base = baseId || project.approvedRevisionId || (variations[0]?.id);
    const target = targetId || project.activeRevisionId || (variations[variations.length - 1]?.id);
    if (!base || !target) {
      alert('Need at least two revisions to compare.');
      return;
    }
    setCompareBaseId(base);
    setCompareTargetId(target);
    setCompareModalOpen(true);
    await fetchComparison(base, target);
  };

  const fetchComparison = async (baseId: string, targetId: string) => {
    setLoadingDiff(true);
    try {
      const res = await api.compareRevisions(project.id, baseId, targetId);
      setCompareDiff(res.diff);
    } catch (err: any) {
      alert(err.message || 'Error comparing revisions');
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleSaveNotes = async (revisionId: string) => {
    setSavingNotes(true);
    try {
      await api.updateRevisionMetadata(project.id, revisionId, { changelogNotes: editingNotesText });
      await loadVariations();
      setEditingNotesRevId(null);
    } catch (err: any) {
      alert(err.message || 'Error updating revision notes');
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    loadMedia();
    loadVariations();
    loadPreviewTokens();
    loadFeedback();
  }, [project.id]);

  // Handle AI Generation
  const handleGenerate = async () => {
    setGenerating(true);
    setDeployFeedback(null);
    try {
      const updated = await api.generateWebsite(project.id);
      onProjectUpdated(updated);
      if (updated.generatedWebsite) {
        setActiveThemeAccent(updated.generatedWebsite.themeAccent);
        setActiveLayoutPreset(updated.generatedWebsite.layoutPreset);
        setActiveFontFamily(updated.generatedWebsite.fontFamily);
        setHeadlineEdit(updated.generatedWebsite.heroHeadline);
        if (updated.generatedWebsite.heroImage) {
          setActiveHeroImage(updated.generatedWebsite.heroImage);
        }
      }
      await loadMedia();
      await loadVariations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Handle AI-Assisted Section Re-generation
  const handleRegenerateSection = async (section: string) => {
    setRegeneratingSection(section);
    try {
      const res = await api.regenerateSection(project.id, section);
      onProjectUpdated(res.project);
      if (res.project.generatedWebsite) {
        if (section === 'hero') {
          setHeadlineEdit(res.project.generatedWebsite.heroHeadline);
        }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to regenerate ${section}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Handle Create Design Variation
  const handleCreateVariation = async () => {
    setCreatingVariation(true);
    try {
      await api.createVariation(project.id, {
        variationLabel: newVarLabel.trim() || undefined,
        layoutPreset: newVarPreset,
        themeAccent: newVarTheme
      });
      await loadVariations();
      setNewVarLabel('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create variation');
    } finally {
      setCreatingVariation(false);
    }
  };

  // Handle Activate Design Variation
  const handleActivateVariation = async (revId: string) => {
    try {
      const res = await api.activateVariation(project.id, revId);
      onProjectUpdated(res.project);
      if (res.project.generatedWebsite) {
        setActiveThemeAccent(res.project.generatedWebsite.themeAccent);
        setActiveLayoutPreset(res.project.generatedWebsite.layoutPreset);
        setActiveFontFamily(res.project.generatedWebsite.fontFamily);
        setHeadlineEdit(res.project.generatedWebsite.heroHeadline);
        if (res.project.generatedWebsite.heroImage) {
          setActiveHeroImage(res.project.generatedWebsite.heroImage);
        }
      }
      await loadVariations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to activate variation');
    }
  };

  // Sync Google Drive Source
  const handleSyncDrive = async () => {
    setMediaLoading(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncDriveMedia(project.id);
      setDriveMedia(res.items || []);
      // Say why nothing was imported (for example, no Google credentials) instead of only "failed".
      setSyncFeedback(res.error && !res.success ? `${res.message} ${res.error}` : res.message);
      const updated = await api.generateWebsite(project.id);
      onProjectUpdated(updated);
      if (updated.generatedWebsite?.heroImage) {
        setActiveHeroImage(updated.generatedWebsite.heroImage);
      }
    } catch (err: unknown) {
      setSyncFeedback(err instanceof Error ? err.message : 'Drive synchronization failed.');
    } finally {
      setMediaLoading(false);
    }
  };

  // Add YouTube Video
  const handleAddYouTube = async () => {
    if (!newYtUrl.trim()) return;
    setAddingVideo(true);
    try {
      await api.addYouTubeVideo(project.id, newYtUrl.trim(), newYtTitle.trim() || undefined, newYtCat);
      setNewYtUrl('');
      setNewYtTitle('');
      await loadMedia();
      const updated = await api.generateWebsite(project.id);
      onProjectUpdated(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add YouTube video');
    } finally {
      setAddingVideo(false);
    }
  };

  // Delete YouTube Video
  const handleDeleteYouTube = async (videoId: string) => {
    try {
      await api.deleteYouTubeVideo(videoId, project.id);
      await loadMedia();
      const updated = await api.generateWebsite(project.id);
      onProjectUpdated(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove video');
    }
  };

  // Update Media Item Assignment (e.g. set as Hero)
  const handleSetHeroPhoto = async (item: DriveMediaItem) => {
    const proxyUrl = `/api/media/drive/proxy/${item.driveFileId}`;
    setActiveHeroImage(proxyUrl);
    try {
      await api.updateDriveMedia(item.id, 'hero', true);
      const updated = await api.customizeWebsite(project.id, {
        heroImage: proxyUrl
      });
      onProjectUpdated(updated);
      await loadMedia();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update hero photo');
    }
  };

  // Handle Live Customizer Save
  const handleSaveCustomization = async () => {
    setCustomizing(true);
    setDeployFeedback(null);
    try {
      if (isCulturalLibraryProject) {
        const cd = (project.generatedWebsite as any)?.culturalData || (project.requirements as any)?.culturalData;
        if (!cd?.organization) throw new Error('This project has no cultural profile to update yet.');
        const updated = await api.customizeWebsite(project.id, {
          culturalData: { ...cd, organization: { ...cd.organization, tagline: brandTagline.trim() }, branding: { ...cd.branding, primaryColor: brandPrimary, accentColor: brandAccent } }
        } as any);
        onProjectUpdated(updated);
        return;
      }
      if (isSportsLibraryProject) {
        const sd = (project.generatedWebsite as any)?.sportsData || (project.requirements as any)?.sportsData;
        if (!sd?.club) throw new Error('This project has no sports profile to update yet.');
        const updated = await api.customizeWebsite(project.id, {
          sportsData: { ...sd, club: { ...sd.club, primaryColor: brandPrimary, accentColor: brandAccent, tagline: brandTagline.trim() } }
        });
        onProjectUpdated(updated);
        return;
      }
      const updated = await api.customizeWebsite(project.id, {
        themeAccent: activeThemeAccent,
        layoutPreset: activeLayoutPreset,
        fontFamily: activeFontFamily,
        heroHeadline: headlineEdit,
        heroImage: activeHeroImage
      });
      onProjectUpdated(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save customization');
    } finally {
      setCustomizing(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Studio header */}
      <section className="overflow-hidden rounded-[26px] border border-dv-line bg-white shadow-dv-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to projects"
              className="rounded-xl border border-dv-line p-2 text-dv-muted transition hover:border-dv-iris-200 hover:text-dv-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <ProjectAvatar project={project} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl font-bold tracking-[-0.02em] text-dv-ink">{project.requirements.organizationName}</h2>
                <StatusChip project={project} />
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-dv-muted">
                <Globe className={`h-3.5 w-3.5 shrink-0 ${project.status === 'deployed' ? 'text-emerald-500' : ''}`} />
                {project.status === 'deployed'
                  ? <span className="font-mono">{project.deploymentDetails?.deployedUrl || `/live/${project.deploymentDetails?.siteSlug || project.tenantSlug}`}</span>
                  : <span>Not published yet · {ENGINE_META[engineForProject(project)].short} engine</span>}
              </p>
            </div>
          </div>

          {project.generatedWebsite ? (
            <div className="flex flex-wrap items-center gap-2">
              {onChangeCulturalTemplate && isCulturalLibraryProject && (
                <Button variant="secondary" onClick={() => onChangeCulturalTemplate(project)}>
                  <Layers className="h-4 w-4" />
                  Change template
                </Button>
              )}
              {onChangeEventTemplate && isEventLibraryProject && (
                <Button variant="secondary" onClick={() => onChangeEventTemplate(project)}>
                  <Layers className="h-4 w-4" />
                  Change template
                </Button>
              )}
              {onChangeNgoTemplate && isNgoTemplateIdLite(project.requirements.selectedTemplate?.templateId) && (
                <Button variant="secondary" onClick={() => onChangeNgoTemplate(project)}>
                  <Layers className="h-4 w-4" />
                  Change template
                </Button>
              )}
              {onChangeSportsTemplate && project.requirements.category === 'sports' && (
                <Button variant="secondary" onClick={() => onChangeSportsTemplate(project)}>
                  <Layers className="h-4 w-4" />
                  Change template
                </Button>
              )}
              <Button
                onClick={() => setPublishingModalOpen(true)}
                className={project.status === 'deployed' ? 'bg-none bg-emerald-600 shadow-none hover:bg-emerald-700' : ''}
              >
                <Rocket className="h-4 w-4" />
                {project.status === 'deployed' ? 'Manage live site' : 'Publish'}
              </Button>
            </div>
          ) : null}
        </div>

        {project.generatedWebsite && (
          <div className="flex flex-wrap items-center gap-2 border-t border-dv-line bg-dv-canvas/60 px-5 py-3 sm:px-6">
            {/* Device preview */}
            <div className="flex rounded-xl border border-dv-line bg-white p-1" role="group" aria-label="Preview size">
              {([
                ['desktop', Monitor, 'Desktop'],
                ['tablet', Tablet, 'Tablet (768px)'],
                ['mobile', Smartphone, 'Mobile (375px)']
              ] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeviceViewport(key)}
                  aria-pressed={deviceViewport === key}
                  title={label}
                  aria-label={label}
                  className={`rounded-lg p-1.5 transition ${deviceViewport === key ? 'bg-dv-ink text-white' : 'text-dv-muted hover:text-dv-ink'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <span className="mx-1 hidden h-6 w-px bg-dv-line sm:block" />

            {/* Engine data editor */}
            {(() => {
              const key = engineForProject(project);
              const open =
                key === 'sports' ? () => setSportsModalOpen(true)
                : key === 'cultural' || project.requirements.culturalArchetype || project.generatedWebsite?.culturalData ? () => setCulturalModalOpen(true)
                : key === 'event' || project.requirements.eventCategory || project.generatedWebsite?.eventData ? () => setEventModalOpen(true)
                : key === 'ngo' || project.requirements.ngoArchetype || project.generatedWebsite?.ngoData ? () => setNgoModalOpen(true)
                : null;
              if (!open) return null;
              const meta = ENGINE_META[key === 'other' ? 'cultural' : key];
              const EngineIcon = meta.icon;
              return (
                <Button size="sm" variant="secondary" onClick={open}>
                  <EngineIcon className="h-3.5 w-3.5 text-dv-iris-600" />
                  {meta.short} data
                </Button>
              );
            })()}

            <Button size="sm" variant="secondary" disabled={generating} onClick={handleGenerate}>
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  loadPreviewTokens();
                  loadFeedback();
                  setPreviewModalOpen(true);
                }}
              >
                <Share2 className="h-3.5 w-3.5 text-dv-iris-600" />
                Client preview
                {feedbackList.filter((f) => !f.resolved).length > 0 && (
                  <span className="rounded-full bg-dv-coral px-1.5 text-[10px] font-bold text-dv-ink">
                    {feedbackList.filter((f) => !f.resolved).length}
                  </span>
                )}
              </Button>

            </div>
          </div>
        )}
      </section>

      {/* Deployment & Sync Feedback Alerts */}
      {deployFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            deployFeedback.isError
              ? 'bg-amber-50 border-amber-500/40 text-amber-700'
              : 'bg-emerald-50 border-emerald-500/40 text-emerald-700'
          }`}
        >
          {deployFeedback.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
          )}


          <div className="space-y-1">
            <div className="font-semibold">{deployFeedback.isError ? 'Deployment Note' : 'Deployment Status'}</div>
            <div className="leading-relaxed">{deployFeedback.message}</div>
          </div>
        </div>
      )}



      {syncFeedback && (
        <div className="p-3 rounded-xl text-xs bg-indigo-50 border border-indigo-500/30 text-dv-iris-700 flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button type="button" onClick={() => setSyncFeedback(null)} className="text-dv-muted hover:text-dv-ink text-xs">✕</button>
        </div>
      )}



      {/* Main Studio Viewport */}
      {!project.generatedWebsite ? (
        <div className="space-y-4 rounded-[26px] border border-dashed border-dv-iris-200 bg-dv-ink/[0.06] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-dv-iris-600/10 border border-dv-iris-400/20 text-dv-iris-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-dv-iris-600" />
          </div>
          <h3 className="text-xl font-bold text-dv-ink">Requirements collected</h3>
          <p className="text-xs text-dv-muted max-w-md mx-auto leading-relaxed">
            Everything the client provided is saved. Generate the first draft to start designing, previewing and sharing.
          </p>
          <div className="pt-2">
            <Button
              size="md"
              variant="primary"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate website
                </span>
              )}


            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Customization Studio Inspector Sidebar */}
          <div className="lg:col-span-4 space-y-5 rounded-[24px] border border-dv-line bg-white p-5 shadow-dv-card lg:sticky lg:top-24">
            {/* Tab Switcher */}
            <div className={`grid ${project.requirements.category === 'sports' ? 'grid-cols-5' : 'grid-cols-4'} gap-1 rounded-xl border border-dv-line bg-dv-canvas p-1 text-[11px]`}>
              <button
                type="button"
                onClick={() => setSidebarTab('design')}
                className={`py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sidebarTab === 'design' ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line' : 'text-dv-muted hover:text-dv-ink'
                }`}
                title="Theme, Colors & Layout"
              >
                <Sliders className="w-3 h-3" />
                <span>Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('sections')}
                className={`py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sidebarTab === 'sections' ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line' : 'text-dv-muted hover:text-dv-ink'
                }`}
                title="AI Section Re-generation"
              >
                <Wand2 className="w-3 h-3 text-dv-iris-600" />
                <span>Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('variations')}
                className={`py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sidebarTab === 'variations' ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line' : 'text-dv-muted hover:text-dv-ink'
                }`}
                title="Design Variations (V1, V2, V3)"
              >
                <History className="w-3 h-3 text-amber-600" />
                <span>Vars ({variations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('media')}
                className={`py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sidebarTab === 'media' ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line' : 'text-dv-muted hover:text-dv-ink'
                }`}
                title="Google Drive & YouTube Media"
              >
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>Media</span>
              </button>
              {project.requirements.category === 'sports' && (
                <button
                  type="button"
                  onClick={() => setSidebarTab('sports')}
                  className={`py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    sidebarTab === 'sports' ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line' : 'text-amber-600 hover:text-dv-ink'
                  }`}
                  title="Sports data — teams, squads, matches and standings"
                >
                  <Trophy className="w-3 h-3 text-amber-700" />
                  <span>Sports</span>
                </button>
              )}
            </div>

            {/* TAB 1: DESIGN, PALETTE & TYPOGRAPHY */}
            {sidebarTab === 'design' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-dv-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-dv-ink-2">
                    Aesthetic Controls
                  </span>
                  {!isTemplateOnlyProject && (
                  <button
                    type="button"
                    onClick={handleSaveCustomization}
                    disabled={customizing}
                    className="text-xs text-dv-iris-600 hover:text-dv-iris-700 font-semibold flex items-center gap-1"
                  >
                    {customizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Apply Changes
                  </button>
                  )}
                </div>

                {isNgoLibraryProject && (
                  <p className="rounded-lg border border-dv-line bg-white p-2.5 text-[11px] leading-relaxed text-dv-muted" data-testid="ngo-design-note">
                    Colours, layout and typography belong to the <strong className="text-dv-ink">{getNgoTemplateById(project.requirements.selectedTemplate?.templateId)?.name || 'selected'}</strong> design and stay as published by its author. Use “Change template” to pick a different design, and “Social & NGO data” to edit the organisation’s content.
                  </p>
                )}

                {isEventLibraryProject && (
                  <p className="rounded-lg border border-dv-line bg-white p-2.5 text-[11px] leading-relaxed text-dv-muted" data-testid="event-design-note">
                    Colours, layout, typography and motion belong to the <strong className="text-dv-ink">{getEventTemplateById(project.requirements.selectedTemplate?.templateId)?.name || 'selected'}</strong> design and stay as published by its author. Use “Change template” to pick a different design, and “Event data” to edit the event’s content.
                  </p>
                )}

                {isLibraryProject && !isTemplateOnlyProject && (
                  <div className="space-y-3">
                    <p className="rounded-lg border border-dv-line bg-white p-2.5 text-[11px] leading-relaxed text-dv-muted">
                      Layout and typography belong to the <strong className="text-dv-ink">{libraryTemplateName}</strong> template and stay as designed. Use “Change template” to pick a different design. The accent colour is used by every template; the primary colour only by designs with a brand-coloured surface. The hero line is shown in the template's hero.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1 text-xs font-semibold text-dv-muted">
                        <span>Primary colour</span>
                        <input type="color" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} aria-label="Primary brand colour" className="h-9 w-full cursor-pointer rounded-lg border border-dv-line bg-white p-1" />
                      </label>
                      <label className="space-y-1 text-xs font-semibold text-dv-muted">
                        <span>Accent colour</span>
                        <input type="color" value={brandAccent} onChange={(e) => setBrandAccent(e.target.value)} aria-label="Accent brand colour" className="h-9 w-full cursor-pointer rounded-lg border border-dv-line bg-white p-1" />
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-dv-muted" htmlFor="sports-hero-line">Hero line (tagline)</label>
                      <input
                        id="sports-hero-line"
                        type="text"
                        value={brandTagline}
                        maxLength={140}
                        onChange={(e) => setBrandTagline(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-dv-line text-xs text-dv-ink focus:outline-none focus:border-dv-iris-400"
                      />
                    </div>
                  </div>
                )}

                {!isLibraryProject && (<>
                {/* Theme Accent */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-dv-muted flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-dv-iris-600" />
                    <span>Color Palette Preset (10 Archetypes):</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveThemeAccent(t.id)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all ${
                          activeThemeAccent === t.id
                            ? 'bg-white border-dv-line text-dv-ink ring-1 ring-dv-line'
                            : 'bg-white border-dv-line text-dv-muted hover:text-dv-ink'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Preset */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-dv-muted flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-dv-iris-600" />
                    <span>Layout Preset:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-dv-line">
                    {[
                      { id: 'split', label: 'Split' },
                      { id: 'grid', label: 'Grid' },
                      { id: 'editorial', label: 'Editorial' }
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setActiveLayoutPreset(l.id as any)}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                          activeLayoutPreset === l.id
                            ? 'bg-white text-dv-ink shadow-sm ring-1 ring-dv-line'
                            : 'text-dv-muted hover:text-dv-ink'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Style */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-dv-muted flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-600" />
                    <span>Typography Pairings:</span>
                  </label>
                  <div className="space-y-1.5">
                    {TYPOGRAPHY_OPTIONS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setActiveFontFamily(font.id)}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                          activeFontFamily === font.id
                            ? 'bg-white border-indigo-500/60 text-dv-ink'
                            : 'bg-white border-dv-line text-dv-muted hover:text-dv-ink'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-dv-ink">{font.label}</div>
                          <div className="text-[10px] text-dv-muted">{font.desc}</div>
                        </div>
                        {activeFontFamily === font.id && <Check className="w-3.5 h-3.5 text-dv-iris-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero Headline Fine-Tuning */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dv-muted">Hero Headline Override</label>
                  <input
                    type="text"
                    value={headlineEdit}
                    onChange={(e) => setHeadlineEdit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-dv-line text-xs text-dv-ink focus:outline-none focus:border-dv-iris-400"
                  />
                </div>
                </>)}

                {!isTemplateOnlyProject && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveCustomization}
                  disabled={customizing}
                  className="w-full text-xs"
                >
                  {customizing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  <span>Save Aesthetic Settings</span>
                </Button>
                )}
              </div>
            )}

            {/* TAB 2: AI SECTION RE-GENERATION */}
            {sidebarTab === 'sections' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-dv-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-dv-ink-2">
                    AI Section Re-generation
                  </span>
                  <p className="text-[11px] text-dv-muted mt-0.5">
                    Select a section to synthesize alternative headlines, copy, or schedules with AI.
                  </p>
                </div>

                {/* Section Cards */}
                <div className="space-y-2.5">
                  {[
                    { id: 'hero', name: 'Hero Section', desc: 'Synthesize fresh high-impact headlines and descriptions' },
                    { id: 'about', name: 'About Mission', desc: 'Synthesize detailed background, objectives, and heritage story' },
                    { id: 'events', name: 'Events Calendar', desc: 'Synthesize upcoming dates, venues, and festival timings' },
                    { id: 'committee', name: 'Executive Leadership', desc: 'Synthesize council members, roles, and advisory board' },
                    { id: 'announcements', name: 'Official Bulletins', desc: 'Synthesize date-stamped notices and circulars' }
                  ].map((sec) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl border border-dv-line bg-white flex items-center justify-between gap-3 hover:border-dv-line transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-dv-ink flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-dv-iris-600" />
                          <span>{sec.name}</span>
                        </div>
                        <div className="text-[10px] text-dv-muted truncate">{sec.desc}</div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={regeneratingSection === sec.id}
                        onClick={() => handleRegenerateSection(sec.id)}
                        className="text-[11px] flex-shrink-0 cursor-pointer"
                      >
                        {regeneratingSection === sec.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 text-dv-iris-600 mr-1" />
                        )}


                        <span>Regen AI</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: DESIGN VARIATIONS (V1, V2, V3) */}
            {sidebarTab === 'variations' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-dv-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-dv-ink-2">
                    Design Variations & Revisions
                  </span>
                  <p className="text-[11px] text-dv-muted mt-0.5">
                    Generate and switch between alternative full-site design variants.
                  </p>
                </div>

                {/* Generate New Variant Form */}
                <div className="p-3.5 rounded-xl border border-dv-line bg-white space-y-3">
                  <div className="text-xs font-bold text-dv-ink flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-dv-iris-600" />
                    <span>Generate Alternative Variation</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Variant Label (e.g. V2 - Athletic Split)"
                    value={newVarLabel}
                    onChange={(e) => setNewVarLabel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-dv-line text-xs text-dv-ink placeholder-dv-muted"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-dv-muted block mb-1">Preset:</label>
                      <select
                        value={newVarPreset}
                        onChange={(e) => setNewVarPreset(e.target.value as any)}
                        className="w-full bg-white border border-dv-line rounded-lg p-1.5 text-xs text-dv-ink"
                      >
                        <option value="split">Split</option>
                        <option value="grid">Grid</option>
                        <option value="editorial">Editorial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-dv-muted block mb-1">Theme:</label>
                      <select
                        value={newVarTheme}
                        onChange={(e) => setNewVarTheme(e.target.value)}
                        className="w-full bg-white border border-dv-line rounded-lg p-1.5 text-xs text-dv-ink"
                      >
                        {THEME_OPTIONS.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    disabled={creatingVariation}
                    onClick={handleCreateVariation}
                    className="w-full text-xs"
                  >
                    {creatingVariation ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1 text-dv-iris-700" />}
                    <span>Generate & Save Variant</span>
                  </Button>
                </div>

                {/* Variations List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-dv-muted">
                      Saved Design Revisions ({variations.length}):
                    </div>
                    {variations.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompare()}
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Compare</span>
                      </button>
                    )}
                  </div>

                  {loadingVariations ? (
                    <div className="text-center py-4 text-xs text-dv-muted">Loading variations...</div>
                  ) : variations.length === 0 ? (
                    <div className="p-3 rounded-lg border border-dashed border-dv-line text-center text-xs text-dv-muted">
                      No additional design variations created yet. Generate one above to compare.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {variations.map((v) => {
                        const isActive = project.activeRevisionId === v.id;
                        const isApproved = project.approvedRevisionId === v.id || Boolean(v.isApproved);
                        const isEditingThisNotes = editingNotesRevId === v.id;

                        return (
                          <div
                            key={v.id}
                            className={`p-3 rounded-xl border transition-all space-y-2 text-xs ${
                              isActive
                                ? 'bg-indigo-50 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-white border-dv-line hover:border-dv-line'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-dv-ink text-xs">{v.variationLabel}</span>
                                  {isActive && (
                                    <span className="text-[10px] bg-indigo-50 text-dv-iris-700 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                                      Active Live
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                                      <ShieldCheck className="w-3 h-3" />
                                      Approved
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-dv-muted mt-0.5">
                                  Preset: {v.websiteData?.layoutPreset || 'editorial'} • Theme: {v.websiteData?.themeAccent || 'default'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                {variations.length >= 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCompare(project.activeRevisionId, v.id)}
                                    className="p-1 text-dv-muted hover:text-amber-700 transition-colors"
                                    title="Compare with Active"
                                  >
                                    <GitCompare className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isActive && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleActivateVariation(v.id)}
                                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-dv-ink-2 hover:text-dv-ink font-medium"
                                      title="Switch active design to this variation"
                                    >
                                      Activate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRollback(v.id, v.variationLabel)}
                                      disabled={rollingBackId === v.id}
                                      className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-dv-iris-700 hover:bg-indigo-50 font-medium flex items-center gap-1"
                                      title="Rollback / Restore active website to this version"
                                    >
                                      {rollingBackId === v.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-3 h-3" />
                                      )}
                                      <span>Rollback</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Changelog Notes */}
                            {isEditingThisNotes ? (
                              <div className="space-y-1.5 pt-1">
                                <textarea
                                  rows={2}
                                  value={editingNotesText}
                                  onChange={(e) => setEditingNotesText(e.target.value)}
                                  className="w-full bg-white border border-dv-line rounded-lg p-2 text-[11px] text-dv-ink resize-none"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNotesRevId(null)}
                                    className="px-2 py-0.5 text-[10px] text-dv-muted hover:text-dv-ink"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingNotes}
                                    onClick={() => handleSaveNotes(v.id)}
                                    className="px-2 py-0.5 text-[10px] rounded bg-indigo-600 text-white font-medium"
                                  >
                                    {savingNotes ? 'Saving...' : 'Save Notes'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] text-dv-muted bg-white px-2 py-1 rounded border border-dv-line">
                                <span className="truncate italic">
                                  {v.changelogNotes || 'No changelog notes recorded.'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNotesRevId(v.id);
                                    setEditingNotesText(v.changelogNotes || '');
                                  }}
                                  className="text-dv-muted hover:text-dv-ink-2 p-0.5 ml-1 flex-shrink-0"
                                  title="Edit Changelog Notes"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MEDIA & VIDEOS */}
            {sidebarTab === 'media' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Google Drive Media Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-dv-line">
                    <span className="text-xs font-bold text-dv-ink flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-dv-iris-600" />
                      <span>Google Drive {isCulturalLibraryProject ? 'Media' : 'Photos'} ({driveMedia.length})</span>
                    </span>
                    <button
                      type="button"
                      disabled={mediaLoading}
                      onClick={handleSyncDrive}
                      className="text-[11px] text-dv-iris-600 hover:text-dv-iris-700 flex items-center gap-1"
                    >
                      {mediaLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Sync Folder
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {driveMedia.map((item) => {
                      const proxyUrl = `/api/media/drive/proxy/${item.driveFileId}`;
                      const isCurrentHero = activeHeroImage === proxyUrl;
                      return (
                        <div
                          key={item.id}
                          className={`group relative rounded-lg border overflow-hidden p-1.5 bg-dv-ink/[0.04] ${
                            isCurrentHero ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-dv-line hover:border-dv-line'
                          }`}
                        >
                          {isCulturalLibraryProject ? (
                            // Cultural sites never show stand-in photographs: a video is a plain tile and a photo that cannot load is hidden.
                            item.mediaType === 'video' ? (
                              <div className="flex h-16 w-full items-center justify-center rounded bg-dv-ink/10 text-dv-muted"><Video className="h-5 w-5" aria-hidden /></div>
                            ) : (
                              <img
                                src={proxyUrl}
                                alt={item.name}
                                className="w-full h-16 object-cover rounded"
                                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                              />
                            )
                          ) : (
                            <img
                              src={proxyUrl}
                              alt={item.name}
                              className="w-full h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/festivals/durga-hero.jpg';
                              }}
                            />
                          )}
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="truncate max-w-[80px] text-dv-ink-2">{item.name}</span>
                            {isCurrentHero ? (
                              <span className="text-[9px] font-bold text-amber-600">Hero</span>
                            ) : isCulturalLibraryProject ? null : (
                              <button
                                type="button"
                                onClick={() => handleSetHeroPhoto(item)}
                                className="text-[9px] text-dv-iris-600 hover:underline"
                              >
                                Set Hero
                              </button>
                            )}


                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* YouTube Video Section */}
                <div className="space-y-3 pt-3 border-t border-dv-line">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-dv-ink flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-red-600" />
                      <span>YouTube Videos ({youtubeVideos.length})</span>
                    </span>
                  </div>

                  {/* Add Video Inline */}
                  <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-dv-line">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newYtUrl}
                      onChange={(e) => setNewYtUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-dv-line text-[11px] text-dv-ink font-mono"
                    />
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <input
                        type="text"
                        placeholder="Video Title (Optional)"
                        value={newYtTitle}
                        onChange={(e) => setNewYtTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-dv-line text-[11px] text-dv-ink"
                      />
                      <select
                        value={newYtCat}
                        onChange={(e) => setNewYtCat(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-white border border-dv-line text-[11px] text-dv-ink"
                      >
                        <option value="Rituals & Festivities">Rituals & Festivities</option>
                        <option value="Cultural Music & Dance">Cultural Music & Dance</option>
                        <option value="Match Day & Highlights">Match Day & Highlights</option>
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={addingVideo}
                        onClick={handleAddYouTube}
                        className="text-xs flex-shrink-0"
                      >
                        {addingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                        <span>Add</span>
                      </Button>
                    </div>
                  </div>

                  {/* Videos List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {youtubeVideos.map((v) => (
                      <div
                        key={v.id}
                        className="p-2 rounded-lg border border-dv-line bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <img
                            src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId}/default.jpg`}
                            alt={v.title}
                            className="w-10 h-7 object-cover rounded flex-shrink-0"
                          />
                          <div className="truncate">
                            <div className="font-semibold text-dv-ink truncate">{v.title}</div>
                            <div className="text-[10px] text-dv-muted truncate">{v.category}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteYouTube(v.id)}
                          className="text-dv-muted hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={generating}
                    onClick={handleGenerate}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Re-synthesize Website with Media</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 5: SPORTS DATA MANAGEMENT */}
            {sidebarTab === 'sports' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-dv-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    Sports Engine Studio
                  </span>
                  <button
                    type="button"
                    onClick={() => setSportsModalOpen(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                    title="Open Fullscreen Sports Data Manager"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Expand Studio
                  </button>
                </div>

                <div className="dv-engine-stage rounded-2xl bg-dv-canvas p-3 text-dv-ink">
                  <SportsDataManager
                    project={project}
                    onProjectUpdated={onProjectUpdated}
                  />
                </div>
              </div>
            )}


          </div>

          {/* Right Live Preview Canvas with Viewport Sizing */}
          <div className="lg:col-span-8 flex justify-center">
            <div
              className={`transition-all duration-300 w-full ${
                isLibraryProject
                  ? 'max-w-full' // library frames set their own device width inside a real iframe
                  : deviceViewport === 'tablet'
                  ? 'max-w-[768px]'
                  : deviceViewport === 'mobile'
                  ? 'max-w-[375px]'
                  : 'max-w-full'
              }`}
            >
              <TenantWebsiteRenderer
                previewViewport={isLibraryProject ? deviceViewport : undefined}
                requirements={project.requirements}
                website={{
                  ...project.generatedWebsite,
                  themeAccent: activeThemeAccent,
                  layoutPreset: activeLayoutPreset,
                  fontFamily: activeFontFamily,
                  heroHeadline: headlineEdit || project.generatedWebsite.heroHeadline,
                  // Library designs show only the client's own cover image; the Studio's festival default must never leak in.
                  heroImage: isLibraryProject ? project.generatedWebsite.heroImage : activeHeroImage
                }}
                inBrowserFrame={true}
                browserAddress={
                  project.status === 'deployed'
                    ? project.deploymentDetails?.deployedUrl ||
                      `${window.location.origin}/live/${project.deploymentDetails?.siteSlug || project.tenantSlug}`
                    : `${window.location.origin}/live/${project.tenantSlug}`
                }
                browserBadge={project.status === 'deployed' ? 'Live' : 'Not live yet'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Client preview & feedback */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/35 p-4 backdrop-blur-sm animate-dv-fade"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreviewModalOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Client preview" className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[26px] bg-white shadow-dv-float ring-1 ring-dv-line animate-dv-pop">
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dv-iris-50 text-dv-iris-600">
                  <Share2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-dv-ink">Client preview</h3>
                  <p className="mt-1 text-[13px] leading-6 text-dv-muted">
                    Share a private, read-only link. Clients can leave feedback and change requests from it.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setPreviewModalOpen(false)} aria-label="Close" className="rounded-xl p-2 text-dv-muted transition hover:bg-dv-canvas hover:text-dv-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 sm:px-7">
              <div className="inline-flex rounded-xl border border-dv-line bg-dv-canvas p-1" role="tablist">
                {([
                  ['tokens', 'Preview links', previewTokens.length, 0],
                  ['feedback', 'Feedback', feedbackList.length, feedbackList.filter((f) => !f.resolved).length]
                ] as const).map(([key, label, count, open]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={previewModalTab === key}
                    onClick={() => setPreviewModalTab(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      previewModalTab === key ? 'bg-white text-dv-ink shadow-sm' : 'text-dv-muted hover:text-dv-ink'
                    }`}
                  >
                    {label}
                    <span className="rounded-full bg-dv-ink/[0.06] px-1.5 text-[10px]">{count}</span>
                    {open > 0 && <span className="rounded-full bg-dv-coral px-1.5 text-[10px] font-bold text-white">{open} new</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-5 overflow-y-auto px-6 pb-6 sm:px-7">
              {previewModalTab === 'tokens' ? (
                <>
                  <section className="rounded-2xl border border-dv-line bg-dv-canvas/60 p-4">
                    <div className="text-[13px] font-semibold text-dv-ink">Create a new link</div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Link expiry">
                        <span className="mr-1 text-[12px] text-dv-muted">Expires in</span>
                        {([[24, '1 day'], [72, '3 days'], [168, '7 days'], [720, '30 days']] as const).map(([hours, label]) => (
                          <button
                            key={hours}
                            type="button"
                            role="radio"
                            aria-checked={tokenExpiryHours === hours}
                            onClick={() => setTokenExpiryHours(hours)}
                            className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                              tokenExpiryHours === hours ? 'border-dv-ink bg-dv-ink text-white' : 'border-dv-line bg-white text-dv-ink-2 hover:border-dv-iris-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <Button size="sm" disabled={generatingToken} onClick={handleGenerateToken}>
                        {generatingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Create link
                      </Button>
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">Links</h4>
                    {loadingTokens ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-dv-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading links…</div>
                    ) : previewTokens.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-dv-line px-6 py-10 text-center text-[13px] text-dv-muted">
                        No preview links yet. Create one above and send it to the client.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {previewTokens.map((t) => {
                          const isExpired = new Date(t.expiresAt).getTime() < Date.now();
                          const isRevoked = !t.isActive;
                          const state = isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active';
                          const tone = isRevoked ? 'bg-rose-50 text-rose-700 ring-rose-200' : isExpired ? 'bg-slate-50 text-slate-600 ring-slate-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
                          return (
                            <li key={t.id} className={`rounded-2xl border border-dv-line bg-white p-4 ${isRevoked || isExpired ? 'opacity-70' : ''}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}>{state}</span>
                                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-dv-ink-2">{window.location.origin}/preview/{t.token}</span>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[12px] text-dv-muted">
                                  {t.viewCount || 0} view{(t.viewCount || 0) === 1 ? '' : 's'} · {isExpired ? 'expired' : 'expires'}{' '}
                                  {new Date(t.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm" variant="secondary" onClick={() => handleCopyLink(t.token, t.id)}>
                                    {tokenCopiedId === t.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    {tokenCopiedId === t.id ? 'Copied' : 'Copy'}
                                  </Button>
                                  <a
                                    href={`/preview/${t.token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Open preview in a new tab"
                                    className="rounded-xl border border-dv-line p-2 text-dv-muted transition hover:border-dv-iris-200 hover:text-dv-ink"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                  {!isRevoked && (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeToken(t.id)}
                                      className="rounded-xl px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">Feedback from the client</h4>
                    <button type="button" onClick={loadFeedback} className="inline-flex items-center gap-1 text-[12px] font-semibold text-dv-iris-600 hover:text-dv-iris-700">
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  {loadingFeedback ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-dv-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading feedback…</div>
                  ) : feedbackList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-dv-line px-6 py-10 text-center text-[13px] text-dv-muted">
                      No feedback yet. Comments the client leaves on a preview link appear here.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {[...feedbackList].sort((a, b) => Number(a.resolved) - Number(b.resolved)).map((f) => (
                        <li key={f.id} className={`rounded-2xl border bg-white p-4 ${f.resolved ? 'border-dv-line opacity-60' : 'border-dv-iris-200 shadow-dv-card'}`}>
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl dv-prism-fill font-display text-[12px] font-bold text-white">
                              {String(f.authorName || 'Client').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-dv-ink">{f.authorName || 'Client'}</span>
                                {f.authorRole && <span className="text-[12px] text-dv-muted">{f.authorRole}</span>}
                                <span className="rounded-full bg-dv-iris-50 px-2 py-0.5 text-[11px] font-semibold text-dv-iris-700">{f.section || 'General'}</span>
                                {f.rating ? (
                                  <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-amber-600">
                                    <Star className="h-3.5 w-3.5 fill-current" /> {f.rating}/5
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-[13px] leading-6 text-dv-ink-2">{f.message}</p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] text-dv-muted">
                                  {f.authorEmail ? `${f.authorEmail} · ` : ''}{new Date(f.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResolveFeedback(f.id, f.resolved)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${
                                    f.resolved ? 'text-dv-muted hover:bg-dv-canvas' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {f.resolved ? 'Resolved · undo' : 'Mark resolved'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version comparison */}
      {compareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/35 p-4 backdrop-blur-sm animate-dv-fade"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCompareModalOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Compare versions" className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[26px] bg-white shadow-dv-float ring-1 ring-dv-line animate-dv-pop">
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <GitCompare className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-dv-ink">Compare versions</h3>
                  <p className="mt-1 text-[13px] leading-6 text-dv-muted">See what changed between two design versions before switching or rolling back.</p>
                </div>
              </div>
              <button type="button" onClick={() => setCompareModalOpen(false)} aria-label="Close" className="rounded-xl p-2 text-dv-muted transition hover:bg-dv-canvas hover:text-dv-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 items-end gap-3 border-y border-dv-line bg-dv-canvas/60 px-6 py-4 sm:grid-cols-[1fr_auto_1fr] sm:px-7">
              {([
                ['From', compareBaseId, (value: string) => { setCompareBaseId(value); if (compareTargetId) fetchComparison(value, compareTargetId); }],
                null,
                ['To', compareTargetId, (value: string) => { setCompareTargetId(value); if (compareBaseId) fetchComparison(compareBaseId, value); }]
              ] as const).map((item, index) =>
                item === null ? (
                  <span key="arrow" aria-hidden className="hidden pb-2.5 text-dv-muted sm:block">→</span>
                ) : (
                  <label key={index} className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-dv-ink-2">{item[0]}</span>
                    <select
                      value={item[1]}
                      onChange={(e) => item[2](e.target.value)}
                      className="w-full rounded-xl border border-dv-line bg-white px-3 py-2.5 text-[13px] text-dv-ink focus:border-dv-iris-400 focus:outline-none focus:ring-4 focus:ring-dv-iris-100"
                    >
                      {variations.map((v) => (
                        <option key={v.id} value={v.id}>
                          V{v.versionNumber} · {v.variationLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7">
              {loadingDiff ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-[13px] text-dv-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-dv-iris-500" />
                  Comparing versions…
                </div>
              ) : !compareDiff ? (
                <div className="py-12 text-center text-[13px] text-dv-muted">Choose two versions to compare.</div>
              ) : (
                <>
                  <section>
                    <h4 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-dv-muted">What changed</h4>
                    {compareDiff.changesSummary.length === 0 ? (
                      <p className="text-[13px] text-dv-muted">These versions look the same.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {compareDiff.changesSummary.map((s: string, idx: number) => (
                          <li key={idx} className="flex gap-2 text-[13px] text-dv-ink-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-dv-line">
                    <div className="grid grid-cols-[1.1fr_1fr_1fr_auto] gap-3 border-b border-dv-line bg-dv-canvas/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-dv-muted">
                      <span>Setting</span>
                      <span className="truncate">From</span>
                      <span className="truncate">To</span>
                      <span className="w-20 text-right">Status</span>
                    </div>
                    {([
                      ['Colour palette', compareDiff.theme.themeAccent.base, compareDiff.theme.themeAccent.target, compareDiff.theme.themeAccent.changed],
                      ['Layout', compareDiff.layout.layoutPreset.base, compareDiff.layout.layoutPreset.target, compareDiff.layout.layoutPreset.changed],
                      ['Fonts', compareDiff.typography.fontFamily.base, compareDiff.typography.fontFamily.target, compareDiff.typography.fontFamily.changed],
                      ['Events', `${compareDiff.counts.events.base}`, `${compareDiff.counts.events.target}`, compareDiff.counts.events.diff !== 0],
                      ['Committee members', `${compareDiff.counts.committee.base}`, `${compareDiff.counts.committee.target}`, compareDiff.counts.committee.diff !== 0]
                    ] as const).map(([label, from, to, changed]) => (
                      <div key={label} className="grid grid-cols-[1.1fr_1fr_1fr_auto] items-center gap-3 border-b border-dv-line px-4 py-3 text-[13px] last:border-b-0">
                        <span className="font-semibold text-dv-ink">{label}</span>
                        <span className="truncate text-dv-muted" title={String(from)}>{from || '—'}</span>
                        <span className="truncate text-dv-ink-2" title={String(to)}>{to || '—'}</span>
                        <span className="w-20 text-right">
                          {changed
                            ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">Changed</span>
                            : <span className="text-[12px] text-dv-muted">Same</span>}
                        </span>
                      </div>
                    ))}
                  </section>

                  <section className="grid gap-3 sm:grid-cols-2">
                    {([
                      ['From', compareDiff.metadata.base.variationLabel, compareDiff.hero.headline.base],
                      ['To', compareDiff.metadata.target.variationLabel, compareDiff.hero.headline.target]
                    ] as const).map(([side, label, headline]) => (
                      <div key={side} className="rounded-2xl border border-dv-line p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dv-muted">{side} · {label}</div>
                        <p className="mt-2 font-display text-[15px] font-semibold leading-snug text-dv-ink">{headline || 'No headline'}</p>
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dv-line px-6 py-4 sm:px-7">
              <span className="text-[12px] text-dv-muted">
                {compareDiff?.metadata.target.isApproved ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> The “To” version was approved earlier
                  </span>
                ) : (
                  'Compare the two versions side by side'
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCompareModalOpen(false)}>Close</Button>
                {compareTargetId && compareTargetId !== project.activeRevisionId && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCompareModalOpen(false);
                      handleRollback(compareTargetId, compareDiff?.metadata.target.variationLabel || 'Target Version');
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Make “To” the active design
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publishing Console */}
      <PublishingConsole
        project={project}
        isOpen={publishingModalOpen}
        onClose={() => setPublishingModalOpen(false)}
        onProjectUpdated={onProjectUpdated}
      />

      {/* Sports Engine Data Studio Fullscreen Modal */}
      {sportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="dv-engine-stage bg-dv-canvas border border-amber-500/40 rounded-2xl max-w-6xl w-full p-6 text-dv-ink shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <SportsDataManager
              project={project}
              onProjectUpdated={onProjectUpdated}
              onClose={() => setSportsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Cultural Engine Data Studio Fullscreen Modal */}
      {culturalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="dv-engine-stage bg-dv-canvas border border-amber-500/40 rounded-2xl max-w-6xl w-full p-6 text-dv-ink shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <CulturalDataManager
              project={project}
              onProjectUpdated={onProjectUpdated}
              onClose={() => setCulturalModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Event Engine Data Studio Fullscreen Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="dv-engine-stage bg-dv-canvas border border-purple-500/40 rounded-2xl max-w-6xl w-full p-6 text-dv-ink shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <EventDataManager
              project={project}
              onProjectUpdated={onProjectUpdated}
              onClose={() => setEventModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Social & NGO Engine Data Studio Fullscreen Modal */}
      {ngoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="dv-engine-stage bg-dv-canvas border border-emerald-500/40 rounded-2xl max-w-6xl w-full p-6 text-dv-ink shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <NGODataManager
              project={project}
              onProjectUpdated={onProjectUpdated}
              onClose={() => setNgoModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
