import { Router, Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { ClientFeedback } from '../types/index.js';
import { sanitizeWebsiteForPublic } from '../services/publicSiteSanitizer.js';

const router = Router();

/**
 * GET /api/preview/:token
 * Public, read-only endpoint for clients to view generated website.
 * No internal admin credentials or sensitive platform metadata exposed.
 */
router.get('/:token', async (req: Request, res: Response) => {
  const token = String(req.params.token);

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Valid preview token parameter required.' });
    return;
  }

  const tokenData = await repository.getPreviewToken(token);
  if (!tokenData) {
    res.status(404).json({ 
      error: 'Preview link not found or invalid.', 
      code: 'TOKEN_NOT_FOUND' 
    });
    return;
  }

  if (!tokenData.isActive) {
    res.status(410).json({ 
      error: 'This preview link has been revoked by the Digiverse administrator.', 
      code: 'TOKEN_REVOKED' 
    });
    return;
  }

  const expiresTime = new Date(tokenData.expiresAt).getTime();
  if (expiresTime < Date.now()) {
    res.status(410).json({ 
      error: 'This preview link has expired. Please contact your Digiverse administrator for a renewed preview link.', 
      code: 'TOKEN_EXPIRED' 
    });
    return;
  }

  // Increment view counter and update last viewed timestamp
  await repository.recordTokenView(token);

  const project = await repository.getProjectById(tokenData.projectId);
  if (!project) {
    res.status(404).json({ error: 'Associated client project not found.', code: 'PROJECT_NOT_FOUND' });
    return;
  }

  // Retrieve website data from specified revision or fallback to active generated website
  let revision = tokenData.revisionId ? await repository.getRevisionById(tokenData.revisionId) : null;
  let websiteData = revision ? revision.websiteData : project.generatedWebsite;

  if (!websiteData) {
    res.status(404).json({ error: 'Website design has not yet been generated for this project.', code: 'NOT_GENERATED' });
    return;
  }

  // Check if this revision is the approved one
  const isApproved = Boolean(
    project.approvedRevisionId && 
    (project.approvedRevisionId === tokenData.revisionId || (revision && revision.isApproved))
  );

  // Return strictly sanitized client-facing response
  res.json({
    token: tokenData.token,
    expiresAt: tokenData.expiresAt,
    viewCount: (tokenData.viewCount || 0) + 1,
    organizationName: project.requirements.organizationName,
    category: project.requirements.category,
    status: project.status,
    isApproved,
    approvalDetails: project.approvalDetails,
    requirements: {
      organizationName: project.requirements.organizationName,
      category: project.requirements.category,
      subcategory: project.requirements.subcategory,
      tagline: project.requirements.tagline,
      aboutText: project.requirements.aboutText,
      contactPerson: project.requirements.contactPerson,
      contactEmail: project.requirements.contactEmail,
      contactPhone: project.requirements.contactPhone,
      address: project.requirements.address,
      logoUrl: project.requirements.logoUrl,
      coverImageUrl: project.requirements.coverImageUrl,
      primaryColor: project.requirements.primaryColor,
      accentColor: project.requirements.accentColor,
      typographyStyle: project.requirements.typographyStyle,
      preferredLanguage: project.requirements.preferredLanguage,
      socialLinks: project.requirements.socialLinks,
      enabledSections: project.requirements.enabledSections,
      events: project.requirements.events,
      committee: project.requirements.committee,
      gallery: project.requirements.gallery
    },
    website: sanitizeWebsiteForPublic(websiteData),
    revision: revision ? {
      id: revision.id,
      versionNumber: revision.versionNumber,
      variationLabel: revision.variationLabel,
      isApproved: revision.isApproved,
      createdAt: revision.createdAt
    } : {
      id: 'v1_initial',
      versionNumber: 1,
      variationLabel: 'Design V1',
      isApproved: false,
      createdAt: project.createdAt
    }
  });
});

/**
 * POST /api/preview/:token/feedback
 * Public client endpoint to submit feedback or revision requests for the previewed design.
 */
router.post('/:token/feedback', async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const { authorName, authorEmail, authorRole, feedbackType, section, rating, message } = req.body;

  const tokenData = await repository.getPreviewToken(token);
  if (!tokenData) {
    res.status(404).json({ error: 'Preview link not found or invalid.', code: 'TOKEN_NOT_FOUND' });
    return;
  }

  if (!tokenData.isActive) {
    res.status(410).json({ error: 'This preview link has been revoked.', code: 'TOKEN_REVOKED' });
    return;
  }

  if (new Date(tokenData.expiresAt).getTime() < Date.now()) {
    res.status(410).json({ error: 'This preview link has expired.', code: 'TOKEN_EXPIRED' });
    return;
  }

  if (!authorName || typeof authorName !== 'string' || !authorName.trim()) {
    res.status(400).json({ error: 'Author name is required to submit feedback.' });
    return;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Feedback message content is required.' });
    return;
  }

  const validTypes = ['change_request', 'approval', 'rejection', 'inquiry', 'general'];
  const type = validTypes.includes(feedbackType) ? feedbackType : 'change_request';

  const feedbackRecord: ClientFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId: tokenData.projectId,
    revisionId: tokenData.revisionId,
    authorName: authorName.trim(),
    authorEmail: authorEmail && typeof authorEmail === 'string' ? authorEmail.trim().toLowerCase() : undefined,
    authorRole: authorRole && typeof authorRole === 'string' ? authorRole.trim() : 'Client Representative',
    feedbackType: type as any,
    section: section && typeof section === 'string' ? section.trim() : 'general',
    rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : undefined,
    message: message.trim(),
    resolved: false,
    createdAt: new Date().toISOString()
  };

  await repository.createFeedback(feedbackRecord);

  // Transition project status to 'in_revision' if a change request is received
  const project = await repository.getProjectById(tokenData.projectId);
  if (project && project.status !== 'deployed') {
    if (type === 'change_request' || type === 'rejection') {
      project.status = 'in_revision';
      project.updatedAt = new Date().toISOString();
      await repository.saveProject(project);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Feedback received successfully. The Digiverse Admin team has been notified.',
    feedback: feedbackRecord
  });
});

// The formal client-approval endpoint (POST /:token/approve) was removed: approval no longer gates publishing.
// Clients keep the feedback and change-request endpoint above.

export default router;
