/**
 * DigiVerse Platform Client Configuration
 * Central source of truth for platform constants and authorized email addresses.
 * 
 * Security Notice:
 * Sensitive secrets, SMTP credentials, OTP secrets, and private tokens
 * must NEVER be exposed or stored in client-side code.
 */

export const PLATFORM_CONFIG = {
  productName: 'DigiVerse',
  /** Primary official DigiVerse address (public contact and Product Owner identity). */
  productEmail:
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_DIGIVERSE_PRODUCT_EMAIL) ||
    'contact@cogniverse.co.in',
  /** Secondary official DigiVerse address. A contact address only: it grants no access. */
  secondaryEmail:
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_DIGIVERSE_SECONDARY_EMAIL) ||
    'mrk@cogniverse.co.in',
  portal: {
    superAdminRoleName: 'Super Admin',
    adminRoleName: 'Admin',
  },
} as const;
