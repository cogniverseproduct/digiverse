import React, { useState } from 'react';
import { Check, Eye, ArrowRight } from 'lucide-react';
import type { NgoTemplateDefinition } from '../../../templates/ngo/types';

interface NgoTemplateCardProps {
  template: NgoTemplateDefinition;
  isSelected?: boolean;
  selectLabel?: string;
  onPreview: (t: NgoTemplateDefinition) => void;
  onSelect: (t: NgoTemplateDefinition) => void;
}

/** Gallery card for the Social & NGO library. The image is a real screenshot of the integrated template; the source line names its author and licence. */
export const NgoTemplateCard: React.FC<NgoTemplateCardProps> = ({ template: t, isSelected, selectLabel = 'Select template', onPreview, onSelect }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <article
      data-template-id={t.id}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-dv-iris-600/10 ${isSelected ? 'border-dv-iris-500 ring-2 ring-dv-iris-500/30' : 'border-dv-line'}`}
    >
      <button type="button" onClick={() => onPreview(t)} aria-label={`Preview ${t.name}`} className="relative block aspect-[16/10] w-full overflow-hidden border-b border-dv-line bg-dv-mist">
        {!imgFailed ? (
          <img src={t.previewImage} alt={`${t.name} homepage preview`} loading="lazy" decoding="async" onError={() => setImgFailed(true)} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-dv-ink">{t.name}</div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-dv-ink/0 opacity-0 transition duration-300 group-hover:bg-dv-ink/25 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-dv-ink shadow-lg"><Eye className="h-3.5 w-3.5" />Live preview</span>
        </span>
        {isSelected && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white"><Check className="h-3 w-3" />In use</span>}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-dv-ink">{t.name}</h3>
        <p className="mt-1 text-[12px] font-semibold text-dv-iris-700">{t.designStyle}</p>
        <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-dv-ink-2">{t.description}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {t.highlights.slice(0, 3).map((h) => <li key={h} className="rounded-full border border-dv-line bg-dv-mist px-2.5 py-1 text-[11px] font-medium text-dv-ink-2">{h}</li>)}
          {t.highlights.length > 3 && <li className="rounded-full px-1.5 py-1 text-[11px] font-medium text-dv-muted">+{t.highlights.length - 3} more</li>}
        </ul>
        <p className="mt-4 text-[11px] leading-5 text-dv-muted" data-testid="template-source">
          Design by {t.source.author} · <span className="font-semibold">{t.source.license}</span> licence
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button type="button" onClick={() => onPreview(t)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dv-line bg-white py-2.5 text-xs font-bold text-dv-ink transition hover:border-dv-iris-500/50"><Eye className="h-3.5 w-3.5" />Preview</button>
          <button type="button" onClick={() => onSelect(t)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition ${isSelected ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-dv-iris-600 hover:bg-dv-iris-500'}`}>
            {isSelected ? <><Check className="h-3.5 w-3.5" />Selected</> : <>{selectLabel}<ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>
      </div>
    </article>
  );
};
