/**
 * Email syntax validation for forms. Mirrors server/src/utils/email.ts.
 *
 * Syntax only: no provider allow-list. Any well-formed address on any domain is
 * accepted. A valid address never grants access; roles come from the Super Admin.
 */

export const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART = 64;
const MAX_DOMAIN_LABEL = 63;

const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TLD = /^[A-Za-z]{2,}$/;

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;

  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > MAX_LOCAL_PART || !LOCAL_PART.test(local)) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((label) => label.length > 0 && label.length <= MAX_DOMAIN_LABEL && DOMAIN_LABEL.test(label))) {
    return false;
  }
  return TLD.test(labels[labels.length - 1]);
}
