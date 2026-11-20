import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  PowerOff,
  Clock,
  Hammer,
  FlaskConical,
  PlugZap,
  History,
  Terminal
} from 'lucide-react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import { api } from '../../lib/api';
import type {
  ClientProject,
  DeploymentLogLine,
  DeploymentRecord,
  PublishedSiteSummary,
  PublishingStatus,
  PublishState
} from '../../types/admin';

const DOMAIN_STATUS_LABELS: Record<string, string> = {
  awaiting_vercel_connection: 'Reserved – Vercel not connected yet',
  pending_verification: 'Waiting for DNS verification',
  misconfigured: 'DNS records not pointing to Vercel',
  active: 'Active',
  error: 'Error'
};

const STATE_LABEL: Record<PublishState, string> = {
  not_configured: 'Not configured',
  not_ready: 'Not ready',
  ready_to_publish: 'Ready to publish',
  queued: 'Queued',
  building: 'Building',
  ready: 'Ready',
  failed: 'Failed'
};

const STATE_BADGE: Record<PublishState, 'default' | 'indigo' | 'amber' | 'success' | 'rose' | 'cyan'> = {
  not_configured: 'amber',
  not_ready: 'amber',
  ready_to_publish: 'indigo',
  queued: 'cyan',
  building: 'cyan',
  ready: 'success',
  failed: 'rose'
};

const POLL_MS = 2000;

interface PublishingConsoleProps {
  project: ClientProject;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (updatedProject: ClientProject) => void;
}

