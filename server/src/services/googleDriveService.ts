import { repository } from '../db/repository.js';
import type {
  DriveMediaItem,
  GoogleDriveMediaFolders,
  MediaSource
} from '../types/index.js';

export interface DriveSyncResult {
  source: MediaSource;
  discoveredItems: DriveMediaItem[];
  isMock: boolean;
  message: string;
  error?: string;
}

export interface DriveFoldersSyncResult {
  sources: MediaSource[];
  discoveredItems: DriveMediaItem[];
  imageResult?: DriveSyncResult;
  videoResult?: DriveSyncResult;
  isMock: boolean;
  message: string;
  errors: string[];
}

type SupportedMediaType = 'image' | 'video';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

interface GoogleDriveListResponse {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
}

interface FolderSyncOptions {
  projectId: string;
  folderUrlOrId: string;
  orgType: string;
  sourceKey: string;
  expectedMediaType?: SupportedMediaType;
  allowMock: boolean;
}

const GOOGLE_DRIVE_API_BASE =
  'https://www.googleapis.com/drive/v3/files';

export function extractFolderId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // Google Drive folder URL.
  const folderMatch = trimmed.match(
    /\/folders\/([a-zA-Z0-9_-]+)/
  );

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  // Google Drive URL containing an ID parameter.
  const idMatch = trimmed.match(
    /[?&]id=([a-zA-Z0-9_-]+)/
  );

  if (idMatch?.[1]) {
    return idMatch[1];
  }

  // Direct folder ID.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function extractFileId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // /file/d/{id} pattern
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  // /uc?id={id} or /open?id={id} or ?id={id}
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) {
    return idMatch[1];
  }

  // Direct file ID (Google Drive IDs are typically alphanumeric strings of 15+ chars)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/** The placeholder photographs the development adapters attach to Drive and YouTube-playlist links. */
export const isDemoStockThumbnail = (url: unknown): boolean =>
  typeof url === 'string' && /^https:\/\/images\.unsplash\.com\/photo-(1518173946687|1511671782779)-/.test(url);

/** A link's thumbnail as it may be stored: Cultural projects never store the placeholder photographs. */
export const storableThumbnail = (url: string | undefined, isCultural: boolean): string | undefined =>
  isCultural && isDemoStockThumbnail(url) ? '' : url;

