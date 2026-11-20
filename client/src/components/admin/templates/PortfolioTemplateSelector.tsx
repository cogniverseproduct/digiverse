import React, { useMemo, useState } from 'react';
import type { PortfolioTemplateDefinition, PortfolioFilterCategory } from '../../../templates/portfolio/types';
import type { PortfolioArchetype } from '../../../types/portfolio';
import { FILTER_OPTIONS, LEGACY_TEMPLATES, getPortfolioTemplateList, isLegacyTemplateId, PORTFOLIO_TEMPLATES } from '../../../templates/portfolio/registry';
import { PortfolioDemoModal } from './PortfolioDemoModal';
import { PortfolioTemplateCard } from './PortfolioTemplateCard';
import { buildPortfolioTemplateMetadata } from './PortfolioTemplateLibrary';
import { CheckCircle2, Info } from 'lucide-react';
import type { SelectedTemplateMetadata } from '../../../types/admin';

interface PortfolioTemplateSelectorProps {
  category?: PortfolioFilterCategory;
  /** Templates matching this archetype are listed first. */
  archetype?: PortfolioArchetype;
  selectedTemplate?: SelectedTemplateMetadata;
  onSelect: (metadata: SelectedTemplateMetadata) => void;
}

/** Template step of the portfolio wizard: the same cards, previews and filters as the library. */
export const PortfolioTemplateSelector: React.FC<PortfolioTemplateSelectorProps> = ({ category = 'all', archetype, selectedTemplate, onSelect }) => {
  const [preview, setPreview] = useState<PortfolioTemplateDefinition | null>(null);
  const [filter, setFilter] = useState<PortfolioFilterCategory>(category);

  const list = useMemo(() => {
    const all = getPortfolioTemplateList().filter((t) => filter === 'all' || t.category === filter);
    return archetype ? [...all].sort((a, b) => Number(b.archetype === archetype) - Number(a.archetype === archetype)) : all;
  }, [filter, archetype]);

  const activeId = selectedTemplate?.templateId;
  const legacy = isLegacyTemplateId(activeId) ? LEGACY_TEMPLATES[activeId] : null;
  const choose = (t: PortfolioTemplateDefinition) => onSelect(buildPortfolioTemplateMetadata(t));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-dv-line bg-dv-mist p-4 text-xs leading-relaxed text-dv-ink-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-dv-iris-700" />
        <p>Pick the design that suits the client’s profession. Use <b>Preview</b> to scroll the full homepage on desktop, tablet and mobile. The details you enter in the next steps fill the chosen template.</p>
      </div>

      {legacy && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          This project uses the retired template <b>{legacy.name}</b>. It keeps working, but choose a template below to move to the current library (suggested: <b>{PORTFOLIO_TEMPLATES[legacy.replacedBy].name}</b>).
        </div>
      )}

      <div role="tablist" aria-label="Filter by profession" className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === f.id ? 'bg-dv-iris-600 text-white' : 'border border-dv-line bg-white text-dv-ink-2 hover:border-dv-iris-500/50'}`}>{f.label}</button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => <PortfolioTemplateCard key={t.id} template={t} isSelected={activeId === t.id} onPreview={setPreview} onSelect={choose} />)}
      </div>

      {selectedTemplate && !legacy && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-5 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>Selected template: <strong>{selectedTemplate.templateName}</strong> (version {selectedTemplate.templateVersion})</span>
        </div>
      )}

      <PortfolioDemoModal template={preview} isOpen={Boolean(preview)} onClose={() => setPreview(null)} onSelectTemplate={choose} isSelected={preview ? activeId === preview.id : false} />
    </div>
  );
};
