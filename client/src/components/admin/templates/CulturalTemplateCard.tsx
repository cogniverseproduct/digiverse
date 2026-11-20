import React, { useState } from 'react';
import { Check, Eye, ArrowRight } from 'lucide-react';
import type { CulturalTemplateDefinition } from '../../../templates/cultural/types';

interface CulturalTemplateCardProps {
  template: CulturalTemplateDefinition;
  isSelected?: boolean;
  selectLabel?: string;
  onPreview: (t: CulturalTemplateDefinition) => void;
  onSelect: (t: CulturalTemplateDefinition) => void;
}

/** Gallery card for the Cultural template library. The image is a real screenshot of the template's own preview route. */
export const CulturalTemplateCard: React.FC<CulturalTemplateCardProps> = ({ template: t, isSelected, selectLabel = 'Select template', onPreview, onSelect }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const swatches = [...new Set([t.tokens.primaryColor, t.tokens.accentColor, t.tokens.secondaryColor].filter(Boolean) as string[])];
  return (
    <article
      data-template-id={t.id}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-dv-iris-600/10 ${isSelected ? 'border-dv-iris-500 ring-2 ring-dv-iris-500/30' : 'border-dv-line hover:border-dv-iris-500/40'}`}
    >
      <button type="button" onClick={() => onPreview(t)} aria-label={`Preview ${t.name}`} className="relative block aspect-[16/10] w-full overflow-hidden border-b border-dv-line bg-dv-mist">
        {!imgFailed ? (
          <img src={t.previewImage} alt={`${t.name} homepage preview`} loading="lazy" decoding="async" onError={() => setImgFailed(true)} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3" style={{ background: t.tokens.background }}>
            <span className="text-lg font-bold" style={{ color: t.tokens.textColor }}>{t.name}</span>
            <span className="flex gap-1.5">{swatches.map((c) => <span key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />)}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-dv-ink shadow-sm">{t.badge}</span>
        <span className="absolute inset-0 flex items-center justify-center bg-dv-ink/0 opacity-0 transition duration-300 group-hover:bg-dv-ink/25 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-dv-ink shadow-lg"><Eye className="h-3.5 w-3.5" />Live preview</span>
        </span>
        {isSelected && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white"><Check className="h-3 w-3" />In use</span>}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug text-dv-ink">{t.name}</h3>
          <span className="flex shrink-0 items-center gap-1 pt-1" aria-label="Palette">{swatches.map((c) => <span key={c} className="h-3.5 w-3.5 rounded-full border border-dv-line" style={{ background: c }} title={c} />)}</span>
        </div>
        <p className="mt-1 text-[12px] font-semibold text-dv-iris-700">{t.designStyle}</p>
        <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-dv-ink-2">{t.description}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {t.highlights.slice(0, 3).map((h) => <li key={h} className="rounded-full border border-dv-line bg-dv-mist px-2.5 py-1 text-[11px] font-medium text-dv-ink-2">{h}</li>)}
          {t.highlights.length > 3 && <li className="rounded-full px-1.5 py-1 text-[11px] font-medium text-dv-muted">+{t.highlights.length - 3} more</li>}
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button type="button" onClick={() => onPreview(t)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dv-line bg-white py-2.5 text-xs font-bold text-dv-ink transition hover:border-dv-iris-500 hover:text-dv-iris-700"><Eye className="h-3.5 w-3.5" />Preview</button>
          <button type="button" onClick={() => onSelect(t)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition ${isSelected ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-dv-iris-600 hover:bg-dv-iris-500'}`}>
            {isSelected ? <><Check className="h-3.5 w-3.5" />Selected</> : <>{selectLabel}<ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>
      </div>
    </article>
  );
};
