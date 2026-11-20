import React from 'react';
import { NgoLiveFrame, type PreviewViewport } from './NgoLiveFrame';
import { getNgoTemplateById } from './registry';
import type { NgoTemplateProps } from './types';

/**
 * Renders the Social & NGO template a project selected. An unknown or missing id is shown as a visible "not available" state;
 * a project is never silently given a different design.
 */
export const NgoTemplateDispatcher: React.FC<{ templateId?: string | null; viewport?: PreviewViewport; fill?: boolean } & NgoTemplateProps> = ({
  templateId, viewport = 'desktop', fill = false, requirements, ngoData, website,
}) => {
  const template = getNgoTemplateById(templateId);
  if (!template) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-10 text-center text-sm text-slate-600">
        The website design “{templateId || 'none'}” is not available. Pick a design from the template library to continue.
      </div>
    );
  }
  return <NgoLiveFrame templateId={template.id} viewport={viewport} fill={fill} requirements={requirements} ngoData={ngoData} website={website} mode="live" />;
};

export default NgoTemplateDispatcher;
