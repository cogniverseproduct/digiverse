import React, { useEffect, useMemo, useState } from 'react';
import { PortfolioTemplateDispatcher } from './PortfolioTemplateDispatcher';
import { getPortfolioTemplateById } from './registry';
import type { PortfolioTemplateProps } from './types';

type Payload = Pick<PortfolioTemplateProps, 'requirements' | 'portfolioData' | 'website'>;

/**
 * Standalone live preview of one template (`/?template-preview=<id>`). It renders the complete homepage
 * with the template's demo content (or real project content sent by the parent window via postMessage),
 * so it behaves exactly like a published site: scrollable, animated and responsive to its own width.
 */
export const PreviewPage: React.FC<{ templateId: string }> = ({ templateId }) => {
  const template = getPortfolioTemplateById(templateId);
  const demo = useMemo(() => (template ? template.getDemoData() : null), [template]);
  const [override, setOverride] = useState<Payload | null>(null);

  useEffect(() => {
    document.title = template ? `${template.name} – Portfolio template preview` : 'Template preview';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
  }, [template]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string } & Partial<Payload>;
      if (d?.type === 'dv-portfolio-data' && d.requirements && d.portfolioData && d.website) {
        setOverride({ requirements: d.requirements, portfolioData: d.portfolioData, website: d.website });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!template || !demo) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Template not found</h1>
        <p style={{ color: '#667', marginTop: '.5rem' }}>No template is registered with the id “{templateId}”.</p>
      </div>
    );
  }
  const data = override || demo;
  const merged = override
    ? { ...override, website: { ...override.website, selectedTemplate: override.website.selectedTemplate?.templateId === template.id ? override.website.selectedTemplate : demo.website.selectedTemplate } }
    : data;
  return <PortfolioTemplateDispatcher {...merged} activePage="/" onNavigate={() => undefined} isDemo={!override} />;
};

export default PreviewPage;
