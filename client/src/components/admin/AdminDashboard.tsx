import React, { useState, useEffect } from 'react';
import { Button } from '../ui/dv/Button';
import { ClientProject, ClientRequirements, User } from '../../types/admin';
import { api, setStoredToken } from '../../lib/api';
import { RequirementCollectionWizard } from './RequirementCollectionWizard';
import { AIGenerationStudio } from './AIGenerationStudio';
import { WebsiteEngineSelector } from './WebsiteEngineSelector';
import { SportsTypeSelector, SportsArchetypeChoice } from './SportsTypeSelector';
import { SportsIntakeWizard } from './SportsIntakeWizard';
import { SportsTemplateLibrary } from './templates/SportsTemplateLibrary';
import { getSportsTemplateById } from '../../templates/sports/registry';
import { CulturalTypeSelector, CulturalArchetypeChoice } from './CulturalTypeSelector';
import { CulturalIntakeWizard } from './CulturalIntakeWizard';
import { CulturalTemplateLibrary } from './templates/CulturalTemplateLibrary';
import { getCulturalTemplateById } from '../../templates/cultural/registry';
import { EventTypeSelector, EventCategoryChoice } from './EventTypeSelector';
import { EventIntakeWizard } from './EventIntakeWizard';
import { EventTemplateLibrary } from './templates/EventTemplateLibrary';
import { getEventTemplateById } from '../../templates/event/registry';
import type { EventCategoryId } from '../../templates/event/ids';
import { NGOTypeSelector, NGOArchetypeChoice } from './NGOTypeSelector';
import { NgoIntakeWizard } from './NgoIntakeWizard';
import { NgoTemplateLibrary } from './templates/NgoTemplateLibrary';
import { getNgoTemplateById } from '../../templates/ngo/registry';
import type { NgoArchetypeId } from '../../templates/ngo/ids';
import { PortfolioEngineHome, type PortfolioHomeTab } from './PortfolioEngineHome';
import { PortfolioRequirementWizard } from './PortfolioRequirementWizard';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import type { SelectedTemplateMetadata } from '../../types/admin';
import type { PortfolioArchetype } from '../../types/portfolio';
import {
  Plus, Globe, Sparkles, RefreshCw, AlertCircle, X, ShieldAlert, KeyRound,
  CheckCircle2, Loader2, LayoutDashboard, FolderKanban, UserRound, LogOut
} from 'lucide-react';
import { WorkspaceShell, type WorkspaceNavSection } from '../workspace/WorkspaceShell';
import { AdminOverview } from '../workspace/AdminOverview';
import { ProjectsView } from '../workspace/ProjectsView';
import { PublishedSitesPanel } from './PublishedSitesPanel';
import type { PipelineStage } from '../workspace/projectMeta';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onExitToPublic: () => void;
  onExitImpersonation?: (superAdminUser: User) => void;
}

/**
 * Frame for website-generation engine workspaces. The engines keep their own
 * (dark) design systems untouched; the main product only provides this frame.
 */
