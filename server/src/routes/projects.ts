import { Router, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { ClientProject, ClientRequirements, ProjectRevision, PreviewToken } from '../types/index.js';
import type { SportsWebsiteData } from '../types/sports.js';
import type { CulturalWebsiteData } from '../types/cultural.js';
import type { EventWebsiteData, EventRSVPSubmission, EventCategory } from '../types/event.js';
import type { NGOWebsiteData, NGOVolunteerApplication, NGODonationEnquiry } from '../types/ngo.js';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import { canAccessTenant, guardProjectParam, organizationSlug, organizationUnavailableMessage } from '../middleware/projectAccess.js';
import { synthesizeWebsite, regenerateSection, normalizeNGODataStrict, normalizeEventDataStrict } from '../services/aiGenerator.js';
import { repository } from '../db/repository.js';
import { syncGoogleDriveMedia, syncGoogleDriveMediaFolders, registerGoogleDriveVideoLink, storableThumbnail } from '../services/googleDriveService.js';
import { parseYouTubeUrl } from '../services/youtubeService.js';
import { compareRevisions } from '../services/revisionComparator.js';
import { commercialService } from '../services/commercialService.js';
import { deploymentService } from '../services/publishing/deploymentService.js';
import { publishHandler, unpublishHandler } from './publishing.js';
import { requestOrigin } from '../services/requestOrigin.js';
import { validatePortfolioFields } from '../services/portfolioCatalog.js';
import { validateSportsFields } from '../services/sportsCatalog.js';
import { validateCulturalFields } from '../services/culturalCatalog.js';
import { usesRealMediaOnly } from '../services/mediaPolicy.js';
import { validateNgoFields, usesNgoLibraryTemplate } from '../services/ngoCatalog.js';
import { validateEventFields, usesEventLibraryTemplate, isKnownEventCategory, isEventReqs } from '../services/eventCatalog.js';

const router = Router();

// Every /:id/... route below belongs to one project. Admins only reach projects whose organization is assigned to them;
// Super Admins reach all. The three POST endpoints open to website visitors stay public.
// GET /api/projects/name-check?name=… - Is this organisation name free, already yours, or taken by someone else? (declared before the /:id guard)
router.get('/name-check', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  const slug = organizationSlug(name);
  if (!slug) { res.status(400).json({ error: 'Enter a name to check.' }); return; }
  const tenant = await repository.getTenantBySlug(slug);
  const status = !tenant ? 'available' : canAccessTenant(req.user!, tenant) ? 'yours' : 'unavailable';
  res.json({ status, slug, ...(status === 'unavailable' ? { message: organizationUnavailableMessage(name) } : {}) });
});

router.use('/:id', guardProjectParam(['/rsvp', '/volunteer', '/donation-enquiry']));

// GET /api/projects - List projects (Admins: only their own; Super Admin: all)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const projects = await repository.listProjects(undefined, user.role === 'SUPER_ADMIN' ? undefined : user.id);
  res.json({ projects });
});

// GET /api/projects/:id - Get project by ID from SQLite
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }
  res.json({ project });
});

