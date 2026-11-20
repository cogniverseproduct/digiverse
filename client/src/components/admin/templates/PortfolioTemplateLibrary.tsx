import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PortfolioTemplateDefinition, PortfolioFilterCategory } from '../../../templates/portfolio/types';
import { FILTER_OPTIONS, getPortfolioTemplateList } from '../../../templates/portfolio/registry';
import { PortfolioDemoModal } from './PortfolioDemoModal';
import { PortfolioTemplateCard } from './PortfolioTemplateCard';
import { Search, ArrowRight, Plus, FolderKanban, X, SearchX } from 'lucide-react';
import type { ClientProject, SelectedTemplateMetadata } from '../../../types/admin';
import type { PortfolioArchetype } from '../../../types/portfolio';
import { PROFESSIONS, PROFESSION_ORDER } from '../../../templates/portfolio/professions';

interface PortfolioTemplateLibraryProps {
  currentProject?: ClientProject | null;
  projects?: ClientProject[];
  onSelectTemplate?: (template: SelectedTemplateMetadata, targetProjectId?: string) => void;
  /** Called with the template and the profession chosen in the dialog. */
  onCreateProjectWithTemplate?: (template: SelectedTemplateMetadata, archetype: PortfolioArchetype) => void;
  onBack?: () => void;
  /** Rendered inside the Portfolio Engine page: the page supplies the heading and back link. */
  embedded?: boolean;
}

type SortKey = 'recommended' | 'name' | 'category';

export const buildPortfolioTemplateMetadata = (tmpl: PortfolioTemplateDefinition): SelectedTemplateMetadata => ({
  templateId: tmpl.id,
  templateVersion: tmpl.version,
  templateName: tmpl.name,
  websiteCategory: tmpl.category,
  selectedAt: new Date().toISOString(),
  designTokens: {
    primaryColor: tmpl.tokens.primaryColor,
    accentColor: tmpl.tokens.accentColor,
    fontFamily: tmpl.tokens.fontFamily,
    headingFont: tmpl.tokens.headingFont,
    layoutPreset: tmpl.tokens.layoutPreset
  }
});

