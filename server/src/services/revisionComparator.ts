import { ProjectRevision } from '../types/index.js';

export interface RevisionDiff {
  metadata: {
    base: {
      id: string;
      versionNumber: number;
      variationLabel: string;
      isApproved: boolean;
      createdAt: string;
      changelogNotes?: string;
    };
    target: {
      id: string;
      versionNumber: number;
      variationLabel: string;
      isApproved: boolean;
      createdAt: string;
      changelogNotes?: string;
    };
  };
  theme: {
    themeAccent: { base: string; target: string; changed: boolean };
  };
  typography: {
    fontFamily: { base: string; target: string; changed: boolean };
  };
  layout: {
    layoutPreset: { base: string; target: string; changed: boolean };
  };
  hero: {
    headline: { base: string; target: string; changed: boolean };
    description: { base: string; target: string; changed: boolean };
    heroImage: { base?: string; target?: string; changed: boolean };
  };
  counts: {
    events: { base: number; target: number; diff: number };
    committee: { base: number; target: number; diff: number };
    gallery: { base: number; target: number; diff: number };
    videos: { base: number; target: number; diff: number };
  };
  changesSummary: string[];
}

export function compareRevisions(base: ProjectRevision, target: ProjectRevision): RevisionDiff {
  const baseWeb = base.websiteData || ({} as any);
  const targetWeb = target.websiteData || ({} as any);

  const themeAccentChanged = baseWeb.themeAccent !== targetWeb.themeAccent;
  const fontFamilyChanged = baseWeb.fontFamily !== targetWeb.fontFamily;
  const layoutPresetChanged = baseWeb.layoutPreset !== targetWeb.layoutPreset;
  const headlineChanged = baseWeb.heroHeadline !== targetWeb.heroHeadline;
  const descriptionChanged = baseWeb.heroDescription !== targetWeb.heroDescription;
  const heroImageChanged = baseWeb.heroImage !== targetWeb.heroImage;

  const baseEvents = baseWeb.eventsList?.length || 0;
  const targetEvents = targetWeb.eventsList?.length || 0;
  const baseCommittee = baseWeb.committeeList?.length || 0;
  const targetCommittee = targetWeb.committeeList?.length || 0;
  const baseGallery = baseWeb.galleryList?.length || 0;
  const targetGallery = targetWeb.galleryList?.length || 0;
  const baseVideos = baseWeb.featuredVideos?.length || 0;
  const targetVideos = targetWeb.featuredVideos?.length || 0;

  const changesSummary: string[] = [];

  if (themeAccentChanged) {
    changesSummary.push(`Theme accent changed from '${baseWeb.themeAccent}' to '${targetWeb.themeAccent}'.`);
  }
  if (layoutPresetChanged) {
    changesSummary.push(`Layout preset shifted from '${baseWeb.layoutPreset}' to '${targetWeb.layoutPreset}'.`);
  }
  if (fontFamilyChanged) {
    changesSummary.push(`Typography font pairing updated from '${baseWeb.fontFamily}' to '${targetWeb.fontFamily}'.`);
  }
  if (headlineChanged) {
    changesSummary.push(`Hero headline updated.`);
  }
  if (descriptionChanged) {
    changesSummary.push(`Hero description text adjusted.`);
  }
  if (heroImageChanged) {
    changesSummary.push(`Featured hero background image replaced.`);
  }
  if (baseEvents !== targetEvents) {
    changesSummary.push(`Event schedule count shifted by ${targetEvents - baseEvents} (${baseEvents} -> ${targetEvents}).`);
  }
  if (baseCommittee !== targetCommittee) {
    changesSummary.push(`Executive committee leadership roster count adjusted (${baseCommittee} -> ${targetCommittee}).`);
  }

  if (changesSummary.length === 0) {
    changesSummary.push('No visual or structural differences detected between these two design versions.');
  }

  return {
    metadata: {
      base: {
        id: base.id,
        versionNumber: base.versionNumber,
        variationLabel: base.variationLabel,
        isApproved: Boolean(base.isApproved),
        createdAt: base.createdAt,
        changelogNotes: base.changelogNotes
      },
      target: {
        id: target.id,
        versionNumber: target.versionNumber,
        variationLabel: target.variationLabel,
        isApproved: Boolean(target.isApproved),
        createdAt: target.createdAt,
        changelogNotes: target.changelogNotes
      }
    },
    theme: {
      themeAccent: {
        base: baseWeb.themeAccent || 'crimson-gold',
        target: targetWeb.themeAccent || 'crimson-gold',
        changed: themeAccentChanged
      }
    },
    typography: {
      fontFamily: {
        base: baseWeb.fontFamily || 'Georgia, serif',
        target: targetWeb.fontFamily || 'Georgia, serif',
        changed: fontFamilyChanged
      }
    },
    layout: {
      layoutPreset: {
        base: baseWeb.layoutPreset || 'editorial',
        target: targetWeb.layoutPreset || 'editorial',
        changed: layoutPresetChanged
      }
    },
    hero: {
      headline: {
        base: baseWeb.heroHeadline || '',
        target: targetWeb.heroHeadline || '',
        changed: headlineChanged
      },
      description: {
        base: baseWeb.heroDescription || '',
        target: targetWeb.heroDescription || '',
        changed: descriptionChanged
      },
      heroImage: {
        base: baseWeb.heroImage,
        target: targetWeb.heroImage,
        changed: heroImageChanged
      }
    },
    counts: {
      events: {
        base: baseEvents,
        target: targetEvents,
        diff: targetEvents - baseEvents
      },
      committee: {
        base: baseCommittee,
        target: targetCommittee,
        diff: targetCommittee - baseCommittee
      },
      gallery: {
        base: baseGallery,
        target: targetGallery,
        diff: targetGallery - baseGallery
      },
      videos: {
        base: baseVideos,
        target: targetVideos,
        diff: targetVideos - baseVideos
      }
    },
    changesSummary
  };
}
