import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Monitor, Tablet, Smartphone, Check, ExternalLink, Loader2 } from 'lucide-react';
import type { CulturalTemplateDefinition } from '../../../templates/cultural/types';

interface CulturalDemoModalProps {
  template: CulturalTemplateDefinition | null;
  onClose: () => void;
  onSelectTemplate?: (template: CulturalTemplateDefinition) => void;
  isSelected?: boolean;
}

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%', icon: Monitor },
  tablet: { label: 'Tablet', width: '820px', icon: Tablet },
  mobile: { label: 'Mobile', width: '390px', icon: Smartphone }
} as const;

/** URL of the standalone live preview (rendered by templates/cultural/PreviewPage). */
export const culturalPreviewUrl = (id: string) => `/?template-preview=${encodeURIComponent(id)}`;

/**
 * Full-size live preview. The template renders in an iframe so Desktop / Tablet / Mobile are real viewport widths and the design's
 * responsive breakpoints actually change. Portalled to <body> because the engine stage has a blur filter that would trap `fixed`.
 */
export const CulturalDemoModal: React.FC<CulturalDemoModalProps> = ({ template, onClose, onSelectTemplate, isSelected }) => {
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>('desktop');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [template?.id]);
  useEffect(() => {
    if (!template) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [template, onClose]);

  if (!template) return null;
  const url = culturalPreviewUrl(template.id);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${template.name} live preview`} className="fixed inset-0 z-50 flex flex-col bg-dv-ink/80 backdrop-blur-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-dv-ink">{template.name}</div>
          <div className="truncate text-[11px] text-dv-muted">{template.categoryLabel} · {template.designStyle}</div>
        </div>
        <div role="group" aria-label="Preview size" className="flex items-center gap-1 rounded-xl border border-dv-line bg-dv-mist p-1">
          {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((k) => {
            const V = VIEWPORTS[k];
            return (
              <button key={k} type="button" aria-pressed={viewport === k} onClick={() => setViewport(k)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewport === k ? 'bg-white text-dv-ink shadow-sm' : 'text-dv-muted hover:text-dv-ink'}`}>
                <V.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{V.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-xl border border-dv-line px-3 py-2 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink sm:inline-flex"><ExternalLink className="h-3.5 w-3.5" />Open in new tab</a>
          {onSelectTemplate && (
            <button type="button" onClick={() => { onSelectTemplate(template); onClose(); }} className="inline-flex items-center gap-1.5 rounded-xl bg-dv-iris-600 px-4 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">
              <Check className="h-3.5 w-3.5" />{isSelected ? 'Keep this template' : 'Select template'}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close preview" className="flex h-9 w-9 items-center justify-center rounded-xl border border-dv-line text-dv-ink-2 hover:text-dv-ink"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-0 sm:p-4">
        <div className={`relative h-full bg-white transition-[width] duration-300 ${viewport === 'desktop' ? 'w-full' : 'rounded-[28px] border-[10px] border-dv-ink shadow-2xl'}`} style={{ width: VIEWPORTS[viewport].width, maxWidth: '100%' }}>
          {!loaded && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white text-xs text-dv-muted"><Loader2 className="h-5 w-5 animate-spin text-dv-iris-600" />Loading live preview…</div>}
          <iframe key={template.id} title={`${template.name} live preview`} src={url} onLoad={() => setLoaded(true)} className={`h-full w-full bg-white ${viewport === 'desktop' ? '' : 'rounded-[18px]'}`} />
        </div>
      </div>
    </div>,
    document.body
  );
};