// PUT /api/projects/:id - Update client project requirements (ADMIN & SUPER_ADMIN)
router.put('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const updates = req.body as Partial<ClientRequirements>;
  const portfolioError = validatePortfolioFields(updates, updates.category || project.requirements.category || project.requirements.organizationType);
  if (portfolioError) {
    res.status(400).json({ error: portfolioError });
    return;
  }
  const sportsError = validateSportsFields(
    updates,
    updates.category || project.requirements.category || project.requirements.organizationType,
    project.requirements.sportsArchetype
  );
  if (sportsError) {
    res.status(400).json({ error: sportsError });
    return;
  }
  const culturalError = validateCulturalFields(
    updates,
    updates.category || project.requirements.category || project.requirements.organizationType,
    project.requirements.culturalArchetype
  );
  if (culturalError) {
    res.status(400).json({ error: culturalError });
    return;
  }
  const ngoError = validateNgoFields(
    updates,
    updates.category || project.requirements.category || project.requirements.organizationType,
    project.requirements.ngoArchetype
  );
  if (ngoError) {
    res.status(400).json({ error: ngoError });
    return;
  }
  const eventError = validateEventFields(
    updates,
    updates.category || project.requirements.category || project.requirements.organizationType,
    project.requirements.eventCategory
  );
  if (eventError) {
    res.status(400).json({ error: eventError });
    return;
  }
  const mergedReqs: ClientRequirements = {
    ...project.requirements,
    ...updates,

    // Preserve existing nested design settings when only one field is updated.
    designSelection: updates.designSelection
      ? {
          ...project.requirements.designSelection,
          ...updates.designSelection
        }
      : project.requirements.designSelection,

    // Keep the Images and Videos folder selections independent.
    googleDriveMediaFolders: updates.googleDriveMediaFolders
      ? {
          ...project.requirements.googleDriveMediaFolders,
          ...updates.googleDriveMediaFolders,
          images: updates.googleDriveMediaFolders.images
            ? {
                ...project.requirements.googleDriveMediaFolders?.images,
                ...updates.googleDriveMediaFolders.images
              }
            : project.requirements.googleDriveMediaFolders?.images,
          videos: updates.googleDriveMediaFolders.videos
            ? {
                ...project.requirements.googleDriveMediaFolders?.videos,
                ...updates.googleDriveMediaFolders.videos
              }
            : project.requirements.googleDriveMediaFolders?.videos
        }
      : project.requirements.googleDriveMediaFolders,

    category: updates.category || project.requirements.category || project.requirements.organizationType,
    organizationType: updates.category || project.requirements.organizationType
  };

  project.requirements = mergedReqs;
  if (mergedReqs.sportsData && project.generatedWebsite) {
    project.generatedWebsite.sportsData = mergedReqs.sportsData;
  }
  if (mergedReqs.portfolioData && project.generatedWebsite) {
    project.generatedWebsite.portfolioData = mergedReqs.portfolioData;
  }
  if (updates.culturalData && project.generatedWebsite) {
    project.generatedWebsite.culturalData = mergedReqs.culturalData;
  }
  if (mergedReqs.selectedTemplate && project.generatedWebsite) {
    project.generatedWebsite.selectedTemplate = mergedReqs.selectedTemplate;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  // Re-sync the selected Images and Videos folders when folder settings change.
  if (updates.googleDriveMediaFolders) {
    try {
      const syncResult = await syncGoogleDriveMediaFolders(
        id,
        mergedReqs.googleDriveMediaFolders || {},
        mergedReqs.category || mergedReqs.organizationType
      );

      for (const source of syncResult.sources) {
        await repository.saveMediaSource(source);
      }
      for (const item of syncResult.discoveredItems) {
        await repository.saveDriveMediaItem(item);
      }
    } catch (err) {
      console.error('[Drive Folder Sync on Requirements Update Error]:', err);
    }
  }

  // Sync dedicated Google Drive gallery folder link if provided
  if (updates.googleDriveGalleryUrl && updates.googleDriveGalleryUrl.trim()) {
    try {
      const syncResult = await syncGoogleDriveMedia(
        id,
        updates.googleDriveGalleryUrl,
        mergedReqs.category || mergedReqs.organizationType,
        !usesRealMediaOnly(mergedReqs)
      );
      await repository.saveMediaSource(syncResult.source);
      for (const item of syncResult.discoveredItems) {
        await repository.saveDriveMediaItem(item);
      }
    } catch (err) {
      console.error('[Drive Gallery URL Sync Error]:', err);
    }
  }

  // Register dedicated Google Drive video file link(s) if provided
  if (updates.googleDriveVideoUrl && updates.googleDriveVideoUrl.trim()) {
    try {
      await registerGoogleDriveVideoLink(id, updates.googleDriveVideoUrl, undefined, !usesRealMediaOnly(mergedReqs));
    } catch (err) {
      console.error('[Drive Video URL Register Error]:', err);
    }
  }
  if (Array.isArray(updates.googleDriveVideoUrls)) {
    for (const vUrl of updates.googleDriveVideoUrls) {
      if (vUrl && vUrl.trim()) {
        await registerGoogleDriveVideoLink(id, vUrl, undefined, !usesRealMediaOnly(mergedReqs));
      }
    }
  }

  // Register YouTube Playlist URLs if provided
  if (Array.isArray(updates.youtubePlaylistUrls)) {
    const existingVideos = await repository.getYouTubeVideosByProject(id);
    for (let i = 0; i < updates.youtubePlaylistUrls.length; i++) {
      const url = updates.youtubePlaylistUrls[i];
      if (url && url.trim()) {
        const parsed = parseYouTubeUrl(url, undefined, mergedReqs.organizationType);
        if (parsed.isValid) {
          await repository.saveYouTubeVideo({
            id: `yt_pl_${Date.now()}_${i + 1}`,
            projectId: id,
            videoId: parsed.identifier,
            originalUrl: url.trim(),
            embedUrl: parsed.embedUrl,
            title: parsed.defaultTitle,
            thumbnailUrl: storableThumbnail(parsed.thumbnailUrl, usesRealMediaOnly(mergedReqs)),
            category: 'Playlist',
            displayOrder: existingVideos.length + i + 1,
            isPublished: true,
            videoType: 'playlist',
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }

  await recordAudit(req, 'UPDATE_PROJECT_REQUIREMENTS', 'projects', id, {
    orgName: mergedReqs.organizationName,
    driveFoldersUpdated: Boolean(updates.googleDriveMediaFolders)
  });

  res.json({ project });
});

// POST /api/projects - Create a new client project with collected requirements (ADMIN & SUPER_ADMIN)
router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const reqBody = req.body || {};
  const requirements = (reqBody.requirements && typeof reqBody.requirements === 'object'
    ? reqBody.requirements
    : reqBody) as ClientRequirements;

  const category = requirements.category || requirements.organizationType;
  if (!requirements.organizationName || !category) {
    res.status(400).json({ error: 'Organization name and category are required.' });
    return;
  }

  const portfolioError = validatePortfolioFields(requirements, category);
  if (portfolioError) {
    res.status(400).json({ error: portfolioError });
    return;
  }
  const sportsError = validateSportsFields(requirements, category);
  if (sportsError) {
    res.status(400).json({ error: sportsError });
    return;
  }
  const culturalError = validateCulturalFields(requirements, category);
  if (culturalError) {
    res.status(400).json({ error: culturalError });
    return;
  }
  const ngoError = validateNgoFields(requirements, category);
  if (ngoError) {
    res.status(400).json({ error: ngoError });
    return;
  }
  const eventError = validateEventFields(requirements, category);
  if (eventError) {
    res.status(400).json({ error: eventError });
    return;
  }

  const id = `proj_${Date.now()}`;
  const slug = organizationSlug(requirements.organizationName);

  const now = new Date().toISOString();

  // Create or retrieve tenant organization
  let tenant = await repository.getTenantBySlug(slug);
  if (tenant && !canAccessTenant(req.user!, tenant)) {
    res.status(409).json({ error: organizationUnavailableMessage(requirements.organizationName), code: 'ORGANIZATION_NOT_AVAILABLE', slug });
    return;
  }
  // The organisation already belongs to this Admin: the new project joins it and the stored record is left exactly as it is.
  const reusedOrganization = Boolean(tenant);
  if (!tenant) {
    tenant = {
      id: `tenant_${Date.now()}`,
      slug,
      name: requirements.organizationName.trim(),
      category,
      subcategory: requirements.subcategory,
      contactPerson: requirements.contactPerson || 'Organization Lead',
      contactEmail: requirements.contactEmail ? requirements.contactEmail.trim().toLowerCase() : `${slug}@digiverse.site`,
      contactPhone: requirements.contactPhone || '',
      address: requirements.address || '',
      websiteLanguage: requirements.websiteLanguage || requirements.preferredLanguage || 'bilingual',
      createdByAdminId: req.user!.id,
      assignedAdminId: req.user!.id,
      createdAt: now,
      updatedAt: now
    };
    await repository.saveTenant(tenant);
  }

  const normalizedRequirements: ClientRequirements = {
    ...requirements,
    category,
    organizationType: category,
    additionalBrandingImages: Array.isArray(requirements.additionalBrandingImages) ? requirements.additionalBrandingImages : [],
    googleDriveGalleryUrl: requirements.googleDriveGalleryUrl?.trim() || undefined,
    googleDriveVideoUrl: requirements.googleDriveVideoUrl?.trim() || undefined,
    googleDriveVideoUrls: Array.isArray(requirements.googleDriveVideoUrls) ? requirements.googleDriveVideoUrls : undefined,
    youtubePlaylistUrls: Array.isArray(requirements.youtubePlaylistUrls) ? requirements.youtubePlaylistUrls : undefined,
    events: requirements.events || [],
    committee: requirements.committee || [],
    gallery: requirements.gallery || [],
    enabledSections: requirements.enabledSections || {
      hero: true,
      events: true,
      about: true,
      committee: true,
      gallery: true,
      contact: true
    }
  };

  const newProject: ClientProject = {
    id,
    tenantId: tenant.id,
    tenantSlug: slug,
    requirements: normalizedRequirements,
    status: 'requirements_collected',
    createdAt: now,
    updatedAt: now
  };

  await repository.saveProject(newProject);

  // Initialize commercial tracking record
  await repository.saveCommercialRecord({
    id: `comm_${Date.now()}`,
    projectId: id,
    quotationAmount: 0,
    currency: 'INR',
    quotationStatus: 'draft',
    paymentStatus: 'unquoted',
    invoiceStatus: 'unissued',
    amountPaid: 0,
    commercialStatus: 'proposal_stage',
    createdAt: now,
    updatedAt: now
  });

  await recordAudit(req, 'ONBOARD_CLIENT_PROJECT', 'projects', id, {
    orgName: requirements.organizationName,
    category,
    tenantId: tenant.id,
    reusedOrganization
  });

  // Prefer separate Images and Videos folders when supplied.
  // Keep the legacy single-folder URL path for older clients.
  const mediaFolders = normalizedRequirements.googleDriveMediaFolders;
  const hasSeparateMediaFolders = Boolean(
    mediaFolders?.images?.folderId || mediaFolders?.images?.folderUrl ||
    mediaFolders?.videos?.folderId || mediaFolders?.videos?.folderUrl
  );

  if (hasSeparateMediaFolders) {
    try {
      const syncResult = await syncGoogleDriveMediaFolders(
        id,
        mediaFolders!,
        category
      );

      for (const source of syncResult.sources) {
        await repository.saveMediaSource(source);
      }
      for (const item of syncResult.discoveredItems) {
        await repository.saveDriveMediaItem(item);
      }
    } catch (err) {
      console.error('[Drive Folder Sync on Intake Error]:', err);
    }
  } else if (requirements.googleDriveUrl && requirements.googleDriveUrl.trim()) {
    try {
      const syncResult = await syncGoogleDriveMedia(
        id,
        requirements.googleDriveUrl,
        category,
        !usesRealMediaOnly({ category })
      );
      await repository.saveMediaSource(syncResult.source);
      for (const item of syncResult.discoveredItems) {
        await repository.saveDriveMediaItem(item);
      }
    } catch (err) {
      console.error('[Legacy Drive Sync on Intake Error]:', err);
    }
  }

  // Dedicated Google Drive Gallery folder sync
  if (normalizedRequirements.googleDriveGalleryUrl && !hasSeparateMediaFolders && !requirements.googleDriveUrl) {
    try {
      const syncResult = await syncGoogleDriveMedia(
        id,
        normalizedRequirements.googleDriveGalleryUrl,
        category,
        !usesRealMediaOnly({ category })
      );
      await repository.saveMediaSource(syncResult.source);
      for (const item of syncResult.discoveredItems) {
        await repository.saveDriveMediaItem(item);
      }
    } catch (err) {
      console.error('[Drive Gallery URL Intake Sync Error]:', err);
    }
  }

  // Dedicated Google Drive Video file link(s) registration
  if (normalizedRequirements.googleDriveVideoUrl) {
    try {
      await registerGoogleDriveVideoLink(id, normalizedRequirements.googleDriveVideoUrl, undefined, !usesRealMediaOnly({ category }));
    } catch (err) {
      console.error('[Drive Video Intake Registration Error]:', err);
    }
  }
  if (Array.isArray(normalizedRequirements.googleDriveVideoUrls)) {
    for (const vUrl of normalizedRequirements.googleDriveVideoUrls) {
      if (vUrl && vUrl.trim()) {
        try {
          await registerGoogleDriveVideoLink(id, vUrl, undefined, !usesRealMediaOnly({ category }));
        } catch (err) {
          console.error('[Drive Video List Intake Registration Error]:', err);
        }
      }
    }
  }

  // If YouTube URLs were provided during intake, register them.
  if (requirements.youtubeUrls && Array.isArray(requirements.youtubeUrls)) {
    for (let i = 0; i < requirements.youtubeUrls.length; i++) {
      const url = requirements.youtubeUrls[i];
      const parsed = parseYouTubeUrl(url, undefined, requirements.organizationType);
      if (parsed.isValid) {
        await repository.saveYouTubeVideo({
          id: `yt_${Date.now()}_${i + 1}`,
          projectId: id,
          videoId: parsed.identifier,
          originalUrl: url.trim(),
          embedUrl: parsed.embedUrl,
          title: parsed.defaultTitle,
          thumbnailUrl: storableThumbnail(parsed.thumbnailUrl, usesRealMediaOnly({ category })),
          category: requirements.organizationType === 'sports' ? 'Sports' : 'Cultural',
          displayOrder: i + 1,
          isPublished: true,
          videoType: parsed.type,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // If dedicated YouTube Playlist URLs were provided, register them.
  if (normalizedRequirements.youtubePlaylistUrls && Array.isArray(normalizedRequirements.youtubePlaylistUrls)) {
    const offset = requirements.youtubeUrls?.length || 0;
    for (let i = 0; i < normalizedRequirements.youtubePlaylistUrls.length; i++) {
      const plUrl = normalizedRequirements.youtubePlaylistUrls[i];
      if (plUrl && plUrl.trim()) {
        const parsed = parseYouTubeUrl(plUrl, undefined, requirements.organizationType);
        if (parsed.isValid) {
          await repository.saveYouTubeVideo({
            id: `yt_pl_${Date.now()}_${i + 1}`,
            projectId: id,
            videoId: parsed.identifier,
            originalUrl: plUrl.trim(),
            embedUrl: parsed.embedUrl,
            title: parsed.defaultTitle,
            thumbnailUrl: storableThumbnail(parsed.thumbnailUrl, usesRealMediaOnly({ category })),
            category: 'Playlist',
            displayOrder: offset + i + 1,
            isPublished: true,
            videoType: 'playlist',
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }

  res.status(201).json({ project: newProject, reusedOrganization });
});

// POST /api/projects/:id/generate - Trigger AI website generation using SQLite media (ADMIN & SUPER_ADMIN)
router.post('/:id/generate', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  project.status = 'generating';
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  // Query persistent media items and YouTube videos for composition.
  const driveItems = await repository.getDriveMediaByProject(id);
  const youtubeVideos = await repository.getYouTubeVideosByProject(id);

  // Synthesize website using the saved client requirements and selected design model.
  const generated = synthesizeWebsite(project.requirements, driveItems, youtubeVideos);
  project.generatedWebsite = generated;
  project.status = 'preview_ready';
  project.updatedAt = new Date().toISOString();

  // Create initial or sequential revision snapshot.
  const existingRevs = await repository.listRevisionsByProject(id);
  const versionNumber = existingRevs.length > 0
    ? Math.max(...existingRevs.map(r => r.versionNumber)) + 1
    : 1;

  const revId = `rev_${Date.now()}_v${versionNumber}`;
  const newRev: ProjectRevision = {
    id: revId,
    projectId: id,
    versionNumber,
    variationLabel: `Design V${versionNumber} (AI Synthesis)`,
    websiteData: generated,
    isApproved: false,
    createdByAdminId: req.user!.id,
    changelogNotes: versionNumber === 1
      ? 'Initial AI-generated website synthesis'
      : 'Full website re-synthesis via AI Generator',
    createdAt: new Date().toISOString()
  };
  await repository.createRevision(newRev);
  project.activeRevisionId = revId;

  await repository.saveProject(project);

  await recordAudit(req, 'GENERATE_WEBSITE', 'projects', id, {
    orgName: project.requirements.organizationName,
    theme: generated.themeAccent
  });

  res.json({
    message: 'AI website generation completed successfully with media integration.',
    project
  });
});

// PATCH /api/projects/:id/customize - Update design customization (ADMIN only)
router.patch('/:id/customize', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  if (!project.generatedWebsite) {
    res.status(400).json({ error: 'Cannot customize before website has been generated.' });
    return;
  }

  const {
    themeAccent, layoutPreset, fontFamily, heroHeadline, heroDescription, heroImage,
    themeConfig, pages, sections, eventsTitle, eventsList, committeeTitle, committeeList,
    galleryTitle, galleryList, announcements, donationsInfo, navigationBar, footerConfig, responsiveConfig,
    sportsData, culturalData
  } = req.body;

  // Cultural library designs read three things from the Studio: the two brand colours and the hero line. Only those are applied;
  // the rest of the client's cultural content changes through the Data Manager, never through this endpoint.
  let culturalBrandApplied = false;
  if (culturalData !== undefined) {
    const existingCd = (project.generatedWebsite.culturalData || project.requirements.culturalData) as any;
    if (!existingCd?.organization || !existingCd?.branding) {
      res.status(400).json({ error: 'This project has no cultural profile to update yet.' });
      return;
    }
    const hex = /^#[0-9a-fA-F]{6}$/;
    const incoming = culturalData as any;
    const primary = incoming?.branding?.primaryColor;
    const accent = incoming?.branding?.accentColor;
    const tagline = incoming?.organization?.tagline;
    if ((primary !== undefined && !hex.test(String(primary))) || (accent !== undefined && !hex.test(String(accent)))) {
      res.status(400).json({ error: 'Brand colours must be hex values such as #7A1F2B.' });
      return;
    }
    if (tagline !== undefined && (typeof tagline !== 'string' || tagline.length > 140)) {
      res.status(400).json({ error: 'The hero line must be text of at most 140 characters.' });
      return;
    }
    const nextCd = {
      ...existingCd,
      organization: { ...existingCd.organization, ...(tagline !== undefined ? { tagline: tagline.trim() } : {}) },
      branding: { ...existingCd.branding, ...(primary !== undefined ? { primaryColor: primary } : {}), ...(accent !== undefined ? { accentColor: accent } : {}) }
    };
    project.generatedWebsite.culturalData = nextCd;
    project.requirements.culturalData = nextCd;
    culturalBrandApplied = true;
  }

  if (themeAccent) project.generatedWebsite.themeAccent = themeAccent;
  if (layoutPreset) project.generatedWebsite.layoutPreset = layoutPreset;
  if (fontFamily) project.generatedWebsite.fontFamily = fontFamily;
  if (heroHeadline) project.generatedWebsite.heroHeadline = heroHeadline;
  if (heroDescription) project.generatedWebsite.heroDescription = heroDescription;
  if (heroImage) project.generatedWebsite.heroImage = heroImage;
  if (themeConfig) project.generatedWebsite.themeConfig = { ...project.generatedWebsite.themeConfig, ...themeConfig };
  if (pages) project.generatedWebsite.pages = pages;
  if (sections) project.generatedWebsite.sections = sections;
  if (eventsTitle) project.generatedWebsite.eventsTitle = eventsTitle;
  if (eventsList) project.generatedWebsite.eventsList = eventsList;
  if (committeeTitle) project.generatedWebsite.committeeTitle = committeeTitle;
  if (committeeList) project.generatedWebsite.committeeList = committeeList;
  if (galleryTitle) project.generatedWebsite.galleryTitle = galleryTitle;
  if (galleryList) project.generatedWebsite.galleryList = galleryList;
  if (announcements) project.generatedWebsite.announcements = announcements;
  if (donationsInfo) project.generatedWebsite.donationsInfo = donationsInfo;
  if (navigationBar) project.generatedWebsite.navigationBar = { ...project.generatedWebsite.navigationBar, ...navigationBar };
  if (footerConfig) project.generatedWebsite.footerConfig = { ...project.generatedWebsite.footerConfig, ...footerConfig };
  if (responsiveConfig) project.generatedWebsite.responsiveConfig = { ...project.generatedWebsite.responsiveConfig, ...responsiveConfig };
  if (sportsData) {
    project.generatedWebsite.sportsData = sportsData;
    project.requirements.sportsData = sportsData;
  }

  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'CUSTOMIZE_WEBSITE', 'projects', id, { themeAccent, layoutPreset, sportsDataUpdated: Boolean(sportsData), culturalBrandUpdated: culturalBrandApplied });

  res.json({ project });
});

// PATCH /api/projects/:id/sports-data - Dedicated sports data management (ADMIN only)
router.patch('/:id/sports-data', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { sportsData } = req.body;
  if (!sportsData || typeof sportsData !== 'object') {
    res.status(400).json({ error: 'Valid sports data object is required.' });
    return;
  }

  if (!sportsData.club || typeof sportsData.club !== 'object') {
    res.status(400).json({ error: 'Sports data must include a valid club profile.' });
    return;
  }

  // Ensure arrays exist and conform to schema
  const sanitizedSportsData: SportsWebsiteData = {
    schemaVersion: '1.0',
    club: sportsData.club,
    teams: Array.isArray(sportsData.teams) ? sportsData.teams : [],
    players: Array.isArray(sportsData.players) ? sportsData.players : [],
    staff: Array.isArray(sportsData.staff) ? sportsData.staff : [],
    competitions: Array.isArray(sportsData.competitions) ? sportsData.competitions : [],
    fixtures: Array.isArray(sportsData.fixtures) ? sportsData.fixtures : [],
    standings: Array.isArray(sportsData.standings) ? sportsData.standings : [],
    matchEvents: Array.isArray(sportsData.matchEvents) ? sportsData.matchEvents : [],
    sponsors: Array.isArray(sportsData.sponsors) ? sportsData.sponsors : [],
    news: Array.isArray(sportsData.news) ? sportsData.news : [],
    pages: Array.isArray(sportsData.pages) ? sportsData.pages : [],
    sections: Array.isArray(sportsData.sections) ? sportsData.sections : [],
    tournamentStages: Array.isArray(sportsData.tournamentStages) ? sportsData.tournamentStages : undefined,
    academyProgrammes: Array.isArray(sportsData.academyProgrammes) ? sportsData.academyProgrammes : undefined,
    trainingBatches: Array.isArray(sportsData.trainingBatches) ? sportsData.trainingBatches : undefined,
    seoInfo: sportsData.seoInfo || undefined,
    brandingMedia: sportsData.brandingMedia || undefined,
    tournamentInfo: sportsData.tournamentInfo && typeof sportsData.tournamentInfo === 'object' ? sportsData.tournamentInfo : undefined,
    academyInfo: sportsData.academyInfo && typeof sportsData.academyInfo === 'object' ? sportsData.academyInfo : undefined,
    gallery: Array.isArray(sportsData.gallery) ? sportsData.gallery : undefined,
    dataAvailability: {
      teams: Array.isArray(sportsData.teams) && sportsData.teams.length > 0,
      players: Array.isArray(sportsData.players) && sportsData.players.length > 0,
      staff: Array.isArray(sportsData.staff) && sportsData.staff.length > 0,
      competitions: Array.isArray(sportsData.competitions) && sportsData.competitions.length > 0,
      fixtures: Array.isArray(sportsData.fixtures) && sportsData.fixtures.length > 0,
      standings: Array.isArray(sportsData.standings) && sportsData.standings.length > 0,
      sponsors: Array.isArray(sportsData.sponsors) && sportsData.sponsors.length > 0,
      news: Array.isArray(sportsData.news) && sportsData.news.some((n: any) => n.isPublished),
      tournamentStages: Array.isArray(sportsData.tournamentStages) && sportsData.tournamentStages.length > 0,
      academyProgrammes: Array.isArray(sportsData.academyProgrammes) && sportsData.academyProgrammes.length > 0,
      trainingBatches: Array.isArray(sportsData.trainingBatches) && sportsData.trainingBatches.length > 0,
      gallery: Array.isArray(sportsData.gallery) && sportsData.gallery.length > 0,
      tournamentInfo: Boolean(sportsData.tournamentInfo && typeof sportsData.tournamentInfo === 'object' && Object.keys(sportsData.tournamentInfo).length > 0),
      academyInfo: Boolean(sportsData.academyInfo && typeof sportsData.academyInfo === 'object' && Object.keys(sportsData.academyInfo).length > 0)
    }
  };

  project.requirements.sportsData = sanitizedSportsData;
  if (project.generatedWebsite) {
    project.generatedWebsite.sportsData = sanitizedSportsData;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'UPDATE_SPORTS_DATA', 'projects', id, {
    teamsCount: sanitizedSportsData.teams.length,
    playersCount: sanitizedSportsData.players.length,
    fixturesCount: sanitizedSportsData.fixtures.length
  });

  res.json({
    message: 'Sports data updated successfully.',
    project,
    sportsData: sanitizedSportsData
  });
});

// PATCH /api/projects/:id/cultural-data - Update and persist cultural domain data (ADMIN only)
router.patch('/:id/cultural-data', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { culturalData } = req.body;
  if (!culturalData || typeof culturalData !== 'object') {
    res.status(400).json({ error: 'Valid cultural data payload is required.' });
    return;
  }

  const existingCultural = (project.requirements.culturalData as any) || {};
  // Nothing is invented: a profile that has none yet is built only from what the client supplied.
  const org = culturalData.organization || existingCultural.organization || {
    name: project.requirements.organizationName || '',
    description: project.requirements.aboutText || '',
    headquarters: project.requirements.address || '',
    city: '', state: '', country: '',
    contactPerson: project.requirements.contactPerson || '',
    contactEmail: project.requirements.contactEmail || '',
    contactPhone: project.requirements.contactPhone || ''
  };

  const isPuja = culturalData.websiteType === 'puja_committee' || project.requirements.culturalArchetype === 'puja_committee' || existingCultural.websiteType === 'puja_committee';

  // Ensure arrays exist and conform to schema
  const sanitizedCulturalData: CulturalWebsiteData = {
    schemaVersion: '1.0',
    websiteType: isPuja ? 'puja_committee' : 'cultural_society',
    festivalType: culturalData.festivalType || existingCultural.festivalType || (isPuja ? 'durga_puja' : 'general_festival'),
    organization: org,
    branding: culturalData.branding || existingCultural.branding || {
      primaryColor: project.requirements.primaryColor || (isPuja ? '#991b1b' : '#881337'),
      accentColor: project.requirements.accentColor || '#d97706',
      typographyStyle: 'heritage'
    },
    leadership: Array.isArray(culturalData.leadership) ? culturalData.leadership : (Array.isArray(existingCultural.leadership) ? existingCultural.leadership : []),
    activities: Array.isArray(culturalData.activities) ? culturalData.activities : (Array.isArray(existingCultural.activities) ? existingCultural.activities : []),
    events: Array.isArray(culturalData.events) ? culturalData.events : (Array.isArray(existingCultural.events) ? existingCultural.events : []),
    gallery: Array.isArray(culturalData.gallery) ? culturalData.gallery : (Array.isArray(existingCultural.gallery) ? existingCultural.gallery : []),
    sponsors: Array.isArray(culturalData.sponsors) ? culturalData.sponsors : (Array.isArray(existingCultural.sponsors) ? existingCultural.sponsors : []),
    news: Array.isArray(culturalData.news) ? culturalData.news : (Array.isArray(existingCultural.news) ? existingCultural.news : []),
    donationInfo: culturalData.donationInfo !== undefined ? culturalData.donationInfo : existingCultural.donationInfo,
    membershipInfo: culturalData.membershipInfo !== undefined ? culturalData.membershipInfo : existingCultural.membershipInfo,
    pujaSchedule: Array.isArray(culturalData.pujaSchedule) ? culturalData.pujaSchedule : (Array.isArray(existingCultural.pujaSchedule) ? existingCultural.pujaSchedule : undefined),
    pujaTheme: culturalData.pujaTheme || (culturalData.pujaInfo?.themeName ? {
      currentThemeName: culturalData.pujaInfo.themeName,
      editionYear: String(culturalData.pujaInfo.edition || ''),
      themeConcept: culturalData.pujaInfo.themeDescription || '',
      idolArtisan: culturalData.pujaInfo.leadArtisan,
      themeImages: []
    } : existingCultural.pujaTheme),
    visitorGuide: culturalData.visitorGuide || existingCultural.visitorGuide,
    dataAvailability: {
      leadership: Array.isArray(culturalData.leadership) && culturalData.leadership.length > 0,
      activities: Array.isArray(culturalData.activities) && culturalData.activities.length > 0,
      events: Array.isArray(culturalData.events) && culturalData.events.length > 0,
      gallery: Array.isArray(culturalData.gallery) && culturalData.gallery.length > 0,
      sponsors: Array.isArray(culturalData.sponsors) && culturalData.sponsors.length > 0,
      news: Array.isArray(culturalData.news) && culturalData.news.some((n: any) => n.isPublished),
      pujaSchedule: Array.isArray(culturalData.pujaSchedule) && culturalData.pujaSchedule.length > 0,
      pujaTheme: Boolean(culturalData.pujaTheme?.currentThemeName),
      visitorGuide: Boolean(culturalData.visitorGuide?.pandalLocation),
      donationInfo: Boolean(culturalData.donationInfo?.appealMessage),
      membership: Boolean(culturalData.membershipInfo?.enabled)
    }
  };

  // Availability follows what is stored after the merge, so a partial update (say, only events) cannot mark untouched datasets as empty.
  sanitizedCulturalData.dataAvailability = {
    leadership: sanitizedCulturalData.leadership.length > 0,
    activities: sanitizedCulturalData.activities.length > 0,
    events: sanitizedCulturalData.events.length > 0,
    gallery: sanitizedCulturalData.gallery.length > 0,
    sponsors: sanitizedCulturalData.sponsors.length > 0,
    news: sanitizedCulturalData.news.some((n: any) => n.isPublished !== false),
    pujaSchedule: Boolean(sanitizedCulturalData.pujaSchedule?.length),
    pujaTheme: Boolean(sanitizedCulturalData.pujaTheme?.currentThemeName),
    visitorGuide: Boolean(sanitizedCulturalData.visitorGuide?.pandalLocation),
    donationInfo: Boolean(sanitizedCulturalData.donationInfo?.appealMessage),
    membership: Boolean(sanitizedCulturalData.membershipInfo?.enabled)
  };

  project.requirements.culturalData = sanitizedCulturalData;
  if (project.generatedWebsite) {
    project.generatedWebsite.culturalData = sanitizedCulturalData;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'UPDATE_CULTURAL_DATA', 'projects', id, {
    leadershipCount: sanitizedCulturalData.leadership.length,
    activitiesCount: sanitizedCulturalData.activities.length,
    eventsCount: sanitizedCulturalData.events.length,
    hasPujaSchedule: Boolean(sanitizedCulturalData.pujaSchedule?.length)
  });

  res.json({
    message: 'Cultural data updated successfully.',
    project,
    culturalData: sanitizedCulturalData
  });
});

// PATCH /api/projects/:id/event-data - Update and persist event domain data (ADMIN only)
router.patch('/:id/event-data', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { eventData } = req.body;
  if (!eventData || typeof eventData !== 'object') {
    res.status(400).json({ error: 'Valid event data payload is required.' });
    return;
  }

  const existingEvent = (project.requirements.eventData as any) || {};

  // Library-template projects: strict, non-fabricating update. A key that is sent replaces the stored one, a key that is not sent
  // is kept, nothing is invented, and stored RSVP replies are server-owned (a client payload can never overwrite or erase them).
  if (usesEventLibraryTemplate(project.requirements)) {
    const requested = eventData.category || project.requirements.eventCategory;
    if (!isKnownEventCategory(requested)) {
      res.status(400).json({ error: `Unknown event category "${String(requested)}".` });
      return;
    }
    const merged = { ...existingEvent, ...eventData, rsvpSubmissions: existingEvent.rsvpSubmissions || [] };
    const strict = normalizeEventDataStrict(merged, project.requirements, requested as EventCategory);
    project.requirements.eventData = strict;
    if (project.generatedWebsite) project.generatedWebsite.eventData = strict;
    project.updatedAt = new Date().toISOString();
    await repository.saveProject(project);
    await recordAudit(req, 'UPDATE_EVENT_DATA', 'projects', id, {
      category: strict.category, speakersCount: strict.speakers.length, sessionsCount: strict.sessions.length,
      ticketsCount: strict.tickets.length, sponsorsCount: strict.sponsors.length
    });
    res.json({ message: 'Event data updated successfully.', project, eventData: strict });
    return;
  }

  const category = eventData.category || project.requirements.eventCategory || (project.requirements.category === 'event' ? 'conference_seminar' : 'conference_seminar');
  const profileRaw = eventData.profile || existingEvent.profile || {};
  const brandingRaw = eventData.branding || existingEvent.branding || {};

  const profile = {
    name: profileRaw.name || project.requirements.organizationName || 'Event Experience',
    edition: profileRaw.edition || '2026 Edition',
    tagline: profileRaw.tagline || project.requirements.tagline || '',
    description: profileRaw.description || project.requirements.aboutText || 'Premier gathering of industry visionaries.',
    startDate: profileRaw.startDate || '2026-11-20',
    endDate: profileRaw.endDate || '2026-11-22',
    time: profileRaw.time || '09:00 AM - 06:00 PM',
    timezone: profileRaw.timezone || 'IST',
    venueName: profileRaw.venueName || project.requirements.address || 'Convention & Exhibition Center',
    venueAddress: profileRaw.venueAddress || project.requirements.address || 'Grand Avenue',
    city: profileRaw.city || 'Bangalore',
    country: profileRaw.country || 'India',
    isVirtual: Boolean(profileRaw.isVirtual),
    isHybrid: Boolean(profileRaw.isHybrid),
    virtualStreamUrl: profileRaw.virtualStreamUrl,
    organizerName: profileRaw.organizerName || project.requirements.contactPerson || 'Event Committee',
    organizerEmail: profileRaw.organizerEmail || project.requirements.contactEmail || 'contact@event.internal',
    organizerPhone: profileRaw.organizerPhone || project.requirements.contactPhone || '+91 80 4000 0000',
    socialLinks: profileRaw.socialLinks || project.requirements.socialLinks || {}
  };

  const branding = {
    primaryColor: brandingRaw.primaryColor || project.requirements.primaryColor || '#3b82f6',
    accentColor: brandingRaw.accentColor || project.requirements.accentColor || '#06b6d4',
    backgroundColor: brandingRaw.backgroundColor,
    typographyStyle: brandingRaw.typographyStyle || project.requirements.typographyStyle || 'modern',
    preferredTheme: brandingRaw.preferredTheme,
    logoUrl: brandingRaw.logoUrl || project.requirements.logoUrl,
    coverImageUrl: brandingRaw.coverImageUrl || project.requirements.coverImageUrl,
    badgeText: brandingRaw.badgeText || profile.edition
  };

  const speakers = Array.isArray(eventData.speakers) ? eventData.speakers : (Array.isArray(existingEvent.speakers) ? existingEvent.speakers : []);
  const tracks = Array.isArray(eventData.tracks) ? eventData.tracks : (Array.isArray(existingEvent.tracks) ? existingEvent.tracks : []);
  const sessions = Array.isArray(eventData.sessions) ? eventData.sessions : (Array.isArray(existingEvent.sessions) ? existingEvent.sessions : []);
  const tickets = Array.isArray(eventData.tickets) ? eventData.tickets : (Array.isArray(existingEvent.tickets) ? existingEvent.tickets : []);
  const exhibitors = Array.isArray(eventData.exhibitors) ? eventData.exhibitors : (Array.isArray(existingEvent.exhibitors) ? existingEvent.exhibitors : []);
  const awardCategories = Array.isArray(eventData.awardCategories) ? eventData.awardCategories : (Array.isArray(existingEvent.awardCategories) ? existingEvent.awardCategories : []);
  const weddingStory = eventData.weddingStory !== undefined ? eventData.weddingStory : existingEvent.weddingStory;
  const productLaunch = eventData.productLaunch !== undefined ? eventData.productLaunch : existingEvent.productLaunch;
  const sponsors = Array.isArray(eventData.sponsors) ? eventData.sponsors : (Array.isArray(existingEvent.sponsors) ? existingEvent.sponsors : []);
  const venue = eventData.venue || existingEvent.venue || {
    venueName: profile.venueName,
    address: profile.venueAddress,
    city: profile.city,
    country: profile.country
  };
  const faqs = Array.isArray(eventData.faqs) ? eventData.faqs : (Array.isArray(existingEvent.faqs) ? existingEvent.faqs : []);
  const gallery = Array.isArray(eventData.gallery) ? eventData.gallery : (Array.isArray(existingEvent.gallery) ? existingEvent.gallery : []);
  const rsvpSubmissions = Array.isArray(eventData.rsvpSubmissions) ? eventData.rsvpSubmissions : (Array.isArray(existingEvent.rsvpSubmissions) ? existingEvent.rsvpSubmissions : []);

  const sanitizedEventData: EventWebsiteData = {
    schemaVersion: '1.0',
    category,
    profile,
    branding,
    speakers,
    tracks,
    sessions,
    tickets,
    exhibitors,
    awardCategories,
    weddingStory,
    productLaunch,
    sponsors,
    venue,
    faqs,
    gallery,
    rsvpSubmissions,
    dataAvailability: {
      speakers: speakers.length > 0,
      schedule: sessions.length > 0,
      tickets: tickets.length > 0,
      exhibitors: exhibitors.length > 0,
      awards: awardCategories.length > 0,
      weddingStory: Boolean(weddingStory && (weddingStory.coupleNames || weddingStory.storyMilestones?.length)),
      productLaunch: Boolean(productLaunch && productLaunch.productName),
      sponsors: sponsors.length > 0,
      venue: Boolean(venue.venueName || venue.address),
      faqs: faqs.length > 0,
      gallery: gallery.length > 0
    }
  };

  project.requirements.eventData = sanitizedEventData;
  if (project.generatedWebsite) {
    project.generatedWebsite.eventData = sanitizedEventData;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'UPDATE_EVENT_DATA', 'projects', id, {
    category: sanitizedEventData.category,
    speakersCount: sanitizedEventData.speakers.length,
    sessionsCount: sanitizedEventData.sessions.length,
    ticketsCount: sanitizedEventData.tickets.length,
    sponsorsCount: sanitizedEventData.sponsors.length
  });

  res.json({
    message: 'Event data updated successfully.',
    project,
    eventData: sanitizedEventData
  });
});

// RSVP replies are accepted from the public website. They are validated, rate limited per visitor and project, capped per project,
// stored privately (the public site payload never carries them) and only for Event projects.
const RSVP_WINDOW_MS = 60 * 60 * 1000;
const RSVP_MAX_PER_WINDOW = 10;
const RSVP_MAX_STORED = 2000;
const rsvpHits = new Map<string, number[]>();
const rsvpRateLimited = (key: string): boolean => {
  const now = Date.now();
  const recent = (rsvpHits.get(key) || []).filter((t) => now - t < RSVP_WINDOW_MS);
  if (recent.length >= RSVP_MAX_PER_WINDOW) { rsvpHits.set(key, recent); return true; }
  recent.push(now);
  rsvpHits.set(key, recent);
  if (rsvpHits.size > 5000) for (const [k, v] of rsvpHits) if (!v.some((t) => now - t < RSVP_WINDOW_MS)) rsvpHits.delete(k);
  return false;
};
const cleanText = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  return t || undefined;
};

// POST /api/projects/:id/rsvp - Public RSVP submission for wedding or invite-only event
router.post('/:id/rsvp', async (req: any, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project || !isEventReqs(project.requirements)) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  if (rsvpRateLimited(`${req.ip || 'anon'}:${id}`)) {
    res.status(429).json({ error: 'Too many RSVP attempts. Please try again later.' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const guestName = cleanText(body.guestName, 120);
  const guestEmail = cleanText(body.guestEmail, 254);
  if (!guestName || !guestEmail) {
    res.status(400).json({ error: 'Guest name and email are required for RSVP.' });
    return;
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(guestEmail)) {
    res.status(400).json({ error: 'A valid email address is required for RSVP.' });
    return;
  }

  const existingEvent = (project.requirements.eventData as any) || {};
  const currentSubmissions = Array.isArray(existingEvent.rsvpSubmissions) ? existingEvent.rsvpSubmissions : [];
  if (currentSubmissions.length >= RSVP_MAX_STORED) {
    res.status(409).json({ error: 'This event is no longer accepting replies.' });
    return;
  }

  const plusOnes = Math.min(20, Math.max(0, Math.trunc(Number(body.plusOnes)) || 0));
  const submission: EventRSVPSubmission = {
    id: `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    guestName,
    guestEmail,
    attending: body.attending === 'declined' ? 'declined' : body.attending === 'tentative' ? 'tentative' : 'attending',
    mealPreference: cleanText(body.mealPreference, 120),
    dietaryNotes: cleanText(body.dietaryNotes, 500),
    plusOnes,
    songRequest: cleanText(body.songRequest, 200),
    createdAt: new Date().toISOString()
  };

  currentSubmissions.push(submission);
  existingEvent.rsvpSubmissions = currentSubmissions;
  project.requirements.eventData = existingEvent;
  if (project.generatedWebsite) {
    project.generatedWebsite.eventData = existingEvent;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  res.json({
    message: 'RSVP submitted successfully.',
    submission
  });
});

// PATCH /api/projects/:id/ngo-data - Update and persist Social & NGO domain data (ADMIN only)
router.patch('/:id/ngo-data', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { ngoData } = req.body;
  if (!ngoData || typeof ngoData !== 'object') {
    res.status(400).json({ error: 'Valid Social & NGO data payload is required.' });
    return;
  }

  const existingNGO = (project.requirements.ngoData as any) || {};
  const archetype = ngoData.archetype || project.requirements.ngoArchetype || 'grassroots_ngo';

  if (usesNgoLibraryTemplate(project.requirements)) {
    // Library templates keep exactly what the organisation entered: nothing is invented and submissions stored in the database are not overwritten by the request.
    const merged = {
      ...existingNGO,
      ...ngoData,
      profile: { ...(existingNGO.profile || {}), ...(ngoData.profile || {}) },
      branding: { ...(existingNGO.branding || {}), ...(ngoData.branding || {}) },
      volunteerSubmissions: existingNGO.volunteerSubmissions,
      donationEnquiries: existingNGO.donationEnquiries
    };
    const strictData = normalizeNGODataStrict(merged, project.requirements, archetype);
    project.requirements.ngoData = strictData;
    if (project.generatedWebsite) project.generatedWebsite.ngoData = strictData;
    project.updatedAt = new Date().toISOString();
    await repository.saveProject(project);
    await recordAudit(req, 'UPDATE_NGO_DATA', 'projects', id, { archetype: strictData.archetype, programsCount: strictData.programs.length, library: true });
    res.json({ message: 'Social & NGO data updated successfully.', project, ngoData: strictData });
    return;
  }

  const profileRaw = ngoData.profile || existingNGO.profile || {};
  const brandingRaw = ngoData.branding || existingNGO.branding || {};

  const profile = {
    name: profileRaw.name || project.requirements.organizationName || 'Gram Chetna Social Welfare Society',
    legalRegisteredName: profileRaw.legalRegisteredName || profileRaw.name || project.requirements.organizationName,
    registrationNumber: profileRaw.registrationNumber || '',
    foundedYear: profileRaw.foundedYear || '2018',
    tagline: profileRaw.tagline || project.requirements.tagline || 'Dignity Not Charity',
    missionStatement: profileRaw.missionStatement || 'Empowering communities through sustainable social programs.',
    visionStatement: profileRaw.visionStatement || 'An equitable society where every individual lives with dignity.',
    coreValues: Array.isArray(profileRaw.coreValues) ? profileRaw.coreValues : ['Dignity', 'Accountability', 'Empathy'],
    aboutDescription: profileRaw.aboutDescription || project.requirements.aboutText || 'A registered non-profit organization.',
    taxExemptionNotice: profileRaw.taxExemptionNotice || 'All donations are 50% tax exempt under Section 80G.',
    operationalRegions: Array.isArray(profileRaw.operationalRegions) ? profileRaw.operationalRegions : ['Pan-India'],
    headquartersAddress: profileRaw.headquartersAddress || project.requirements.address || 'New Delhi, India',
    city: profileRaw.city || 'New Delhi',
    country: profileRaw.country || 'India',
    contactEmail: profileRaw.contactEmail || project.requirements.contactEmail || 'secretariat@organization.org',
    contactPhone: profileRaw.contactPhone || project.requirements.contactPhone || '+91 11 4000 8000',
    websiteUrl: profileRaw.websiteUrl
  };

  const branding = {
    primaryColor: brandingRaw.primaryColor || project.requirements.primaryColor || '#14532d',
    accentColor: brandingRaw.accentColor || project.requirements.accentColor || '#c2410c',
    typographyStyle: brandingRaw.typographyStyle || project.requirements.typographyStyle || 'grassroots',
    badgeText: brandingRaw.badgeText || 'DIGNITY NOT CHARITY'
  };

  const programs = Array.isArray(ngoData.programs) ? ngoData.programs : existingNGO.programs || [];
  const impactStats = Array.isArray(ngoData.impactStats) ? ngoData.impactStats : existingNGO.impactStats || [];
  const campaigns = Array.isArray(ngoData.campaigns) ? ngoData.campaigns : existingNGO.campaigns || [];
  const causes = Array.isArray(ngoData.causes) ? ngoData.causes : existingNGO.causes || [];
  const leadership = Array.isArray(ngoData.leadership) ? ngoData.leadership : existingNGO.leadership || [];
  const volunteering = ngoData.volunteering || existingNGO.volunteering || { enabled: true, headline: 'Join Our Volunteer Mission', description: 'Be part of real change on the ground.', opportunities: [] };
  const volunteerSubmissions = Array.isArray(existingNGO.volunteerSubmissions) ? existingNGO.volunteerSubmissions : [];
  const collectionCenters = Array.isArray(ngoData.collectionCenters) ? ngoData.collectionCenters : existingNGO.collectionCenters || [];
  const donationModel = ngoData.donationModel || existingNGO.donationModel || {
    headline: 'Support Our Mission with Verified 80G Tax Benefits',
    subheadline: '100% of your public contribution directly impacts field programs.',
    donationTiers: [],
    customAmountAllowed: true,
    taxDeductible: true,
    eightyGRegNumber: 'AAATG1234PF20214',
    enquiryOnly: false
  };
  const donationEnquiries = Array.isArray(existingNGO.donationEnquiries) ? existingNGO.donationEnquiries : [];
  const stories = Array.isArray(ngoData.stories) ? ngoData.stories : existingNGO.stories || [];
  const reports = Array.isArray(ngoData.reports) ? ngoData.reports : existingNGO.reports || [];
  const partners = Array.isArray(ngoData.partners) ? ngoData.partners : existingNGO.partners || [];
  const faqs = Array.isArray(ngoData.faqs) ? ngoData.faqs : existingNGO.faqs || [];
  const gallery = Array.isArray(ngoData.gallery) ? ngoData.gallery : existingNGO.gallery || [];

  const sanitizedNGOData: NGOWebsiteData = {
    schemaVersion: '1.0',
    archetype,
    profile,
    branding,
    programs,
    impactStats,
    campaigns,
    causes,
    leadership,
    volunteering,
    volunteerSubmissions,
    collectionCenters,
    donationModel,
    donationEnquiries,
    stories,
    reports,
    partners,
    faqs,
    gallery,
    dataAvailability: {
      programs: programs.length > 0,
      impactStats: impactStats.length > 0,
      campaigns: campaigns.length > 0,
      causes: causes.length > 0,
      leadership: leadership.length > 0,
      volunteering: Boolean(volunteering.enabled),
      collectionCenters: collectionCenters.length > 0,
      donationModel: Boolean(donationModel.donationTiers?.length || donationModel.headline),
      stories: stories.length > 0,
      reports: reports.length > 0,
      partners: partners.length > 0,
      faqs: faqs.length > 0,
      gallery: gallery.length > 0
    }
  };

  project.requirements.ngoData = sanitizedNGOData;
  if (project.generatedWebsite) {
    project.generatedWebsite.ngoData = sanitizedNGOData;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'UPDATE_NGO_DATA', 'projects', id, {
    archetype: sanitizedNGOData.archetype,
    programsCount: sanitizedNGOData.programs.length,
    impactStatsCount: sanitizedNGOData.impactStats.length,
    campaignsCount: sanitizedNGOData.campaigns.length,
    reportsCount: sanitizedNGOData.reports.length
  });

  res.json({
    message: 'Social & NGO data updated successfully.',
    project,
    ngoData: sanitizedNGOData
  });
});

// POST /api/projects/:id/volunteer - Public Volunteer Application Submission
router.post('/:id/volunteer', async (req: any, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const name = req.body.applicantName || req.body.fullName;
  const email = req.body.applicantEmail || req.body.email;
  const phone = req.body.applicantPhone || req.body.phone;
  const { roleInterest, city, availability, skillsSummary } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Applicant name and email are required for volunteer application.' });
    return;
  }

  const existingNGO = (project.requirements.ngoData as any) || {};
  const currentSubmissions = Array.isArray(existingNGO.volunteerSubmissions) ? existingNGO.volunteerSubmissions : [];

  const submission: NGOVolunteerApplication = {
    id: `vol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    applicantName: String(name).trim(),
    applicantEmail: String(email).trim(),
    applicantPhone: phone ? String(phone).trim() : '',
    roleInterest: roleInterest ? String(roleInterest).trim() : 'General Community Outreach',
    city: city ? String(city).trim() : 'Local Chapter',
    availability: availability ? String(availability).trim() : 'Weekends (4-6 hrs)',
    skillsSummary: skillsSummary ? String(skillsSummary).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  currentSubmissions.push(submission);
  existingNGO.volunteerSubmissions = currentSubmissions;
  project.requirements.ngoData = existingNGO;
  if (project.generatedWebsite) {
    project.generatedWebsite.ngoData = existingNGO;
  }
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  res.status(201).json({
    success: true,
    message: `Volunteer application for ${name} submitted successfully.`,
    applicationId: submission.id,
    submission
  });
});

// POST /api/projects/:id/donation-enquiry - RETIRED. Generated Social & NGO sites carry no pledge, donor-detail or tax-receipt forms and
// DigiVerse does not collect donor information. Pledges already stored on existing projects are left untouched.
router.post('/:id/donation-enquiry', (_req: any, res: Response): void => {
  res.status(410).json({
    error: 'Donation pledges are no longer collected through generated websites. Please contact the organization directly to find out how to support its work.'
  });
});

// POST /api/projects/:id/regenerate-section - AI-assisted section re-generation (ADMIN only)
router.post('/:id/regenerate-section', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  if (!project.generatedWebsite) {
    res.status(400).json({ error: 'Cannot regenerate sections before website has been generated.' });
    return;
  }

  const { section } = req.body;
  if (!section) {
    res.status(400).json({ error: 'Section identifier is required.' });
    return;
  }

  const category = project.requirements.category || project.requirements.organizationType || 'cultural';
  const isBengali = project.requirements.websiteLanguage === 'bengali' ||
                    project.requirements.websiteLanguage === 'bilingual' ||
                    project.requirements.preferredLanguage === 'bengali' ||
                    project.requirements.preferredLanguage === 'bilingual';

  const partial = regenerateSection(category, section, project.requirements.organizationName, isBengali);

  project.generatedWebsite = {
    ...project.generatedWebsite,
    ...partial
  };
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'REGENERATE_SECTION', 'projects', id, { section });

  res.json({
    message: `Section '${section}' regenerated successfully.`,
    regeneratedSection: section,
    project
  });
});

// GET /api/projects/:id/variations - List design variations (revisions) for project
router.get('/:id/variations', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const variations = await repository.listRevisionsByProject(id);
  res.json({ variations, activeRevisionId: project.activeRevisionId });
});

// POST /api/projects/:id/variations - Generate a new design variation (ADMIN only)
router.post('/:id/variations', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const { variationLabel, label: legacyLabel, layoutPreset, themeAccent, changelogNotes } = req.body;
  const existing = await repository.listRevisionsByProject(id);
  const versionNumber = existing.length + 1;
  const label = variationLabel || legacyLabel || `Design V${versionNumber} - ${layoutPreset || 'Alternative'}`;

  // Synthesize website variation.
  const driveItems = await repository.getDriveMediaByProject(id);
  const youtubeVideos = await repository.getYouTubeVideosByProject(id);
  const reqCopy = { ...project.requirements };
  if (themeAccent) reqCopy.primaryColor = '';
  const websiteData = synthesizeWebsite(reqCopy, driveItems, youtubeVideos);

  if (layoutPreset) websiteData.layoutPreset = layoutPreset;
  if (themeAccent) websiteData.themeAccent = themeAccent;

  const now = new Date().toISOString();
  const revisionId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newRev: ProjectRevision = {
    id: revisionId,
    projectId: id,
    versionNumber,
    variationLabel: label,
    websiteData,
    isApproved: false,
    createdByAdminId: req.user!.id,
    changelogNotes: changelogNotes || 'Generated via Design Studio',
    createdAt: now
  };

  await repository.createRevision(newRev);

  await recordAudit(req, 'CREATE_DESIGN_VARIATION', 'projects', id, {
    revisionId,
    versionNumber,
    variationLabel: label
  });

  res.status(201).json({
    message: `Design variation '${label}' created successfully.`,
    variation: newRev
  });
});

// POST /api/projects/:id/variations/:revisionId/activate - Switch active design variation (ADMIN only)
router.post('/:id/variations/:revisionId/activate', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const revisionId = String(req.params.revisionId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const revision = await repository.getRevisionById(revisionId);
  if (!revision || revision.projectId !== id) {
    res.status(404).json({ error: 'Design variation revision not found.' });
    return;
  }

  project.generatedWebsite = revision.websiteData;
  project.activeRevisionId = revision.id;
  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'ACTIVATE_DESIGN_VARIATION', 'projects', id, {
    revisionId,
    variationLabel: revision.variationLabel
  });

  res.json({
    message: `Design variation '${revision.variationLabel}' is now the active website design.`,
    activeRevisionId: revision.id,
    project
  });
});

// GET /api/projects/:id/revisions - List all revisions with active and approved markers (ADMIN only)
router.get('/:id/revisions', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const revisions = await repository.listRevisionsByProject(id);
  const enriched = revisions.map(rev => ({
    ...rev,
    isActive: rev.id === project.activeRevisionId,
    isApproved: rev.id === project.approvedRevisionId || Boolean(rev.isApproved)
  }));

  res.json({
    projectId: id,
    activeRevisionId: project.activeRevisionId,
    approvedRevisionId: project.approvedRevisionId,
    projectStatus: project.status,
    revisions: enriched
  });
});

// GET /api/projects/:id/revisions/compare - Compare two revisions (ADMIN only)
router.get('/:id/revisions/compare', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const baseRevisionId = String(req.query.baseRevisionId || req.query.base || '');
  const targetRevisionId = String(req.query.targetRevisionId || req.query.target || '');

  if (!baseRevisionId || !targetRevisionId) {
    res.status(400).json({ error: 'Both baseRevisionId and targetRevisionId query parameters are required.' });
    return;
  }

  const baseRevision = await repository.getRevisionById(baseRevisionId);
  const targetRevision = await repository.getRevisionById(targetRevisionId);

  if (!baseRevision || baseRevision.projectId !== id) {
    res.status(404).json({ error: 'Base revision not found.' });
    return;
  }
  if (!targetRevision || targetRevision.projectId !== id) {
    res.status(404).json({ error: 'Target revision not found.' });
    return;
  }

  const diff = compareRevisions(baseRevision, targetRevision);
  res.json({ diff });
});

// GET /api/projects/:id/revisions/approved - Get approved revision & status (ADMIN only)
router.get('/:id/revisions/approved', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const approvedRevision = project.approvedRevisionId
    ? await repository.getRevisionById(project.approvedRevisionId)
    : await repository.getApprovedRevision(id);

  res.json({
    projectId: id,
    hasApprovedRevision: Boolean(approvedRevision),
    approvedRevisionId: project.approvedRevisionId || approvedRevision?.id,
    approvalDetails: project.approvalDetails,
    approvedRevision
  });
});

// GET /api/projects/:id/revisions/:revisionId - Get specific revision snapshot (ADMIN only)
router.get('/:id/revisions/:revisionId', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const revisionId = String(req.params.revisionId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const revision = await repository.getRevisionById(revisionId);
  if (!revision || revision.projectId !== id) {
    res.status(404).json({ error: 'Revision not found.' });
    return;
  }

  res.json({
    revision: {
      ...revision,
      isActive: revision.id === project.activeRevisionId,
      isApproved: revision.id === project.approvedRevisionId || Boolean(revision.isApproved)
    }
  });
});

// POST /api/projects/:id/revisions/:revisionId/rollback - Rollback active website to earlier revision (ADMIN only)
router.post('/:id/revisions/:revisionId/rollback', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const revisionId = String(req.params.revisionId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const targetRevision = await repository.getRevisionById(revisionId);
  if (!targetRevision || targetRevision.projectId !== id) {
    res.status(404).json({ error: 'Target rollback revision not found.' });
    return;
  }

  if (project.activeRevisionId === targetRevision.id) {
    res.status(400).json({ error: 'This revision is already the active design.' });
    return;
  }

  const previousRevisionId = project.activeRevisionId;

  // Rollback active design state.
  project.generatedWebsite = targetRevision.websiteData;
  project.activeRevisionId = targetRevision.id;

  // Protected approved status behavior:
  // If rolling back to the approved revision, maintain status as client_approved.
  // If rolling back to a non-approved revision while status was client_approved,
  // transition to in_revision so changes can be reworked, while PRESERVING approved_revision_id.
  if (project.approvedRevisionId === targetRevision.id) {
    project.status = 'client_approved';
  } else if (project.status === 'client_approved') {
    project.status = 'in_revision';
  }

  project.updatedAt = new Date().toISOString();
  await repository.saveProject(project);

  await recordAudit(req, 'ROLLBACK_REVISION', 'projects', id, {
    fromRevisionId: previousRevisionId,
    toRevisionId: targetRevision.id,
    toVersionNumber: targetRevision.versionNumber,
    toVariationLabel: targetRevision.variationLabel
  });

  res.json({
    success: true,
    message: `Successfully rolled back active design to '${targetRevision.variationLabel}' (Version ${targetRevision.versionNumber}).`,
    activeRevisionId: targetRevision.id,
    project
  });
});

// PATCH /api/projects/:id/revisions/:revisionId - Update revision changelog notes or label (ADMIN only)
router.patch('/:id/revisions/:revisionId', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const revisionId = String(req.params.revisionId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const revision = await repository.getRevisionById(revisionId);
  if (!revision || revision.projectId !== id) {
    res.status(404).json({ error: 'Revision not found.' });
    return;
  }

  const { changelogNotes, variationLabel } = req.body;
  const updated = await repository.updateRevision(revisionId, { changelogNotes, variationLabel });
  if (!updated) {
    res.status(500).json({ error: 'Failed to update revision metadata.' });
    return;
  }

  await recordAudit(req, 'UPDATE_REVISION_METADATA', 'projects', id, {
    revisionId,
    changelogNotes,
    variationLabel
  });

  res.json({
    success: true,
    message: 'Revision details updated successfully.',
    revision: await repository.getRevisionById(revisionId)
  });
});

// POST /api/projects/:id/preview-tokens - Generate client preview token (ADMIN only)
router.post('/:id/preview-tokens', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  if (!project.generatedWebsite) {
    res.status(400).json({ error: 'Cannot generate preview token before generating website.' });
    return;
  }

  const { expiresInHours, expiresAt: customExpiresAt, revisionId } = req.body;
  const hours = typeof expiresInHours === 'number' ? expiresInHours : 168; // 7 days default
  const tokenString = `prev_${randomBytes(18).toString('hex')}`;
  const expiresAt = customExpiresAt || new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const targetRevisionId = revisionId || project.activeRevisionId || 'v1_initial';

  const previewToken: PreviewToken = {
    id: `pt_${Date.now()}_${randomBytes(4).toString('hex')}`,
    projectId: id,
    revisionId: targetRevisionId,
    token: tokenString,
    isActive: true,
    viewCount: 0,
    createdByAdminId: req.user?.id,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  await repository.createPreviewToken(previewToken);

  await recordAudit(req, 'GENERATE_PREVIEW_TOKEN', 'projects', id, {
    tokenId: previewToken.id,
    token: tokenString,
    revisionId: targetRevisionId,
    expiresAt
  });

  res.status(201).json({
    message: 'Client preview token generated successfully.',
    token: previewToken,
    previewToken,
    previewUrl: `/preview/${tokenString}`
  });
});

// GET /api/projects/:id/preview-tokens - List all preview tokens for a project (ADMIN only)
router.get('/:id/preview-tokens', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const tokens = await repository.listPreviewTokensByProject(id);
  res.json({ tokens });
});

