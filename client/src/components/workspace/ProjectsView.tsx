import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, X, ArrowUpRight, Trash2, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ClientProject } from '../../types/admin';
import { Button } from '../ui/dv/Button';
import { ENGINE_META, PIPELINE, engineForProject, relativeTime, statusMeta, type EngineKey, type PipelineStage } from './projectMeta';
import { EngineChip, ProjectAvatar, ProjectCard, RecentProjectsRow, StatusChip } from './ProjectBits';

interface ProjectsViewProps {
  projects: ClientProject[];
  loading: boolean;
  error?: string | null;
  initialStage?: PipelineStage | 'all';
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (project: ClientProject) => void;
  onStartWebsite: () => void;
}

const VIEW_KEY = 'dv.projects.view';

function readViewPreference(): 'grid' | 'list' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  loading,
  error,
  initialStage = 'all',
  onOpenProject,
  onDeleteProject,
  onStartWebsite
}) => {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<PipelineStage | 'all'>(initialStage);
  const [engine, setEngine] = useState<EngineKey | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>(readViewPreference);

  const changeView = (next: 'grid' | 'list') => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Preference is optional.
    }
  };

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach((project) => {
      const key = statusMeta(project.status).stage;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...projects]
      .filter((project) => stage === 'all' || statusMeta(project.status).stage === stage)
      .filter((project) => engine === 'all' || engineForProject(project) === engine)
      .filter((project) => {
        if (!q) return true;
        const r = project.requirements;
        return [r.organizationName, project.tenantSlug, r.contactPerson, r.contactEmail, r.tagline]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, query, stage, engine]);

  const hasFilters = query || stage !== 'all' || engine !== 'all';

  return (
    <div className="space-y-5">
      <RecentProjectsRow projects={projects} onOpen={onOpenProject} />

      {/* Toolbar */}
      <div className="rounded-[22px] border border-dv-line bg-white/80 p-3 shadow-dv-card backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by organisation, address, contact or email"
              className="w-full rounded-xl border border-dv-line bg-white py-2.5 pl-10 pr-9 text-[13px] text-dv-ink placeholder:text-dv-muted/70 focus:border-dv-iris-300 focus:outline-none focus:ring-4 focus:ring-dv-iris-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-dv-muted hover:text-dv-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2">
            <select
              value={engine}
              onChange={(event) => setEngine(event.target.value as EngineKey | 'all')}
              aria-label="Filter by engine"
              className="rounded-xl border border-dv-line bg-white px-3 py-2.5 text-[13px] text-dv-ink-2 focus:border-dv-iris-300 focus:outline-none"
            >
              <option value="all">All engines</option>
              {(Object.keys(ENGINE_META) as EngineKey[]).map((key) => (
                <option key={key} value={key}>{ENGINE_META[key].short}</option>
              ))}
            </select>

            <div className="flex rounded-xl border border-dv-line bg-dv-canvas p-1" role="group" aria-label="Layout">
              {([['grid', LayoutGrid], ['list', List]] as const).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeView(key)}
                  aria-pressed={view === key}
                  aria-label={key === 'grid' ? 'Card view' : 'List view'}
                  className={cn(
                    'rounded-lg p-1.5 transition',
                    view === key ? 'bg-white text-dv-ink shadow-sm' : 'text-dv-muted hover:text-dv-ink'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {[{ key: 'all' as const, label: 'All', dot: 'bg-dv-ink' }, ...PIPELINE].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStage(item.key)}
              aria-pressed={stage === item.key}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition',
                stage === item.key
                  ? 'border-dv-ink bg-dv-ink text-white'
                  : 'border-dv-line bg-white text-dv-ink-2 hover:border-dv-iris-200'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', stage === item.key ? 'bg-white' : item.dot)} />
              {item.label}
              <span className={cn('rounded-full px-1.5 text-[10px]', stage === item.key ? 'bg-white/20' : 'bg-dv-ink/[0.05] text-dv-muted')}>
                {stageCounts[item.key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[210px] rounded-[22px] border border-dv-line bg-[linear-gradient(110deg,#fff_30%,#F2F0FF_50%,#fff_70%)] bg-[length:200%_100%] animate-dv-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-dv-iris-200 bg-white/60 p-12 text-center">
          <p className="font-display text-lg font-bold text-dv-ink">{hasFilters ? 'Nothing matches these filters' : 'No projects yet'}</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] text-dv-muted">
            {hasFilters ? 'Try a different search or clear the filters.' : 'Start a client website or portfolio to see it here.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setStage('all');
                  setEngine('all');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={onStartWebsite}>Start a new website</Button>
            )}
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => onOpenProject(project.id)}
              onDelete={() => onDeleteProject(project)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-dv-line bg-white shadow-dv-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-dv-line bg-dv-canvas/70 text-[11px] uppercase tracking-[0.12em] text-dv-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-5 py-3 font-semibold">Engine</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dv-line">
                {filtered.map((project) => (
                  <tr key={project.id} className="group transition-colors hover:bg-dv-iris-50/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProjectAvatar project={project} size="sm" />
                        <div className="min-w-0">
                          <div className="max-w-[260px] truncate font-semibold text-dv-ink">{project.requirements.organizationName}</div>
                          <div className="max-w-[260px] truncate font-mono text-[11px] text-dv-muted">
                            {project.status === 'deployed' ? `/live/${project.deploymentDetails?.siteSlug || project.tenantSlug}` : project.tenantSlug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><EngineChip project={project} /></td>
                    <td className="px-5 py-3.5 text-dv-ink-2">
                      <div>{project.requirements.contactPerson || <span className="text-dv-muted">—</span>}</div>
                      {project.requirements.contactEmail && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-dv-muted">
                          <Mail className="h-3 w-3" /> {project.requirements.contactEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusChip project={project} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-dv-muted">{relativeTime(project.updatedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="secondary" onClick={() => onOpenProject(project.id)}>
                          Open <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => onDeleteProject(project)}
                          aria-label={`Delete ${project.requirements.organizationName}`}
                          className="rounded-lg p-2 text-dv-muted transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
