import { Router, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { repository } from '../db/repository.js';
import { loadAccessibleProject } from '../middleware/projectAccess.js';
import { usesRealMediaOnly } from '../services/mediaPolicy.js';
import { 
  syncGoogleDriveMedia, 
  extractFolderId, 
  extractFileId,
  registerGoogleDriveVideoLink,
  storableThumbnail,
  resolveProxyFilePath 
} from '../services/googleDriveService.js';
import { parseYouTubeUrl } from '../services/youtubeService.js';
import { YouTubeVideo } from '../types/index.js';
import { storeUpload, resolveLocalUpload, CONTENT_TYPES } from '../services/mediaStorage.js';
import { getMaxUploadBytes } from '../config.js';

const router = Router();

// ==========================================
// GOOGLE DRIVE INTEGRATION ENDPOINTS
// ==========================================

// POST /api/media/drive/connect - Register & verify Google Drive folder (ADMIN & SUPER_ADMIN)
router.post('/drive/connect', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, folderUrl } = req.body;

  if (!projectId || !folderUrl) {
    res.status(400).json({ error: 'Project ID and folder URL are required.' });
    return;
  }

  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const folderId = extractFolderId(folderUrl);
  if (!folderId) {
    res.status(400).json({ 
      error: 'Invalid Google Drive folder URL format. Expected: https://drive.google.com/drive/folders/{id}' 
    });
    return;
  }

  // Sync / verify media
  const syncResult = await syncGoogleDriveMedia(
    projectId,
    folderUrl,
    project.requirements.organizationType,
    !usesRealMediaOnly(project.requirements)
  );

  await repository.saveMediaSource(syncResult.source);
  for (const item of syncResult.discoveredItems) {
    await repository.saveDriveMediaItem(item);
  }

  res.json({
    success: syncResult.source.status === 'connected',
    source: syncResult.source,
    discoveredCount: syncResult.discoveredItems.length,
    items: syncResult.discoveredItems,
    isMock: syncResult.isMock,
    message: syncResult.message,
    error: syncResult.error
  });
});

// POST /api/media/drive/video - Register Google Drive video link (ADMIN & SUPER_ADMIN)
router.post('/drive/video', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, videoUrl, title } = req.body;

  if (!projectId || !videoUrl) {
    res.status(400).json({ error: 'Project ID and Google Drive video URL are required.' });
    return;
  }

  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const fileId = extractFileId(videoUrl);
  if (!fileId) {
    res.status(400).json({ 
      error: 'Invalid Google Drive video URL format. Expected: https://drive.google.com/file/d/{fileId}/view or ?id={fileId}' 
    });
    return;
  }

  const item = await registerGoogleDriveVideoLink(projectId, videoUrl, title, !usesRealMediaOnly(project.requirements));
  if (!item) {
    res.status(500).json({ error: 'Failed to register Google Drive video link.' });
    return;
  }

  res.status(201).json({
    success: true,
    item,
    message: 'Google Drive video link registered successfully.'
  });
});

// POST /api/media/drive/sync - Manual refresh synchronization (ADMIN & SUPER_ADMIN)
router.post('/drive/sync', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required.' });
    return;
  }

  const project = await loadAccessibleProject(req, res, projectId, 'Project not found.');
  if (!project) return;

  const source = await repository.getMediaSourceByProject(projectId);
  const folderUrl = source?.folderUrl || project.requirements.googleDriveUrl;

  if (!folderUrl) {
    res.status(400).json({ error: 'No Google Drive folder URL configured for this project.' });
    return;
  }

  const syncResult = await syncGoogleDriveMedia(
    projectId,
    folderUrl,
    project.requirements.organizationType,
    !usesRealMediaOnly(project.requirements)
  );

  await repository.saveMediaSource(syncResult.source);
  for (const item of syncResult.discoveredItems) {
    await repository.saveDriveMediaItem(item);
  }

  const allItems = await repository.getDriveMediaByProject(projectId);

  res.json({
    success: syncResult.source.status === 'connected',
    source: syncResult.source,
    items: allItems,
    isMock: syncResult.isMock,
    message: syncResult.message,
    error: syncResult.error
  });
});

// GET /api/media/drive/items/:projectId - Get all Drive items for project
router.get('/drive/items/:projectId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  if (!(await loadAccessibleProject(req, res, projectId, 'Project not found.'))) return;
  const items = await repository.getDriveMediaByProject(projectId);
  const source = await repository.getMediaSourceByProject(projectId);
  res.json({ items, source });
});

// PATCH /api/media/drive/items/:id - Update assignment & approval (ADMIN & SUPER_ADMIN)
router.patch('/drive/items/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { sectionAssignment, isApproved } = req.body;

  const ownerProjectId = await repository.getDriveMediaProjectId(id);
  if (!ownerProjectId || !(await loadAccessibleProject(req, res, ownerProjectId, 'Media item not found.'))) {
    if (!ownerProjectId) res.status(404).json({ error: 'Media item not found.' });
    return;
  }

  if (!sectionAssignment && isApproved === undefined) {
    res.status(400).json({ error: 'sectionAssignment or isApproved is required.' });
    return;
  }

  const success = await repository.updateDriveMediaAssignment(
    id,
    sectionAssignment || 'gallery',
    isApproved !== undefined ? Boolean(isApproved) : true
  );

  if (!success) {
    res.status(404).json({ error: 'Media item not found.' });
    return;
  }

  res.json({ success: true, message: 'Media assignment updated.' });
});

