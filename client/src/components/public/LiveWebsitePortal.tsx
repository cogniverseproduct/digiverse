import React, { useState, useEffect } from 'react';
import { Globe, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api, type LiveWebsitePayload } from '../../lib/api';
import { TenantWebsiteRenderer } from '../admin/TenantWebsiteRenderer';
import { Button } from '../ui/Button';
import type { SiteSeoSettings } from '../../types/admin';
import { publicSiteRequirements } from '../../lib/publicSiteRequirements';

interface LiveWebsitePortalProps {
  /** Path routing: /live/<slug> on the DigiVerse app. */
  slug?: string;
  /** Host routing: <slug>.<root-domain> or a client's custom domain. */
  host?: string;
  onBackToHome?: () => void;
}

/**
 * Applies a published site's own SEO settings to the document head while it
 * is displayed, and restores the DigiVerse defaults afterwards. (On Vercel
 * the same tags are also injected server-side for crawlers; see
 * server/src/routes/render.ts.)
 */
function useSiteHead(seo: SiteSeoSettings | undefined, fallbackTitle: string | undefined) {
  useEffect(() => {
    if (!fallbackTitle) return;

    const previousTitle = document.title;
    const created: HTMLElement[] = [];
    const changed: Array<{ el: Element; attr: string; value: string | null }> = [];

    const setMeta = (selector: string, attrs: Record<string, string>, content: string | undefined) => {
      if (!content) return;
      let el = document.head.querySelector(selector);
      if (el) {
        changed.push({ el, attr: 'content', value: el.getAttribute('content') });
      } else {
        el = document.createElement('meta');
        Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
        document.head.appendChild(el);
        created.push(el as HTMLElement);
      }
      el.setAttribute('content', content);
    };

    const title = seo?.title || fallbackTitle;
    document.title = title;
    setMeta('meta[name="description"]', { name: 'description' }, seo?.description);
    setMeta('meta[name="robots"]', { name: 'robots' }, seo?.noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, seo?.description);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, seo?.ogImageUrl);

    if (seo?.canonicalUrl) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = seo.canonicalUrl;
      document.head.appendChild(link);
      created.push(link);
    }

    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      changed.forEach(({ el, attr, value }) => {
        if (value === null) el.removeAttribute(attr);
        else el.setAttribute(attr, value);
      });
    };
  }, [seo, fallbackTitle]);
}

export const LiveWebsitePortal: React.FC<LiveWebsitePortalProps> = ({
  slug,
  host,
  onBackToHome
}) => {
  const [data, setData] = useState<LiveWebsitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const label = host || slug || '';

  useSiteHead(data?.seo, data?.organizationName);

  useEffect(() => {
    let isMounted = true;
    const loadSite = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = host
          ? await api.getLiveWebsiteByHost(host)
          : await api.getLiveWebsite(slug || '');
        if (isMounted) {
          setData(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Website is unavailable.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSite();
    return () => {
      isMounted = false;
    };
  }, [slug, host]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-4 animate-pulse">
          <Globe className="w-6 h-6 text-emerald-200" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Loading website…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#0D1424] border border-red-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Website Unavailable</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {error || `The website '${label}' is not published at the moment.`}
            </p>
          </div>
          {onBackToHome && (
            <div className="pt-2">
              <Button size="sm" variant="secondary" onClick={onBackToHome} className="inline-flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to DigiVerse Home</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderer = (
    <TenantWebsiteRenderer
      requirements={publicSiteRequirements(data)}
      website={data.generatedWebsite}
      inBrowserFrame={false}
    />
  );

  // On a client's own domain/subdomain the website stands alone.
  if (host) {
    return <div className="min-h-screen flex flex-col">{renderer}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      {/* Thin DigiVerse bar, shown only on the /live/<slug> path */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-emerald-900/40 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-white tracking-wide uppercase text-[11px] truncate">
            {data.organizationName}
          </span>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px] flex items-center gap-1 shrink-0"
          >
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Built with DigiVerse</span>
          </button>
        )}
      </header>

      <main className="flex-1">{renderer}</main>
    </div>
  );
};
