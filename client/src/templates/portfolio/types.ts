import type { PortfolioWebsiteData, PortfolioArchetype } from '../../types/portfolio';
import type { ClientRequirements, GeneratedWebsite } from '../../types/admin';

/** Active template ids (the current library). */
export type PortfolioTemplateId =
  | 'engineer-blueprint'
  | 'editorial-ux'
  | 'photo-fullscreen'
  | 'graphic-bold'
  | 'motion-immersive'
  | 'freelancer-services'
  | 'graduate-profile'
  | 'data-ai-lab'
  | 'architect-minimal'
  | 'creator-media';

/** Ids stored on projects created before the library was replaced. They still render (see legacy/). */
export type LegacyPortfolioTemplateId =
  | 'nova'
  | 'creative_studio'
  | 'vision'
  | 'motionverse'
  | 'academic_pro'
  | 'brandbuilder';

export type PortfolioFilterCategory =
  | 'all'
  | 'developer'
  | 'ui_ux'
  | 'photography'
  | 'creative'
  | 'freelancer'
  | 'student'
  | 'ai_data'
  | 'architecture'
  | 'content_creator';

export type PortfolioSectionKey =
  | 'hero'
  | 'about'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'publications'
  | 'services'
  | 'testimonials'
  | 'media'
  | 'contact';

export interface PortfolioTemplateTokens {
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  background: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  layoutPreset: string;
}

export interface PortfolioTemplatePageDef {
  slug: string;
  title: string;
  navLabel: string;
  description?: string;
}

export interface PortfolioSectionConfig {
  id: PortfolioSectionKey;
  label: string;
  /** Content the section needs; the section is hidden when the client has none of it. */
  needs?: 'skills' | 'projects' | 'experience' | 'education' | 'publications' | 'services' | 'testimonials' | 'media';
}

export interface PortfolioTemplateDefinition {
  id: PortfolioTemplateId;
  name: string;
  tagline: string;
  description: string;
  category: PortfolioFilterCategory;
  categoryLabel: string;
  archetype: PortfolioArchetype;
  version: string;
  author: string;
  badge: string;
  /** Short design-style label shown on cards, e.g. "Editorial". */
  designStyle: string;
  designDirection: string;
  /** Visual features shown on cards. */
  highlights: string[];
  tokens: PortfolioTemplateTokens;
  pages: PortfolioTemplatePageDef[];
  sections: PortfolioSectionConfig[];
  /** Data fields the template reads (everything else is ignored). */
  contentFields: string[];
  assetRequirements: {
    portrait: 'required' | 'recommended' | 'optional' | 'unused';
    projectImages: 'required' | 'recommended' | 'optional';
    minProjectImages: number;
    notes: string;
  };
  animation: { style: string; reducedMotion: 'static'; features: string[] };
  /** Screenshot used by the gallery (public path). */
  previewImage: string;
  /** Where the design comes from; used for the licence record (LICENSES.md). */
  source: { kind: 'original'; inspiration: string[]; note: string };
  getDemoData: () => {
    requirements: ClientRequirements;
    portfolioData: PortfolioWebsiteData;
    website: GeneratedWebsite;
  };
}

export interface PortfolioTemplateProps {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
  activePage: string;
  onNavigate: (page: string) => void;
  isDemo?: boolean;
}
