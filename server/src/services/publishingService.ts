/**
 * Publishing support for client websites: SEO, site addresses (slugs),
 * technical preflight checks and custom domains.
 *
 * Deploying is handled by publishing/deploymentService.ts. Publishing is a
 * technical operation only: it does NOT depend on client approval, a locked
 * design revision, quotations, payments or any billing status.
 */

import { repository } from '../db/repository.js';
import {
  publishedSiteRepository,
  type PublishedSite,
  type SiteSeoSettings
} from '../db/publishedSiteRepository.js';
import { buildSiteUrl, normalizeSiteSlug, slugify, isValidSiteSlug } from './siteRouting.js';
import { siteDeploymentRepository } from '../db/siteDeploymentRepository.js';
import { normalizeCustomDomain, vercelDomainsService } from './vercelDomainsService.js';
import type {
  ClientProject,
  GeneratedWebsite,
  PublishingPreflightResult
} from '../types/index.js';

/** Validates Admin-supplied SEO settings. Unknown fields are dropped. */
export function validateSeoSettings(input: unknown): SiteSeoSettings {
  if (input === undefined || input === null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('SEO settings must be an object.');
  }

  const raw = input as Record<string, unknown>;
  const seo: SiteSeoSettings = {};

  const text = (value: unknown, field: string, max: number): string | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') throw new Error(`SEO ${field} must be text.`);
    const trimmed = value.trim();
    if (trimmed.length > max) throw new Error(`SEO ${field} must be ${max} characters or fewer.`);
    return trimmed || undefined;
  };

  seo.title = text(raw.title, 'title', 120);
  seo.description = text(raw.description, 'description', 320);

  const ogImageUrl = text(raw.ogImageUrl, 'image URL', 2048);
  if (ogImageUrl) {
    if (!/^https?:\/\//i.test(ogImageUrl) && !ogImageUrl.startsWith('/')) {
      throw new Error('SEO image must be an absolute http(s) URL or a site-relative path.');
    }
    seo.ogImageUrl = ogImageUrl;
  }

  if (raw.keywords !== undefined) {
    if (!Array.isArray(raw.keywords) || raw.keywords.length > 20) {
      throw new Error('SEO keywords must be a list of at most 20 entries.');
    }
    seo.keywords = raw.keywords
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim().slice(0, 50))
      .filter(Boolean);
  }

  if (raw.noIndex !== undefined) {
    seo.noIndex = Boolean(raw.noIndex);
  }

  return Object.fromEntries(
    Object.entries(seo).filter(([, value]) => value !== undefined)
  ) as SiteSeoSettings;
}