// POST /api/projects/:id/preview-tokens/:tokenId/revoke - Revoke a preview token (ADMIN only)
router.post('/:id/preview-tokens/:tokenId/revoke', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const tokenId = String(req.params.tokenId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const revoked = await repository.revokePreviewToken(tokenId);
  if (!revoked) {
    res.status(404).json({ error: 'Preview token not found or already revoked.' });
    return;
  }

  await recordAudit(req, 'REVOKE_PREVIEW_TOKEN', 'projects', id, { tokenId });

  res.json({ message: 'Preview token revoked successfully.' });
});

// GET /api/projects/:id/feedback - List all client feedback for a project (ADMIN only)
router.get('/:id/feedback', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const feedback = await repository.listFeedbackByProject(id);
  res.json({ feedback, approvalDetails: project.approvalDetails });
});

// PATCH /api/projects/:id/feedback/:feedbackId/resolve - Resolve / unresolve a feedback item (ADMIN only)
router.patch('/:id/feedback/:feedbackId/resolve', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const feedbackId = String(req.params.feedbackId);

  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const resolved = req.body.resolved !== undefined ? Boolean(req.body.resolved) : true;
  const updated = await repository.resolveFeedback(feedbackId, resolved);
  if (!updated) {
    res.status(404).json({ error: 'Feedback record not found.' });
    return;
  }

  await recordAudit(req, 'RESOLVE_FEEDBACK', 'projects', id, { feedbackId, resolved });

  res.json({ message: `Feedback marked as ${resolved ? 'resolved' : 'unresolved'}.`, resolved });
});

