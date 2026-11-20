import React, { useEffect, useMemo } from 'react';
import { EventBundleFrame } from './EventBundleFrame';
import { getEventTemplateById } from './registry';
import type { EventRenderMode } from './engine/render';

/**
 * Standalone preview of one event template (`/?template-preview=<id>`), used by the library's "Open in new tab", the demo modal
 * and screenshot capture. `?view=original` (default) shows the upstream template as published; `?view=sample` binds a fictional
 * event through the mapping to show how a client's data lands. Never indexed.
 */
export const PreviewPage: React.FC<{ templateId: string }> = ({ templateId }) => {
  const template = getEventTemplateById(templateId);
  const mode = useMemo<EventRenderMode>(() => (new URLSearchParams(window.location.search).get('view') === 'sample' ? 'sample' : 'original'), []);

  useEffect(() => {
    document.title = template ? `${template.name} – Event template preview` : 'Template preview';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
  }, [template]);

  if (!template) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Template not found</h1>
        <p style={{ color: '#667', marginTop: '.5rem' }}>No event template is registered with the id “{templateId}”.</p>
      </div>
    );
  }
  return <EventBundleFrame templateId={template.id} mode={mode} title={`${template.name} preview`} className="h-screen" />;
};

export default PreviewPage;
