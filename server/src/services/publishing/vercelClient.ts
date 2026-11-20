/**
 * Minimal, typed client for the parts of the official Vercel REST API that
 * centralized publishing needs. It runs ONLY on the server.
 *
 * Endpoints (verified against https://vercel.com/docs/rest-api on 2026-11-19):
 *   POST   /v11/projects                      create the client's project
 *   GET    /v9/projects/{idOrName}            read a project
 *   DELETE /v9/projects/{idOrName}            remove a project
 *   POST   /v2/files                          upload a file by SHA1 digest
 *   POST   /v13/deployments                   create a deployment
 *   GET    /v13/deployments/{id}              read a deployment (readyState)
 *   GET    /v3/deployments/{id}/events        build/runtime log events
 *   GET    /v2/user, GET /v2/teams/{teamId}   credential validation
 *
 * NOT exercised against the real Vercel API in this repository (no account is
 * connected); unit tests drive it with a mocked fetch. Two behaviours are not
 * documented and are handled defensively: the "missing files" error shape when
 * a referenced file has not been uploaded, and the upload response body.
 *
 * Security: the token is held in a private field, only ever sent in the
 * Authorization header, and is scrubbed from every error message and log line
 * this module produces.
 */

import { createHash } from 'node:crypto';

const VERCEL_API = 'https://api.vercel.com';

export type VercelErrorCode =
  | 'VERCEL_AUTH'
  | 'VERCEL_NOT_FOUND'
  | 'VERCEL_CONFLICT'
  | 'VERCEL_RATE_LIMITED'
  | 'VERCEL_UNAVAILABLE'
  | 'VERCEL_NETWORK'
  | 'VERCEL_INVALID_REQUEST'
  | 'VERCEL_MISSING_FILES'
  | 'VERCEL_PLAN_LIMIT'
  | 'VERCEL_UNKNOWN';

export class VercelApiError extends Error {
  readonly code: VercelErrorCode;
  readonly status?: number;
  /** SHA1 digests Vercel says it does not have yet (VERCEL_MISSING_FILES only). */
  readonly missing?: string[];

  constructor(code: VercelErrorCode, message: string, status?: number, missing?: string[]) {
    super(message);
    this.name = 'VercelApiError';
    this.code = code;
    this.status = status;
    this.missing = missing;
  }
}

export type VercelReadyState =
  | 'QUEUED' | 'INITIALIZING' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'BLOCKED';

export interface VercelDeploymentInfo {
  id: string;
  url?: string;
  readyState: VercelReadyState;
  alias: string[];
  inspectorUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  target?: string | null;
}

export interface VercelProjectInfo {
  id: string;
  name: string;
}

export interface VercelLogLine {
  type: string;
  level?: string;
  text: string;
  createdAt?: number;
}

/** A file reference (already uploaded by digest) or an inline file (small generated files). */
export type DeploymentFileInput =
  | { file: string; sha: string; size: number }
  | { file: string; data: string; encoding: 'base64' };

export interface VercelClientOptions {
  token: string;
  teamId?: string;
  /** Per-request timeout. */
  timeoutMs?: number;
  /** Retries for 429 and 5xx responses. */
  retries?: number;
  /** Delay used between retries (tests set 0). */
  retryDelayMs?: number;
}

export function sha1Hex(data: Buffer | string): string {
  return createHash('sha1').update(data).digest('hex');
}

/** Removes anything that looks like a credential before text is stored or returned. */
export function scrubSecrets(text: string, token?: string): string {
  let out = String(text ?? '');
  if (token && token.length >= 8) out = out.split(token).join('[redacted]');
  return out
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [redacted]')
    .replace(/\bvercel_[A-Za-z0-9_]{16,}\b/gi, '[redacted]');
}

function safeMessage(value: unknown, token: string): string {
  const raw = typeof value === 'string' ? value : '';
  return scrubSecrets(raw, token).replace(/\s+/g, ' ').trim().slice(0, 300);
}