export async function registerGoogleDriveVideoLink(
  projectId: string,
  videoUrl: string,
  suggestedTitle?: string,
  useStockThumbnail: boolean = true
): Promise<DriveMediaItem | null> {
  const fileId = extractFileId(videoUrl);
  if (!fileId) return null;

  const title = suggestedTitle?.trim() || `Drive Video (${fileId.substring(0, 8)})`;
  const now = new Date().toISOString();

  const item: DriveMediaItem = {
    id: `drv_vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId,
    driveFileId: fileId,
    name: title,
    mimeType: 'video/mp4',
    mediaType: 'video',
    thumbnailUrl: useStockThumbnail ? 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80' : '',
    isApproved: true,
    sectionAssignment: 'video',
    createdAt: now
  };

  await repository.saveDriveMediaItem(item);
  return item;
}

export function isSupportedMediaType(
  mimeType: string
): {
  isSupported: boolean;
  mediaType: SupportedMediaType;
} {
  const cleanMime = mimeType.toLowerCase();

  const supportedImages = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/avif',
    'image/gif'
  ];

  const supportedVideos = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska'
  ];

  if (supportedImages.includes(cleanMime)) {
    return {
      isSupported: true,
      mediaType: 'image'
    };
  }

  if (supportedVideos.includes(cleanMime)) {
    return {
      isSupported: true,
      mediaType: 'video'
    };
  }

  return {
    isSupported: false,
    mediaType: 'image'
  };
}

// Curated mock assets retained for the existing local demo adapter.
const CULTURAL_MOCK_ASSETS = [
  {
    driveFileId: 'drv_durga_hero',
    name: 'durga-hero.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 375653,
    thumbnailUrl: '/images/festivals/durga-hero.jpg',
    sectionAssignment: 'hero' as const,
    category: 'Rituals'
  },
  {
    driveFileId: 'drv_kumartuli',
    name: 'kumartuli-clay.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 85216,
    thumbnailUrl: '/images/festivals/kumartuli-clay.jpg',
    sectionAssignment: 'gallery' as const,
    category: 'Heritage'
  },
  {
    driveFileId: 'drv_dhunuchi',
    name: 'dhunuchi-dance.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 170891,
    thumbnailUrl: '/images/festivals/dhunuchi-dance.jpg',
    sectionAssignment: 'gallery' as const,
    category: 'Tradition'
  },
  {
    driveFileId: 'drv_alpona',
    name: 'alpona-art.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 68278,
    thumbnailUrl: '/images/festivals/alpona-art.jpg',
    sectionAssignment: 'gallery' as const,
    category: 'Art'
  },
  {
    driveFileId: 'drv_pandal_lights',
    name: 'pandal-lights.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 178707,
    thumbnailUrl: '/images/festivals/pandal-lights.jpg',
    sectionAssignment: 'events' as const,
    category: 'Illumination'
  },
  {
    driveFileId: 'drv_classical',
    name: 'classical-recital.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 73089,
    thumbnailUrl: '/images/festivals/classical-recital.jpg',
    sectionAssignment: 'gallery' as const,
    category: 'Music'
  },
  {
    driveFileId: 'drv_lakshmi',
    name: 'lakshmi-puja.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 93705,
    thumbnailUrl: '/images/festivals/lakshmi-puja.jpg',
    sectionAssignment: 'events' as const,
    category: 'Rituals'
  },
  {
    driveFileId: 'drv_sports_meet',
    name: 'sports-meet.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image' as const,
    sizeBytes: 94960,
    thumbnailUrl: '/images/festivals/sports-meet.jpg',
    sectionAssignment: 'events' as const,
    category: 'Athletics'
  }
];

function createSourceId(
  projectId: string,
  sourceKey: string
): string {
  return `src_${projectId}_${sourceKey}`;
}

function createErrorResult(
  projectId: string,
  folderUrlOrId: string,
  sourceKey: string,
  errorMessage: string,
  folderId?: string
): DriveSyncResult {
  const now = new Date().toISOString();

  return {
    source: {
      id: createSourceId(projectId, sourceKey),
      projectId,
      sourceType: 'google_drive',
      folderId,
      folderUrl: folderUrlOrId,
      status: 'error',
      syncStatus: 'error',
      errorMessage,
      lastSyncedAt: now,
      createdAt: now
    },
    discoveredItems: [],
    isMock: false,
    message: 'Google Drive synchronization failed.',
    error: errorMessage
  };
}

async function fetchGoogleDriveFiles(
  folderId: string,
  apiKey: string | undefined,
  accessToken: string | undefined
): Promise<GoogleDriveFile[]> {
  const allFiles: GoogleDriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink)',
      pageSize: '100'
    });

    if (apiKey) {
      params.set('key', apiKey);
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const headers: Record<string, string> = {};

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));

      throw new Error(
        `Google Drive API returned HTTP ${response.status}: ${JSON.stringify(errorBody)}`
      );
    }

    const data = await response.json() as GoogleDriveListResponse;

    allFiles.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

function mapGoogleDriveFiles(
  files: GoogleDriveFile[],
  projectId: string,
  sourceId: string,
  expectedMediaType?: SupportedMediaType
): DriveMediaItem[] {
  const now = new Date().toISOString();

  const supportedFiles = files.filter(file => {
    const result = isSupportedMediaType(file.mimeType);

    return (
      result.isSupported &&
      (!expectedMediaType || result.mediaType === expectedMediaType)
    );
  });

  return supportedFiles.map((file, index) => {
    const { mediaType } = isSupportedMediaType(file.mimeType);

    return {
      id: `dmi_${Date.now()}_${index}_${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      projectId,
      sourceId,
      driveFileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      mediaType,
      sizeBytes: file.size
        ? parseInt(file.size, 10)
        : undefined,
      thumbnailUrl: file.thumbnailLink,
      isApproved: true,
      sectionAssignment:
        mediaType === 'image' && index === 0
          ? 'hero'
          : 'gallery',
      createdAt: now
    };
  });
}

