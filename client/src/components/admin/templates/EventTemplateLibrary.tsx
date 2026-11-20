import React, { useMemo, useState } from 'react';
import { Search, X, SearchX, ArrowLeft } from 'lucide-react';
import type { SelectedTemplateMetadata } from '../../../types/admin';
import type { EventTemplateDefinition } from '../../../templates/event/types';
import { EVENT_CATEGORY_LABELS, type EventCategoryId } from '../../../templates/event/ids';
import { getEventTemplatesByCategory } from '../../../templates/event/registry';
import { EventTemplateCard } from './EventTemplateCard';
import { EventDemoModal } from './EventDemoModal';

interface EventTemplateLibraryProps {
  category: EventCategoryId;
  /** Template already chosen for the project (marks the card "In use"). */
  selectedTemplateId?: string;
  onSelectTemplate: (template: SelectedTemplateMetadata) => void;
  onBack?: () => void;
  backLabel?: string;
  selectLabel?: string;
}

/** What the project stores about its template. Colours and fonts belong to the template itself, so none are recorded. */
export const buildEventTemplateMetadata = (t: EventTemplateDefinition): SelectedTemplateMetadata => ({
  templateId: t.id,
  templateVersion: t.version,
  templateName: t.name,
  websiteCategory: t.category,
  selectedAt: new Date().toISOString()
} as SelectedTemplateMetadata);

export const EventTemplateLibrary: React.FC<EventTemplateLibraryProps> = ({ category, selectedTemplateId, onSelectTemplate, onBack, backLabel = 'Back', selectLabel = 'Select template' }) => {
  const [query, setQuery] = useState('');
  const [previewing, setPreviewing] = useState<EventTemplateDefinition | null>(null);
  const pool = useMemo(() => getEventTemplatesByCategory(category), [category]);
  const shown = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return pool;
    return pool.filter((t) => [t.name, t.tagline, t.description, t.designStyle, ...t.highlights, ...t.pages].some((s) => s.toLowerCase().includes(q)));
  }, [pool, query]);
  const label = EVENT_CATEGORY_LABELS[category];
  const choose = (t: EventTemplateDefinition) => onSelectTemplate(buildEventTemplateMetadata(t));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-dv-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {onBack && <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-dv-line bg-white px-3 py-1.5 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink"><ArrowLeft className="h-3.5 w-3.5" />{backLabel}</button>}
          <h1 className="text-2xl font-extrabold tracking-tight text-dv-ink sm:text-3xl">{label} templates</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-dv-muted">
            {pool.length} {pool.length === 1 ? 'design' : 'designs'} built from open-licensed third-party website templates. Each shows its author, licence and source, and its own layout, type and motion are kept as published.
          </p>
        </div>
        {pool.length > 1 && (
          <div className="relative w-full sm:w-72">
            <Search aria-hidden className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" aria-label="Search templates" className="w-full rounded-xl border border-dv-line bg-white py-2.5 pl-10 pr-9 text-sm focus:border-dv-iris-500 focus:outline-none" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-dv-muted hover:text-dv-ink"><X className="h-3.5 w-3.5" /></button>}
          </div>
        )}
      </header>

      {pool.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dv-line bg-white py-16 text-center text-sm text-dv-muted">No qualifying template is available for this event type yet.</div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-dv-line bg-white py-16 text-center">
          <SearchX className="h-8 w-8 text-dv-muted" />
          <p className="text-sm font-semibold text-dv-ink">No templates match this search</p>
          <button type="button" onClick={() => setQuery('')} className="rounded-xl bg-dv-iris-600 px-4 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => <EventTemplateCard key={t.id} template={t} isSelected={selectedTemplateId === t.id} selectLabel={selectLabel} onPreview={setPreviewing} onSelect={choose} />)}
        </div>
      )}

      <EventDemoModal template={previewing} onClose={() => setPreviewing(null)} onSelectTemplate={choose} isSelected={previewing ? selectedTemplateId === previewing.id : false} />
    </div>
  );
};
