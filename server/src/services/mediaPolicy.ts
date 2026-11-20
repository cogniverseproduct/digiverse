import { isCulturalCategory } from './culturalCatalog.js';
import { isNgoCategory } from './ngoCatalog.js';
import { isEventCategory } from './eventCatalog.js';

/**
 * Engines whose websites must show only what the client actually provided: no development mock Drive photos and no stored
 * stock thumbnails (Cultural, Social & NGO, and Event). Accepts a project's requirements or just its category.
 */
export const usesRealMediaOnly = (r?: { category?: string; organizationType?: string }): boolean =>
  isCulturalCategory(r?.category) || isCulturalCategory(r?.organizationType) || isNgoCategory(r?.category) || isNgoCategory(r?.organizationType)
  || isEventCategory(r?.category) || isEventCategory(r?.organizationType);
