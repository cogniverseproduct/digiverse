import React, { useMemo, useState } from 'react';
import { Search, X, SearchX, ArrowLeft } from 'lucide-react';
import type { SelectedTemplateMetadata } from '../../../types/admin';
import type { SportsCategory, SportsTemplateDefinition, SportsFocus } from '../../../templates/sports/types';
import { SPORTS_CATEGORY_LABELS } from '../../../templates/sports/types';
import { SPORT_FILTERS, STYLE_FILTERS, getSportsTemplateList } from '../../../templates/sports/registry';
import { SportsTemplateCard } from './SportsTemplateCard';
import { SportsDemoModal } from './SportsDemoModal';

interface SportsTemplateLibraryProps {
  /** The category the admin chose; its 8 templates are shown first. */
  category: SportsCategory;
  /** Template already chosen for the project (marks the card "In use"). */
  selectedTemplateId?: string;
  onSelectTemplate: (template: SelectedTemplateMetadata) => void;
  onBack?: () => void;
  backLabel?: string;
  selectLabel?: string;
  /** When false the "show all categories" switch is hidden (a project's category is fixed). */
  allowAllCategories?: boolean;
}

type SortKey = 'recommended' | 'name' | 'style';

export const buildSportsTemplateMetadata = (t: SportsTemplateDefinition): SelectedTemplateMetadata => ({
  templateId: t.id,
  templateVersion: t.version,
  templateName: t.name,
  websiteCategory: t.archetype,
  selectedAt: new Date().toISOString(),
  designTokens: { primaryColor: t.tokens.primaryColor, accentColor: t.tokens.accentColor, fontFamily: t.tokens.fontFamily, headingFont: t.tokens.headingFont, layoutPreset: t.tokens.layoutPreset }
});

export const SportsTemplateLibrary: React.FC<SportsTemplateLibraryProps> = ({ category, selectedTemplateId, onSelectTemplate, onBack, backLabel = 'Back', selectLabel = 'Select template', allowAllCategories = true }) => {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState<SportsFocus | 'all'>('all');
  const [style, setStyle] = useState<SportsTemplateDefinition['styleGroup'] | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [showAll, setShowAll] = useState(false);
  const [previewing, setPreviewing] = useState<SportsTemplateDefinition | null>(null);

  const pool = useMemo(() => getSportsTemplateList(showAll ? undefined : category), [category, showAll]);
  const shown = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = pool.filter((t) => {
      if (sport !== 'all' && !t.sports.includes(sport) && !t.sports.includes('any')) return false;
      if (style !== 'all' && t.styleGroup !== style) return false;
      if (!q) return true;
      return [t.name, t.tagline, t.description, t.categoryLabel, t.designStyle, t.badge, ...t.highlights].some((s) => s.toLowerCase().includes(q));
    });
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'style') return [...list].sort((a, b) => a.styleGroup.localeCompare(b.styleGroup) || a.name.localeCompare(b.name));
    return list;
  }, [pool, query, sport, style, sort]);

  const filtered = query !== '' || sport !== 'all' || style !== 'all';
  const reset = () => { setQuery(''); setSport('all'); setStyle('all'); };
  const pill = (active: boolean) => `rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? 'bg-dv-iris-600 text-white shadow-sm' : 'border border-dv-line bg-white text-dv-ink-2 hover:border-dv-iris-500/50'}`;
  const choose = (t: SportsTemplateDefinition) => onSelectTemplate(buildSportsTemplateMetadata(t));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-dv-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {onBack && <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-dv-line bg-white px-3 py-1.5 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink"><ArrowLeft className="h-3.5 w-3.5" />{backLabel}</button>}
          <h1 className="text-2xl font-extrabold tracking-tight text-dv-ink sm:text-3xl">{showAll ? 'Sports Template Library' : `${SPORTS_CATEGORY_LABELS[category]} templates`}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-dv-muted">{pool.length} original designs{showAll ? ' across Sports Club, Tournament Hub and Sports Academy' : ` made for ${SPORTS_CATEGORY_LABELS[category].toLowerCase()} websites`}. Open a live preview on desktop, tablet and mobile, then select one. The sample content you see is fictional; your client’s details replace it.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative sm:w-72">
            <Search aria-hidden className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dv-muted" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" aria-label="Search templates" className="w-full rounded-xl border border-dv-line bg-white py-2.5 pl-10 pr-9 text-sm text-dv-ink placeholder:text-dv-muted focus:border-dv-iris-500 focus:outline-none focus:ring-2 focus:ring-dv-iris-500/20" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-dv-muted hover:text-dv-ink"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-dv-line bg-white px-3 py-2 text-xs font-semibold text-dv-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort templates" className="bg-transparent text-sm font-semibold text-dv-ink focus:outline-none">
              <option value="recommended">Recommended</option>
              <option value="name">Name (A–Z)</option>
              <option value="style">Design style</option>
            </select>
          </label>
        </div>
      </header>

      <div className="space-y-3">
        <div role="tablist" aria-label="Filter by sport" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-dv-muted">Sport</span>
          {SPORT_FILTERS.map((f) => <button key={f.id} type="button" role="tab" aria-selected={sport === f.id} onClick={() => setSport(f.id)} className={pill(sport === f.id)}>{f.label}</button>)}
        </div>
        <div role="tablist" aria-label="Filter by design style" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-dv-muted">Style</span>
          {STYLE_FILTERS.map((f) => <button key={f.id} type="button" role="tab" aria-selected={style === f.id} onClick={() => setStyle(f.id)} className={pill(style === f.id)}>{f.label}</button>)}
        </div>
        {allowAllCategories && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-dv-ink-2">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4 rounded border-dv-line text-dv-iris-600" />
            Show templates from all categories
          </label>
        )}
      </div>

      <p className="text-xs text-dv-muted" role="status" aria-live="polite">Showing {shown.length} of {pool.length} templates{filtered ? ' (filtered)' : ''}</p>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-dv-line bg-white py-16 text-center">
          <SearchX className="h-8 w-8 text-dv-muted" />
          <p className="text-sm font-semibold text-dv-ink">No templates match these filters</p>
          <button type="button" onClick={reset} className="rounded-xl bg-dv-iris-600 px-4 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Reset filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => <SportsTemplateCard key={t.id} template={t} isSelected={selectedTemplateId === t.id} selectLabel={selectLabel} onPreview={setPreviewing} onSelect={choose} />)}
        </div>
      )}

      <SportsDemoModal template={previewing} onClose={() => setPreviewing(null)} onSelectTemplate={choose} isSelected={previewing ? selectedTemplateId === previewing.id : false} />
    </div>
  );
};
