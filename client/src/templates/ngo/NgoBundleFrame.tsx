import React, { useEffect, useMemo, useState } from 'react';
import { loadBundle, renderBundleHtml, type NgoRenderMode } from './engine/render';
import type { NgoTemplateProps } from './types';
import { getNgoTemplateById } from './registry';
import { getNgoDemoData } from './demos/demoData';

/**
 * Shows one integrated third-party template in a sandboxed frame.
 *
 * The page is bound to the client's data BEFORE it runs (see engine/render.ts) and handed over as `srcdoc`.
 * The sandbox has no `allow-same-origin`, so the template's own scripts run in an opaque origin and cannot read the app's
 * storage or cookies. Forms are removed from live sites, so `allow-forms` is not granted either.
 */
export const NgoBundleFrame: React.FC<{
  templateId: string;
  entry?: string;
  mode: NgoRenderMode;
  className?: string;
  title?: string;
} & NgoTemplateProps> = ({ templateId, entry = 'index.html', mode, className = '', title, requirements, ngoData, website }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A stable signature so the frame only reloads when the content really changes.
  const signature = useMemo(() => JSON.stringify({ requirements: requirements || null, ngoData: ngoData || null, website: website || null }), [requirements, ngoData, website]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadBundle(templateId, entry)
      .then((loaded) => {
        if (cancelled) return;
        const data = mode === 'sample' ? undefined : { requirements, ngoData, website };
        const props = mode === 'sample' ? sampleProps(templateId) : (data as NgoTemplateProps);
        setHtml(renderBundleHtml(loaded, props, mode, window.location.origin));
      })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the template.'); });
    return () => { cancelled = true; };
    // `signature` stands in for the object props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, entry, mode, signature]);

  if (error) {
    return (
      <div role="alert" className={`flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-slate-600 ${className}`}>
        This template could not be shown. {error}
      </div>
    );
  }
  if (html === null) return <div aria-busy="true" aria-label="Loading template" className={`min-h-[320px] bg-white ${className}`} />;
  return (
    <div className={`relative ${className}`}>
      {mode !== 'live' && (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow">
          {mode === 'original' ? "Original template sample content" : 'Sample content: fictional organisation'}
        </span>
      )}
      <iframe
        title={title || 'Website preview'}
        srcDoc={html}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        className="block h-full min-h-[480px] w-full border-0 bg-white"
        data-ngo-frame={mode}
      />
    </div>
  );
};


function sampleProps(templateId: string): NgoTemplateProps {
  const t = getNgoTemplateById(templateId);
  return { requirements: { organizationName: 'Riverbend Community Trust' }, ngoData: getNgoDemoData(t?.archetype ?? 'grassroots_ngo'), isDemo: true };
}

export default NgoBundleFrame;
