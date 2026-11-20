import type { Request } from 'express';

/**
 * Public origin of the current request, e.g. https://digiverse-x.vercel.app.
 *
 * Uses req.protocol and req.host, which honour X-Forwarded-Proto and
 * X-Forwarded-Host when 'trust proxy' is enabled (on Vercel, see app.ts).
 * Locally (no proxy) they fall back to the socket and the Host header.
 */
export function requestOrigin(req: Request): string {
  return `${req.protocol}://${req.host}`;
}
