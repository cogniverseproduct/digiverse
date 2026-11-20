import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Brain, Briefcase, Building2, Camera, CheckCircle2, Eye, Film, GraduationCap, LayoutTemplate, Palette, PenTool, Terminal, Users, Video
} from 'lucide-react';
import type { ClientProject, SelectedTemplateMetadata } from '../../types/admin';
import type { PortfolioArchetype } from '../../types/portfolio';
import type { PortfolioTemplateDefinition } from '../../templates/portfolio/types';
import { PORTFOLIO_TEMPLATES } from '../../templates/portfolio/registry';
import { PROFESSIONS, PROFESSION_ORDER } from '../../templates/portfolio/professions';
import { PortfolioTemplateLibrary, buildPortfolioTemplateMetadata } from './templates/PortfolioTemplateLibrary';
import { PortfolioDemoModal } from './templates/PortfolioDemoModal';

export type PortfolioHomeTab = 'professions' | 'templates';

interface PortfolioEngineHomeProps {
  projects: ClientProject[];
  initialTab?: PortfolioHomeTab;
  onBack: () => void;
  /** Start the client intake with this profession and template. */
  onStart: (archetype: PortfolioArchetype, template: SelectedTemplateMetadata) => void;
  /** Apply a template to an existing portfolio project and regenerate it. */
  onApplyToProject: (template: SelectedTemplateMetadata, projectId: string) => void;
}

const ICONS: Record<string, React.ElementType> = {
  developer: Terminal, designer: Palette, photographer: Camera, graphic_artist: PenTool, motion_3d: Film,
  freelancer: Briefcase, student_grad: GraduationCap, data_scientist: Brain, architect: Building2, content_creator: Video
};

/**
 * Portfolio Website Creation Engine landing page. Two ways in, one shared outcome: the Admin ends up in the
 * client intake wizard with a profession (archetype) and a template that belong together.
 *  - "Choose a profession" starts with the profession and its recommended template.
 *  - "Template library" starts with a design; the Admin confirms the profession in the dialog.
 */
export const PortfolioEngineHome: React.FC<PortfolioEngineHomeProps> = ({ projects, initialTab = 'professions', onBack, onStart, onApplyToProject }) => {
  const [tab, setTab] = useState<PortfolioHomeTab>(initialTab);
  const [preview, setPreview] = useState<PortfolioTemplateDefinition | null>(null);

  return (
    <div className="space-y-7">
      <div className="border-b border-dv-line pb-6">
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-dv-muted transition hover:text-dv-ink">
          <ArrowLeft className="h-4 w-4" />Back to engine selection
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dv-iris-100 text-xs font-bold text-dv-iris-700">05</span>
          <h1 className="text-2xl font-black tracking-tight text-dv-ink sm:text-3xl">Portfolio Website Creation Engine</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-dv-muted">
          Pick the client’s profession to tailor the 10-step intake, or start from a design in the template library. The profession and the template stay linked through intake and generation.
        </p>
      </div>

      <div role="tablist" aria-label="How to start" className="inline-flex rounded-2xl border border-dv-line bg-dv-mist p-1">
        {([
          { id: 'professions', label: 'Choose a profession', icon: Users },
          { id: 'templates', label: `Template library (${Object.keys(PORTFOLIO_TEMPLATES).length})`, icon: LayoutTemplate }
        ] as const).map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-white text-dv-iris-700 shadow-sm' : 'text-dv-muted hover:text-dv-ink'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'professions' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="profession-grid">
          {PROFESSION_ORDER.map((id) => {
            const p = PROFESSIONS[id];
            const tmpl = PORTFOLIO_TEMPLATES[p.recommendedTemplate];
            const Icon = ICONS[id] || Briefcase;
            return (
              <article key={id} data-archetype={id} className="flex flex-col overflow-hidden rounded-2xl border border-dv-line bg-white shadow-dv-card transition hover:-translate-y-0.5 hover:shadow-dv-float">
                <div className="relative h-36 overflow-hidden bg-dv-mist">
                  <img src={tmpl.previewImage} alt={`${tmpl.name} template preview`} loading="lazy" className="h-full w-full object-cover object-top" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-dv-ink shadow"><Icon className="h-5 w-5" /></span>
                  <button type="button" onClick={() => setPreview(tmpl)} aria-label={`Preview ${tmpl.name}`} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-dv-ink shadow hover:bg-white">
                    <Eye className="h-3.5 w-3.5" />Preview
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold tracking-tight text-dv-ink">{p.label}</h2>
                  <p className="mt-0.5 text-xs text-dv-muted">{p.subtitle}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-dv-muted">Recommended template</p>
                  <p className="text-sm font-semibold text-dv-iris-700">{tmpl.name}</p>
                  <ul className="mt-3 space-y-1.5 border-t border-dv-line pt-3">
                    {p.intakeHighlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-dv-ink-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dv-iris-600" /><span>{h}</span></li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => onStart(id, buildPortfolioTemplateMetadata(tmpl))}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dv-iris-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-dv-iris-500">
                    Start with this profession<ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <PortfolioTemplateLibrary
          embedded
          projects={projects}
          onSelectTemplate={(tmpl, projectId) => { if (projectId) onApplyToProject(tmpl, projectId); }}
          onCreateProjectWithTemplate={(tmpl, archetype) => onStart(archetype, tmpl)}
        />
      )}

      <PortfolioDemoModal
        template={preview}
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        onSelectTemplate={(t) => onStart(t.archetype, buildPortfolioTemplateMetadata(t))}
      />
    </div>
  );
};