export const PortfolioTemplateLibrary: React.FC<PortfolioTemplateLibraryProps> = ({ currentProject, projects = [], onSelectTemplate, onCreateProjectWithTemplate, onBack, embedded = false }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PortfolioFilterCategory>('all');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [previewTemplate, setPreviewTemplate] = useState<PortfolioTemplateDefinition | null>(null);
  const [picker, setPicker] = useState<PortfolioTemplateDefinition | null>(null);
  const [pickerArchetype, setPickerArchetype] = useState<PortfolioArchetype>('developer');

  const all = useMemo(() => getPortfolioTemplateList(), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    all.forEach((t) => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, [all]);

  const shown = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = all.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (!q) return true;
      return [t.name, t.tagline, t.description, t.categoryLabel, t.designStyle, t.badge, ...t.highlights].some((s) => s.toLowerCase().includes(q));
    });
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'category') return [...list].sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel) || a.name.localeCompare(b.name));
    return list;
  }, [all, category, query, sort]);

  const activeId = currentProject?.requirements?.selectedTemplate?.templateId;
  const portfolioProjects = projects.filter((p) => p.requirements?.category === 'portfolio');

  const use = (t: PortfolioTemplateDefinition) => {
    if (currentProject) onSelectTemplate?.(buildPortfolioTemplateMetadata(t), currentProject.id);
    else { setPickerArchetype(t.archetype); setPicker(t); }
  };

  return (
    <div className="space-y-6">
      <header className={`flex flex-col gap-4 border-b border-dv-line pb-5 lg:flex-row lg:items-end ${embedded ? 'lg:justify-end' : 'lg:justify-between'}`}>
        {!embedded && (
          <div>
            {onBack && <button type="button" onClick={onBack} className="mb-3 rounded-lg border border-dv-line bg-white px-3 py-1.5 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink">&larr; Back</button>}
            <h1 className="text-2xl font-extrabold tracking-tight text-dv-ink sm:text-3xl">Portfolio Template Library</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-dv-muted">{all.length} professionally designed portfolio websites. Preview any of them full-size on desktop, tablet and mobile, then apply one to a client project. The client’s content fills the template automatically.</p>
          </div>
        )}
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
              <option value="category">Category</option>
            </select>
          </label>
        </div>
      </header>

      <div role="tablist" aria-label="Filter by profession" className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={category === f.id} onClick={() => setCategory(f.id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${category === f.id ? 'bg-dv-iris-600 text-white shadow-md shadow-dv-iris-600/25' : 'border border-dv-line bg-white text-dv-ink-2 hover:border-dv-iris-500/50 hover:text-dv-ink'}`}>
            {f.label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${category === f.id ? 'bg-white/20' : 'bg-dv-mist text-dv-muted'}`}>{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-dv-muted" role="status" aria-live="polite">Showing {shown.length} of {all.length} templates</p>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-dv-line bg-white py-16 text-center">
          <SearchX className="h-8 w-8 text-dv-muted" />
          <p className="text-sm font-semibold text-dv-ink">No templates match your search</p>
          <button type="button" onClick={() => { setQuery(''); setCategory('all'); }} className="rounded-xl bg-dv-iris-600 px-4 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Reset filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => <PortfolioTemplateCard key={t.id} template={t} isSelected={activeId === t.id} selectLabel={currentProject ? 'Use template' : 'Select'} onPreview={setPreviewTemplate} onSelect={use} />)}
        </div>
      )}

      <PortfolioDemoModal template={previewTemplate} isOpen={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} onSelectTemplate={use} isSelected={previewTemplate ? activeId === previewTemplate.id : false} />

      {/* Portalled to <body>: inside the engine stage a blurred ancestor would trap `fixed` and push the dialog off-screen. */}
      {picker && createPortal(
        <div role="dialog" aria-modal="true" aria-label={`Apply ${picker.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/50 p-4 backdrop-blur-sm" onKeyDown={(e) => { if (e.key === 'Escape') setPicker(null); }}>
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-dv-line bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-dv-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-dv-ink">Apply {picker.name}</h3>
                <p className="mt-0.5 text-xs text-dv-muted">Choose where to use this template.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setPicker(null)} className="rounded-lg p-1 text-dv-muted hover:text-dv-ink"><X className="h-5 w-5" /></button>
            </div>
            {onCreateProjectWithTemplate && (
              <div className="space-y-3 rounded-xl border border-dashed border-dv-iris-500/50 bg-dv-iris-50 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-dv-muted" htmlFor="picker-archetype">Profession for this portfolio</label>
                <select id="picker-archetype" value={pickerArchetype} onChange={(e) => setPickerArchetype(e.target.value as PortfolioArchetype)} className="w-full rounded-lg border border-dv-line bg-white px-3 py-2 text-sm text-dv-ink focus:border-dv-iris-500 focus:outline-none">
                  {PROFESSION_ORDER.map((id) => <option key={id} value={id}>{PROFESSIONS[id].label}{id === picker.archetype ? ' (recommended for this template)' : ''}</option>)}
                </select>
                <button type="button" onClick={() => { onCreateProjectWithTemplate(buildPortfolioTemplateMetadata(picker), pickerArchetype); setPicker(null); }} className="group flex w-full items-center justify-between rounded-xl bg-dv-iris-600 p-3.5 text-left text-white transition hover:bg-dv-iris-500">
                  <span className="flex items-center gap-3"><Plus className="h-5 w-5" /><span><span className="block text-sm font-bold">Create a new portfolio project</span><span className="block text-xs text-white/80">Start the client intake with this template</span></span></span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
            {portfolioProjects.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dv-muted"><FolderKanban className="h-3.5 w-3.5" />Or apply to an existing portfolio project</div>
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {portfolioProjects.map((p) => (
                    <button key={p.id} type="button" onClick={() => { onSelectTemplate?.(buildPortfolioTemplateMetadata(picker), p.id); setPicker(null); }} className="flex w-full items-center justify-between rounded-lg border border-dv-line bg-white p-3 text-left transition hover:border-dv-iris-500/60">
                      <span><span className="block text-sm font-semibold text-dv-ink">{p.requirements?.organizationName || p.tenantSlug}</span><span className="block text-xs text-dv-muted">Currently: {p.requirements?.selectedTemplate?.templateName || 'default template'}</span></span>
                      <span className="text-xs font-semibold text-dv-iris-700">Apply &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-dv-mist px-3 py-2.5 text-xs text-dv-muted">There are no portfolio projects yet. Create one to use this template.</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