function formatWhen(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

const Step: React.FC<{ label: string; state: 'done' | 'active' | 'todo' | 'failed' }> = ({ label, state }) => (
  <div className="flex items-center gap-2 text-xs">
    {state === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
    {state === 'active' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
    {state === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
    {state === 'todo' && <span className="w-4 h-4 rounded-full border border-slate-300 inline-block" />}
    <span className={state === 'todo' ? 'text-slate-400' : 'text-dv-ink font-medium'}>{label}</span>
  </div>
);

export const PublishingConsole: React.FC<PublishingConsoleProps> = ({ project, isOpen, onClose, onProjectUpdated }) => {
  const [status, setStatus] = useState<PublishingStatus | null>(null);
  const [history, setHistory] = useState<DeploymentRecord[]>([]);
  const [site, setSite] = useState<PublishedSiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | 'publish' | 'redeploy' | 'unpublish'>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<{ id: string; simulated: boolean; lines: DeploymentLogLine[] } | null>(null);
  const [logsBusy, setLogsBusy] = useState<string | null>(null);

  const [siteSlug, setSiteSlug] = useState(project.deploymentDetails?.siteSlug || project.tenantSlug || '');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [noIndex, setNoIndex] = useState(false);
  const [customDomain, setCustomDomain] = useState(project.deploymentDetails?.customDomain || '');
  const [domainBusy, setDomainBusy] = useState(false);

  const previousState = useRef<PublishState | null>(null);

  const refresh = useCallback(async (slugOverride?: string, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [next, deployments, published] = await Promise.all([
        api.getPublishingStatus(project.id, slugOverride),
        api.getDeployments(project.id),
        api.getPublishedSite(project.id)
      ]);
      setStatus(next);
      setHistory(deployments.deployments);
      setSite(published);
      if (published) {
        setSeoTitle((current) => current || published.seo.title || '');
        setSeoDescription((current) => current || published.seo.description || '');
        setNoIndex(Boolean(published.seo.noIndex));
        if (published.customDomain) setCustomDomain(published.customDomain);
      }
      return next;
    } catch (err: unknown) {
      if (!quiet) setFeedback({ message: err instanceof Error ? err.message : 'Could not read the publishing status.', isError: true });
      return null;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setConfirmUnpublish(false);
      void refresh();
    }
  }, [isOpen, refresh]);

  // While a deployment is running, keep asking the server for its real state.
  const inProgress = status?.state === 'queued' || status?.state === 'building';
  useEffect(() => {
    if (!isOpen || !inProgress) return;
    const timer = window.setInterval(() => { void refresh(undefined, true); }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [isOpen, inProgress, refresh]);

  // When a deployment finishes, refresh the project so the rest of the studio shows the new status.
  useEffect(() => {
    const current = status?.state ?? null;
    const before = previousState.current;
    previousState.current = current;
    if (before && (before === 'queued' || before === 'building') && (current === 'ready' || current === 'failed' || current === 'ready_to_publish')) {
      api.getProject(project.id).then(onProjectUpdated).catch(() => undefined);
      if (current === 'ready') setFeedback({ message: 'The website is live.' });
      if (current === 'failed') setFeedback({ message: status?.latestDeployment?.errorMessage || 'The deployment failed.', isError: true });
    }
  }, [status, project.id, onProjectUpdated]);

  if (!isOpen) return null;

  const state: PublishState = status?.state ?? 'not_ready';
  // "Simulated" describes the mode in use, or an earlier simulated deployment that is still what is live. Never shown for a plain not-configured setup.
  const simulated = status?.mode === 'mock' || (status?.mode !== 'not_configured' && Boolean(status?.isSimulated));
  const latest = status?.latestDeployment;
  const publishedSlug = site?.slug || project.deploymentDetails?.siteSlug || status?.preflight.siteSlug || project.tenantSlug;
  const canPublish = status?.mode !== 'not_configured' && Boolean(status?.preflight.isReadyToPublish) && !inProgress && !busy;
  const isLive = Boolean(status?.isLive);

  const copyUrl = () => {
    if (!status?.liveUrl) return;
    void navigator.clipboard?.writeText(status.liveUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const runAction = async (kind: 'publish' | 'redeploy' | 'unpublish') => {
    setBusy(kind);
    setFeedback(null);
    setConfirmUnpublish(false);
    try {
      const res =
        kind === 'publish'
          ? await api.publishProject(project.id, {
              siteSlug: siteSlug.trim() || undefined,
              seo: { title: seoTitle.trim() || undefined, description: seoDescription.trim() || undefined, noIndex },
              customDomain: customDomain.trim() && customDomain.trim() !== site?.customDomain ? customDomain.trim() : undefined
            })
          : kind === 'redeploy'
            ? await api.redeployProject(project.id)
            : await api.unpublishProject(project.id, 'Taken offline from the Publishing Console');
      onProjectUpdated(res.project);
      setStatus(res.status);
      // Only report success when the server says the deployment actually succeeded.
      if (res.deployment?.status === 'failed') {
        setFeedback({ message: res.message, isError: true });
      } else if (res.deployment?.status === 'ready') {
        setFeedback({ message: res.message });
      }
      await refresh(undefined, true);
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'The request failed.', isError: true });
      await refresh(undefined, true);
    } finally {
      setBusy(null);
    }
  };

  const showLogs = async (deploymentId: string) => {
    if (logs?.id === deploymentId) { setLogs(null); return; }
    setLogsBusy(deploymentId);
    try {
      const res = await api.getDeploymentLogs(project.id, deploymentId);
      setLogs({ id: deploymentId, ...res });
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Could not read the logs.', isError: true });
    } finally {
      setLogsBusy(null);
    }
  };

  const connectDomain = async () => {
    if (!customDomain.trim()) return;
    setDomainBusy(true);
    setFeedback(null);
    try {
      const res = await api.connectSiteDomain(project.id, customDomain.trim());
      setSite(res.site);
      setFeedback({ message: res.message, isError: res.site.domainStatus === 'error' });
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Failed to connect domain.', isError: true });
    } finally {
      setDomainBusy(false);
    }
  };

  const refreshDomain = async () => {
    setDomainBusy(true);
    try {
      const res = await api.refreshSiteDomain(project.id);
      setSite(res.site);
      setFeedback({ message: res.message, isError: res.site.domainStatus === 'error' });
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Failed to refresh domain status.', isError: true });
    } finally {
      setDomainBusy(false);
    }
  };

  const removeDomain = async () => {
    setDomainBusy(true);
    try {
      const res = await api.removeSiteDomain(project.id);
      setCustomDomain('');
      setFeedback({ message: res.message });
      await refresh(undefined, true);
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Failed to remove domain.', isError: true });
    } finally {
      setDomainBusy(false);
    }
  };

  const stepState = (step: 'queued' | 'building' | 'ready'): 'done' | 'active' | 'todo' | 'failed' => {
    if (state === 'failed') {
      if (step === 'queued') return 'done';
      return latest?.status === 'failed' ? (step === 'building' ? 'failed' : 'todo') : 'todo';
    }
    if (state === 'ready') return 'done';
    if (state === 'queued') return step === 'queued' ? 'active' : 'todo';
    if (state === 'building') return step === 'queued' ? 'done' : step === 'building' ? 'active' : 'todo';
    return 'todo';
  };

  const primaryLabel = isLive ? 'Publish Update' : state === 'failed' ? 'Try Again' : 'Publish Website';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dv-ink/40 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Publishing Console">
      <div className="bg-[#F7F9FC] border border-indigo-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-900/[0.08] bg-[#FBFCFE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-lg border ${
              state === 'ready' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/[0.36]' : 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-500/[0.36]'
            }`}>
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-dv-ink tracking-tight">Publishing Console</h3>
                <Badge variant={STATE_BADGE[state]} dot>{STATE_LABEL[state]}</Badge>
                {simulated && <Badge variant="amber">Simulated</Badge>}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {project.requirements.organizationName} · <span className="font-mono text-indigo-700">{publishedSlug}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-900/[0.028] border border-slate-900/[0.08] hover:bg-slate-900/[0.055] text-slate-600 transition-colors"
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-900/[0.055] text-slate-500 hover:text-dv-ink transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.isError ? 'bg-red-50 border-red-500/40 text-red-700' : 'bg-emerald-50 border-emerald-500/40 text-emerald-700'
          }`} role={feedback.isError ? 'alert' : 'status'}>
            <div className="flex items-center gap-2">
              {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100" aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {loading && !status ? (
            <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Checking publishing status…</span>
            </div>
          ) : (
            <>
              {/* Mode banners */}
              {status?.mode === 'not_configured' && (
                <div className="p-4 rounded-xl border border-amber-600/40 bg-amber-50 text-xs space-y-1">
                  <div className="font-bold text-amber-700 flex items-center gap-2"><PlugZap className="w-4 h-4" />Vercel setup pending</div>
                  <p className="text-slate-600">
                    Publishing is switched off until the DigiVerse Vercel credentials are added to the server. Every other part of DigiVerse works normally.
                    The activation steps are in <span className="font-mono">docs/deployment/VERCEL.md</span>.
                  </p>
                </div>
              )}
              {status?.mode === 'mock' && (
                <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50 text-xs space-y-1">
                  <div className="font-bold text-indigo-700 flex items-center gap-2"><FlaskConical className="w-4 h-4" />Simulated publishing (local test mode)</div>
                  <p className="text-slate-600">
                    This only rehearses the workflow on this computer. <strong>Nothing is deployed to Vercel</strong> and the address below is not a Vercel address.
                  </p>
                </div>
              )}

              {/* Status card */}
              {(inProgress || state === 'failed' || state === 'ready') && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  state === 'ready' ? 'border-emerald-500/40 bg-emerald-50' : state === 'failed' ? 'border-red-500/40 bg-red-50' : 'border-indigo-300 bg-indigo-50'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      state === 'ready' ? 'text-emerald-700' : state === 'failed' ? 'text-red-700' : 'text-indigo-700'
                    }`}>
                      {state === 'ready' ? (simulated ? 'Simulated site is ready' : 'Website is live') : state === 'failed' ? 'Deployment failed' : 'Deployment in progress'}
                    </span>
                    {latest && <span className="text-[11px] text-slate-500">{formatWhen(latest.createdAt)}</span>}
                  </div>

                  {state !== 'ready' && (
                    <div className="grid grid-cols-3 gap-2">
                      <Step label="Queued" state={stepState('queued')} />
                      <Step label="Building" state={stepState('building')} />
                      <Step label="Ready" state={stepState('ready')} />
                    </div>
                  )}

                  {state === 'failed' && (
                    <div className="text-xs text-red-700 space-y-1">
                      <p>{latest?.errorMessage || 'The deployment failed.'}</p>
                      {status?.previousVersionLive && <p className="text-slate-600">The previous version of the website is still live.</p>}
                      {latest?.errorCode && <p className="font-mono text-[11px] text-slate-500">{latest.errorCode}</p>}
                    </div>
                  )}

                  {status?.liveUrl && state !== 'queued' && state !== 'building' && (
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-900/[0.08]">
                      <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono text-xs text-dv-ink truncate flex-1" data-testid="live-url">{status.liveUrl}</span>
                      <button onClick={copyUrl} className="p-1.5 rounded bg-slate-900/[0.028] hover:bg-slate-900/[0.055] text-slate-600 hover:text-dv-ink transition-colors" title="Copy URL" aria-label="Copy URL">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={status.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow transition-colors">
                        <span>Visit</span><ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {state === 'ready' && (
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                      <span>Updated: <strong className="text-slate-700">{formatWhen(latest?.readyAt || latest?.createdAt) || 'Recent'}</strong></span>
                      <span>Hosting: <strong className="text-slate-700">{simulated ? 'Simulated (this computer)' : 'Vercel (DigiVerse team)'}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {state === 'ready_to_publish' && !isLive && (
                <div className="p-4 rounded-xl border border-slate-900/[0.08] bg-[#FCFCFE] text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{latest?.kind === 'offline' ? 'The website was taken offline. Publish it again whenever you are ready.' : 'All technical checks passed. Publish the website when you are ready.'}</span>
                </div>
              )}

              {/* Blockers (technical only) */}
              {status && !status.preflight.isReadyToPublish && (
                <div className="p-4 rounded-xl border border-amber-600/40 bg-amber-50 text-xs space-y-2">
                  <div className="font-bold text-amber-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Cannot publish yet</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                    {status.preflight.blockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}

              {/* Site address and SEO */}
              <div className="p-4 rounded-xl border border-slate-900/[0.08] bg-[#FCFCFE] space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-dv-ink uppercase tracking-wider">Site address &amp; search settings</h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Each client website is deployed on its own with its own content, branding and address.
                  </p>
                </div>
                <div>
                  <label htmlFor="pc-slug" className="block text-xs font-semibold text-slate-600 mb-1">Site name</label>
                  <div className="flex items-center rounded-lg border border-slate-900/[0.08] bg-white focus-within:border-indigo-500">
                    <input
                      id="pc-slug"
                      type="text"
                      value={siteSlug}
                      onChange={(e) => setSiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      onBlur={() => void refresh(siteSlug, true)}
                      placeholder="organization-name"
                      maxLength={63}
                      disabled={isLive}
                      className="w-full bg-transparent px-3 py-2 text-xs font-mono text-dv-ink focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isLive ? 'The site name is fixed once published.' : 'Lowercase letters, numbers and hyphens. Must be unique.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pc-title" className="block text-xs font-semibold text-slate-600 mb-1">Search title</label>
                    <input id="pc-title" type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={project.requirements.organizationName} maxLength={120}
                      className="w-full bg-white border border-slate-900/[0.08] rounded-lg px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs text-slate-600 pb-2">
                      <input type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} className="rounded border-slate-300" />
                      Hide from search engines
                    </label>
                  </div>
                </div>
                <div>
                  <label htmlFor="pc-desc" className="block text-xs font-semibold text-slate-600 mb-1">Search description</label>
                  <textarea id="pc-desc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder={project.requirements.tagline || 'Short description shown in search results.'} maxLength={320} rows={2}
                    className="w-full bg-white border border-slate-900/[0.08] rounded-lg px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Custom domain */}
              <div className="p-4 rounded-xl border border-slate-900/[0.08] bg-[#FCFCFE] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-dv-ink uppercase tracking-wider">Custom domain (optional)</h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    A domain the client owns, e.g. <span className="font-mono">www.organization.org</span>. It is attached to this website's own Vercel project
                    {status?.mode === 'live' ? '.' : ' once Vercel publishing is active; until then it is only reserved here.'}
                    {!site && ' Publish the website first.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="www.organization.org" aria-label="Custom domain"
                    disabled={!site || domainBusy}
                    className="flex-1 bg-white border border-slate-900/[0.08] rounded-lg px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                  <Button size="sm" variant="secondary" disabled={!site || domainBusy || !customDomain.trim() || customDomain.trim() === site?.customDomain} onClick={connectDomain} className="text-xs">
                    {domainBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
                {site?.customDomain && (
                  <div className="rounded-lg border border-slate-900/[0.08] bg-white p-3 text-[11px] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-dv-ink">{site.customDomain}</span>
                      <Badge variant={site.domainStatus === 'active' ? 'success' : 'default'}>{DOMAIN_STATUS_LABELS[site.domainStatus || ''] || site.domainStatus}</Badge>
                    </div>
                    {site.domainDetails?.message && <p className="text-slate-500">{site.domainDetails.message}</p>}
                    {site.domainDetails?.verification?.length ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-600">Add this DNS record at the domain registrar:</div>
                        {site.domainDetails.verification.map((v, i) => (
                          <div key={i} className="font-mono text-slate-600 break-all">{v.type} {v.domain} → {v.value}</div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" disabled={domainBusy} onClick={refreshDomain} className="text-[11px] h-7">Check status</Button>
                      <Button size="sm" variant="outline" disabled={domainBusy} onClick={removeDomain} className="text-[11px] h-7 text-red-600 border-red-200">Disconnect</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deployment history */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-dv-ink uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />Deployment history
                </h4>
                {history.length === 0 ? (
                  <p className="text-[11px] text-slate-500 p-3 rounded-xl border border-slate-900/[0.08] bg-[#FCFCFE]">No deployments yet.</p>
                ) : (
                  <ul className="rounded-xl border border-slate-900/[0.08] bg-[#FCFCFE] divide-y divide-slate-900/[0.08] text-xs">
                    {history.slice(0, 10).map((d) => (
                      <li key={d.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {d.status === 'ready' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              : d.status === 'failed' || d.status === 'canceled' ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              : d.status === 'building' ? <Hammer className="w-4 h-4 text-indigo-600 shrink-0" />
                              : <Clock className="w-4 h-4 text-indigo-600 shrink-0" />}
                            <span className="font-semibold text-dv-ink">{d.kind === 'offline' ? 'Taken offline' : 'Publish'}</span>
                            <Badge variant={d.status === 'ready' ? 'success' : d.status === 'failed' || d.status === 'canceled' ? 'rose' : 'cyan'}>{d.status}</Badge>
                            {d.isSimulated && <Badge variant="amber">Simulated</Badge>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500">
                            <span>{formatWhen(d.createdAt)}</span>
                            <button onClick={() => void showLogs(d.id)} className="p-1 rounded hover:bg-slate-900/[0.055] text-slate-500" title="Logs" aria-label="Show logs">
                              {logsBusy === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        {d.errorMessage && <p className="text-[11px] text-red-700">{d.errorMessage}</p>}
                        {logs?.id === d.id && (
                          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
                            {logs.lines.length === 0 ? 'No log output is available for this deployment.' : logs.lines.map((l) => l.text).join('\n')}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-900/[0.08] bg-[#F6F7FB] flex items-center justify-between gap-2 flex-wrap">
          <div>
            {isLive && !inProgress && (
              confirmUnpublish ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Take the website offline?</span>
                  <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void runAction('unpublish')} className="border-red-200 text-red-600 hover:bg-red-50 text-xs">
                    {busy === 'unpublish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, unpublish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmUnpublish(false)} className="text-xs">Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => setConfirmUnpublish(true)} className="border-red-200 text-red-600 hover:bg-red-50 text-xs flex items-center gap-1.5">
                  <PowerOff className="w-3.5 h-3.5" /><span>Unpublish</span>
                </Button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>Close</Button>
            {isLive && !inProgress && (
              <Button size="sm" variant="outline" disabled={!canPublish} onClick={() => void runAction('redeploy')} className="text-xs flex items-center gap-1.5">
                {busy === 'redeploy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Redeploy</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              disabled={!canPublish}
              onClick={() => void runAction('publish')}
              title={status?.mode === 'not_configured' ? 'Vercel setup is pending' : undefined}
              className={`text-xs font-semibold flex items-center gap-2 ${canPublish ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
            >
              {busy === 'publish' || inProgress ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>{inProgress ? (state === 'queued' ? 'Queued…' : 'Building…') : 'Publishing…'}</span></>
              ) : (
                <><Rocket className="w-4 h-4" /><span>{primaryLabel}</span></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