async function syncSingleFolder(
  options: FolderSyncOptions
): Promise<DriveSyncResult> {
  const {
    projectId,
    folderUrlOrId,
    orgType,
    sourceKey,
    expectedMediaType,
    allowMock
  } = options;

  const folderId = extractFolderId(folderUrlOrId);
  const now = new Date().toISOString();
  const sourceId = createSourceId(projectId, sourceKey);

  if (!folderId) {
    return createErrorResult(
      projectId,
      folderUrlOrId,
      sourceKey,
      'Invalid Google Drive folder URL or ID format.'
    );
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (apiKey || accessToken) {
    try {
      const files = await fetchGoogleDriveFiles(
        folderId,
        apiKey,
        accessToken
      );

      const discoveredItems = mapGoogleDriveFiles(
        files,
        projectId,
        sourceId,
        expectedMediaType
      );

      const source: MediaSource = {
        id: sourceId,
        projectId,
        sourceType: 'google_drive',
        folderId,
        folderUrl: folderUrlOrId,
        status: 'connected',
        syncStatus: 'synced',
        lastSyncedAt: now,
        createdAt: now
      };

      return {
        source,
        discoveredItems,
        isMock: false,
        message: `Successfully synchronized ${discoveredItems.length} ${expectedMediaType ?? 'media'} assets from Google Drive.`
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return createErrorResult(
        projectId,
        folderUrlOrId,
        sourceKey,
        errorMessage,
        folderId
      );
    }
  }

  // The old demo adapter remains available for legacy single-folder sync.
  if (allowMock) {
    const relevantMockAssets = orgType === 'sports'
      ? CULTURAL_MOCK_ASSETS.filter(
          asset =>
            asset.driveFileId === 'drv_sports_meet' ||
            asset.category === 'Athletics' ||
            asset.category === 'Illumination'
        )
      : CULTURAL_MOCK_ASSETS;

    const filteredAssets = relevantMockAssets.filter(asset => {
      return (
        !expectedMediaType ||
        asset.mediaType === expectedMediaType
      );
    });

    const discoveredItems: DriveMediaItem[] =
      filteredAssets.map((asset, index) => ({
        id: `dmi_${Date.now()}_${index + 1}`,
        projectId,
        sourceId,
        driveFileId: asset.driveFileId,
        name: asset.name,
        mimeType: asset.mimeType,
        mediaType: asset.mediaType,
        sizeBytes: asset.sizeBytes,
        thumbnailUrl: asset.thumbnailUrl,
        isApproved: true,
        sectionAssignment: asset.sectionAssignment,
        createdAt: now
      }));

    const source: MediaSource = {
      id: sourceId,
      projectId,
      sourceType: 'google_drive',
      folderId,
      folderUrl: folderUrlOrId,
      status: 'connected',
      syncStatus: 'synced',
      lastSyncedAt: now,
      createdAt: now
    };

    return {
      source,
      discoveredItems,
      isMock: true,
      message:
        `[Development Mock Adapter] Discovered ${discoveredItems.length} demonstration media assets. Configure GOOGLE_DRIVE_API_KEY or GOOGLE_ACCESS_TOKEN in server/.env for live Google Drive synchronization.`
    };
  }

  // Separate client folders must never be represented by unrelated demo assets.
  return createErrorResult(
    projectId,
    folderUrlOrId,
    sourceKey,
    'Google Drive credentials are not configured. Live folder contents were not retrieved.',
    folderId
  );
}

/**
 * Legacy single-folder synchronization.
 *
 * Kept for compatibility with existing project routes. `allowMock` (default true) lets the development demo adapter
 * stand in when no Google credentials are configured; Cultural projects pass false so no stock demo photos are ever
 * imported as a client's media.
 */
export async function syncGoogleDriveMedia(
  projectId: string,
  folderUrlOrId: string,
  orgType: string = 'cultural',
  allowMock: boolean = true
): Promise<DriveSyncResult> {
  return syncSingleFolder({
    projectId,
    folderUrlOrId,
    orgType,
    sourceKey: 'drive',
    allowMock
  });
}

/**
 * Synchronizes independently selected Google Drive image and video folders.
 *
 * Image files are accepted only from the Images folder.
 * Video files are accepted only from the Videos folder.
 *
 * This function does not expose Google Drive credentials or file IDs
 * to public website HTML. Returned DriveMediaItem records are for
 * server-side processing and persistence.
 */
export async function syncGoogleDriveMediaFolders(
  projectId: string,
  folders: GoogleDriveMediaFolders,
  orgType: string = 'cultural'
): Promise<DriveFoldersSyncResult> {
  const results: DriveSyncResult[] = [];
  const errors: string[] = [];

  let imageResult: DriveSyncResult | undefined;
  let videoResult: DriveSyncResult | undefined;

  const imageFolderInput =
    folders.images?.folderUrl ||
    folders.images?.folderId;

  const videoFolderInput =
    folders.videos?.folderUrl ||
    folders.videos?.folderId;

  if (imageFolderInput) {
    imageResult = await syncSingleFolder({
      projectId,
      folderUrlOrId: imageFolderInput,
      orgType,
      sourceKey: 'drive_images',
      expectedMediaType: 'image',
      allowMock: false
    });

    results.push(imageResult);

    if (imageResult.error) {
      errors.push(`Images folder: ${imageResult.error}`);
    }
  }

  if (videoFolderInput) {
    videoResult = await syncSingleFolder({
      projectId,
      folderUrlOrId: videoFolderInput,
      orgType,
      sourceKey: 'drive_videos',
      expectedMediaType: 'video',
      allowMock: false
    });

    results.push(videoResult);

    if (videoResult.error) {
      errors.push(`Videos folder: ${videoResult.error}`);
    }
  }

  const discoveredItems = results.flatMap(
    result => result.discoveredItems
  );

  const sources = results.map(result => result.source);

  const isMock = results.some(result => result.isMock);

  let message: string;

  if (results.length === 0) {
    message = 'No Google Drive image or video folders were selected.';
  } else if (errors.length > 0) {
    message =
      `Google Drive synchronization completed with ${errors.length} error(s). ${discoveredItems.length} media assets were retrieved.`;
  } else {
    message =
      `Successfully synchronized ${discoveredItems.length} media assets from the selected Google Drive folders.`;
  }

  return {
    sources,
    discoveredItems,
    imageResult,
    videoResult,
    isMock,
    message,
    errors
  };
}

/**
 * Maps built-in demonstration Drive IDs to static frontend assets
 * (client/public/images/festivals). Returns null for any other ID.
 *
 * Real Google Drive files are not proxied yet: generated sites reference
 * them through this route, so they will 404 until a credentialed streaming
 * proxy is implemented (documented limitation).
 */
export function resolveProxyFilePath(
  driveFileId: string
): { publicPath: string; mimeType: string } | null {
  const idToName: Record<string, string> = {
    drv_durga_hero: 'durga-hero.jpg',
    drv_kumartuli: 'kumartuli-clay.jpg',
    drv_dhunuchi: 'dhunuchi-dance.jpg',
    drv_alpona: 'alpona-art.jpg',
    drv_pandal_lights: 'pandal-lights.jpg',
    drv_classical: 'classical-recital.jpg',
    drv_lakshmi: 'lakshmi-puja.jpg',
    drv_sports_meet: 'sports-meet.jpg'
  };

  const file = idToName[driveFileId];
  return file ? { publicPath: `/images/festivals/${file}`, mimeType: 'image/jpeg' } : null;
}
