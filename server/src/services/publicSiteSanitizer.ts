import type { GeneratedWebsite } from '../types/index.js';
import { isNgoLibraryTemplate } from './ngoCatalog.js';

/**
 * Removes data that must never be served on a public website or preview:
 * visitor submissions (RSVPs, volunteer applications, donation enquiries)
 * and their contact details. These records remain available to Admins via
 * the authenticated project endpoints.
 */
export function sanitizeWebsiteForPublic<T extends Partial<GeneratedWebsite> | undefined | null>(website: T): T {
  if (!website || typeof website !== 'object') {
    return website;
  }

  const copy: any = JSON.parse(JSON.stringify(website));

  if (copy.eventData && typeof copy.eventData === 'object') {
    delete copy.eventData.rsvpSubmissions;
    // Guest replies and Google Drive file ids are internal. The same objects are copied into generated sections and pages, so the
    // whole website is walked, not only `eventData`.
    stripEventPrivateFields(copy);
  }

  if (copy.ngoData && typeof copy.ngoData === 'object') {
    delete copy.ngoData.volunteerSubmissions;
    delete copy.ngoData.donationEnquiries;
    // A donor's tax id is never public, and Drive file ids on media items are internal references. The same objects are copied into
    // generated sections and pages, so the whole website is walked, not only `ngoData`.
    stripNgoPrivateFields(copy);

    // Social & NGO library sites carry information only and never take or point to payments. If a project was moved to a library design
    // from an older one, the bank/UPI transfer details, tax-exemption number and outbound donation link it still stores are not published.
    // The stored data itself is untouched; only this public copy drops them. Older (non-library) sites are unchanged.
    const tpl = copy.requirements?.selectedTemplate?.templateId ?? copy.selectedTemplate?.templateId;
    if (isNgoLibraryTemplate(tpl) && copy.ngoData.donationModel && typeof copy.ngoData.donationModel === 'object') {
      delete copy.ngoData.donationModel.directTransferDetails;
      delete copy.ngoData.donationModel.eightyGRegNumber;
      delete copy.ngoData.donationModel.outboundDonationUrl;
    }
  }

  // Cultural sites: committee members' personal email addresses and phone numbers are stored for the Admin's records, but no template
  // shows them, so they are not published. Google Drive file ids on gallery items are internal references and stay private too.
  // The same member objects are copied into generated sections and pages, so the whole website is walked, not only `culturalData`.
  if (copy.culturalData && typeof copy.culturalData === 'object') {
    stripCulturalPrivateFields(copy);
  }

  // Raw Google Drive folder/file links the Admin pasted (portfolio `media.*`, sports, etc.) are internal references to private
  // Drive content. Public media is delivered through the proxy / embed items generated from them, never from these fields.
  // Non-Drive values (for example a YouTube link stored in the same list) are kept.
  stripDriveLinkFields(copy);

  // Never expose internal deployment bookkeeping inside the site payload.
  delete copy.requirements;

  return copy as T;
}

function stripEventPrivateFields(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(stripEventPrivateFields);
    return;
  }
  delete node.rsvpSubmissions;
  if ('driveFileId' in node && ('url' in node || 'imageUrl' in node || 'thumbnailUrl' in node || 'photoUrl' in node || 'logoUrl' in node)) delete node.driveFileId;
  Object.values(node).forEach(stripEventPrivateFields);
}

/** True for the committee-member shape used by the Cultural engine (a name with a designation). */
const isCulturalLeader = (o: any): boolean => typeof o.name === 'string' && 'designation' in o;

function stripCulturalPrivateFields(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(stripCulturalPrivateFields);
    return;
  }
  if (isCulturalLeader(node)) {
    delete node.email;
    delete node.phone;
  }
  if ('driveFileId' in node && ('imageUrl' in node || 'thumbnailUrl' in node)) delete node.driveFileId;
  Object.values(node).forEach(stripCulturalPrivateFields);
}

function stripNgoPrivateFields(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(stripNgoPrivateFields);
    return;
  }
  delete node.panNumber;
  if ('driveFileId' in node && ('url' in node || 'imageUrl' in node || 'thumbnailUrl' in node)) delete node.driveFileId;
  Object.values(node).forEach(stripNgoPrivateFields);
}

const DRIVE_LINK_FIELDS = ['googleDriveGalleryUrl', 'googleDriveVideoUrl', 'googleDriveUrl'];
const DRIVE_LINK_LIST_FIELDS = ['googleDriveVideoUrls'];
const isDriveLink = (value: unknown): boolean =>
  typeof value === 'string' && /(^|\/\/|\.)(drive|docs)\.google\.com\//i.test(value.trim());

function stripDriveLinkFields(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(stripDriveLinkFields);
    return;
  }
  for (const field of DRIVE_LINK_FIELDS) {
    if (field in node && isDriveLink(node[field])) delete node[field];
  }
  for (const field of DRIVE_LINK_LIST_FIELDS) {
    if (Array.isArray(node[field])) node[field] = node[field].filter((v: unknown) => !isDriveLink(v));
  }
  delete node.googleDriveMediaFolders;
  Object.values(node).forEach(stripDriveLinkFields);
}
