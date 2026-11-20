/**
 * Uploaded branding assets (logos, hero banners, brand images).
 *
 * - local       : server/data/uploads, served by GET /api/media/uploads/:filename
 * - vercel_blob : Vercel Blob (public store), selected automatically when
 *                 BLOB_READ_WRITE_TOKEN is present. Files are served from the
 *                 Blob CDN URL returned by put().
 *
 * Vercel Functions have a read-only, non-persistent file system, so the local
 * driver is refused on Vercel.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMediaStorageDriver, isVercelRuntime, type MediaStorageDriver } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Same location as the database (server/data), independent of process.cwd().
 * UPLOADS_DIR overrides it (used by tests so real uploads are never touched).
 */
export const LOCAL_UPLOADS_DIR = process.env.UPLOADS_DIR?.trim()
  ? path.resolve(process.env.UPLOADS_DIR.trim())
  : path.resolve(__dirname, '../../data/uploads');

export const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

export interface StoredAsset {
  filename: string;
  url: string;
  storage: MediaStorageDriver;
}

export async function storeUpload(
  safeName: string,
  buffer: Buffer,
  contentType: string
): Promise<StoredAsset> {
  const driver = getMediaStorageDriver();

  if (driver === 'vercel_blob') {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${safeName}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false
    });

    return { filename: safeName, url: blob.url, storage: 'vercel_blob' };
  }

  if (isVercelRuntime()) {
    throw new Error(
      'File uploads on Vercel require Vercel Blob. Connect a Blob store so BLOB_READ_WRITE_TOKEN is available.'
    );
  }

  await fs.promises.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(LOCAL_UPLOADS_DIR, safeName), buffer);

  return { filename: safeName, url: `/api/media/uploads/${safeName}`, storage: 'local' };
}

/** Resolves a locally stored upload (local driver only). */
export function resolveLocalUpload(filename: string): { filePath: string; contentType: string } | null {
  const safe = path.basename(filename);
  const filePath = path.join(LOCAL_UPLOADS_DIR, safe);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const ext = path.extname(safe).toLowerCase();
  const contentType = CONTENT_TYPES[ext];

  // Files with unexpected extensions (including legacy .svg uploads) are
  // served as downloads, never rendered inline.
  return { filePath, contentType: contentType || 'application/octet-stream' };
}
