import React from 'react';
import { NgoBundleFrame } from './NgoBundleFrame';
import type { NgoTemplateProps } from './types';
import type { NgoRenderMode } from './engine/render';

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
const WIDTH: Record<PreviewViewport, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };

/**
 * A real viewport for a Social & NGO template. The template renders in its own frame, so its CSS breakpoints react to the
 * chosen device width exactly as they would on that device. Used by the Studio, Client Preview and the published site.
 */
export const NgoLiveFrame: React.FC<{ templateId: string; viewport?: PreviewViewport; mode?: NgoRenderMode; className?: string; fill?: boolean } & NgoTemplateProps> = ({
  templateId, viewport = 'desktop', mode = 'live', className = '', fill = false, requirements, ngoData, website,
}) => (
  <div
    className={`mx-auto transition-[max-width] duration-300 ${viewport === 'desktop' ? '' : 'overflow-hidden rounded-2xl border-4 border-slate-200 shadow-xl'} ${className}`}
    style={{ maxWidth: WIDTH[viewport], width: '100%', ...(fill ? { height: '100vh' } : {}) }}
    data-ngo-live-frame={viewport}
  >
    <NgoBundleFrame
      templateId={templateId} mode={mode} title={`Website preview (${viewport})`}
      className={fill ? 'h-full' : 'h-[78vh]'} requirements={requirements} ngoData={ngoData} website={website}
    />
  </div>
);

export default NgoLiveFrame;