// GET /api/media/drive/proxy/:fileId - Public media delivery for generated websites.
// Built-in demonstration assets are static files of the frontend build
// (client/public/images/festivals), so they are redirected there; this works
// identically on the local Vite server and on Vercel's CDN.
router.get('/drive/proxy/:fileId', async (req, res): Promise<void> => {
  const fileId = String(req.params.fileId);
  const resolved = resolveProxyFilePath(fileId);

  if (!resolved) {
    res.status(404).json({ error: 'Media asset not found in storage or proxy cache.' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.redirect(302, resolved.publicPath);
});

// ==========================================
// YOUTUBE VIDEO INTEGRATION ENDPOINTS
// ==========================================

// POST /api/media/youtube - Add and validate YouTube video (ADMIN & SUPER_ADMIN)
router.post('/youtube', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, url, title, category } = req.body;

  if (!projectId || !url) {
    res.status(400).json({ error: 'Project ID and YouTube URL are required.' });
    return;
  }

  const project = await loadAccessibleProject(req, res, projectId, 'Project not found.');
  if (!project) return;

  const parsed = parseYouTubeUrl(url, title, category || 'cultural');
  if (!parsed.isValid) {
    res.status(400).json({ error: parsed.error || 'Invalid YouTube URL.' });
    return;
  }

  const now = new Date().toISOString();
  const existingVideos = await repository.getYouTubeVideosByProject(projectId);
  const newVideo: YouTubeVideo = {
    id: `yt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId,
    videoId: parsed.identifier,
    originalUrl: url.trim(),
    embedUrl: parsed.embedUrl,
    title: parsed.defaultTitle,
    thumbnailUrl: storableThumbnail(parsed.thumbnailUrl, usesRealMediaOnly(project.requirements)),
    category: category ? String(category).trim() : 'cultural',
    displayOrder: existingVideos.length + 1,
    isPublished: true,
    createdAt: now
  };

  await repository.saveYouTubeVideo(newVideo);
  res.status(201).json({ video: newVideo, message: 'YouTube video validated and added successfully.' });
});

// GET /api/media/youtube/:projectId - List YouTube videos for project
router.get('/youtube/:projectId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  if (!(await loadAccessibleProject(req, res, projectId, 'Project not found.'))) return;
  const videos = await repository.getYouTubeVideosByProject(projectId);
  res.json({ videos });
});

// DELETE /api/media/youtube/:id - Delete video (ADMIN & SUPER_ADMIN)
router.delete('/youtube/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required in body.' });
    return;
  }
  if (!(await loadAccessibleProject(req, res, String(projectId), 'YouTube video not found.'))) return;

  const deleted = await repository.deleteYouTubeVideo(id, projectId);
  if (!deleted) {
    res.status(404).json({ error: 'YouTube video not found.' });
    return;
  }

  res.json({ success: true, message: 'YouTube video removed successfully.' });
});

// ==========================================
// CLIENT ASSET UPLOAD & DELIVERY ENDPOINTS
// ==========================================

// POST /api/media/upload - Internal Admin Asset Upload (Base64 or Data URI)
// Stored on local disk in development, or in Vercel Blob when configured.
router.post('/upload', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { filename, fileData, assetType = 'general', mimeType = 'image/jpeg' } = req.body ?? {};

  if (!filename || !fileData || typeof filename !== 'string' || typeof fileData !== 'string') {
    res.status(400).json({ error: 'filename and fileData (base64) are required.' });
    return;
  }

  try {
    // SVG is intentionally not accepted: SVG files can contain scripts and
    // would be served from the application's own origin.
    const MIME_TO_EXT: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    const dataUriMatch = fileData.match(/^data:([a-zA-Z0-9/+.-]+);base64,/);
    const detectedMime = (dataUriMatch ? dataUriMatch[1] : String(mimeType || '')).toLowerCase();
    const requestedExt = path.extname(filename).toLowerCase();
    const mimeExt = MIME_TO_EXT[detectedMime];

    if (!mimeExt || (requestedExt && !CONTENT_TYPES[requestedExt])) {
      res.status(400).json({
        error: 'Unsupported image format. Allowed formats: PNG, JPG/JPEG, WebP, GIF.'
      });
      return;
    }

    // The stored extension always matches the validated MIME type.
    const ext = requestedExt && CONTENT_TYPES[requestedExt] === CONTENT_TYPES[mimeExt] ? requestedExt : mimeExt;

    const base64Content = fileData.replace(/^data:[a-zA-Z0-9/+.-]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    const maxBytes = getMaxUploadBytes(String(assetType));
    if (buffer.length > maxBytes) {
      res.status(400).json({
        error: `File size exceeds the ${(maxBytes / (1024 * 1024)).toFixed(1)}MB limit for ${assetType}. Current size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`
      });
      return;
    }

    const cleanBase = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30) || String(assetType);
    const safeName = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;

    const stored = await storeUpload(safeName, buffer, CONTENT_TYPES[ext]);

    res.status(201).json({
      success: true,
      filename: stored.filename,
      url: stored.url,
      storage: stored.storage,
      mimeType: CONTENT_TYPES[ext],
      sizeBytes: buffer.length
    });
  } catch (err: unknown) {
    res.status(500).json({ error: `Upload processing failed: ${err instanceof Error ? err.message : String(err)}` });
  }
});

// GET /api/media/uploads/:filename - Stream locally stored uploads
router.get('/uploads/:filename', async (req, res): Promise<void> => {
  const resolved = resolveLocalUpload(String(req.params.filename));

  if (!resolved) {
    res.status(404).json({ error: 'Uploaded asset not found.' });
    return;
  }

  res.setHeader('Content-Type', resolved.contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (resolved.contentType === 'application/octet-stream') {
    res.setHeader('Content-Disposition', 'attachment');
  }
  fs.createReadStream(resolved.filePath).pipe(res);
});

export default router;
