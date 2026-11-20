import React, { useCallback, useEffect, useState } from 'react';
import { Globe, ExternalLink, RefreshCw, Loader2, Server, Database, HardDrive, Link2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { PublishedSiteSummary, SitesDeploymentConfig } from '../../types/admin';
import { PublishedSitesRow } from '../workspace/DataRows';

const DOMAIN_LABELS: Record<string, string> = {
  awaiting_vercel_connection: 'Reserved (Vercel not connected)',
  pending_verification: 'Pending DNS verification',
  misconfigured: 'DNS misconfigured',
  active: 'Active',
  error: 'Error'
};

/**
 * Central publishing management: every client website served by the single
 * DigiVerse deployment (One Project - Many Sites), plus deployment readiness.
 */
export const PublishedSitesPanel: React.FC<{ showHeader?: boolean }> = ({ showHeader = true }) => {
  const [sites, setSites] = useState<PublishedSiteSummary[]>([]);
  const [config, setConfig] = useState<SitesDeploymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [siteList, deploymentConfig] = await Promise.all([
        api.listPublishedSites(),
        api.getSitesConfig()
      ]);
      setSites(siteList);
      setConfig(deploymentConfig);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load published sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liveCount = sites.filter((site) => site.status === 'live').length;

  return (
    <div className="space-y-6">
      {showHeader && (
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-dv-ink tracking-tight">Published Websites</h2>
          <p className="text-xs text-slate-500 mt-1">
            All client websites are served by one DigiVerse deployment, each with its own address, content, branding and SEO.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900/[0.08] bg-white px-3 py-1.5 text-xs text-slate-600 hover:text-dv-ink"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      )}

      {error && (
        <div className="p-3 rounded-xl border border-red-500/40 bg-red-50 text-red-700 text-xs">{error}</div>
      )}

      {config && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-900/[0.08] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Server className="w-3.5 h-3.5 text-indigo-600" /> Publishing
            </div>
            <div className="mt-2 text-sm font-bold text-dv-ink">
              {config.publishing?.mode === 'live' ? 'Vercel (DigiVerse team)' : config.publishing?.mode === 'mock' ? 'Simulated (local test)' : 'Vercel setup pending'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 break-all">{config.publishing?.message || config.publicAppUrl}</div>
          </div>
          <div className="rounded-xl border border-slate-900/[0.08] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Database className="w-3.5 h-3.5 text-indigo-600" /> Database
            </div>
            <div className="mt-2 text-sm font-bold text-dv-ink">{config.database.dialect === 'postgres' ? 'PostgreSQL' : 'SQLite (local)'}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">driver: {config.database.driver}</div>
          </div>
          <div className="rounded-xl border border-slate-900/[0.08] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Media storage
            </div>
            <div className="mt-2 text-sm font-bold text-dv-ink">{config.mediaStorage === 'vercel_blob' ? 'Vercel Blob' : 'Local disk'}</div>
          </div>
          <div className="rounded-xl border border-slate-900/[0.08] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Link2 className="w-3.5 h-3.5 text-indigo-600" /> Custom domains
            </div>
            <div className="mt-2 text-sm font-bold text-dv-ink">{config.customDomains.vercelConnected ? 'Vercel API connected' : 'Not connected yet'}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {config.publishing?.mode === 'live' ? 'Attached to each website’s own Vercel project' : 'Available once Vercel publishing is active'}
            </div>
          </div>
        </div>
      )}

      <PublishedSitesRow sites={sites} />

      <div className="rounded-2xl border border-slate-900/[0.08] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-900/[0.08] flex items-center justify-between text-xs">
          <span className="font-semibold text-dv-ink">{sites.length} website{sites.length === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-3 text-slate-500">
            {liveCount} live
            {!showHeader && (
              <button
                type="button"
                onClick={load}
                disabled={loading}
                aria-label="Refresh published websites"
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-dv-ink"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading published websites…
          </div>
        ) : sites.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <Globe className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            No websites have been published yet. Admins publish approved projects from the Publishing console.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">Website</th>
                  <th className="px-4 py-2 font-semibold">Address</th>
                  <th className="px-4 py-2 font-semibold">Custom domain</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/[0.06]">
                {sites.map((site) => (
                  <tr key={site.projectId} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-dv-ink">{site.organizationName}</div>
                      <div className="text-[11px] text-slate-500">{site.seo.title || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={site.url || `/live/${site.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-indigo-700 hover:underline break-all"
                      >
                        {(site.url || `/live/${site.slug}`).replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {site.hosting?.simulated
                          ? 'Simulated (local test, not on Vercel)'
                          : site.hosting?.platform === 'vercel'
                            ? 'Hosted on Vercel'
                            : 'Shared DigiVerse hosting'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {site.customDomain ? (
                        <div>
                          <div className="font-mono text-dv-ink">{site.customDomain}</div>
                          <div className="text-[11px] text-slate-500">{DOMAIN_LABELS[site.domainStatus || ''] || site.domainStatus}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          site.status === 'live'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {site.status === 'live' ? 'Live' : 'Suspended'}
                      </span>
                      {site.seo.noIndex && (
                        <div className="mt-1 text-[10px] text-amber-700">Hidden from search engines</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(site.publishedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