export function mapReadyState(state: VercelReadyState | string): 'queued' | 'building' | 'ready' | 'failed' | 'canceled' {
  switch (state) {
    case 'READY': return 'ready';
    case 'ERROR':
    case 'BLOCKED': return 'failed';
    case 'CANCELED': return 'canceled';
    case 'QUEUED': return 'queued';
    default: return 'building'; // INITIALIZING, BUILDING and any state added later
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class VercelClient {
  readonly #token: string;
  readonly #teamId?: string;
  readonly #timeoutMs: number;
  readonly #retries: number;
  readonly #retryDelayMs: number;

  constructor(options: VercelClientOptions) {
    if (!options.token) {
      throw new VercelApiError('VERCEL_AUTH', 'No Vercel token is configured.');
    }
    this.#token = options.token;
    this.#teamId = options.teamId;
    this.#timeoutMs = options.timeoutMs ?? 25_000;
    this.#retries = options.retries ?? 2;
    this.#retryDelayMs = options.retryDelayMs ?? 400;
  }

  /** Never serialise the token: JSON.stringify(client) and util.inspect show nothing sensitive. */
  toJSON(): { teamId?: string } {
    return { teamId: this.#teamId };
  }

  #url(path: string, query: Record<string, string | number | undefined> = {}): string {
    const params = new URLSearchParams();
    if (this.#teamId) params.set('teamId', this.#teamId);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    return `${VERCEL_API}${path}${qs ? `?${qs}` : ''}`;
  }

  async #request(
    method: string,
    path: string,
    options: {
      query?: Record<string, string | number | undefined>;
      json?: unknown;
      raw?: { body: Buffer; headers: Record<string, string> };
    } = {}
  ): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.#token}` };
    let body: Uint8Array | string | undefined;

    if (options.raw) {
      Object.assign(headers, options.raw.headers);
      body = new Uint8Array(options.raw.body);
    } else if (options.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.json);
    }

    let lastError: VercelApiError | undefined;

    for (let attempt = 0; attempt <= this.#retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

      try {
        const response = await fetch(this.#url(path, options.query), {
          method,
          headers,
          body,
          signal: controller.signal
        });
        clearTimeout(timer);

        const text = await response.text().catch(() => '');
        let data: any = {};
        if (text) {
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
        }

        if (response.ok) {
          return { status: response.status, data };
        }

        const error = this.#mapError(response.status, data);
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < this.#retries) {
          lastError = error;
          const retryAfter = Number(response.headers?.get?.('retry-after'));
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 5000)
            : this.#retryDelayMs * (attempt + 1));
          continue;
        }
        throw error;
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof VercelApiError) throw error;
        const aborted = (error as any)?.name === 'AbortError';
        lastError = new VercelApiError(
          'VERCEL_NETWORK',
          aborted ? 'Vercel did not respond in time.' : 'Could not reach the Vercel API.'
        );
        if (attempt < this.#retries) {
          await sleep(this.#retryDelayMs * (attempt + 1));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new VercelApiError('VERCEL_UNKNOWN', 'Unexpected Vercel client failure.');
  }

  #mapError(status: number, data: any): VercelApiError {
    const apiError = data?.error || {};
    const apiCode = typeof apiError.code === 'string' ? apiError.code : '';
    const message = safeMessage(apiError.message || data?.message, this.#token);

    // Documented behaviour is unclear: accept the common spellings of the "files not uploaded" error.
    if (apiCode === 'missing_files' || /missing[_ ]files/i.test(message)) {
      const list = Array.isArray(apiError.missing) ? apiError.missing
        : Array.isArray(data?.missing) ? data.missing : undefined;
      const missing = Array.isArray(list)
        ? list.map((item: unknown) => (typeof item === 'string' ? item : (item as any)?.sha)).filter((v: unknown): v is string => typeof v === 'string')
        : undefined;
      return new VercelApiError('VERCEL_MISSING_FILES', message || 'Some files have not been uploaded.', status, missing);
    }

    if (status === 401 || status === 403) {
      return new VercelApiError('VERCEL_AUTH', message || 'Vercel rejected the credentials or the permissions are insufficient.', status);
    }
    if (status === 404) return new VercelApiError('VERCEL_NOT_FOUND', message || 'Vercel could not find the requested resource.', status);
    if (status === 409) return new VercelApiError('VERCEL_CONFLICT', message || 'Vercel reported a conflict.', status);
    if (status === 429) return new VercelApiError('VERCEL_RATE_LIMITED', message || 'Vercel rate limit reached. Try again shortly.', status);
    if (status >= 500) return new VercelApiError('VERCEL_UNAVAILABLE', message || 'Vercel is temporarily unavailable.', status);
    if (/limit|quota|upgrade|plan/i.test(`${apiCode} ${message}`)) {
      return new VercelApiError('VERCEL_PLAN_LIMIT', message || 'A Vercel plan limit was reached.', status);
    }
    if (status === 400) return new VercelApiError('VERCEL_INVALID_REQUEST', message || 'Vercel rejected the request.', status);
    return new VercelApiError('VERCEL_UNKNOWN', message || `Vercel returned HTTP ${status}.`, status);
  }

  /** Read-only credential check used by the production validation step. */
  async verifyAccess(): Promise<{ tokenValid: boolean; username?: string; team?: { id: string; name?: string; slug?: string } }> {
    const user = await this.#request('GET', '/v2/user');
    const info = user.data?.user || {};
    const result: { tokenValid: boolean; username?: string; team?: { id: string; name?: string; slug?: string } } = {
      tokenValid: true,
      username: typeof info.username === 'string' ? info.username : undefined
    };
    if (this.#teamId) {
      const team = await this.#request('GET', `/v2/teams/${encodeURIComponent(this.#teamId)}`);
      result.team = {
        id: String(team.data?.id || this.#teamId),
        name: typeof team.data?.name === 'string' ? team.data.name : undefined,
        slug: typeof team.data?.slug === 'string' ? team.data.slug : undefined
      };
    }
    return result;
  }

  async createProject(name: string): Promise<VercelProjectInfo> {
    const body: Record<string, unknown> = { name, framework: null, ssoProtection: null };
    let response: { status: number; data: any };
    try {
      response = await this.#request('POST', '/v11/projects', { json: body });
    } catch (error) {
      // Some plans reject the ssoProtection field; retry without it rather than failing the publish.
      if (error instanceof VercelApiError && error.code === 'VERCEL_INVALID_REQUEST') {
        const { ssoProtection: _omit, ...fallback } = body;
        response = await this.#request('POST', '/v11/projects', { json: fallback });
      } else {
        throw error;
      }
    }
    const id = response.data?.id;
    if (typeof id !== 'string' || !id) {
      throw new VercelApiError('VERCEL_UNKNOWN', 'Vercel did not return a project id.');
    }
    return { id, name: String(response.data?.name || name) };
  }

  async getProject(idOrName: string): Promise<VercelProjectInfo | null> {
    try {
      const { data } = await this.#request('GET', `/v9/projects/${encodeURIComponent(idOrName)}`);
      return typeof data?.id === 'string' ? { id: data.id, name: String(data.name || idOrName) } : null;
    } catch (error) {
      if (error instanceof VercelApiError && error.code === 'VERCEL_NOT_FOUND') return null;
      throw error;
    }
  }

  async deleteProject(idOrName: string): Promise<void> {
    try {
      await this.#request('DELETE', `/v9/projects/${encodeURIComponent(idOrName)}`);
    } catch (error) {
      if (error instanceof VercelApiError && error.code === 'VERCEL_NOT_FOUND') return;
      throw error;
    }
  }

  async uploadFile(sha: string, content: Buffer): Promise<void> {
    await this.#request('POST', '/v2/files', {
      raw: {
        body: content,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(content.length),
          'x-vercel-digest': sha
        }
      }
    });
  }

  async createDeployment(input: {
    name: string;
    projectId: string;
    files: DeploymentFileInput[];
    target?: 'production';
    meta?: Record<string, string>;
  }): Promise<VercelDeploymentInfo> {
    const { data } = await this.#request('POST', '/v13/deployments', {
      query: { skipAutoDetectionConfirmation: 1 },
      json: {
        name: input.name,
        project: input.projectId,
        target: input.target || 'production',
        files: input.files,
        // Required for the first deployment of a project: a static site with no build step.
        projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null },
        meta: input.meta
      }
    });
    return this.#mapDeployment(data);
  }

  async getDeployment(idOrUrl: string): Promise<VercelDeploymentInfo> {
    const { data } = await this.#request('GET', `/v13/deployments/${encodeURIComponent(idOrUrl)}`);
    return this.#mapDeployment(data);
  }

  /** Build and system log lines, trimmed and scrubbed. Failures return an empty list, never throw. */
  async getDeploymentLogs(idOrUrl: string, limit = 200): Promise<VercelLogLine[]> {
    try {
      const { data } = await this.#request('GET', `/v3/deployments/${encodeURIComponent(idOrUrl)}/events`, {
        query: { limit, direction: 'forward' }
      });
      const events: any[] = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
      const allowed = new Set(['stdout', 'stderr', 'command', 'deployment-state', 'fatal', 'exit']);
      return events
        .filter((event) => allowed.has(String(event?.type)))
        .map((event) => ({
          type: String(event.type),
          level: typeof event.payload?.level === 'string' ? event.payload.level : (typeof event.level === 'string' ? event.level : undefined),
          text: safeMessage(event.payload?.text ?? event.text ?? event.payload?.info?.readyState ?? '', this.#token).slice(0, 500),
          createdAt: typeof event.created === 'number' ? event.created : (typeof event.createdAt === 'number' ? event.createdAt : undefined)
        }))
        .filter((line) => line.text);
    } catch {
      return [];
    }
  }

  #mapDeployment(data: any): VercelDeploymentInfo {
    const id = data?.id;
    if (typeof id !== 'string' || !id) {
      throw new VercelApiError('VERCEL_UNKNOWN', 'Vercel did not return a deployment id.');
    }
    const readyState = String(data.readyState || data.status || 'QUEUED').toUpperCase() as VercelReadyState;
    return {
      id,
      url: typeof data.url === 'string' && data.url ? data.url : undefined,
      readyState,
      alias: Array.isArray(data.alias) ? data.alias.filter((a: unknown): a is string => typeof a === 'string') : [],
      inspectorUrl: typeof data.inspectorUrl === 'string' ? data.inspectorUrl : undefined,
      errorCode: typeof data.errorCode === 'string' ? data.errorCode : undefined,
      errorMessage: safeMessage(data.errorMessage, this.#token) || undefined,
      target: data.target ?? null
    };
  }
}
