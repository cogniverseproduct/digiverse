import React from 'react';
import { ArrowUpRight, Globe, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ClientProject } from '../../types/admin';
import { ENGINE_META, engineForProject, relativeTime, statusMeta } from './projectMeta';
import { SlidingRow } from './SlidingRow';

export const ProjectAvatar: React.FC<{ project: ClientProject; size?: 'sm' | 'md' | 'lg' }> = ({ project, size = 'md' }) => {
  const engine = ENGINE_META[engineForProject(project)];
  const dims = size === 'lg' ? 'h-12 w-12 rounded-2xl text-base' : size === 'sm' ? 'h-8 w-8 rounded-lg text-[11px]' : 'h-10 w-10 rounded-xl text-sm';
  const name = project.requirements.organizationName || 'Project';

  if (project.requirements.logoUrl) {
    return (
      <img
        src={project.requirements.logoUrl}
        alt=""
        loading="lazy"
        className={cn(dims, 'shrink-0 bg-white object-contain p-1 ring-1 ring-dv-line')}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(dims, 'flex shrink-0 items-center justify-center bg-gradient-to-br font-display font-bold text-white shadow-sm', engine.gradient)}
    >
      {name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
    </span>
  );
};

export const StatusChip: React.FC<{ project: ClientProject; className?: string }> = ({ project, className }) => {
  const meta = statusMeta(project.status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', meta.tone, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', project.status === 'deployed' ? 'bg-emerald-500' : project.status === 'in_revision' ? 'bg-amber-500' : 'bg-current opacity-60')} />
      {meta.label}
    </span>
  );
};

export const EngineChip: React.FC<{ project: ClientProject }> = ({ project }) => {
  const key = engineForProject(project);
  const meta = ENGINE_META[key];
  const Icon = meta.icon;
  const isPuja = project.requirements.category === 'puja_committee';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', meta.chip)}>
      <Icon className="h-3 w-3" />
      {isPuja ? 'Puja committee' : meta.short}
    </span>
  );
};

/** Auto-sliding strip of the most recently updated projects (real data). */
export const RecentProjectsRow: React.FC<{ projects: ClientProject[]; onOpen: (projectId: string) => void }> = ({ projects, onOpen }) => {
  const recent = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);
  if (recent.length < 3) return null;
  return (
    <section className="space-y-1" aria-label="Recently updated projects">
      <div className="px-1">
        <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-dv-ink">Recently updated</h3>
        <p className="mt-0.5 text-[13px] text-dv-muted">Jump back into the projects you touched last.</p>
      </div>
      <SlidingRow label="Recently updated projects" seconds={Math.max(30, recent.length * 7)}>
        {recent.map((project) => {
          const meta = ENGINE_META[engineForProject(project)];
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpen(project.id)}
              className="dv-lift group mr-5 w-[260px] shrink-0 overflow-hidden rounded-[22px] border border-white/70 bg-white/70 text-left shadow-dv-card backdrop-blur-md"
            >
              <div className={cn('h-1.5 bg-gradient-to-r', meta.gradient)} />
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <ProjectAvatar project={project} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-dv-ink">{project.requirements.organizationName || 'Untitled project'}</div>
                    <div className="text-[12px] text-dv-muted">{meta.short} · {relativeTime(project.updatedAt)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusChip project={project} />
                  <span className="text-[12px] font-semibold text-dv-iris-600 opacity-0 transition group-hover:opacity-100">Open</span>
                </div>
              </div>
            </button>
          );
        })}
      </SlidingRow>
    </section>
  );
};

export const ProjectCard: React.FC<{
  project: ClientProject;
  onOpen: () => void;
  onDelete?: () => void;
}> = ({ project, onOpen, onDelete }) => {
  const live = project.status === 'deployed';
  const slug = project.deploymentDetails?.siteSlug || project.tenantSlug;

  return (
    <article className="dv-lift group relative flex flex-col overflow-hidden rounded-[22px] border border-dv-line bg-white shadow-dv-card">
      <div className={cn('h-1.5 w-full bg-gradient-to-r opacity-80', ENGINE_META[engineForProject(project)].gradient)} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <ProjectAvatar project={project} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-dv-ink">{project.requirements.organizationName}</h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-dv-muted">
              {project.requirements.tagline || project.requirements.contactPerson || 'No tagline yet'}
            </p>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label={`Delete ${project.requirements.organizationName}`}
              className="rounded-lg p-1.5 text-dv-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <EngineChip project={project} />
          <StatusChip project={project} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[12px]">
          <span className="flex min-w-0 items-center gap-1.5 text-dv-muted">
            <Globe className={cn('h-3.5 w-3.5 shrink-0', live ? 'text-emerald-500' : 'text-dv-muted/70')} />
            <span className="truncate font-mono text-[11px]">{live ? `/live/${slug}` : 'Not published'}</span>
          </span>
          <span className="shrink-0 text-dv-muted/80">{relativeTime(project.updatedAt)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex items-center justify-between border-t border-dv-line bg-dv-canvas/60 px-5 py-3 text-[13px] font-semibold text-dv-ink-2 transition-colors hover:bg-dv-iris-50 hover:text-dv-iris-700"
      >
        Open studio
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
    </article>
  );
};
