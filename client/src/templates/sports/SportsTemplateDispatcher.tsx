import React, { Suspense, lazy } from 'react';
import type { SportsCategory, SportsTemplateId, SportsTemplateProps } from './types';
import { ALL_SPORTS_IDS, categoryOfSportsTemplate, isSportsTemplateIdLite } from './ids';

type TemplateComponent = React.ComponentType<SportsTemplateProps>;

// Every design is code-split: a published site only downloads the one template it uses.
// Files live in ./designs/<category>/<PascalCaseId>.tsx and export a component with the same name.
const LOADERS = import.meta.glob<Record<string, TemplateComponent>>('./designs/*/*.tsx');

const pascal = (id: string) => id.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const FOLDER: Record<SportsCategory, string> = { sports_club: 'club', sports_tournament: 'tournament', sports_academy: 'academy' };

const CACHE = new Map<string, React.LazyExoticComponent<TemplateComponent>>();
function componentFor(id: SportsTemplateId): React.LazyExoticComponent<TemplateComponent> | null {
  const cat = categoryOfSportsTemplate(id);
  if (!cat) return null;
  const key = `./designs/${FOLDER[cat]}/${pascal(id)}.tsx`;
  const loader = LOADERS[key];
  if (!loader) return null;
  let C = CACHE.get(id);
  if (!C) {
    C = lazy(() => loader().then((m) => ({ default: m[pascal(id)] || (Object.values(m).find((v) => typeof v === 'function') as TemplateComponent) })));
    CACHE.set(id, C);
  }
  return C;
}

/** True when a template id from a project belongs to the Sports library (otherwise the legacy renderer is used). */
export const isSportsLibraryTemplate = (id: unknown): id is SportsTemplateId => isSportsTemplateIdLite(id);

/** Which template a project uses: the explicit selection recorded on the project. */
export function resolveSportsTemplateId(props: Pick<SportsTemplateProps, 'requirements' | 'website'>): SportsTemplateId | undefined {
  const id = props.website?.selectedTemplate?.templateId || props.requirements?.selectedTemplate?.templateId;
  return isSportsTemplateIdLite(id) ? id : undefined;
}

const Loading = () => <div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />;

export const SportsTemplateDispatcher: React.FC<SportsTemplateProps & { templateId?: SportsTemplateId }> = ({ templateId, ...props }) => {
  const id = templateId || resolveSportsTemplateId(props);
  const C = id ? componentFor(id) : null;
  if (!id || !C) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-10 text-center text-sm">
        <p className="font-semibold">This template is not available.</p>
        <p className="mt-1 opacity-70">Template “{String(id || 'unknown')}” could not be loaded. Known templates: {ALL_SPORTS_IDS.length}.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<Loading />}>
      <C {...props} />
    </Suspense>
  );
};
