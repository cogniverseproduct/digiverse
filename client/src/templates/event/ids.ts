/**
 * Event template ids. Dependency-free so the server catalog, unit tests and the preview route can import it without React.
 * The server mirrors these lists in `server/src/services/eventCatalog.ts`; a unit test fails if they drift.
 *
 * Every id is a real third-party website template integrated from a source whose terms allow it (see EVENT_TEMPLATE_SOURCES.md).
 * The seven categories are fixed. A category with no qualifying template has an empty list and is shown as unavailable; nothing is
 * invented to fill it. Ids are kebab-case and must stay disjoint from the Sports, Cultural, Social & NGO and Portfolio ids
 * (main.tsx routes the preview page by id).
 */
export type EventCategoryId =
  | 'conference_seminar' | 'festival_concert' | 'corporate_business' | 'exhibition_trade'
  | 'wedding_private' | 'award_ceremony' | 'launch_reveal';

export const EVENT_CATEGORY_IDS: readonly EventCategoryId[] = [
  'conference_seminar', 'festival_concert', 'corporate_business', 'exhibition_trade', 'wedding_private', 'award_ceremony', 'launch_reveal',
];

export const EVENT_CATEGORY_LABELS: Record<EventCategoryId, string> = {
  conference_seminar: 'Conference & Seminar',
  festival_concert: 'Festival & Concert',
  corporate_business: 'Corporate & Business Events',
  exhibition_trade: 'Exhibition & Trade Fair',
  wedding_private: 'Wedding & Private Events',
  award_ceremony: 'Award Ceremony & Special Events',
  launch_reveal: 'Launch & Product Reveal',
};

export const EVENT_TEMPLATE_IDS_BY_CATEGORY: Record<EventCategoryId, readonly string[]> = {
  conference_seminar: ['conference-shift26'],
  festival_concert: ['festival-ondo', 'festival-cutshort'],
  corporate_business: [],
  exhibition_trade: ['exhibition-nocturna', 'exhibition-wrenfield'],
  wedding_private: ['wedding-evermore'],
  award_ceremony: [],
  launch_reveal: ['launch-aube'],
};

export const ALL_EVENT_TEMPLATE_IDS: readonly string[] = EVENT_CATEGORY_IDS.flatMap((c) => EVENT_TEMPLATE_IDS_BY_CATEGORY[c]);

export const isEventTemplateIdLite = (id: unknown): id is string => typeof id === 'string' && ALL_EVENT_TEMPLATE_IDS.includes(id);

export const categoryOfEventTemplate = (id: string): EventCategoryId | undefined =>
  EVENT_CATEGORY_IDS.find((c) => EVENT_TEMPLATE_IDS_BY_CATEGORY[c].includes(id));
