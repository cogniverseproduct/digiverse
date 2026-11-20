import React, { Suspense, lazy } from 'react';
import type { PortfolioTemplateProps } from './types';
import { DEFAULT_TEMPLATE_BY_ARCHETYPE, PORTFOLIO_TEMPLATES, isLegacyTemplateId } from './registry';


// Every template is code-split: a published site only downloads the one design it uses.
type TemplateComponent = React.ComponentType<PortfolioTemplateProps>;
const EngineerBlueprint = lazy(() => import('./designs/EngineerBlueprint').then((m) => ({ default: m.EngineerBlueprint })));
const EditorialUX = lazy(() => import('./designs/EditorialUX').then((m) => ({ default: m.EditorialUX })));
const PhotoFullscreen = lazy(() => import('./designs/PhotoFullscreen').then((m) => ({ default: m.PhotoFullscreen })));
const GraphicBold = lazy(() => import('./designs/GraphicBold').then((m) => ({ default: m.GraphicBold })));
const MotionImmersive = lazy(() => import('./designs/MotionImmersive').then((m) => ({ default: m.MotionImmersive })));
const FreelancerServices = lazy(() => import('./designs/FreelancerServices').then((m) => ({ default: m.FreelancerServices })));
const GraduateProfile = lazy(() => import('./designs/GraduateProfile').then((m) => ({ default: m.GraduateProfile })));
const DataAILab = lazy(() => import('./designs/DataAILab').then((m) => ({ default: m.DataAILab })));
const ArchitectMinimal = lazy(() => import('./designs/ArchitectMinimal').then((m) => ({ default: m.ArchitectMinimal })));
const CreatorMedia = lazy(() => import('./designs/CreatorMedia').then((m) => ({ default: m.CreatorMedia })));

// Pre-v2 templates are code-split: they only load for projects that already reference a legacy id.
const NovaTemplate = lazy(() => import('./legacy/components/NovaTemplate').then((m) => ({ default: m.NovaTemplate })));
const CreativeStudioTemplate = lazy(() => import('./legacy/components/CreativeStudioTemplate').then((m) => ({ default: m.CreativeStudioTemplate })));
const VisionTemplate = lazy(() => import('./legacy/components/VisionTemplate').then((m) => ({ default: m.VisionTemplate })));
const MotionverseTemplate = lazy(() => import('./legacy/components/MotionverseTemplate').then((m) => ({ default: m.MotionverseTemplate })));
const AcademicProTemplate = lazy(() => import('./legacy/components/AcademicProTemplate').then((m) => ({ default: m.AcademicProTemplate })));
const BrandbuilderTemplate = lazy(() => import('./legacy/components/BrandbuilderTemplate').then((m) => ({ default: m.BrandbuilderTemplate })));

const ACTIVE: Record<string, TemplateComponent> = {
  'engineer-blueprint': EngineerBlueprint,
  'editorial-ux': EditorialUX,
  'photo-fullscreen': PhotoFullscreen,
  'graphic-bold': GraphicBold,
  'motion-immersive': MotionImmersive,
  'freelancer-services': FreelancerServices,
  'graduate-profile': GraduateProfile,
  'data-ai-lab': DataAILab,
  'architect-minimal': ArchitectMinimal,
  'creator-media': CreatorMedia
};

const LEGACY: Record<string, React.LazyExoticComponent<React.ComponentType<PortfolioTemplateProps>>> = {
  nova: NovaTemplate,
  creative_studio: CreativeStudioTemplate,
  vision: VisionTemplate,
  motionverse: MotionverseTemplate,
  academic_pro: AcademicProTemplate,
  brandbuilder: BrandbuilderTemplate
};

/** Resolves which template a project uses: explicit selection → archetype default. */
export function resolvePortfolioTemplateId(props: Pick<PortfolioTemplateProps, 'requirements' | 'website' | 'portfolioData'>): string {
  const archetype = props.portfolioData?.archetype || props.requirements?.portfolioArchetype || 'developer';
  return (
    props.website?.selectedTemplate?.templateId ||
    props.requirements?.selectedTemplate?.templateId ||
    DEFAULT_TEMPLATE_BY_ARCHETYPE[archetype as keyof typeof DEFAULT_TEMPLATE_BY_ARCHETYPE] ||
    'engineer-blueprint'
  );
}

const Loading = () => <div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />;

export const PortfolioTemplateDispatcher: React.FC<PortfolioTemplateProps> = (props) => {
  const id = resolvePortfolioTemplateId(props);

  let Template: TemplateComponent;
  if (id in PORTFOLIO_TEMPLATES) Template = ACTIVE[id];
  else if (isLegacyTemplateId(id)) Template = LEGACY[id];
  else {
    // Unknown id (for example a template removed in the future): fall back to the archetype default.
    const archetype = props.portfolioData?.archetype || 'developer';
    Template = ACTIVE[DEFAULT_TEMPLATE_BY_ARCHETYPE[archetype] || 'engineer-blueprint'];
  }
  return (
    <Suspense fallback={<Loading />}>
      <Template {...props} />
    </Suspense>
  );
};
