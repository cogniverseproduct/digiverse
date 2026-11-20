import type { EventWebsiteData } from '../../types/event';
import type { ClientRequirements, GeneratedWebsite } from '../../types/admin';
import type { NgoMappingFile, NgoRule } from '../ngo/types';
import type { EventCategoryId } from './ids';

/**
 * The mapping language is shared with the Social & NGO library (one engine binds both), so the mapping types are re-exported
 * under event names rather than duplicated.
 */
export type EventMappingFile = NgoMappingFile;
export type EventRule = NgoRule;

/** Licences an event template may carry. A credit-required licence needs a visible credit kept on the site (see `requiredCredit`). */
export type EventLicense = 'MIT' | 'Apache-2.0' | 'BSD-3-Clause' | 'ISC' | 'CC0-1.0' | 'CC-BY-3.0' | 'CC-BY-4.0';

/** Where an integrated template came from. Filled from the upstream LICENSE file and repository, never from a listing. */
export interface EventTemplateSource {
  kind: 'adapted';
  /** Upstream template name. */
  name: string;
  author: string;
  repoUrl: string;
  /** Upstream commit (or archive date when the host gives none) the bundle was taken from. */
  commit: string;
  license: EventLicense;
  /** Copyright line from the upstream LICENSE file. */
  copyright: string;
  /** ISO date the upstream copy was retrieved. */
  retrievedAt: string;
  /** What the upstream says about its images, and what DigiVerse does with them. */
  imageNote: string;
  /** What changed from upstream. Design, layout, type and motion are kept. */
  changes: string[];
  /** Words only the upstream sample content contains. A live site must never show any of them (unit/browser tested). */
  sampleTokens: string[];
  /** Credit a licence obliges us to keep visible on every site made from this template. Absent for permissive licences. */
  requiredCredit?: { text: string; url: string };
}

export interface EventTemplateDefinition {
  id: string;
  version: string;
  category: EventCategoryId;
  name: string;
  tagline: string;
  description: string;
  /** Short design-direction line shown on cards. */
  designStyle: string;
  highlights: string[];
  /** Sections the original design contains (used for the card and for deciding which intake fields matter). */
  pages: string[];
  /** Entry page file inside `/event-templates/<id>/`. */
  entry: string;
  previewImage: string;
  source: EventTemplateSource;
}

export interface EventTemplateProps {
  requirements?: Partial<ClientRequirements> | null;
  eventData?: EventWebsiteData | null;
  website?: Partial<GeneratedWebsite> | null;
  isDemo?: boolean;
}