export function defaultSeo(project: ClientProject, website: GeneratedWebsite): SiteSeoSettings {
  const sportsSeo = (website.sportsData as any)?.seoInfo;
  const title =
    sportsSeo?.metaTitle ||
    website.navigationBar?.brandName ||
    website.heroHeadline ||
    project.requirements.organizationName;

  const description = (
    sportsSeo?.metaDescription ||
    project.requirements.tagline ||
    website.heroDescription ||
    website.aboutContent ||
    ''
  )
    .toString()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  const image = website.heroImage || project.requirements.coverImageUrl || project.requirements.logoUrl;

  return {
    title: String(title || '').slice(0, 120) || undefined,
    description: description || undefined,
    ogImageUrl: image && (/^https?:\/\//i.test(image) || image.startsWith('/')) ? image : undefined
  };
}

export async function resolveSlug(project: ClientProject, requested?: unknown): Promise<string> {
  if (requested !== undefined && requested !== null && requested !== '') {
    return normalizeSiteSlug(requested);
  }

  const existing = await publishedSiteRepository.getByProjectId(project.id);
  if (existing) return existing.slug;

  const fromTenant = slugify(project.tenantSlug || project.requirements.organizationName || project.id);
  return isValidSiteSlug(fromTenant) ? fromTenant : slugify(`site-${project.id}`);
}

/** The site's own Vercel project id (undefined for legacy shared hosting and simulated deployments). */
async function hostingProjectId(projectId: string): Promise<string | undefined> {
  const hosting = await siteDeploymentRepository.getHosting(projectId);
  return hosting?.provider === 'vercel' ? hosting.providerProjectId : undefined;
}

export const publishingService = {
  /**
   * Technical checks only. A blocked result lists exactly what to fix.
   * (The Vercel configuration state and bundle availability are added by the deployment service.)
   */
  async getPublishingPreflight(
    projectId: string,
    options: { siteSlug?: unknown; requestOrigin?: string } = {}
  ): Promise<PublishingPreflightResult> {
    const project = await repository.getProjectById(projectId);

    if (!project) {
      throw new Error('Project not found.');
    }

    const hasGeneratedWebsite = Boolean(
      project.generatedWebsite &&
      typeof project.generatedWebsite === 'object' &&
      Object.keys(project.generatedWebsite).length > 0
    );

    let siteSlug: string | undefined;
    let slugError: string | undefined;
    try {
      siteSlug = await resolveSlug(project, options.siteSlug);
    } catch (error) {
      slugError = error instanceof Error ? error.message : 'Invalid site address.';
    }

    const hasValidRouting = Boolean(siteSlug && isValidSiteSlug(siteSlug));
    const isSlugAvailable = Boolean(
      siteSlug && !(await publishedSiteRepository.isSlugTakenByOtherProject(siteSlug, projectId))
    );

    const blockers: string[] = [];

    if (!hasGeneratedWebsite) {
      blockers.push('Generate the website before publishing.');
    }

    if (!hasValidRouting) {
      blockers.push(slugError || 'Project lacks a valid site address (slug) for routing.');
    } else if (!isSlugAvailable) {
      blockers.push(`The site address '${siteSlug}' is already used by another published website.`);
    }

    const existing = await publishedSiteRepository.getByProjectId(projectId);

    return {
      isReadyToPublish: blockers.length === 0,
      checks: { hasGeneratedWebsite, hasValidRouting, isSlugAvailable },
      blockers,
      siteSlug,
      siteUrl: siteSlug
        ? buildSiteUrl(
            siteSlug,
            options.requestOrigin,
            existing?.domainStatus === 'active' ? existing.customDomain : undefined
          )
        : undefined
    };
  },

  async updateSiteSeo(projectId: string, input: unknown): Promise<SiteSeoSettings> {
    const site = await publishedSiteRepository.getByProjectId(projectId);
    if (!site) {
      throw new Error('This project has not been published yet.');
    }

    const seo = { ...site.seo, ...validateSeoSettings(input) };
    await publishedSiteRepository.updateSeo(projectId, seo);
    return seo;
  },

  /**
   * Reserves a custom domain for a published site and, when Vercel credentials
   * are configured, attaches it to the site's own Vercel project.
   */
  async setCustomDomain(projectId: string, rawDomain: unknown): Promise<Omit<PublishedSite, 'website'>> {
    const site = await publishedSiteRepository.getByProjectId(projectId);
    if (!site) {
      throw new Error('Publish the website before connecting a custom domain.');
    }

    const domain = normalizeCustomDomain(rawDomain);

    if (await publishedSiteRepository.isDomainTakenByOtherProject(domain, projectId)) {
      throw new Error(`The domain ${domain} is already connected to another website.`);
    }

    const projectOverride = await hostingProjectId(projectId);

    if (site.customDomain && site.customDomain !== domain) {
      await vercelDomainsService.detachDomain(site.customDomain, projectOverride);
    }

    const result = await vercelDomainsService.attachDomain(domain, projectOverride);
    await publishedSiteRepository.setCustomDomain(projectId, domain, result.status, result.details);

    const { website: _omit, ...summary } = (await publishedSiteRepository.getByProjectId(projectId))!;
    return summary;
  },

  async refreshCustomDomain(projectId: string): Promise<Omit<PublishedSite, 'website'>> {
    const site = await publishedSiteRepository.getByProjectId(projectId);
    if (!site?.customDomain) {
      throw new Error('No custom domain is connected to this website.');
    }

    const result = await vercelDomainsService.refreshStatus(site.customDomain, await hostingProjectId(projectId));
    await publishedSiteRepository.setCustomDomain(projectId, site.customDomain, result.status, result.details);

    const { website: _omit, ...summary } = (await publishedSiteRepository.getByProjectId(projectId))!;
    return summary;
  },

  async removeCustomDomain(projectId: string): Promise<{ message: string }> {
    const site = await publishedSiteRepository.getByProjectId(projectId);
    if (!site?.customDomain) {
      throw new Error('No custom domain is connected to this website.');
    }

    const result = await vercelDomainsService.detachDomain(site.customDomain, await hostingProjectId(projectId));
    if (!result.removed) {
      throw new Error(result.message);
    }

    await publishedSiteRepository.setCustomDomain(projectId, null, null, null);
    return { message: result.message };
  }
};
