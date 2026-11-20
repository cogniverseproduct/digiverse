import React from 'react';
import { EventLiveFrame, type PreviewViewport } from './EventLiveFrame';
import { getEventTemplateById } from './registry';
import type { EventTemplateProps } from './types';

/**
 * Renders the event template a project selected. An unknown or missing id is shown as a visible "not available" state;
 * a project is never silently given a different design.
 */
export const EventTemplateDispatcher: React.FC<{ templateId?: string | null; viewport?: PreviewViewport; fill?: boolean } & EventTemplateProps> = ({
  templateId, viewport = 'desktop', fill = false, requirements, eventData, website,
}) => {
  const template = getEventTemplateById(templateId);
  if (!template) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-10 text-center text-sm text-slate-600">
        The website design “{templateId || 'none'}” is not available. Pick a design from the template library to continue.
      </div>
    );
  }
  return <EventLiveFrame templateId={template.id} viewport={viewport} fill={fill} requirements={requirements} eventData={eventData} website={website} mode="live" />;
};

export default EventTemplateDispatcher;
