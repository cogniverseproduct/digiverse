import type { ClientRequirements } from '../types/admin';

/**
 * Requirements object for rendering a PUBLISHED site.
 *
 * The public payload deliberately carries no `requirements` (they hold private
 * client details), so the renderer receives only what is safe to show. Contact
 * fields stay empty rather than inventing placeholder details: a visitor must
 * never see a made-up email address or contact person.
 */
export function publicSiteRequirements(site: {
  organizationName: string;
  category: string;
  generatedWebsite?: { requirements?: ClientRequirements } | null;
}): ClientRequirements {
  const fromSite = site.generatedWebsite?.requirements;
  if (fromSite) return fromSite;
  return {
    organizationName: site.organizationName,
    category: site.category,
    organizationType: site.category,
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  } as unknown as ClientRequirements;
}
