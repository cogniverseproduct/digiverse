import React, { Suspense, lazy } from 'react';
import type { CulturalCategory, CulturalTemplateId, CulturalTemplateProps } from './types';
import { ALL_CULTURAL_IDS, DEFAULT_CULTURAL_TEMPLATE_ID, categoryOfCulturalTemplate, resolveCulturalTemplateId } from './ids';

type TemplateComponent = React.ComponentType<CulturalTemplateProps>;

// Every design is code-split: a published site only downloads the one template it uses.
// Files live in ./designs/<folder>/<PascalCaseId>.tsx and export a component with the same name.
const LOADERS = import.meta.glob<Record<string, TemplateComponent>>('./designs/*/*.tsx');

const pascal = (id: string) => id.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const FOLDER: Record<CulturalCategory, string> = { cultural_society: 'association', puja_committee: 'puja' };

const CACHE = new Map<string, React.LazyExoticComponent<TemplateComponent>>();
function componentFor(id: CulturalTemplateId): React.LazyExoticComponent<TemplateComponent> | null {
  const cat = categoryOfCulturalTemplate(id);
  if (!cat) return null;
  const loader = LOADERS[`./designs/${FOLDER[cat]}/${pascal(id)}.tsx`];
  if (!loader) return null;
  let C = CACHE.get(id);
  if (!C) {
    C = lazy(() => loader().then((m) => ({ default: m[pascal(id)] || (Object.values(m).find((v) => typeof v === 'function') as TemplateComponent) })));
    CACHE.set(id, C);
  }
  return C;
}

/** True when a project's template id belongs to the Cultural library (a current id, or a retired one that maps to a current design). */
export const isCulturalLibraryTemplate = (id: unknown): boolean => resolveCulturalTemplateId(id) !== undefined;

/** Which design a project uses: the explicit selection recorded on the project, with retired ids mapped forward. */
export function resolveProjectCulturalTemplateId(props: Pick<CulturalTemplateProps, 'requirements' | 'website' | 'culturalData'>): CulturalTemplateId | undefined {
  const raw = props.website?.selectedTemplate?.templateId || props.requirements?.selectedTemplate?.templateId;
  return resolveCulturalTemplateId(raw);
}

/**
 * The design to render for a project. A project that never chose one (created before the library existed), or whose stored id is not
 * known any more, shows its category's default design so a published site never renders blank. Stored data is not changed.
 */
export function resolveCulturalTemplateForProject(props: Pick<CulturalTemplateProps, 'requirements' | 'website' | 'culturalData'>): CulturalTemplateId {
  const explicit = resolveProjectCulturalTemplateId(props);
  if (explicit) return explicit;
  const puja = props.culturalData?.websiteType === 'puja_committee' || props.requirements?.category === 'puja_committee' || props.requirements?.culturalArchetype === 'puja_committee';
  return DEFAULT_CULTURAL_TEMPLATE_ID[puja ? 'puja_committee' : 'cultural_society'];
}

const Loading = () => <div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />;

export const CulturalTemplateDispatcher: React.FC<CulturalTemplateProps & { templateId?: string }> = ({ templateId, ...props }) => {
  const id = templateId ? resolveCulturalTemplateId(templateId) : resolveCulturalTemplateForProject(props);
  const C = id ? componentFor(id) : null;
  if (!id || !C) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-10 text-center text-sm">
        <p className="font-semibold">This template is not available.</p>
        <p className="mt-1 opacity-70">Template “{String(templateId || props.website?.selectedTemplate?.templateId || 'unknown')}” could not be loaded. Known templates: {ALL_CULTURAL_IDS.length}.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<Loading />}>
      <C {...props} />
    </Suspense>
  );
};
