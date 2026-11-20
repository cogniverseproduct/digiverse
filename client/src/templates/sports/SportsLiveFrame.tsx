import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SportsTemplateProps } from './types';

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

/** Same widths as the template library's demo modal, so the three preview surfaces agree. */
const WIDTH: Record<PreviewViewport, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };

type Payload = Pick<SportsTemplateProps, 'requirements' | 'sportsData' | 'website'>;

/**
 * A real viewport for a Sports template. The design renders inside an iframe, so its CSS breakpoints react to the
 * chosen device width (a max-width wrapper cannot do that). The iframe loads the standalone preview route, which
 * renders the very same dispatcher/design a published site uses, with this project's content sent by postMessage.
 * Same-origin only on both sides.
 */
export const SportsLiveFrame: React.FC<{ templateId: string; viewport?: PreviewViewport; className?: string } & Payload> = ({
  templateId, requirements, sportsData, website, viewport = 'desktop', className = ''
}) => {
  const ref = useRef<HTMLIFrameElement>(null);
  // Plain-data copy: postMessage cannot clone functions or class instances.
  const payload = useMemo<Payload>(() => JSON.parse(JSON.stringify({ requirements, sportsData, website })), [requirements, sportsData, website]);
  const latest = useRef(payload);
  latest.current = payload;

  const send = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: 'dv-sports-data', ...latest.current }, window.location.origin);
  }, []);

  useEffect(() => { send(); }, [payload, send]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if ((e.data as { type?: string })?.type === 'dv-sports-ready') send();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [send]);

  return (
    <div className={`mx-auto transition-[max-width] duration-300 ${viewport === 'desktop' ? '' : 'overflow-hidden rounded-2xl border-4 border-slate-200 shadow-xl'} ${className}`} style={{ maxWidth: WIDTH[viewport], width: '100%' }} data-sports-live-frame={viewport}>
      <iframe
        ref={ref}
        title={`Website preview (${viewport})`}
        src={`/?template-preview=${encodeURIComponent(templateId)}&live=1`}
        onLoad={send}
        className="block h-[78vh] min-h-[480px] w-full border-0 bg-white"
      />
    </div>
  );
};

export default SportsLiveFrame;
