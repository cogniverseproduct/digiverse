import type { ClientRequirements } from '../types/index.js';

/**
 * The Event template library as the server knows it. It mirrors the client registry
 * (client/src/templates/event/ids.ts and registry.ts); server/test/unit/eventTemplateLibrary.test.ts fails if the two ever drift apart.
 *
 * Categories (fixed): conference_seminar, festival_concert, corporate_business, exhibition_trade, wedding_private, award_ceremony,
 * launch_reveal. Project category: `event`. A category with no qualifying template has an empty list and cannot be started.
 * Every template is a real third-party design (see client/src/templates/event/EVENT_TEMPLATE_SOURCES.md).
 */
export const EVENT_CATEGORY_IDS = [
  'conference_seminar', 'festival_concert', 'corporate_business', 'exhibition_trade', 'wedding_private', 'award_ceremony', 'launch_reveal'
] as const;
export type EventCategoryId = (typeof EVENT_CATEGORY_IDS)[number];

export const EVENT_TEMPLATE_IDS_BY_CATEGORY: Record<EventCategoryId, readonly string[]> = {
  conference_seminar: ['conference-shift26'],
  festival_concert: ['festival-ondo', 'festival-cutshort'],
  corporate_business: [],
  exhibition_trade: ['exhibition-nocturna', 'exhibition-wrenfield'],
  wedding_private: ['wedding-evermore'],
  award_ceremony: [],
  launch_reveal: ['launch-aube']
};

export const ALL_EVENT_TEMPLATE_IDS: readonly string[] = EVENT_CATEGORY_IDS.flatMap((c) => EVENT_TEMPLATE_IDS_BY_CATEGORY[c]);

/** Project category handled by this engine. */
export const isEventCategory = (category: unknown): boolean => category === 'event';

/** True when a project's requirements belong to the Event engine. */
export const isEventReqs = (r?: { category?: string; organizationType?: string }): boolean =>
  isEventCategory(r?.category) || isEventCategory(r?.organizationType);

const CATEGORIES = new Set<string>(EVENT_CATEGORY_IDS);
const TEMPLATES = new Set<string>(ALL_EVENT_TEMPLATE_IDS);

export const isKnownEventCategory = (id: unknown): boolean => typeof id === 'string' && CATEGORIES.has(id);
export const isEventLibraryTemplate = (id: unknown): boolean => typeof id === 'string' && TEMPLATES.has(id);

/** The category a library template belongs to, or undefined for unknown ids. */
export function eventCategoryForTemplate(templateId: unknown): EventCategoryId | undefined {
  return typeof templateId === 'string' ? EVENT_CATEGORY_IDS.find((c) => EVENT_TEMPLATE_IDS_BY_CATEGORY[c].includes(templateId)) : undefined;
}

/** True when a project renders through a library template (as opposed to the legacy inline renderer). */
export const usesEventLibraryTemplate = (r?: Partial<ClientRequirements>): boolean => isEventLibraryTemplate(r?.selectedTemplate?.templateId);

/**
 * Returns a message when the event-specific fields are invalid, or null. Only fields that are present are checked.
 * `selectedTemplate` is shared with the other engines, so it is judged for Event projects only. `existingCategory` is the event
 * category already stored on the project. An unknown event category is rejected (it is never silently replaced).
 */
export function validateEventFields(
  reqs: Partial<ClientRequirements>,
  category: string | undefined,
  existingCategory?: string
): string | null {
  if (reqs.eventCategory !== undefined && !isKnownEventCategory(reqs.eventCategory)) {
    return `Unknown event category "${String(reqs.eventCategory)}".`;
  }
  if (!isEventCategory(category)) return null;
  if (reqs.selectedTemplate === undefined || reqs.selectedTemplate === null) return null;

  const templateId = reqs.selectedTemplate.templateId;
  if (!isEventLibraryTemplate(templateId)) return `Unknown Event template "${String(templateId)}".`;

  const owner = eventCategoryForTemplate(templateId);
  const eventCategory = (reqs.eventCategory ?? existingCategory) as string | undefined;
  if (eventCategory && owner !== eventCategory) return `Template "${String(templateId)}" belongs to ${owner}, not ${eventCategory}.`;
  return null;
}
