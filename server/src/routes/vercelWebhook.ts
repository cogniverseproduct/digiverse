/**
 * Signed Vercel deployment webhook: POST /api/vercel/webhook
 *
 * Optional. Status is also refreshed whenever the Publishing Console reads it,
 * so publishing works without a webhook; the webhook only makes completion
 * faster. It is mounted BEFORE the JSON body parser because the signature is
 * computed over the raw request bytes.
 *
 * Security:
 *  - nothing is trusted until the HMAC-SHA1 signature (header x-vercel-signature)
 *    matches VERCEL_WEBHOOK_SECRET, compared in constant time;
 *  - without a configured secret the endpoint answers 404 (it does not exist);
 *  - the event only names a deployment id; all state is read back from Vercel
 *    with the server-side token, so a forged payload cannot change anything;
 *  - unknown deployment ids are acknowledged and ignored.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Request, Response } from 'express';
import { getPublishingConfig } from '../config.js';
import { deploymentService } from '../services/publishing/deploymentService.js';

const router = express.Router();

const HANDLED = new Set([
  'deployment.created',
  'deployment.ready',
  'deployment.succeeded',
  'deployment.error',
  'deployment.canceled',
  'deployment.promoted'
]);

export function verifyVercelSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha1', secret).update(rawBody).digest('hex');
  const given = Buffer.from(signature.trim().toLowerCase(), 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

router.post('/', express.raw({ type: () => true, limit: '1mb' }), async (req: Request, res: Response): Promise<void> => {
  const { webhookSecret } = getPublishingConfig();
  if (!webhookSecret) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }

  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!verifyVercelSignature(raw, req.header('x-vercel-signature') || undefined, webhookSecret)) {
    res.status(401).json({ error: 'Invalid signature.' });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid payload.' });
    return;
  }

  const id = event?.payload?.deployment?.id;
  if (HANDLED.has(String(event?.type)) && typeof id === 'string' && id.length <= 200) {
    try {
      await deploymentService.handleWebhookEvent(id);
    } catch (error) {
      console.error('[Vercel Webhook]:', error instanceof Error ? error.message : 'unknown');
    }
  }

  res.json({ received: true });
});

export default router;