// Publishing (centralized Vercel integration). Approval, revision locks and payments no longer gate publishing.
// The /approve route was removed. Everything below is a thin alias of routes/publishing.ts.

// GET /api/projects/:id/publishing/preflight - Technical checks before publishing
router.get('/:id/publishing/preflight', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const preflight = await deploymentService.preflight(id, {
      siteSlug: typeof req.query.siteSlug === 'string' ? req.query.siteSlug : undefined,
      requestOrigin: requestOrigin(req)
    });
    res.json(preflight);
  } catch (err: unknown) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Project not found.' });
  }
});

// POST /api/projects/:id/publish - Publish (or update) the website. Alias of /publishing/publish.
router.post('/:id/publish', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => publishHandler(req, res, false));

// POST /api/projects/:id/unpublish - Take the website offline. Alias of /publishing/unpublish.
router.post('/:id/unpublish', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), unpublishHandler);

// POST /api/projects/:id/deploy - Legacy alias of /publish for older clients.
router.post('/:id/deploy', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => publishHandler(req, res, false));

// DELETE /api/projects/:id - Delete project (ADMIN & SUPER_ADMIN)
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  // Remove the client's external hosting project first (best effort; the outcome is audited).
  const released = await deploymentService.releaseHosting(id);

  const success = await repository.deleteProject(id);
  if (!success) {
    res.status(500).json({ error: 'Failed to delete project.' });
    return;
  }

  await recordAudit(req, 'DELETE_PROJECT', 'projects', id, {
    orgName: project.requirements.organizationName,
    hostingReleased: released.released,
    hostingMessage: released.message
  });

  res.json({ success: true, message: `Project '${project.requirements.organizationName}' deleted successfully.` });
});

