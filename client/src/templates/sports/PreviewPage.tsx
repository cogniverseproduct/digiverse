import React, { useEffect, useMemo, useState } from 'react';
import { SportsTemplateDispatcher } from './SportsTemplateDispatcher';
import { getSportsTemplateById } from './registry';
import type { SportsTemplateProps } from './types';

type Payload = Pick<SportsTemplateProps, 'requirements' | 'sportsData' | 'website'>;

/**
 * Standalone live preview of one Sports template (`/?template-preview=<id>`). It renders the same component
 * a published site uses, with the template's fictional demo content (clearly badged), or real project
 * content sent by the parent window via postMessage.
 */
export const PreviewPage: React.FC<{ templateId: string }> = ({ templateId }) => {
  const template = getSportsTemplateById(templateId);
  const demo = useMemo(() => (template ? template.getDemoData() : null), [template]);
  const [override, setOverride] = useState<Payload | null>(null);

  useEffect(() => {
    document.title = template ? `${template.name} – Sports template preview` : 'Template preview';
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
      if (d?.type === 'dv-sports-data' && d.requirements && d.sportsData && d.website) setOverride({ requirements: d.requirements, sportsData: d.sportsData, website: d.website });
    };
    window.addEventListener('message', onMsg);
    // Tell an embedding parent we are listening, so it (re)sends the project data.
    if (window.parent !== window) window.parent.postMessage({ type: 'dv-sports-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!template || !demo) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Template not found</h1>
        <p style={{ color: '#667', marginTop: '.5rem' }}>No Sports template is registered with the id “{templateId}”.</p>
      </div>
    );
  }
  if (live && !override) return <div style={{ minHeight: '100vh' }} aria-busy="true" aria-label="Loading preview" />;
  const data = override || demo;
  return <SportsTemplateDispatcher templateId={template.id} {...data} activePage="/" onNavigate={() => undefined} isDemo={!override} />;
};

export default PreviewPage;
