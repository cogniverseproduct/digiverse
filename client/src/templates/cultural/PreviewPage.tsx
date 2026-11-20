import React, { useEffect, useMemo, useState } from 'react';
import { CulturalTemplateDispatcher } from './CulturalTemplateDispatcher';
import { getCulturalTemplateById } from './registry';
import type { CulturalTemplateProps } from './types';

type Payload = Pick<CulturalTemplateProps, 'requirements' | 'culturalData' | 'website'>;

/**
 * Standalone live preview of one Cultural template (`/?template-preview=<id>`). It renders the same component a
 * published site uses, with the template's fictional demo content (clearly badged), or real project content
 * sent by the parent window via postMessage.
 */
export const PreviewPage: React.FC<{ templateId: string }> = ({ templateId }) => {
  const template = getCulturalTemplateById(templateId);
  const demo = useMemo(() => (template ? template.getDemoData() : null), [template]);
  const [override, setOverride] = useState<Payload | null>(null);

  useEffect(() => {
    document.title = template ? `${template.name} – Cultural template preview` : 'Template preview';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
  }, [template]);

  // `live=1`: the parent window (Studio / client preview) will send the real project, so never flash sample content.
  const live = useMemo(() => new URLSearchParams(window.location.search).get('live') === '1', []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string } & Partial<Payload>;
      if (d?.type === 'dv-cultural-data' && d.requirements && d.culturalData && d.website) setOverride({ requirements: d.requirements, culturalData: d.culturalData, website: d.website });
    };
    window.addEventListener('message', onMsg);
    // Tell an embedding parent we are listening, so it (re)sends the project data.
    if (window.parent !== window) window.parent.postMessage({ type: 'dv-cultural-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!template || !demo) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Template not found</h1>
        <p style={{ color: '#667', marginTop: '.5rem' }}>No Cultural template is registered with the id “{templateId}”.</p>
      </div>
    );
  }
  if (live && !override) return <div style={{ minHeight: '100vh' }} aria-busy="true" aria-label="Loading preview" />;
  const data = override || demo;
  return <CulturalTemplateDispatcher templateId={template.id} {...data} activePage="/" onNavigate={() => undefined} isDemo={!override} />;
};

export default PreviewPage;