// --- COMMERCIAL, QUOTATIONS & BILLING ENDPOINTS ---

// GET /api/projects/:id/commercial - Get commercial tracking record & delivery clearance
router.get('/:id/commercial', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const recordWithClearance = await commercialService.getCommercialRecord(id);
  if (!recordWithClearance) {
    const created = await commercialService.saveQuotation(id, {
      quotationAmount: 0,
      currency: 'INR',
      quotationStatus: 'draft'
    });
    const clearance = await commercialService.getCommercialClearance(created);
    res.json({ commercialRecord: created, clearance });
    return;
  }

  res.json(recordWithClearance);
});

// POST /api/projects/:id/quotation - Create or update quotation for project
router.post('/:id/quotation', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const {
    quotationNumber,
    quotationAmount,
    currency,
    quotationStatus,
    scopeItems,
    paymentTerms,
    validUntil,
    notes
  } = req.body;

  try {
    const updated = await commercialService.saveQuotation(id, {
      quotationNumber,
      quotationAmount,
      currency,
      quotationStatus,
      scopeItems,
      paymentTerms,
      validUntil,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'UPDATE_QUOTATION', 'commercial_records', updated.id, {
      projectId: id,
      quotationNumber: updated.quotationNumber,
      quotationAmount: updated.quotationAmount,
      quotationStatus: updated.quotationStatus
    });

    res.json({
      success: true,
      message: `Quotation ${updated.quotationNumber} saved with status '${updated.quotationStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update quotation.' });
  }
});

// POST /api/projects/:id/invoice - Issue or update official invoice
router.post('/:id/invoice', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    invoiceStatus,
    notes
  } = req.body;

  try {
    const updated = await commercialService.issueInvoice(id, {
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceStatus,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'ISSUE_INVOICE', 'commercial_records', updated.id, {
      projectId: id,
      invoiceNumber: updated.invoiceNumber,
      invoiceStatus: updated.invoiceStatus
    });

    res.json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} recorded with status '${updated.invoiceStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to issue invoice.' });
  }
});

// POST /api/projects/:id/payments - Record client payment received
router.post('/:id/payments', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const {
    amount,
    currency,
    paymentMethod,
    transactionReference,
    notes
  } = req.body;

  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid payment amount greater than zero is required.' });
    return;
  }

  if (!paymentMethod) {
    res.status(400).json({ error: 'Payment method is required.' });
    return;
  }

  try {
    const adminId = req.user?.id || 'usr_admin_01';
    const updated = await commercialService.recordPayment(id, adminId, {
      amount: Number(amount),
      currency,
      paymentMethod,
      transactionReference,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'RECORD_PAYMENT', 'commercial_transactions', id, {
      amount: Number(amount),
      paymentMethod,
      transactionReference,
      totalPaidSoFar: updated.amountPaid,
      paymentStatus: updated.paymentStatus
    });

    res.json({
      success: true,
      message: `Payment of ${updated.currency} ${amount} logged successfully. Total paid: ${updated.currency} ${updated.amountPaid}. Status: ${updated.paymentStatus}.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to record payment.' });
  }
});

// PATCH /api/projects/:id/commercial-status - Update commercial stage & delivery status
router.patch('/:id/commercial-status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const project = await repository.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Client project not found.' });
    return;
  }

  const { commercialStatus, notes } = req.body;
  if (!commercialStatus) {
    res.status(400).json({ error: 'commercialStatus is required.' });
    return;
  }

  try {
    const updated = await commercialService.updateCommercialStatus(id, commercialStatus, notes);
    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'UPDATE_COMMERCIAL_STATUS', 'commercial_records', updated.id, {
      projectId: id,
      commercialStatus: updated.commercialStatus,
      notes
    });

    res.json({
      success: true,
      message: `Commercial status updated to '${updated.commercialStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update commercial status.' });
  }
});

export default router;