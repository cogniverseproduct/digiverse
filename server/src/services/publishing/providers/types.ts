import type {
  DeploymentKind,
  DeploymentProviderName,
  DeploymentStatus,
  SiteDeployment,
  SiteHosting
} from '../../../db/siteDeploymentRepository.js';
import type { ExportedSite } from '../siteExporter.js';

export interface ProviderLogLine {
  type: string;
  level?: string;
  text: string;
  createdAt?: number;
}

export interface EnsureHostingInput {
  projectId: string;
  siteSlug: string;
  existing: SiteHosting | null;
  /** Public origin of this DigiVerse server (used by the mock provider's local URL). */
  origin?: string;
}

export interface DeployInput {
  projectId: string;
  siteSlug: string;
  kind: DeploymentKind;
  hosting: SiteHosting;
  site: ExportedSite;
  revisionId?: string;
}

export interface DeployResult {
  providerDeploymentId: string;
  status: DeploymentStatus;
  url?: string;
  inspectorUrl?: string;
  /** Set when the provider had to create a fresh hosting project (e.g. the old one was deleted). */
  hosting?: SiteHosting;
}

export interface DeploymentState {
  status: DeploymentStatus;
  /** Public production URL once ready. */
  url?: string;
  inspectorUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export class PublishingProviderError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PublishingProviderError';
    this.code = code;
  }
}

/** One implementation per hosting backend. The service never talks to Vercel directly. */
export interface DeploymentProvider {
  readonly name: DeploymentProviderName;
  ensureHosting(input: EnsureHostingInput): Promise<SiteHosting>;
  deploy(input: DeployInput): Promise<DeployResult>;
  getState(deployment: SiteDeployment, hosting: SiteHosting | null): Promise<DeploymentState>;
  getLogs(deployment: SiteDeployment, hosting: SiteHosting | null): Promise<ProviderLogLine[]>;
  /** Best effort removal of the client's hosting project (used when a DigiVerse project is deleted). */
  releaseHosting(hosting: SiteHosting): Promise<void>;
  /** The provider-side project id that custom domains attach to, if any. */
  domainProjectId(hosting: SiteHosting | null): string | undefined;
}