const EngineStage: React.FC<{ engine: string; children: React.ReactNode }> = ({ engine, children }) => (
  <section className="rounded-[28px] border border-dv-line bg-white shadow-dv-card animate-dv-fade">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[28px] border-b border-dv-line bg-gradient-to-r from-white via-white to-dv-iris-50/70 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-dv-ink text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-semibold text-dv-ink">{engine}</span>
      </div>
      <span className="rounded-full border border-dv-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-dv-muted">
        Engine workspace
      </span>
    </div>
    <div className="dv-engine-stage rounded-b-[27px] bg-dv-canvas/50 p-3 text-dv-ink sm:p-6">{children}</div>
  </section>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onLogout,
  onExitToPublic,
  onExitImpersonation
}) => {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Impersonation state
  const isImpersonated = user.isImpersonated || (typeof window !== 'undefined' && !!localStorage.getItem('superadmin_backup_token'));
  const [exitingImpersonation, setExitingImpersonation] = useState(false);

  // Password reset request modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordReason, setPasswordReason] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleExitImpersonation = async () => {
    setExitingImpersonation(true);
    try {
      await api.exitImpersonation();
    } catch (err) {
      console.error('Exit impersonation API note:', err);
    }
    const backupToken = localStorage.getItem('superadmin_backup_token');
    localStorage.removeItem('superadmin_backup_token');
    if (backupToken) {
      setStoredToken(backupToken);
    }
    const me = await api.getCurrentUser();
    if (onExitImpersonation && me) {
      onExitImpersonation(me);
    } else {
      window.location.reload();
    }
    setExitingImpersonation(false);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await api.requestAdminPasswordReset(user.username || user.email, passwordReason.trim() || undefined);
      setPasswordSuccess(res.message);
      setPasswordReason('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to submit password reset request.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // View state: 'list' | 'engine_select' | 'sports_type_select' | 'sports_template_select' | 'sports_wizard' | 'cultural_type_select' | 'cultural_template_select' | 'cultural_wizard' | 'event_type_select' | 'event_template_select' | 'event_wizard' | 'ngo_type_select' | 'ngo_template_select' | 'ngo_wizard' | 'portfolio_type_select' | 'portfolio_wizard' | 'wizard' | 'studio'
  const [projectStageFilter, setProjectStageFilter] = useState<PipelineStage | 'all'>('all');
  const [activeView, setActiveView] = useState<'list' | 'projects' | 'sites' | 'engine_select' | 'sports_type_select' | 'sports_template_select' | 'sports_wizard' | 'cultural_type_select' | 'cultural_template_select' | 'cultural_wizard' | 'event_type_select' | 'event_template_select' | 'event_wizard' | 'ngo_type_select' | 'ngo_template_select' | 'ngo_wizard' | 'portfolio_type_select' | 'portfolio_wizard' | 'wizard' | 'studio'>('list');
  const [selectedSportsArchetype, setSelectedSportsArchetype] = useState<SportsArchetypeChoice>('sports_club');
  // Template chosen in the Sports library for a new project, and the project whose template is being changed (null for a new one).
  const [sportsTemplate, setSportsTemplate] = useState<SelectedTemplateMetadata | undefined>(undefined);
  const [sportsChangeProjectId, setSportsChangeProjectId] = useState<string | null>(null);
  const [selectedCulturalArchetype, setSelectedCulturalArchetype] = useState<CulturalArchetypeChoice>('cultural_society');
  // Template chosen in the Cultural library for a new project, and the project whose template is being changed (null for a new one).
  const [culturalTemplate, setCulturalTemplate] = useState<SelectedTemplateMetadata | undefined>(undefined);
  const [culturalChangeProjectId, setCulturalChangeProjectId] = useState<string | null>(null);
  const [selectedEventCategory, setSelectedEventCategory] = useState<EventCategoryChoice>('conference_seminar');
  // Template chosen in the Event library for a new project, and the project whose template is being changed (null for a new one).
  const [eventTemplate, setEventTemplate] = useState<SelectedTemplateMetadata | undefined>(undefined);
  const [eventChangeProjectId, setEventChangeProjectId] = useState<string | null>(null);
  const [selectedNGOArchetype, setSelectedNGOArchetype] = useState<NGOArchetypeChoice>('grassroots_ngo');
  // Template chosen in the Social & NGO library for a new project, and the project whose template is being changed (null for a new one).
  const [ngoTemplate, setNgoTemplate] = useState<SelectedTemplateMetadata | undefined>(undefined);
  const [ngoChangeProjectId, setNgoChangeProjectId] = useState<string | null>(null);
  const [selectedPortfolioArchetype, setSelectedPortfolioArchetype] = useState<PortfolioArchetype>('developer');
  const [portfolioHomeTab, setPortfolioHomeTab] = useState<PortfolioHomeTab>('professions');
  // Bumped each time the Admin enters the engine from the sidebar or Overview, so the landing page always opens on the intended tab.
  const [portfolioHomeNonce, setPortfolioHomeNonce] = useState(0);
  const openPortfolioEngine = (tab: PortfolioHomeTab) => { setPortfolioHomeTab(tab); setPortfolioHomeNonce((n) => n + 1); setActiveView('portfolio_type_select'); };
  const [portfolioTemplatePreselected, setPortfolioTemplatePreselected] = useState<SelectedTemplateMetadata | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load client projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (reqs: ClientRequirements, options?: { rethrow?: boolean }) => {
    try {
      const created = await api.createProject(reqs);
      // Automatically trigger generation
      const generated = await api.generateWebsite(created.id);
      // Put the new project in the list immediately: the Studio looks it up by id, and a slow or failed
      // list reload must not leave it opening on nothing.
      setProjects((prev) => [generated, ...prev.filter((p) => p.id !== generated.id)]);
      setSelectedProjectId(generated.id);
      setActiveView('studio');
      void loadProjects();
    } catch (err: unknown) {
      // The portfolio wizard shows the error itself and keeps the Admin's draft; the other wizards alert.
      if (options?.rethrow) throw err;
      alert(err instanceof Error ? err.message : 'Project creation failed');
    }
  };

  const handleDeleteProject = async (p: ClientProject) => {
    if (!window.confirm(`Are you sure you want to delete '${p.requirements.organizationName}'? This will permanently remove all associated assets and generated websites.`)) {
      return;
    }
    try {
      await api.deleteProject(p.id);
      await loadProjects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveView('studio');
  };

  const openProjects = (stage?: PipelineStage) => {
    setProjectStageFilter(stage || 'all');
    setActiveView('projects');
  };

  const startEngine = (engine: 'sports' | 'cultural' | 'event' | 'ngo' | 'portfolio') => {
    const views = {
      sports: 'sports_type_select',
      cultural: 'cultural_type_select',
      event: 'event_type_select',
      ngo: 'ngo_type_select',
      portfolio: 'portfolio_type_select'
    } as const;
    setActiveView(views[engine]);
  };

  const isCreating = activeView === 'engine_select' || activeView.endsWith('_type_select') || activeView.endsWith('_wizard') || activeView === 'wizard';
  const isPortfolioFlow = activeView.startsWith('portfolio');

  const navSections: WorkspaceNavSection[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, active: activeView === 'list', onSelect: () => setActiveView('list') },
        {
          id: 'projects',
          label: 'Projects',
          icon: FolderKanban,
          count: projects.length,
          active: activeView === 'projects' || activeView === 'studio',
          onSelect: () => openProjects()
        },
        { id: 'sites', label: 'Published sites', icon: Globe, active: activeView === 'sites', onSelect: () => setActiveView('sites') }
      ]
    },
    {
      label: 'Create',
      items: [
        { id: 'new-website', label: 'New website', icon: Plus, active: isCreating && !isPortfolioFlow, onSelect: () => setActiveView('engine_select') },
        { id: 'new-portfolio', label: 'New portfolio', icon: UserRound, active: isPortfolioFlow, onSelect: () => openPortfolioEngine('professions') }
      ]
    }
  ];

  const accountItems = [
    {
      id: 'password',
      label: 'Request password change',
      icon: KeyRound,
      onSelect: () => {
        setPasswordModalOpen(true);
        setPasswordError(null);
        setPasswordSuccess(null);
      }
    }
  ];

  const pageTitle =
    activeView === 'list' ? 'Overview'
    : activeView === 'projects' ? 'Projects'
    : activeView === 'sites' ? 'Published sites'
    : activeView === 'studio' ? (selectedProject?.requirements.organizationName || 'Studio')
    : isPortfolioFlow ? 'New portfolio'
    : 'New website';

  const impersonationBanner = isImpersonated ? (
    <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-dv-iris-200 bg-gradient-to-r from-dv-iris-50 via-white to-dv-iris-50 px-4 py-2.5 text-[12px] text-dv-iris-800 sm:px-6 lg:px-10">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-dv-iris-100 text-dv-iris-700">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <span>
          <strong className="font-semibold text-dv-ink">Viewing as {user.name}</strong>{' '}
          (@{user.username || user.email}). Super Admin controls are disabled in this view.
        </span>
      </div>
      <Button size="sm" onClick={handleExitImpersonation} disabled={exitingImpersonation}>
        {exitingImpersonation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Exit Admin view
      </Button>
    </div>
  ) : null;

  return (
    <>
      <WorkspaceShell
        roleLabel="Admin workspace"
        userName={user.name}
        userHandle={user.username || user.email}
        sections={navSections}
        accountItems={accountItems}
        title={pageTitle}
        hideHeader={activeView === 'studio' || isCreating || activeView === 'list'}
        subtitle={
          activeView === 'projects'
            ? 'Every client website and portfolio in your workspace. Filter by stage or engine, then open the studio.'
            : activeView === 'sites'
              ? 'Published client websites, each with its own address, hosting status and search settings.'
              : undefined
        }
        width={activeView === 'studio' || isCreating ? 'wide' : 'default'}
        preferCompactSidebar={activeView === 'studio'}
        banner={impersonationBanner}
        onExitToPublic={onExitToPublic}
        onLogout={onLogout}
        actions={
          <>
            {(activeView === 'list' || activeView === 'projects') && (
              <button
                type="button"
                onClick={loadProjects}
                aria-label="Refresh projects"
                className="rounded-xl border border-dv-line bg-white p-2 text-dv-muted shadow-sm transition hover:text-dv-ink"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {!isCreating && activeView !== 'studio' && (
              <Button size="sm" onClick={() => setActiveView('engine_select')}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New website</span>
              </Button>
            )}
          </>
        }
      >
        <ErrorBoundary area="This screen" resetKey={activeView} onBack={() => setActiveView('list')}>
        {error && activeView === 'list' && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* VIEW: ENGINE SELECTOR */}
        {activeView === 'engine_select' && (
          <WebsiteEngineSelector
            onSelectEngine={(engine) => {
              if (engine === 'cultural') {
                setActiveView('cultural_type_select');
              } else if (engine === 'event') {
                setActiveView('event_type_select');
              } else if (engine === 'ngo') {
                setActiveView('ngo_type_select');
              } else if (engine === 'portfolio') {
                openPortfolioEngine('professions');
              } else {
                setActiveView('sports_type_select');
              }
            }}
            onCancel={() => setActiveView('list')}
          />
        )}

        {/* VIEW: PORTFOLIO TYPE SELECTOR */}
        {activeView === 'portfolio_type_select' && (
          <EngineStage engine="Portfolio Engine">
            <PortfolioEngineHome
              key={`${portfolioHomeTab}:${portfolioHomeNonce}`}
              projects={projects}
              initialTab={portfolioHomeTab}
              onBack={() => setActiveView('engine_select')}
              onStart={(arch, tmpl) => {
                setSelectedPortfolioArchetype(arch);
                setPortfolioTemplatePreselected(tmpl);
                setActiveView('portfolio_wizard');
              }}
              onApplyToProject={async (tmpl, projectId) => {
                try {
                  await api.updateProject(projectId, { selectedTemplate: tmpl });
                  const regenerated = await api.generateWebsite(projectId);
                  setProjects((prev) => prev.map((p) => (p.id === regenerated.id ? regenerated : p)));
                  setSelectedProjectId(projectId);
                  setActiveView('studio');
                  void loadProjects();
                } catch (err: unknown) {
                  alert(err instanceof Error ? err.message : 'Failed to apply template to project');
                }
              }}
            />
          </EngineStage>
        )}

        {/* VIEW: 10-STEP PORTFOLIO REQUIREMENTS WIZARD */}
        {activeView === 'portfolio_wizard' && (
          <EngineStage engine="Portfolio Engine">
            <PortfolioRequirementWizard
              key={`${selectedPortfolioArchetype}:${portfolioTemplatePreselected?.templateId || 'default'}`}
              archetype={selectedPortfolioArchetype}
              initialTemplate={portfolioTemplatePreselected}
              draftScope={user.id}
              onCancel={() => {
                setPortfolioTemplatePreselected(undefined);
                setActiveView('portfolio_type_select');
              }}
              onSubmit={async (reqs) => {
                await handleCreateProject(reqs, { rethrow: true });
                setPortfolioTemplatePreselected(undefined);
              }}
            />
          </EngineStage>
        )}

        {/* VIEW: NGO TYPE SELECTOR */}
        {activeView === 'ngo_type_select' && (
          <EngineStage engine="Social & NGO Website Engine">
            <NGOTypeSelector
              onSelectArchetype={(arch) => {
                setSelectedNGOArchetype(arch);
                setNgoTemplate(undefined);
                setNgoChangeProjectId(null);
                setActiveView('ngo_template_select');
              }}
              onBack={() => setActiveView('engine_select')}
            />
          </EngineStage>
        )}

        {/* VIEW: NGO TEMPLATE LIBRARY (archetype-specific). Also used to change the template of an existing library NGO project. */}
        {activeView === 'ngo_template_select' && (() => {
          const changing = ngoChangeProjectId ? projects.find((p) => p.id === ngoChangeProjectId) : undefined;
          const archetype = (changing?.requirements.ngoArchetype || selectedNGOArchetype) as NgoArchetypeId;
          return (
            <EngineStage engine="Social & NGO Website Engine">
              <NgoTemplateLibrary
                key={`${archetype}:${ngoChangeProjectId || 'new'}`}
                archetype={archetype}
                selectedTemplateId={changing ? getNgoTemplateById(changing.requirements.selectedTemplate?.templateId)?.id : ngoTemplate?.templateId}
                backLabel={changing ? 'Back to project' : 'Back to website types'}
                selectLabel={changing ? 'Use template' : 'Select template'}
                onBack={() => {
                  if (changing) { setSelectedProjectId(changing.id); setNgoChangeProjectId(null); setActiveView('studio'); }
                  else setActiveView('ngo_type_select');
                }}
                onSelectTemplate={async (tmpl) => {
                  if (!changing) {
                    setNgoTemplate(tmpl);
                    setActiveView('ngo_wizard');
                    return;
                  }
                  try {
                    await api.updateProject(changing.id, { selectedTemplate: tmpl });
                    const regenerated = await api.generateWebsite(changing.id);
                    setProjects((prev) => prev.map((p) => (p.id === regenerated.id ? regenerated : p)));
                    setSelectedProjectId(changing.id);
                    setNgoChangeProjectId(null);
                    setActiveView('studio');
                    void loadProjects();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed to apply the template to this project');
                  }
                }}
              />
            </EngineStage>
          );
        })()}

        {/* VIEW: 10-STEP SOCIAL & NGO INTAKE */}
        {activeView === 'ngo_wizard' && ngoTemplate && (
          <EngineStage engine="Social & NGO Website Engine">
            <NgoIntakeWizard
              key={`${selectedNGOArchetype}:${ngoTemplate.templateId}`}
              archetype={selectedNGOArchetype}
              template={ngoTemplate}
              draftScope={user.id}
              onCancel={() => setActiveView('ngo_template_select')}
              onSubmit={async (reqs) => {
                await handleCreateProject(reqs, { rethrow: true });
                setNgoTemplate(undefined);
              }}
            />
          </EngineStage>
        )}

        {/* VIEW: EVENT TYPE SELECTOR */}
        {activeView === 'event_type_select' && (
          <EngineStage engine="Event Website Generation Engine">
            <EventTypeSelector
              onSelectCategory={(cat) => {
                setSelectedEventCategory(cat);
                setEventTemplate(undefined);
                setEventChangeProjectId(null);
                setActiveView('event_template_select');
              }}
              onBack={() => setActiveView('engine_select')}
            />
          </EngineStage>
        )}

        {/* VIEW: EVENT TEMPLATE LIBRARY (category-specific). Also used to change the template of an existing library event project. */}
        {activeView === 'event_template_select' && (() => {
          const changing = eventChangeProjectId ? projects.find((p) => p.id === eventChangeProjectId) : undefined;
          const category = (changing?.requirements.eventCategory || selectedEventCategory) as EventCategoryId;
          return (
            <EngineStage engine="Event Website Generation Engine">
              <EventTemplateLibrary
                key={`${category}:${eventChangeProjectId || 'new'}`}
                category={category}
                selectedTemplateId={changing ? getEventTemplateById(changing.requirements.selectedTemplate?.templateId)?.id : eventTemplate?.templateId}
                backLabel={changing ? 'Back to project' : 'Back to event types'}
                selectLabel={changing ? 'Use template' : 'Select template'}
                onBack={() => {
                  if (changing) { setSelectedProjectId(changing.id); setEventChangeProjectId(null); setActiveView('studio'); }
                  else setActiveView('event_type_select');
                }}
                onSelectTemplate={async (tmpl) => {
                  if (!changing) {
                    setEventTemplate(tmpl);
                    setActiveView('event_wizard');
                    return;
                  }
                  try {
                    await api.updateProject(changing.id, { selectedTemplate: tmpl });
                    const regenerated = await api.generateWebsite(changing.id);
                    setProjects((prev) => prev.map((p) => (p.id === regenerated.id ? regenerated : p)));
                    setSelectedProjectId(changing.id);
                    setEventChangeProjectId(null);
                    setActiveView('studio');
                    void loadProjects();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed to apply the template to this project');
                  }
                }}
              />
            </EngineStage>
          );
        })()}

        {/* VIEW: CATEGORY-SPECIFIC EVENT INTAKE */}
        {activeView === 'event_wizard' && eventTemplate && (
          <EngineStage engine="Event Website Generation Engine">
            <EventIntakeWizard
              key={`${selectedEventCategory}:${eventTemplate.templateId}`}
              category={selectedEventCategory as EventCategoryId}
              template={eventTemplate}
              draftScope={user.id}
              onCancel={() => setActiveView('event_template_select')}
              onSubmit={async (reqs) => {
                await handleCreateProject(reqs, { rethrow: true });
                setEventTemplate(undefined);
              }}
            />
          </EngineStage>
        )}

        {/* VIEW: CULTURAL TYPE SELECTOR */}
        {activeView === 'cultural_type_select' && (
          <EngineStage engine="Cultural Website Generation Engine">
            <CulturalTypeSelector
              onSelectType={(archetype) => {
                setSelectedCulturalArchetype(archetype);
                setCulturalTemplate(undefined);
                setCulturalChangeProjectId(null);
                setActiveView('cultural_template_select');
              }}
              onBack={() => setActiveView('engine_select')}
            />
          </EngineStage>
        )}

        {/* VIEW: CULTURAL TEMPLATE LIBRARY (category-specific). Also used to change the template of an existing Cultural project. */}
        {activeView === 'cultural_template_select' && (() => {
          const changing = culturalChangeProjectId ? projects.find((p) => p.id === culturalChangeProjectId) : undefined;
          const category = (changing?.requirements.culturalArchetype || selectedCulturalArchetype) as CulturalArchetypeChoice;
          return (
            <EngineStage engine="Cultural Website Generation Engine">
              <CulturalTemplateLibrary
                key={`${category}:${culturalChangeProjectId || 'new'}`}
                category={category}
                selectedTemplateId={changing ? getCulturalTemplateById(changing.requirements.selectedTemplate?.templateId)?.id : culturalTemplate?.templateId}
                backLabel={changing ? 'Back to project' : 'Back to website types'}
                selectLabel={changing ? 'Use template' : 'Select template'}
                allowAllCategories={!changing}
                onBack={() => {
                  if (changing) { setSelectedProjectId(changing.id); setCulturalChangeProjectId(null); setActiveView('studio'); }
                  else setActiveView('cultural_type_select');
                }}
                onSelectTemplate={async (tmpl) => {
                  if (!changing) {
                    // A template from the other category switches the intake to that category, so the steps always match the design.
                    const def = getCulturalTemplateById(tmpl.templateId);
                    if (def) setSelectedCulturalArchetype(def.archetype);
                    setCulturalTemplate(tmpl);
                    setActiveView('cultural_wizard');
                    return;
                  }
                  try {
                    await api.updateProject(changing.id, { selectedTemplate: tmpl });
                    const regenerated = await api.generateWebsite(changing.id);
                    setProjects((prev) => prev.map((p) => (p.id === regenerated.id ? regenerated : p)));
                    setSelectedProjectId(changing.id);
                    setCulturalChangeProjectId(null);
                    setActiveView('studio');
                    void loadProjects();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed to apply the template to this project');
                  }
                }}
              />
            </EngineStage>
          );
        })()}

        {/* VIEW: CATEGORY-AWARE CULTURAL INTAKE */}
        {activeView === 'cultural_wizard' && culturalTemplate && (
          <EngineStage engine="Cultural Website Generation Engine">
            <CulturalIntakeWizard
              key={`${selectedCulturalArchetype}:${culturalTemplate.templateId}`}
              category={selectedCulturalArchetype}
              template={culturalTemplate}
              draftScope={user.id}
              onCancel={() => setActiveView('cultural_template_select')}
              onSubmit={async (reqs) => {
                await handleCreateProject(reqs, { rethrow: true });
                setCulturalTemplate(undefined);
              }}
            />
          </EngineStage>
        )}

        {/* VIEW: SPORTS TYPE SELECTOR */}
        {activeView === 'sports_type_select' && (
          <EngineStage engine="Sports Website Creation Engine">
            <SportsTypeSelector
              onSelectType={(archetype) => {
                setSelectedSportsArchetype(archetype);
                setSportsTemplate(undefined);
                setSportsChangeProjectId(null);
                setActiveView('sports_template_select');
              }}
              onBack={() => setActiveView('engine_select')}
            />
          </EngineStage>
        )}

        {/* VIEW: SPORTS TEMPLATE LIBRARY (category-specific). Also used to change the template of an existing Sports project. */}
        {activeView === 'sports_template_select' && (() => {
          const changing = sportsChangeProjectId ? projects.find((p) => p.id === sportsChangeProjectId) : undefined;
          const category = (changing?.requirements.sportsArchetype || selectedSportsArchetype) as SportsArchetypeChoice;
          return (
            <EngineStage engine="Sports Website Creation Engine">
              <SportsTemplateLibrary
                key={`${category}:${sportsChangeProjectId || 'new'}`}
                category={category}
                selectedTemplateId={changing ? changing.requirements.selectedTemplate?.templateId : sportsTemplate?.templateId}
                backLabel={changing ? 'Back to project' : 'Back to website types'}
                selectLabel={changing ? 'Use template' : 'Select template'}
                allowAllCategories={!changing}
                onBack={() => {
                  if (changing) { setSelectedProjectId(changing.id); setSportsChangeProjectId(null); setActiveView('studio'); }
                  else setActiveView('sports_type_select');
                }}
                onSelectTemplate={async (tmpl) => {
                  if (!changing) {
                    // A template from another category switches the intake to that category, so the steps always match the design.
                    const def = getSportsTemplateById(tmpl.templateId);
                    if (def) setSelectedSportsArchetype(def.archetype);
                    setSportsTemplate(tmpl);
                    setActiveView('sports_wizard');
                    return;
                  }
                  try {
                    await api.updateProject(changing.id, { selectedTemplate: tmpl });
                    const regenerated = await api.generateWebsite(changing.id);
                    setProjects((prev) => prev.map((p) => (p.id === regenerated.id ? regenerated : p)));
                    setSelectedProjectId(changing.id);
                    setSportsChangeProjectId(null);
                    setActiveView('studio');
                    void loadProjects();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed to apply the template to this project');
                  }
                }}
              />
            </EngineStage>
          );
        })()}

        {/* VIEW: CATEGORY-AWARE SPORTS INTAKE */}
        {activeView === 'sports_wizard' && sportsTemplate && (
          <EngineStage engine="Sports Website Creation Engine">
            <SportsIntakeWizard
              key={`${selectedSportsArchetype}:${sportsTemplate.templateId}`}
              category={selectedSportsArchetype}
              template={sportsTemplate}
              draftScope={user.id}
              onCancel={() => setActiveView('sports_template_select')}
              onSubmit={async (reqs) => {
                await handleCreateProject(reqs, { rethrow: true });
                setSportsTemplate(undefined);
              }}
            />
          </EngineStage>
        )}

        {/* VIEW 1: GENERIC REQUIREMENTS WIZARD FALLBACK */}
        {activeView === 'wizard' && (
          <RequirementCollectionWizard
            onCancel={() => setActiveView('list')}
            onSubmit={handleCreateProject}
          />
        )}

        {/* VIEW 2: AI GENERATION & CUSTOMIZATION STUDIO */}
        {activeView === 'studio' && !selectedProject && (
          <div role="status" className="mx-auto max-w-lg rounded-2xl border border-dv-line bg-white p-8 text-center shadow-dv-card">
            <p className="text-sm font-semibold text-dv-ink">{loading ? 'Opening the project…' : 'This project could not be found.'}</p>
            <p className="mt-1 text-xs text-dv-muted">{loading ? 'Loading your projects.' : 'It may have been deleted, or the project list has not refreshed yet.'}</p>
            {!loading && (
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" onClick={() => void loadProjects()}>Refresh projects</Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelectedProjectId(null); setActiveView('projects'); }}>All projects</Button>
              </div>
            )}
          </div>
        )}
        {activeView === 'studio' && selectedProject && (
          <AIGenerationStudio
            project={selectedProject}
            onChangeEventTemplate={(p) => {
              setEventChangeProjectId(p.id);
              setSelectedEventCategory((p.requirements.eventCategory || 'conference_seminar') as EventCategoryChoice);
              setActiveView('event_template_select');
            }}
            onChangeNgoTemplate={(p) => {
              setNgoChangeProjectId(p.id);
              setSelectedNGOArchetype((p.requirements.ngoArchetype || 'grassroots_ngo') as NGOArchetypeChoice);
              setActiveView('ngo_template_select');
            }}
            onChangeCulturalTemplate={(p) => {
              setCulturalChangeProjectId(p.id);
              setSelectedCulturalArchetype((p.requirements.culturalArchetype || 'cultural_society') as CulturalArchetypeChoice);
              setActiveView('cultural_template_select');
            }}
            onChangeSportsTemplate={(p) => {
              setSportsChangeProjectId(p.id);
              setSelectedSportsArchetype((p.requirements.sportsArchetype || 'sports_club') as SportsArchetypeChoice);
              setActiveView('sports_template_select');
            }}
            onBack={() => {
              setActiveView('list');
              setSelectedProjectId(null);
            }}
            onProjectUpdated={(updated) => {
              setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }}
          />
        )}

        {/* VIEW: OVERVIEW (home) */}
        {activeView === 'list' && (
          <AdminOverview
            userName={user.name}
            projects={projects}
            loading={loading}
            onOpenProject={openProject}
            onDeleteProject={handleDeleteProject}
            onStartWebsite={() => setActiveView('engine_select')}
            onStartEngine={startEngine}
            onOpenTemplates={() => openPortfolioEngine('templates')}
            onViewProjects={openProjects}
          />
        )}

        {/* VIEW: ALL PROJECTS */}
        {activeView === 'projects' && (
          <ProjectsView
            key={projectStageFilter}
            projects={projects}
            loading={loading}
            error={error}
            initialStage={projectStageFilter}
            onOpenProject={openProject}
            onDeleteProject={handleDeleteProject}
            onStartWebsite={() => setActiveView('engine_select')}
          />
        )}

        {/* VIEW: PUBLISHED SITES */}
        {activeView === 'sites' && <PublishedSitesPanel showHeader={false} />}
        </ErrorBoundary>
      </WorkspaceShell>


      {/* Password Reset Request Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dv-ink/40 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#FAFBFD] border border-slate-900/[0.08] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/[0.08] pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Request Password Change</span>
              </div>
              <button
                onClick={() => {
                  setPasswordModalOpen(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="text-slate-500 hover:text-dv-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-500/40 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-500/40 text-emerald-700 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="font-bold mb-1">Request Submitted Successfully</div>
                    <p className="text-slate-600">{passwordSuccess}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your Super Administrator will review this request. Once approved, you will be able to establish a new password with the single-use reset link.
                </p>
                <div className="flex justify-end pt-2 border-t border-slate-900/[0.08]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordSuccess(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit a password change request to the Super Administrator. Once approved, a secure 24-hour reset link will be authorized.
                </p>

                <div className="rounded-lg bg-slate-900/[0.028] border border-slate-900/[0.08] p-3 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Account Username</div>
                  <div className="text-xs font-mono font-semibold text-dv-ink">@{user.username || user.email}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Reason for Password Change (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={passwordReason}
                    onChange={(e) => setPasswordReason(e.target.value)}
                    placeholder="E.g. Routine credential rotation, forgot old password"
                    className="w-full rounded-lg bg-white border border-slate-200 text-dv-ink text-xs p-2.5 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900/[0.08]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPasswordModalOpen(false)}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={passwordLoading}
                    className="bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs"
                  >
                    {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Submit Reset Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
