import React, { useMemo } from 'react';
import { ArrowRight, Plus, Sparkles, LayoutTemplate, MessageSquareWarning, Rocket, Wand2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ClientProject } from '../../types/admin';
import { Button } from '../ui/dv/Button';
import { EngineShowcase } from './EngineShowcase';
import {
  ENGINE_META,
  PIPELINE,
  engineForProject,
  greeting,
  statusMeta,
  type EngineKey,
  type PipelineStage
} from './projectMeta';
import { ProjectAvatar, ProjectCard } from './ProjectBits';

interface AdminOverviewProps {
  userName: string;
  projects: ClientProject[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (project: ClientProject) => void;
  onStartWebsite: () => void;
  onStartEngine: (engine: Exclude<EngineKey, 'other'>) => void;
  onOpenTemplates: () => void;
  onViewProjects: (stage?: PipelineStage) => void;
}

/** Decorative composition: floating website "windows" in engine colours. */
const HeroArt: React.FC = () => (
  <div aria-hidden className="relative h-[230px] w-full max-w-[380px] select-none">
    <div className="absolute right-6 top-2 h-40 w-56 rotate-[6deg] rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-3 shadow-dv-float animate-dv-float-slow">
      <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white/70" /><span className="h-1.5 w-1.5 rounded-full bg-white/50" /><span className="h-1.5 w-1.5 rounded-full bg-white/40" /></div>
      <div className="mt-6 h-3 w-24 rounded-full bg-white/80" />
      <div className="mt-2 h-2 w-32 rounded-full bg-white/50" />
      <div className="mt-6 grid grid-cols-3 gap-1.5"><span className="h-8 rounded-lg bg-white/30" /><span className="h-8 rounded-lg bg-white/40" /><span className="h-8 rounded-lg bg-white/30" /></div>
    </div>
    <div className="absolute left-2 top-12 h-40 w-56 -rotate-[5deg] rounded-2xl bg-white p-3 shadow-dv-float ring-1 ring-dv-line animate-dv-float [animation-delay:-2s]">
      <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-300" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /></div>
      <div className="mt-4 h-16 rounded-xl bg-gradient-to-br from-dv-iris-400 via-purple-500 to-dv-coral" />
      <div className="mt-3 h-2.5 w-28 rounded-full bg-dv-ink/80" />
      <div className="mt-2 h-2 w-36 rounded-full bg-dv-ink/15" />
    </div>
    <div className="absolute bottom-0 right-16 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-dv-float ring-1 ring-dv-line animate-dv-float [animation-delay:-4s]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white"><CheckCircle2 className="h-4 w-4" /></span>
      <span className="text-[12px] font-semibold text-dv-ink">Published</span>
    </div>
  </div>
);

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  userName,
  projects,
  loading,
  onOpenProject,
  onDeleteProject,
  onStartWebsite,
  onStartEngine,
  onOpenTemplates,
  onViewProjects
}) => {
  const firstName = userName.split(/\s+/)[0] || userName;

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = { intake: 0, review: 0, revision: 0, approved: 0, live: 0 };
    projects.forEach((project) => {
      counts[statusMeta(project.status).stage] += 1;
    });
    return counts;
  }, [projects]);

  const engineCounts = useMemo(() => {
    const counts: Record<EngineKey, number> = { sports: 0, cultural: 0, event: 0, ngo: 0, portfolio: 0, other: 0 };
    projects.forEach((project) => {
      counts[engineForProject(project)] += 1;
    });
    return counts;
  }, [projects]);

  const nextActions = useMemo(() => {
    const items: { project: ClientProject; label: string; icon: React.ElementType; tone: string }[] = [];
    const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    sorted.forEach((project) => {
      if (project.status === 'in_revision') {
        items.push({ project, label: 'Client asked for changes', icon: MessageSquareWarning, tone: 'bg-amber-50 text-amber-700' });
      } else if (project.status === 'client_approved' || project.status === 'approved_for_deployment' || project.status === 'preview_ready') {
        items.push({ project, label: 'Ready to publish', icon: Rocket, tone: 'bg-sky-50 text-sky-700' });
      } else if (project.status === 'requirements_collected' && !project.generatedWebsite) {
        items.push({ project, label: 'Generate the first draft', icon: Wand2, tone: 'bg-dv-iris-50 text-dv-iris-700' });
      }
    });
    return items.slice(0, 5);
  }, [projects]);

  const recent = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [projects]
  );

  const total = projects.length || 1;
  const reviewCount = stageCounts.review;
  const summary = loading
    ? 'Loading your workspace…'
    : projects.length === 0
      ? 'Your workspace is ready. Start with a client website or a personal portfolio.'
      : `${projects.length} project${projects.length === 1 ? '' : 's'} in your workspace · ${reviewCount} waiting for client review · ${stageCounts.live} live.`;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-[32px] border border-dv-line bg-white shadow-dv-card dv-grain animate-dv-rise">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E3DCFF] blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 right-48 h-72 w-72 rounded-full bg-[#FFE1D6] blur-3xl" />
        <div className="relative grid items-center gap-6 p-7 sm:p-10 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-dv-iris-600">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-dv-ink sm:text-[44px]">
              {greeting()}, <span className="font-editorial text-[1.08em] font-normal italic dv-prism-text">{firstName}</span>.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-dv-muted">{summary}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={onStartWebsite}>
                <Plus className="h-4 w-4" />
                Start a new website
              </Button>
              <Button size="lg" variant="secondary" onClick={() => onStartEngine('portfolio')}>
                <Sparkles className="h-4 w-4 text-dv-iris-600" />
                Create a portfolio
              </Button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <HeroArt />
          </div>
        </div>
      </section>

      <EngineShowcase onOpenEngine={onStartEngine} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <section className="rounded-[26px] border border-dv-line bg-white p-6 shadow-dv-card lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-dv-ink">Delivery pipeline</h3>
              <p className="mt-1 text-[13px] text-dv-muted">Where every project stands, from first brief to live website.</p>
            </div>
            <button
              type="button"
              onClick={() => onViewProjects()}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-dv-iris-600 hover:text-dv-iris-700"
            >
              All projects <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-dv-mist" role="img" aria-label="Projects by stage">
            {PIPELINE.map((stage) =>
              stageCounts[stage.key] > 0 ? (
                <span
                  key={stage.key}
                  className={cn('h-full transition-all duration-700', stage.bar)}
                  style={{ width: `${(stageCounts[stage.key] / total) * 100}%` }}
                />
              ) : null
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PIPELINE.map((stage) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => onViewProjects(stage.key)}
                className="group flex flex-col items-start justify-start rounded-2xl border border-dv-line bg-dv-canvas/50 p-4 text-left transition hover:border-dv-iris-200 hover:bg-white hover:shadow-dv-card"
              >
                <div className="flex items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-dv-ink-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', stage.dot)} />
                  {stage.label}
                </div>
                <div className="mt-2 font-display text-3xl font-bold tracking-tight text-dv-ink">
                  {loading ? '–' : stageCounts[stage.key]}
                </div>
                <div className="mt-1 text-[11px] leading-4 text-dv-muted">{stage.description}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-dv-line pt-5">
            <div className="text-[12px] font-semibold text-dv-ink-2">By engine</div>
            <div className="mt-3 space-y-2.5">
              {(['sports', 'cultural', 'event', 'ngo', 'portfolio', 'other'] as const)
                .filter((key) => key !== 'other' || engineCounts.other > 0)
                .map((key) => (
                  <div key={key} className="flex items-center gap-3 text-[12px]">
                    <span className="w-24 shrink-0 text-dv-muted">{ENGINE_META[key].short}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-dv-mist">
                      <span
                        className={cn('block h-full rounded-full bg-gradient-to-r transition-all duration-700', ENGINE_META[key].gradient)}
                        style={{ width: `${(engineCounts[key] / total) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right font-semibold text-dv-ink">{engineCounts[key]}</span>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Next actions */}
        <section className="rounded-[26px] border border-dv-line bg-white p-6 shadow-dv-card">
          <h3 className="font-display text-lg font-bold text-dv-ink">Up next</h3>
          <p className="mt-1 text-[13px] text-dv-muted">Projects that need you.</p>

          {nextActions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-dv-line p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
              <p className="mt-2 text-[13px] font-semibold text-dv-ink">All caught up</p>
              <p className="mt-1 text-[12px] text-dv-muted">Nothing is waiting on you right now.</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {nextActions.map(({ project, label, icon: Icon, tone }) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-dv-canvas"
                  >
                    <ProjectAvatar project={project} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-dv-ink">{project.requirements.organizationName}</span>
                      <span className={cn('mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', tone)}>
                        <Icon className="h-3 w-3" /> {label}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-dv-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Engines */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-dv-ink">Generation engines</h3>
            <p className="mt-1 text-[13px] text-dv-muted">Each engine is built for one kind of website. Pick the one that fits the client.</p>
          </div>
          <button
            type="button"
            onClick={onOpenTemplates}
            className="hidden shrink-0 items-center gap-1.5 text-[13px] font-semibold text-dv-iris-600 hover:text-dv-iris-700 sm:inline-flex"
          >
            <LayoutTemplate className="h-4 w-4" /> Portfolio templates
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {(['sports', 'cultural', 'event', 'ngo', 'portfolio'] as const).map((key) => {
            const meta = ENGINE_META[key];
            const Icon = meta.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onStartEngine(key)}
                className="dv-lift group relative overflow-hidden rounded-[22px] border border-dv-line bg-white p-5 text-left shadow-dv-card"
              >
                <div aria-hidden className={cn('absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-15 blur-xl transition-opacity group-hover:opacity-30', meta.gradient)} />
                <span className={cn('relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', meta.gradient)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="relative mt-4 text-[15px] font-semibold text-dv-ink">{meta.short}</div>
                <p className="relative mt-1 text-[12px] leading-5 text-dv-muted">{meta.description}</p>
                <div className="relative mt-4 flex items-center justify-between text-[12px]">
                  <span className="text-dv-muted">{engineCounts[key]} project{engineCounts[key] === 1 ? '' : 's'}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-dv-iris-600 transition-transform group-hover:translate-x-0.5">
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent work */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-dv-ink">Recent work</h3>
            <p className="mt-1 text-[13px] text-dv-muted">The projects you touched last.</p>
          </div>
          {projects.length > 6 && (
            <button
              type="button"
              onClick={() => onViewProjects()}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-dv-iris-600 hover:text-dv-iris-700"
            >
              View all {projects.length} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[210px] rounded-[22px] border border-dv-line bg-[linear-gradient(110deg,#fff_30%,#F2F0FF_50%,#fff_70%)] bg-[length:200%_100%] animate-dv-shimmer" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-dv-iris-200 bg-white/60 p-10 text-center">
            <p className="font-display text-lg font-bold text-dv-ink">No projects yet</p>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-dv-muted">
              Collect a client's requirements with one of the engines above and DigiVerse will generate the first draft for you.
            </p>
            <Button className="mt-5" onClick={onStartWebsite}>
              <Plus className="h-4 w-4" /> Start a new website
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project, index) => (
              <div key={project.id} className="animate-dv-rise" style={{ animationDelay: `${index * 60}ms` }}>
                <ProjectCard
                  project={project}
                  onOpen={() => onOpenProject(project.id)}
                  onDelete={() => onDeleteProject(project)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
