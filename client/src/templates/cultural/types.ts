import type { CulturalWebsiteData } from '../../types/cultural';
import type { ClientRequirements, GeneratedWebsite } from '../../types/admin';

/** The two Cultural Website Creation categories. Each has its own template library. */
export type CulturalCategory = 'cultural_society' | 'puja_committee';
/** Kept for callers that still use the older name. */
export type CulturalTemplateCategory = CulturalCategory;

export type CulturalSocietyTemplateId =
  | 'cultural-heritage'
  | 'arts-literature-society'
  | 'dance-music-association'
  | 'community-cultural-association'
  | 'modern-festival-organization';

export type PujaCommitteeTemplateId =
  | 'traditional-durga-puja'
  | 'premium-modern-durga-puja'
  | 'community-puja-committee'
  | 'heritage-traditional-puja'
  | 'festival-experience-celebration';

export type CulturalTemplateId = CulturalSocietyTemplateId | PujaCommitteeTemplateId;

export type CulturalSectionKey =
  | 'hero' | 'about' | 'history' | 'leadership' | 'activities' | 'events' | 'schedule' | 'theme' | 'visitor' | 'news'
  | 'gallery' | 'videos' | 'sponsors' | 'membership' | 'donation' | 'contact';

export interface CulturalTemplateTokens {
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  background: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  layoutPreset: string;
}

export interface CulturalSectionConfig {
  id: CulturalSectionKey;
  label: string;
  /** The section is hidden when the client supplied none of this data. */
  needs?: string;
}

export interface CulturalTemplateDefinition {
  id: CulturalTemplateId;
  name: string;
  tagline: string;
  description: string;
  archetype: CulturalCategory;
  categoryLabel: string;
  version: string;
  author: string;
  badge: string;
  /** Short design-style label on cards, for example "Ivory · Maroon · Editorial". */
  designStyle: string;
  /** Style family used by the library's style filter. */
  styleGroup: 'traditional' | 'modern' | 'editorial' | 'festive' | 'community';
  designDirection: string;
  highlights: string[];
  tokens: CulturalTemplateTokens;
  sections: CulturalSectionConfig[];
  contentFields: string[];
  assetRequirements: { logo: 'required' | 'recommended' | 'optional'; heroImage: 'required' | 'recommended' | 'optional'; notes: string };
  animation: { style: string; reducedMotion: 'static'; features: string[] };
  /** Screenshot used by the gallery (public path), captured from the real preview route. */
  previewImage: string;
  /** Where the design comes from; mirrors the licence record (LICENSES.md). */
  source: { kind: 'original'; inspiration: string[]; note: string };
  getDemoData: () => {
    requirements: ClientRequirements;
    culturalData: CulturalWebsiteData;
    website: GeneratedWebsite;
  };
}

export interface CulturalTemplateProps {
  requirements: ClientRequirements;
  culturalData: CulturalWebsiteData;
  website: GeneratedWebsite;
  activePage?: string;
  onNavigate?: (page: string) => void;
  /** True only inside the template library / preview route: shows the "Sample content" badge. */
  isDemo?: boolean;
}

export const CULTURAL_CATEGORY_LABELS: Record<CulturalCategory, string> = {
  cultural_society: 'Cultural Association',
  puja_committee: 'Puja Committee'
};
